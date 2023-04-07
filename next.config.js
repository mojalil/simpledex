/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    INFURA_ID: process.env.NEXT_PUBLIC_INFURA_ID,
   }
}

module.exports = nextConfig
