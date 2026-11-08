#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";

// Load environment variables from .env.local if available without external dependencies
try {
  if (fs.existsSync(".env.local")) {
    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(".env.local");
    } else {
      const content = fs.readFileSync(".env.local", "utf-8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  }
} catch {
  // Ignore env file reading errors
}

const PROJECT_NAME = "bkgalabovo2025";

function getVercelToken() {
  return (
    process.env.VERCEL_TOKEN ||
    process.env.VERCEL_AUTH_TOKEN ||
    ""
  );
}

function runCleanup() {
  // If project is hosted on Netlify and FORCE_VERCEL_CLEANUP is not explicitly requested, skip cleanly
  if ((fs.existsSync("netlify.toml") || fs.existsSync(".netlify/site.json")) && !process.env.FORCE_VERCEL_CLEANUP) {
    console.log("ℹ️ Проектът се хоства в Netlify. Пропускане на Vercel почистване.");
    return;
  }

  console.log("=======================================================");
  console.log("🧹 АВТОМАТИЧНО ПОЧИСТВАНЕ НА VERCEL ДЕПЛОЙДИ");
  console.log(`🎯 Проект: ${PROJECT_NAME} (Запазване само на активния)`);
  console.log("=======================================================");

  const token = getVercelToken();
  if (!token) {
    console.log("ℹ️ Липсва VERCEL_TOKEN. Пропускане на Vercel почистване.");
    return;
  }

  const tokenArg = ` --token "${token}"`;
  const cmd = `npx vercel remove ${PROJECT_NAME} --safe --yes${tokenArg}`;

  try {
    const output = execSync(cmd, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
      timeout: 60000,
    });

    if (output.includes("No deployments found") || output.includes("Found 0 deployments")) {
      console.log("✅ Всичко е чисто: активен е само текущият деплоймънт.");
    } else {
      console.log(output.trim());
      console.log("🎉 Почистването завърши успешно!");
    }
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : "";
    const stdout = err.stdout ? err.stdout.toString() : "";
    const combined = `${stdout}\n${stderr}`;

    if (
      combined.includes("No deployments found") ||
      combined.includes("Found 0 deployments") ||
      combined.includes("No deployments to remove") ||
      combined.includes("Could not find unaliased deployments")
    ) {
      console.log("✅ Всичко е чисто: активен е само текущият деплоймънт.");
      return;
    }

    if (
      combined.includes("not valid") ||
      combined.includes("invalid") ||
      combined.includes("Not authenticated") ||
      combined.includes("login") ||
      combined.includes("blocked") ||
      combined.includes("paused")
    ) {
      console.log("ℹ️ Vercel токенът е неактивен или акаунтът е спрян (хостингът е на Netlify). Пропускане.");
      return;
    }

    if (combined.includes("EACCES") || combined.includes("connect")) {
      console.log("ℹ️ Няма достъп до мрежата за Vercel CLI. Пропускане на почистването.");
      return;
    }

    // Redact any token from error message before logging
    const safeMsg = (err.message || "").replace(/--token\s+"[^"]*"/g, '--token "[REDACTED]"');
    console.warn("ℹ️ Пропускане на Vercel почистване:", safeMsg);
  }
}

runCleanup();
