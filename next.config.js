// next.config.js
// Next.js blocks external images unless you whitelist their domains.
// cdn.shopify.com is where all real Shopify product images live.
// placehold.co is for the mock product images — remove it once live.

/** @type {import('next').NextConfig} */
typescript: { ignoreBuildErrors: true } and eslint: { ignoreDuringBuilds: true }
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co", // mock images — safe to delete later
      },
    ],
  },
};

module.exports = nextConfig;
