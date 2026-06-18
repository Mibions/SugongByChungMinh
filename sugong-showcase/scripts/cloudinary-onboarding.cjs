require("dotenv").config();

const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function main() {
  try {
    const uploadResult = await cloudinary.uploader.upload(
      "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      {
        folder: "sugong-onboarding",
      }
    );

    console.log("Uploaded image secure URL:");
    console.log(uploadResult.secure_url);

    console.log("Uploaded image public ID:");
    console.log(uploadResult.public_id);

    const details = await cloudinary.api.resource(uploadResult.public_id);

    console.log("Image metadata:");
    console.log(`Width: ${details.width}`);
    console.log(`Height: ${details.height}`);
    console.log(`Format: ${details.format}`);
    console.log(`File size bytes: ${details.bytes}`);

    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      secure: true,
      fetch_format: "auto", // f_auto: automatically chooses the best image format for the browser.
      quality: "auto", // q_auto: automatically chooses a good quality/file-size balance.
    });

    console.log("Done! Click link below to see optimized version of the image. Check the size and the format.");
    console.log(transformedUrl);
  } catch (error) {
    console.error("Cloudinary onboarding failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
