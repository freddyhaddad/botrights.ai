import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@botrights/shared'],
  output: 'standalone',
};

export default nextConfig;
