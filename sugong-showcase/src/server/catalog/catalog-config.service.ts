import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "../db/client.js";
import {
  attributeDefinitions,
  categories,
  classificationGroups,
  classificationValues,
  collections,
  productTemplates,
  productTypeAttributes,
  productTypes,
} from "../db/schema.js";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang");

const baseTaxonomySchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  displayOrder: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

const categoryInputSchema = baseTaxonomySchema.extend({
  parentId: z.string().uuid().nullable().optional(),
});

const productTypeInputSchema = baseTaxonomySchema.extend({
  attributeDefinitionIds: z.array(z.string().uuid()).max(50).default([]),
});

const classificationGroupInputSchema = baseTaxonomySchema.extend({
  selectionMode: z.enum(["single", "multiple"]).default("multiple"),
  isFilterable: z.boolean().default(true),
});

const classificationValueInputSchema = z.object({
  groupId: z.string().uuid(),
  slug: slugSchema,
  name: z.string().trim().min(1).max(160),
  metadata: z.record(z.string(), z.unknown()).default({}),
  displayOrder: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

const attributeDefinitionInputSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(160),
  dataType: z.enum(["text", "number", "boolean", "select", "multi_select"]).default("text"),
  unit: z.string().trim().max(40).optional().or(z.literal("")),
  options: z
    .array(z.object({ label: z.string().trim().min(1), value: z.string().trim().min(1) }))
    .max(100)
    .default([]),
  isFilterable: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

const templateInputSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  productTypeId: z.string().uuid().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  defaults: z.record(z.string(), z.unknown()).default({}),
  priority: z.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});

const collectionInputSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  status: z.enum(["draft", "published", "hidden"]).default("draft"),
  displayOrder: z.number().int().nonnegative().default(0),
});

export type CatalogResource =
  | "categories"
  | "product-types"
  | "classification-groups"
  | "classification-values"
  | "attribute-definitions"
  | "product-templates"
  | "collections";

export class CatalogConfigService {
  async list() {
    const db = getDatabase();
    const [
      categoryRows,
      productTypeRows,
      groupRows,
      valueRows,
      definitionRows,
      typeAttributeRows,
      templateRows,
      collectionRows,
    ] = await Promise.all([
      db.select().from(categories).orderBy(asc(categories.displayOrder), asc(categories.name)),
      db.select().from(productTypes).orderBy(asc(productTypes.displayOrder), asc(productTypes.name)),
      db
        .select()
        .from(classificationGroups)
        .orderBy(asc(classificationGroups.displayOrder), asc(classificationGroups.name)),
      db
        .select()
        .from(classificationValues)
        .orderBy(asc(classificationValues.displayOrder), asc(classificationValues.name)),
      db.select().from(attributeDefinitions).orderBy(asc(attributeDefinitions.name)),
      db.select().from(productTypeAttributes).orderBy(asc(productTypeAttributes.displayOrder)),
      db
        .select()
        .from(productTemplates)
        .orderBy(asc(productTemplates.priority), asc(productTemplates.name)),
      db.select().from(collections).orderBy(asc(collections.displayOrder), asc(collections.name)),
    ]);

    return {
      categories: categoryRows,
      productTypes: productTypeRows.map((item) => ({
        ...item,
        attributeDefinitionIds: typeAttributeRows
          .filter((relation) => relation.productTypeId === item.id)
          .map((relation) => relation.attributeDefinitionId),
      })),
      classificationGroups: groupRows.map((group) => ({
        ...group,
        values: valueRows.filter((value) => value.groupId === group.id),
      })),
      attributeDefinitions: definitionRows,
      productTemplates: templateRows,
      collections: collectionRows,
      tags: [],
    };
  }

  async save(resource: CatalogResource, id: string | undefined, rawInput: unknown) {
    const db = getDatabase();
    const now = new Date();

    if (resource === "categories") {
      const input = categoryInputSchema.parse(rawInput);
      if (id && input.parentId === id) throw new Error("Danh mục không thể là danh mục cha của chính nó");
      const values = {
        slug: input.slug,
        name: input.name,
        description: input.description || null,
        parentId: input.parentId ?? null,
        displayOrder: input.displayOrder,
        isActive: input.isActive,
        updatedAt: now,
      };
      if (id) {
        const [saved] = await db.update(categories).set(values).where(eq(categories.id, id)).returning();
        return saved;
      }
      const [saved] = await db.insert(categories).values(values).returning();
      return saved;
    }

    if (resource === "product-types") {
      const input = productTypeInputSchema.parse(rawInput);
      const saved = await db.transaction(async (tx) => {
        const values = {
          slug: input.slug,
          name: input.name,
          description: input.description || null,
          displayOrder: input.displayOrder,
          isActive: input.isActive,
          updatedAt: now,
        };
        const [row] = id
          ? await tx.update(productTypes).set(values).where(eq(productTypes.id, id)).returning()
          : await tx.insert(productTypes).values(values).returning();
        if (!row) return null;
        await tx.delete(productTypeAttributes).where(eq(productTypeAttributes.productTypeId, row.id));
        if (input.attributeDefinitionIds.length > 0) {
          const validDefinitions = await tx
            .select({ id: attributeDefinitions.id })
            .from(attributeDefinitions)
            .where(inArray(attributeDefinitions.id, input.attributeDefinitionIds));
          if (validDefinitions.length !== new Set(input.attributeDefinitionIds).size) {
            throw new Error("Một hoặc nhiều thuộc tính không tồn tại");
          }
          await tx.insert(productTypeAttributes).values(
            [...new Set(input.attributeDefinitionIds)].map((attributeDefinitionId, displayOrder) => ({
              productTypeId: row.id,
              attributeDefinitionId,
              displayOrder,
            })),
          );
        }
        return { ...row, attributeDefinitionIds: input.attributeDefinitionIds };
      });
      return saved;
    }

    if (resource === "classification-groups") {
      const input = classificationGroupInputSchema.parse(rawInput);
      const values = { ...input, description: input.description || null, updatedAt: now };
      const [saved] = id
        ? await db.update(classificationGroups).set(values).where(eq(classificationGroups.id, id)).returning()
        : await db.insert(classificationGroups).values(values).returning();
      return saved;
    }

    if (resource === "classification-values") {
      const input = classificationValueInputSchema.parse(rawInput);
      const values = { ...input, updatedAt: now };
      const [saved] = id
        ? await db.update(classificationValues).set(values).where(eq(classificationValues.id, id)).returning()
        : await db.insert(classificationValues).values(values).returning();
      return saved;
    }

    if (resource === "attribute-definitions") {
      const input = attributeDefinitionInputSchema.parse(rawInput);
      const values = { ...input, unit: input.unit || null, updatedAt: now };
      const [saved] = id
        ? await db.update(attributeDefinitions).set(values).where(eq(attributeDefinitions.id, id)).returning()
        : await db.insert(attributeDefinitions).values(values).returning();
      return saved;
    }

    if (resource === "product-templates") {
      const input = templateInputSchema.parse(rawInput);
      const values = {
        ...input,
        description: input.description || null,
        productTypeId: input.productTypeId ?? null,
        categoryId: input.categoryId ?? null,
        updatedAt: now,
      };
      const [saved] = id
        ? await db.update(productTemplates).set(values).where(eq(productTemplates.id, id)).returning()
        : await db.insert(productTemplates).values(values).returning();
      return saved;
    }

    const input = collectionInputSchema.parse(rawInput);
    const values = { ...input, description: input.description || null, updatedAt: now };
    const [saved] = id
      ? await db.update(collections).set(values).where(eq(collections.id, id)).returning()
      : await db.insert(collections).values(values).returning();
    return saved;
  }

  async archive(resource: CatalogResource, id: string) {
    const db = getDatabase();
    const now = new Date();
    if (resource === "categories") {
      return (await db.update(categories).set({ isActive: false, updatedAt: now }).where(eq(categories.id, id)).returning())[0];
    }
    if (resource === "product-types") {
      return (await db.update(productTypes).set({ isActive: false, updatedAt: now }).where(eq(productTypes.id, id)).returning())[0];
    }
    if (resource === "classification-groups") {
      return (await db.update(classificationGroups).set({ isActive: false, updatedAt: now }).where(eq(classificationGroups.id, id)).returning())[0];
    }
    if (resource === "classification-values") {
      return (await db.update(classificationValues).set({ isActive: false, updatedAt: now }).where(eq(classificationValues.id, id)).returning())[0];
    }
    if (resource === "attribute-definitions") {
      return (await db.update(attributeDefinitions).set({ isActive: false, updatedAt: now }).where(eq(attributeDefinitions.id, id)).returning())[0];
    }
    if (resource === "product-templates") {
      return (await db.update(productTemplates).set({ isActive: false, updatedAt: now }).where(eq(productTemplates.id, id)).returning())[0];
    }
    return (await db.update(collections).set({ status: "hidden", updatedAt: now }).where(eq(collections.id, id)).returning())[0];
  }
}
