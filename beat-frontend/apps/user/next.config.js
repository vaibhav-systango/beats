/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@beat/ui', '@beat/utils', '@beat/types', '@beat/api-client'],
  reactStrictMode: true,
}

module.exports = nextConfig
