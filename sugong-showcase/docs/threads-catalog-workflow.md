# Threads Catalog review and import

The current website already has a PostgreSQL/Drizzle catalog, token-authenticated admin, editable classifications, Cloudinary uploads and CSV/XLSX import. This change connects the review workbook to that system. It does not create a second database or publish source posts as verified products.

## Source inventory (2026-11-02)

- 79 distinct accessible Post IDs, earliest 2025-10-03 and latest 2026-11-02 UTC.
- Scrolling stopped after five consecutive passes without new IDs. This establishes the accessible profile feed in that session, not deleted/private posts or every reply.
- 54 posts linked to 21 draft product families, 18 skipped operational/event posts and 7 requiring further review.
- 224 distinct photo references identified across the feed and retained downloads. Only 61 image files survived download/synchronization, including one byte duplicate. Original resolution and complete carousel coverage remain unverified.
- One earlier catalog alias (`SGCM-BAG-002`) is merged into `SGCM-BAG-001` as a continuation of the tote thread. This is not a verified mapping of every tote photo to a sellable variant.
- The browser hit a URL policy block during image collection. Further browser collection was stopped. Missing images remain explicitly marked.

## Workbook contract

Use the complete `Sugong_Product_Catalog.xlsx`, including its dashboard. Import explicitly selects `01_Products` when present. Other CSV/XLSX files retain the first-sheet contract.

| Catalog column | Admin field / behavior |
| --- | --- |
| Product_ID | Stable `legacyId`, used before slug when matching |
| Name_VI / Slug | Name / slug |
| Category_ID | BAG → bag, BOX → gift, HAT → graduation, MUS → fabrics, CLO → clothing, KEY → keychains, ACC → accessories; named scrunchie families use scrunchie |
| Description | Description and bounded short description |
| Current_Price_VND | Blank means unknown; only integer VND amounts are accepted |
| Primary_Post_ID / Drive_Folder_URL / Notes | Retained in the private review note |
| Status | MERGED, SKIPPED and ARCHIVED rows are skipped; all other Catalog rows become draft |

The `03_Images` sheet is a source inventory. A Drive viewer URL is not an image CDN URL. Review the downloaded media, assign it to a specific product/variant, and upload chosen files through the existing product form. Catalog import intentionally does not fetch temporary Threads CDN links or treat Drive viewer pages as product images.

The three Princess mini-set names are candidate variants with no issued sellable SKU. The current website model has no inventory-bearing variant table; do not represent these as independently stocked SKUs without a separate variant requirement.

## Operator workflow

1. Import the full workbook in admin and inspect preview. New files default to create-only.
2. Review skipped aliases and resolve duplicate Product_ID/slug errors before committing.
3. Confirm category configuration (especially fabrics, clothing, accessories and keychains), images, material, dimensions, current prices and availability. The historical-price column in Posts is evidence at the post date, not current pricing.
4. Upload approved photos, select verified colors and complete the product form. Published products still require media and at least one tone.
5. Compare existing storefront tote/hat records manually before merging families. Catalog import refuses to overwrite a published product or to silently claim an existing slug with a new Catalog ID.
6. Publish only reviewed products. A site rebuild is still required for this static Astro storefront.

## Persistence and safety

Imports preserve existing media when no replacement URLs were supplied, and preserve existing attributes/classifications. Blank price does not erase an existing confirmed price. Reimports of a draft match stable Product_ID even if its slug changes. Slug/ID conflicts fail before remote uploads. URLs containing commas are kept intact. Negative prices, ranges and shorthand such as `68k` are rejected instead of being stripped into plausible numbers.

No stock, dimensions, colors, current price or material is inferred from an old promotion. No new production products were committed during this repository change.

## Verification and deployment

Run `pnpm test:import`, `pnpm check:server` and `pnpm build` with Node 22 and the committed pnpm lockfile. Parser tests cover multi-sheet workbooks, source IDs, alias skips, duplicate identities, unknown fields, unsafe price coercion and legacy image URL behavior.

Live import requires the existing Vercel admin API, database, Cloudinary and admin credentials documented in `database-admin-deployment.md`. GitHub Pages serves only the static storefront; it cannot run the admin API. Database/Cloudinary writes and a production deployment must be verified in the configured environment. Local parser/build checks do not establish that the live import has run.
