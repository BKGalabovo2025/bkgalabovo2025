"use server";
import "server-only";

import { readWithFallback, writeWithFallback } from "@/lib/db-failover";
import {
  DEFAULT_INITIAL_SPONSORS,
  SponsorCategory,
  SponsorPartner,
  SponsorPartnerCreateInput,
  SponsorPartnerUpdateInput,
} from "@/types/certificates";

const SPONSORS_COLLECTION = "sponsors";

// ━━ Сървърен in-memory кеш (1 час TTL) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SPONSORS_MEMORY_TTL_MS = 60 * 60 * 1000; // 1 час
const sponsorsMemoryCache = new Map<
  string,
  { ts: number; data: SponsorPartner[] }
>();

function getMemoryCached(siteId: string): SponsorPartner[] | null {
  const entry = sponsorsMemoryCache.get(siteId);
  if (!entry) return null;
  if (Date.now() - entry.ts > SPONSORS_MEMORY_TTL_MS) {
    sponsorsMemoryCache.delete(siteId);
    return null;
  }
  return entry.data;
}

function setMemoryCache(siteId: string, data: SponsorPartner[]): void {
  sponsorsMemoryCache.set(siteId, { ts: Date.now(), data });
}

/** Изчиства сървърния кеш (при промяна на спонсор) */
export async function invalidateSponsorsCache(siteId: string): Promise<void> {
  sponsorsMemoryCache.delete(siteId);
}

export async function getSponsorsAction(
  siteId: "bkgalabovo" | "recoveryzone"
): Promise<{ success: boolean; data: SponsorPartner[]; error?: string }> {
  try {
    // Провери сървърния in-memory кеш първо
    const memoryCached = getMemoryCached(siteId);
    if (memoryCached) {
      return { success: true, data: memoryCached };
    }

    const snapshot = await readWithFallback(
      (db) =>
        db.collection(SPONSORS_COLLECTION).where("siteId", "==", siteId).get(),
      "getSponsors"
    );

    if (snapshot.empty) {
      // Върщаме начални партньори, ако няма налични записи в базата
      const defaults = DEFAULT_INITIAL_SPONSORS.filter(
        (s) => s.siteId === siteId
      ).map((s, idx) => ({
        ...s,
        id: `${siteId}_sponsor_default_${idx}`,
        createdAt: new Date().toISOString(),
      }));
      setMemoryCache(siteId, defaults);
      return { success: true, data: defaults };
    }

    const items: SponsorPartner[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        siteId: (data.siteId as "bkgalabovo" | "recoveryzone") || "bkgalabovo",
        name: String(data.name || ""),
        category: (data.category as SponsorCategory) || "general",
        logoUrl: String(data.logoUrl || ""),
        websiteUrl: data.websiteUrl ? String(data.websiteUrl) : undefined,
        description: data.description ? String(data.description) : undefined,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        order: typeof data.order === "number" ? data.order : 0,
        createdAt: String(data.createdAt || new Date().toISOString()),
        updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
      };
    });

    // Сортиране по order възходящо
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Запиши в сървърния кеш
    setMemoryCache(siteId, items);

    return { success: true, data: items };
  } catch (error) {
    console.error("Грешка при getSponsorsAction:", error);
    // Върщаме начални данни като безотказен fallback
    const defaults = DEFAULT_INITIAL_SPONSORS.filter(
      (s) => s.siteId === siteId
    ).map((s, idx) => ({
      ...s,
      id: `${siteId}_sponsor_default_${idx}`,
      createdAt: new Date().toISOString(),
    }));
    return {
      success: true,
      data: defaults,
      error: error instanceof Error ? error.message : "Грешка при зареждане",
    };
  }
}

/**
 * Създава нов партньор през Admin SDK
 */
export async function createSponsorAction(
  siteId: "bkgalabovo" | "recoveryzone",
  data: SponsorPartnerCreateInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const cleanData = JSON.parse(
      JSON.stringify({
        ...data,
        siteId,
        createdAt: new Date().toISOString(),
      })
    );
    const docRef = await writeWithFallback(
      (db) => db.collection(SPONSORS_COLLECTION).add(cleanData),
      "createSponsor"
    );
    invalidateSponsorsCache(siteId); // Изчисти кеша след запис
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Грешка при createSponsorAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Грешка при създаване",
    };
  }
}

/**
 * Обновява партньор през Admin SDK
 */
export async function updateSponsorAction(
  id: string,
  data: SponsorPartnerUpdateInput,
  siteId: "bkgalabovo" | "recoveryzone" = "bkgalabovo"
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanData = JSON.parse(
      JSON.stringify({
        ...data,
        siteId,
        updatedAt: new Date().toISOString(),
      })
    );
    await writeWithFallback(
      (db) =>
        db
          .collection(SPONSORS_COLLECTION)
          .doc(id)
          .set(cleanData, { merge: true }),
      "updateSponsor"
    );
    invalidateSponsorsCache(siteId); // Изчисти кеша след обновяване
    return { success: true };
  } catch (error) {
    console.error("Грешка при updateSponsorAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Грешка при обновяване",
    };
  }
}

/**
 * Превключва активност на партньор през Admin SDK
 */
export async function toggleSponsorActiveAction(
  id: string,
  isActive: boolean,
  siteId: "bkgalabovo" | "recoveryzone" = "bkgalabovo"
): Promise<{ success: boolean; error?: string }> {
  try {
    await writeWithFallback(
      (db) =>
        db.collection(SPONSORS_COLLECTION).doc(id).set(
          {
            isActive,
            siteId,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ),
      "toggleSponsorActive"
    );
    invalidateSponsorsCache(siteId); // Изчисти кеша
    return { success: true };
  } catch (error) {
    console.error("Грешка при toggleSponsorActiveAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при промяна на активност",
    };
  }
}

/**
 * Изтрива партньор през Admin SDK
 */
export async function deleteSponsorAction(
  id: string,
  siteId: "bkgalabovo" | "recoveryzone" = "bkgalabovo"
): Promise<{ success: boolean; error?: string }> {
  try {
    if (id.includes("_sponsor_default_")) {
      return { success: true };
    }

    await writeWithFallback(
      (db) => db.collection(SPONSORS_COLLECTION).doc(id).delete(),
      "deleteSponsor"
    );
    invalidateSponsorsCache(siteId); // Изчисти кеша след изтриване
    return { success: true };
  } catch (error) {
    console.error("Грешка при deleteSponsorAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Грешка при изтриване",
    };
  }
}

/**
 * Записва препоръчителните партньори в базата през Admin SDK
 */
export async function seedInitialSponsorsAction(
  siteId: "bkgalabovo" | "recoveryzone"
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const list = DEFAULT_INITIAL_SPONSORS.filter((s) => s.siteId === siteId);
    const now = new Date().toISOString();

    for (const item of list) {
      await writeWithFallback(
        (db) =>
          db.collection(SPONSORS_COLLECTION).add({
            ...item,
            siteId,
            createdAt: now,
          }),
        "seedInitialSponsors"
      );
    }

    return { success: true, count: list.length };
  } catch (error) {
    console.error("Грешка при seedInitialSponsorsAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Грешка при инициализация",
    };
  }
}
