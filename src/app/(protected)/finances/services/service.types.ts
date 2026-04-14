import { z } from "zod";

// Схема за правилата за прекратяване
const CancellationPolicySchema = z.object({
  description: z.string().optional(),
  feeType: z.string().optional(),
  feeValue: z.number().optional(),
  isAllowed: z.boolean().optional(),
  longTermSicknessDiscount: z.number().optional(),
  noticePeriodDays: z.number().optional(),
});

// Схема за "прозореца" за плащане
const PaymentRulesWindowSchema = z.object({
  endDay: z.number(),
  startDay: z.number(),
});

// Схема за тригер на специални права
const SpecialRightTriggerSchema = z.object({
  condition: z.string(), // e.g., "AFTER_N_PAYMENTS"
  paymentCount: z.number().optional(), // FIX: Made this field optional
});

// Схема за специалните права
const SpecialRightSchema = z.object({
  description: z.string(),
  right: z.string(), // e.g., "kartoteka", "equipment"
  trigger: SpecialRightTriggerSchema,
});

// Основна Zod схема за услуга, отразяваща точната структура в Firestore
export const ServiceSchema = z.object({
  id: z.string(), // Ще идва от ID-то на документа
  name: z.string(),
  price: z.number(),
  currency: z.enum(["EUR"]),
  type: z.string(),
  description: z.string(),
  billingPeriod: z.string().nullable(),
  targetGroups: z.array(z.string()),

  // Незадължителни полета
  isCoachLed: z.boolean().optional(),
  durationMinutes: z.number().optional(),
  maxMembers: z.number().optional(),
  minMembers: z.number().optional(),
  requiresBooking: z.boolean().optional(),

  // Права и екипировка
  grantsLicense: z.boolean().optional(),
  licenseCondition: z.string().optional(),
  licensePaymentCount: z.number().optional(),
  grantsApparel: z.boolean().optional(),
  apparelCondition: z.string().optional(),
  apparelPaymentCount: z.number().optional(),

  // Вложени обекти и масиви
  cancellationPolicy: CancellationPolicySchema.optional(),
  paymentRules: z.object({ window: PaymentRulesWindowSchema }).optional(),
  specialRights: z.array(SpecialRightSchema).optional(),
});

// TypeScript тип, генериран автоматично от Zod схемата
export type Service = z.infer<typeof ServiceSchema>;
