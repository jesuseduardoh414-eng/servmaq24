/**
 * Formato de moneda. F1: MXN fijo — el sitio actual opera en pesos.
 * El módulo multi-moneda (tabla `currencies` legacy) se integra después;
 * cuando eso pase, la moneda vendrá del tema/settings, no de aquí.
 */
const mxn = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
});

export function formatPrice(value: number): string {
  return mxn.format(value);
}
