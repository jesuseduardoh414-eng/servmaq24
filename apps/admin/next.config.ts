import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@servmaq/ui'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'scava.website' },
      { protocol: 'http', hostname: 'localhost', port: '4000' },
    ],
  },
};

export default nextConfig;
