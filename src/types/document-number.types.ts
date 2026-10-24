/**
 * Document numbering (club-wide register).
 * Format: <CODE>-<YEAR>-<SEQ6>, e.g. МЧ-2026-000123.
 * The sequence is a single club-wide counter per year, so every number is unique.
 */

export const DOCUMENT_NUMBER_KEYS = [
  "membershipApplication",
  "terminationRequest",
  "internalRules",
  "signedDeclaration",
  "travelDeclaration",
  "safetyInstruction",
  "medicalCertificate",
  "athleteCard",
  "amateurContract",
  "licenseApplication",
  "schoolRelease",
  "schoolAbsence",
  "custom",
] as const;

export type DocumentNumberKey = (typeof DOCUMENT_NUMBER_KEYS)[number];

export const DOCUMENT_NUMBER_CODES: Record<DocumentNumberKey, string> = {
  membershipApplication: "МЧ",
  terminationRequest: "ПР",
  internalRules: "ВП",
  signedDeclaration: "ДК",
  travelDeclaration: "СП",
  safetyInstruction: "ИБ",
  medicalCertificate: "МС",
  athleteCard: "КБ",
  amateurContract: "ДО",
  licenseApplication: "МК",
  schoolRelease: "ЗН",
  schoolAbsence: "УЗ",
  custom: "ДР",
};

export const DOCUMENT_NUMBER_LABELS: Record<DocumentNumberKey, string> = {
  membershipApplication: "Молба за членство",
  terminationRequest: "Молба за прекратяване на членство",
  internalRules: "Вътрешен правилник",
  signedDeclaration: "Декларация за информирано съгласие",
  travelDeclaration: "Съгласие за участие и пътуване",
  safetyInstruction: "Инструктаж за безопасност",
  medicalCertificate: "Медицинско свидетелство",
  athleteCard: "Картон на състезателя към БФБ",
  amateurContract: "Договор за спортисти с аматьорски статут",
  licenseApplication: "Молба за картотекиране в БФБ",
  schoolRelease: "Молба до директор – освобождаване от занималня",
  schoolAbsence: "Молба до директор – освобождаване от учебни занятия",
  custom: "Друг клубен документ",
};

export type DocumentNumberChannel = "print" | "online_link";

export interface DocumentNumberRecord {
  id: string;
  /** Human readable number, e.g. МЧ-2026-000123 */
  number: string;
  code: string;
  year: number;
  seq: number;
  siteId: string;
  documentKey: DocumentNumberKey;
  documentTitle: string;
  templateId?: string | null;
  templateVersion?: number | null;
  memberId: string;
  memberName: string;
  channel: DocumentNumberChannel;
  /** Linked online signing request (online_link channel only) */
  requestId?: string | null;
  /** ISO timestamp of issuance */
  issuedAt: string;
  issuedBy?: { uid: string; email?: string };
}

export function isDocumentNumberKey(
  value: unknown
): value is DocumentNumberKey {
  return (
    typeof value === "string" &&
    (DOCUMENT_NUMBER_KEYS as readonly string[]).includes(value)
  );
}

export function formatDocumentNumber(
  key: DocumentNumberKey,
  year: number,
  seq: number
): string {
  return `${DOCUMENT_NUMBER_CODES[key]}-${year}-${String(seq).padStart(6, "0")}`;
}

/** Formats an ISO timestamp for display as date (without time) in club local time (Europe/Sofia), e.g. "23.10.2026 г.". */
export function formatIssuedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dateStr = d.toLocaleDateString("bg-BG", {
    timeZone: "Europe/Sofia",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return dateStr.endsWith("г.") ? dateStr : `${dateStr} г.`;
}
