import type { ProductRepository } from "../../domain/product/product.repository";
import {
  isProductFeatured,
  isProductPublished,
  matchesProductCategory,
  matchesProductSearch,
  paginateProducts,
  sortProducts,
} from "../../domain/product/product.helpers";
import type { Product, ProductQuery } from "../../domain/product/product.types";

export class LocalProductRepository implements ProductRepository {
  constructor(private readonly products: Product[]) {}

  async getAll(query: ProductQuery = {}): Promise<Product[]> {
    let result = this.products.filter(isProductPublished);

    if (query.category) {
      result = result.filter((product) => matchesProductCategory(product, query.category));
    }

    if (query.featured !== undefined) {
      result = result.filter((product) => isProductFeatured(product) === query.featured);
    }

    if (query.search) {
      result = result.filter((product) => matchesProductSearch(product, query.search));
    }

    result = sortProducts(result, query.sort ?? "newest");

    return paginateProducts(result, query.page, query.pageSize);
  }

  async getBySlug(slug: string): Promise<Product | null> {
    return this.products.find((product) => product.slug === slug && product.published) ?? null;
  }

  async getFeatured(limit = 3): Promise<Product[]> {
    return (await this.getAll({ featured: true })).slice(0, limit);
  }

  async getRelated(productId: string, limit = 3): Promise<Product[]> {
    const current = this.products.find((product) => product.id === productId);
    if (!current) return [];

    return this.products
      .filter((product) => product.id !== productId && isProductPublished(product))
      .sort((a, b) => Number(b.category === current.category) - Number(a.category === current.category))
      .slice(0, limit);
  }
}
