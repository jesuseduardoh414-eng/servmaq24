// Verifica el camino de login completo con un usuario DESECHABLE:
// hash bcrypt $2y (como el legacy) -> import -> password grant -> JWT con app_metadata -> verificado por JWKS ES256.
import bcrypt from 'bcryptjs';
import { createRemoteJWKSet, jwtVerify, decodeJwt } from 'jose';
import { env } from './_env.mjs';

const U = env.SUPABASE_URL, K = env.SUPABASE_SERVICE_KEY, A = env.SUPABASE_ANON_KEY;
const H = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };
const EMAIL = `maqverify_${Date.now()}@example.com`;
const PASS = 'MaqTest#2026';

// 1) hash bcrypt y lo forzamos a prefijo $2y$ (simula Laravel)
const legacyHash = bcrypt.hashSync(PASS, 10).replace(/^\$2[ab]\$/, '$2y$');
console.log('hash legacy simulado:', legacyHash.slice(0, 7) + '...');

// 2) crear usuario vía admin API con password_hash (el flujo rewritea $2y->$2a)
const created = await fetch(U + '/auth/v1/admin/users', {
  method: 'POST', headers: H,
  body: JSON.stringify({ email: EMAIL, password_hash: legacyHash.replace(/^\$2y\$/, '$2a$'),
    email_confirm: true, app_metadata: { role: 'customer', app_user_id: 999999 } }),
}).then(r => r.json());
console.log('usuario creado:', created.id);

// 3) login por password grant (como lo haría el front con supabase-js)
const tok = await fetch(U + '/auth/v1/token?grant_type=password', {
  method: 'POST', headers: { apikey: A, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASS }),
}).then(r => r.json());

if (!tok.access_token) { console.log('✗ LOGIN FALLÓ:', JSON.stringify(tok).slice(0, 200)); }
else {
  console.log('✓ login OK, access_token recibido');
  const claims = decodeJwt(tok.access_token);
  console.log('  app_metadata en el JWT:', JSON.stringify(claims.app_metadata));
  console.log('  sub (uuid):', claims.sub, '| role claim:', claims.role);
  // 4) verificar firma contra JWKS (ES256), como hará NestJS
  const JWKS = createRemoteJWKSet(new URL(U + '/auth/v1/.well-known/jwks.json'));
  const { payload } = await jwtVerify(tok.access_token, JWKS);
  console.log('✓ firma verificada por JWKS. app_user_id =', payload.app_metadata?.app_user_id);
}

// 5) limpiar: borrar el usuario de prueba
await fetch(U + '/auth/v1/admin/users/' + created.id, { method: 'DELETE', headers: H });
console.log('usuario de prueba eliminado.');
