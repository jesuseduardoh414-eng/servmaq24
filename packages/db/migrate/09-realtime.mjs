import pg from 'pg';
import { env } from './_env.mjs';
const c = new pg.Client({ connectionString: env.DIRECT_URL, ssl:{rejectUnauthorized:false} });
await c.connect();
const uid = `((auth.jwt() -> 'app_metadata' ->> 'app_user_id')::int)`;
const isAdmin = `((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')`;
async function policy(table, name, using) {
  await c.query(`DROP POLICY IF EXISTS ${name} ON public."${table}"`);
  await c.query(`CREATE POLICY ${name} ON public."${table}" FOR SELECT TO authenticated USING (${using})`);
}
// El usuario ve lo suyo; el admin ve todo (Realtime respeta estas políticas RLS)
await policy('orders','orders_own_select',`user_id = ${uid} OR ${isAdmin}`);
await policy('quotes','quotes_own_select',`user_id = ${uid} OR ${isAdmin}`);
await policy('notifications','notif_own_select',`user_id = ${uid} OR ${isAdmin}`);
await policy('rfqs','rfqs_admin_select',`${isAdmin}`);
// publicación realtime
const p = await c.query("select 1 from pg_publication where pubname='supabase_realtime'");
if (!p.rows.length) await c.query('CREATE PUBLICATION supabase_realtime');
for (const t of ['orders','quotes','rfqs','notifications']) {
  try { await c.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public."${t}"`); }
  catch (e) { if (!/already member|is already/i.test(e.message)) throw e; }
}
const pub = await c.query("select tablename from pg_publication_tables where pubname='supabase_realtime' order by tablename");
const pol = await c.query("select tablename, policyname from pg_policies where schemaname='public' order by tablename");
console.log('Realtime publica:', pub.rows.map(r=>r.tablename).join(', '));
console.log('Políticas RLS:', pol.rows.map(r=>`${r.tablename}.${r.policyname}`).join(', '));
await c.end();
