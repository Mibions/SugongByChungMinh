import type { ProductCategory } from "./product.types";

export const productToneValues = ["orange", "pink", "cream", "lavender", "blue", "green", "lilac", "neutral"] as const;
export type ProductTone = (typeof productToneValues)[number];

export type ProductCategoryMeta = {
  value: ProductCategory;
  label: string;
  tabLabel: string;
  searchText: string;
};

export type ProductToneMeta = {
  value: ProductTone;
  label: string;
  className: string;
};

export const productCategoryMeta: Record<ProductCategory, ProductCategoryMeta> = {
  bag: {
    value: "bag",
    label: "Túi handmade",
    tabLabel: "Túi handmade",
    searchText: "túi handmade bag tote",
  },
  scrunchie: {
    value: "scrunchie",
    label: "Scrunchie",
    tabLabel: "Scrunchie",
    searchText: "scrunchie phụ kiện tóc",
  },
  gift: {
    value: "gift",
    label: "Quà tặng",
    tabLabel: "Quà tặng",
    searchText: "quà tặng gift hộp quà",
  },
  custom: {
    value: "custom",
    label: "Có thể custom",
    tabLabel: "Custom",
    searchText: "custom cá nhân hóa thêu tên",
  },
  graduation: {
    value: "graduation",
    label: "Tốt nghiệp",
    tabLabel: "Tốt nghiệp",
    searchText: "tốt nghiệp graduation quà tặng",
  },
};

export const productListingTabs = [
  productCategoryMeta.bag,
  productCategoryMeta.scrunchie,
  productCategoryMeta.gift,
  productCategoryMeta.custom,
] as const;

export const productToneFilters: ProductToneMeta[] = [
  { label: "Cam", value: "orange", className: "bg-[#d89a59]" },
  { label: "Hồng nhạt", value: "pink", className: "bg-accent-pink" },
  { label: "Kem", value: "cream", className: "bg-accent-cream" },
  { label: "Lavender", value: "lavender", className: "bg-primary" },
  { label: "Xanh dương", value: "blue", className: "bg-[#8ea8d8]" },
  { label: "Xanh lá", value: "green", className: "bg-[#8fb48a]" },
  { label: "Lilac", value: "lilac", className: "bg-primary-soft" },
  { label: "Trung tính", value: "neutral", className: "bg-[#d9d2cb]" },
];
