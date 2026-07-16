import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';
import { clientIpHeaders } from '@/lib/client-ip';

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
  /^catalog\/products$/, // buscador del cotizador (datos públicos)
  /^catalog\/products\/\d+\/(comments|questions)$/, // reseñas y preguntas del producto
  /^account\/reviews(\/|$)/, // "Califica tus compras"
  /^freight\/quote$/, // cotizador de traslado del carrito/checkout
  /^notifications(\/read)?$/, // campana de avisos del cliente
  /^vendor(\/|$)/,
];

async function forward(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;

  /**
   * Fuera segmentos raros ANTES de mirar el allowlist.
   *
   * `fetch` normaliza la URL, así que `wishlist/../admin/users` pasaba el regex de
   * `wishlist` y salía hacia `/admin/users`. Ahí no se escalaba nada (el proxy adjunta
   * el token del CLIENTE y el AdminGuard lo rechaza), pero un allowlist que se puede
   * leer de dos formas no es un allowlist. Se compara exactamente lo que se envía.
   */
  if (path.some((seg) => seg === '.' || seg === '..' || seg.includes('\\') || seg.includes('%2e') || seg.includes('%2E'))) {
    return NextResponse.json({ message: 'Ruta no permitida' }, { status: 404 });
  }

  const joined = path.join('/');
  if (!ALLOWLIST.some((re) => re.test(joined))) {
    return NextResponse.json({ message: 'Ruta no permitida' }, { status: 404 });
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const headers: Record<string, string> = {
    ...clientIpHeaders(req),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const init: RequestInit = { method: req.method, headers };

  if (req.method !== 'GET' && req.method !== 'DELETE') {
    // multipart (subida de fotos) pasa como blob conservando el boundary
    const contentType = req.headers.get('content-type') ?? 'application/json';
    headers['Content-Type'] = contentType;
    init.body = await req.blob();
  }

  // Reenviar el query string (?search, ?page, …): sin esto la búsqueda llegaba
  // vacía a la API y devolvía todo el catálogo.
  const apiRes = await fetch(`${API_URL}/${joined}${req.nextUrl.search}`, init);
  const data = await apiRes.json().catch(() => null);
  return NextResponse.json(data, { status: apiRes.status });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
