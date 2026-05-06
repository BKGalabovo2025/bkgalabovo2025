import { z } from "zod";

/**
 * Zod schema for validating club member data.
 * This schema ensures that data retrieved from Firestore conforms to the expected structure
 * before being used in the application, including robust date validation.
 */
export const MemberSchema = z.object({
  // --- Core Fields ---
  id: z.string().min(1, "ID is a required field."),
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
  dateOfBirth: z
    .string()
    .datetime({ message: "Invalid birth date format" })
    .nullable()
    .optional(),

  // --- Optional Contact & Personal Info ---
  middleName: z.string().nullable().optional(),
  gender: z.enum(["male", "female"]).nullable().optional(),
  email: z
    .string()
    .trim()
    .email({ message: "Невалиден имейл адрес" })
    .or(z.literal(""))
    .nullable()
    .optional(),
  phone: z.string().nullable().optional(),
  phoneType: z.enum(["personal", "parent"]).nullable().optional(),
  avatarUrl: z.string().url("Invalid avatar URL").nullable().optional(),
  educationInstitution: z.string().nullable().optional(),
  personalId: z.string().nullable().optional(),
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
  rating: z.number().min(0).max(3000).nullable().optional(),

  // --- Administrative & Documents ---
  hasSignedDeclaration: z.boolean().default(false).optional(),
  hasMedicalCertificate: z.boolean().default(false).optional(),
  medicalCertificateDate: z.string().datetime().nullable().optional(),
  isLicensed: z.boolean().default(false).optional(),

  // --- Miscellaneous ---
  suspended: z.boolean().optional(),
  analysisCache: z.unknown().nullable().optional(),
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
