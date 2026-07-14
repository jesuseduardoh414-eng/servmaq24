import pg from 'pg';
import { env } from './_env.mjs';
const c = new pg.Client({ connectionString: env.DIRECT_URL, ssl:{rejectUnauthorized:false} });
await c.connect();
const { rows } = await c.query("select tablename from pg_tables where schemaname='public'");
for (const { tablename } of rows) await c.query(`ALTER TABLE public."${tablename}" ENABLE ROW LEVEL SECURITY`);
console.log(`RLS habilitado en ${rows.length} tablas (deny-by-default).`);
await c.end();
