import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFiles = [
  "../node_modules/html2canvas/dist/html2canvas.esm.js",
  "../node_modules/html2canvas/dist/html2canvas.js",
  "../node_modules/html2canvas/dist/lib/css/types/color.js",
];

let patchedCount = 0;

for (const relPath of targetFiles) {
  const fullPath = path.resolve(__dirname, relPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, "utf-8");
  const targetStr =
    'throw new Error("Attempting to parse an unsupported color function \\"" + value.name + "\\"");';

  if (content.includes(targetStr)) {
    content = content.replace(targetStr, "return 0;");
    fs.writeFileSync(fullPath, content, "utf-8");
    console.log(`[patch-html2canvas] Successfully patched: ${relPath}`);
    patchedCount++;
  } else {
    console.log(
      `[patch-html2canvas] Already patched or pattern not found in: ${relPath}`
    );
  }
}

console.log(`[patch-html2canvas] Done. Patched ${patchedCount} files.`);
