/**
 * Mueve el ORIGEN DEL FLETE de `generalsettings.street` al token `contact.address`.
 *
 * Por qué: `freight.service` usa `tokens.contact.address` y solo cae a
 * `generalsettings.street` si el token está vacío. Esa columna se editaba únicamente
 * en la pantalla `/ajustes`, que se elimina por estar huérfana y superada por
 * Diseño → Contacto. Sin este paso, la dirección desde la que se cotizan los
 * traslados quedaría sin editor: solo tocando la BD a mano.
 *
 * NO pisa nada: si el token ya tiene dirección, se respeta.
 *   node migrate/13-freight-origin-to-token.mjs
 */
import pg from 'pg';
import { env } from './_env.mjs';

const c = new pg.Client({ connectionString: env.DIRECT_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

const { rows: gs } = await c.query('select street from generalsettings limit 1');
const street = gs[0]?.street?.trim() ?? '';
if (!street) {
  console.log('generalsettings.street está vacío: nada que migrar.');
  await c.end();
  process.exit(0);
}
console.log(`Origen del flete en la columna legacy: "${street}"`);

const { rows: themes } = await c.query('select id, slug, tokens, "draftTokens" from themes order by id');
for (const t of themes) {
  const current = t.tokens?.contact?.address?.trim();
  if (current) {
    console.log(`  tema ${t.id} (${t.slug}): ya tenía dirección ("${current}") — se respeta`);
    continue;
  }
  const tokens = { ...t.tokens, contact: { ...(t.tokens?.contact ?? {}), address: street } };
  // El borrador solo se toca si existe: crearlo aquí publicaría cambios sin querer.
  const draft = t.draftTokens
    ? { ...t.draftTokens, contact: { ...(t.draftTokens?.contact ?? {}), address: street } }
    : null;

  if (draft) {
    await c.query('update themes set tokens = $1, "draftTokens" = $2 where id = $3', [tokens, draft, t.id]);
  } else {
    await c.query('update themes set tokens = $1 where id = $2', [tokens, t.id]);
  }
  console.log(`  tema ${t.id} (${t.slug}): dirección migrada al token${draft ? ' (y al borrador)' : ''}`);
}

const { rows: check } = await c.query(
  `select id, slug, tokens::jsonb->'contact'->>'address' as address from themes order by id`,
);
console.table(check);
await c.end();
