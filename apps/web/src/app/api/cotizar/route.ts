import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

/**
 * Proxy de cotizaciones: público (invitados pueden cotizar); si hay sesión,
 * adjunta el Bearer para ligar la cotización al usuario.
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const body = await req.json().catch(() => null);
  const apiRes = await fetch(`${API_URL}/quotes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}
