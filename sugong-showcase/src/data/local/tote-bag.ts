import type { ToteBag, ToteBagDetailItem, ToteBagTone } from "../../domain/tote-bag/tote-bag.types";
import { createSeedGallery, defaultProductStatus, pickCoverImage, type SeedImageSource } from "./seed-utils";

const toteBagBasePath = "/assets/products/tote-bags";

function createToteBagDetailItems(input: {
  tone: string;
  silhouette: string;
  customization: string;
  material: string;
}): ToteBagDetailItem[] {
  return [
    { label: "Tone màu", value: input.tone },
    { label: "Kiểu dáng", value: input.silhouette },
    { label: "Custom", value: input.customization },
    { label: "Chất liệu", value: input.material },
  ];
}

function createToteBag(input: {
  id: string;
  slug: string;
  name: string;
  tone: ToteBagTone;
  price: number;
  shortDescription: string;
  description: string;
  images: [SeedImageSource, ...SeedImageSource[]];
  details: {
    tone: string;
    silhouette: string;
    customization: string;
    material: string;
  };
  detailNote?: string;
  tags: string[];
  displayOrder: number;
  isFeatured?: boolean;
  tiktokUrl?: string;
}): ToteBag {
  const gallery = createSeedGallery(toteBagBasePath, input.images);

  return {
    id: input.id,
    slug: input.slug,
    name: input.name,
    tone: input.tone,
    price: input.price,
    shortDescription: input.shortDescription,
    description: input.description,
    coverImage: pickCoverImage(gallery),
    gallery,
    detailItems: createToteBagDetailItems(input.details),
    detailNote: input.detailNote,
    tags: input.tags,
    tiktokUrl: input.tiktokUrl,
    isFeatured: input.isFeatured ?? false,
    status: defaultProductStatus,
    displayOrder: input.displayOrder,
  };
}

export const toteBags: ToteBag[] = [
  createToteBag({
    id: "tote_bag_orange_blossom",
    slug: "tui-tote-2-mat-tone-cam-vang",
    name: "Túi tote 2 mặt tone cam vàng",
    tone: "orange",
    price: 68000,
    shortDescription: "Túi tote 2 mặt với họa tiết cam vàng tươi sáng, phù hợp sử dụng hằng ngày.",
    description: "Thiết kế 2 mặt tiện lợi với họa tiết trái cây màu cam vàng nổi bật, đi kèm charm chữ handmade dễ thương.",
    images: [
      {
        fileName: "orange-yellow.jpg",
        alt: "Túi tote 2 mặt tone cam vàng",
        width: 900,
        height: 1200,
      },
    ],
    details: {
      tone: "Cam vàng tươi sáng",
      silhouette: "Túi tote 2 mặt",
      customization: "Có thể thêm tag hoặc charm",
      material: "Vải in họa tiết handmade",
    },
    detailNote: "SUGONG sẽ xác nhận phối màu, thời gian hoàn thiện và chi tiết custom trước khi làm mẫu.",
    tags: ["tote", "handmade", "orange", "yellow", "custom"],
    isFeatured: true,
    displayOrder: 1,
  }),
  createToteBag({
    id: "tote_bag_pink_cherry",
    slug: "tui-tote-2-mat-tone-hong-cherry",
    name: "Túi tote 2 mặt tone hồng cherry",
    tone: "pink",
    price: 68000,
    shortDescription: "Túi tote 2 mặt với họa tiết cherry hồng ngọt ngào.",
    description: "Mẫu túi mang phong cách pastel nữ tính với họa tiết cherry nổi bật và charm chữ cá nhân hóa.",
    images: [
      {
        fileName: "pink-cherry.jpg",
        alt: "Túi tote 2 mặt tone hồng cherry",
        width: 900,
        height: 1200,
      },
    ],
    details: {
      tone: "Hồng cherry pastel",
      silhouette: "Túi tote 2 mặt",
      customization: "Có thể thêm tên hoặc tag",
      material: "Vải in họa tiết ngọt ngào",
    },
    detailNote: "SUGONG có thể điều chỉnh một vài chi tiết nhỏ để hợp tone quà tặng hoặc concept cá nhân.",
    tags: ["tote", "handmade", "pink", "cherry", "custom"],
    isFeatured: true,
    displayOrder: 2,
  }),
  createToteBag({
    id: "tote_bag_lavender_confetti",
    slug: "tui-tote-2-mat-tone-lavender",
    name: "Túi tote 2 mặt tone lavender",
    tone: "purple",
    price: 68000,
    shortDescription: "Túi tote 2 mặt với họa tiết pastel lavender nhiều màu.",
    description: "Tông tím lavender dịu nhẹ kết hợp hoa tiết hoa nhỏ nhiều màu, phù hợp phong cách nữ tính.",
    images: [
      {
        fileName: "lavender.jpg",
        alt: "Túi tote 2 mặt tone lavender",
        width: 900,
        height: 1200,
      },
    ],
    details: {
      tone: "Lavender nhiều sắc pastel",
      silhouette: "Túi tote 2 mặt",
      customization: "Có thể thêm tag hoặc phối charm",
      material: "Vải in hoa nhỏ mềm nhẹ",
    },
    detailNote: "Mỗi mẫu có thể thay đổi nhẹ phần phụ kiện đi kèm để hợp với màu chủ đạo bạn chọn.",
    tags: ["tote", "handmade", "lavender", "pastel", "custom"],
    isFeatured: true,
    displayOrder: 3,
  }),
  createToteBag({
    id: "tote_bag_mint_garden",
    slug: "tui-tote-2-mat-tone-xanh-mint",
    name: "Túi tote 2 mặt tone xanh mint",
    tone: "green",
    price: 68000,
    shortDescription: "Túi tote 2 mặt với họa tiết lá xanh mint dịu mắt.",
    description: "Thiết kế mang cảm hứng thiên nhiên với tông xanh mint nhẹ nhàng và họa tiết lá nhỏ.",
    images: [
      {
        fileName: "mint-garden.jpg",
        alt: "Túi tote 2 mặt tone xanh mint",
        width: 900,
        height: 1200,
      },
    ],
    details: {
      tone: "Xanh mint dịu mát",
      silhouette: "Túi tote 2 mặt",
      customization: "Có thể thêm tag hoặc tên",
      material: "Vải in họa tiết lá nhỏ",
    },
    detailNote: "SUGONG sẽ tư vấn phối phụ kiện và màu in phù hợp nếu bạn muốn làm theo set hoặc concept riêng.",
    tags: ["tote", "handmade", "mint", "green", "custom"],
    isFeatured: true,
    displayOrder: 4,
  }),
  createToteBag({
    id: "tote_bag_blue_ribbon",
    slug: "tui-tote-2-mat-tone-xanh-duong",
    name: "Túi tote 2 mặt tone xanh dương",
    tone: "blue",
    price: 68000,
    shortDescription: "Túi tote 2 mặt với họa tiết xanh dương trẻ trung.",
    description: "Mẫu túi mang tông xanh dương pastel cùng charm chữ handmade cá nhân hóa.",
    images: [
      {
        fileName: "blue-ribbon.jpg",
        alt: "Túi tote 2 mặt tone xanh dương",
        width: 900,
        height: 1200,
      },
    ],
    details: {
      tone: "Xanh dương pastel",
      silhouette: "Túi tote 2 mặt",
      customization: "Có thể thêm tag hoặc tên",
      material: "Vải in phối charm handmade",
    },
    detailNote: "Tông xanh có thể được cân lại đậm hoặc nhạt hơn đôi chút tùy concept bạn muốn mang theo.",
    tags: ["tote", "handmade", "blue", "pastel", "custom"],
    isFeatured: true,
    displayOrder: 5,
  }),
  createToteBag({
    id: "tote_bag_blue_floral",
    slug: "tui-tote-2-mat-hoa-xanh-pastel",
    name: "Túi tote 2 mặt hoa xanh pastel",
    tone: "blue",
    price: 68000,
    shortDescription: "Túi tote 2 mặt họa tiết hoa xanh pastel nhẹ nhàng.",
    description: "Mẫu túi nổi bật với họa tiết hoa nhỏ xanh pastel, phù hợp phong cách dịu dàng và tối giản.",
    images: [
      {
        fileName: "blue-floral.jpg",
        alt: "Túi tote 2 mặt hoa xanh pastel",
        width: 900,
        height: 1200,
      },
    ],
    details: {
      tone: "Hoa xanh pastel nhẹ",
      silhouette: "Túi tote 2 mặt",
      customization: "Có thể phối thêm tag",
      material: "Vải in floral mềm nhẹ",
    },
    detailNote: "Mẫu hợp concept dịu dàng và tối giản, SUGONG vẫn có thể chỉnh nhẹ phần phụ kiện nếu bạn cần.",
    tags: ["tote", "handmade", "floral", "blue", "pastel"],
    isFeatured: true,
    displayOrder: 6,
  }),
  createToteBag({
    id: "tote_bag_canvas_navy",
    slug: "tui-tote-canvas-phoi-xanh-den",
    name: "Túi tote canvas phối xanh đen",
    tone: "neutral",
    price: 68000,
    shortDescription: "Túi tote canvas phối màu xanh đen tối giản.",
    description: "Thiết kế canvas basic với phần quai và dây phối xanh đen, có thể thêu tên theo yêu cầu.",
    images: [
      {
        fileName: "canvas-navy.jpg",
        alt: "Túi tote canvas phối xanh đen",
        width: 900,
        height: 1200,
      },
    ],
    details: {
      tone: "Canvas phối xanh đen",
      silhouette: "Túi tote canvas basic",
      customization: "Có thể thêu tên theo yêu cầu",
      material: "Canvas phối màu tối giản",
    },
    detailNote: "Với mẫu canvas, SUGONG sẽ xác nhận bố cục thêu và màu chỉ trước khi hoàn thiện để giữ tổng thể gọn đẹp.",
    tags: ["tote", "canvas", "minimal", "embroidered", "custom"],
    isFeatured: true,
    displayOrder: 7,
  }),
];
