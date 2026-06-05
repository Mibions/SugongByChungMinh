import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const productImageSchema = z.object({
  url: z.string().min(1),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  sortOrder: z.number().int().nonnegative(),
});

const products = defineCollection({
  loader: glob({
    base: "./src/content/products",
    pattern: "**/*.md",
    retainBody: true,
  }),
  schema: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    price: z.number().nonnegative().nullable(),
    formattedPrice: z.string().min(1),
    category: z.enum(["bag", "scrunchie", "gift", "custom", "graduation"]),
    shortDescription: z.string().min(1),
    images: z.array(productImageSchema).min(1),
    videoUrl: z.string().optional(),
    customizable: z.boolean(),
    featured: z.boolean().default(false),
    published: z.boolean().default(true),
  }),
});

export const collections = { products };
