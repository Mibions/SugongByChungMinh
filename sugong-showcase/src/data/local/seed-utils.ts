import { formatProductPrice } from "../../domain/product/product.helpers";
import { productSchema } from "../../domain/product/product.schema";
import type { Product, ProductCategory, ProductDetailItem, ProductImage } from "../../domain/product/product.types";
import type { ProductTone } from "../../domain/product/product-taxonomy";

export type SeedImageSource = {
  fileName: string;
  alt: string;
  width: number;
  height: number;
  publicId?: string;
};

export type SeedImage = Omit<ProductImage, "sortOrder">;

export const defaultProductStatus = "published" as const;

export function createSeedImage(basePath: string, source: SeedImageSource): SeedImage {
  return {
    url: source.fileName.startsWith("/") ? source.fileName : `${basePath}/${source.fileName}`,
    alt: source.alt,
    width: source.width,
    height: source.height,
    publicId: source.publicId,
  };
}

export function createSeedGallery(basePath: string, sources: readonly SeedImageSource[]): SeedImage[] {
  return sources.map((source) => createSeedImage(basePath, source));
}

export function createProductGallery(basePath: string, sources: readonly SeedImageSource[]): ProductImage[] {
  return createSeedGallery(basePath, sources).map((image, sortOrder) => ({
    ...image,
    sortOrder,
  }));
}

export function pickCoverImage<T>(images: readonly [T, ...T[]] | readonly T[]): T {
  const coverImage = images[0];

  if (!coverImage) {
    throw new Error("Seed gallery must contain at least one image");
  }

  return coverImage;
}

export type SeedProductInput = {
  id: string;
  slug: string;
  name: string;
  price: number | null;
  category: ProductCategory;
  shortDescription: string;
  description?: string;
  basePath: string;
  images: [SeedImageSource, ...SeedImageSource[]];
  tones: ProductTone[];
  tags: string[];
  customizable: boolean;
  displayOrder: number;
  isFeatured?: boolean;
  detailItems?: ProductDetailItem[];
  detailNote?: string;
  videoUrl?: string;
};

export function createSeedProduct(input: SeedProductInput): Product {
  const gallery = createProductGallery(input.basePath, input.images);
  const isFeatured = input.isFeatured ?? false;

  return productSchema.parse({
    id: input.id,
    slug: input.slug,
    name: input.name,
    price: input.price,
    formattedPrice: formatProductPrice(input.price),
    category: input.category,
    shortDescription: input.shortDescription,
    description: input.description,
    coverImage: pickCoverImage(gallery),
    gallery,
    images: gallery,
    tones: input.tones,
    tags: input.tags,
    isFeatured,
    status: defaultProductStatus,
    displayOrder: input.displayOrder,
    detailItems: input.detailItems,
    detailNote: input.detailNote,
    videoUrl: input.videoUrl,
    customizable: input.customizable,
    featured: isFeatured,
    published: true,
  });
}
