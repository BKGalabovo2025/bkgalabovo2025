import { z } from "zod";

export const ParentRoleSchema = z.enum(["mother", "father", "guardian"]);
export type ParentRole = z.infer<typeof ParentRoleSchema>;

export const ParentMemberPermissionsSchema = z.object({
  showBirthDate: z.boolean().default(false),
  showAgeGroup: z.boolean().default(false),
  showPhone: z.boolean().default(false),
  showAddress: z.boolean().default(false),
  showSchool: z.boolean().default(false),
  showHeight: z.boolean().default(false),
  showWeight: z.boolean().default(false),
  showDominantHand: z.boolean().default(false),
  showApparelSize: z.boolean().default(false),
  showEmergencyContact: z.boolean().default(false),
  showHealthNotes: z.boolean().default(false),
  showAttendance: z.boolean().default(true),
  showStatusBadge: z.boolean().default(true),
  showNextTrainingCard: z.boolean().default(true),
});
export type ParentMemberPermissions = z.infer<
  typeof ParentMemberPermissionsSchema
>;

export const DefaultParentMemberPermissions: ParentMemberPermissions = {
  showBirthDate: false,
  showAgeGroup: false,
  showPhone: false,
  showAddress: false,
  showSchool: false,
  showHeight: false,
  showWeight: false,
  showDominantHand: false,
  showApparelSize: false,
  showEmergencyContact: false,
  showHealthNotes: false,
  showAttendance: true,
  showStatusBadge: true,
  showNextTrainingCard: true,
};

export const ParentAccessRequestSchema = z.object({
  id: z.string(),
  siteId: z.literal("bkgalabovo").default("bkgalabovo"),
  parentName: z.string().min(2, "Името на родителя е задължително"),
  parentPhone: z.string().min(6, "Невалиден телефонен номер"),
  parentEmail: z.string().email("Невалиден имейл адрес"),
  passwordHash: z.string().min(1, "Липсва хеш на паролата"),
  parentRole: ParentRoleSchema.default("guardian"),
  childFullName: z.string().min(2, "Името на детето е задължително"),
  childBirthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Невалидна дата на раждане (ГГГГ-ММ-ДД)"),
  matchedMemberId: z.string().nullable().optional(),
  matchedFamilyId: z.string().nullable().optional(),
  isSecondParent: z.boolean().default(false),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  rejectionReason: z.string().nullable().optional(),
  createdAt: z.string(),
  reviewedAt: z.string().nullable().optional(),
  reviewedBy: z.string().nullable().optional(),
});
export type ParentAccessRequest = z.infer<typeof ParentAccessRequestSchema>;

export const ParentUserSchema = z.object({
  id: z.string(),
  siteId: z.literal("bkgalabovo").default("bkgalabovo"),
  name: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
  passwordHash: z.string(),
  parentRole: ParentRoleSchema.default("guardian"),
  status: z.enum(["active", "suspended"]).default("active"),
  linkedMemberIds: z.array(z.string()).default([]),
  familyId: z.string().nullable().optional(),
  permissionsPerMember: z
    .record(z.string(), ParentMemberPermissionsSchema)
    .default({}),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastLoginAt: z.string().nullable().optional(),
  lastActiveAt: z.string().nullable().optional(),
  lastAction: z.string().nullable().optional(),
  lastActionAt: z.string().nullable().optional(),
});
export type ParentUser = z.infer<typeof ParentUserSchema>;

export const ParentAbsenceReasonSchema = z.enum([
  "illness",
  "school",
  "travel",
  "injury",
  "other",
]);
export type ParentAbsenceReason = z.infer<typeof ParentAbsenceReasonSchema>;

export const ParentAbsenceSchema = z.object({
  id: z.string(),
  siteId: z.literal("bkgalabovo").default("bkgalabovo"),
  parentUserId: z.string(),
  parentName: z.string(),
  memberId: z.string(),
  memberName: z.string(),
  type: z.enum(["single_day", "period"]).default("single_day"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Невалидна начална дата (ГГГГ-ММ-ДД)"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Невалидна крайна дата (ГГГГ-ММ-ДД)")
    .nullable()
    .optional(),
  reason: ParentAbsenceReasonSchema,
  note: z.string().optional(),
  status: z
    .enum(["submitted", "seen", "cancelled_by_parent"])
    .default("submitted"),
  coachReply: z.string().optional(),
  createdAt: z.string(),
  reviewedAt: z.string().nullable().optional(),
});
export type ParentAbsence = z.infer<typeof ParentAbsenceSchema>;

export const DataCorrectionRequestSchema = z.object({
  id: z.string(),
  siteId: z.literal("bkgalabovo").default("bkgalabovo"),
  parentUserId: z.string(),
  parentName: z.string(),
  memberId: z.string(),
  memberName: z.string(),
  fieldKey: z.string().min(1),
  fieldLabel: z.string().min(1),
  currentValue: z.string(),
  proposedValue: z.string().min(1, "Новата стойност е задължителна"),
  note: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  adminComment: z.string().optional(),
  createdAt: z.string(),
  resolvedAt: z.string().nullable().optional(),
});
export type DataCorrectionRequest = z.infer<typeof DataCorrectionRequestSchema>;

export const ParentActivityLogSchema = z.object({
  id: z.string(),
  siteId: z.literal("bkgalabovo").default("bkgalabovo"),
  parentUserId: z.string(),
  parentName: z.string(),
  parentRole: ParentRoleSchema.default("guardian"),
  memberId: z.string().nullable().optional(),
  memberName: z.string().nullable().optional(),
  action: z.enum([
    "login",
    "view_dashboard",
    "view_attendance",
    "view_schedule",
    "view_profile",
    "submit_absence",
    "submit_correction",
    "change_password",
  ]),
  actionTitle: z.string(),
  details: z.string().optional(),
  timestamp: z.string(),
});
export type ParentActivityLog = z.infer<typeof ParentActivityLogSchema>;

export interface ParentAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: "info" | "warning";
  startDate?: string;
  endDate?: string;
  periodText?: string;
  location?: string;
  description?: string;
  tournamentUrl?: string | null;
  tournamentId?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  imageUrl?: string | null;
  isTournament?: boolean;
  type?: string;
}
