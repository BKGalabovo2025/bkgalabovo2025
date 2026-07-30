"use server";
import "server-only";

import * as admin from "firebase-admin";

import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";
import { GeneralService, GeneralServiceEvent, Sale } from "@/types";

function snapToData<T>(
  doc: admin.firestore.DocumentSnapshot | admin.firestore.QueryDocumentSnapshot
): T | null {
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;

  const convertTimestamps = (val: unknown): unknown => {
    if (!val) return val;
    if (typeof (val as { toDate?: unknown }).toDate === "function") {
      return (val as admin.firestore.Timestamp).toDate().toISOString();
    }
    if (val instanceof admin.firestore.Timestamp) {
      return val.toDate().toISOString();
    }
    if (Array.isArray(val)) {
      return val.map(convertTimestamps);
    }
    if (typeof val === "object") {
      const copy: Record<string, unknown> = {};
      for (const key of Object.keys(val)) {
        copy[key] = convertTimestamps((val as Record<string, unknown>)[key]);
      }
      return copy;
    }
    return val;
  };

  return {
    id: doc.id,
    ...(convertTimestamps(data) as Record<string, unknown>),
  } as T;
}

export async function getGeneralServicesServerAction(activeBranch: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) {
      throw new Error("Неоторизиран достъп.");
    }

    const adminDb = getAdminDb();
    let query: admin.firestore.Query = adminDb.collection(
      "clubGeneralServices"
    );

    if (activeBranch && activeBranch !== "bkgalabovo") {
      query = query.where("siteId", "==", activeBranch);
    }

    const snapshot = await query.get();
    const services = snapshot.docs
      .map((doc) => snapToData<GeneralService>(doc))
      .filter((s): s is GeneralService => s !== null)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return { success: true, data: services };
  } catch (error: unknown) {
    console.error("Error getGeneralServicesServerAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Грешка при зареждане.",
    };
  }
}

export async function createGeneralServiceAction(
  data: Omit<GeneralService, "id" | "createdAt" | "updatedAt" | "createdBy">
) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Неоторизиран достъп.");

    const adminDb = getAdminDb();
    const now = new Date().toISOString();

    const serviceData = {
      ...data,
      createdAt: now,
      updatedAt: now,
      createdBy: { userId: user.uid, userName: user.email || "Unknown" },
    };

    const docRef = await adminDb
      .collection("clubGeneralServices")
      .add(serviceData);

    const event: Omit<GeneralServiceEvent, "id"> = {
      siteId: data.siteId,
      serviceId: docRef.id,
      serviceName: data.name,
      createdAt: now,
      type: "create",
      userId: user.uid,
      userName: user.email || "Unknown",
    };
    await adminDb.collection("generalServiceHistory").add(event);

    return { success: true, data: { id: docRef.id, ...serviceData } };
  } catch (error: unknown) {
    console.error("Error createGeneralServiceAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Грешка при създаване.",
    };
  }
}

export async function updateGeneralServiceAction(
  id: string,
  data: Partial<GeneralService>
) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Неоторизиран достъп.");

    const adminDb = getAdminDb();
    const now = new Date().toISOString();

    const docRef = adminDb.collection("clubGeneralServices").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error("Услугата не е намерена.");
    }

    const oldData = docSnap.data() as GeneralService;

    const updateData = {
      ...data,
      description: data.description || "",
      updatedAt: now,
      updatedBy: { userId: user.uid, userName: user.email || "Unknown" },
    };

    await docRef.update(updateData);

    const event: Omit<GeneralServiceEvent, "id"> = {
      siteId: oldData.siteId || "bkgalabovo",
      serviceId: id,
      serviceName: data.name || oldData.name,
      createdAt: now,
      type: "update",
      userId: user.uid,
      userName: user.email || "Unknown",
      oldPrice: oldData.price,
      newPrice: data.price !== undefined ? data.price : oldData.price,
    };
    await adminDb.collection("generalServiceHistory").add(event);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error updateGeneralServiceAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Грешка при редакция.",
    };
  }
}

export async function deleteGeneralServiceAction(id: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Неоторизиран достъп.");

    const adminDb = getAdminDb();
    const now = new Date().toISOString();

    const docRef = adminDb.collection("clubGeneralServices").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error("Услугата не е намерена.");
    }

    const oldData = docSnap.data() as GeneralService;

    await docRef.delete();

    const event: Omit<GeneralServiceEvent, "id"> = {
      siteId: oldData.siteId || "bkgalabovo",
      serviceId: id,
      serviceName: oldData.name,
      createdAt: now,
      type: "delete",
      userId: user.uid,
      userName: user.email || "Unknown",
    };
    await adminDb.collection("generalServiceHistory").add(event);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleteGeneralServiceAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Грешка при изтриване.",
    };
  }
}

export async function getGeneralServiceHistoryAction(activeBranch: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Неоторизиран достъп.");

    const adminDb = getAdminDb();
    let query: admin.firestore.Query = adminDb.collection(
      "generalServiceHistory"
    );

    if (activeBranch && activeBranch !== "bkgalabovo") {
      query = query.where("siteId", "==", activeBranch);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();
    const history = snapshot.docs.map((doc) =>
      snapToData<GeneralServiceEvent>(doc)
    );

    return { success: true, data: history };
  } catch (error: unknown) {
    console.error("Error getGeneralServiceHistoryAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при зареждане на история.",
    };
  }
}

export async function executeGeneralServiceSaleAction(
  saleData: Omit<Sale, "id">,
  serviceName: string,
  clientName?: string
) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Неоторизиран достъп.");

    const adminDb = getAdminDb();
    const now = new Date().toISOString();

    const batch = adminDb.batch();

    // 1. Създаване на записа за продажба
    const saleRef = adminDb.collection("sales").doc();
    const newSale = {
      ...saleData,
      createdAt: now,
    };
    batch.set(saleRef, newSale);

    // 2. Създаване на събитие в историята на услугите
    const serviceId = saleData.items[0]?.productId;
    if (serviceId) {
      const eventRef = adminDb.collection("generalServiceHistory").doc();
      const historyEvent: Omit<GeneralServiceEvent, "id"> = {
        siteId: saleData.siteId || "bkgalabovo",
        serviceId: serviceId,
        serviceName: serviceName,
        createdAt: now,
        type: "sale",
        relatedSaleId: saleRef.id,
        userId: user.uid,
        userName: user.email || "Unknown",
        clientName: clientName || "Неизвестен клиент",
      };
      batch.set(eventRef, historyEvent);
    }

    await batch.commit();

    return { success: true, saleId: saleRef.id };
  } catch (error: unknown) {
    console.error("Error executeGeneralServiceSaleAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Грешка при продажба.",
    };
  }
}

export async function deleteGeneralServiceSaleAction(saleId: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Неоторизиран достъп.");

    const adminDb = getAdminDb();
    const batch = adminDb.batch();

    // Изтриваме продажбата
    const saleRef = adminDb.collection("sales").doc(saleId);
    batch.delete(saleRef);

    // Изтриваме свързаното събитие в историята
    const historySnapshot = await adminDb
      .collection("generalServiceHistory")
      .where("relatedSaleId", "==", saleId)
      .get();

    historySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleteGeneralServiceSaleAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при изтриване на продажба.",
    };
  }
}
