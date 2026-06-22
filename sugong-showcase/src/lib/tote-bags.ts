import { toteBags } from "../data/local/tote-bag";
import { formatProductPrice } from "../domain/product/product.helpers";
import { productSchema } from "../domain/product/product.schema";
import type { ProductTone } from "../domain/product/product-taxonomy";
import type { Product } from "../domain/product/product.types";
import type { ToteBag, ToteBagImage, ToteBagTone } from "../domain/tote-bag/tote-bag.types";
import { withBase } from "./url";

function normalizeToteBagImage(image: ToteBagImage): ToteBagImage {
  return {
    ...image,
    url: withBase(image.url),
  };
}

export function normalizeToteBag(bag: ToteBag): ToteBag {
  return {
    ...bag,
    coverImage: normalizeToteBagImage(bag.coverImage),
    gallery: (bag.gallery.length > 0 ? bag.gallery : [bag.coverImage]).map(normalizeToteBagImage),
  };
}

export function getNormalizedToteBags() {
  return toteBags.map(normalizeToteBag);
}

const toteBagToneMap: Record<ToteBagTone, ProductTone> = {
  orange: "orange",
  pink: "pink",
  purple: "lavender",
  green: "green",
  blue: "blue",
  neutral: "neutral",
};

export function mapToteBagsToProducts(): Product[] {
  return getNormalizedToteBags()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((bag) =>
      productSchema.parse({
        id: bag.id,
        slug: bag.slug,
        name: bag.name,
        price: bag.price,
        formattedPrice: formatProductPrice(bag.price),
        category: "bag",
        shortDescription: bag.shortDescription,
        description: bag.description,
        coverImage: {
          ...bag.coverImage,
          sortOrder: 0,
        },
        gallery: bag.gallery.map((image, index) => ({
          ...image,
          sortOrder: index,
        })),
        images: bag.gallery.map((image, index) => ({
          ...image,
          sortOrder: index,
        })),
        tones: [toteBagToneMap[bag.tone]],
        tags: bag.tags,
        isFeatured: bag.isFeatured,
        status: bag.status,
        displayOrder: bag.displayOrder,
        detailItems: bag.detailItems,
        detailNote: bag.detailNote,
        customizable: bag.tags.includes("custom"),
        featured: bag.isFeatured,
        published: bag.status === "published",
      }),
    );
}
