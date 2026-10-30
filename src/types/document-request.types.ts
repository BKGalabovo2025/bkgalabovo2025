import { z } from "zod";

export const DocumentTypeEnum = z.enum([
  "membershipApplication",
  "signedDeclaration",
  "safetyInstruction",
  "travelDeclaration",
  "internalRules",
  "terminationRequest",
  "amateurContract",
  "licenseApplication",
]);

export type DocumentType = z.infer<typeof DocumentTypeEnum>;

export const DOCUMENT_TITLES: Record<DocumentType, string> = {
  membershipApplication: "Молба за членство",
  signedDeclaration: "Декларация за информирано съгласие",
  safetyInstruction: "Инструктаж за безопасност при пътуване и състезания",
  travelDeclaration: "Съгласие за участие и пътуване",
  internalRules: "Вътрешен правилник на клуба",
  terminationRequest: "Молба за прекратяване на членство",
  amateurContract: "Договор за спортисти с аматьорски статут",
  licenseApplication: "Молба за картотекиране",
};

export const DocumentRequestStatusEnum = z.enum([
  "pending",
  "completed",
  "expired",
  "cancelled",
]);

export type DocumentRequestStatus = z.infer<typeof DocumentRequestStatusEnum>;

export const ParentDataSchema = z.object({
  parentName: z.string().min(1, "Името на родителя е задължително."),
  parentPhone: z.string().min(1, "Телефонът за връзка е задължителен."),
  parentEmail: z
    .union([
      z.string().trim().email("Невалиден имейл адрес."),
      z.literal(""),
      z.null(),
      z.undefined(),
    ])
    .optional(),
  parentAddress: z.string().nullable().optional(),
  secondParentName: z.string().nullable().optional(),
  secondParentPhone: z.string().nullable().optional(),
  participationType: z.string().nullable().optional(),
  agreedToRules: z.boolean().optional(),
  agreedToGdpr: z.boolean().optional(),
  agreedToMedia: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

export type ParentData = z.infer<typeof ParentDataSchema>;

export const DocumentRequestSchema = z.object({
  id: z.string(),
  token: z.string(),
  memberId: z.string(),
  memberName: z.string(),
  memberBirthDate: z.string().nullable().optional(),
  siteId: z.string(),
  documentType: DocumentTypeEnum,
  documentTitle: z.string(),
  status: DocumentRequestStatusEnum,
  createdAt: z.string(),
  expiresAt: z.string(),
  viewedByParentAt: z.string().nullable().optional(),
  sentToParentUserId: z.string().nullable().optional(),
  signedAt: z.string().nullable().optional(),
  signatureUrl: z.string().nullable().optional(),
  secondParentSignatureUrl: z.string().nullable().optional(),
  memberSignatureUrl: z.string().nullable().optional(),
  presidentSignatureUrl: z.string().nullable().optional(),
  presidentSignedAt: z.string().nullable().optional(),
  parentData: ParentDataSchema.nullable().optional(),
  templateId: z.string().nullable().optional(),
  templateVersion: z.number().int().min(1).nullable().optional(),
  documentLegalTextSnapshot: z.string().nullable().optional(),
  documentTitleSnapshot: z.string().nullable().optional(),
  createdBy: z
    .object({
      uid: z.string(),
      email: z.string().optional(),
    })
    .optional(),
  metadata: z
    .object({
      ip: z.string().optional(),
      userAgent: z.string().optional(),
    })
    .optional(),
});

export type DocumentRequest = z.infer<typeof DocumentRequestSchema>;

export interface PublicDocumentRequestDTO {
  id: string;
  token: string;
  memberId: string;
  memberName: string;
  memberBirthDate?: string | null;
  documentType: DocumentType;
  documentTitle: string;
  siteId: string;
  status: DocumentRequestStatus;
  createdAt: string;
  expiresAt: string;
  viewedByParentAt?: string | null;
  sentToParentUserId?: string | null;
  signedAt?: string | null;
  parentData?: ParentData | null;
  signatureUrl?: string | null;
  secondParentSignatureUrl?: string | null;
  memberSignatureUrl?: string | null;
  presidentSignatureUrl?: string | null;
  presidentSignedAt?: string | null;
  templateId?: string | null;
  templateVersion?: number | null;
  documentLegalTextSnapshot?: string | null;
  documentTitleSnapshot?: string | null;
}
