/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: { unoptimized: true },

  // 👇 Add these lines
  assetPrefix: './',
  basePath: '',

  // Optional: disable React strict mode to avoid console spam
  reactStrictMode: false,
};

module.exports = nextConfig;
