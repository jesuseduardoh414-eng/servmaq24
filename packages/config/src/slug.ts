/**
 * URLs de producto SEO-friendly: `retroexcavadora-9923`.
 * El id va al final porque los productos legacy no tienen columna slug.
 */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar acentos (marcas combinantes NFD)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
}

export function productSlug(name: string, id: number): string {
  return `${slugify(name)}-${id}`;
}

/** Extrae el id numérico del final del slug; null si no es válido. */
export function parseProductSlug(slug: string): number | null {
  const m = slug.match(/-(\d+)$/);
  return m ? Number(m[1]) : null;
}
