/**
 * Unifica las DOS listas de marcas en el token `brands`.
 *
 * El problema: el home leía el copy `home.brands.list` ("CAT, Komatsu, Volvo CE, JCB,
 * Yale, Bobcat" — editado a mano) y /quienes-somos el token `quienesSomos.brands`
 * (que seguía con los defaults: "…KUBOTA…VOLVO…"). El sitio decía marcas distintas
 * según la página.
 *
 * Gana la lista del COPY: es la que el visitante ve en el inicio y la única que
 * alguien se molestó en editar (la del token era literalmente el default).
 *
 * Deja limpio: mueve también los encabezados y borra los copys que ya no lee nadie.
 * Idempotente.
 *   node migrate/15-unify-brands.mjs
 */
import pg from 'pg';
import { env } from './_env.mjs';

const COPYS_MUERTOS = ['home.brands.title', 'home.brands.list'];

const c = new pg.Client({ connectionString: env.DIRECT_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

const { rows } = await c.query('select id, slug, tokens, "draftTokens", copys, "draftCopys" from themes order by id');

for (const t of rows) {
  if (t.tokens?.brands?.list?.length) {
    console.log(`  tema ${t.id} (${t.slug}): ya tiene el token brands — se respeta`);
    continue;
  }
  const es = t.copys?.es ?? {};
  const desdeCopy = (es['home.brands.list'] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const desdeToken = t.tokens?.quienesSomos?.brands ?? [];
  const list = desdeCopy.length ? desdeCopy : desdeToken;

  console.log(`\n  tema ${t.id} (${t.slug})`);
  console.log(`    home  (copy) : ${desdeCopy.join(', ') || '(vacío)'}`);
  console.log(`    quiénes (tok): ${desdeToken.join(', ') || '(vacío)'}`);
  console.log(`    → unificada  : ${list.join(', ')}`);

  const brands = {
    title: es['home.brands.title'] || 'Marcas con las que trabajamos',
    eyebrow: t.tokens?.quienesSomos?.brandsEyebrow || 'Trabajamos con las marcas líderes de la industria',
    list,
  };

  /** Pone el token `brands` y quita las marcas de `quienesSomos` (ya duplicadas). */
  const migrarTokens = (tk) => {
    if (!tk) return null;
    const qs = { ...(tk.quienesSomos ?? {}) };
    delete qs.brands;
    delete qs.brandsEyebrow;
    return { ...tk, brands, quienesSomos: qs };
  };
  /** Quita los copys que ya nadie lee. */
  const limpiar = (cp) => {
    if (!cp) return null;
    const out = {};
    for (const [locale, entries] of Object.entries(cp)) {
      const kept = { ...entries };
      for (const k of COPYS_MUERTOS) delete kept[k];
      out[locale] = kept;
    }
    return out;
  };

  await c.query('update themes set tokens = $1, copys = $2 where id = $3', [
    migrarTokens(t.tokens), limpiar(t.copys), t.id,
  ]);
  // El borrador solo se toca si existe: crearlo aquí publicaría cambios sin querer.
  if (t.draftTokens || t.draftCopys) {
    await c.query('update themes set "draftTokens" = $1, "draftCopys" = $2 where id = $3', [
      migrarTokens(t.draftTokens), limpiar(t.draftCopys), t.id,
    ]);
    console.log('    (borrador migrado también)');
  }
}

const { rows: check } = await c.query(
  `select id, slug,
     tokens::jsonb->'brands'->>'list' as marcas,
     tokens::jsonb->'quienesSomos'->'brands' as duplicado_qs,
     copys::jsonb->'es'->>'home.brands.list' as copy_viejo
   from themes order by id`,
);
console.log();
console.table(check);
await c.end();
