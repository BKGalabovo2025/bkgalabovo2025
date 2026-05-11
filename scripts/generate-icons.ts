import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(process.cwd(), "public");
const ICONS_DIR = path.join(PUBLIC_DIR, "icons");
const CLUB_LOGO = path.join(PUBLIC_DIR, "logo.png");
const RECOVERY_LOGO = path.join(PUBLIC_DIR, "1.png");

async function generateIcons() {
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  console.log("Generating PWA icons...");

  // Main App Icons (from Club Logo)
  await sharp(CLUB_LOGO)
    .resize(192, 192)
    .toFile(path.join(ICONS_DIR, "icon-192x192.png"));

  await sharp(CLUB_LOGO)
    .resize(512, 512)
    .toFile(path.join(ICONS_DIR, "icon-512x512.png"));

  // Apple Touch Icon
  await sharp(CLUB_LOGO)
    .resize(180, 180)
    .toFile(path.join(PUBLIC_DIR, "apple-touch-icon.png"));

  // Recovery Zone Shortcut Icon
  if (fs.existsSync(RECOVERY_LOGO)) {
    await sharp(RECOVERY_LOGO)
      .resize(192, 192)
      .toFile(path.join(ICONS_DIR, "recovery-192x192.png"));
  }

  console.log("Icons generated successfully in public/icons/");
}

generateIcons().catch(console.error);
