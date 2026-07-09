import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

/**
 * Proxy autenticado genérico: adjunta el Bearer de la cookie httpOnly y
 * reenvía a la API. Solo rutas del ALLOWLIST (la API igualmente exige JWT
 * donde corresponde — esto solo evita exponer un proxy abierto).
 */
const ALLOWLIST = [
  /^wishlist(\/|$)/,
  /^orders\/coupon\/check$/,
  /^auth\/profile$/,
  /^auth\/change-password$/,
  /^catalog\/products\/\d+\/comments$/,
  /^vendor(\/|$)/,
];

async function forward(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const joined = path.join('/');
  if (!ALLOWLIST.some((re) => re.test(joined))) {
    return NextResponse.json({ message: 'Ruta no permitida' }, { status: 404 });
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const init: RequestInit = { method: req.method, headers };

  if (req.method !== 'GET' && req.method !== 'DELETE') {
    // multipart (subida de fotos) pasa como blob conservando el boundary
    const contentType = req.headers.get('content-type') ?? 'application/json';
    headers['Content-Type'] = contentType;
    init.body = await req.blob();
  }

  const apiRes = await fetch(`${API_URL}/${joined}`, init);
  const data = await apiRes.json().catch(() => null);
  return NextResponse.json(data, { status: apiRes.status });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
