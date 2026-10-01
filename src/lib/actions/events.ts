"use server";
import "server-only";

import { format, getYear } from "date-fns";
import { bg } from "date-fns/locale";

import { getAuthUser } from "@/lib/auth-utils";
/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/cognitive-complexity */
import { getAdminDb } from "@/lib/firebase-admin";
import { Attendee } from "@/types";

async function findMatchingSaleForAttendee(
  db: import("firebase-admin/firestore").Firestore,
  attendee: Attendee,
  monthLabel: string,
  monthKey: string
) {
  const salesRef = db.collection("sales");
  let matchedSale = null;

  const byLabel = await salesRef
    .where("type", "==", "training_service")
    .where("status", "==", "completed")
    .where("targetMonthLabels", "array-contains", monthLabel)
    .get();

  for (const docSnap of byLabel.docs) {
    const sData = docSnap.data();
    const targetIds =
      sData.memberIdsForAttendance ||
      (sData.memberIdForAttendance
        ? [sData.memberIdForAttendance]
        : sData.memberId
          ? [sData.memberId]
          : []);
    if (targetIds.includes(attendee.memberId)) {
      matchedSale = { id: docSnap.id, ...sData };
      break;
    }
  }

  if (!matchedSale) {
    const byMonth = await salesRef
      .where("type", "==", "training_service")
      .where("status", "==", "completed")
      .where("targetMonths", "array-contains", monthKey)
      .get();

    for (const docSnap of byMonth.docs) {
      const sData = docSnap.data();
      const targetIds =
        sData.memberIdsForAttendance ||
        (sData.memberIdForAttendance
          ? [sData.memberIdForAttendance]
          : sData.memberId
            ? [sData.memberId]
            : []);
      if (targetIds.includes(attendee.memberId)) {
        matchedSale = { id: docSnap.id, ...sData };
        break;
      }
    }
  }

  return matchedSale;
}

/**
 * Updates attendees for an event, automatically checking if any unpaid attendee
 * has a valid monthly subscription covering the event's month, and marking them as paid.
 */
export async function updateAttendeesAction(
  idToken: string,
  eventId: string,
  attendees: Attendee[]
) {
  try {
    await getAuthUser(idToken);
    const db = getAdminDb();

    // Fetch the event to get its date
    const eventRef = db.collection("events").doc(eventId);
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) {
      return {
        success: false,
        message: "Събитието не е открито.",
      };
    }

    const eventData = eventSnap.data();
    if (!eventData) {
      return {
        success: false,
        message: "Невалидни данни за събитието.",
      };
    }

    const eventStartDate = eventData.startDate;
    let d: Date;
    if (eventStartDate && typeof eventStartDate.toDate === "function") {
      d = eventStartDate.toDate();
    } else if (eventStartDate) {
      d = new Date(eventStartDate);
    } else {
      d = new Date();
    }

    // Generate the month label (e.g., "Май 2026") AND month key (e.g., "2026-05")
    const monthLabel =
      format(d, "LLLL", { locale: bg }).charAt(0).toUpperCase() +
      format(d, "LLLL", { locale: bg }).slice(1) +
      " " +
      getYear(d);

    const monthKey = format(d, "yyyy-MM"); // e.g. "2026-05"
    const nowIso = new Date().toISOString();

    // Process attendees and check for active subscriptions
    const updatedAttendees = await Promise.all(
      attendees.map(async (attendee) => {
        // If they are not attending or already paid, return as is
        if (!attendee.attended || attendee.paymentStatus === "paid") {
          return attendee;
        }

        try {
          const matchedSale = await findMatchingSaleForAttendee(
            db,
            attendee,
            monthLabel,
            monthKey
          );

          if (matchedSale) {
            // Found an active subscription covering this month!
            return {
              ...attendee,
              paymentStatus: "paid" as const,
              paymentType: (((matchedSale as Record<string, unknown>)
                .paymentMode as string) || "subscription") as
                "subscription" | "individual",
              paymentDate: nowIso,
              saleId: matchedSale.id,
            };
          }
        } catch (err) {
          console.error(
            "Error checking sales for member %s:",
            attendee.memberId,
            err
          );
        }

        return attendee;
      })
    );

    const attendeeMemberIds = updatedAttendees.map((a) => a.memberId);

    await eventRef.update({
      attendees: updatedAttendees,
      attendeeMemberIds,
    });

    return { success: true, updatedAttendees };
  } catch (error) {
    console.error("Error in updateAttendeesAction:", error);
    return {
      success: false,
      message: "Възникна грешка при обновяване.",
    };
  }
}

export async function getEventsFeedAction(params: {
  siteId: string;
  timeframe?: "today" | "upcoming" | "past" | "all";
}) {
  try {
    const db = getAdminDb();
    const { siteId, timeframe = "all" } = params;
    let eventsQuery = db.collection("events").where("siteId", "==", siteId);

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const startOfTomorrow = new Date(now);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);

    if (timeframe === "today") {
      eventsQuery = eventsQuery
        .where("startDate", ">=", startOfToday.toISOString())
        .where("startDate", "<=", endOfToday.toISOString())
        .orderBy("startDate", "asc");
    } else if (timeframe === "upcoming") {
      eventsQuery = eventsQuery
        .where("startDate", ">=", startOfTomorrow.toISOString())
        .orderBy("startDate", "asc");
    } else if (timeframe === "past") {
      eventsQuery = eventsQuery
        .where("startDate", "<", startOfToday.toISOString())
        .orderBy("startDate", "desc");
    } else {
      eventsQuery = eventsQuery.orderBy("startDate", "desc");
    }

    const snap = await eventsQuery.get();
    const events = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return { success: true, events };
  } catch (error) {
    console.error("getEventsFeedAction Error:", error);
    return { success: false, events: [] };
  }
}

export async function createEventAction(
  idToken: string,
  eventData: Record<string, unknown>
) {
  try {
    await getAuthUser(idToken);
    const db = getAdminDb();
    const ref = await db.collection("events").add({
      ...eventData,
      createdAt: new Date().toISOString(),
    });
    return {
      success: true,
      id: ref.id,
      message: "Събитието е създадено успешно.",
    };
  } catch (err) {
    console.error("createEventAction Error:", err);
    return {
      success: false,
      message: "Грешка при създаване на събитие.",
    };
  }
}

export async function updateEventAction(
  idToken: string,
  eventId: string,
  eventData: Record<string, unknown>
) {
  try {
    await getAuthUser(idToken);
    const db = getAdminDb();
    await db
      .collection("events")
      .doc(eventId)
      .update({
        ...eventData,
        updatedAt: new Date().toISOString(),
      });
    return { success: true, message: "Събитието е обновено успешно." };
  } catch (err) {
    console.error("updateEventAction Error:", err);
    return { success: false, message: "Грешка при обновяване на събитие." };
  }
}

export async function deleteEventAction(idToken: string, eventId: string) {
  try {
    await getAuthUser(idToken);
    const db = getAdminDb();
    await db.collection("events").doc(eventId).delete();
    return { success: true, message: "Събитието е изтрито успешно." };
  } catch (err) {
    console.error("deleteEventAction Error:", err);
    return { success: false, message: "Грешка при изтриване на събитие." };
  }
}
