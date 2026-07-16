import type { OrderItem, OrderTotals } from '@maqserv/types';

/** Cart JSON de órdenes nuevas (v2). Las viejas están en bzip2 → items vacíos. */
export interface CartV2 {
  v: 2;
  items: OrderItem[];
  totals?: OrderTotals;
}

/**
 * Parsea el blob `orders.cart` (bytea). Las órdenes nuevas (v2) guardan JSON legible
 * con el desglose CONGELADO de lo que se cobró; las del Laravel viejo están en bzip2
 * ("BZh") → no legible aquí → items vacíos y `totals` null.
 *
 * Fuente ÚNICA: la usan OrdersService (cliente), el panel y las reseñas por compra.
 */
export function parseCart(cart: Uint8Array | string): { items: OrderItem[]; totals: OrderTotals | null } {
  const empty = { items: [] as OrderItem[], totals: null };
  const text = typeof cart === 'string' ? cart : Buffer.from(cart).toString('utf8');
  if (!text.trimStart().startsWith('{')) return empty;
  try {
    const parsed = JSON.parse(text) as CartV2;
    if (parsed.v !== 2 || !Array.isArray(parsed.items)) return empty;
    return { items: parsed.items, totals: parsed.totals ?? null };
  } catch {
    return empty;
  }
}

/** Atajo para quien solo necesita los productos (reseñas por compra). */
export const parseCartItems = (cart: Uint8Array | string): OrderItem[] => parseCart(cart).items;

/**
 * ¿La orden lleva equipo en renta? Decide si el flujo del envío incluye
 * "En renta → Recolectado". Solo los items de renta traen `period`.
 * Las órdenes viejas no traen items ⇒ se tratan como venta (el flujo corto).
 */
export const hasRentalItems = (items: OrderItem[]): boolean => items.some((i) => Boolean(i.period));
