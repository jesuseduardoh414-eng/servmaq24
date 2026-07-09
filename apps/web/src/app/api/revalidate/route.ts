import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Invalidación bajo demanda del cache ISR.
 * El admin (F4) la dispara al publicar un tema o contenido:
 *   POST /api/revalidate?secret=...&path=/
 * Sin REVALIDATE_SECRET configurado, el endpoint queda deshabilitado.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'REVALIDATE_SECRET no configurado' }, { status: 503 });
  }
  if (req.nextUrl.searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Secret inválido' }, { status: 401 });
  }
  const path = req.nextUrl.searchParams.get('path') ?? '/';
  revalidatePath(path, 'layout'); // layout: invalida también el tema inyectado
  return NextResponse.json({ revalidated: true, path, ts: Date.now() });
}
