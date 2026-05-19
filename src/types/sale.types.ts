import { z } from "zod";

/**
 * Zod schema for a single item within a sale.
 */
export const SaleItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required."),
  name: z.string().min(1, "Product name is required."),
  quantity: z.number().int().positive("Quantity must be a positive integer."),
  price: z.number().nonnegative("Price cannot be negative."),
});

/**
 * Zod schema for validating sale data.
 */
export const SaleSchema = z.object({
  id: z.string().min(1, "ID is required."),
  siteId: z.string().min(1, "Site ID is required."),
  memberId: z.string().min(1, "Member ID is required."),
  saleDate: z.string().datetime({ message: "Invalid sale date format" }),
  items: z.array(SaleItemSchema).min(1, "At least one item is required."),
  status: z.enum(["pending", "completed", "cancelled", "informational"]),
  isPaid: z.boolean(),
  totalAmount: z.number().nonnegative("Total amount cannot be negative."),
  currency: z.literal("EUR"),
  paymentMethod: z.string().optional(),
  note: z.string().optional(),
  subscriptionId: z.string().nullable().optional(),
  createdAt: z
    .string()
    .datetime({ message: "Invalid creation date format" })
    .optional(),
});

export type SaleItem = z.infer<typeof SaleItemSchema>;
export type Sale = z.infer<typeof SaleSchema>;
