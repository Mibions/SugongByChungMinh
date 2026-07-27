import { asc, eq } from "drizzle-orm";
import type { ProductRepository } from "../../domain/product/product.repository.js";
import {
  formatProductPrice,
  matchesProductCategory,
  matchesProductSearch,
  paginateProducts,
  sortProducts,
} from "../../domain/product/product.helpers.js";
import type { Product, ProductQuery } from "../../domain/product/product.types.js";
import { getDatabase } from "../db/client.js";
import { products } from "../db/schema.js";

type ProductRow = typeof products.$inferSelect;
let publishedProductsPromise: Promise<Product[]> | undefined;

function mapRowToProduct(row: ProductRow): Product {
  const images = [...row.media]
    .sort((a, b) => a.position - b.position)
    .map((media) => ({
      url: media.secureUrl,
      alt: media.alt,
      width: media.width,
      height: media.height,
      publicId: media.publicId,
      sortOrder: media.position,
    }));
  const coverIndex = row.media.findIndex((item) => item.isCover);
  const coverImage = images[coverIndex] ?? images[0];

  if (!coverImage) {
    throw new Error(`Published product ${row.slug} has no media`);
  }

  return {
    id: row.legacyId ?? row.id,
    slug: row.slug,
    name: row.name,
    price: row.priceAmount,
    formattedPrice: formatProductPrice(row.priceAmount),
    category: row.category,
    shortDescription: row.shortDescription,
    description: row.description ?? undefined,
    coverImage,
    gallery: images,
    images,
    tones: row.tones,
    tags: row.tags,
    isFeatured: row.isFeatured,
    status: row.status,
    displayOrder: row.displayOrder,
    detailItems: [...row.attributes]
      .sort((a, b) => a.position - b.position)
      .map(({ label, value }) => ({ label, value })),
    detailNote: row.detailNote ?? undefined,
    videoUrl: row.videoUrl ?? undefined,
    customizable: row.isCustomizable,
    featured: row.isFeatured,
    published: row.status === "published",
  };
}

async function loadPublishedProducts() {
  if (!publishedProductsPromise) {
    publishedProductsPromise = getDatabase()
      .select()
      .from(products)
      .where(eq(products.status, "published"))
      .orderBy(asc(products.displayOrder), asc(products.createdAt))
      .then((rows) => rows.map(mapRowToProduct))
      .catch((error) => {
        publishedProductsPromise = undefined;
        throw error;
      });
  }
  return publishedProductsPromise;
}

export class PostgresProductRepository implements ProductRepository {
  async getAll(query: ProductQuery = {}): Promise<Product[]> {
    let result = [...(await loadPublishedProducts())];
    if (query.category) result = result.filter((product) => matchesProductCategory(product, query.category));
    if (query.featured !== undefined) result = result.filter((product) => product.isFeatured === query.featured);
    if (query.search) result = result.filter((product) => matchesProductSearch(product, query.search));
    result = sortProducts(result, query.sort ?? "newest");
    return paginateProducts(result, query.page, query.pageSize);
  }

  async getBySlug(slug: string): Promise<Product | null> {
    return (await this.getAll()).find((product) => product.slug === slug) ?? null;
  }

  async getFeatured(limit = 3): Promise<Product[]> {
    return (await this.getAll({ featured: true })).slice(0, limit);
  }

  async getRelated(productId: string, limit = 3): Promise<Product[]> {
    const all = await this.getAll();
    const current = all.find((product) => product.id === productId);
    if (!current) return [];

    return all
      .filter((product) => product.id !== productId)
      .sort((a, b) => Number(b.category === current.category) - Number(a.category === current.category))
      .slice(0, limit);
  }
}
