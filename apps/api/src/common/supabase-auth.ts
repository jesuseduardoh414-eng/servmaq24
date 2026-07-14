import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { supabase } from './supabase';

const base = () => process.env.SUPABASE_URL ?? '';
const anon = () => process.env.SUPABASE_ANON_KEY ?? '';

export interface SupabaseClaims extends JWTPayload {
  app_metadata?: { role?: string; app_user_id?: number; app_admin_id?: number };
}

let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
/** Verifica un access token de Supabase contra el JWKS público (ES256). */
export async function verifySupabaseToken(token: string): Promise<SupabaseClaims> {
  if (!_jwks) _jwks = createRemoteJWKSet(new URL(base() + '/auth/v1/.well-known/jwks.json'));
  const { payload } = await jwtVerify(token, _jwks);
  return payload as SupabaseClaims;
}

export interface Grant {
  access_token?: string;
  refresh_token?: string;
  user?: { id: string; app_metadata?: SupabaseClaims['app_metadata'] };
  error?: string;
}

async function tokenGrant(qs: string, bodyObj: Record<string, string>): Promise<Grant> {
  const r = await fetch(base() + '/auth/v1/token?' + qs, {
    method: 'POST',
    headers: { apikey: anon(), 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyObj),
  });
  const b = await r.json().catch(() => ({}));
  return r.ok ? (b as Grant) : { error: b.error_description || b.msg || b.message || `HTTP ${r.status}` };
}

export const passwordGrant = (email: string, password: string) =>
  tokenGrant('grant_type=password', { email, password });

export const refreshGrant = (refresh_token: string) =>
  tokenGrant('grant_type=refresh_token', { refresh_token });

/** Crea un usuario en auth.users (service_role) con password y metadata; email ya confirmado. */
export async function adminCreateUser(email: string, password: string, app_metadata: Record<string, unknown>) {
  const { data, error } = await supabase().auth.admin.createUser({ email, password, email_confirm: true, app_metadata });
  if (error || !data.user) throw new Error(error?.message ?? 'No se pudo crear el usuario');
  return data.user;
}

/** Actualiza app_metadata de un usuario (aparece en el JWT del siguiente login). */
export async function adminSetMetadata(id: string, app_metadata: Record<string, unknown>) {
  const { error } = await supabase().auth.admin.updateUserById(id, { app_metadata });
  if (error) throw new Error(error.message);
}
