"use server";
import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import {
  CertificateTemplate,
  CertificateTemplateCreateInput,
  CertificateTemplateUpdateInput,
  DEFAULT_CERTIFICATE_TEMPLATES,
} from "@/types/certificates";

const TEMPLATES_COLLECTION = "certificate_templates";

/**
 * Извлича всички шаблони за даден клуб (siteId) чрез Admin SDK
 */
export async function getTemplatesAction(
  siteId: "bkgalabovo" | "recoveryzone"
): Promise<{ success: boolean; data: CertificateTemplate[]; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const snapshot = await adminDb
      .collection(TEMPLATES_COLLECTION)
      .where("siteId", "==", siteId)
      .get();

    if (snapshot.empty) {
      const defaults = DEFAULT_CERTIFICATE_TEMPLATES.filter(
        (t) => t.siteId === siteId
      ).map((t, idx) => ({
        ...t,
        id: `${siteId}_tmpl_default_${idx}`,
        createdAt: new Date().toISOString(),
      }));
      return { success: true, data: defaults as CertificateTemplate[] };
    }

    const items: CertificateTemplate[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        siteId: (data.siteId as "bkgalabovo" | "recoveryzone") || "bkgalabovo",
        type: data.type || "award",
        title: String(data.title || ""),
        description: data.description ? String(data.description) : undefined,
        status: data.status || "draft",
        visualConfig: data.visualConfig || {
          orientation: "landscape",
          themeColor: "#1E3A8A",
          secondaryColor: "#D97706",
          backgroundColor: "#FFFFFF",
          frameStyle: "classic_gold",
          selectedSponsorIds: [],
          signatoryName: "Димитър Иванов",
          signatoryTitle: "Председател",
          showBadge: true,
        },
        defaultValidityDays: data.defaultValidityDays,
        defaultTotalSessions: data.defaultTotalSessions,
        createdAt: String(data.createdAt || new Date().toISOString()),
        updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
      };
    });

    return { success: true, data: items };
  } catch (error) {
    console.error("Грешка при getTemplatesAction:", error);
    const defaults = DEFAULT_CERTIFICATE_TEMPLATES.filter(
      (t) => t.siteId === siteId
    ).map((t, idx) => ({
      ...t,
      id: `${siteId}_tmpl_default_${idx}`,
      createdAt: new Date().toISOString(),
    }));
    return {
      success: true,
      data: defaults as CertificateTemplate[],
      error: error instanceof Error ? error.message : "Грешка при зареждане",
    };
  }
}

/**
 * Създава нов шаблон
 */
export async function createTemplateAction(
  siteId: "bkgalabovo" | "recoveryzone",
  data: CertificateTemplateCreateInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const cleanData = JSON.parse(
      JSON.stringify({
        ...data,
        siteId,
        createdAt: new Date().toISOString(),
      })
    );
    const docRef = await adminDb
      .collection(TEMPLATES_COLLECTION)
      .add(cleanData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Грешка при createTemplateAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при създаване на шаблон",
    };
  }
}

/**
 * Обновява шаблон
 */
export async function updateTemplateAction(
  id: string,
  data: CertificateTemplateUpdateInput,
  siteId: "bkgalabovo" | "recoveryzone" = "bkgalabovo"
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const cleanData = JSON.parse(
      JSON.stringify({
        ...data,
        siteId,
        updatedAt: new Date().toISOString(),
      })
    );
    await adminDb
      .collection(TEMPLATES_COLLECTION)
      .doc(id)
      .set(cleanData, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Грешка при updateTemplateAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при обновяване на шаблон",
    };
  }
}

/**
 * Изтрива шаблон
 */
export async function deleteTemplateAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (id.includes("_tmpl_default_")) {
      return { success: true };
    }
    const adminDb = getAdminDb();
    await adminDb.collection(TEMPLATES_COLLECTION).doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error("Грешка при deleteTemplateAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при изтриване на шаблон",
    };
  }
}

/**
 * Записва препоръчителните начални шаблони в базата данни
 */
export async function seedInitialTemplatesAction(
  siteId: "bkgalabovo" | "recoveryzone"
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const list = DEFAULT_CERTIFICATE_TEMPLATES.filter(
      (t) => t.siteId === siteId
    );
    const now = new Date().toISOString();

    for (const item of list) {
      await adminDb.collection(TEMPLATES_COLLECTION).add({
        ...item,
        siteId,
        createdAt: now,
      });
    }

    return { success: true, count: list.length };
  } catch (error) {
    console.error("Грешка при seedInitialTemplatesAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Грешка при инициализация",
    };
  }
}
