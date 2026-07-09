import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @servmaq/ui se consume como fuente TS; Next lo transpila
  transpilePackages: ['@servmaq/ui'],
};

export default nextConfig;
