import type { OrderItem } from '@maqserv/types';

/**
 * Parsea el blob `orders.cart` (bytea). Las órdenes nuevas (v2) guardan JSON
 * legible; las del Laravel viejo están en bzip2 ("BZh") → no legible aquí →
 * items vacíos. Mismo criterio que OrdersService.parseCart.
 */
export function parseCartItems(cart: Uint8Array | string): OrderItem[] {
  const text = typeof cart === 'string' ? cart : Buffer.from(cart).toString('utf8');
  if (!text.trimStart().startsWith('{')) return [];
  try {
    const parsed = JSON.parse(text) as { v?: number; items?: OrderItem[] };
    return parsed.v === 2 && Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}
