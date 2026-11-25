"use server";
import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

import { ensureAdmin } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { serverCache } from "@/lib/server-cache";

export async function addMemberToFamilyAction(
  familyId: string,
  memberId: string,
  idToken: string
) {
  try {
    await ensureAdmin(idToken);
    const adminDb = getAdminDb();

    const familyRef = adminDb.collection("families").doc(familyId);
    const memberRef = adminDb.collection("members").doc(memberId);

    // Update family document
    await familyRef.update({
      memberIds: FieldValue.arrayUnion(memberId),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Update member document
    await memberRef.update({
      familyId: familyId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    serverCache.invalidatePattern("members:");
    serverCache.invalidatePattern("families:");
    serverCache.invalidatePattern("parent-dashboard:");
    revalidatePath(`/families/${familyId}`);
    revalidatePath(`/members/${memberId}`);
    revalidatePath("/members");
    revalidatePath("/members/families");

    return { success: true, message: "Членът бе добавен към семейството." };
  } catch (error) {
    console.error("addMemberToFamilyAction Error:", error);
    return {
      success: false,
      message: "Грешка при добавяне към семейството.",
    };
  }
}

export async function removeMemberFromFamilyAction(
  familyId: string,
  memberId: string,
  idToken: string
) {
  try {
    await ensureAdmin(idToken);
    const adminDb = getAdminDb();

    const familyRef = adminDb.collection("families").doc(familyId);
    const memberRef = adminDb.collection("members").doc(memberId);

    // Update family document
    await familyRef.update({
      memberIds: FieldValue.arrayRemove(memberId),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Check if family is now empty
    const familySnap = await familyRef.get();
    const familyData = familySnap.data();
    let familyDeleted = false;

    if (
      familyData &&
      (!familyData.memberIds || familyData.memberIds.length === 0)
    ) {
      await familyRef.delete();
      familyDeleted = true;
      revalidatePath("/families");
    }

    // Update member document
    await memberRef.update({
      familyId: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    serverCache.invalidatePattern("members:");
    serverCache.invalidatePattern("families:");
    serverCache.invalidatePattern("parent-dashboard:");
    revalidatePath(`/families/${familyId}`);
    revalidatePath(`/members/${memberId}`);
    revalidatePath("/members");
    revalidatePath("/members/families");

    return {
      success: true,
      message: familyDeleted
        ? "Членът бе премахнат и семейството бе изтрито, тъй като остана празно."
        : "Членът бе премахнат от семейството.",
      familyDeleted,
    };
  } catch (error) {
    console.error("removeMemberFromFamilyAction Error:", error);
    return {
      success: false,
      message: "Грешка при премахване от семейството.",
    };
  }
}

export async function createFamilyAction(
  name: string,
  idToken: string,
  siteId: string = "bkgalabovo"
) {
  try {
    const user = await ensureAdmin(idToken);
    const adminDb = getAdminDb();

    const familyRef = await adminDb.collection("families").add({
      name,
      siteId,
      memberIds: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: { uid: user.uid, email: user.email },
    });

    serverCache.invalidatePattern("families:");
    revalidatePath("/members");
    revalidatePath("/members/families");

    return {
      success: true,
      message: "Семейството бе създадено успешно.",
      id: familyRef.id,
    };
  } catch (error) {
    console.error("createFamilyAction Error:", error);
    return {
      success: false,
      message: "Грешка при създаване на семейство.",
    };
  }
}

export async function updateFamilyNameAction(
  familyId: string,
  name: string,
  idToken: string
) {
  try {
    const user = await ensureAdmin(idToken);
    const adminDb = getAdminDb();

    await adminDb
      .collection("families")
      .doc(familyId)
      .update({
        name,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: { uid: user.uid, email: user.email },
      });

    serverCache.invalidatePattern("families:");
    revalidatePath(`/families/${familyId}`);
    revalidatePath("/members");
    revalidatePath("/members/families");

    return { success: true, message: "Името на семейството бе обновено." };
  } catch (error) {
    console.error("updateFamilyNameAction Error:", error);
    return {
      success: false,
      message: "Грешка при обновяване на името.",
    };
  }
}

export async function getFamiliesFeedAction(siteId?: string) {
  try {
    const user = await ensureAdmin();
    const allowedSites = (user as { allowedSites?: string[] }).allowedSites;
    if (
      siteId &&
      allowedSites &&
      allowedSites.length > 0 &&
      !allowedSites.includes(siteId)
    ) {
      return { success: false, families: [] };
    }

    const adminDb = getAdminDb();
    const rawFamilies = await serverCache.get(
      "families:all",
      async () => {
        const snap = await adminDb.collection("families").get();
        return snap.docs.map((d) => ({
          id: d.id,
          memberIds: [],
          ...d.data(),
        })) as Array<{
          id: string;
          siteId?: string;
          name?: string;
          memberIds: string[];
          [key: string]: unknown;
        }>;
      },
      3 * 60 * 1000
    );

    const families = rawFamilies
      .filter((d) => {
        const docSiteId = d.siteId;
        if (
          docSiteId &&
          allowedSites &&
          allowedSites.length > 0 &&
          !allowedSites.includes(docSiteId)
        ) {
          return false;
        }
        if (siteId && docSiteId && docSiteId !== siteId) {
          return false;
        }
        return true;
      })
      .map((d) => serializeFirestoreData(d));
    return { success: true, families };
  } catch (error) {
    console.error("getFamiliesFeedAction Error:", error);
    return { success: false, families: [] };
  }
}
