import { LocalGraduationHatRepository } from "../data/local/local-graduation-hat.repository";
import { LocalProductRepository } from "../data/local/local-product.repository";
import { graduationHats as graduationHatSeed } from "../data/local/graduation-hats";
import { localProducts } from "../data/local/products";
import type { GraduationHatQuery } from "../domain/graduation-hat/graduation-hat.repository";
import type { GraduationHat, ProductImage as GraduationHatImage } from "../domain/graduation-hat/graduation-hat.types";
import type { Product, ProductCategory, ProductQuery } from "../domain/product/product.types";
import { GraduationHatService } from "../services/graduation-hat.service";
import { ProductService } from "../services/product.service";
import { mapToteBagsToProducts } from "./tote-bags";
import { withBase } from "./url";

type CatalogData = {
  products: Product[];
  graduationHats: GraduationHat[];
};

let catalogPromise: Promise<CatalogData> | undefined;

function normalizeGraduationHatImage(image: GraduationHatImage): GraduationHatImage {
  return {
    ...image,
    url: withBase(image.url),
  };
}

function normalizeGraduationHat(hat: GraduationHat): GraduationHat {
  return {
    ...hat,
    coverImage: normalizeGraduationHatImage(hat.coverImage),
    gallery: (hat.gallery.length > 0 ? hat.gallery : [hat.coverImage]).map(normalizeGraduationHatImage),
  };
}

function assertUniqueKeys<T>(items: T[], getKey: (item: T) => string, label: string) {
  const seen = new Set<string>();

  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) {
      throw new Error(`Duplicate ${label} detected in catalog: ${key}`);
    }
    seen.add(key);
  }
}

async function buildCatalogData(): Promise<CatalogData> {
  const toteProducts = mapToteBagsToProducts();
  const products = [...localProducts, ...toteProducts];
  const graduationHats = graduationHatSeed.map(normalizeGraduationHat);

  assertUniqueKeys(products, (product) => product.id, "product id");
  assertUniqueKeys(products, (product) => product.slug, "product slug");
  assertUniqueKeys(graduationHats, (hat) => hat.id, "graduation hat id");
  assertUniqueKeys(graduationHats, (hat) => hat.slug, "graduation hat slug");

  return {
    products,
    graduationHats,
  };
}

async function getCatalogData() {
  catalogPromise ??= buildCatalogData();
  return catalogPromise;
}

async function getProductService() {
  const { products } = await getCatalogData();
  return new ProductService(new LocalProductRepository(products));
}

async function getGraduationHatService() {
  const { graduationHats } = await getCatalogData();
  return new GraduationHatService(new LocalGraduationHatRepository(graduationHats));
}

export async function getAllProducts(query?: ProductQuery) {
  const service = await getProductService();
  return service.getProducts(query);
}

export async function getProductBySlug(slug: string) {
  const service = await getProductService();
  return service.getProductDetail(slug);
}

export async function getProductsByCategory(category: ProductCategory) {
  return getAllProducts({ category });
}

export async function getFeaturedProducts(limit = 3) {
  const service = await getProductService();
  return service.getHomepageProducts(limit);
}

export async function getRelatedProducts(productOrId: Product | string, limit = 3) {
  const service = await getProductService();
  const productId = typeof productOrId === "string" ? productOrId : productOrId.id;
  return service.getRelatedProducts(productId, limit);
}

export async function getGraduationHats(query?: GraduationHatQuery) {
  const service = await getGraduationHatService();
  return service.getGraduationHats(query);
}

export async function getGraduationHatBySlug(slug: string) {
  const service = await getGraduationHatService();
  return service.getGraduationHatDetail(slug);
}
