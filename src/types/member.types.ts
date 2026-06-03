import { z } from "zod";

/**
 * Zod schema for validating club member data.
 * This schema ensures that data retrieved from Firestore conforms to the expected structure
 * before being used in the application, including robust date validation.
 */
export const MemberSchema = z.object({
  // --- Core Fields ---
  id: z.string().min(1, "ID is a required field."),
  siteId: z.string().min(1, "Site ID is required."), // Added for multi-tenancy
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  name: z.string(), // This is a derived field, added in the code, not in the database
  status: z.enum(["active", "inactive", "suspended"]),
  ageGroup: z.string().nullable().optional(), // Calculated age group for the current year

  // --- Date Fields (as ISO strings) ---
  registrationDate: z
    .string()
    .datetime({ message: "Invalid registration date format" }),
  updatedAt: z
    .string()
    .datetime({ message: "Invalid update date format" })
    .optional(),
  lastPaymentDate: z
    .string()
    .datetime({ message: "Invalid last payment date format" })
    .nullable()
    .optional(),
  dateOfBirth: z.string().nullable().optional(),

  // --- Optional Contact & Personal Info ---
  middleName: z.string().nullable().optional(),
  gender: z.enum(["male", "female"]).nullable().optional(),
  email: z
    .union([
      z.string().trim().email({ message: "Invalid email address" }),
      z.literal(""),
      z.null(),
      z.undefined(),
    ])
    .optional(),
  phone: z.string().nullable().optional(),
  phoneType: z.enum(["personal", "parent"]).nullable().optional(),
  avatarUrl: z.string().url("Invalid avatar URL").nullable().optional(),
  educationInstitution: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),

  // --- ADDED: Emergency Contact ---
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),

  // --- ADDED: Apparel ---
  apparelSize: z.string().nullable().optional(),

  // --- Family & Relations ---
  familyId: z.string().nullable().optional(),
  relatedMemberId: z.string().nullable().optional(), // Used for family subscriptions

  // --- Skill & Ranking ---
  skillLevel: z
    .enum(["beginner", "intermediate", "advanced", "professional"])
    .nullable()
    .optional(),

  // --- Administrative & Documents ---
  hasSignedDeclaration: z.boolean().optional(),
  signedDeclarationPrintedAt: z.string().datetime().nullable().optional(),
  signedDeclarationHandedAt: z.string().datetime().nullable().optional(),
  signedDeclarationUrl: z.string().nullable().optional(),

  hasMedicalCertificate: z.boolean().optional(),
  medicalCertificateDate: z.string().datetime().nullable().optional(), // This is the date ON the certificate
  medicalCertificatePrintedAt: z.string().datetime().nullable().optional(),
  medicalCertificateHandedAt: z.string().datetime().nullable().optional(),
  medicalCertificateUrl: z.string().nullable().optional(),

  isLicensed: z.boolean().optional(),
  isLicensedPrintedAt: z.string().datetime().nullable().optional(),
  isLicensedHandedAt: z.string().datetime().nullable().optional(),
  isLicensedUrl: z.string().nullable().optional(),

  hasTravelDeclaration: z.boolean().optional(),
  travelDeclarationPrintedAt: z.string().datetime().nullable().optional(),
  travelDeclarationHandedAt: z.string().datetime().nullable().optional(),
  travelDeclarationUrl: z.string().nullable().optional(),

  hasSafetyInstruction: z.boolean().optional(),
  safetyInstructionPrintedAt: z.string().datetime().nullable().optional(),
  safetyInstructionHandedAt: z.string().datetime().nullable().optional(),
  safetyInstructionUrl: z.string().nullable().optional(),

  hasInternalRules: z.boolean().optional(),
  internalRulesPrintedAt: z.string().datetime().nullable().optional(),
  internalRulesHandedAt: z.string().datetime().nullable().optional(),
  internalRulesUrl: z.string().nullable().optional(),

  membershipApplicationPrintedAt: z.string().datetime().nullable().optional(),
  membershipApplicationHandedAt: z.string().datetime().nullable().optional(),
  hasMembershipApplication: z.boolean().optional(),
  membershipApplicationUrl: z.string().nullable().optional(),

  terminationRequestPrintedAt: z.string().datetime().nullable().optional(),
  terminationRequestHandedAt: z.string().datetime().nullable().optional(),
  hasTerminationRequest: z.boolean().optional(),
  terminationRequestUrl: z.string().nullable().optional(),

  // --- Miscellaneous ---
  suspended: z.boolean().optional(),
  analysisCache: z.unknown().nullable().optional(),
  isGuest: z.boolean().optional(),
  memberType: z.enum(["regular", "guest"]).catch("regular").optional(),
});

/**
 * TypeScript type inferred from the Zod schema.
 * This type is used throughout the application to ensure type safety.
 */
export type Member = z.infer<typeof MemberSchema>;

/**
 * Data required to create or update a member.
 */
export type MemberFormData = Omit<
  Member,
  "id" | "name" | "registrationDate" | "updatedAt"
>;
