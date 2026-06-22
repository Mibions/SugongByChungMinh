import { z } from "zod";
import { productToneValues } from "./product-taxonomy";

export const productImageSchema = z.object({
  url: z.string().min(1),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  publicId: z.string().min(1).optional(),
  sortOrder: z.number().int().nonnegative(),
});

export const productDetailItemSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
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
  coverImage: productImageSchema,
  gallery: z.array(productImageSchema).min(1),
  images: z.array(productImageSchema).min(1),
  tones: z.array(z.enum(productToneValues)).min(1),
  tags: z.array(z.string().min(1)),
  isFeatured: z.boolean(),
  status: z.enum(["draft", "published", "hidden"]),
  displayOrder: z.number().int().nonnegative(),
  detailItems: z.array(productDetailItemSchema).optional(),
  detailNote: z.string().min(1).optional(),
  videoUrl: z.string().optional(),
  customizable: z.boolean(),
  featured: z.boolean(),
  published: z.boolean(),
});

export type ProductInput = z.input<typeof productSchema>;
