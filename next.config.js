/** @type {import("next").NextConfig} */
const nextConfig = {
  // Enable Turbopack for better performance
  // For more info: https://nextjs.org/docs/app/api-reference/next-config-js/turbopack
  // Explicitly disable Turbopack if using webpack configuration
  // For more info: https://nextjs.org/docs/app/api-reference/next-config-js/turbopack
  experimental: {
    forceSwcTransforms: true, // Ensures SWC is used for all transformations
    // turbopack: false, // Disables Turbopack entirely
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
