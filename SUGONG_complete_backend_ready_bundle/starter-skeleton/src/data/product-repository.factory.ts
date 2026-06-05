import type { ProductRepository } from "../domain/product/product.repository";
import type { Product } from "../domain/product/product.types";
import { ApiClient } from "./api/api-client";
import { ApiProductRepository } from "./api/api-product.repository";
import { LocalProductRepository } from "./local/local-product.repository";

export type ProductRepositoryFactoryInput = {
  localProducts: Product[];
};

export function createProductRepository(
  input: ProductRepositoryFactoryInput,
): ProductRepository {
  const dataSource = import.meta.env.PUBLIC_DATA_SOURCE ?? "local";

  if (dataSource === "api") {
    const baseUrl = import.meta.env.PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      throw new Error("PUBLIC_API_BASE_URL is required when PUBLIC_DATA_SOURCE=api");
    }

    return new ApiProductRepository(new ApiClient({ baseUrl }));
  }

  return new LocalProductRepository(input.localProducts);
}
