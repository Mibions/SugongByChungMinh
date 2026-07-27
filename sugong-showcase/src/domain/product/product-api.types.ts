import type { Product, ProductCategory } from "./product.types.js";

export type ProductListResponse = {
  items: Product[];
  total: number;
};

export type ProductDetailResponse = {
  item: Product;
};

export type ProductsByCategoryResponse = ProductListResponse & {
  category: ProductCategory;
};

export type RelatedProductsResponse = {
  item: Product;
  related: Product[];
  total: number;
};

export type GraduationHatListResponse = {
  items: Product[];
  total: number;
};

export type GraduationHatDetailResponse = {
  item: Product;
};
