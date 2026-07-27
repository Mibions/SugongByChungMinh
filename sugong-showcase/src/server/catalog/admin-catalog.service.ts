import { eq, inArray } from "drizzle-orm";
import { getDatabase } from "../db/client.js";
import {
  categories,
  classificationValues,
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
import {
  adminProductInputSchema,
  type AdminProductInput,
  type AdminProductRecord,
  type AdminProductSummary,
} from "./product-input.js";
import { getRawProductBundle, type ProductBundle } from "./postgres-product.repository.js";
import { slugify } from "../../lib/slug.js";

type Database = ReturnType<typeof getDatabase>;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type DatabaseExecutor = Database | Transaction;

function toAdminRecord(bundle: ProductBundle): AdminProductRecord {
  return {
    id: bundle.row.id,
    legacyId: bundle.row.legacyId ?? undefined,
    slug: bundle.row.slug,
    name: bundle.row.name,
    priceAmount: bundle.row.priceAmount,
    category: bundle.category,
    productType: bundle.productType,
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
    classifications: bundle.classifications,
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
      definitionId: item.attributeDefinitionId ?? undefined,
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

async function getProductTypeId(productTypeSlug: string | undefined) {
  if (!productTypeSlug) return null;
  const db = getDatabase();
  const row = await db.query.productTypes.findFirst({ where: eq(productTypes.slug, productTypeSlug) });
  if (!row) throw new Error(`Product type "${productTypeSlug}" does not exist`);
  return row.id;
}

async function replaceRelations(db: DatabaseExecutor, productId: string, input: AdminProductInput) {
  await db.delete(productMedia).where(eq(productMedia.productId, productId));
  await db.delete(productAttributes).where(eq(productAttributes.productId, productId));
  await db.delete(productTags).where(eq(productTags.productId, productId));
  await db.delete(productTones).where(eq(productTones.productId, productId));
  await db.delete(productClassifications).where(eq(productClassifications.productId, productId));

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
        attributeDefinitionId: item.definitionId,
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

  if (input.classifications.length > 0) {
    const values = await db
      .select({ id: classificationValues.id })
      .from(classificationValues)
      .where(inArray(classificationValues.id, input.classifications));
    if (values.length !== new Set(input.classifications).size) {
      throw new Error("One or more classifications do not exist");
    }
    await db.insert(productClassifications).values(
      [...new Set(input.classifications)].map((classificationValueId, position) => ({
        productId,
        classificationValueId,
        position,
      })),
    );
  }
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
        category: categories.slug,
        productType: productTypes.slug,
        status: products.status,
        isFeatured: products.isFeatured,
        displayOrder: products.displayOrder,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(productTypes, eq(products.productTypeId, productTypes.id))
      .orderBy(products.displayOrder, products.updatedAt);

    return rows.map((row) => ({
      ...row,
      legacyId: row.legacyId ?? undefined,
      productType: row.productType ?? undefined,
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async getProduct(id: string) {
    const bundle = await getRawProductBundle(id);
    return bundle ? toAdminRecord(bundle) : null;
  }

  async createProduct(rawInput: unknown) {
    const input = adminProductInputSchema.parse(rawInput);
    const db = getDatabase();
    const categoryId = await getCategoryId(input.category);
    const productTypeId = await getProductTypeId(input.productType);
    const createdId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(products)
        .values({
          legacyId: input.legacyId,
          slug: input.slug,
          name: input.name,
          priceAmount: input.priceAmount,
          categoryId,
          productTypeId,
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
    const productTypeId = await getProductTypeId(input.productType);

    await db.transaction(async (tx) => {
      await tx
        .update(products)
        .set({
          legacyId: input.legacyId,
          slug: input.slug,
          name: input.name,
          priceAmount: input.priceAmount,
          categoryId,
          productTypeId,
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
