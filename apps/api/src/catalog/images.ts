/**
 * Resolución de fotos: todo vive ahora en Supabase Storage (bucket público `media`).
 * - filename legacy (ej. "1772826218retoexcava.png") → media/<name>
 * - "uploads/xxx" (subidas nuevas)                    → media/uploads/xxx
 * - URL absoluta                                      → tal cual
 * La base es configurable con IMAGE_BASE_URL (packages/db/.env).
 */
const DEFAULT_STORAGE =
  'https://kxewnuotuolwloccusqx.supabase.co/storage/v1/object/public/media';

// DEBE coincidir con sanitizeKey del uploader y de common/supabase.ts
const sanitizeKey = (k: string): string =>
  k
    .split('/')
    .map((seg) => seg.replace(/[^A-Za-z0-9_.\-!*'() &$@=;:+,?]/g, '_'))
    .join('/');

export function imageUrl(photo: string | null | undefined): string | null {
  if (!photo) return null;
  if (photo.startsWith('http')) return photo;
  const base = process.env.IMAGE_BASE_URL ?? DEFAULT_STORAGE;
  return `${base}/${sanitizeKey(photo)}`;
}

/**
 * Campos legacy de `inf_sitio` (misión/visión/objetivos) a veces vienen como
 * JSON `{"title":...,"text":"..."}` (con escapes unicode). Devuelve solo el
 * texto plano; si no es ese formato, lo deja igual. Así la página y el editor
 * muestran texto limpio, y al reguardar queda normalizado en la BD.
 */
export function normLegacyText(v: string | null | undefined): string | null {
  if (v == null) return v ?? null;
  const s = v.trim();
  if (s.startsWith('{') && s.includes('"text"')) {
    try {
      const o = JSON.parse(s);
      if (o && typeof o === 'object' && 'text' in o) return String((o as { text?: unknown }).text ?? '');
    } catch { /* no es JSON válido: se deja igual */ }
  }
  return v;
}
