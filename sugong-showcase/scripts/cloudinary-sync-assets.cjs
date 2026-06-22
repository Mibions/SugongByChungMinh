require("dotenv").config();

const fs = require("node:fs/promises");
const path = require("node:path");
const { v2: cloudinary } = require("cloudinary");

const projectRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(projectRoot, "public");
const assetsRoot = path.join(publicRoot, "assets");
const assetFolder = process.env.PUBLIC_CLOUDINARY_ASSET_FOLDER || "sugong-showcase";
const imageExtensions = new Set([".avif", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"]);
const rasterExtensions = new Set([".avif", ".gif", ".jpg", ".jpeg", ".png", ".webp"]);
const warmAcceptHeader = "image/avif,image/webp,image/*,*/*;q=0.8";
const variantConfigs = {
  "hat-card": {
    widths: [320, 480, 640, 768],
    transforms: "f_auto,q_auto:eco,c_fill,g_auto,ar_4:5",
  },
  "hat-detail": {
    widths: [640, 900, 1200, 1600],
    transforms: "f_auto,q_auto,c_limit",
  },
  "hat-thumb": {
    widths: [160, 240, 320],
    transforms: "f_auto,q_auto:eco,c_fill,g_auto,w_160,h_160",
  },
  "product-card": {
    widths: [320, 480, 640, 800],
    transforms: "f_auto,q_auto:eco,c_fill,g_auto,ar_4:3",
  },
  "product-gallery-main": {
    widths: [640, 900, 1200, 1600],
    transforms: "f_auto,q_auto,c_limit",
  },
  "product-gallery-thumb": {
    widths: [160, 240, 320],
    transforms: "f_auto,q_auto:eco,c_fill,g_auto,w_160,h_160",
  },
  "category-card": {
    widths: [360, 540, 720, 960],
    transforms: "f_auto,q_auto:eco,c_fill,g_auto",
  },
  "legacy-generic": {
    widths: [1600],
    transforms: "f_auto,q_auto,c_limit",
  },
 };

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return walk(entryPath);
      }

      return imageExtensions.has(path.extname(entry.name).toLowerCase()) ? [entryPath] : [];
    })
  );

  return files.flat();
}

function getPublicId(filePath) {
  const relativePath = path.relative(publicRoot, filePath).replaceAll(path.sep, "/");
  const withoutExtension = relativePath.replace(/\.[^/.]+$/, "");

  return `${assetFolder}/${withoutExtension}`;
}

function getRelativeAssetPath(filePath) {
  return path.relative(publicRoot, filePath).replaceAll(path.sep, "/");
}

function buildCloudinaryUrl(publicId, transforms) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${publicId}`;
}

function getWarmVariantKeys(relativePath) {
  if (relativePath.startsWith("assets/products/graduation-hats/")) {
    return ["hat-card", "hat-detail", "hat-thumb"];
  }

  if (relativePath.startsWith("assets/products/")) {
    return ["product-card", "product-gallery-main", "product-gallery-thumb"];
  }

  if (relativePath.startsWith("assets/categories/")) {
    return ["category-card"];
  }

  if (relativePath.startsWith("assets/brand/")) {
    return ["legacy-generic"];
  }

  return ["legacy-generic"];
}

function createWarmUrls(relativePath, publicId, extension) {
  if (!rasterExtensions.has(extension)) return [];

  return getWarmVariantKeys(relativePath).flatMap((variantKey) => {
    const variant = variantConfigs[variantKey];
    return variant.widths.map((width) => buildCloudinaryUrl(publicId, `${variant.transforms},w_${width}`));
  });
}

async function warmDerivedAssets(relativePath, publicId, extension) {
  const urls = createWarmUrls(relativePath, publicId, extension);

  if (urls.length === 0) {
    return 0;
  }

  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const response = await fetch(url, {
        headers: {
          Accept: warmAcceptHeader,
        },
      });

      if (!response.ok) {
        throw new Error(`Warm request failed with status ${response.status} for ${url}`);
      }

      // Consume the body so the request completes and the derived asset is cached.
      await response.arrayBuffer();
    })
  );

  const rejected = results.filter((result) => result.status === "rejected");
  if (rejected.length > 0) {
    throw new Error(`Failed to warm ${rejected.length}/${urls.length} derived assets for ${relativePath}`);
  }

  return urls.length;
}

async function main() {
  const files = await walk(assetsRoot);

  if (files.length === 0) {
    console.log("No image assets found in public/assets.");
    return;
  }

  console.log(`Uploading ${files.length} image assets to Cloudinary folder "${assetFolder}"...`);
  let warmedCount = 0;

  for (const file of files) {
    const publicId = getPublicId(file);
    const relativePath = getRelativeAssetPath(file);
    const extension = path.extname(file).toLowerCase();
    const result = await cloudinary.uploader.upload(file, {
      public_id: publicId,
      overwrite: true,
      resource_type: "image",
    });

    const warmedForAsset = await warmDerivedAssets(relativePath, publicId, extension);
    warmedCount += warmedForAsset;

    console.log(`${relativePath} -> ${result.secure_url} (warmed ${warmedForAsset} variants)`);
  }

  console.log(`Warmed ${warmedCount} Cloudinary derived image variants.`);
  console.log("Cloudinary asset sync complete.");
}

main().catch((error) => {
  console.error("Cloudinary asset sync failed:");
  console.error(error);
  process.exit(1);
});
