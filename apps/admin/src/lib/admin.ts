import { cookies } from 'next/headers';
import { ADMIN_COOKIE, API_URL } from './cookies';

// Estas constantes viven en ./cookies (sin next/headers) para que el middleware
// Edge pueda importarlas; se reexportan aquí por compatibilidad.
export { ADMIN_COOKIE, ADMIN_REFRESH_COOKIE, API_URL, SITE_URL } from './cookies';

/** Fetch autenticado del lado servidor con el token admin de la cookie. */
export async function adminFetch<T>(path: string): Promise<T | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export async function getAdmin(): Promise<{ id: number; name: string; email: string; role: string } | null> {
  return adminFetch('/admin/auth/me');
}
