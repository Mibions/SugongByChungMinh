import type { GetStaticPaths } from "astro";
import type { GraduationHatDetailResponse } from "../../../data/api/generated/api-types";
import { createJsonResponse } from "../../../lib/api-response";
import { getGraduationHatBySlug, getGraduationHats } from "../../../lib/catalog";

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const hats = await getGraduationHats();

  return hats.map((hat) => ({
    params: { slug: hat.slug },
  }));
};

export async function GET({ params }: { params: { slug: string } }) {
  const item = await getGraduationHatBySlug(params.slug);

  if (!item) {
    return createJsonResponse({ message: "Graduation hat not found", slug: params.slug }, { status: 404 });
  }

  const body: GraduationHatDetailResponse = { item };
  return createJsonResponse(body);
}
