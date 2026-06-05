import { getCollection } from "astro:content";
import { LocalProductRepository } from "../data/local/local-product.repository";
import { mapProductEntry } from "../domain/product/product.mapper";
import { ProductService } from "../services/product.service";

export async function createProductService() {
  const entries = await getCollection("products");
  const products = entries.map(mapProductEntry);

  return new ProductService(new LocalProductRepository(products));
}
