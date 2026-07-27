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

export function createSignedUpload(productId?: string) {
  const { cloudName, apiKey, apiSecret } = configureCloudinary();
  const timestamp = Math.floor(Date.now() / 1000);
  const rootFolder = process.env.PUBLIC_CLOUDINARY_ASSET_FOLDER ?? "sugong-showcase";
  const safeProductId = productId && /^[0-9a-f-]{36}$/i.test(productId) ? productId : "drafts";
  const folder = `${rootFolder}/products/${safeProductId}`;
  const uploadParams = {
    timestamp,
    folder,
    overwrite: false,
    unique_filename: true,
    use_filename: true,
  };
  const signature = cloudinary.utils.api_sign_request(uploadParams, apiSecret);
  return { cloudName, apiKey, signature, ...uploadParams };
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
