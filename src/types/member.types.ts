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
  status: z
    .enum(["active", "inactive", "suspended"])
    .catch("active")
    .optional(),
  ageGroup: z.string().nullable().optional(), // Calculated age group for the current year
  isCoach: z.boolean().optional(),

  // --- Date Fields (as ISO strings or dates) ---
  registrationDate: z.string(),
  updatedAt: z.string().optional(),
  lastPaymentDate: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),

  // --- Optional Contact & Personal Info ---
  middleName: z.string().nullable().optional(),
  egn: z.string().nullable().optional(),
  birthPlace: z.string().nullable().optional(),
  gender: z
    .union([z.enum(["male", "female"]), z.literal(""), z.null(), z.undefined()])
    .optional(),
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
  avatarUrl: z.string().nullable().optional(),
  educationInstitution: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  healthConditionNotes: z.string().nullable().optional(),
  injuries: z
    .array(
      z.enum(["knee", "shoulder", "lower-back", "achilles", "ankle", "wrist"])
    )
    .optional(),

  // --- Biometric & Playing Style ---
  dominantHand: z.enum(["left", "right"]).nullable().optional(),
  heightCm: z.number().positive().nullable().optional(),
  weightKg: z.number().positive().nullable().optional(),

  // --- ADDED: Emergency Contact ---
  hasEmergencyContact: z.boolean().optional(),
  emergencyContactRole: z.string().nullable().optional(),
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),

  // --- Parent & Guardian Contact ---
  parentName: z.string().nullable().optional(),
  parentPhone: z.string().nullable().optional(),
  parentEmail: z.string().nullable().optional(),
  parentAddress: z.string().nullable().optional(),
  secondParentName: z.string().nullable().optional(),
  secondParentPhone: z.string().nullable().optional(),
  fatherName: z.string().nullable().optional(),
  fatherPhone: z.string().nullable().optional(),
  fatherCity: z.string().nullable().optional(),
  fatherEGN: z.string().nullable().optional(),
  motherName: z.string().nullable().optional(),
  motherPhone: z.string().nullable().optional(),
  motherCity: z.string().nullable().optional(),
  motherEGN: z.string().nullable().optional(),

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
  isSkillLevelAutoCalculated: z.boolean().optional(),
  skillLevelPoints: z.number().optional(),
  rankingPoints: z.number().optional(),
  rankingPosition: z.number().optional(),
  showOnPublicTeam: z.boolean().optional(),

  // --- Administrative & Documents ---
  hasSignedDeclaration: z.boolean().optional(),
  signedDeclarationPrintedAt: z.string().nullable().optional(),
  signedDeclarationHandedAt: z.string().nullable().optional(),
  signedDeclarationUrl: z.string().nullable().optional(),

  hasMedicalCertificate: z.boolean().optional(),
  medicalCertificateDate: z.string().nullable().optional(), // This is the date ON the certificate
  medicalCertificatePrintedAt: z.string().nullable().optional(),
  medicalCertificateHandedAt: z.string().nullable().optional(),
  medicalCertificateUrl: z.string().nullable().optional(),

  isLicensed: z.boolean().optional(),
  isLicensedPrintedAt: z.string().nullable().optional(),
  isLicensedHandedAt: z.string().nullable().optional(),
  isLicensedUrl: z.string().nullable().optional(),

  hasTravelDeclaration: z.boolean().optional(),
  travelDeclarationPrintedAt: z.string().nullable().optional(),
  travelDeclarationHandedAt: z.string().nullable().optional(),
  travelDeclarationUrl: z.string().nullable().optional(),

  hasSafetyInstruction: z.boolean().optional(),
  safetyInstructionPrintedAt: z.string().nullable().optional(),
  safetyInstructionHandedAt: z.string().nullable().optional(),
  safetyInstructionUrl: z.string().nullable().optional(),

  hasInternalRules: z.boolean().optional(),
  internalRulesPrintedAt: z.string().nullable().optional(),
  internalRulesHandedAt: z.string().nullable().optional(),
  internalRulesUrl: z.string().nullable().optional(),
  internalRulesSignatureUrl: z.string().nullable().optional(),

  membershipApplicationPrintedAt: z.string().nullable().optional(),
  membershipApplicationHandedAt: z.string().nullable().optional(),
  hasMembershipApplication: z.boolean().optional(),
  membershipApplicationUrl: z.string().nullable().optional(),
  membershipApplicationSignatureUrl: z.string().nullable().optional(),

  terminationRequestPrintedAt: z.string().nullable().optional(),
  terminationRequestHandedAt: z.string().nullable().optional(),
  hasTerminationRequest: z.boolean().optional(),
  terminationRequestUrl: z.string().nullable().optional(),
  terminationRequestSignatureUrl: z.string().nullable().optional(),

  amateurContractPrintedAt: z.string().nullable().optional(),
  amateurContractHandedAt: z.string().nullable().optional(),
  hasAmateurContract: z.boolean().optional(),
  amateurContractUrl: z.string().nullable().optional(),
  amateurContractSignatureUrl: z.string().nullable().optional(),

  licenseApplicationPrintedAt: z.string().nullable().optional(),
  licenseApplicationHandedAt: z.string().nullable().optional(),
  hasLicenseApplication: z.boolean().optional(),
  licenseApplicationUrl: z.string().nullable().optional(),
  licenseApplicationSignatureUrl: z.string().nullable().optional(),

  safetyDeclarationSignatureUrl: z.string().nullable().optional(),

  // --- Miscellaneous ---
  suspended: z.boolean().optional(),
  analysisCache: z.unknown().nullable().optional(),
  isGuest: z.boolean().optional(),
  isClubMember: z.boolean().optional(),
  isRecoveryMember: z.boolean().optional(),
  memberType: z
    .enum(["regular", "guest", "recovery"])
    .catch("regular")
    .optional(),
  activeWorkoutProgram: z
    .object({
      programId: z.string(),
      title: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      targetGoal: z.string().optional(),
    })
    .nullable()
    .optional(),
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
> & { registrationDate?: string };
