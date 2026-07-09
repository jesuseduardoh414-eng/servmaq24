import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @servmaq/ui se consume como fuente TS; Next lo transpila
  transpilePackages: ['@servmaq/ui'],
  images: {
    remotePatterns: [
      // Las fotos legacy viven en el sitio Laravel de producción hasta migrar
      // los assets (F4). Base configurable vía IMAGE_BASE_URL en la API.
      { protocol: 'https', hostname: 'scava.website' },
    ],
  },
};

export default nextConfig;
