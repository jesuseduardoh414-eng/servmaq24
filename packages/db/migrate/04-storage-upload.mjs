// F2 · Sube las imágenes referenciadas (image-manifest.json) al bucket de Supabase Storage.
// Requiere SUPABASE_URL + SUPABASE_SERVICE_KEY en .env.
import { createClient } from '@supabase/supabase-js';
import { env } from './_env.mjs';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

if (!env.SUPABASE_SERVICE_KEY) { console.error('Falta SUPABASE_SERVICE_KEY en .env'); process.exit(1); }
const BUCKET = 'media';
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const MIME = { jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', webp:'image/webp',
  gif:'image/gif', ico:'image/x-icon', svg:'image/svg+xml', pdf:'application/pdf' };
const mime = f => MIME[f.split('.').pop().toLowerCase()] || 'application/octet-stream';

// Supabase Storage rechaza chars fuera de este set (p.ej. em-dash —). Mismo sanitize se usa en el front.
export const sanitizeKey = k => k.split('/')
  .map(seg => seg.replace(/[^A-Za-z0-9_.\-!*'() &$@=;:+,?]/g, '_'))
  .join('/');

// asegurar bucket público
const { data: buckets } = await sb.storage.listBuckets();
if (!buckets?.some(b => b.name === BUCKET)) {
  const { error } = await sb.storage.createBucket(BUCKET, { public: true });
  if (error) { console.error('createBucket:', error.message); process.exit(1); }
  console.log('Bucket "' + BUCKET + '" creado (público).');
} else console.log('Bucket "' + BUCKET + '" ya existe.');

// lista de trabajo: manifiesto (assets/images) + apps/api/uploads
const man = JSON.parse(readFileSync(join(process.cwd(), 'migrate', 'image-manifest.json'), 'utf8'));
const jobs = man.found.map(rel => ({ abs: join(man.root, rel), dest: rel }));
const uploadsDir = 'c:/Users/jesus/Downloads/SevMarq24/servmaq-platform/apps/api/uploads';
if (existsSync(uploadsDir))
  for (const f of readdirSync(uploadsDir)) jobs.push({ abs: join(uploadsDir, f), dest: 'uploads/' + f });

let ok = 0, fail = 0;
const CONC = 8;
for (let i = 0; i < jobs.length; i += CONC) {
  await Promise.all(jobs.slice(i, i + CONC).map(async j => {
    try {
      const body = readFileSync(j.abs);
      const { error } = await sb.storage.from(BUCKET).upload(sanitizeKey(j.dest), body,
        { contentType: mime(j.dest), upsert: true });
      if (error) throw error;
      ok++;
    } catch (e) { fail++; console.log('  ✗', j.dest, '-', e.message); }
  }));
  process.stdout.write(`\r  subidos ${ok}/${jobs.length}...`);
}
console.log(`\nHecho. OK: ${ok} | fallos: ${fail}`);
console.log(`URL pública base: ${env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`);
