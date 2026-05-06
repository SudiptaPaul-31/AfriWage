import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@remitchain/sdk'],
  webpack: (config) => {
    // Stellar SDK uses Node.js built-ins that need to be polyfilled for browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    return config;
  },
  experimental: {
    // Required for monorepo workspace packages
    externalDir: true,
  },
};

export default nextConfig;
