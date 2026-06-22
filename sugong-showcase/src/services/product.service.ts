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

  getProductsByCategory(category: ProductQuery["category"]) {
    return this.repository.getAll({ category });
  }

  getHomepageProducts(limit = 3) {
    return this.repository.getFeatured(limit);
  }

  getRelatedProducts(productId: string, limit = 3) {
    return this.repository.getRelated(productId, limit);
  }
}
