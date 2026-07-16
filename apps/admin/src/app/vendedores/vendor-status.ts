import { VENDOR_STATES, toVendorState, type VendorState } from '@maqserv/types';
import { D } from '@/components/design-tokens';

/**
 * Colores del estado del vendedor. Módulo SIN 'use client' a propósito: lo usan la
 * página (servidor) y `VendorActions` (cliente). Los TEXTOS no se definen aquí —
 * vienen de `VENDOR_STATES` (@maqserv/types), que comparten API, panel y sitio.
 */
const GREEN = '#3fbf8f';
const RED = '#f55';

const TONE_COLOR: Record<'warn' | 'ok' | 'bad', string> = { warn: D.amber, ok: GREEN, bad: RED };

export const vendorColor = (s: VendorState): string => TONE_COLOR[VENDOR_STATES[s].tone];

/** `is_vendor` (0|1|2) → etiqueta + color, de una sola pasada. */
export function vendorStatus(isVendor: number): { state: VendorState; label: string; hint: string; color: string } {
  const state = toVendorState(isVendor);
  const info = VENDOR_STATES[state];
  return { state, label: info.label, hint: info.hint, color: vendorColor(state) };
}
