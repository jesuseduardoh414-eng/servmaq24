/**
 * Retira del tema las secciones `home.banners` y `home.success-cases`.
 *
 * Por qué: sus editores se eliminaron (Banners era legacy y ya se había quitado del
 * menú; Casos de éxito lo descartó el cliente). Dejarlas en la lista de secciones
 * significaría que alguien puede ENCENDERLAS desde Temas y quedarse con una sección
 * que nadie puede editar — el mismo agujero que tenía /contenido.
 *
 * El sitio ya las ignoraría (no hay componente registrado), pero seguirían saliendo
 * en la lista de secciones del editor de temas.
 *
 * NO borra las tablas `banners` ni `portfolios`: son datos del sistema viejo y
 * tirarlos no se puede deshacer. Quedan ahí, sin usarse.
 *   node migrate/14-retire-sections.mjs
 */
import pg from 'pg';
import { env } from './_env.mjs';

const RETIRADAS = ['home.banners', 'home.success-cases'];
/** Copys que se quedaban huérfanos: nada los pinta, pero salían en el editor de temas. */
const COPYS_MUERTOS = ['home.successCases.title'];

const c = new pg.Client({ connectionString: env.DIRECT_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

const quitar = (tokens) => {
  if (!tokens?.sections) return { out: tokens, n: 0 };
  const before = tokens.sections.length;
  const sections = tokens.sections.filter((s) => !RETIRADAS.includes(s.key));
  return { out: { ...tokens, sections }, n: before - sections.length };
};

/** Quita los copys muertos de todos los idiomas. */
const limpiarCopys = (copys) => {
  if (!copys) return { out: copys, n: 0 };
  let n = 0;
  const out = {};
  for (const [locale, entries] of Object.entries(copys)) {
    const kept = { ...entries };
    for (const k of COPYS_MUERTOS) if (k in kept) { delete kept[k]; n++; }
    out[locale] = kept;
  }
  return { out, n };
};

const { rows } = await c.query('select id, slug, tokens, "draftTokens", copys, "draftCopys" from themes order by id');
for (const t of rows) {
  const pub = quitar(t.tokens);
  const draft = t.draftTokens ? quitar(t.draftTokens) : null;
  const cp = limpiarCopys(t.copys);
  const cpDraft = t.draftCopys ? limpiarCopys(t.draftCopys) : null;

  if (pub.n === 0 && cp.n === 0 && (!draft || draft.n === 0) && (!cpDraft || cpDraft.n === 0)) {
    console.log(`  tema ${t.id} (${t.slug}): ya estaba al día`);
    continue;
  }
  await c.query('update themes set tokens = $1, copys = $2 where id = $3', [pub.out, cp.out, t.id]);
  if (draft || cpDraft) {
    await c.query('update themes set "draftTokens" = $1, "draftCopys" = $2 where id = $3', [
      draft ? draft.out : t.draftTokens,
      cpDraft ? cpDraft.out : t.draftCopys,
      t.id,
    ]);
  }
  console.log(`  tema ${t.id} (${t.slug}): -${pub.n} secciones, -${cp.n} copys muertos${draft ? ' (borrador incluido)' : ''}`);
}

const { rows: check } = await c.query(
  `select id, slug, (select string_agg(s->>'key', ' · ' order by (s->>'order')::int)
     from jsonb_array_elements(tokens::jsonb->'sections') s) as secciones
   from themes order by id`,
);
for (const r of check) console.log(`\ntema ${r.id} (${r.slug}):\n  ${r.secciones}`);
await c.end();
