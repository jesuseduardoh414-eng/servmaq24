import pg from 'pg';
import { env } from './_env.mjs';
const c = new pg.Client({ connectionString: env.DIRECT_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
await c.query('TRUNCATE TABLE product_clicks RESTART IDENTITY');
const r = await c.query('select count(*)::int n from product_clicks');
console.log('product_clicks tras TRUNCATE:', r.rows[0].n, '(secuencia reiniciada)');
await c.end();
