/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Pre-allowed remote sources for future Prompt 2/3 work.
    // Adding here now avoids needing to revisit this file later.
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: 'imagedelivery.net' }, // Cloudflare Images
      { protocol: 'https', hostname: 'i.ytimg.com' },
      // Lookbook placeholders (Prompt 6 §10) — owner replaces with
      // real photography + Cloudflare Images URLs at launch.
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
    ],
  },
};

module.exports = nextConfig;
