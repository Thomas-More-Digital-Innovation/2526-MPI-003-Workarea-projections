/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: { unoptimized: true },

  assetPrefix: './',
  basePath: '',

  reactStrictMode: false,
};

module.exports = nextConfig;
