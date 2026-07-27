import { productCategoryMeta } from "../domain/product/product-taxonomy";

export const brand = {
  name: "SUGONG",
  tagline: "Quà handmade theo cách riêng của bạn",
  description: "Thiết kế riêng, ý nghĩa riêng. Mỗi món quà là một câu chuyện.",
  about:
    "SUGONG bắt đầu từ tình yêu với những món quà nhỏ nhưng mang nhiều ý nghĩa.",
  channels: {
    tiktok: "@sugongbychungminh23",
    instagram: "@sugongbychungminh",
    threads: "https://www.threads.net/@sugongbychungminh",
    zalo: "https://zalo.me/",
  },
  tiktokProfileUrl: "https://www.tiktok.com/@sugongbychungminh23",
  instagramProfileUrl: "https://www.instagram.com/sugongbychungminh",
  heroTikTokVideoIds: [
    "7502684361934818567",
    "7616203887690648850",
    "7566495772435565832",
  ],
};

export const navigationItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/products", label: "Sản phẩm" },
  { href: "/about#tiktok", label: "TikTok" },
  { href: "/about", label: "Về SUGONG" },
  { href: "/about#social", label: "Liên hệ" },
];

export const socialLinks = [
  {
    name: "Zalo",
    description: "Nhắn SUGONG để hỏi mẫu, giá và thời gian hoàn thiện.",
    cta: "Nhắn Zalo",
    href: brand.channels.zalo,
    primary: true,
  },
  {
    name: "TikTok",
    description: "Xem video ngắn về sản phẩm, góc làm và cách SUGONG phối quà.",
    cta: "Xem TikTok",
    href: brand.tiktokProfileUrl,
    primary: false,
  },
  {
    name: "Threads",
    description: "Theo dõi những cập nhật nhẹ nhàng, mẫu mới và ghi chú từ shop.",
    cta: "Xem Threads",
    href: brand.channels.threads,
    primary: false,
  },
  {
    name: "Instagram",
    description: "Lưu lại ảnh sản phẩm, màu pastel và các góc quà xinh.",
    cta: "Xem Instagram",
    href: brand.instagramProfileUrl,
    primary: false,
  },
];

export const categories = [
  {
    icon: "bag",
    name: productCategoryMeta.bag.label,
    href: "/products?category=bag",
    image: "/assets/brand/footer-bag.webp",
    objectPosition: "18% center",
    alt: "Túi handmade hoa nhí tông tím pastel",
  },
  {
    icon: "sparkles",
    name: productCategoryMeta.scrunchie.label,
    href: "/products?category=scrunchie",
    image: "/assets/categories/scrunchie.svg",
    objectPosition: "center",
    alt: "Scrunchie pastel mềm mại",
  },
  {
    icon: "gift",
    name: productCategoryMeta.gift.label,
    href: "/products?category=gift",
    image: "/assets/categories/giftbox.svg",
    objectPosition: "center",
    alt: "Hộp quà handmade phối màu nhẹ",
  },
  {
    icon: "custom",
    name: productCategoryMeta.custom.tabLabel,
    href: "/products?category=custom",
    image: "/assets/products/custom-pouch.svg",
    objectPosition: "center",
    alt: "Phụ kiện custom thêu tên",
  },
] as const;

export const trustItems = [
  {
    icon: "handmade",
    title: "Handmade tỉ mỉ",
    description: "Từng chi tiết được làm chậm rãi để món quà có cảm giác riêng.",
  },
  {
    icon: "custom",
    title: "Custom theo yêu cầu",
    description: "Có thể đổi màu, thêu tên hoặc phối chi tiết nhỏ theo câu chuyện của bạn.",
  },
  {
    icon: "message",
    title: "Tư vấn trước khi làm",
    description: "SUGONG xác nhận mẫu, thời gian và chi phí trước khi thực hiện.",
  },
  {
    icon: "gift",
    title: "Phù hợp làm quà",
    description: "Nhẹ nhàng, nữ tính và đủ cá nhân để gửi tặng người thương.",
  },
] as const;

export const testimonials = [
  { id: "packaging", quote: "Túi xinh, đóng gói kỹ và màu rất dịu." },
  { id: "graduation", quote: "Set quà tốt nghiệp nhìn nhỏ xinh mà rất chỉn chu." },
  { id: "consulting", quote: "Shop tư vấn dễ thương, gửi mẫu trước khi làm." },
] as const;

export const tiktokHighlights = [
  {
    id: "handmade-bag",
    title: "Túi handmade",
    caption: "Góc túi lavender nhẹ nhàng, hợp đi học, đi chơi và làm quà.",
    image: "/assets/products/bag-lavender-poster.svg",
    href: "/products?category=bag",
  },
  {
    id: "gift-set",
    title: "Set quà tặng",
    caption: "Những set quà nhỏ xinh, phối màu dịu và đóng gói chỉn chu.",
    image: "/assets/products/giftbox-bear.svg",
    href: "/products?category=gift",
  },
  {
    id: "accessories",
    title: "Phụ kiện nhỏ",
    caption: "Móc khóa, túi thêu tên và những chi tiết có thể trao đổi thêm.",
    image: "/assets/products/custom-keychain.svg",
    href: brand.tiktokProfileUrl,
  },
] as const;
