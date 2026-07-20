"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth-utils";
import { FieldValue } from "firebase-admin/firestore";

export async function addMemberToFamilyAction(
  familyId: string,
  memberId: string,
  idToken: string
) {
  try {
    await getAuthUser(idToken);
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

    revalidatePath(`/families/${familyId}`);
    revalidatePath(`/members/${memberId}`);
    revalidatePath("/members");

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
    await getAuthUser(idToken);
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

    revalidatePath(`/families/${familyId}`);
    revalidatePath(`/members/${memberId}`);
    revalidatePath("/members");

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

export async function createFamilyAction(name: string, idToken: string) {
  try {
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();

    const familyRef = await adminDb.collection("families").add({
      name,
      memberIds: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: { uid: user.uid, email: user.email },
    });

    revalidatePath("/members");

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
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();

    await adminDb
      .collection("families")
      .doc(familyId)
      .update({
        name,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: { uid: user.uid, email: user.email },
      });

    revalidatePath(`/families/${familyId}`);
    revalidatePath("/members");

    return { success: true, message: "Името на семейството бе обновено." };
  } catch (error) {
    console.error("updateFamilyNameAction Error:", error);
    return {
      success: false,
      message: "Грешка при обновяване на името.",
    };
  }
}
