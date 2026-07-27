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

Graduation hats are regular products in the `graduation` category and the
`graduation-hats` collection. Legacy graduation URLs remain available, but they
return the shared `Product` contract and no longer require a separate domain,
repository or service.

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

## Migration status

Completed:

- Database and local fallback return the same frontend `Product` contract.
- Admin operates on the canonical database input.
- Tote bag and graduation hat records use the shared seed factory.
- The separate graduation-hat and tote-bag domains were removed.

Future, intentionally deferred to avoid breaking current clients:

1. Introduce a versioned public DTO.
2. Migrate frontend components from `coverImage/gallery/images` to one `media`
   array.
3. Remove the derived compatibility fields `featured` and `published`.
