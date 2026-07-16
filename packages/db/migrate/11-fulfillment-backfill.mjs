/**
 * Backfill del MÓDULO DE ENVÍOS.
 *
 * Las órdenes anteriores al módulo no tienen `fulfillment`. Se deriva del `status`
 * legacy + el estado del pago, para que caigan en el flujo nuevo sin inventarles
 * un envío que nunca se registró.
 *
 * Idempotente: solo toca filas con `fulfillment IS NULL`.
 *   node migrate/11-fulfillment-backfill.mjs
 */
import pg from 'pg';
import { env } from './_env.mjs';

const { Client } = pg;
const c = new Client({ connectionString: env.DIRECT_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

// El enum orders_status NO se tocó: se lee, no se modifica.
const { rows: enumVals } = await c.query(
  `select e.enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid
   where t.typname = 'orders_status' order by e.enumsortorder`,
);
console.log('enum orders_status intacto:', enumVals.map((r) => r.enumlabel).join(', '));

const PAID = `lower(coalesce(payment_status,'')) in ('approved','completed','paid')`;

// pending + pagado → 'pagado'; pending sin pagar → 'pendiente';
// processing → 'preparando'; completed (2021, ya terminadas) → 'cerrado';
// declined → 'cancelado'.
const { rowCount } = await c.query(`
  update orders set fulfillment = case
    when status = 'declined'   then 'cancelado'
    when status = 'completed'  then 'cerrado'
    when status = 'processing' then 'preparando'
    when ${PAID}               then 'pagado'
    else 'pendiente'
  end
  where fulfillment is null
`);
console.log(`Órdenes actualizadas: ${rowCount}`);

const { rows } = await c.query(
  `select coalesce(fulfillment,'(sin envío)') as f, status, count(*)::int as n
   from orders group by 1, 2 order by 3 desc`,
);
console.table(rows);

const { rows: left } = await c.query('select count(*)::int as n from orders where fulfillment is null');
console.log(`Sin fulfillment: ${left[0].n} (debe ser 0)`);

await c.end();
