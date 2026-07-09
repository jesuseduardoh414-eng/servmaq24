import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

/** Proxy del checkout: agrega el Bearer de la cookie httpOnly y reenvía a la API. */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Sesión requerida' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const apiRes = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}
