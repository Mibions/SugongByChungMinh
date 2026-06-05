import type { ProductRepository } from "../domain/product/product.repository";
import type { Product, ProductQuery } from "../domain/product/product.types";

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  getProducts(query?: ProductQuery): Promise<Product[]> {
    return this.repository.getAll(query);
  }

  getProductDetail(slug: string): Promise<Product | null> {
    return this.repository.getBySlug(slug);
  }

  getHomepageProducts(): Promise<Product[]> {
    return this.repository.getFeatured(3);
  }

  getRelatedProducts(productId: string): Promise<Product[]> {
    return this.repository.getRelated(productId, 3);
  }
}
