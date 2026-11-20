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

    const data = snap.exists ? snap.data() || {} : {};
    let sigUrl = (data.signatureUrl as string) || null;
    let updatedAt = (data.updatedAt as string) || null;
    let updatedBy = (data.updatedBy as string) || null;

    // Fallback: If not in club_settings, load from Mira Georgieva's profile in members
    if (!sigUrl) {
      const miraSnap = await adminDb
        .collection("members")
        .where("firstName", "==", "Мира")
        .where("lastName", "==", "Георгиева")
        .limit(1)
        .get();

      if (!miraSnap.empty) {
        const mData = miraSnap.docs[0].data();
        if (mData.signature && typeof mData.signature === "string") {
          sigUrl = mData.signature;
          updatedAt =
            (mData.signatureUpdatedAt as string) || new Date().toISOString();
          updatedBy = "mira_georgieva_profile";

          // Auto-sync into club_settings/chairperson
          await adminDb.collection("club_settings").doc("chairperson").set(
            {
              signatureUrl: sigUrl,
              updatedAt,
              updatedBy,
            },
            { merge: true }
          );
        }
      }
    }

    return {
      success: true,
      data: {
        signatureUrl: sigUrl,
        updatedAt,
        updatedBy,
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

    // Also mirror to Mira Georgieva's member profile
    try {
      const miraSnap = await adminDb
        .collection("members")
        .where("firstName", "==", "Мира")
        .where("lastName", "==", "Георгиева")
        .limit(1)
        .get();

      if (!miraSnap.empty) {
        await miraSnap.docs[0].ref.update({
          signature: input.signatureBase64,
          signatureUpdatedAt: updatedAt,
          updatedAt,
        });
      }
    } catch (miraErr) {
      console.warn(
        "Could not mirror chairperson signature to Mira member profile:",
        miraErr
      );
    }

    revalidatePath("/members");
    revalidatePath("/documents");
    revalidatePath("/accounting/trips");

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
