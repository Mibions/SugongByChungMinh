-- Product data is read as a catalogue document, not as an ecommerce graph.
-- Backfill first, then remove the product-only relation tables in one transaction.

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "product_type" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tags" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tones" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "classifications" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "media" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "attributes" jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE "products" AS p
SET
  "category" = c."slug",
  "product_type" = (
    SELECT pt."slug"
    FROM "product_types" pt
    WHERE pt."id" = p."product_type_id"
  ),
  "tags" = COALESCE((
    SELECT jsonb_agg(t."name" ORDER BY t."name")
    FROM "product_tags" ptag
    JOIN "tags" t ON t."id" = ptag."tag_id"
    WHERE ptag."product_id" = p."id"
  ), '[]'::jsonb),
  "tones" = COALESCE((
    SELECT jsonb_agg(t."slug" ORDER BY t."slug")
    FROM "product_tones" ptone
    JOIN "tones" t ON t."id" = ptone."tone_id"
    WHERE ptone."product_id" = p."id"
  ), '[]'::jsonb),
  "classifications" = COALESCE((
    SELECT jsonb_agg(pc."classification_value_id"::text ORDER BY pc."position")
    FROM "product_classifications" pc
    WHERE pc."product_id" = p."id"
  ), '[]'::jsonb),
  "media" = COALESCE((
    SELECT jsonb_agg(
      jsonb_strip_nulls(jsonb_build_object(
        'id', pm."id"::text,
        'publicId', pm."public_id",
        'secureUrl', pm."secure_url",
        'format', pm."format",
        'width', pm."width",
        'height', pm."height",
        'alt', pm."alt",
        'position', pm."position",
        'isCover', pm."is_cover"
      ))
      ORDER BY pm."position"
    )
    FROM "product_media" pm
    WHERE pm."product_id" = p."id"
  ), '[]'::jsonb),
  "attributes" = COALESCE((
    SELECT jsonb_agg(
      jsonb_strip_nulls(jsonb_build_object(
        'id', pa."id"::text,
        'definitionId', pa."attribute_definition_id"::text,
        'label', pa."label",
        'value', pa."value",
        'position', pa."position"
      ))
      ORDER BY pa."position"
    )
    FROM "product_attributes" pa
    WHERE pa."product_id" = p."id"
  ), '[]'::jsonb)
FROM "categories" c
WHERE c."id" = p."category_id";

ALTER TABLE "products" ALTER COLUMN "category" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "category_id" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "products_category_slug_index" ON "products" ("category");
CREATE INDEX IF NOT EXISTS "products_product_type_slug_index" ON "products" ("product_type");

-- Legacy relation tables stay intact for one release so the migration can be
-- rolled back safely. Runtime code no longer reads or writes them.
