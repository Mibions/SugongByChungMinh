import { productCategoryMeta, type ProductTone } from "./product-taxonomy";
import type { Product, ProductCategory, ProductQuery } from "./product.types";

export type ProductCategoryFilter = ProductCategory | "all";
export type ProductSort = NonNullable<ProductQuery["sort"]>;

export function formatProductPrice(price: number | null) {
  return price === null ? "Liên hệ" : `${price.toLocaleString("vi-VN")}đ`;
}

export function isProductCustomizable(product: Pick<Product, "category" | "customizable">) {
  return product.category === "custom" || product.customizable;
}

export function isProductPublished(product: Pick<Product, "status" | "published">) {
  return product.status === "published" && product.published;
}

export function isProductFeatured(product: Pick<Product, "isFeatured" | "featured">) {
  return product.isFeatured && product.featured;
}

export function getProductPrimaryImage(product: Pick<Product, "images">) {
  return [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];
}

export function matchesProductCategory(product: Product, category?: ProductCategoryFilter) {
  if (!category || category === "all") return true;
  if (category === "custom") return isProductCustomizable(product);
  return product.category === category;
}

export function buildProductSearchText(product: Product) {
  return [
    product.name,
    product.shortDescription,
    product.description,
    product.formattedPrice,
    productCategoryMeta[product.category].searchText,
    isProductCustomizable(product) ? "custom cá nhân hóa handmade" : "handmade",
    ...product.tags,
    ...product.tones,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("vi");
}

export function matchesProductSearch(product: Product, search?: string) {
  const term = search?.trim().toLocaleLowerCase("vi");
  if (!term) return true;
  return buildProductSearchText(product).includes(term);
}

export function matchesProductTone(product: Product, tone?: ProductTone | null) {
  if (!tone) return true;
  return product.tones.includes(tone);
}

export function sortProducts(products: Product[], sort: ProductSort = "newest") {
  if (sort === "price-asc") {
    return [...products].sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY));
  }

  if (sort === "price-desc") {
    return [...products].sort((a, b) => (b.price ?? Number.NEGATIVE_INFINITY) - (a.price ?? Number.NEGATIVE_INFINITY));
  }

  return [...products].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function paginateProducts(products: Product[], page?: number, pageSize?: number) {
  if (!page || !pageSize) return products;
  const start = (page - 1) * pageSize;
  return products.slice(start, start + pageSize);
}
