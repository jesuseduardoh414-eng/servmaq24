// Construye el manifiesto de imágenes REFERENCIADAS por la BD (para subir solo esas a Storage).
// Solo lee MySQL + disco. No necesita llaves de Supabase.
import mysql from 'mysql2/promise';
import { env } from './_env.mjs';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';

const IMG_ROOT = 'c:/Users/jesus/Downloads/SevMarq24/ecommerce/public/assets/images';
const IMG_RE = /\.(jpe?g|png|webp|gif|ico|svg)$/i;

// index disco: basename -> ruta relativa (primera coincidencia); y set de rutas relativas
const byBase = new Map();
const relSet = new Set();
(function walk(dir, rel = '') {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const r = rel ? rel + '/' + name : name;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, r);
    else { relSet.add(r); if (!byBase.has(name)) byBase.set(name, r); }
  }
})(IMG_ROOT);
console.log('Archivos en disco:', relSet.size);

const my = await mysql.createConnection({ uri: env.MYSQL_SOURCE_URL });
const [tables] = await my.query(
  "select table_name from information_schema.tables where table_schema=database() and table_type='BASE TABLE'");

const referenced = new Set();
for (const row of tables) {
  const tb = row.TABLE_NAME ?? row.table_name;
  if (tb === 'product_clicks') continue;
  const [cols] = await my.query(
    "select column_name from information_schema.columns where table_schema=database() and table_name=? and data_type in ('varchar','text','char','longtext','mediumtext','tinytext')", [tb]);
  if (!cols.length) continue;
  const [rows] = await my.query('select * from `' + tb + '`');
  for (const r of rows) for (const c of cols) {
    const v = r[c.COLUMN_NAME ?? c.column_name];
    if (typeof v === 'string' && IMG_RE.test(v.trim())) referenced.add(v.trim());
  }
}
await my.end();

// resolver referencias contra disco
const found = [], missing = [];
let bytes = 0;
for (const ref of referenced) {
  const clean = ref.replace(/^\/?(public\/)?(assets\/images\/)?/i, '');
  let rel = null;
  if (relSet.has(clean)) rel = clean;
  else if (byBase.has(basename(clean))) rel = byBase.get(basename(clean));
  if (rel) { const sz = statSync(join(IMG_ROOT, rel)).size; bytes += sz; found.push(rel); }
  else missing.push(ref);
}

writeFileSync(join(process.cwd(), 'migrate', 'image-manifest.json'),
  JSON.stringify({ root: IMG_ROOT, found: [...new Set(found)], missing }, null, 2));

console.log('Referencias de imagen en la BD:', referenced.size);
console.log('  -> encontradas en disco :', new Set(found).size, `(${(bytes/1024/1024).toFixed(1)} MB)`);
console.log('  -> NO encontradas       :', missing.length);
if (missing.length) console.log('     faltantes (muestra):', missing.slice(0, 10));
console.log('Manifiesto escrito en migrate/image-manifest.json');
