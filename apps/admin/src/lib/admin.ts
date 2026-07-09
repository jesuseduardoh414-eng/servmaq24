import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'servmaq_admin';
export const API_URL = process.env.API_URL ?? 'http://localhost:4000';

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
