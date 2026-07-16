import { NextRequest, NextResponse } from 'next/server';
import { clientIpHeaders } from '@/lib/client-ip';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

/** Mensaje público del formulario de Contacto → lead en el CRM. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const apiRes = await fetch(`${API_URL}/content/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...clientIpHeaders(req) },
    body: JSON.stringify(body),
  });
  const data = await apiRes.json().catch(() => null);
  return NextResponse.json(data, { status: apiRes.status });
}
