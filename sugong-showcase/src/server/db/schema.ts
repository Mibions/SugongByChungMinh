import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const productStatusEnum = pgEnum("product_status", ["draft", "published", "hidden"]);
export const importStatusEnum = pgEnum("import_status", ["previewed", "processing", "completed", "failed"]);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    parentId: uuid("parent_id"),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("categories_slug_unique").on(table.slug),
    index("categories_parent_order_index").on(table.parentId, table.displayOrder),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "categories_parent_id_categories_id_fk",
    }).onDelete("restrict"),
  ],
);

export const productTypes = pgTable(
  "product_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("product_types_slug_unique").on(table.slug),
    index("product_types_active_order_index").on(table.isActive, table.displayOrder),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: text("legacy_id"),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    priceAmount: integer("price_amount"),
    category: text("category").notNull(),
    productType: text("product_type"),
    shortDescription: text("short_description").notNull(),
    description: text("description"),
    detailNote: text("detail_note"),
    videoUrl: text("video_url"),
    status: productStatusEnum("status").notNull().default("draft"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isCustomizable: boolean("is_customizable").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    tones: jsonb("tones").$type<string[]>().notNull().default([]),
    classifications: jsonb("classifications").$type<string[]>().notNull().default([]),
    media: jsonb("media").$type<Array<{
      id?: string;
      publicId?: string;
      secureUrl: string;
      format?: string;
      width: number;
      height: number;
      alt: string;
      position: number;
      isCover: boolean;
    }>>().notNull().default([]),
    attributes: jsonb("attributes").$type<Array<{
      id?: string;
      definitionId?: string;
      label: string;
      value: string;
      position: number;
    }>>().notNull().default([]),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("products_slug_unique").on(table.slug),
    uniqueIndex("products_legacy_id_unique").on(table.legacyId),
    index("products_status_order_index").on(table.status, table.displayOrder),
    index("products_category_slug_index").on(table.category),
    index("products_product_type_slug_index").on(table.productType),
  ],
);

export const classificationGroups = pgTable(
  "classification_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    selectionMode: text("selection_mode").$type<"single" | "multiple">().notNull().default("multiple"),
    isFilterable: boolean("is_filterable").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("classification_groups_slug_unique").on(table.slug),
    index("classification_groups_active_order_index").on(table.isActive, table.displayOrder),
  ],
);

export const classificationValues = pgTable(
  "classification_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => classificationGroups.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    isActive: boolean("is_active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("classification_values_group_slug_unique").on(table.groupId, table.slug),
    index("classification_values_group_order_index").on(table.groupId, table.displayOrder),
  ],
);

export const attributeDefinitions = pgTable(
  "attribute_definitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    dataType: text("data_type")
      .$type<"text" | "number" | "boolean" | "select" | "multi_select">()
      .notNull()
      .default("text"),
    unit: text("unit"),
    options: jsonb("options").$type<Array<{ label: string; value: string }>>().notNull().default([]),
    isFilterable: boolean("is_filterable").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("attribute_definitions_slug_unique").on(table.slug)],
);

export const productTypeAttributes = pgTable(
  "product_type_attributes",
  {
    productTypeId: uuid("product_type_id")
      .notNull()
      .references(() => productTypes.id, { onDelete: "cascade" }),
    attributeDefinitionId: uuid("attribute_definition_id")
      .notNull()
      .references(() => attributeDefinitions.id, { onDelete: "restrict" }),
    isRequired: boolean("is_required").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.productTypeId, table.attributeDefinitionId] }),
    index("product_type_attributes_order_index").on(table.productTypeId, table.displayOrder),
  ],
);

export const productTemplates = pgTable(
  "product_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    productTypeId: uuid("product_type_id").references(() => productTypes.id, { onDelete: "set null" }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    defaults: jsonb("defaults").$type<Record<string, unknown>>().notNull().default({}),
    priority: integer("priority").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("product_templates_slug_unique").on(table.slug),
    index("product_templates_active_priority_index").on(table.isActive, table.priority),
  ],
);

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    status: productStatusEnum("status").notNull().default("draft"),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("collections_slug_unique").on(table.slug)],
);

export const collectionProducts = pgTable(
  "collection_products",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.collectionId, table.productId] }),
    index("collection_products_position_index").on(table.collectionId, table.position),
  ],
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
  },
  (table) => [
    uniqueIndex("admin_sessions_token_hash_unique").on(table.tokenHash),
    index("admin_sessions_expiry_index").on(table.expiresAt),
  ],
);

export const adminLoginAttempts = pgTable("admin_login_attempts", {
  identifier: text("identifier").primaryKey(),
  attemptCount: integer("attempt_count").notNull().default(0),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull().defaultNow(),
  blockedUntil: timestamp("blocked_until", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id").references(() => adminSessions.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("admin_audit_logs_created_index").on(table.createdAt)],
);

export const importJobs = pgTable("import_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => adminSessions.id, { onDelete: "set null" }),
  fileName: text("file_name").notNull(),
  status: importStatusEnum("status").notNull().default("previewed"),
  totalRows: integer("total_rows").notNull().default(0),
  successRows: integer("success_rows").notNull().default(0),
  failedRows: integer("failed_rows").notNull().default(0),
  errors: jsonb("errors").$type<Array<{ row: number; message: string }>>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
