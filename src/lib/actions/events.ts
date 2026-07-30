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
        message: "РЎСЉР±РёС‚РёРµС‚Рѕ РЅРµ Рµ РѕС‚РєСЂРёС‚Рѕ.",
      };
    }

    const eventData = eventSnap.data();
    if (!eventData) {
      return {
        success: false,
        message: "РќРµРІР°Р»РёРґРЅРё РґР°РЅРЅРё Р·Р° СЃСЉР±РёС‚РёРµС‚Рѕ.",
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

    // Generate the month label (e.g., "РњР°Р№ 2026") AND month key (e.g., "2026-05")
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
                | "subscription"
                | "individual",
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
      message: "Р’СЉР·РЅРёРєРЅР° РіСЂРµС€РєР° РїСЂРё РѕР±РЅРѕРІСЏРІР°РЅРµ.",
    };
  }
}
