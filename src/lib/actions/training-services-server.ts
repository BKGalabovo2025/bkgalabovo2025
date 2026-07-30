"use server";
import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import * as admin from "firebase-admin";

export async function getTrainingServiceHistoryAction(_activeBranch: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Неоторизиран достъп.");

    const adminDb = getAdminDb();

    // Fetch all training service IDs so we can filter the shared serviceHistory collection
    const trainingSnapshot = await adminDb.collection("clubServices").get();
    const validIds = new Set(trainingSnapshot.docs.map((d) => d.id));

    // serviceHistory does not currently use siteId consistently, but we can query by it if needed in the future.
    const query: admin.firestore.Query = adminDb.collection("serviceHistory");

    const snapshot = await query.orderBy("timestamp", "desc").get();
    // Since serviceHistory uses 'timestamp' instead of 'createdAt' for old records, we map it properly
    const history = snapshot.docs
      .filter((doc) => validIds.has(doc.data().serviceId))
      .map((doc) => {
        const data = doc.data();
        const createdAt = data.timestamp
          ? data.timestamp.toDate().toISOString()
          : new Date().toISOString();
        delete data.timestamp; // Completely remove the Timestamp object from the payload
        return {
          id: doc.id,
          ...data,
          createdAt,
          type: data.action || "other",
          serviceName: data.changes || "Тренировка",
        } as any;
      });

    return { success: true, data: history };
  } catch (error: unknown) {
    console.error("Error getTrainingServiceHistoryAction:", error);
    return {
      success: false,
      error:
        (error instanceof Error ? error.message : "Unknown error") ||
        "Грешка при зареждане на история.",
    };
  }
}
