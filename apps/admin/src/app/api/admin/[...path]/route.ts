import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, API_URL } from '@/lib/admin';

/**
 * Proxy del admin: login escribe la cookie httpOnly; el resto reenvía a
 * /admin/* de la API con el Bearer. Solo rutas admin — nada abierto.
 */
async function forward(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const joined = path.join('/');

  if (joined === 'logout') {
    const res = NextResponse.json({ ok: true });
    res.cookies.delete(ADMIN_COOKIE);
    return res;
  }

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const init: RequestInit = { method: req.method, headers };
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    headers['Content-Type'] = req.headers.get('content-type') ?? 'application/json';
    init.body = await req.blob();
  }

  const apiRes = await fetch(`${API_URL}/admin/${joined}`, init);
  const data = await apiRes.json().catch(() => null);

  // Login exitoso → guardar cookie httpOnly
  if (joined === 'auth/login' && apiRes.ok && data?.token) {
    const res = NextResponse.json({ admin: data.admin });
    res.cookies.set(ADMIN_COOKIE, data.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return res;
  }
  return NextResponse.json(data, { status: apiRes.status });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
