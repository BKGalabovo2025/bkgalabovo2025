import path from "path";
import { fileURLToPath } from "url";
import withPWAInit from "@ducanh2912/next-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    navigateFallbackDenylist: [
      /^\/dashboard/,
      /^\/login/,
      /^\/members/,
      /^\/families/,
      /^\/finances/,
      /^\/sales/,
      /^\/schedule/,
      /^\/reservations/,
      /^\/subscriptions/,
      /^\/inventory/,
      /^\/tournaments/,
      /^\/rankings/,
      /^\/reports/,
      /^\/settings/,
      /^\/api/,
    ],
    runtimeCaching: [
      {
        // Не кешираме Firebase Storage (често се качват големи снимки от галерии)
        // Пазим максимум 15 скорошни снимки до 7 дни.
        urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'firebase-storage-cache',
          expiration: {
            maxEntries: 15,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
        },
      },
      {
        // Изцяло забраняваме кеширането на API заявки към Firestore 
        // (защото Firebase SDK има собствена мощна IndexedDB кеш система)
        urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
        handler: 'NetworkOnly',
      },
      {
        // Изключваме тежки PDF файлове и видеа от PWA кеша
        urlPattern: /\.(?:pdf|mp4|webm)$/i,
        handler: 'NetworkOnly',
      }
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["firebase-admin"],
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
  },
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",")
    : [
        "*.cloudworkstations.dev",
        "3000-firebase-bkgalabovo2025-1772179617694.cluster-zti5ytzhlffjiqj6bp4giuli3u.cloudworkstations.dev",
      ],
};

export default withPWA(nextConfig);
