import { asc, eq, inArray } from "drizzle-orm";
import type { GraduationHatRepository, GraduationHatQuery } from "../../domain/graduation-hat/graduation-hat.repository";
import type { GraduationHat, GraduationHatTone } from "../../domain/graduation-hat/graduation-hat.types";
import type { ProductRepository } from "../../domain/product/product.repository";
import { formatProductPrice, matchesProductCategory, matchesProductSearch, paginateProducts, sortProducts } from "../../domain/product/product.helpers";
import { productCategories, type Product, type ProductCategory, type ProductQuery } from "../../domain/product/product.types";
import { productToneValues, type ProductTone } from "../../domain/product/product-taxonomy";
import { getDatabase } from "../db/client";
import {
  categories,
  productAttributes,
  productMedia,
  productTags,
  productTones,
  products,
  tags,
  tones,
} from "../db/schema";

type ProductRow = typeof products.$inferSelect;

export type ProductBundle = {
  row: ProductRow;
  category: ProductCategory;
  media: Array<typeof productMedia.$inferSelect>;
  tags: string[];
  tones: ProductTone[];
  attributes: Array<typeof productAttributes.$inferSelect>;
};

function isProductCategory(value: string): value is ProductCategory {
  return productCategories.includes(value as ProductCategory);
}

function isProductTone(value: string): value is ProductTone {
  return productToneValues.includes(value as ProductTone);
}

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

async function loadBundles(includeUnpublished = false): Promise<ProductBundle[]> {
  const db = getDatabase();
  const rows = await db
    .select({ row: products, categorySlug: categories.slug })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(includeUnpublished ? undefined : eq(products.status, "published"))
    .orderBy(asc(products.displayOrder), asc(products.createdAt));

  if (rows.length === 0) return [];
  const ids = rows.map(({ row }) => row.id);

  const [mediaRows, tagRows, toneRows, attributeRows] = await Promise.all([
    db.select().from(productMedia).where(inArray(productMedia.productId, ids)).orderBy(asc(productMedia.position)),
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
  ]);

  return rows.flatMap(({ row, categorySlug }) => {
    if (!isProductCategory(categorySlug)) return [];

    return [{
      row,
      category: categorySlug,
      media: mediaRows.filter((item) => item.productId === row.id),
      tags: tagRows.filter((item) => item.productId === row.id).map((item) => item.name),
      tones: toneRows
        .filter((item) => item.productId === row.id && isProductTone(item.slug))
        .map((item) => item.slug as ProductTone),
      attributes: attributeRows.filter((item) => item.productId === row.id),
    }];
  });
}

export class PostgresProductRepository implements ProductRepository {
  async getAll(query: ProductQuery = {}): Promise<Product[]> {
    let result = (await loadBundles()).map(mapBundleToProduct);
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

function mapTone(product: Product): GraduationHatTone {
  if (product.tones.length > 1) return "mixed";
  const tone = product.tones[0];
  if (tone === "blue" || tone === "pink") return tone;
  if (tone === "cream" || tone === "neutral") return "white";
  if (tone === "lavender" || tone === "lilac") return "purple";
  return "other";
}

function mapProductToGraduationHat(product: Product): GraduationHat {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tone: mapTone(product),
    shortDescription: product.shortDescription,
    description: product.description,
    coverImage: product.coverImage,
    gallery: product.gallery,
    tags: product.tags,
    tiktokUrl: product.videoUrl,
    isFeatured: product.isFeatured,
    status: product.status,
    displayOrder: product.displayOrder,
  };
}

export class PostgresGraduationHatRepository implements GraduationHatRepository {
  private readonly products = new PostgresProductRepository();

  async getAll(query: GraduationHatQuery = {}): Promise<GraduationHat[]> {
    let hats = (await this.products.getAll({ category: "graduation", featured: query.featured })).map(mapProductToGraduationHat);
    if (query.tone && query.tone !== "all") hats = hats.filter((hat) => hat.tone === query.tone);
    return hats;
  }

  async getBySlug(slug: string): Promise<GraduationHat | null> {
    return (await this.getAll()).find((hat) => hat.slug === slug) ?? null;
  }
}

export async function getRawProductBundles() {
  return loadBundles(true);
}
