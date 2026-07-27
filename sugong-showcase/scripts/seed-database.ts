import "dotenv/config";
import { eq } from "drizzle-orm";
import { localProducts } from "../src/data/local/products";
import { graduationHats } from "../src/data/local/graduation-hats";
import { productCategoryMeta, productToneFilters, type ProductTone } from "../src/domain/product/product-taxonomy";
import type { Product } from "../src/domain/product/product.types";
import { mapToteBagsToProducts } from "../src/lib/tote-bags";
import { AdminCatalogService } from "../src/server/catalog/admin-catalog.service";
import { closeDatabase, getDatabase } from "../src/server/db/client";
import { categories, collectionProducts, collections, tones } from "../src/server/db/schema";

const db = getDatabase();
const admin = new AdminCatalogService();

function mapProduct(product: Product) {
  return {
    legacyId: product.id,
    slug: product.slug,
    name: product.name,
    priceAmount: product.price,
    category: product.category,
    shortDescription: product.shortDescription,
    description: product.description,
    detailNote: product.detailNote,
    videoUrl: product.videoUrl,
    status: product.status,
    isFeatured: product.isFeatured,
    isCustomizable: product.customizable,
    displayOrder: product.displayOrder,
    tags: product.tags,
    tones: product.tones,
    media: product.images.map((image, index) => ({
      publicId: image.publicId,
      secureUrl: image.url,
      width: image.width,
      height: image.height,
      alt: image.alt,
      position: image.sortOrder ?? index,
      isCover: image.url === product.coverImage.url,
    })),
    attributes: (product.detailItems ?? []).map((item, index) => ({ ...item, position: index })),
  };
}

function graduationTone(tone: string): ProductTone[] {
  if (tone === "blue") return ["blue"];
  if (tone === "pink") return ["pink"];
  if (tone === "white") return ["cream"];
  if (tone === "purple") return ["lavender"];
  if (tone === "mixed") return ["pink", "lavender", "cream"];
  return ["neutral"];
}

try {
  for (const [index, category] of Object.values(productCategoryMeta).entries()) {
    await db
      .insert(categories)
      .values({
        slug: category.value,
        name: category.label,
        displayOrder: index,
      })
      .onConflictDoUpdate({
        target: categories.slug,
        set: { name: category.label, displayOrder: index, isActive: true, updatedAt: new Date() },
      });
  }

  for (const tone of productToneFilters) {
    await db
      .insert(tones)
      .values({ slug: tone.value, name: tone.label })
      .onConflictDoUpdate({ target: tones.slug, set: { name: tone.label } });
  }

  const seedProducts = [...localProducts, ...mapToteBagsToProducts()];
  for (const product of seedProducts) {
    const existing = (await admin.listProducts()).find((item) => item.legacyId === product.id || item.slug === product.slug);
    if (existing) await admin.updateProduct(existing.id, mapProduct(product));
    else await admin.createProduct(mapProduct(product));
  }

  const graduationProductIds: string[] = [];
  for (const hat of graduationHats) {
    const input = {
      legacyId: hat.id,
      slug: hat.slug,
      name: hat.name,
      priceAmount: null,
      category: "graduation" as const,
      shortDescription: hat.shortDescription,
      description: hat.description,
      videoUrl: hat.tiktokUrl,
      status: hat.status,
      isFeatured: hat.isFeatured,
      isCustomizable: true,
      displayOrder: hat.displayOrder,
      tags: hat.tags,
      tones: graduationTone(hat.tone),
      media: hat.gallery.map((image, index) => ({
        publicId: image.publicId,
        secureUrl: image.url,
        width: image.width,
        height: image.height,
        alt: image.alt,
        position: index,
        isCover: image.url === hat.coverImage.url,
      })),
      attributes: [{ label: "Tone màu", value: hat.tone, position: 0 }],
    };
    const existing = (await admin.listProducts()).find((item) => item.legacyId === hat.id || item.slug === hat.slug);
    const saved = existing ? await admin.updateProduct(existing.id, input) : await admin.createProduct(input);
    if (saved) graduationProductIds.push(saved.id);
  }

  const [collection] = await db
    .insert(collections)
    .values({
      slug: "graduation-hats",
      name: "Nón tốt nghiệp handmade",
      description: "Bộ sưu tập nón tốt nghiệp trang trí thủ công.",
      status: "published",
      displayOrder: 1,
    })
    .onConflictDoUpdate({
      target: collections.slug,
      set: { status: "published", updatedAt: new Date() },
    })
    .returning({ id: collections.id });

  await db.delete(collectionProducts).where(eq(collectionProducts.collectionId, collection.id));
  if (graduationProductIds.length > 0) {
    await db.insert(collectionProducts).values(
      graduationProductIds.map((productId, position) => ({
        collectionId: collection.id,
        productId,
        position,
      })),
    );
  }

  console.log(`Seeded ${seedProducts.length + graduationProductIds.length} products.`);
} finally {
  await closeDatabase();
}
