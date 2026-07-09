/**
 * Los productos legacy guardan la foto como filename (ej. "1772826218retoexcava.png")
 * servido por el sitio Laravel en /assets/images/. Mientras los assets no se
 * migren (tarea F4), las URLs apuntan al sitio de producción — configurable por env.
 */
const IMAGE_BASE = process.env.IMAGE_BASE_URL ?? 'https://scava.website/assets/images';

export function imageUrl(photo: string | null | undefined): string | null {
  if (!photo) return null;
  if (photo.startsWith('http')) return photo;
  return `${IMAGE_BASE}/${photo}`;
}
