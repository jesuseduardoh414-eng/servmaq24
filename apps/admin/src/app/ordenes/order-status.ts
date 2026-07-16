import { FULFILLMENT, type Fulfillment, type FulfillmentTone } from '@maqserv/types';
import { D } from '@/components/design-tokens';

/**
 * Etiquetas y colores de estado. Módulo SIN 'use client' a propósito: lo usan la
 * página (servidor) para pintar la fila y `OrderControls` (cliente) para el selector.
 * Si viviera en el módulo de cliente, el servidor no podría llamar `labelOf`.
 *
 * Los TEXTOS de los estados de envío NO se definen aquí: vienen de `FULFILLMENT`
 * (@maqserv/types), que comparten API, panel y sitio. Aquí solo se les pone color.
 */
const GREEN = '#3fbf8f';
const RED = '#f55';
const BLUE = '#5b9dff';

export interface StatusStyle {
  label: string;
  color: string;
}

/** Estado del PAGO: valores crudos del legacy y de MercadoPago. */
export const PAY_STATUS: Record<string, StatusStyle> = {
  pending: { label: 'Pendiente de pago', color: D.amber },
  completed: { label: 'Pagado', color: GREEN },
  approved: { label: 'Pagado', color: GREEN },
  rejected: { label: 'Rechazado', color: RED },
  declined: { label: 'Rechazado', color: RED },
};

/** Normaliza a minúsculas: la BD mezcla "Pending" y "pending". */
export const labelOf = (map: Record<string, StatusStyle>, raw: string): StatusStyle =>
  map[(raw ?? '').trim().toLowerCase()] ?? { label: raw || '—', color: D.muted2 };

const TONE_COLOR: Record<FulfillmentTone, string> = { warn: D.amber, info: BLUE, ok: GREEN, bad: RED };

/** Color del estado del envío, derivado del `tone` que ya declara el paso. */
export const stateColor = (s: Fulfillment): string => TONE_COLOR[FULFILLMENT[s].tone];
