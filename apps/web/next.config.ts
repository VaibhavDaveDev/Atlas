import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@atlas/ui', '@atlas/utils', '@atlas/types'],
  images: {
    // Local /public images don't need domains — this just ensures PNGs work
    formats: ['image/webp'],
  },

  // Dev indicators - use current Next.js 15 API
  devIndicators: {
    position: 'bottom-right',
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
  },

  // Fix webpack issues with monorepo
  webpack: (config, { isServer }) => {
    // Ignore package.json parsing issues
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    // Exclude problematic modules from parsing
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

export default nextConfig;
