import type { GraduationHat } from "../../../domain/graduation-hat/graduation-hat.types";
import type { Product, ProductCategory } from "../../../domain/product/product.types";

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
  items: GraduationHat[];
  total: number;
};

export type GraduationHatDetailResponse = {
  item: GraduationHat;
};
