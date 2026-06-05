export type SeoInput = {
  title?: string;
  description?: string;
};

const siteName = "SUGONG";
const defaultDescription =
  "Quà handmade thiết kế riêng, nhẹ nhàng và nhiều ý nghĩa từ SUGONG.";

export function createSeo(input: SeoInput = {}) {
  return {
    title: input.title ? `${input.title} | ${siteName}` : siteName,
    description: input.description ?? defaultDescription,
  };
}
