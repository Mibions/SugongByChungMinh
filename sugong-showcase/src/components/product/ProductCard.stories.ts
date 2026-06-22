import ProductCard from "./ProductCard.astro";
import type { Product } from "../../domain/product/product.types";

const image = {
  url: "/assets/products/bag-lavender-01.svg",
  alt: "Tui tote handmade hoa nhi tim tren nen sang",
  width: 1200,
  height: 900,
  sortOrder: 0,
};

const product: Product = {
  id: "bag-lavender",
  slug: "bag-lavender",
  name: "Tui tote hoa nhi tim",
  price: 390000,
  formattedPrice: "390.000d",
  category: "bag",
  shortDescription: "Tui tote handmade nhe nhang voi hoa tiet hoa tim.",
  coverImage: image,
  gallery: [image],
  images: [image],
  tones: ["lavender", "pink"],
  tags: ["bag", "lavender", "handmade"],
  isFeatured: true,
  status: "published",
  displayOrder: 1,
  customizable: true,
  featured: true,
  published: true,
};

const meta = {
  title: "Product/ProductCard",
  component: ProductCard,
  args: {
    product,
  },
};

export default meta;

export const Basic = {};
