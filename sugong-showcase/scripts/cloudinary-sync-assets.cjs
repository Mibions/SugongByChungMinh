require("dotenv").config();

const fs = require("node:fs/promises");
const path = require("node:path");
const { v2: cloudinary } = require("cloudinary");

const projectRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(projectRoot, "public");
const assetsRoot = path.join(publicRoot, "assets");
const assetFolder = process.env.PUBLIC_CLOUDINARY_ASSET_FOLDER || "sugong-showcase";
const imageExtensions = new Set([".avif", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"]);

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

async function main() {
  const files = await walk(assetsRoot);

  if (files.length === 0) {
    console.log("No image assets found in public/assets.");
    return;
  }

  console.log(`Uploading ${files.length} image assets to Cloudinary folder "${assetFolder}"...`);

  for (const file of files) {
    const publicId = getPublicId(file);
    const result = await cloudinary.uploader.upload(file, {
      public_id: publicId,
      overwrite: true,
      resource_type: "image",
    });

    console.log(`${path.relative(publicRoot, file).replaceAll(path.sep, "/")} -> ${result.secure_url}`);
  }

  console.log("Cloudinary asset sync complete.");
}

main().catch((error) => {
  console.error("Cloudinary asset sync failed:");
  console.error(error);
  process.exit(1);
});
