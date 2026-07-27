import { and, asc, eq, inArray } from "drizzle-orm";
import type { ProductRepository } from "../../domain/product/product.repository.js";
import { formatProductPrice, matchesProductCategory, matchesProductSearch, paginateProducts, sortProducts } from "../../domain/product/product.helpers.js";
import type { Product, ProductCategory, ProductQuery } from "../../domain/product/product.types.js";
import type { ProductTone } from "../../domain/product/product-taxonomy.js";
import { getDatabase } from "../db/client.js";
import {
  categories,
  productAttributes,
  productClassifications,
  productMedia,
  productTags,
  productTones,
  products,
  productTypes,
  tags,
  tones,
} from "../db/schema.js";

type ProductRow = typeof products.$inferSelect;
let publishedProductsPromise: Promise<Product[]> | undefined;

export type ProductBundle = {
  row: ProductRow;
  category: ProductCategory;
  productType?: string;
  classifications: string[];
  media: Array<typeof productMedia.$inferSelect>;
  tags: string[];
  tones: ProductTone[];
  attributes: Array<typeof productAttributes.$inferSelect>;
};

function mapBundleToProduct(bundle: ProductBundle): Product {
  const images = bundle.media
    .sort((a, b) => a.position - b.position)
    .map((media) => ({
      url: media.secureUrl,
      alt: media.alt,
      width: media.width,
      height: media.height,
      publicId: media.publicId ?? undefined,
      sortOrder: media.position,
    }));
  const coverImage = images[bundle.media.findIndex((item) => item.isCover)] ?? images[0];

  if (!coverImage) {
    throw new Error(`Published product ${bundle.row.slug} has no media`);
  }

  return {
    id: bundle.row.legacyId ?? bundle.row.id,
    slug: bundle.row.slug,
    name: bundle.row.name,
    price: bundle.row.priceAmount,
    formattedPrice: formatProductPrice(bundle.row.priceAmount),
    category: bundle.category,
    shortDescription: bundle.row.shortDescription,
    description: bundle.row.description ?? undefined,
    coverImage,
    gallery: images,
    images,
    tones: bundle.tones,
    tags: bundle.tags,
    isFeatured: bundle.row.isFeatured,
    status: bundle.row.status,
    displayOrder: bundle.row.displayOrder,
    detailItems: bundle.attributes
      .sort((a, b) => a.position - b.position)
      .map(({ label, value }) => ({ label, value })),
    detailNote: bundle.row.detailNote ?? undefined,
    videoUrl: bundle.row.videoUrl ?? undefined,
    customizable: bundle.row.isCustomizable,
    featured: bundle.row.isFeatured,
    published: bundle.row.status === "published",
  };
}

async function loadBundles(includeUnpublished = false, productId?: string): Promise<ProductBundle[]> {
  const db = getDatabase();
  const where = and(
    includeUnpublished ? undefined : eq(products.status, "published"),
    productId ? eq(products.id, productId) : undefined,
  );
  const rows = await db
    .select({ row: products, categorySlug: categories.slug, productTypeSlug: productTypes.slug })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productTypes, eq(products.productTypeId, productTypes.id))
    .where(where)
    .orderBy(asc(products.displayOrder), asc(products.createdAt));

  if (rows.length === 0) return [];
  const ids = rows.map(({ row }) => row.id);

  const [mediaRows, tagRows, toneRows, attributeRows, classificationRows] = await Promise.all([
    db
      .select()
      .from(productMedia)
      .where(inArray(productMedia.productId, ids))
      .orderBy(asc(productMedia.position)),
    db
      .select({ productId: productTags.productId, name: tags.name })
      .from(productTags)
      .innerJoin(tags, eq(productTags.tagId, tags.id))
      .where(inArray(productTags.productId, ids)),
    db
      .select({ productId: productTones.productId, slug: tones.slug })
      .from(productTones)
      .innerJoin(tones, eq(productTones.toneId, tones.id))
      .where(inArray(productTones.productId, ids)),
    db
      .select()
      .from(productAttributes)
      .where(inArray(productAttributes.productId, ids))
      .orderBy(asc(productAttributes.position)),
    db
      .select({
        productId: productClassifications.productId,
        valueId: productClassifications.classificationValueId,
      })
      .from(productClassifications)
      .where(inArray(productClassifications.productId, ids)),
  ]);

  return rows.map(({ row, categorySlug, productTypeSlug }) => ({
      row,
      category: categorySlug,
      productType: productTypeSlug ?? undefined,
      classifications: classificationRows
        .filter((item) => item.productId === row.id)
        .map((item) => item.valueId),
      media: mediaRows.filter((item) => item.productId === row.id),
      tags: tagRows.filter((item) => item.productId === row.id).map((item) => item.name),
      tones: toneRows
        .filter((item) => item.productId === row.id)
        .map((item) => item.slug),
      attributes: attributeRows.filter((item) => item.productId === row.id),
  }));
}

async function loadPublishedProducts() {
  if (!publishedProductsPromise) {
    publishedProductsPromise = loadBundles()
      .then((bundles) => bundles.map(mapBundleToProduct))
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

export async function getRawProductBundles() {
  return loadBundles(true);
}

export async function getRawProductBundle(productId: string) {
  return (await loadBundles(true, productId))[0] ?? null;
}
