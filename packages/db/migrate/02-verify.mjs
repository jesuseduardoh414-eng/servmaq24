// Verificacion de fidelidad: cuenta filas MySQL vs Postgres por tabla.
import pg from 'pg';
import mysql from 'mysql2/promise';
import { env } from './_env.mjs';

const pgc = new pg.Client({ connectionString: env.DIRECT_URL, ssl: { rejectUnauthorized: false } });
await pgc.connect();
const my = await mysql.createConnection({ uri: env.MYSQL_SOURCE_URL });

const t = await pgc.query(
  `select table_name from information_schema.tables where table_schema='public' order by table_name`);

let mismatches = 0, checked = 0;
console.log('=== VERIFICACION conteos MySQL vs Postgres ===');
for (const { table_name: tb } of t.rows) {
  const [ex] = await my.query(
    'select count(*) c from information_schema.tables where table_schema=database() and table_name=?', [tb]);
  if (!Number(ex[0].c)) continue;
  const [[mrow]] = [await my.query('select count(*) c from `' + tb + '`')];
  const myCount = Number(mrow[0].c);
  const pgCount = Number((await pgc.query(`select count(*)::bigint c from "${tb}"`)).rows[0].c);
  checked++;
  if (tb === 'product_clicks') {
    console.log(`  ~ ${tb.padEnd(30)} MySQL ${String(myCount).padStart(9)}  ->  PG ${String(pgCount).padStart(9)}  (AGREGADO, no debe cuadrar)`);
    continue;
  }
  const ok = myCount === pgCount;
  if (!ok) mismatches++;
  if (!ok) console.log(`  ✗ ${tb.padEnd(30)} MySQL ${String(myCount).padStart(9)}  !=  PG ${String(pgCount).padStart(9)}`);
}

// sanity check del blob bzip2 en orders.cart
const cart = await pgc.query(`select id, substring(cart from 1 for 3) as magic from orders where cart is not null limit 1`);
if (cart.rows.length) {
  const hex = cart.rows[0].magic.toString('hex').toUpperCase();
  console.log(`\norders.cart[0] primeros 3 bytes: ${hex}  ${hex === '425A68' ? '✓ es bzip2 (BZh)' : '✗ NO es bzip2'}`);
}

console.log(`\nTablas verificadas: ${checked} | discrepancias (excluyendo product_clicks): ${mismatches}`);
await my.end(); await pgc.end();
