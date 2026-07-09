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
  /**
   * Redirects 301 de las URLs del Laravel viejo → rutas nuevas.
   * CRÍTICO para conservar el SEO al lanzar. Nuestro slug termina en -id,
   * y el parser solo lee el id, así que el texto del slug viejo da igual.
   */
  async redirects() {
    return [
      { source: '/product/:id/:slug', destination: '/productos/:slug-:id', permanent: true },
      { source: '/category/:slug', destination: '/productos?categoria=:slug', permanent: true },
      { source: '/category/:slug/:sort', destination: '/productos?categoria=:slug', permanent: true },
      { source: '/subcategory/:slug', destination: '/productos', permanent: true },
      { source: '/subcategory/:slug/:sort', destination: '/productos', permanent: true },
      { source: '/childcategory/:slug', destination: '/productos', permanent: true },
      { source: '/childcategory/:slug/:sort', destination: '/productos', permanent: true },
      { source: '/search/:q', destination: '/productos?q=:q', permanent: true },
      { source: '/search/:q/:sort', destination: '/productos?q=:q', permanent: true },
      // Páginas aún sin equivalente propio: a la home mientras llegan (CMS F1.x/F4)
      { source: '/faq', destination: '/', permanent: false },
      { source: '/contact', destination: '/', permanent: false },
      { source: '/quienes-somos', destination: '/', permanent: false },
      { source: '/stores', destination: '/', permanent: false },
      { source: '/Marcas', destination: '/', permanent: false },
    ];
  },
};

export default nextConfig;
