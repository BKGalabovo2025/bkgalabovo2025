"use server";
import "server-only";

import { isAutoDecision } from "@/lib/business-trip-numbers";
import { getAdminDb } from "@/lib/firebase-admin";
import type { BusinessTrip } from "@/types/business-trip.types";

/**
 * Server Action to assign sequential order numbers to business trips.
 * Uses Firebase Admin SDK to bypass client-side permission restrictions,
 * ensuring legacy documents without siteId get backfilled and numbered safely.
 */
export async function assignMissingBusinessTripNumbersAction(
  siteId: string = "bkgalabovo"
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
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
