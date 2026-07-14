import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@maqserv/ui'],
  images: {
    remotePatterns: [
      // Assets migrados a Supabase Storage (bucket público `media`).
      { protocol: 'https', hostname: 'kxewnuotuolwloccusqx.supabase.co', pathname: '/storage/v1/object/public/media/**' },
      { protocol: 'https', hostname: 'scava.website' },
      { protocol: 'http', hostname: 'localhost', port: '4000' },
    ],
  },
};

export default nextConfig;
