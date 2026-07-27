# Catalogue contract v2

## Canonical database model

The database is the source of truth. It stores normalized product, media,
category, collection, tone, tag, and attribute records.

The following legacy fields are never persisted:

- `formattedPrice`: derived from `priceAmount`
- `coverImage`: derived from the media row marked `isCover`
- `gallery` and `images`: both derived from ordered `product_media`
- `featured`: derived from `isFeatured`
- `published`: derived from `status === "published"`

Graduation hats are products in the `graduation` category and the
`graduation-hats` collection. The legacy `GraduationHat` API is maintained by a
compatibility mapper.

## Recommended public DTO

```ts
type CatalogProductDto = {
  id: string;
  slug: string;
  name: string;
  priceAmount: number | null;
  priceLabel: string;
  category: {
    slug: string;
    name: string;
  };
  shortDescription: string;
  description?: string;
  status: "draft" | "published" | "hidden";
  isFeatured: boolean;
  isCustomizable: boolean;
  displayOrder: number;
  media: Array<{
    id: string;
    type: "image" | "video";
    url: string;
    publicId?: string;
    alt: string;
    width: number;
    height: number;
    position: number;
    isCover: boolean;
  }>;
  tones: string[];
  tags: string[];
  attributes: Array<{
    label: string;
    value: string;
    position: number;
  }>;
  videoUrl?: string;
  publishedAt?: string;
  updatedAt: string;
};
```

## Migration phases

1. Database repository returns the existing frontend contract.
2. Admin operates only on the canonical database input.
3. Public API introduces `/v2` DTOs while legacy static JSON remains available.
4. Frontend components migrate from `coverImage/gallery/images` to `media`.
5. Legacy booleans and the separate graduation-hat domain are removed.

This phased approach prevents a database migration from becoming a simultaneous
frontend rewrite.
