import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

/**
 * Entrega el access token de la cookie httpOnly al navegador para autenticar Supabase Realtime.
 * El navegador lo usa solo en memoria (no localStorage). Requiere sesión iniciada.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value ?? null;
  return NextResponse.json({ token }, { headers: { 'Cache-Control': 'no-store' } });
}
