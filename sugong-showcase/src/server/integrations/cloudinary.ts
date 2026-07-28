import { v2 as cloudinary } from "cloudinary";

function configureCloudinary() {
  const cloudName = process.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are not configured");
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return { cloudName, apiKey, apiSecret };
}

const productSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function getProductImageName(productSlug: string, ordinal: number) {
  const slug = productSlug.trim();
  if (!productSlugPattern.test(slug) || slug.length > 160) {
    throw new Error("Slug sản phẩm không hợp lệ.");
  }
  if (!Number.isSafeInteger(ordinal) || ordinal < 0 || ordinal > 99) {
    throw new Error("Thứ tự ảnh không hợp lệ.");
  }
  return ordinal === 0 ? slug : `${slug}_${ordinal}`;
}

export function createSignedUpload(productSlug: string, ordinal: number) {
  const { cloudName, apiKey, apiSecret } = configureCloudinary();
  const timestamp = Math.floor(Date.now() / 1000);
  const rootFolder = process.env.PUBLIC_CLOUDINARY_ASSET_FOLDER ?? "sugong-showcase";
  const publicId = getProductImageName(productSlug, ordinal);
  const folder = `${rootFolder}/products/${productSlug}`;
  const uploadParams = {
    timestamp,
    folder,
    public_id: publicId,
    overwrite: false,
    unique_filename: false,
    use_filename: false,
  };
  const signature = cloudinary.utils.api_sign_request(uploadParams, apiSecret);
  return { cloudName, apiKey, signature, publicId, ...uploadParams };
}

export async function uploadRemoteImage(url: string, importJobId: string, slug: string) {
  configureCloudinary();
  const rootFolder = process.env.PUBLIC_CLOUDINARY_ASSET_FOLDER ?? "sugong-showcase";
  const result = await cloudinary.uploader.upload(url, {
    folder: `${rootFolder}/imports/${importJobId}/${slug}`,
    resource_type: "image",
    overwrite: false,
    unique_filename: true,
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    format: result.format,
    width: result.width,
    height: result.height,
  };
}

export async function deleteCloudinaryAssets(publicIds: string[]) {
  if (publicIds.length === 0) return [];
  configureCloudinary();
  const uniquePublicIds = [...new Set(publicIds)];
  const results = await Promise.allSettled(
    uniquePublicIds.map((publicId) => cloudinary.uploader.destroy(publicId, { invalidate: true })),
  );
  return results.flatMap((result, index) =>
    result.status === "rejected" ? [{ publicId: uniquePublicIds[index], error: String(result.reason) }] : [],
  );
}
