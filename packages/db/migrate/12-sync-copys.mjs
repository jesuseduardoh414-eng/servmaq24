/**
 * Sincroniza los copys NUEVOS del código hacia los temas guardados en BD.
 *
 * Por qué hace falta: cada tema se sella con los copys que existían el día que se
 * publicó. Un copy agregado después no está en la fila, así que el editor del panel
 * (`/temas/[id]`, que lista `Object.keys(copys.es)`) no lo muestra y no se puede
 * editar. El sitio ya no pinta la clave cruda —`t()` cae al default— pero para que el
 * texto sea EDITABLE tiene que existir en la fila.
 *
 * NO pisa nada: solo agrega las claves faltantes. Los textos personalizados se quedan.
 * Idempotente.
 *   node migrate/12-sync-copys.mjs
 */
import pg from 'pg';
import { defaultTheme } from '@maqserv/config';
import { env } from './_env.mjs';

const c = new pg.Client({ connectionString: env.DIRECT_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

/** Agrega a `current` las claves de `defaults` que falten, por idioma. */
function merge(current, defaults) {
  const out = { ...(current ?? {}) };
  let added = 0;
  for (const [locale, entries] of Object.entries(defaults)) {
    const have = { ...(out[locale] ?? {}) };
    for (const [k, v] of Object.entries(entries)) {
      if (!(k in have)) {
        have[k] = v;
        added++;
      }
    }
    out[locale] = have;
  }
  return { out, added };
}

const { rows } = await c.query('select id, slug, copys, "draftCopys" from themes order by id');
for (const row of rows) {
  const pub = merge(row.copys, defaultTheme.copys);
  // El borrador solo se toca si existe: crearlo aquí publicaría cambios sin querer.
  const draft = row.draftCopys ? merge(row.draftCopys, defaultTheme.copys) : null;

  if (pub.added === 0 && (!draft || draft.added === 0)) {
    console.log(`  tema ${row.id} (${row.slug}): ya estaba al día`);
    continue;
  }
  if (draft) {
    await c.query('update themes set copys = $1, "draftCopys" = $2 where id = $3', [pub.out, draft.out, row.id]);
  } else {
    await c.query('update themes set copys = $1 where id = $2', [pub.out, row.id]);
  }
  console.log(`  tema ${row.id} (${row.slug}): +${pub.added} copys${draft ? ` (+${draft.added} en borrador)` : ''}`);
}

const { rows: check } = await c.query(
  `select id, slug, (select count(*)::int from jsonb_object_keys(copys::jsonb->'es')) as copys_es from themes order by id`,
);
console.table(check);
await c.end();
