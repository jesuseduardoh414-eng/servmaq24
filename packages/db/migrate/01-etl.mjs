// ETL MariaDB (maqserv_dev) -> Supabase Postgres. Schema-driven desde el destino.
import pg from 'pg';
import mysql from 'mysql2/promise';
import { env } from './_env.mjs';

const pgc = new pg.Client({ connectionString: env.DIRECT_URL, ssl: { rejectUnauthorized: false } });
await pgc.connect();
const my = await mysql.createConnection({
  uri: env.MYSQL_SOURCE_URL,
  dateStrings: true, supportBigNumbers: true, bigNumberStrings: true,
});

// ---- metadata del destino (Postgres) ----
const tcols = await pgc.query(
  `select table_name, column_name, udt_name, is_nullable, ordinal_position
   from information_schema.columns where table_schema='public'
   order by table_name, ordinal_position`);
const targets = new Map();
for (const r of tcols.rows) {
  if (!targets.has(r.table_name)) targets.set(r.table_name, []);
  targets.get(r.table_name).push({ name: r.column_name, udt: r.udt_name, nullable: r.is_nullable === 'YES' });
}

const srcColsCache = new Map();
async function sourceCols(t) {
  if (srcColsCache.has(t)) return srcColsCache.get(t);
  const [rows] = await my.query(
    'select column_name from information_schema.columns where table_schema=database() and table_name=?', [t]);
  const set = new Set(rows.map(r => r.COLUMN_NAME ?? r.column_name));
  srcColsCache.set(t, set); return set;
}
async function sourceExists(t) {
  const [rows] = await my.query(
    'select count(*) c from information_schema.tables where table_schema=database() and table_name=?', [t]);
  return Number(rows[0].c) > 0;
}

function coerce(val, col) {
  if (val === null || val === undefined) return col.nullable ? null : val;
  const t = col.udt;
  if (t === 'timestamp' || t === 'timestamptz' || t === 'date') {
    const s = String(val);
    if (s.startsWith('0000')) return col.nullable ? null : '1970-01-01 00:00:00';
    return s;
  }
  if (t === 'bool') {
    if (val === 1 || val === '1' || val === true) return true;
    if (val === 0 || val === '0' || val === false) return false;
    return Boolean(Number(val));
  }
  if (t === 'bytea') return Buffer.isBuffer(val) ? val : Buffer.from(String(val), 'binary');
  if (t === 'json' || t === 'jsonb') return typeof val === 'string' ? val : JSON.stringify(val);
  return val; // int*, numeric, real/float, text, varchar, char, enums
}

async function insertRows(table, cols, rows) {
  const colList = cols.map(c => '"' + c.name + '"').join(',');
  const BATCH = 800;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const params = [];
    const tuples = chunk.map(row => {
      const ph = cols.map(c => { params.push(coerce(row[c.name], c)); return '$' + params.length; });
      return '(' + ph.join(',') + ')';
    });
    await pgc.query(`INSERT INTO "${table}" (${colList}) VALUES ${tuples.join(',')}`, params);
  }
}

// orden de carga: padres antes que hijos (unica FK: home_question_images -> home_questions)
let tableList = [...targets.keys()].filter(t => t !== 'home_question_images').sort();
tableList.push('home_question_images');

const summary = [];
for (const table of tableList) {
  try {
    if (!(await sourceExists(table))) { summary.push([table, 'sin tabla origen', 0]); continue; }

    if (table === 'product_clicks') {
      const [rows] = await my.query(
        'select product_id, `date` as date, count(*) as clicks from product_clicks where `date` is not null group by product_id, `date`');
      const cols = [
        { name: 'product_id', udt: 'int4', nullable: false },
        { name: 'date', udt: 'date', nullable: false },
        { name: 'clicks', udt: 'int4', nullable: false },
      ];
      await insertRows('product_clicks', cols, rows);
      summary.push(['product_clicks', 'AGREGADO', rows.length]); continue;
    }

    const srcCols = await sourceCols(table);
    const cols = targets.get(table).filter(c => srcCols.has(c.name));
    if (!cols.length) { summary.push([table, 'sin columnas en comun', 0]); continue; }

    const selectExprs = cols.map(c =>
      (table === 'orders' && c.name === 'cart') ? 'CAST(`cart` AS BINARY) AS `cart`' : '`' + c.name + '`');
    const [rows] = await my.query('select ' + selectExprs.join(',') + ' from `' + table + '`');
    if (rows.length) await insertRows(table, cols, rows);
    summary.push([table, 'ok', rows.length]);
  } catch (e) {
    summary.push([table, 'ERROR: ' + e.message.slice(0, 90), -1]);
  }
}

// ---- reset de secuencias (autoincrement) ----
for (const table of tableList) {
  if (!targets.get(table).some(c => c.name === 'id')) continue;
  try {
    await pgc.query(
      `SELECT setval(pg_get_serial_sequence('"${table}"','id'),
         GREATEST((SELECT COALESCE(MAX(id),0) FROM "${table}"),1))`);
  } catch { /* columna id sin secuencia */ }
}

// ---- reporte ----
console.log('\n=== RESUMEN ETL ===');
let ok = 0, err = 0, totalRows = 0;
for (const [t, st, n] of summary) {
  if (st.startsWith('ERROR')) { err++; console.log(`  ✗ ${t.padEnd(34)} ${st}`); }
  else { ok++; if (n > 0) totalRows += n; if (n > 0 || st !== 'ok') console.log(`  ✓ ${t.padEnd(34)} ${String(n).padStart(8)}  ${st === 'ok' ? '' : st}`); }
}
console.log(`\nTablas ok: ${ok} | con error: ${err} | filas insertadas: ${totalRows}`);
await my.end(); await pgc.end();
