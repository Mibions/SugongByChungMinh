import { withBase } from "./url";

const cloudinaryCloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
const cloudinaryAssetFolder = import.meta.env.PUBLIC_CLOUDINARY_ASSET_FOLDER ?? "sugong-showcase";
const rasterExtensions = new Set(["avif", "gif", "jpg", "jpeg", "png", "webp"]);

export type CloudinaryImageInput = {
  url: string;
  width: number;
  height: number;
  publicId?: string;
};

export type CloudinaryImageVariant =
  | "hat-card"
  | "hat-detail"
  | "hat-thumb"
  | "product-card"
  | "product-gallery-main"
  | "product-gallery-thumb"
  | "category-card";

type VariantConfig = {
  widths: number[];
  sizes: string;
  transforms: string;
};

type CloudinaryImageProps = {
  src: string;
  srcset?: string;
  sizes?: string;
  width: number;
  height: number;
};

const variantConfigs: Record<CloudinaryImageVariant, VariantConfig> = {
  "hat-card": {
    widths: [320, 480, 640, 768],
    sizes: "(min-width: 1280px) 21vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw",
    transforms: "f_auto,q_auto:eco,c_fill,g_auto,ar_4:5",
  },
  "hat-detail": {
    widths: [640, 900, 1200, 1600],
    sizes: "(min-width: 1024px) min(52vw, 860px), 100vw",
    transforms: "f_auto,q_auto,c_limit",
  },
  "hat-thumb": {
    widths: [160, 240, 320],
    sizes: "96px",
    transforms: "f_auto,q_auto:eco,c_fill,g_auto,w_160,h_160",
  },
  "product-card": {
    widths: [320, 480, 640, 800],
    sizes: "(min-width: 1280px) 24vw, (min-width: 768px) 33vw, 50vw",
    transforms: "f_auto,q_auto:eco,c_fill,g_auto,ar_4:3",
  },
  "product-gallery-main": {
    widths: [640, 900, 1200, 1600],
    sizes: "(min-width: 1024px) min(58vw, 920px), 100vw",
    transforms: "f_auto,q_auto,c_limit",
  },
  "product-gallery-thumb": {
    widths: [160, 240, 320],
    sizes: "80px",
    transforms: "f_auto,q_auto:eco,c_fill,g_auto,w_160,h_160",
  },
  "category-card": {
    widths: [360, 540, 720, 960],
    sizes: "(min-width: 768px) 25vw, 50vw",
    transforms: "f_auto,q_auto:eco,c_fill,g_auto",
  },
};

function getExtension(url: string) {
  return url.split(".").pop()?.toLowerCase() ?? "";
}

function getDerivedPublicId(url: string) {
  if (!url.startsWith("/assets/")) return null;
  return `${cloudinaryAssetFolder}${url.replace(/\.[^/.]+$/, "")}`;
}

function buildCloudinaryUrl(publicId: string, transforms: string) {
  return `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/${transforms}/${publicId}`;
}

export function getCloudinaryImageProps(
  asset: CloudinaryImageInput,
  variant: CloudinaryImageVariant,
): CloudinaryImageProps {
  const fallback: CloudinaryImageProps = {
    src: withBase(asset.url),
    width: asset.width,
    height: asset.height,
  };

  const extension = getExtension(asset.url);
  const publicId = asset.publicId ?? getDerivedPublicId(asset.url);

  if (!cloudinaryCloudName || !publicId || !rasterExtensions.has(extension)) {
    return fallback;
  }

  const config = variantConfigs[variant];
  const srcset = config.widths
    .map((width) => `${buildCloudinaryUrl(publicId, `${config.transforms},w_${width}`)} ${width}w`)
    .join(", ");
  const largestWidth = config.widths[config.widths.length - 1];

  return {
    ...fallback,
    src: buildCloudinaryUrl(publicId, `${config.transforms},w_${largestWidth}`),
    srcset,
    sizes: config.sizes,
  };
}
