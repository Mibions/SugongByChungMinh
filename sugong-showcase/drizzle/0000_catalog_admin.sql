CREATE TYPE "product_status" AS ENUM ('draft', 'published', 'hidden');
CREATE TYPE "media_type" AS ENUM ('image', 'video');
CREATE TYPE "import_status" AS ENUM ('previewed', 'processing', 'completed', 'failed');

CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "display_order" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "categories_slug_unique" ON "categories" ("slug");

CREATE TABLE "products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "legacy_id" text,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "price_amount" integer,
  "category_id" uuid NOT NULL REFERENCES "categories" ("id") ON DELETE RESTRICT,
  "short_description" text NOT NULL,
  "description" text,
  "detail_note" text,
  "video_url" text,
  "status" product_status NOT NULL DEFAULT 'draft',
  "is_featured" boolean NOT NULL DEFAULT false,
  "is_customizable" boolean NOT NULL DEFAULT false,
  "display_order" integer NOT NULL DEFAULT 0,
  "published_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "products_slug_unique" ON "products" ("slug");
CREATE UNIQUE INDEX "products_legacy_id_unique" ON "products" ("legacy_id");
CREATE INDEX "products_status_order_index" ON "products" ("status", "display_order");
CREATE INDEX "products_category_index" ON "products" ("category_id");

CREATE TABLE "product_media" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL REFERENCES "products" ("id") ON DELETE CASCADE,
  "type" media_type NOT NULL DEFAULT 'image',
  "public_id" text,
  "secure_url" text NOT NULL,
  "format" text,
  "width" integer NOT NULL,
  "height" integer NOT NULL,
  "alt" text NOT NULL,
  "position" integer NOT NULL DEFAULT 0,
  "is_cover" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "product_media_public_id_unique" ON "product_media" ("public_id");
CREATE INDEX "product_media_product_position_index" ON "product_media" ("product_id", "position");

CREATE TABLE "tones" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "tones_slug_unique" ON "tones" ("slug");

CREATE TABLE "product_tones" (
  "product_id" uuid NOT NULL REFERENCES "products" ("id") ON DELETE CASCADE,
  "tone_id" uuid NOT NULL REFERENCES "tones" ("id") ON DELETE RESTRICT,
  PRIMARY KEY ("product_id", "tone_id")
);

CREATE TABLE "tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "tags_slug_unique" ON "tags" ("slug");

CREATE TABLE "product_tags" (
  "product_id" uuid NOT NULL REFERENCES "products" ("id") ON DELETE CASCADE,
  "tag_id" uuid NOT NULL REFERENCES "tags" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("product_id", "tag_id")
);

CREATE TABLE "product_attributes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL REFERENCES "products" ("id") ON DELETE CASCADE,
  "label" text NOT NULL,
  "value" text NOT NULL,
  "position" integer NOT NULL DEFAULT 0
);
CREATE INDEX "product_attributes_product_position_index" ON "product_attributes" ("product_id", "position");

CREATE TABLE "collections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "status" product_status NOT NULL DEFAULT 'draft',
  "display_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "collections_slug_unique" ON "collections" ("slug");

CREATE TABLE "collection_products" (
  "collection_id" uuid NOT NULL REFERENCES "collections" ("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products" ("id") ON DELETE CASCADE,
  "position" integer NOT NULL DEFAULT 0,
  PRIMARY KEY ("collection_id", "product_id")
);
CREATE INDEX "collection_products_position_index" ON "collection_products" ("collection_id", "position");

CREATE TABLE "admin_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "token_hash" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "last_seen_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "revoked_at" timestamptz,
  "ip_hash" text,
  "user_agent" text
);
CREATE UNIQUE INDEX "admin_sessions_token_hash_unique" ON "admin_sessions" ("token_hash");
CREATE INDEX "admin_sessions_expiry_index" ON "admin_sessions" ("expires_at");

CREATE TABLE "admin_login_attempts" (
  "identifier" text PRIMARY KEY,
  "attempt_count" integer NOT NULL DEFAULT 0,
  "window_started_at" timestamptz NOT NULL DEFAULT now(),
  "blocked_until" timestamptz,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "admin_audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" uuid REFERENCES "admin_sessions" ("id") ON DELETE SET NULL,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "ip_hash" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "admin_audit_logs_created_index" ON "admin_audit_logs" ("created_at");

CREATE TABLE "import_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" uuid REFERENCES "admin_sessions" ("id") ON DELETE SET NULL,
  "file_name" text NOT NULL,
  "status" import_status NOT NULL DEFAULT 'previewed',
  "total_rows" integer NOT NULL DEFAULT 0,
  "success_rows" integer NOT NULL DEFAULT 0,
  "failed_rows" integer NOT NULL DEFAULT 0,
  "errors" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "completed_at" timestamptz
);
