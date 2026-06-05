import type { Product } from "./product.types";

export type ApiProductResponse = {
  id: string;
  slug: string;
  name: string;
  price: number | null;
  currency: string;
  category: { id: string; name: string };
  shortDescription: string;
  description?: string;
  images: Array<{
    url: string;
    alt: string;
    width: number;
    height: number;
    sortOrder: number;
  }>;
  videoUrl?: string | null;
  customizable: boolean;
  featured: boolean;
  published: boolean;
};

export function mapApiProduct(input: ApiProductResponse): Product {
  return {
    id: input.id,
    slug: input.slug,
    name: input.name,
    price: input.price,
    formattedPrice:
      input.price === null
        ? "Liên hệ"
        : new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: input.currency || "VND",
            maximumFractionDigits: 0,
          }).format(input.price),
    category: input.category.id as Product["category"],
    shortDescription: input.shortDescription,
    description: input.description,
    images: [...input.images].sort((a, b) => a.sortOrder - b.sortOrder),
    videoUrl: input.videoUrl ?? undefined,
    customizable: input.customizable,
    featured: input.featured,
    published: input.published,
  };
}
