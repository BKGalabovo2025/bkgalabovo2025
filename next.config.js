/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {},
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "lh3.googleusercontent.com",
      "images.unsplash.com",
    ],
  },
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",")
    : [
        "*.cloudworkstations.dev",
        "3000-firebase-bkgalabovo2025-1772179617694.cluster-zti5ytzhlffjiqj6bp4giuli3u.cloudworkstations.dev",
      ],
};

export default nextConfig;
