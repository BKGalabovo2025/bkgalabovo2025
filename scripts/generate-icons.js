import sharp from "sharp";
import fs from "fs";

async function generateIcons() {
  const logoPath = "public/logo.png";
  const recoveryPath = "public/1.png";

  if (fs.existsSync(logoPath)) {
    console.log("Generating BK icons from logo.png...");
    await sharp(logoPath)
      .resize(192, 192, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .toFile("public/icons/icon-192x192.png");
    await sharp(logoPath)
      .resize(512, 512, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .toFile("public/icons/icon-512x512.png");
  } else {
    console.warn("public/logo.png not found");
  }

  if (fs.existsSync(recoveryPath)) {
    console.log("Generating Recovery icons from 1.png...");
    await sharp(recoveryPath)
      .resize(192, 192, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .toFile("public/icons/recovery-192x192.png");
  } else {
    console.warn("public/1.png not found");
  }

  console.log("Done generating icons!");
}

generateIcons().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
