import { defaultTheme, themeSchema, type Theme } from '@servmaq/config';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

/**
 * Tema activo desde la API (que lo lee de la BD).
 * ISR: revalida cada 60s; el admin invalidará al publicar (F4) vía /api/revalidate.
 * Fallback al tema default si la API no responde: el sitio nunca se cae por el tema.
 */
export async function getTheme(): Promise<Theme> {
  try {
    const res = await fetch(`${API_URL}/theme`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`API /theme respondió ${res.status}`);
    return themeSchema.parse(await res.json());
  } catch (err) {
    console.warn('[theme] usando tema default (API no disponible):', err);
    return defaultTheme;
  }
}

/** Resuelve un copy por clave e idioma, con la clave visible como fallback. */
export function t(theme: Theme, key: string, locale = 'es'): string {
  return theme.copys[locale]?.[key] ?? key;
}
