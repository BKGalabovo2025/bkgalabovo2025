"use server";
import "server-only";

import { ensureAdmin } from "@/lib/auth-utils";
import { allocateDocumentNumber } from "@/lib/document-numbering";
import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import {
  DocumentNumberRecord,
  isDocumentNumberKey,
} from "@/types/document-number.types";
import type { ActionResult } from "@/types/document-template.types";

/**
 * Issues a new document number when a member document is printed (Admin only).
 * Every call allocates a new number and writes it to the register.
 */
export async function issueDocumentNumberAction(input: {
  memberId: string;
  documentKey: string;
  idToken: string;
}): Promise<ActionResult<DocumentNumberRecord>> {
  try {
    const user = await ensureAdmin(input.idToken);

    if (!isDocumentNumberKey(input.documentKey)) {
      return { success: false, error: "Невалиден тип документ." };
    }

    const adminDb = getAdminDb();
    const memberDoc = await adminDb
      .collection("members")
      .doc(input.memberId)
      .get();
    if (!memberDoc.exists) {
      return { success: false, error: "Състезателят не е намерен." };
    }

    const memberData = memberDoc.data() || {};
    const memberName =
      (memberData.name as string) ||
      [memberData.firstName, memberData.middleName, memberData.lastName]
        .filter(Boolean)
        .join(" ") ||
      "Член на клуба";
    const siteId = (memberData.siteId as string) || "bkgalabovo";

    const record = await allocateDocumentNumber(adminDb, {
      siteId,
      documentKey: input.documentKey,
      memberId: input.memberId,
      memberName,
      channel: "print",
      issuedBy: { uid: user.uid, email: user.email || undefined },
    });

    return { success: true, data: record };
  } catch (err: unknown) {
    console.error("Error issuing document number:", err);
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Грешка при издаване на номер.",
    };
  }
}

/**
 * Re-reads an already issued number (e.g. after a page reload), so reopening
 * the same printout keeps its number. Only returns it if it belongs to the
 * given member and document.
 */
export async function getIssuedDocumentNumberAction(input: {
  id: string;
  memberId: string;
  documentKey: string;
  idToken: string;
}): Promise<ActionResult<DocumentNumberRecord>> {
  try {
    await ensureAdmin(input.idToken);
    const adminDb = getAdminDb();
    const snap = await adminDb
      .collection("document_numbers")
      .doc(input.id)
      .get();
    if (!snap.exists) {
      return { success: false, error: "Номерът не е намерен." };
    }
    const data = { id: snap.id, ...snap.data() } as DocumentNumberRecord;
    if (
      data.memberId !== input.memberId ||
      data.documentKey !== input.documentKey
    ) {
      return { success: false, error: "Номерът не съответства на документа." };
    }
    return {
      success: true,
      data: serializeFirestoreData(data) as DocumentNumberRecord,
    };
  } catch (err: unknown) {
    console.error("Error reading document number:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Грешка при зареждане.",
    };
  }
}

/**
 * Lists the club-wide register of issued document numbers (Admin only).
 */
export async function listDocumentNumbersAction(
  idToken: string,
  siteId: string = "bkgalabovo"
): Promise<ActionResult<DocumentNumberRecord[]>> {
  try {
    await ensureAdmin(idToken);
    const adminDb = getAdminDb();
    const snap = await adminDb
      .collection("document_numbers")
      .where("siteId", "==", siteId)
      .get();

    const records = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as DocumentNumberRecord[];

    // Sorted in memory to avoid needing a composite Firestore index.
    records.sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    );

    return {
      success: true,
      data: serializeFirestoreData(records) as DocumentNumberRecord[],
    };
  } catch (err: unknown) {
    console.error("Error listing document numbers:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Грешка при зареждане на регистъра.",
      data: [],
    };
  }
}
