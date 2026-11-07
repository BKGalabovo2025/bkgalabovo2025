import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envLocalPath)) {
  console.error("Не е намерен .env.local файл!");
  process.exit(1);
}

const env = dotenv.parse(fs.readFileSync(envLocalPath, "utf8"));

// Clean single-line JSON strings if needed
const netlifyLines = [];
netlifyLines.push("# =====================================================");
netlifyLines.push("# NETLIFY ENVIRONMENT VARIABLES EXPORT");
netlifyLines.push("# Копирайте този текст в Netlify: Site configuration -> Environment variables -> Import from .env");
netlifyLines.push("# =====================================================\n");

// Site ID
netlifyLines.push(`NEXT_PUBLIC_SITE_ID="bkgalabovo"`);

for (const [key, val] of Object.entries(env)) {
  if (key === "VERCEL_TOKEN") continue; // Not needed on Netlify
  if (key === "NEXT_PUBLIC_APP_URL") {
    // Keep or set Netlify URL
    netlifyLines.push(`NEXT_PUBLIC_APP_URL="https://bkgalabovo2025.netlify.app"`);
    continue;
  }
  // If JSON value, ensure single-line string
  if (val.trim().startsWith("{") && val.trim().endsWith("}")) {
    try {
      const parsed = JSON.parse(val);
      netlifyLines.push(`${key}='${JSON.stringify(parsed)}'`);
      continue;
    } catch {}
  }
  // Standard formatting
  if (val.includes("\n") || val.includes(" ") || val.includes('"')) {
    netlifyLines.push(`${key}="${val.replace(/"/g, '\\"')}"`);
  } else {
    netlifyLines.push(`${key}="${val}"`);
  }
}

const outputPath = path.resolve(process.cwd(), ".env.netlify.txt");
fs.writeFileSync(outputPath, netlifyLines.join("\n"), "utf8");
console.log("✅ Успешно генериран .env.netlify.txt с всички променливи за Netlify!");

