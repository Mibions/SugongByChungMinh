export type ProductCategory =
  | "bag"
  | "scrunchie"
  | "gift"
  | "custom"
  | "graduation";

export type ProductImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
  sortOrder: number;
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
  images: ProductImage[];
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
