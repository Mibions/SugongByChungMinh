import { z } from "zod";

export const productImageSchema = z.object({
  url: z.string().min(1),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  sortOrder: z.number().int().nonnegative(),
});

export const productSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative().nullable(),
  formattedPrice: z.string().min(1),
  category: z.enum(["bag", "scrunchie", "gift", "custom", "graduation"]),
  shortDescription: z.string().min(1),
  description: z.string().optional(),
  images: z.array(productImageSchema).min(1),
  videoUrl: z.string().optional(),
  customizable: z.boolean(),
  featured: z.boolean(),
  published: z.boolean(),
});

export type ProductInput = z.input<typeof productSchema>;
