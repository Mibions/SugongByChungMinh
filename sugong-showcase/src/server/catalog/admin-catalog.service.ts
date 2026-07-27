import { asc, eq } from "drizzle-orm";
import { getDatabase } from "../db/client.js";
import { products } from "../db/schema.js";
import {
  adminProductInputSchema,
  type AdminProductInput,
  type AdminProductRecord,
  type AdminProductSummary,
} from "./product-input.js";

type ProductRow = typeof products.$inferSelect;

function toAdminRecord(row: ProductRow): AdminProductRecord {
  return {
    id: row.id,
    legacyId: row.legacyId ?? undefined,
    slug: row.slug,
    name: row.name,
    priceAmount: row.priceAmount,
    category: row.category,
    productType: row.productType ?? undefined,
    shortDescription: row.shortDescription,
    description: row.description ?? undefined,
    detailNote: row.detailNote ?? undefined,
    videoUrl: row.videoUrl ?? undefined,
    status: row.status,
    isFeatured: row.isFeatured,
    isCustomizable: row.isCustomizable,
    displayOrder: row.displayOrder,
    tags: row.tags,
    tones: row.tones,
    classifications: row.classifications,
    media: row.media,
    attributes: row.attributes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toValues(input: AdminProductInput) {
  return {
    legacyId: input.legacyId,
    slug: input.slug,
    name: input.name,
    priceAmount: input.priceAmount,
    category: input.category,
    productType: input.productType || null,
    shortDescription: input.shortDescription,
    description: input.description || null,
    detailNote: input.detailNote || null,
    videoUrl: input.videoUrl || null,
    status: input.status,
    isFeatured: input.isFeatured,
    isCustomizable: input.isCustomizable,
    displayOrder: input.displayOrder,
    tags: [...new Set(input.tags)],
    tones: [...new Set(input.tones)],
    classifications: [...new Set(input.classifications)],
    media: input.media.map((item, position) => ({
      ...item,
      position: item.position ?? position,
      isCover: item.isCover || (!input.media.some((media) => media.isCover) && position === 0),
    })),
    attributes: input.attributes.map((item, position) => ({
      ...item,
      position: item.position ?? position,
    })),
  };
}

export class AdminCatalogService {
  async listProducts(): Promise<AdminProductSummary[]> {
    const db = getDatabase();
    const rows = await db
      .select({
        id: products.id,
        legacyId: products.legacyId,
        slug: products.slug,
        name: products.name,
        category: products.category,
        productType: products.productType,
        status: products.status,
        isFeatured: products.isFeatured,
        displayOrder: products.displayOrder,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .orderBy(asc(products.displayOrder), asc(products.updatedAt));

    return rows.map((row) => ({
      ...row,
      legacyId: row.legacyId ?? undefined,
      productType: row.productType ?? undefined,
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async listProductRecords() {
    const db = getDatabase();
    return (await db.select().from(products).orderBy(asc(products.displayOrder), asc(products.updatedAt)))
      .map(toAdminRecord);
  }

  async getProduct(id: string) {
    const db = getDatabase();
    const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return row ? toAdminRecord(row) : null;
  }

  async createProduct(rawInput: unknown) {
    const input = adminProductInputSchema.parse(rawInput);
    const db = getDatabase();
    const [created] = await db
      .insert(products)
      .values({
        ...toValues(input),
        publishedAt: input.status === "published" ? new Date() : null,
      })
      .returning();
    return toAdminRecord(created);
  }

  async updateProduct(id: string, rawInput: unknown) {
    const input = adminProductInputSchema.parse({ ...(rawInput as object), id });
    const db = getDatabase();
    const [existing] = await db
      .select({ status: products.status, publishedAt: products.publishedAt })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!existing) return null;

    const [updated] = await db
      .update(products)
      .set({
        ...toValues(input),
        publishedAt:
          input.status === "published"
            ? existing.publishedAt ?? new Date()
            : null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    return toAdminRecord(updated);
  }

  async deleteProduct(id: string) {
    const existing = await this.getProduct(id);
    if (!existing) return null;

    const db = getDatabase();
    await db.delete(products).where(eq(products.id, id));
    return {
      product: existing,
      cloudinaryPublicIds: existing.media.flatMap((item) =>
        item.publicId ? [item.publicId] : [],
      ),
    };
  }
}
