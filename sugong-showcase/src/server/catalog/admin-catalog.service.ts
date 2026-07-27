import { eq, inArray } from "drizzle-orm";
import { getDatabase } from "../db/client.js";
import {
  categories,
  productAttributes,
  productMedia,
  productTags,
  productTones,
  products,
  tags,
  tones,
} from "../db/schema.js";
import { adminProductInputSchema, type AdminProductInput, type AdminProductRecord } from "./product-input.js";
import { getRawProductBundles } from "./postgres-product.repository.js";

type Database = ReturnType<typeof getDatabase>;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type DatabaseExecutor = Database | Transaction;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toAdminRecord(bundle: Awaited<ReturnType<typeof getRawProductBundles>>[number]): AdminProductRecord {
  return {
    id: bundle.row.id,
    legacyId: bundle.row.legacyId ?? undefined,
    slug: bundle.row.slug,
    name: bundle.row.name,
    priceAmount: bundle.row.priceAmount,
    category: bundle.category,
    shortDescription: bundle.row.shortDescription,
    description: bundle.row.description ?? undefined,
    detailNote: bundle.row.detailNote ?? undefined,
    videoUrl: bundle.row.videoUrl ?? undefined,
    status: bundle.row.status,
    isFeatured: bundle.row.isFeatured,
    isCustomizable: bundle.row.isCustomizable,
    displayOrder: bundle.row.displayOrder,
    tags: bundle.tags,
    tones: bundle.tones,
    media: bundle.media.map((item) => ({
      id: item.id,
      publicId: item.publicId ?? undefined,
      secureUrl: item.secureUrl,
      format: item.format ?? undefined,
      width: item.width,
      height: item.height,
      alt: item.alt,
      position: item.position,
      isCover: item.isCover,
    })),
    attributes: bundle.attributes.map((item) => ({
      label: item.label,
      value: item.value,
      position: item.position,
    })),
    createdAt: bundle.row.createdAt.toISOString(),
    updatedAt: bundle.row.updatedAt.toISOString(),
  };
}

async function getCategoryId(categorySlug: string) {
  const db = getDatabase();
  const row = await db.query.categories.findFirst({ where: eq(categories.slug, categorySlug) });
  if (!row) throw new Error(`Category "${categorySlug}" has not been seeded`);
  return row.id;
}

async function replaceRelations(db: DatabaseExecutor, productId: string, input: AdminProductInput) {
  await Promise.all([
    db.delete(productMedia).where(eq(productMedia.productId, productId)),
    db.delete(productAttributes).where(eq(productAttributes.productId, productId)),
    db.delete(productTags).where(eq(productTags.productId, productId)),
    db.delete(productTones).where(eq(productTones.productId, productId)),
  ]);

  if (input.media.length > 0) {
    await db.insert(productMedia).values(
      input.media.map((item, index) => ({
        productId,
        publicId: item.publicId,
        secureUrl: item.secureUrl,
        format: item.format,
        width: item.width,
        height: item.height,
        alt: item.alt,
        position: item.position ?? index,
        isCover: item.isCover || (!input.media.some((media) => media.isCover) && index === 0),
      })),
    );
  }

  if (input.attributes.length > 0) {
    await db.insert(productAttributes).values(
      input.attributes.map((item, index) => ({
        productId,
        label: item.label,
        value: item.value,
        position: item.position ?? index,
      })),
    );
  }

  for (const tagName of [...new Set(input.tags)]) {
    const tagSlug = slugify(tagName);
    if (!tagSlug) continue;
    const [tag] = await db
      .insert(tags)
      .values({ slug: tagSlug, name: tagName })
      .onConflictDoUpdate({ target: tags.slug, set: { name: tagName } })
      .returning({ id: tags.id });
    await db.insert(productTags).values({ productId, tagId: tag.id }).onConflictDoNothing();
  }

  if (input.tones.length > 0) {
    const toneRows = await db.select({ id: tones.id, slug: tones.slug }).from(tones).where(inArray(tones.slug, input.tones));
    if (toneRows.length !== input.tones.length) throw new Error("One or more tones have not been seeded");
    await db.insert(productTones).values(toneRows.map((tone) => ({ productId, toneId: tone.id })));
  }
}

export class AdminCatalogService {
  async listProducts() {
    return (await getRawProductBundles()).map(toAdminRecord);
  }

  async getProduct(id: string) {
    return (await this.listProducts()).find((product) => product.id === id) ?? null;
  }

  async createProduct(rawInput: unknown) {
    const input = adminProductInputSchema.parse(rawInput);
    const db = getDatabase();
    const categoryId = await getCategoryId(input.category);
    const createdId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(products)
        .values({
          legacyId: input.legacyId,
          slug: input.slug,
          name: input.name,
          priceAmount: input.priceAmount,
          categoryId,
          shortDescription: input.shortDescription,
          description: input.description || null,
          detailNote: input.detailNote || null,
          videoUrl: input.videoUrl || null,
          status: input.status,
          isFeatured: input.isFeatured,
          isCustomizable: input.isCustomizable,
          displayOrder: input.displayOrder,
          publishedAt: input.status === "published" ? new Date() : null,
        })
        .returning({ id: products.id });
      await replaceRelations(tx, created.id, input);
      return created.id;
    });

    return this.getProduct(createdId);
  }

  async updateProduct(id: string, rawInput: unknown) {
    const input = adminProductInputSchema.parse({ ...(rawInput as object), id });
    const db = getDatabase();
    const existing = await this.getProduct(id);
    if (!existing) return null;
    const categoryId = await getCategoryId(input.category);

    await db.transaction(async (tx) => {
      await tx
        .update(products)
        .set({
          legacyId: input.legacyId,
          slug: input.slug,
          name: input.name,
          priceAmount: input.priceAmount,
          categoryId,
          shortDescription: input.shortDescription,
          description: input.description || null,
          detailNote: input.detailNote || null,
          videoUrl: input.videoUrl || null,
          status: input.status,
          isFeatured: input.isFeatured,
          isCustomizable: input.isCustomizable,
          displayOrder: input.displayOrder,
          ...(input.status === "published" && existing.status !== "published"
            ? { publishedAt: new Date() }
            : input.status !== "published"
              ? { publishedAt: null }
              : {}),
          updatedAt: new Date(),
        })
        .where(eq(products.id, id));
      await replaceRelations(tx, id, input);
    });
    return this.getProduct(id);
  }

  async deleteProduct(id: string) {
    const db = getDatabase();
    const existing = await this.getProduct(id);
    if (!existing) return null;
    await db.delete(products).where(eq(products.id, id));
    return {
      product: existing,
      cloudinaryPublicIds: existing.media.flatMap((item) => (item.publicId ? [item.publicId] : [])),
    };
  }
}
