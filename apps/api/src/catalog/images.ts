/**
 * Resolución de fotos:
 * - "uploads/xxx" → subidas al sistema NUEVO, servidas por esta API.
 * - filename legacy (ej. "1772826218retoexcava.png") → sitio Laravel de
 *   producción hasta migrar assets (tarea F4). Configurable por env.
 */
const IMAGE_BASE = process.env.IMAGE_BASE_URL ?? 'https://scava.website/assets/images';
const API_PUBLIC_URL = process.env.API_PUBLIC_URL ?? 'http://localhost:4000';

export function imageUrl(photo: string | null | undefined): string | null {
  if (!photo) return null;
  if (photo.startsWith('http')) return photo;
  if (photo.startsWith('uploads/')) return `${API_PUBLIC_URL}/${photo}`;
  return `${IMAGE_BASE}/${photo}`;
}
