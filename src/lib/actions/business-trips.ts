"use server";
import "server-only";

import { ensureAdmin } from "@/lib/auth-utils";
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
