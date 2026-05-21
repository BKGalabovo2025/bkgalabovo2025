"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { ensureAdmin } from "@/lib/auth-utils";
import { FieldValue } from "firebase-admin/firestore";
import { MemberSchema } from "@/types/member.types";

// --- Type for Server Action State ---
export type MemberActionState = {
  errors?: { [key: string]: string[] | undefined };
  message?: string | null;
  success?: boolean;
  data?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

// --- Public Server Actions ---

/**
 * Creates a new member using Server Actions.
 */
export async function createMemberAction(
  idToken: string,
  memberData: Record<string, unknown>
): Promise<MemberActionState> {
  try {
    const user = await ensureAdmin(idToken);
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
      hasSignedDeclaration: false,
      hasMedicalCertificate: false,
      isLicensed: false,
      ...data,
      name,
      registrationDate: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: { uid: user.uid, email: user.email },
    });

    // If member is created with a familyId, update the family document
    if (data.familyId) {
      await adminDb
        .collection("families")
        .doc(data.familyId as string)
        .update({
          memberIds: FieldValue.arrayUnion(docRef.id),
          updatedAt: FieldValue.serverTimestamp(),
        });
      revalidatePath(`/families/${data.familyId}`);
    }

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
  memberData: Record<string, unknown>
): Promise<MemberActionState> {
  try {
    const user = await ensureAdmin(idToken);
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

    // Handle family changes if familyId is provided in the update
    if (data.familyId !== undefined && data.familyId !== currentData.familyId) {
      // Remove from old family
      if (currentData.familyId) {
        await adminDb
          .collection("families")
          .doc(currentData.familyId)
          .update({
            memberIds: FieldValue.arrayRemove(id),
            updatedAt: FieldValue.serverTimestamp(),
          });
        revalidatePath(`/families/${currentData.familyId}`);
      }

      // Add to new family
      if (data.familyId) {
        await adminDb
          .collection("families")
          .doc(data.familyId as string)
          .update({
            memberIds: FieldValue.arrayUnion(id),
            updatedAt: FieldValue.serverTimestamp(),
          });
        revalidatePath(`/families/${data.familyId}`);
      }
    }

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
    await ensureAdmin(idToken);
    const adminDb = getAdminDb();

    const memberRef = adminDb.collection("members").doc(id);
    const memberSnap = await memberRef.get();

    if (memberSnap.exists) {
      const data = memberSnap.data();
      const familyId = data?.familyId;

      if (familyId) {
        const familyRef = adminDb.collection("families").doc(familyId);
        await familyRef.update({
          memberIds: FieldValue.arrayRemove(id),
          updatedAt: FieldValue.serverTimestamp(),
        });

        const familySnap = await familyRef.get();
        const familyData = familySnap.data();
        if (
          familyData &&
          (!familyData.memberIds || familyData.memberIds.length === 0)
        ) {
          await familyRef.delete();
          revalidatePath("/families");
        } else {
          revalidatePath(`/families/${familyId}`);
        }
      }
    }

    await memberRef.delete();

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

/**
 * Bulk updates the status of multiple members.
 */
export async function bulkUpdateMemberStatusAction(
  memberIds: string[],
  status: "active" | "inactive" | "suspended",
  idToken: string
): Promise<MemberActionState> {
  try {
    await ensureAdmin(idToken);
    const adminDb = getAdminDb();
    const batch = adminDb.batch();

    memberIds.forEach((id) => {
      const memberRef = adminDb.collection("members").doc(id);
      batch.update(memberRef, {
        status,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    revalidatePath("/members");

    return {
      success: true,
      message: `Успешно обновени ${memberIds.length} членове.`,
    };
  } catch (error: unknown) {
    console.error("bulkUpdateMemberStatusAction Error:", error);
    return {
      success: false,
      message: "Грешка при масово обновяване на статуса.",
    };
  }
}
