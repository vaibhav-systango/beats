/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@beat/ui',
    '@beat/utils',
    '@beat/types',
    '@beat/api-client',
    '@beat/core',
  ],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

module.exports = nextConfig
