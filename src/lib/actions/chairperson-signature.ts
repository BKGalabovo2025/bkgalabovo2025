"use server";
import "server-only";

import { revalidatePath } from "next/cache";

import { ensureAdmin } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";
import type { ActionResult } from "@/types/document-template.types";

export interface ChairpersonSignatureData {
  signatureUrl: string | null;
  updatedAt: string | null;
  updatedBy?: string | null;
}

/**
 * Fetches the saved global digital signature of the Club Chairperson (Мира Георгиева).
 */
export async function getChairpersonSignatureAction(): Promise<
  ActionResult<ChairpersonSignatureData>
> {
  try {
    const adminDb = getAdminDb();
    const snap = await adminDb
      .collection("club_settings")
      .doc("chairperson")
      .get();

    if (!snap.exists) {
      return {
        success: true,
        data: { signatureUrl: null, updatedAt: null },
      };
    }

    const data = snap.data() || {};
    return {
      success: true,
      data: {
        signatureUrl: (data.signatureUrl as string) || null,
        updatedAt: (data.updatedAt as string) || null,
        updatedBy: (data.updatedBy as string) || null,
      },
    };
  } catch (error) {
    console.error("Error fetching chairperson signature:", error);
    return {
      success: false,
      error: "Грешка при зареждане на подписа на председателя.",
      data: { signatureUrl: null, updatedAt: null },
    };
  }
}

/**
 * Saves/updates the global digital signature of the Club Chairperson.
 */
export async function saveChairpersonSignatureAction(input: {
  signatureBase64: string;
  idToken: string;
}): Promise<ActionResult<{ signatureUrl: string }>> {
  try {
    const user = await ensureAdmin(input.idToken);
    const adminDb = getAdminDb();

    const updatedAt = new Date().toISOString();
    const docRef = adminDb.collection("club_settings").doc("chairperson");

    await docRef.set(
      {
        signatureUrl: input.signatureBase64,
        updatedAt,
        updatedBy: user.email || user.uid,
      },
      { merge: true }
    );

    revalidatePath("/members");
    revalidatePath("/documents");

    return {
      success: true,
      message: "Подписът на Председателя е запазен успешно!",
      data: { signatureUrl: input.signatureBase64 },
    };
  } catch (error) {
    console.error("Error saving chairperson signature:", error);
    return {
      success: false,
      error: "Грешка при запазване на подписа на председателя.",
    };
  }
}

/**
 * Removes the global digital signature of the Club Chairperson.
 */
export async function deleteChairpersonSignatureAction(input: {
  idToken: string;
}): Promise<ActionResult> {
  try {
    await ensureAdmin(input.idToken);
    const adminDb = getAdminDb();

    const docRef = adminDb.collection("club_settings").doc("chairperson");
    await docRef.set(
      {
        signatureUrl: null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return {
      success: true,
      message: "Подписът на Председателя беше изтрит успешно.",
    };
  } catch (error) {
    console.error("Error deleting chairperson signature:", error);
    return {
      success: false,
      error: "Грешка при изтриване на подписа.",
    };
  }
}
