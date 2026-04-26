import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@atlas/ui', '@atlas/utils', '@atlas/types'],
};

export default nextConfig;
