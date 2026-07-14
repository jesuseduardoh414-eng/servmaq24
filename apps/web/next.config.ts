import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @maqserv/ui se consume como fuente TS; Next lo transpila
  transpilePackages: ['@maqserv/ui'],
  images: {
    remotePatterns: [
      // Assets migrados a Supabase Storage (bucket público `media`).
      { protocol: 'https', hostname: 'kxewnuotuolwloccusqx.supabase.co', pathname: '/storage/v1/object/public/media/**' },
      // Legacy (por si queda alguna URL de scava.website sin migrar).
      { protocol: 'https', hostname: 'scava.website' },
      // Subidas nuevas servidas por la API (dev; en prod añadir su dominio).
      { protocol: 'http', hostname: 'localhost', port: '4000' },
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
      // Equivalentes definitivos de las páginas legacy
      { source: '/faq', destination: '/', permanent: true }, // FAQ es sección de la home
      { source: '/contact', destination: '/contacto', permanent: true },
      { source: '/stores', destination: '/vendedores', permanent: true },
      { source: '/Marcas', destination: '/vendedores', permanent: true },
      { source: '/track', destination: '/rastreo', permanent: true },
    ];
  },
};

export default nextConfig;
