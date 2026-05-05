"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth-utils";
import { FieldValue } from "firebase-admin/firestore";
import { MemberSchema } from "@/types/member.types";

// --- Type for Server Action State ---
export type MemberActionState = {
  errors?: { [key: string]: string[] | undefined };
  message?: string | null;
  success?: boolean;
  data?: any;
};

// --- Public Server Actions ---

/**
 * Creates a new member using Server Actions.
 */
export async function createMemberAction(
  idToken: string,
  memberData: any
): Promise<MemberActionState> {
  try {
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();

    // Validation
    const validatedFields = MemberSchema.omit({
      id: true,
      name: true,
      registrationDate: true,
      updatedAt: true,
    }).safeParse(memberData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Грешка при валидация на данните.",
      };
    }

    const data = validatedFields.data;
    const name = [data.firstName, data.middleName, data.lastName]
      .filter(Boolean)
      .join(" ");

    const docRef = await adminDb.collection("members").add({
      ...data,
      name,
      registrationDate: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: { uid: user.uid, email: user.email },
    });

    revalidatePath("/members");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Членът ${name} бе създаден успешно.`,
      data: { id: docRef.id },
    };
  } catch (error: unknown) {
    console.error("createMemberAction Error:", error);
    return {
      success: false,
      message: `Сървърна грешка: ${error instanceof Error ? error.message : "Неизвестна грешка"}`,
    };
  }
}

/**
 * Updates an existing member.
 */
export async function updateMemberAction(
  id: string,
  idToken: string,
  memberData: any
): Promise<MemberActionState> {
  try {
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();

    // Validation (allow partial updates)
    const validatedFields = MemberSchema.omit({
      id: true,
      name: true,
      registrationDate: true,
      updatedAt: true,
    })
      .partial()
      .safeParse(memberData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Грешка при валидация на данните.",
      };
    }

    const memberRef = adminDb.collection("members").doc(id);
    const data = validatedFields.data;

    // Recalculate name if name parts changed
    const currentSnap = await memberRef.get();
    if (!currentSnap.exists) throw new Error("Member not found.");
    const currentData = currentSnap.data()!;

    const firstName = data.firstName ?? currentData.firstName;
    const middleName = data.middleName ?? currentData.middleName;
    const lastName = data.lastName ?? currentData.lastName;

    const name = [firstName, middleName, lastName].filter(Boolean).join(" ");

    await memberRef.update({
      ...data,
      name,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: { uid: user.uid, email: user.email },
    });

    revalidatePath("/members");
    revalidatePath(`/members/${id}`);

    return {
      success: true,
      message: "Данните на члена бяха актуализирани.",
    };
  } catch (error: unknown) {
    console.error("updateMemberAction Error:", error);
    return {
      success: false,
      message: "Грешка при актуализиране на данните.",
    };
  }
}

/**
 * Deletes a member.
 */
export async function deleteMemberAction(
  id: string,
  idToken: string
): Promise<MemberActionState> {
  try {
    await getAuthUser(idToken);
    const adminDb = getAdminDb();

    await adminDb.collection("members").doc(id).delete();

    revalidatePath("/members");

    return {
      success: true,
      message: "Членът бе изтрит успешно.",
    };
  } catch (error: unknown) {
    console.error("deleteMemberAction Error:", error);
    return {
      success: false,
      message: "Грешка при изтриване на члена.",
    };
  }
}
