import type { GraduationHatListResponse } from "../../data/api/generated/api-types";
import { createJsonResponse } from "../../lib/api-response";
import { getGraduationHats } from "../../lib/catalog";

export const prerender = true;

export async function GET() {
  const items = await getGraduationHats();
  const body: GraduationHatListResponse = {
    items,
    total: items.length,
  };

  return createJsonResponse(body);
}
