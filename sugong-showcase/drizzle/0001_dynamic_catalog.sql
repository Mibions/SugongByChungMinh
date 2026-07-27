ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "parent_id" uuid;

DO $$ BEGIN
  ALTER TABLE "categories"
    ADD CONSTRAINT "categories_parent_id_categories_id_fk"
    FOREIGN KEY ("parent_id") REFERENCES "categories" ("id") ON DELETE RESTRICT;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "categories_parent_order_index"
  ON "categories" ("parent_id", "display_order");

CREATE TABLE IF NOT EXISTS "product_types" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "display_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "product_types_slug_unique" ON "product_types" ("slug");
CREATE INDEX IF NOT EXISTS "product_types_active_order_index" ON "product_types" ("is_active", "display_order");

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "product_type_id" uuid;
DO $$ BEGIN
  ALTER TABLE "products"
    ADD CONSTRAINT "products_product_type_id_product_types_id_fk"
    FOREIGN KEY ("product_type_id") REFERENCES "product_types" ("id") ON DELETE RESTRICT;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "products_product_type_index" ON "products" ("product_type_id");

CREATE TABLE IF NOT EXISTS "classification_groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "selection_mode" text NOT NULL DEFAULT 'multiple'
    CHECK ("selection_mode" IN ('single', 'multiple')),
  "is_filterable" boolean NOT NULL DEFAULT true,
  "is_active" boolean NOT NULL DEFAULT true,
  "display_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "classification_groups_slug_unique"
  ON "classification_groups" ("slug");
CREATE INDEX IF NOT EXISTS "classification_groups_active_order_index"
  ON "classification_groups" ("is_active", "display_order");

CREATE TABLE IF NOT EXISTS "classification_values" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "group_id" uuid NOT NULL REFERENCES "classification_groups" ("id") ON DELETE CASCADE,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "is_active" boolean NOT NULL DEFAULT true,
  "display_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "classification_values_group_slug_unique"
  ON "classification_values" ("group_id", "slug");
CREATE INDEX IF NOT EXISTS "classification_values_group_order_index"
  ON "classification_values" ("group_id", "display_order");

CREATE TABLE IF NOT EXISTS "product_classifications" (
  "product_id" uuid NOT NULL REFERENCES "products" ("id") ON DELETE CASCADE,
  "classification_value_id" uuid NOT NULL REFERENCES "classification_values" ("id") ON DELETE RESTRICT,
  "position" integer NOT NULL DEFAULT 0,
  PRIMARY KEY ("product_id", "classification_value_id")
);
CREATE INDEX IF NOT EXISTS "product_classifications_value_index"
  ON "product_classifications" ("classification_value_id");

CREATE TABLE IF NOT EXISTS "attribute_definitions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "data_type" text NOT NULL DEFAULT 'text'
    CHECK ("data_type" IN ('text', 'number', 'boolean', 'select', 'multi_select')),
  "unit" text,
  "options" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "is_filterable" boolean NOT NULL DEFAULT false,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "attribute_definitions_slug_unique"
  ON "attribute_definitions" ("slug");

CREATE TABLE IF NOT EXISTS "product_type_attributes" (
  "product_type_id" uuid NOT NULL REFERENCES "product_types" ("id") ON DELETE CASCADE,
  "attribute_definition_id" uuid NOT NULL REFERENCES "attribute_definitions" ("id") ON DELETE RESTRICT,
  "is_required" boolean NOT NULL DEFAULT false,
  "display_order" integer NOT NULL DEFAULT 0,
  PRIMARY KEY ("product_type_id", "attribute_definition_id")
);
CREATE INDEX IF NOT EXISTS "product_type_attributes_order_index"
  ON "product_type_attributes" ("product_type_id", "display_order");

ALTER TABLE "product_attributes" ADD COLUMN IF NOT EXISTS "attribute_definition_id" uuid;
DO $$ BEGIN
  ALTER TABLE "product_attributes"
    ADD CONSTRAINT "product_attributes_definition_id_fk"
    FOREIGN KEY ("attribute_definition_id") REFERENCES "attribute_definitions" ("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "product_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "product_type_id" uuid REFERENCES "product_types" ("id") ON DELETE SET NULL,
  "category_id" uuid REFERENCES "categories" ("id") ON DELETE SET NULL,
  "defaults" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "priority" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "product_templates_slug_unique"
  ON "product_templates" ("slug");
CREATE INDEX IF NOT EXISTS "product_templates_active_priority_index"
  ON "product_templates" ("is_active", "priority");
