import type { GraduationHat, GraduationHatTone } from "../../domain/graduation-hat/graduation-hat.types";
import { createSeedGallery, defaultProductStatus, pickCoverImage, type SeedImageSource } from "./seed-utils";

const graduationHatBasePath = "/assets/products/graduation-hats";

function createGraduationHat(input: {
  id: string;
  slug: string;
  name: string;
  tone: GraduationHatTone;
  shortDescription: string;
  description?: string;
  images: [SeedImageSource, ...SeedImageSource[]];
  tags: string[];
  displayOrder: number;
  isFeatured?: boolean;
  tiktokUrl?: string;
}): GraduationHat {
  const gallery = createSeedGallery(graduationHatBasePath, input.images);

  return {
    id: input.id,
    slug: input.slug,
    name: input.name,
    tone: input.tone,
    shortDescription: input.shortDescription,
    description: input.description,
    coverImage: pickCoverImage(gallery),
    gallery,
    tags: input.tags,
    tiktokUrl: input.tiktokUrl,
    isFeatured: input.isFeatured ?? false,
    status: defaultProductStatus,
    displayOrder: input.displayOrder,
  };
}

export const graduationHats: GraduationHat[] = [
  createGraduationHat({
    id: "grad_hat_blue_butterfly",
    slug: "non-tot-nghiep-tone-xanh-buom",
    name: "Nón tốt nghiệp tone xanh bướm",
    tone: "blue",
    shortDescription: "Mẫu nón tốt nghiệp tone xanh pastel phối hoa và bướm ánh kim.",
    description: "Thiết kế nổi bật với cụm hoa xanh pastel, phụ kiện bướm, ngọc trai và dây tua rua nhẹ nhàng.",
    images: [
      {
        fileName: "blue-butterfly.jpg",
        alt: "Nón tốt nghiệp tone xanh pastel phối bướm",
        width: 900,
        height: 1200,
      },
    ],
    tags: ["graduation", "blue", "butterfly", "floral", "pastel"],
    isFeatured: true,
    displayOrder: 1,
  }),
  createGraduationHat({
    id: "grad_hat_pastel_mix",
    slug: "non-tot-nghiep-tone-pastel-phoi-mau",
    name: "Nón tốt nghiệp tone pastel phối màu",
    tone: "mixed",
    shortDescription: "Mẫu nón phối lavender, kem và hồng nhạt cho concept kỷ yếu dịu dàng.",
    description: "Phù hợp với bạn thích bảng màu nhẹ, nhiều lớp hoa nhỏ và chi tiết ngọc trai mềm mại.",
    images: [
      {
        fileName: "pastel-mix.jpg",
        alt: "Nón tốt nghiệp tone pastel phối màu",
        width: 900,
        height: 1200,
      },
    ],
    tags: ["graduation", "pastel", "mixed", "floral"],
    isFeatured: true,
    displayOrder: 2,
  }),
  createGraduationHat({
    id: "grad_hat_pink_blue",
    slug: "non-tot-nghiep-tone-hong-xanh",
    name: "Nón tốt nghiệp tone hồng xanh",
    tone: "pink",
    shortDescription: "Mẫu nón nổi bật với hoa hồng nhạt, xanh baby và điểm nhấn ánh bạc.",
    description: "Gợi cảm giác tươi sáng nhưng vẫn nữ tính, hợp set ảnh tốt nghiệp ngoài trời hoặc studio pastel.",
    images: [
      {
        fileName: "pink-blue.jpg",
        alt: "Nón tốt nghiệp tone hồng xanh",
        width: 900,
        height: 1200,
      },
    ],
    tags: ["graduation", "pink", "blue", "pastel"],
    displayOrder: 3,
  }),
  createGraduationHat({
    id: "grad_hat_white_blue",
    slug: "non-tot-nghiep-tone-trang-xanh",
    name: "Nón tốt nghiệp tone trắng xanh",
    tone: "white",
    shortDescription: "Mẫu nón tone trắng xanh sạch, sáng và dễ phối với nhiều màu áo.",
    description: "Tập trung vào nền trắng kem, hoa xanh nhẹ, chi tiết ngọc và dây ruy băng thanh thoát.",
    images: [
      {
        fileName: "white-blue.jpg",
        alt: "Nón tốt nghiệp tone trắng xanh",
        width: 900,
        height: 1200,
      },
    ],
    tags: ["graduation", "white", "blue", "clean"],
    displayOrder: 4,
  }),
];
