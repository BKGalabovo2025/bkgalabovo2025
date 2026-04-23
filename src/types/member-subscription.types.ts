import { z } from 'zod';

const PaymentSchema = z.object({
  id: z.string().optional(),
  date: z.string(), // ISO 8601 format
  amount: z.number(),
  status: z.enum(['paid', 'unpaid', 'pending', 'cancelled']),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
  saleId: z.string().optional(),
});

export const MemberSubscriptionSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  serviceId: z.string(),
  serviceName: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'cancelled', 'pending']),
  paymentHistory: z.array(PaymentSchema).optional(),
  autoRenew: z.boolean().optional(),
});

export type MemberSubscription = z.infer<typeof MemberSubscriptionSchema>;
