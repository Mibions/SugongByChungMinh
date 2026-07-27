import { z } from "zod";
import { productStatuses } from "../../domain/product/product.types.js";

export const adminProductMediaSchema = z.object({
  id: z.string().uuid().optional(),
  publicId: z.string().trim().min(1).optional(),
  secureUrl: z
    .string()
    .trim()
    .refine((value) => value.startsWith("/") || URL.canParse(value), "Ảnh phải là URL hoặc đường dẫn asset nội bộ"),
  format: z.string().trim().min(1).optional(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().trim().min(1),
  position: z.number().int().nonnegative(),
  isCover: z.boolean(),
});

export const adminProductAttributeSchema = z.object({
  definitionId: z.string().uuid().optional(),
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
  position: z.number().int().nonnegative(),
});

export const adminProductInputSchema = z.object({
  id: z.string().uuid().optional(),
  legacyId: z.string().trim().min(1).optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang"),
  name: z.string().trim().min(2).max(240),
  priceAmount: z.number().int().nonnegative().nullable(),
  category: z.string().trim().min(1).max(120),
  productType: z.string().trim().min(1).max(120).optional(),
  shortDescription: z.string().trim().min(2).max(500),
  description: z.string().trim().max(5000).optional(),
  detailNote: z.string().trim().max(2000).optional(),
  videoUrl: z.string().trim().url().optional().or(z.literal("")),
  status: z.enum(productStatuses),
  isFeatured: z.boolean(),
  isCustomizable: z.boolean(),
  displayOrder: z.number().int().nonnegative(),
  tags: z.array(z.string().trim().min(1).max(80)).max(30),
  tones: z.array(z.string().trim().min(1).max(120)).max(50),
  classifications: z.array(z.string().uuid()).max(100).default([]),
  media: z.array(adminProductMediaSchema).max(20),
  attributes: z.array(adminProductAttributeSchema).max(30),
}).superRefine((input, context) => {
  if (input.status !== "published") return;
  if (input.media.length === 0) {
    context.addIssue({
      code: "custom",
      path: ["media"],
      message: "Sản phẩm cần ít nhất một ảnh trước khi xuất bản",
    });
  }
  if (input.tones.length === 0) {
    context.addIssue({
      code: "custom",
      path: ["tones"],
      message: "Sản phẩm cần ít nhất một màu trước khi xuất bản",
    });
  }
});

export type AdminProductInput = z.infer<typeof adminProductInputSchema>;

export type AdminProductRecord = AdminProductInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};
