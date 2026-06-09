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
    "7591363539076533522",
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
