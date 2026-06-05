import ProductCard from "./ProductCard.astro";
import type { Product } from "../../domain/product/product.types";

const product: Product = {
  id: "bag-lavender",
  slug: "bag-lavender",
  name: "Túi tote hoa nhí tím",
  price: 390000,
  formattedPrice: "390.000đ",
  category: "bag",
  shortDescription: "Túi tote handmade nhẹ nhàng với họa tiết hoa tím.",
  images: [
    {
      url: "/assets/products/bag-lavender-01.svg",
      alt: "Túi tote handmade hoa nhí tím trên nền sáng",
      width: 1200,
      height: 900,
      sortOrder: 0,
    },
  ],
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
