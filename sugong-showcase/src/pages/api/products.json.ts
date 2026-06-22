import type { ProductListResponse } from "../../data/api/generated/api-types";
import { createJsonResponse } from "../../lib/api-response";
import { getAllProducts } from "../../lib/catalog";

export const prerender = true;

export async function GET() {
  const items = await getAllProducts();
  const body: ProductListResponse = {
    items,
    total: items.length,
  };

  return createJsonResponse(body);
}
