import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
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
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["firebase-admin"],
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
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
