import type { MetadataRoute } from 'next';
import { getProducts, getCategories } from '@/lib/api';

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/productos`, changeFrequency: 'daily', priority: 0.9 },
  ];

  // Categorías
  const categories = await getCategories();
  for (const c of categories) {
    entries.push({
      url: `${SITE_URL}/productos?categoria=${c.slug}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  // Todos los productos (recorriendo la paginación de la API)
  let page = 1;
  let pages = 1;
  do {
    const res = await getProducts({ page });
    pages = res.pages;
    for (const p of res.items) {
      entries.push({
        url: `${SITE_URL}/productos/${p.slug}`,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
    page++;
  } while (page <= pages);

  return entries;
}
