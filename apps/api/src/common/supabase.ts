import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const MEDIA_BUCKET = 'media';

/**
 * Sanitiza claves de Supabase Storage: rechaza chars fuera de este set
 * (p. ej. em-dash —). DEBE coincidir con el sanitize del uploader y de imageUrl().
 */
export const sanitizeKey = (k: string): string =>
  k
    .split('/')
    .map((seg) => seg.replace(/[^A-Za-z0-9_.\-!*'() &$@=;:+,?]/g, '_'))
    .join('/');

let _sb: SupabaseClient | null = null;

/** Cliente Supabase con service_role (lazy: el env se carga vía packages/db/.env al arrancar). */
export function supabase(): SupabaseClient {
  if (!_sb) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY no configurados');
    _sb = createClient(url, key, { auth: { persistSession: false } });
  }
  return _sb;
}
