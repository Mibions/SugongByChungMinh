import type { GetStaticPaths } from "astro";
import type { RelatedProductsResponse } from "../../../../data/api/generated/api-types";
import { createJsonResponse } from "../../../../lib/api-response";
import { getAllProducts, getRelatedProducts } from "../../../../lib/catalog";

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const products = await getAllProducts();

  return products.map((product) => ({
    params: { slug: product.slug },
  }));
};

export async function GET({ params }: { params: { slug: string } }) {
  const products = await getAllProducts();
  const item = products.find((product) => product.slug === params.slug);

  if (!item) {
    return createJsonResponse({ message: "Product not found", slug: params.slug }, { status: 404 });
  }

  const related = await getRelatedProducts(item.id, 3);
  const body: RelatedProductsResponse = {
    item,
    related,
    total: related.length,
  };

  return createJsonResponse(body);
}
