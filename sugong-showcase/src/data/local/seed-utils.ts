import type { ProductImage } from "../../domain/product/product.types";

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
