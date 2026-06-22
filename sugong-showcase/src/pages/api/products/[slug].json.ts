import type { GetStaticPaths } from "astro";
import type { ProductDetailResponse } from "../../../data/api/generated/api-types";
import { createJsonResponse } from "../../../lib/api-response";
import { getAllProducts, getProductBySlug } from "../../../lib/catalog";

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const products = await getAllProducts();

  return products.map((product) => ({
    params: { slug: product.slug },
  }));
};

export async function GET({ params }: { params: { slug: string } }) {
  const item = await getProductBySlug(params.slug);

  if (!item) {
    return createJsonResponse({ message: "Product not found", slug: params.slug }, { status: 404 });
  }

  const body: ProductDetailResponse = { item };
  return createJsonResponse(body);
}
