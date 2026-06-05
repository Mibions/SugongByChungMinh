import type { ProductRepository } from "../../domain/product/product.repository";
import type { Product, ProductQuery } from "../../domain/product/product.types";
import { mapApiProduct, type ApiProductResponse } from "../../domain/product/product.mapper";
import { ApiClient } from "./api-client";

type ProductListResponse = {
  items: ApiProductResponse[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export class ApiProductRepository implements ProductRepository {
  constructor(private readonly client: ApiClient) {}

  async getAll(query: ProductQuery = {}): Promise<Product[]> {
    const params = new URLSearchParams();

    if (query.category) params.set("category", query.category);
    if (query.search) params.set("search", query.search);
    if (query.featured !== undefined) params.set("featured", String(query.featured));
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    if (query.sort) params.set("sort", query.sort);

    const suffix = params.size ? `?${params.toString()}` : "";
    const response = await this.client.get<ProductListResponse>(`/api/v1/products${suffix}`);

    return response.items.map(mapApiProduct);
  }

  async getBySlug(slug: string): Promise<Product | null> {
    try {
      const response = await this.client.get<ApiProductResponse>(`/api/v1/products/${slug}`);
      return mapApiProduct(response);
    } catch {
      return null;
    }
  }

  async getFeatured(limit = 3): Promise<Product[]> {
    return (await this.getAll({ featured: true, pageSize: limit })).slice(0, limit);
  }

  async getRelated(productId: string, limit = 3): Promise<Product[]> {
    const response = await this.client.get<{ items: ApiProductResponse[] }>(
      `/api/v1/products/${productId}/related?pageSize=${limit}`,
    );

    return response.items.map(mapApiProduct);
  }
}
