import { z } from "zod";

export const paymentHistoryItemSchema = z.object({
  date: z.string(),
  amount: z.number(),
  paymentId: z.string(),
  saleId: z.string().optional(),
});

export const subscriptionSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  serviceId: z.string().min(1, "Service ID is required"),
  serviceName: z.string().min(1, "Service name is required"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(["active", "inactive", "cancelled", "pending_payment"]),
  price: z.number().nonnegative(),
  pricePaid: z.number().nonnegative(),
  currency: z.literal("EUR"),
  paymentHistory: z.array(paymentHistoryItemSchema).default([]),
  paymentsMadeCount: z.number().int().nonnegative().default(0),
  totalPaymentsCount: z.number().int().nonnegative().default(1),
  licenseGranted: z.boolean().optional(),
  apparelGranted: z.boolean().optional(),
  linkedSubscriptionId: z.string().nullable().optional(),
});

export const subscriptionUpdateSchema = subscriptionSchema.partial();

export type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;
