import { cache } from 'react';
import { defaultTheme, themeSchema, type Theme } from '@maqserv/config';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

/**
 * Política de caché de datos del sitio:
 *  - PROD: ISR 60s (rápido + invalidación bajo demanda al publicar).
 *  - DEV: sin caché (no-store) para ver los cambios del admin al instante,
 *    sin esperar la ventana de 60s.
 */
export const CONTENT_CACHE: RequestInit =
  process.env.NODE_ENV === 'production' ? { next: { revalidate: 60 } } : { cache: 'no-store' };

/**
 * Tema activo desde la API (que lo lee de la BD).
 * Fallback al tema default si la API no responde: el sitio nunca se cae por el tema.
 */
export const getTheme = cache(async (): Promise<Theme> => {
  try {
    const res = await fetch(`${API_URL}/theme`, CONTENT_CACHE);
    if (!res.ok) throw new Error(`API /theme respondió ${res.status}`);
    return themeSchema.parse(await res.json());
  } catch (err) {
    console.warn('[theme] usando tema default (API no disponible):', err);
    return defaultTheme;
  }
});

/** Resuelve un copy por clave e idioma, con la clave visible como fallback. */
export function t(theme: Theme, key: string, locale = 'es'): string {
  return theme.copys[locale]?.[key] ?? key;
}
