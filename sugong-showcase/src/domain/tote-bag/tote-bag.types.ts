export type ToteBagTone = "orange" | "pink" | "purple" | "green" | "blue" | "neutral";

export type ToteBagImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
  publicId?: string;
};

export type ToteBagDetailItem = {
  label: string;
  value: string;
};

export type ToteBag = {
  id: string;
  slug: string;
  name: string;
  tone: ToteBagTone;
  price: number;
  shortDescription: string;
  description: string;
  coverImage: ToteBagImage;
  gallery: ToteBagImage[];
  detailItems: ToteBagDetailItem[];
  detailNote?: string;
  tags: string[];
  tiktokUrl?: string;
  isFeatured: boolean;
  status: "draft" | "published" | "hidden";
  displayOrder: number;
};
