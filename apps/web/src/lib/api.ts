import type {
  BannerSet,
  BlogCard,
  BlogDetail,
  Category,
  FaqItem,
  HomeHero,
  Paginated,
  ProductCard,
  ProductDetail,
  ServiceItem,
  SiteReview,
  SiteSettings,
  StrategicSector,
  StrategicSectorDetail,
  WhyChooseUsItem,
} from '@maqserv/types';

import { cache } from 'react';
import { CONTENT_CACHE } from '@/lib/theme';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

/**
 * PROD: ISR 60s (+ invalidación bajo demanda). DEV: sin caché para que los
 * cambios del admin se vean al refrescar, sin esperar. Ver CONTENT_CACHE.
 *
 * `cache()` deduplica por `path` dentro de un mismo render: si dos secciones
 * piden el mismo endpoint (p. ej. /catalog/categories o /theme), se hace UNA
 * sola llamada por request → menos viajes al DB, carga más rápida.
 */
const fetchJson = cache(async (path: string): Promise<unknown> => {
  const res = await fetch(`${API_URL}${path}`, CONTENT_CACHE);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
});

async function get<T>(path: string): Promise<T> {
  return (await fetchJson(path)) as T;
}

export function getProducts(opts: {
  page?: number;
  search?: string;
  category?: string;
  subcategory?: string;
  featured?: boolean;
} = {}): Promise<Paginated<ProductCard>> {
  const q = new URLSearchParams();
  if (opts.page) q.set('page', String(opts.page));
  if (opts.search) q.set('search', opts.search);
  if (opts.category) q.set('category', opts.category);
  if (opts.subcategory) q.set('subcategory', opts.subcategory);
  if (opts.featured) q.set('featured', '1');
  const qs = q.toString();
  return get(`/catalog/products${qs ? `?${qs}` : ''}`);
}

export function getSubcategories(categorySlug: string): Promise<Array<{ id: number; name: string; slug: string }>> {
  return get(`/catalog/categories/${encodeURIComponent(categorySlug)}/subcategories`);
}

export function getProduct(id: number): Promise<ProductDetail> {
  return get(`/catalog/products/${id}`);
}

export function getCategories(): Promise<Category[]> {
  return get('/catalog/categories');
}

export function getSiteSettings(): Promise<SiteSettings> {
  return get('/settings/site');
}

// ---- Contenido de home / CMS ligero ----

export function getHero(): Promise<HomeHero | null> {
  return get('/content/hero');
}

export function getSectors(): Promise<StrategicSector[]> {
  return get('/content/sectors');
}

export function getSector(id: number): Promise<StrategicSectorDetail> {
  return get(`/content/sectors/${id}`);
}

export function getWhyChooseUs(): Promise<WhyChooseUsItem[]> {
  return get('/content/why-choose-us');
}

export function getServices(): Promise<ServiceItem[]> {
  return get('/content/services');
}

export function getBanners(): Promise<BannerSet> {
  return get('/content/banners');
}

export function getBlogs(limit = 3): Promise<BlogCard[]> {
  return get(`/content/blogs?limit=${limit}`);
}

export function getBlog(id: number): Promise<BlogDetail> {
  return get(`/content/blogs/${id}`);
}

export function getReviews(limit = 6): Promise<SiteReview[]> {
  return get(`/content/reviews?limit=${limit}`);
}

export function getFaqs(): Promise<FaqItem[]> {
  return get('/content/faqs');
}
