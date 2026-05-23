import { z } from "zod";

const SpecialRightSchema = z.object({
  right: z.string(),
  description: z.string(),
  trigger: z
    .object({
      condition: z.string(),
      paymentCount: z.number().optional(),
    })
    .optional(),
});

const CancellationPolicySchema = z.object({
  isAllowed: z.boolean().default(true),
  noticePeriodDays: z.number().default(5),
  feeType: z.string().default("none"),
  feeValue: z.number().default(0),
  description: z.string().optional(),
  longTermSicknessDiscount: z.number().default(0.5),
});

const PaymentRulesSchema = z.object({
  window: z
    .object({
      startDay: z.number().default(1),
      endDay: z.number().default(10),
    })
    .optional(),
});

export const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  currency: z.string().default("EUR"),
  type: z.string(),
  targetGroups: z.array(z.string()).default([]),
  billingPeriod: z.string().nullable().optional(),
  durationMinutes: z.number().optional(),
  isCoachLed: z.boolean().default(true),
  requiresBooking: z.boolean().default(false),
  grantsLicense: z.boolean().default(false),
  licenseCondition: z.string().optional(),
  licensePaymentCount: z.number().optional(),
  grantsApparel: z.boolean().default(false),
  apparelCondition: z.string().optional(),
  apparelPaymentCount: z.number().optional(),
  maxMembers: z.number().optional(),
  minMembers: z.number().optional(),
  specialRights: z.array(SpecialRightSchema).optional(),
  cancellationPolicy: CancellationPolicySchema.optional(),
  paymentRules: PaymentRulesSchema.optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type Service = z.infer<typeof ServiceSchema>;
