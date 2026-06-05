import type { ProductRepository } from "../../domain/product/product.repository";
import type { Product, ProductQuery } from "../../domain/product/product.types";

export class ApiProductRepository implements ProductRepository {
  getAll(_query?: ProductQuery): Promise<Product[]> {
    throw new Error("ApiProductRepository is reserved for the backend integration step.");
  }

  getBySlug(_slug: string): Promise<Product | null> {
    throw new Error("ApiProductRepository is reserved for the backend integration step.");
  }

  getFeatured(_limit?: number): Promise<Product[]> {
    throw new Error("ApiProductRepository is reserved for the backend integration step.");
  }

  getRelated(_productId: string, _limit?: number): Promise<Product[]> {
    throw new Error("ApiProductRepository is reserved for the backend integration step.");
  }
}
