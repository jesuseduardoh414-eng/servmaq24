import { cookies } from 'next/headers';
import type { AuthUser } from '@servmaq/types';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';
export const SESSION_COOKIE = 'servmaq_session';

/**
 * Sesión del lado servidor: el JWT vive en cookie httpOnly (el JS del
 * navegador nunca lo ve). Los route handlers /api/auth/* la escriben.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store', // la sesión nunca se cachea
    });
    if (!res.ok) return null;
    return (await res.json()) as AuthUser;
  } catch {
    return null;
  }
}
