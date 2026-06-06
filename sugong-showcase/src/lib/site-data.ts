export const brand = {
  name: "SUGONG",
  tagline: "Quà handmade theo cách riêng của bạn",
  description: "Thiết kế riêng, ý nghĩa riêng. Mỗi món quà là một câu chuyện.",
  about:
    "SUGONG bắt đầu từ tình yêu với những món quà nhỏ nhưng mang nhiều ý nghĩa.",
  channels: {
    tiktok: "@sugongbychungminh23",
    instagram: "@sugongbychungminh",
    zalo: "https://zalo.me/",
  },
  tiktokProfileUrl: "https://www.tiktok.com/@sugongbychungminh23",
  heroTikTokVideoIds: [
    "7591363539076533522",
    "7616203887690648850",
    "7566495772435565832",
  ],
};

export const navigationItems = [
  { href: "/products", label: "Sản phẩm" },
  { href: "/products?category=custom", label: "Custom" },
  { href: "/#featured-products", label: "TikTok" },
  { href: "/#why-sugong", label: "Về SUGONG" },
];

export const categories = [
  {
    name: "Túi handmade",
    href: "/products?category=bag",
    image: "/assets/brand/footer-bag.png",
    alt: "Túi handmade hoa nhí tông tím pastel",
  },
  {
    name: "Scrunchie",
    href: "/products?category=scrunchie",
    image: "/assets/categories/scrunchie.svg",
    alt: "Scrunchie pastel mềm mại",
  },
  {
    name: "Quà tặng",
    href: "/products?category=gift",
    image: "/assets/categories/giftbox.svg",
    alt: "Hộp quà handmade phối màu nhẹ",
  },
  {
    name: "Custom",
    href: "/products?category=custom",
    image: "/assets/products/custom-pouch.svg",
    alt: "Phụ kiện custom thêu tên",
  },
];
