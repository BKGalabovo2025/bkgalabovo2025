"use server";
import "server-only";

import { format, getYear } from "date-fns";
import { bg } from "date-fns/locale";
import { revalidatePath } from "next/cache";

import { ensureAdmin } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";
import { serverCache } from "@/lib/server-cache";
import { Attendee } from "@/types";

function invalidateClubScheduleCaches() {
  serverCache.invalidate("club:public-data");
  revalidatePath("/club");
  revalidatePath("/club/schedule");
  revalidatePath("/club/team");
}

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
    await ensureAdmin(idToken);
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

    invalidateClubScheduleCaches();
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
    await ensureAdmin(idToken);
    const db = getAdminDb();
    const ref = await db.collection("events").add({
      ...eventData,
      createdAt: new Date().toISOString(),
    });
    invalidateClubScheduleCaches();
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
    await ensureAdmin(idToken);
    const db = getAdminDb();
    await db
      .collection("events")
      .doc(eventId)
      .update({
        ...eventData,
        updatedAt: new Date().toISOString(),
      });
    invalidateClubScheduleCaches();
    return { success: true, message: "Събитието е обновено успешно." };
  } catch (err) {
    console.error("updateEventAction Error:", err);
    return { success: false, message: "Грешка при обновяване на събитие." };
  }
}

export async function deleteEventAction(idToken: string, eventId: string) {
  try {
    await ensureAdmin(idToken);
    const db = getAdminDb();

    // Проверка за обвързана командировка в модул „Счетоводство“
    const linkedTripsSnap = await db
      .collection("business_trips")
      .where("eventId", "==", eventId)
      .limit(1)
      .get();
    if (!linkedTripsSnap.empty) {
      const tripData = linkedTripsSnap.docs[0].data() as {
        orderNumber?: number;
        title?: string;
      };
      const orderLabel = tripData.orderNumber
        ? `Заповед № ${tripData.orderNumber}`
        : tripData.title || "командировка";
      return {
        success: false,
        blockedByTrip: true,
        message: `Събитието не може да бъде изтрито, защото е обвързано със счетоводна документация (${orderLabel}).`,
      };
    }

    await db.collection("events").doc(eventId).delete();
    invalidateClubScheduleCaches();
    return { success: true, message: "Събитието е изтрито успешно." };
  } catch (err) {
    console.error("deleteEventAction Error:", err);
    return { success: false, message: "Грешка при изтриване на събитие." };
  }
}

/**
 * Извлича детайлите на събитие от графика за Shadow синхронизация.
 */
export async function getScheduleEventByIdAction(
  eventId: string,
  idToken?: string
) {
  try {
    await ensureAdmin(idToken);
    const db = getAdminDb();
    const docSnap = await db.collection("events").doc(eventId).get();
    if (!docSnap.exists) {
      return {
        success: false,
        message: "Събитието не е открито в графика.",
        event: null,
      };
    }
    const data = docSnap.data() || {};
    return {
      success: true,
      event: {
        id: docSnap.id,
        title: (data.title as string) || "Тренировка",
        startDate: (data.startDate as string) || "",
        endDate: (data.endDate as string) || "",
        type: (data.type as string) || "training",
        attendees: Array.isArray(data.attendees)
          ? (data.attendees as Attendee[])
          : [],
        attendeeMemberIds: Array.isArray(data.attendeeMemberIds)
          ? (data.attendeeMemberIds as string[])
          : [],
      },
    };
  } catch (err) {
    console.error("getScheduleEventByIdAction Error:", err);
    return {
      success: false,
      message: "Грешка при извличане на събитие от графика.",
      event: null,
    };
  }
}

/**
 * Валидира присъствията от завършена Shadow тренировка обратно в клубния график.
 */
export async function syncShadowAttendanceToScheduleAction(
  eventId: string,
  presentPlayers: Array<{ id: string; displayName?: string }>,
  idToken?: string
) {
  try {
    await ensureAdmin(idToken);
    const db = getAdminDb();
    const eventRef = db.collection("events").doc(eventId);
    const snap = await eventRef.get();
    if (!snap.exists) {
      return { success: false, message: "Събитието от графика не е открито." };
    }
    const data = snap.data() || {};
    const existingAttendees: Attendee[] = Array.isArray(data.attendees)
      ? [...(data.attendees as Attendee[])]
      : [];

    const memberIdsSet = new Set<string>(
      Array.isArray(data.attendeeMemberIds)
        ? (data.attendeeMemberIds as string[])
        : []
    );

    presentPlayers.forEach((p) => {
      memberIdsSet.add(p.id);
      const existing = existingAttendees.find((a) => a.memberId === p.id);
      if (existing) {
        existing.attended = true;
      } else {
        existingAttendees.push({
          memberId: p.id,
          name: p.displayName || "Състезател",
          attended: true,
        });
      }
    });

    await eventRef.update({
      attendees: existingAttendees,
      attendeeMemberIds: Array.from(memberIdsSet),
      updatedAt: new Date().toISOString(),
    });

    invalidateClubScheduleCaches();
    return {
      success: true,
      message:
        "Присъствията от Shadow тренировката бяха автоматично валидирани в клубния дневник на графика.",
    };
  } catch (err) {
    console.error("syncShadowAttendanceToScheduleAction Error:", err);
    return {
      success: false,
      message: "Грешка при синхронизация на присъствията към графика.",
    };
  }
}
