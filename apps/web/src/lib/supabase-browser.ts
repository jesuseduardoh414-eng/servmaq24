'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/** Cliente Supabase del navegador (anon key). Sin sesión persistida: el token se inyecta en memoria. */
export function supabaseBrowser(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return _client;
}

/** Trae el access token desde el BFF (cookie httpOnly) para autenticar Realtime — solo vive en memoria. */
export async function fetchRealtimeToken(): Promise<string | null> {
  try {
    const r = await fetch('/api/realtime-token', { cache: 'no-store' });
    if (!r.ok) return null;
    const { token } = (await r.json()) as { token: string | null };
    return token;
  } catch {
    return null;
  }
}
