import pg from 'pg';
import { env } from './_env.mjs';
const API = 'http://localhost:4100';
const U = env.SUPABASE_URL, K = env.SUPABASE_SERVICE_KEY;
const email = `f3btest_${Date.now()}@example.com`, pass = 'MaqTest#2026', name = 'F3B Test';
const j = async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) });

let r = await j(await fetch(API + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password: pass }) }));
console.log('register        :', r.status, r.body.token ? `✓ token + user.id=${r.body.user?.id}` : JSON.stringify(r.body).slice(0, 150));
const token = r.body.token;

r = await j(await fetch(API + '/auth/me', { headers: { Authorization: 'Bearer ' + token } }));
console.log('me (con token)  :', r.status, r.body.email === email ? '✓ email coincide' : JSON.stringify(r.body).slice(0, 120));

r = await j(await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) }));
console.log('login           :', r.status, r.body.token ? '✓ token + refresh=' + !!r.body.refresh_token : JSON.stringify(r.body).slice(0, 120));

r = await j(await fetch(API + '/admin/auth/me', { headers: { Authorization: 'Bearer ' + token } }));
console.log('admin/me cliente:', r.status, r.status === 401 ? '✓ rechazado (correcto)' : '✗ DEBERÍA ser 401');

r = await j(await fetch(API + '/auth/me'));
console.log('me sin token    :', r.status, r.status === 401 ? '✓ 401' : '✗');

// cleanup
const pgc = new pg.Client({ connectionString: env.DIRECT_URL, ssl: { rejectUnauthorized: false } });
await pgc.connect();
const { rows } = await pgc.query('select auth_id from users where email=$1', [email]);
if (rows[0]?.auth_id) await fetch(U + '/auth/v1/admin/users/' + rows[0].auth_id, { method: 'DELETE', headers: { apikey: K, Authorization: 'Bearer ' + K } });
await pgc.query('delete from users where email=$1', [email]);
await pgc.end();
console.log('cleanup         : usuario temporal eliminado (auth + fila users).');
