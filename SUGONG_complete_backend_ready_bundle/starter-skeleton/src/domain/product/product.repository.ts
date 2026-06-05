import type { Product, ProductQuery } from "./product.types";

export interface ProductRepository {
  getAll(query?: ProductQuery): Promise<Product[]>;
  getBySlug(slug: string): Promise<Product | null>;
  getFeatured(limit?: number): Promise<Product[]>;
  getRelated(productId: string, limit?: number): Promise<Product[]>;
}
