import { catalogProducts } from "../data/local/catalog";
import { LocalProductRepository } from "../data/local/local-product.repository";
import type { ProductRepository } from "../domain/product/product.repository";
import { getGraduationTone, type GraduationTone } from "../domain/product/product-taxonomy";
import type { Product, ProductCategory, ProductQuery } from "../domain/product/product.types";

let localRepository: LocalProductRepository | undefined;

function assertUniqueProducts(products: Product[]) {
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const product of products) {
    if (ids.has(product.id)) throw new Error(`Duplicate product id detected in catalog: ${product.id}`);
    if (slugs.has(product.slug)) throw new Error(`Duplicate product slug detected in catalog: ${product.slug}`);
    ids.add(product.id);
    slugs.add(product.slug);
  }
}

async function getRepository(): Promise<ProductRepository> {
  if (process.env.DATA_SOURCE === "database") {
    const { PostgresProductRepository } = await import("../server/catalog/postgres-product.repository");
    return new PostgresProductRepository();
  }

  if (!localRepository) {
    assertUniqueProducts(catalogProducts);
    localRepository = new LocalProductRepository(catalogProducts);
  }

  return localRepository;
}

export async function getAllProducts(query?: ProductQuery) {
  return (await getRepository()).getAll(query);
}

export async function getProductBySlug(slug: string) {
  return (await getRepository()).getBySlug(slug);
}

export async function getProductsByCategory(category: ProductCategory) {
  return getAllProducts({ category });
}

export async function getFeaturedProducts(limit = 3) {
  return (await getRepository()).getFeatured(limit);
}

export async function getRelatedProducts(productOrId: Product | string, limit = 3) {
  const productId = typeof productOrId === "string" ? productOrId : productOrId.id;
  return (await getRepository()).getRelated(productId, limit);
}

export async function getGraduationHats(query: { tone?: GraduationTone; featured?: boolean } = {}) {
  let products = await getAllProducts({ category: "graduation", featured: query.featured });
  if (query.tone && query.tone !== "all") {
    products = products.filter((product) => getGraduationTone(product.tones) === query.tone);
  }
  return products;
}

export async function getGraduationHatBySlug(slug: string) {
  const product = await getProductBySlug(slug);
  return product?.category === "graduation" ? product : null;
}
