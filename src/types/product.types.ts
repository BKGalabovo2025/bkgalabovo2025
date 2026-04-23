import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  stock: z.number(),
});

export type Product = z.infer<typeof ProductSchema>;
