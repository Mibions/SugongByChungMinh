import type { GetStaticPaths } from "astro";
import type { ProductsByCategoryResponse } from "../../../../data/api/generated/api-types";
import { productCategories } from "../../../../domain/product/product.types";
import { createJsonResponse } from "../../../../lib/api-response";
import { getProductsByCategory } from "../../../../lib/catalog";

export const prerender = true;

export const getStaticPaths: GetStaticPaths = () =>
  productCategories.map((category) => ({
    params: { category },
  }));

export async function GET({ params }: { params: { category: (typeof productCategories)[number] } }) {
  const category = params.category;
  const items = await getProductsByCategory(category);
  const body: ProductsByCategoryResponse = {
    category,
    items,
    total: items.length,
  };

  return createJsonResponse(body);
}
