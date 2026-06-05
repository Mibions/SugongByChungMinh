import type { ProductRepository } from "../../domain/product/product.repository";
import type { Product, ProductQuery } from "../../domain/product/product.types";

export class LocalProductRepository implements ProductRepository {
  constructor(private readonly products: Product[]) {}

  async getAll(query: ProductQuery = {}): Promise<Product[]> {
    let result = this.products.filter((product) => product.published);

    if (query.category) {
      result = result.filter((product) => product.category === query.category);
    }

    if (query.featured !== undefined) {
      result = result.filter((product) => product.featured === query.featured);
    }

    if (query.search) {
      const term = query.search.trim().toLocaleLowerCase("vi");
      result = result.filter((product) =>
        `${product.name} ${product.shortDescription}`.toLocaleLowerCase("vi").includes(term),
      );
    }

    return result;
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
      .filter(
        (product) =>
          product.id !== productId &&
          product.published &&
          product.category === current.category,
      )
      .slice(0, limit);
  }
}
