import type { ProductTone } from "./product-taxonomy";

export const productCategories = ["bag", "scrunchie", "gift", "custom", "graduation"] as const;
export type ProductCategory = (typeof productCategories)[number];

export const productStatuses = ["draft", "published", "hidden"] as const;
export type ProductStatus = (typeof productStatuses)[number];

export type ProductImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
  publicId?: string;
  sortOrder: number;
};

export type ProductDetailItem = {
  label: string;
  value: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number | null;
  formattedPrice: string;
  category: ProductCategory;
  shortDescription: string;
  description?: string;
  coverImage: ProductImage;
  gallery: ProductImage[];
  images: ProductImage[];
  tones: ProductTone[];
  tags: string[];
  isFeatured: boolean;
  status: ProductStatus;
  displayOrder: number;
  detailItems?: ProductDetailItem[];
  detailNote?: string;
  videoUrl?: string;
  customizable: boolean;
  featured: boolean;
  published: boolean;
};

export type ProductQuery = {
  category?: ProductCategory;
  search?: string;
  featured?: boolean;
  page?: number;
  pageSize?: number;
  sort?: "newest" | "price-asc" | "price-desc";
};
