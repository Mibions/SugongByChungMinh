import type { CollectionEntry } from "astro:content";
import { withBase } from "../../lib/url";
import { productSchema } from "./product.schema";
import type { Product } from "./product.types";

export function mapProductEntry(entry: CollectionEntry<"products">): Product {
  const slug = entry.id.replace(/\.mdx?$/, "");

  return productSchema.parse({
    ...entry.data,
    slug,
    description: entry.body,
    images: entry.data.images.map((image) => ({
      ...image,
      url: withBase(image.url),
    })),
  });
}
