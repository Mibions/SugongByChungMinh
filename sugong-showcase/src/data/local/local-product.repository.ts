import type { ProductRepository } from "../../domain/product/product.repository";
import type { Product, ProductQuery } from "../../domain/product/product.types";

export class LocalProductRepository implements ProductRepository {
  constructor(private readonly products: Product[]) {}

  async getAll(query: ProductQuery = {}): Promise<Product[]> {
    let result = this.products.filter((product) => product.published);

    if (query.category) {
      result = result.filter((product) =>
        query.category === "custom"
          ? product.category === "custom" || product.customizable
          : product.category === query.category,
      );
    }

    if (query.featured !== undefined) {
      result = result.filter((product) => product.featured === query.featured);
    }

    if (query.search) {
      const term = query.search.trim().toLocaleLowerCase("vi");
      const categoryLabels: Record<Product["category"], string> = {
        bag: "túi handmade bag tote",
        scrunchie: "scrunchie phụ kiện tóc",
        gift: "quà tặng gift hộp quà",
        custom: "custom cá nhân hóa thêu tên",
        graduation: "tốt nghiệp graduation quà tặng",
      };

      result = result.filter((product) => {
        const keywords = [
          product.name,
          product.shortDescription,
          product.description,
          categoryLabels[product.category],
          product.customizable ? "custom cá nhân hóa handmade" : "handmade",
          product.formattedPrice,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("vi");

        return keywords.includes(term);
      });
    }

    if (query.sort === "price-asc") {
      result = [...result].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    }

    if (query.sort === "price-desc") {
      result = [...result].sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    }

    if (query.page && query.pageSize) {
      const start = (query.page - 1) * query.pageSize;
      result = result.slice(start, start + query.pageSize);
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
      .filter((product) => product.id !== productId && product.published)
      .sort((a, b) => Number(b.category === current.category) - Number(a.category === current.category))
      .slice(0, limit);
  }
}
