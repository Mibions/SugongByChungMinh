export type GraduationHatTone = "blue" | "pink" | "white" | "purple" | "mixed" | "other";

export type ProductImage = {
  url: string;
  alt: string;
};

export type GraduationHat = {
  id: string;
  slug: string;
  name: string;
  category: "graduation-hats";
  tone: GraduationHatTone;
  shortDescription: string;
  description?: string;
  coverImage: ProductImage;
  gallery: ProductImage[];
  tags: string[];
  tiktokUrl?: string;
  isFeatured: boolean;
  status: "draft" | "published" | "hidden";
  displayOrder: number;
};

export type GraduationHatToneFilter = GraduationHatTone | "all";

export const graduationHatTones: { value: GraduationHatToneFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "blue", label: "Tone xanh" },
  { value: "pink", label: "Tone hồng" },
  { value: "white", label: "Tone trắng" },
  { value: "purple", label: "Tone tím" },
  { value: "mixed", label: "Tone phối màu" },
  { value: "other", label: "Khác" },
];
