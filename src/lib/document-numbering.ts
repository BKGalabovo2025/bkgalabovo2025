import "server-only";

import type { Firestore } from "firebase-admin/firestore";

import {
  DOCUMENT_NUMBER_CODES,
  DOCUMENT_NUMBER_LABELS,
  DocumentNumberChannel,
  DocumentNumberKey,
  DocumentNumberRecord,
  formatDocumentNumber,
} from "@/types/document-number.types";

export interface AllocateDocumentNumberInput {
  siteId: string;
  documentKey: DocumentNumberKey;
  memberId: string;
  memberName: string;
  channel: DocumentNumberChannel;
  requestId?: string | null;
  issuedBy?: { uid: string; email?: string };
  now?: Date;
}

/** Calendar year in club local time (Europe/Sofia). */
export function getClubYear(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Sofia",
    year: "numeric",
  }).format(date);
  return Number(parts);
}

/**
 * Atomically allocates the next club-wide document number and writes it to the
 * `document_numbers` register. The counter and the register entry are written
 * in one transaction, so a number can never be skipped or issued twice.
 */
export async function allocateDocumentNumber(
  adminDb: Firestore,
  input: AllocateDocumentNumberInput
): Promise<DocumentNumberRecord> {
  const now = input.now ?? new Date();
  const year = getClubYear(now);

  // Best effort: remember which template version the document was issued under.
  let templateId: string | null = null;
  let templateVersion: number | null = null;
  let documentTitle = DOCUMENT_NUMBER_LABELS[input.documentKey];
  try {
    const tplSnap = await adminDb
      .collection("document_templates")
      .doc(input.documentKey)
      .get();
    if (tplSnap.exists) {
      const tpl = tplSnap.data() || {};
      templateId = tplSnap.id;
      templateVersion = typeof tpl.version === "number" ? tpl.version : null;
      if (typeof tpl.title === "string" && tpl.title) documentTitle = tpl.title;
    }
  } catch {
    // Template catalog not available - the number is still issued.
  }

  const counterRef = adminDb
    .collection("document_counters")
    .doc(`${input.siteId}_${year}`);
  const recordRef = adminDb.collection("document_numbers").doc();

  let record!: DocumentNumberRecord;

  await adminDb.runTransaction(async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const lastSeq =
      counterSnap.exists && typeof counterSnap.data()?.lastSeq === "number"
        ? (counterSnap.data()?.lastSeq as number)
        : 0;
    const seq = lastSeq + 1;

    record = {
      id: recordRef.id,
      number: formatDocumentNumber(input.documentKey, year, seq),
      code: DOCUMENT_NUMBER_CODES[input.documentKey],
      year,
      seq,
      siteId: input.siteId,
      documentKey: input.documentKey,
      documentTitle,
      templateId,
      templateVersion,
      memberId: input.memberId,
      memberName: input.memberName,
      channel: input.channel,
      requestId: input.requestId ?? null,
      issuedAt: now.toISOString(),
      ...(input.issuedBy ? { issuedBy: input.issuedBy } : {}),
    };

    tx.set(
      counterRef,
      {
        siteId: input.siteId,
        year,
        lastSeq: seq,
        updatedAt: now.toISOString(),
      },
      { merge: true }
    );
    tx.set(recordRef, record);
  });

  return record;
}
