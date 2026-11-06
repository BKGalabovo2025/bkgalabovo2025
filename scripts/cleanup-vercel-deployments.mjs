#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.local if available
dotenv.config({ path: ".env.local" });

const PROJECT_NAME = "bkgalabovo2025";

function getVercelToken() {
  return (
    process.env.VERCEL_TOKEN ||
    process.env.VERCEL_AUTH_TOKEN ||
    ""
  );
}

function runCleanup() {
  console.log("=======================================================");
  console.log("🧹 АВТОМАТИЧНО ПОЧИСТВАНЕ НА VERCEL ДЕПЛОЙДИ");
  console.log(`🎯 Проект: ${PROJECT_NAME} (Запазване само на активния)`);
  console.log("=======================================================");

  const token = getVercelToken();
  const tokenArg = token ? ` --token "${token}"` : "";

  // The --safe flag ensures active aliased deployments (e.g. bkgalabovo2025.vercel.app) are NEVER deleted.
  // The --yes flag bypasses interactive prompts.
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

    if (combined.includes("EACCES") || combined.includes("connect")) {
      console.warn("⚠️ Няма достъп до мрежата за Vercel CLI (пясъчник или липса на интернет). Пропускане на почистването.");
      return;
    }

    if (combined.includes("Not authenticated") || combined.includes("login")) {
      console.warn("⚠️ Vercel CLI не е автентикиран на тази среда. Настройте VERCEL_TOKEN за автоматично почистване.");
      return;
    }

    console.warn("⚠️ Предупреждение при почистване на Vercel деплойдите:", err.message);
    // Don't fail the push pipeline if Vercel API is temporarily unreachable
  }
}

runCleanup();
