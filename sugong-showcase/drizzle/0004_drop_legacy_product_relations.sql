-- The JSON product document introduced in 0003 is now the only runtime model.
-- Abort if any legacy relation contains more data than its JSON counterpart.

DO $$
DECLARE
  unsafe_rows integer;
BEGIN
  SELECT count(*) INTO unsafe_rows
  FROM products p
  WHERE p.category IS NULL
    OR jsonb_typeof(p.media) <> 'array'
    OR jsonb_typeof(p.tags) <> 'array'
    OR jsonb_typeof(p.tones) <> 'array'
    OR jsonb_typeof(p.classifications) <> 'array'
    OR jsonb_typeof(p.attributes) <> 'array'
    OR (SELECT count(*) FROM product_media pm WHERE pm.product_id = p.id) > jsonb_array_length(p.media)
    OR (SELECT count(*) FROM product_attributes pa WHERE pa.product_id = p.id) > jsonb_array_length(p.attributes)
    OR (SELECT count(*) FROM product_tags pt WHERE pt.product_id = p.id) > jsonb_array_length(p.tags)
    OR (SELECT count(*) FROM product_tones pt WHERE pt.product_id = p.id) > jsonb_array_length(p.tones)
    OR (
      SELECT count(*)
      FROM product_classifications pc
      WHERE pc.product_id = p.id
    ) > jsonb_array_length(p.classifications);

  IF unsafe_rows > 0 THEN
    RAISE EXCEPTION 'Legacy product cleanup aborted: % product rows are not fully backfilled', unsafe_rows;
  END IF;
END
$$;

DROP TABLE IF EXISTS product_tags;
DROP TABLE IF EXISTS product_tones;
DROP TABLE IF EXISTS product_classifications;
DROP TABLE IF EXISTS product_attributes;
DROP TABLE IF EXISTS product_media;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS tones;

ALTER TABLE products DROP COLUMN IF EXISTS category_id;
ALTER TABLE products DROP COLUMN IF EXISTS product_type_id;

DROP TYPE IF EXISTS media_type;
