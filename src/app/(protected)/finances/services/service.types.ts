import { z } from "zod";

export const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  description: z.string(),
  type: z.string(),
  billingPeriod: z.string(),
});

export type Service = z.infer<typeof ServiceSchema>;
