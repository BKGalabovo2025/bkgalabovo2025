/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // This allows access from Cloud Workstations URLs which are dynamic.
    // We move these to environment variables as per audit recommendations.
    allowedRevalidateHeaderKeys: ['x-prerender-revalidate'],
  },
  // In Next.js 14/15, allowedDevOrigins might need to be in 'experimental'
  // using a process environment variable for these specific origins.
  ...(process.env.ALLOWED_DEV_ORIGINS ? {
    allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS.split(','),
  } : {
    allowedDevOrigins: [
      "*.cloudworkstations.dev",
    ]
  }),
};

module.exports = nextConfig;
