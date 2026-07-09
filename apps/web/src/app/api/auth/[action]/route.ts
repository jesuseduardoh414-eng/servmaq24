import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

/**
 * GET /api/auth/session: devuelve el usuario de la cookie (o null).
 * Lo usa el header en cliente para no volver dinámicas las páginas estáticas.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  if (action !== 'session') {
    return NextResponse.json({ message: 'Acción inválida' }, { status: 404 });
  }
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ user: null });
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ user: null });
    return NextResponse.json({ user: await res.json() });
  } catch {
    return NextResponse.json({ user: null });
  }
}

/**
 * Proxy de auth: reenvía login/register a la API y guarda el JWT en cookie
 * httpOnly + SameSite=Lax. `logout` solo borra la cookie.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;

  if (action === 'logout') {
    const res = NextResponse.json({ ok: true });
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  if (action !== 'login' && action !== 'register') {
    return NextResponse.json({ message: 'Acción inválida' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const apiRes = await fetch(`${API_URL}/auth/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await apiRes.json();

  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status });
  }

  const res = NextResponse.json({ user: data.user });
  res.cookies.set(SESSION_COOKIE, data.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // igual que la expiración del JWT
    path: '/',
  });
  return res;
}
