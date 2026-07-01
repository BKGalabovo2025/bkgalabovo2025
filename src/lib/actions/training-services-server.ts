/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { Sale } from "@/types";
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

export async function getTrainingServiceSalesAction(activeBranch: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Неоторизиран достъп.");

    const adminDb = getAdminDb();
    let query: admin.firestore.Query = adminDb
      .collection("sales")
      .where("type", "==", "training_service");

    if (activeBranch && activeBranch !== "bkgalabovo") {
      query = query.where("siteId", "==", activeBranch);
    }

    const snapshot = await query.get();
    const sales = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        if (!data) return null;

        // Convert any timestamps to ISO strings
        const convertTimestamps = (val: any): any => {
          if (!val) return val;
          if (typeof val.toDate === "function") {
            return val.toDate().toISOString();
          }
          if (val instanceof admin.firestore.Timestamp) {
            return val.toDate().toISOString();
          }
          if (Array.isArray(val)) {
            return val.map(convertTimestamps);
          }
          if (typeof val === "object" && val !== null) {
            const newObj: any = {};
            for (const key of Object.keys(val)) {
              newObj[key] = convertTimestamps(val[key]);
            }
            return newObj;
          }
          return val;
        };

        const parsedData = convertTimestamps(data);
        return { id: doc.id, ...parsedData } as Sale;
      })
      .filter((s): s is Sale => s !== null)
      .sort(
        (a, b) =>
          new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
      );

    return { success: true, data: sales };
  } catch (error: unknown) {
    console.error("Error getTrainingServiceSalesAction:", error);
    return {
      success: false,
      error:
        (error instanceof Error ? error.message : "Unknown error") ||
        "Грешка при зареждане на продажби.",
    };
  }
}
