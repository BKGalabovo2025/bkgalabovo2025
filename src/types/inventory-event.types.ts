import { z } from 'zod';

export const InventoryEventSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  type: z.string(), // e.g., 'sale', 'restock', 'adjustment'
  quantityChange: z.number(),
  createdAt: z.string(),
  userId: z.string(),
  userName: z.string(),
  relatedSaleId: z.string().optional(),
});

export type InventoryEvent = z.infer<typeof InventoryEventSchema>;
