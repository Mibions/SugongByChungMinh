const baseUrl = import.meta.env.BASE_URL ?? "/";
const cloudinaryCloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
const cloudinaryAssetFolder = import.meta.env.PUBLIC_CLOUDINARY_ASSET_FOLDER ?? "sugong-showcase";
const cloudinaryImageExtensions = new Set(["avif", "gif", "jpg", "jpeg", "png", "svg", "webp"]);

function getBasePath() {
  const normalized = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return normalized === "/" ? "" : normalized;
}

function getCloudinaryAssetUrl(path: string) {
  if (!cloudinaryCloudName || !path.startsWith("/assets/")) return null;

  const extension = path.split(".").pop()?.toLowerCase();
  if (!extension || !cloudinaryImageExtensions.has(extension)) return null;

  const publicId = `${cloudinaryAssetFolder}${path.replace(/\.[^/.]+$/, "")}`;
  const transformations = extension === "svg" ? "" : "f_auto,q_auto,c_limit,w_1600/";

  return `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/${transformations}${publicId}.${extension}`;
}

export function withBase(path: string) {
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("mailto:") ||
    path.startsWith("tel:") ||
    path.startsWith("#") ||
    !path.startsWith("/")
  ) {
    return path;
  }

  const cloudinaryAssetUrl = getCloudinaryAssetUrl(path);
  if (cloudinaryAssetUrl) return cloudinaryAssetUrl;

  const basePath = getBasePath();
  if (!basePath || path === basePath || path.startsWith(`${basePath}/`)) {
    return path;
  }

  return `${basePath}${path}`;
}

export function withoutBase(pathname: string) {
  const basePath = getBasePath();
  if (!basePath) return pathname;

  if (pathname === basePath) return "/";
  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length) || "/";
  }

  return pathname;
}
