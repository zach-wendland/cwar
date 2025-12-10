/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable server actions
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Transpile external packages that need it
  transpilePackages: ['@mirawision/usa-map-react'],
};

module.exports = nextConfig;
