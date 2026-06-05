import type { ProductRepository } from "../domain/product/product.repository";
import type { ProductQuery } from "../domain/product/product.types";

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  getProducts(query?: ProductQuery) {
    return this.repository.getAll(query);
  }

  getProductDetail(slug: string) {
    return this.repository.getBySlug(slug);
  }

  getHomepageProducts() {
    return this.repository.getFeatured(3);
  }

  getRelatedProducts(productId: string) {
    return this.repository.getRelated(productId, 3);
  }
}
