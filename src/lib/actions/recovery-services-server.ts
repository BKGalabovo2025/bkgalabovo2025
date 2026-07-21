"use server";
import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { Sale } from "@/types";
import * as admin from "firebase-admin";

export async function getRecoveryServiceHistoryAction(_activeBranch: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Неоторизиран достъп.");

    const adminDb = getAdminDb();

    // Fetch all recovery service IDs so we can filter the shared serviceHistory collection
    const recoverySnapshot = await adminDb.collection("sessions").get();
    const validIds = new Set(recoverySnapshot.docs.map((d) => d.id));

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
    console.error("Error getRecoveryServiceHistoryAction:", error);
    return {
      success: false,
      error:
        (error instanceof Error ? error.message : "Unknown error") ||
        "Грешка при зареждане на история.",
    };
  }
}

export async function getRecoveryServiceSalesAction(activeBranch: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Неоторизиран достъп.");

    const adminDb = getAdminDb();
    let query: admin.firestore.Query = adminDb
      .collection("sales")
      .where("type", "==", "recovery_service");

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
    console.error("Error getRecoveryServiceSalesAction:", error);
    return {
      success: false,
      error:
        (error instanceof Error ? error.message : "Unknown error") ||
        "Грешка при зареждане на продажби.",
    };
  }
}

// Convert any timestamps to ISO strings (reusable helper)
const convertTimestamps = (val: any): any => {
  if (!val) return val;
  if (typeof val.toDate === "function") {
    return val.toDate().toISOString();
  }
  if (val instanceof admin.firestore.Timestamp) {
    return val.toDate().toISOString();
  }
  if (Array.isArray(val)) {
    return val.map((v: any) => convertTimestamps(v));
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

export async function getRecoveryReservationsAction(activeBranch: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Неоторизиран достъп.");

    const adminDb = getAdminDb();
    let query: admin.firestore.Query = adminDb.collection("reservations");

    if (activeBranch && activeBranch !== "bkgalabovo") {
      query = query.where("siteId", "==", activeBranch);
    }

    const snapshot = await query.get();
    const items = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return { id: doc.id, ...convertTimestamps(data) };
      })
      .filter((r) => r.sessionId) // Filter out court reservations (they have courtId instead of sessionId)
      .sort((a, b) => {
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        return timeB - timeA; // Descending
      });

    return { success: true, data: items };
  } catch (error: unknown) {
    console.error("Error getRecoveryReservationsAction:", error);
    return {
      success: false,
      error:
        (error instanceof Error ? error.message : "Unknown error") ||
        "Грешка при зареждане на резервации.",
    };
  }
}

export async function getRecoveryClientPackagesAction(activeBranch: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Неоторизиран достъп.");

    const adminDb = getAdminDb();
    let query: admin.firestore.Query = adminDb.collection("client_packages");

    if (activeBranch && activeBranch !== "bkgalabovo") {
      query = query.where("siteId", "==", activeBranch);
    }

    const snapshot = await query.get();
    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, ...convertTimestamps(data) };
    });

    return { success: true, data: items };
  } catch (error: unknown) {
    console.error("Error getRecoveryClientPackagesAction:", error);
    return {
      success: false,
      error:
        (error instanceof Error ? error.message : "Unknown error") ||
        "Грешка при зареждане на пакети.",
    };
  }
}

export async function getRecoveryClientsAction(activeBranch: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Неоторизиран достъп.");

    const adminDb = getAdminDb();
    let query: admin.firestore.Query = adminDb.collection("clients");

    if (activeBranch && activeBranch !== "bkgalabovo") {
      query = query.where("siteId", "==", activeBranch);
    }

    const snapshot = await query.get();
    const items = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return { id: doc.id, ...convertTimestamps(data) };
      })
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

    return { success: true, data: items };
  } catch (error: unknown) {
    console.error("Error getRecoveryClientsAction:", error);
    return {
      success: false,
      error:
        (error instanceof Error ? error.message : "Unknown error") ||
        "Грешка при зареждане на клиенти.",
    };
  }
}

export async function deleteRecoveryPackageAction(
  _idToken: string,
  packageId: string
) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Неоторизиран достъп.");
    const adminDb = getAdminDb();
    await adminDb.collection("client_packages").doc(packageId).delete();
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function deleteRecoveryClientAction(_idToken: string, clientId: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Неоторизиран достъп.");
    const adminDb = getAdminDb();
    await adminDb.collection("clients").doc(clientId).delete();
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
