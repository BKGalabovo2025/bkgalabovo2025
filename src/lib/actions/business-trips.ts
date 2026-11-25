"use server";
import "server-only";

import { revalidatePath } from "next/cache";

import { ensureAdmin } from "@/lib/auth-utils";
import { isAutoDecision } from "@/lib/business-trip-numbers";
import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { getAllMembersServer } from "@/services/member-service.server";
import { docToScheduleEvent } from "@/services/schedule-service";
import type { ScheduleEvent } from "@/types";
import {
  type BusinessTrip,
  BusinessTripSchema,
  type TripExpense,
  TripExpenseSchema,
} from "@/types/business-trip.types";
import type { Member } from "@/types/member.types";

/**
 * Server Action to assign sequential order numbers to business trips.
 * Uses Firebase Admin SDK to bypass client-side permission restrictions,
 * ensuring legacy documents without siteId get backfilled and numbered safely.
 */
export async function assignMissingBusinessTripNumbersAction(
  siteId: string = "bkgalabovo"
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();
    const tripsSnap = await adminDb.collection("business_trips").get();

    if (tripsSnap.empty) {
      return { success: true, count: 0 };
    }

    const trips: (BusinessTrip & { id: string })[] = [];
    tripsSnap.forEach((doc) => {
      const data = doc.data() as BusinessTrip;
      // Include trips belonging to this siteId, or legacy trips lacking siteId
      if (!data.siteId || data.siteId === siteId) {
        trips.push({ id: doc.id, ...data });
      }
    });

    const stamp = (t: BusinessTrip) =>
      t.orderDate || t.startDate || t.createdAt || "";
    const yearOf = (t: BusinessTrip) =>
      new Date(
        t.orderDate || t.startDate || t.createdAt || Date.now()
      ).getFullYear();

    const maxByYear: Record<number, number> = {};
    trips.forEach((t) => {
      if (t.orderNumber) {
        const y = yearOf(t);
        maxByYear[y] = Math.max(maxByYear[y] ?? 0, t.orderNumber);
      }
    });

    const missing = trips
      .filter((t) => !t.orderNumber && t.id)
      .sort((a, b) => stamp(a).localeCompare(stamp(b)));

    let updatedCount = 0;
    const batch = adminDb.batch();
    const now = new Date().toISOString();

    for (const t of missing) {
      const y = yearOf(t);
      const n = (maxByYear[y] ?? 0) + 1;
      maxByYear[y] = n;
      const ref = adminDb.collection("business_trips").doc(t.id);
      batch.update(ref, {
        orderNumber: n,
        ...(isAutoDecision(t.usDecision) ? { usDecision: `${n}-УС` } : {}),
        siteId: t.siteId || siteId || "bkgalabovo",
        updatedAt: now,
      });
      updatedCount++;
    }

    // Replace old ID-based decisions on already numbered trips
    for (const t of trips) {
      if (
        t.id &&
        t.orderNumber &&
        isAutoDecision(t.usDecision) &&
        t.usDecision !== `${t.orderNumber}-УС`
      ) {
        const ref = adminDb.collection("business_trips").doc(t.id);
        batch.update(ref, {
          usDecision: `${t.orderNumber}-УС`,
          siteId: t.siteId || siteId || "bkgalabovo",
          updatedAt: now,
        });
        updatedCount++;
      }
    }

    // Backfill siteId on legacy trips that lack it
    for (const t of trips) {
      if (t.id && !t.siteId) {
        const ref = adminDb.collection("business_trips").doc(t.id);
        batch.update(ref, {
          siteId: siteId || "bkgalabovo",
          updatedAt: now,
        });
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      await batch.commit();
    }

    return { success: true, count: updatedCount };
  } catch (error) {
    console.error("Error in assignMissingBusinessTripNumbersAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при присвояване на номера",
    };
  }
}

/**
 * Server Action to renumber all business trips strictly chronologically by startDate.
 * Updates orderNumber (1..N), usDecision (<N>-УС), usProtocolNumber (<N>-ПР),
 * and replaces any hardcoded numbers in saved protocolText and reportText.
 */
export async function renumberAllBusinessTripsChronologicallyAction(
  siteId: string = "bkgalabovo"
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();
    const tripsSnap = await adminDb.collection("business_trips").get();

    if (tripsSnap.empty) {
      return { success: true, count: 0 };
    }

    const trips: (BusinessTrip & { id: string })[] = [];
    tripsSnap.forEach((doc) => {
      const data = doc.data() as BusinessTrip;
      if (!data.siteId || data.siteId === siteId) {
        trips.push({ id: doc.id, ...data });
      }
    });

    // Group by calendar year
    const yearOf = (t: BusinessTrip) => {
      const d = t.startDate || t.orderDate || t.createdAt || "";
      return new Date(d).getFullYear() || 2026;
    };

    const byYear: Record<number, (BusinessTrip & { id: string })[]> = {};
    trips.forEach((t) => {
      const y = yearOf(t);
      if (!byYear[y]) byYear[y] = [];
      byYear[y].push(t);
    });

    const replaceTextNumbers = (
      text: string | undefined,
      oldNum: number | undefined,
      newNum: number
    ): string | undefined => {
      if (!text || oldNum === undefined || oldNum === newNum) return text;
      let res = text;
      res = res.replace(new RegExp(`${oldNum}-УС`, "g"), `${newNum}-УС`);
      res = res.replace(new RegExp(`${oldNum}-ПР`, "g"), `${newNum}-ПР`);
      res = res.replace(new RegExp(`${oldNum}-НР`, "g"), `${newNum}-НР`);
      res = res.replace(new RegExp(`${oldNum}-ВД`, "g"), `${newNum}-ВД`);
      res = res.replace(new RegExp(`${oldNum}-ПЛ`, "g"), `${newNum}-ПЛ`);
      res = res.replace(new RegExp(`${oldNum}-ПС`, "g"), `${newNum}-ПС`);
      res = res.replace(new RegExp(`${oldNum}-ДК`, "g"), `${newNum}-ДК`);

      res = res.replace(
        new RegExp(`(Заповед(?: за командировка)?\\s+№\\s*)${oldNum}\\b`, "gi"),
        `$1${newNum}`
      );
      res = res.replace(
        new RegExp(`(Решение(?: на УС)?\\s+№\\s*)${oldNum}\\b`, "gi"),
        `$1${newNum}`
      );
      res = res.replace(
        new RegExp(`(РЕШЕНИЕ\\s+№\\s*)${oldNum}\\b`, "g"),
        `$1${newNum}`
      );
      res = res.replace(
        new RegExp(`(Протокол\\s+№\\s*)${oldNum}\\b`, "gi"),
        `$1${newNum}`
      );
      return res;
    };

    let updatedCount = 0;
    const batch = adminDb.batch();
    const now = new Date().toISOString();

    for (const yearStr of Object.keys(byYear)) {
      const yearTrips = byYear[Number(yearStr)];
      // Sort strictly chronologically by startDate
      yearTrips.sort((a, b) => {
        const dateA = a.startDate || a.orderDate || a.createdAt || "";
        const dateB = b.startDate || b.orderDate || b.createdAt || "";
        return dateA.localeCompare(dateB);
      });

      for (let i = 0; i < yearTrips.length; i++) {
        const t = yearTrips[i];
        const newNum = i + 1;
        const oldNum = t.orderNumber;

        const updatePayload: Record<string, unknown> = {
          orderNumber: newNum,
          usDecision: `${newNum}-УС`,
          usProtocolNumber: `${newNum}-ПР`,
          siteId: t.siteId || siteId || "bkgalabovo",
          updatedAt: now,
        };

        if (!t.usDecisionDate && t.orderDate) {
          updatePayload.usDecisionDate = t.orderDate.slice(0, 10);
        }

        if (t.protocolText) {
          updatePayload.protocolText = replaceTextNumbers(
            t.protocolText,
            oldNum,
            newNum
          );
        }

        if (t.reportText) {
          updatePayload.reportText = replaceTextNumbers(
            t.reportText,
            oldNum,
            newNum
          );
        }

        const ref = adminDb.collection("business_trips").doc(t.id);
        batch.update(ref, updatePayload);
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      await batch.commit();
    }

    return { success: true, count: updatedCount };
  } catch (error) {
    console.error(
      "Error in renumberAllBusinessTripsChronologicallyAction:",
      error
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при хронологичното преномериране",
    };
  }
}

export async function createBusinessTripAction(
  data: Omit<BusinessTrip, "id">
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();

    const athleteSignatures: Record<string, string> = {
      ...(data.signatures?.athletes || {}),
    };

    let chairmanSig = data.signatures?.chairman || null;
    let coachSig = data.signatures?.coach || null;

    try {
      if (!chairmanSig) {
        const chairSnap = await adminDb
          .collection("club_settings")
          .doc("chairperson")
          .get();
        if (chairSnap.exists) {
          const cData = chairSnap.data();
          if (cData?.signatureUrl && typeof cData.signatureUrl === "string") {
            chairmanSig = cData.signatureUrl;
          }
        }
      }

      const coachLower = (data.coachName || "").toLowerCase();
      if (
        !coachSig &&
        (coachLower.includes("мира") || !data.coachName) &&
        chairmanSig
      ) {
        coachSig = chairmanSig;
      }
    } catch {
      // Ignore background signature fetch errors
    }

    if (
      Array.isArray(data.participantsIds) &&
      data.participantsIds.length > 0
    ) {
      const missingIds = data.participantsIds.filter(
        (id) => !athleteSignatures[id]
      );
      if (missingIds.length > 0) {
        await Promise.all(
          missingIds.map(async (id) => {
            try {
              const memberSnap = await adminDb
                .collection("members")
                .doc(id)
                .get();
              if (memberSnap.exists) {
                const mData = memberSnap.data();
                if (mData?.signature && typeof mData.signature === "string") {
                  athleteSignatures[id] = mData.signature;
                }
              }
            } catch {
              // Silently continue if single lookup fails
            }
          })
        );
      }
    }

    const now = new Date().toISOString();
    const validatedData = BusinessTripSchema.omit({ id: true }).parse({
      ...data,
      signatures: {
        ...data.signatures,
        chairman: chairmanSig || undefined,
        coach: coachSig || undefined,
        athletes: athleteSignatures,
      },
      orderDate: data.orderDate || now,
      createdAt: now,
      updatedAt: now,
    });

    const sanitizedData = JSON.parse(JSON.stringify(validatedData));
    const docRef = await adminDb
      .collection("business_trips")
      .add(sanitizedData);

    const siteId = validatedData.siteId || "bkgalabovo";
    const renumRes =
      await renumberAllBusinessTripsChronologicallyAction(siteId);
    if (!renumRes.success) {
      await assignMissingBusinessTripNumbersAction(siteId);
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error in createBusinessTripAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при създаване на командировката",
    };
  }
}

export async function updateBusinessTripAction(
  id: string,
  data: Partial<BusinessTrip>
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();

    const sanitizedData = JSON.parse(JSON.stringify(data)) as Record<
      string,
      unknown
    >;
    const validatedData = BusinessTripSchema.partial().parse(
      sanitizedData
    ) as Record<string, unknown>;

    // CRITICAL: Zod .partial().parse() still applies .default() values (e.g.
    // participantsIds: [], status: "draft", coachIsAthlete: false) for omitted
    // keys! Strip any key that was NOT explicitly provided in `data` so partial
    // updates NEVER wipe participantsIds or reset status/coachIsAthlete.
    const explicitKeys = new Set(Object.keys(sanitizedData));
    const safeValidatedData: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(validatedData)) {
      if (explicitKeys.has(key)) {
        safeValidatedData[key] = val;
      }
    }

    const updatePayload: Record<string, unknown> = {
      ...safeValidatedData,
      updatedAt: new Date().toISOString(),
    };
    if (data.siteId) {
      updatePayload.siteId = data.siteId;
    }

    await adminDb.collection("business_trips").doc(id).update(updatePayload);
    try {
      revalidatePath("/accounting", "layout");
      revalidatePath(`/accounting/trips/${id}`, "layout");
    } catch {
      // Ignore outside Next.js request context (e.g. unit tests)
    }
    return { success: true };
  } catch (error) {
    console.error("Error in updateBusinessTripAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при обновяване на командировката",
    };
  }
}

export async function deleteBusinessTripAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();

    const tripRef = adminDb.collection("business_trips").doc(id);
    const tripSnap = await tripRef.get();
    if (!tripSnap.exists) {
      return { success: true };
    }
    const trip = tripSnap.data() as BusinessTrip;

    const expensesSnap = await adminDb
      .collection("trip_expenses")
      .where("tripId", "==", id)
      .get();

    const batch = adminDb.batch();
    expensesSnap.docs.forEach((expDoc) => {
      batch.delete(expDoc.ref);
    });
    batch.delete(tripRef);
    await batch.commit();

    try {
      await renumberAllBusinessTripsChronologicallyAction(
        trip.siteId || "bkgalabovo"
      );
    } catch (renumberErr) {
      console.warn(
        "Преномериране след изтриване на командировка пропуснато:",
        renumberErr
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteBusinessTripAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при изтриване на командировката",
    };
  }
}

export async function addTripExpenseAction(
  data: Omit<TripExpense, "id">
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();

    const validatedData = TripExpenseSchema.omit({ id: true }).parse({
      ...data,
      createdAt: new Date().toISOString(),
    });
    const sanitizedData = JSON.parse(JSON.stringify(validatedData));

    const docRef = await adminDb.collection("trip_expenses").add(sanitizedData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error in addTripExpenseAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при добавяне на разхода",
    };
  }
}

export async function updateTripExpenseAction(
  id: string,
  data: Partial<TripExpense>
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();

    const validatedData = TripExpenseSchema.partial().parse(data);
    const sanitizedData = JSON.parse(JSON.stringify(validatedData));

    await adminDb
      .collection("trip_expenses")
      .doc(id)
      .update({
        ...sanitizedData,
        updatedAt: new Date().toISOString(),
      });
    return { success: true };
  } catch (error) {
    console.error("Error in updateTripExpenseAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при обновяване на разхода",
    };
  }
}

export async function deleteTripExpenseAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();

    await adminDb.collection("trip_expenses").doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error("Error in deleteTripExpenseAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при изтриване на разхода",
    };
  }
}

export async function logExpenseAttachmentDownloadAction(
  expenseId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();

    await adminDb.collection("trip_expenses").doc(expenseId).update({
      attachmentDownloadedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error in logExpenseAttachmentDownloadAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при запис на свалянето",
    };
  }
}

export async function getBusinessTripsAction(
  siteId: string = "bkgalabovo"
): Promise<{ success: boolean; data?: BusinessTrip[]; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();
    const snap = await adminDb
      .collection("business_trips")
      .where("siteId", "==", siteId)
      .get();

    const trips = snap.docs.map((doc) =>
      serializeFirestoreData({ id: doc.id, ...doc.data() })
    ) as BusinessTrip[];

    trips.sort(
      (a, b) =>
        new Date(b.startDate || 0).getTime() -
        new Date(a.startDate || 0).getTime()
    );
    return { success: true, data: trips };
  } catch (error) {
    console.error("Error in getBusinessTripsAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при зареждане на командировките",
    };
  }
}

export async function getBusinessTripsByEventIdAction(
  eventId: string,
  siteId: string = "bkgalabovo"
): Promise<{ success: boolean; data?: BusinessTrip[]; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();
    const snap = await adminDb
      .collection("business_trips")
      .where("siteId", "==", siteId)
      .where("eventId", "==", eventId)
      .get();

    const trips = snap.docs.map((doc) =>
      serializeFirestoreData({ id: doc.id, ...doc.data() })
    ) as BusinessTrip[];

    trips.sort(
      (a, b) =>
        new Date(b.startDate || 0).getTime() -
        new Date(a.startDate || 0).getTime()
    );
    return { success: true, data: trips };
  } catch (error) {
    console.error("Error in getBusinessTripsByEventIdAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при зареждане на командировките за събитието",
    };
  }
}

export async function getBusinessTripByIdAction(
  id: string
): Promise<{ success: boolean; data?: BusinessTrip | null; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();
    const docSnap = await adminDb.collection("business_trips").doc(id).get();
    if (!docSnap.exists) {
      return { success: true, data: null };
    }
    const trip = serializeFirestoreData({
      id: docSnap.id,
      ...docSnap.data(),
    }) as BusinessTrip;
    return { success: true, data: trip };
  } catch (error) {
    console.error("Error in getBusinessTripByIdAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при зареждане на командировката",
    };
  }
}

export async function getTripExpensesAction(
  tripId: string,
  siteId?: string
): Promise<{ success: boolean; data?: TripExpense[]; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();
    let ref: FirebaseFirestore.Query = adminDb
      .collection("trip_expenses")
      .where("tripId", "==", tripId);
    if (siteId) {
      ref = ref.where("siteId", "==", siteId);
    }
    const snap = await ref.get();
    const expenses = snap.docs.map((doc) =>
      serializeFirestoreData({ id: doc.id, ...doc.data() })
    ) as TripExpense[];

    expenses.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
    return { success: true, data: expenses };
  } catch (error) {
    console.error("Error in getTripExpensesAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при зареждане на разходите",
    };
  }
}

export async function getExpensesBySiteAction(
  siteId: string = "bkgalabovo"
): Promise<{ success: boolean; data?: TripExpense[]; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();
    const snap = await adminDb
      .collection("trip_expenses")
      .where("siteId", "==", siteId)
      .get();

    const expenses = snap.docs.map((doc) =>
      serializeFirestoreData({ id: doc.id, ...doc.data() })
    ) as TripExpense[];

    expenses.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
    return { success: true, data: expenses };
  } catch (error) {
    console.error("Error in getExpensesBySiteAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при зареждане на всички разходи",
    };
  }
}

export async function getAccountingBootstrapAction(
  siteId: string = "bkgalabovo"
): Promise<{
  success: boolean;
  data?: {
    trips: BusinessTrip[];
    expenses: TripExpense[];
    members: Member[];
    events: ScheduleEvent[];
  };
  error?: string;
}> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();
    const [tripsSnap, expSnap, members, eventsSnap] = await Promise.all([
      adminDb.collection("business_trips").where("siteId", "==", siteId).get(),
      adminDb.collection("trip_expenses").where("siteId", "==", siteId).get(),
      getAllMembersServer(),
      adminDb.collection("events").get(),
    ]);

    const trips = tripsSnap.docs.map((doc) =>
      serializeFirestoreData({ id: doc.id, ...doc.data() })
    ) as BusinessTrip[];
    trips.sort(
      (a, b) =>
        new Date(b.startDate || 0).getTime() -
        new Date(a.startDate || 0).getTime()
    );

    const expenses = expSnap.docs.map((doc) =>
      serializeFirestoreData({ id: doc.id, ...doc.data() })
    ) as TripExpense[];
    expenses.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );

    const events = eventsSnap.docs
      .map((d) => docToScheduleEvent(d as never))
      .filter(Boolean)
      .map((ev) => serializeFirestoreData(ev)) as ScheduleEvent[];

    return {
      success: true,
      data: { trips, expenses, members, events },
    };
  } catch (error) {
    console.error("Error in getAccountingBootstrapAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при зареждане на счетоводния модул",
    };
  }
}

export async function getTournamentResultsSummaryAction(
  eventId: string,
  participantIds: string[] = []
): Promise<{ success: boolean; summary?: string; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();

    const eventSnap = await adminDb.collection("events").doc(eventId).get();
    if (!eventSnap.exists) {
      return { success: false, error: "Събитието не е намерено в графика." };
    }
    const eventData = eventSnap.data() as {
      tournamentId?: string | null;
      title?: string;
    };
    const tournamentId = eventData?.tournamentId;
    if (!tournamentId) {
      return {
        success: false,
        error: "Към това събитие няма свързан турнир в модул „Турнири“.",
      };
    }

    const [tSnap, entriesSnap, matchesSnap] = await Promise.all([
      adminDb.collection("tournaments").doc(tournamentId).get(),
      adminDb
        .collection("tournament_entries")
        .where("tournamentId", "==", tournamentId)
        .get(),
      adminDb
        .collection("tournament_matches")
        .where("tournamentId", "==", tournamentId)
        .get(),
    ]);

    if (!tSnap.exists) {
      return { success: false, error: "Свързаният турнир не е намерен." };
    }

    const tournament = tSnap.data() as { name?: string; title?: string };
    const entries = entriesSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as {
        memberId?: string;
        partnerMemberId?: string;
        externalName?: string;
        categoryId?: string;
        pointsAwarded?: number;
      }),
    }));

    const clubEntries = entries.filter(
      (e) =>
        (e.memberId &&
          (participantIds.length === 0 ||
            participantIds.includes(e.memberId))) ||
        (e.partnerMemberId &&
          (participantIds.length === 0 ||
            participantIds.includes(e.partnerMemberId)))
    );

    if (clubEntries.length === 0) {
      return {
        success: false,
        error: "Няма записани клубни участници в свързания турнир.",
      };
    }

    const matches = matchesSnap.docs.map(
      (d) =>
        d.data() as {
          player1EntryId?: string | null;
          player2EntryId?: string | null;
          winnerEntryId?: string;
          status?: string;
          stage?: string;
        }
    );

    const clubEntryIds = new Set(clubEntries.map((e) => e.id));
    let totalMatches = 0;
    let totalWins = 0;
    matches.forEach((m) => {
      if (m.status !== "completed") return;
      const p1Club = Boolean(
        m.player1EntryId && clubEntryIds.has(m.player1EntryId)
      );
      const p2Club = Boolean(
        m.player2EntryId && clubEntryIds.has(m.player2EntryId)
      );
      if (p1Club || p2Club) {
        totalMatches++;
        if (m.winnerEntryId && clubEntryIds.has(m.winnerEntryId)) {
          totalWins++;
        }
      }
    });

    const tName =
      tournament.name || tournament.title || eventData.title || "Турнир";
    const lines = [
      `\nРезултати от модул „Турнири“ (${tName}):`,
      `- Записани участия на клубни състезатели: ${clubEntries.length}`,
      `- Изиграни срещи: ${totalMatches}, от които победи: ${totalWins}`,
    ];

    return { success: true, summary: lines.join("\n") };
  } catch (error) {
    console.error("Error in getTournamentResultsSummaryAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при импортиране на резултатите от турнира",
    };
  }
}

export async function logTripProtocolDownloadAction(
  tripId: string,
  protocolId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();

    const tripRef = adminDb.collection("business_trips").doc(tripId);
    const snap = await tripRef.get();
    if (!snap.exists) {
      return { success: true };
    }
    const tripData = snap.data() as BusinessTrip;
    const now = new Date().toISOString();

    let updatedProtocols = tripData.matchProtocols;
    if (updatedProtocols && protocolId) {
      updatedProtocols = updatedProtocols.map((p) =>
        p.id === protocolId ? { ...p, downloadedAt: now } : p
      );
    }

    await tripRef.update({
      matchProtocolDownloadedAt: now,
      ...(updatedProtocols ? { matchProtocols: updatedProtocols } : {}),
      updatedAt: now,
    });
    return { success: true };
  } catch (error) {
    console.error("Error in logTripProtocolDownloadAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при запис на свалянето на протокола",
    };
  }
}

export interface VehiclePreset {
  id: string;
  label: string;
  brand: string;
  regNumber: string;
  fuelType: "бензин" | "дизел" | "газ";
  fuelNorm: number;
}

export async function getTripVehiclePresetsAction(): Promise<{
  success: boolean;
  presets: VehiclePreset[];
}> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();
    const snap = await adminDb
      .collection("club_settings")
      .doc("trip_presets")
      .get();
    if (!snap.exists) {
      return { success: true, presets: [] };
    }
    const data = snap.data() as { vehicles?: VehiclePreset[] };
    return {
      success: true,
      presets: Array.isArray(data?.vehicles) ? data.vehicles : [],
    };
  } catch (error) {
    console.error("Error in getTripVehiclePresetsAction:", error);
    return { success: false, presets: [] };
  }
}

export async function saveTripVehiclePresetAction(
  preset: Omit<VehiclePreset, "id">
): Promise<{ success: boolean; presets?: VehiclePreset[]; error?: string }> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();
    const ref = adminDb.collection("club_settings").doc("trip_presets");
    const snap = await ref.get();
    const existing = snap.exists
      ? ((snap.data() as { vehicles?: VehiclePreset[] })?.vehicles ?? [])
      : [];

    const normalizedReg = preset.regNumber.trim().toUpperCase();
    const filtered = existing.filter(
      (v) => v.regNumber.trim().toUpperCase() !== normalizedReg
    );
    const next: VehiclePreset[] = [
      {
        ...preset,
        regNumber: normalizedReg,
        id: normalizedReg || `${Date.now()}`,
      },
      ...filtered,
    ].slice(0, 12);

    await ref.set(
      {
        vehicles: next,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { success: true, presets: next };
  } catch (error) {
    console.error("Error in saveTripVehiclePresetAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при запазване на МПС шаблона",
    };
  }
}
