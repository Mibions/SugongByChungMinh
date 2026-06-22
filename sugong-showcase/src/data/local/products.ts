import { formatProductPrice } from "../../domain/product/product.helpers";
import { productSchema } from "../../domain/product/product.schema";
import type { Product, ProductCategory } from "../../domain/product/product.types";
import type { ProductTone } from "../../domain/product/product-taxonomy";
import { createProductGallery, defaultProductStatus, pickCoverImage, type SeedImageSource } from "./seed-utils";

const productBasePath = "/assets/products";

function createProduct(input: {
  id: string;
  slug: string;
  name: string;
  price: number | null;
  category: ProductCategory;
  shortDescription: string;
  description: string;
  images: [SeedImageSource, ...SeedImageSource[]];
  tones: ProductTone[];
  tags: string[];
  customizable: boolean;
  isFeatured?: boolean;
  displayOrder: number;
}) {
  const gallery = createProductGallery(productBasePath, input.images);

  return productSchema.parse({
    id: input.id,
    slug: input.slug,
    name: input.name,
    price: input.price,
    formattedPrice: formatProductPrice(input.price),
    category: input.category,
    shortDescription: input.shortDescription,
    description: input.description,
    coverImage: pickCoverImage(gallery),
    gallery,
    images: gallery,
    tones: input.tones,
    tags: input.tags,
    isFeatured: input.isFeatured ?? false,
    status: defaultProductStatus,
    displayOrder: input.displayOrder,
    customizable: input.customizable,
    featured: input.isFeatured ?? false,
    published: true,
  });
}

export const localProducts: Product[] = [
  createProduct({
    id: "bag-lavender",
    slug: "bag-lavender",
    name: "Túi tote hoa nhí tím",
    price: 390000,
    category: "bag",
    shortDescription: "Túi tote handmade nhẹ nhàng với họa tiết hoa tím.",
    description: "Một mẫu túi tote handmade dịu nhẹ, phù hợp để dùng hằng ngày hoặc làm quà tặng.",
    images: [
      {
        fileName: "bag-lavender-01.svg",
        alt: "Túi tote handmade hoa nhí tím trên nền sáng",
        width: 1200,
        height: 900,
      },
      {
        fileName: "bag-lavender-poster.svg",
        alt: "Túi tote hoa nhí tím dạng poster dọc",
        width: 900,
        height: 1600,
      },
      {
        fileName: "/assets/brand/footer-bag.png",
        alt: "Túi lavender handmade trên nền hoa tím",
        width: 2048,
        height: 640,
      },
    ],
    tones: ["lavender", "pink", "cream"],
    tags: ["bag", "tote", "lavender", "handmade", "custom"],
    customizable: true,
    isFeatured: true,
    displayOrder: 1,
  }),
  createProduct({
    id: "scrunchie-pastel",
    slug: "scrunchie-pastel",
    name: "Scrunchie lụa pastel",
    price: 89000,
    category: "scrunchie",
    shortDescription: "Bộ scrunchie pastel mềm mại, nữ tính.",
    description: "Scrunchie nhẹ, mềm và dễ phối với những set đồ hằng ngày.",
    images: [
      {
        fileName: "scrunchie-pastel.svg",
        alt: "Scrunchie lụa pastel được xếp trên nền vải sáng",
        width: 1200,
        height: 900,
      },
    ],
    tones: ["pink", "cream", "lilac"],
    tags: ["scrunchie", "pastel", "lụa", "phụ kiện tóc"],
    customizable: false,
    isFeatured: true,
    displayOrder: 2,
  }),
  createProduct({
    id: "giftbox-bear",
    slug: "giftbox-bear",
    name: "Hộp quà gấu bông hoa nhí",
    price: 520000,
    category: "gift",
    shortDescription: "Hộp quà handmade với gấu bông và phụ kiện phối màu.",
    description: "Hộp quà được phối theo tông màu nhẹ, phù hợp cho sinh nhật và dịp đặc biệt.",
    images: [
      {
        fileName: "giftbox-bear.svg",
        alt: "Hộp quà handmade gấu bông phối hoa nhí",
        width: 1200,
        height: 900,
      },
    ],
    tones: ["pink", "cream"],
    tags: ["gift", "giftbox", "gấu bông", "hoa nhí", "custom"],
    customizable: true,
    isFeatured: true,
    displayOrder: 3,
  }),
  createProduct({
    id: "graduation-gift",
    slug: "graduation-gift",
    name: "Set tốt nghiệp handmade",
    price: 490000,
    category: "gift",
    shortDescription: "Set quà tốt nghiệp thiết kế riêng theo yêu cầu.",
    description: "Set quà tốt nghiệp được phối theo màu sắc và lời nhắn riêng cho người nhận.",
    images: [
      {
        fileName: "graduation-gift.svg",
        alt: "Set quà tốt nghiệp handmade với phụ kiện phối màu pastel",
        width: 1200,
        height: 900,
      },
    ],
    tones: ["cream", "lavender"],
    tags: ["gift", "graduation", "set quà", "pastel", "custom"],
    customizable: true,
    displayOrder: 4,
  }),
  createProduct({
    id: "custom-pouch",
    slug: "custom-pouch",
    name: "Túi thêu tên custom",
    price: 290000,
    category: "custom",
    shortDescription: "Túi nhỏ thêu tên, chọn màu chỉ và họa tiết.",
    description: "Túi nhỏ có thể cá nhân hóa bằng tên, màu chỉ và họa tiết nhẹ nhàng.",
    images: [
      {
        fileName: "custom-pouch.svg",
        alt: "Túi nhỏ handmade thêu tên custom",
        width: 1200,
        height: 900,
      },
    ],
    tones: ["lilac", "pink"],
    tags: ["custom", "pouch", "thêu tên", "cá nhân hóa"],
    customizable: true,
    displayOrder: 5,
  }),
  createProduct({
    id: "custom-keychain",
    slug: "custom-keychain",
    name: "Móc khóa custom tên",
    price: null,
    category: "custom",
    shortDescription: "Móc khóa thêu tên và biểu tượng theo yêu cầu.",
    description: "Móc khóa nhỏ gọn có thể thêu tên, ký tự hoặc biểu tượng riêng.",
    images: [
      {
        fileName: "custom-keychain.svg",
        alt: "Móc khóa handmade custom tên tông pastel",
        width: 1200,
        height: 900,
      },
    ],
    tones: ["lilac", "cream"],
    tags: ["custom", "keychain", "móc khóa", "thêu tên"],
    customizable: true,
    displayOrder: 6,
  }),
];
