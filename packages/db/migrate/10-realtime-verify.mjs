// Verifica Realtime end-to-end: usuario se suscribe a SU pedido, un UPDATE dispara el evento (respetando RLS).
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { env } from './_env.mjs';

const U = env.SUPABASE_URL, K = env.SUPABASE_SERVICE_KEY, A = env.SUPABASE_ANON_KEY;
const H = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };
const pgc = new pg.Client({ connectionString: env.DIRECT_URL, ssl: { rejectUnauthorized: false } });
await pgc.connect();
const email = `rtverify_${Date.now()}@example.com`, pass = 'MaqTest#2026';

const uid = (await pgc.query(`insert into users(name,email,created_at,updated_at) values('RT Verify',$1,now(),now()) returning id`, [email])).rows[0].id;
const authUser = await fetch(U + '/auth/v1/admin/users', { method: 'POST', headers: H, body: JSON.stringify({ email, password: pass, email_confirm: true, app_metadata: { role: 'customer', app_user_id: uid } }) }).then(r => r.json());
await pgc.query('update users set auth_id=$1 where id=$2', [authUser.id, uid]);
const onum = 'RT' + Date.now();
await pgc.query(`insert into orders(user_id,cart,"totalQty",pay_amount,order_number,payment_status,status,created_at,updated_at) values($1,$2,'1',100,$3,'Pending','pending',now(),now())`, [uid, Buffer.from('{"v":2,"items":[]}'), onum]);
const tok = await fetch(U + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: A, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) }).then(r => r.json());

const sb = createClient(U, A, { auth: { persistSession: false } });
sb.realtime.setAuth(tok.access_token);
let got = null;
const ok = await new Promise((resolve) => {
  sb.channel('rtv').on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'orders', filter: `order_number=eq.${onum}` },
    (p) => { got = p.new; resolve(true); })
    .subscribe(async (s) => {
      if (s === 'SUBSCRIBED') { await new Promise(r => setTimeout(r, 600)); await pgc.query(`update orders set payment_status='Paid' where order_number=$1`, [onum]); }
    });
  setTimeout(() => resolve(false), 12000);
});
console.log(ok ? `✓ Realtime ENTREGÓ el UPDATE (RLS ok): payment_status=${got?.payment_status}` : '✗ no llegó evento en 12s');

await sb.removeAllChannels();
await pgc.query('delete from orders where order_number=$1', [onum]);
await fetch(U + '/auth/v1/admin/users/' + authUser.id, { method: 'DELETE', headers: H });
await pgc.query('delete from users where id=$1', [uid]);
await pgc.end();
process.exit(0);
