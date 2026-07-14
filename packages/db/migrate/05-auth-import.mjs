// F3a · Importa users + admins a Supabase auth.users con su hash bcrypt y app_metadata.
// Idempotente: salta filas que ya tengan auth_id.
import pg from 'pg';
import { env } from './_env.mjs';

const U = env.SUPABASE_URL, K = env.SUPABASE_SERVICE_KEY;
const pgc = new pg.Client({ connectionString: env.DIRECT_URL, ssl: { rejectUnauthorized: false } });
await pgc.connect();

const H = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };
const toBcrypt2a = (h) => h.replace(/^\$2y\$/, '$2a$');

async function createAuthUser(email, passwordHash, appMeta) {
  const r = await fetch(U + '/auth/v1/admin/users', {
    method: 'POST', headers: H,
    body: JSON.stringify({ email, password_hash: toBcrypt2a(passwordHash), email_confirm: true, app_metadata: appMeta }),
  });
  const body = await r.json().catch(() => ({}));
  if (r.ok) return { id: body.id };
  // ya existe: buscarlo por email para recuperar su id
  if (r.status === 422 || r.status === 409 || /already/i.test(body?.msg || body?.error_description || body?.message || '')) {
    const q = await fetch(U + `/auth/v1/admin/users?filter=${encodeURIComponent(email)}`, { headers: H });
    const list = await q.json().catch(() => ({}));
    const found = (list.users || []).find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (found) return { id: found.id, existed: true };
  }
  return { error: body?.msg || body?.error_description || body?.message || `HTTP ${r.status}` };
}

async function importTable(table, roleMeta) {
  const { rows } = await pgc.query(
    `select id, email, password from "${table}" where password is not null and email is not null and auth_id is null order by id`);
  let ok = 0, existed = 0, fail = 0;
  for (const u of rows) {
    const meta = { provider_role: roleMeta.role, [roleMeta.idKey]: u.id, role: roleMeta.role };
    const res = await createAuthUser(u.email.trim().toLowerCase(), u.password, meta);
    if (res.error) { fail++; console.log(`  ✗ ${table} #${u.id} ${u.email} -> ${res.error}`); continue; }
    await pgc.query(`update "${table}" set auth_id=$1 where id=$2`, [res.id, u.id]);
    if (res.existed) existed++; else ok++;
  }
  console.log(`${table}: creados ${ok} | ya existían ${existed} | fallos ${fail} | (total procesados ${rows.length})`);
}

console.log('== Importando a Supabase Auth ==');
await importTable('users', { role: 'customer', idKey: 'app_user_id' });
await importTable('admins', { role: 'admin', idKey: 'app_admin_id' });

// resumen
const t = await pgc.query(`select
  (select count(*) from users where auth_id is not null) u,
  (select count(*) from admins where auth_id is not null) a`);
console.log(`\nEnlazados: users con auth_id=${t.rows[0].u}, admins con auth_id=${t.rows[0].a}`);
await pgc.end();
