"use server";
import "server-only";

import { logAuditEvent } from "@/lib/audit-logger";
import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";
import { SignedDeclaration } from "@/types";

export type DeclarationActionResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
};

/**
 * Get all signed declarations for a specific member using Admin SDK.
 */
export async function getMemberDeclarationsAction(
  memberId: string
): Promise<DeclarationActionResponse<SignedDeclaration[]>> {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) {
      return { success: false, message: "Неоторизиран достъп." };
    }

    const adminDb = getAdminDb();
    const snapshot = await adminDb
      .collection("member_declarations")
      .where("memberId", "==", memberId)
      .get();

    const list: SignedDeclaration[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        signedAt:
          typeof data.signedAt === "string"
            ? data.signedAt
            : data.signedAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
      } as SignedDeclaration;
    });

    list.sort(
      (a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()
    );

    return { success: true, data: list };
  } catch (error) {
    console.error("Error in getMemberDeclarationsAction:", error);
    return {
      success: false,
      message: "Грешка при извличане на декларациите.",
      data: [],
    };
  }
}

/**
 * Get all signed declarations across the platform using Admin SDK.
 */
export async function getAllDeclarationsAction(): Promise<
  DeclarationActionResponse<SignedDeclaration[]>
> {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) {
      return { success: false, message: "Неоторизиран достъп." };
    }

    const adminDb = getAdminDb();
    const snapshot = await adminDb.collection("member_declarations").get();

    const list: SignedDeclaration[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        signedAt:
          typeof data.signedAt === "string"
            ? data.signedAt
            : data.signedAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
      } as SignedDeclaration;
    });

    list.sort(
      (a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()
    );

    return { success: true, data: list };
  } catch (error) {
    console.error("Error in getAllDeclarationsAction:", error);
    return {
      success: false,
      message: "Грешка при извличане на декларациите.",
      data: [],
    };
  }
}

/**
 * Delete a signed declaration using Admin SDK.
 */
export async function deleteDeclarationAction(
  declarationId: string
): Promise<DeclarationActionResponse<void>> {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) {
      return { success: false, message: "Неоторизиран достъп." };
    }

    const adminDb = getAdminDb();
    const docRef = adminDb.collection("member_declarations").doc(declarationId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { success: false, message: "Декларацията не е намерена." };
    }

    const data = docSnap.data();
    await docRef.delete();

    await logAuditEvent({
      userId: user.uid,
      userEmail: user.email || "admin@bkgalabovo.com",
      action: "delete_declaration",
      details: `Изтрита декларация ${declarationId} за член ${data?.memberName || data?.memberId}`,
      targetId: declarationId,
    });

    return { success: true };
  } catch (error) {
    console.error("Error in deleteDeclarationAction:", error);
    return {
      success: false,
      message: "Грешка при изтриване на декларацията.",
    };
  }
}
