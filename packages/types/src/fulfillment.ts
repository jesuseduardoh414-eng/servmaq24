/**
 * Máquina de estados del ENVÍO (módulo de envíos).
 *
 * Vive aquí porque la comparten los tres lados —API, panel y sitio público—: si cada
 * uno tuviera su propia tabla de estados, se desincronizarían al primer cambio.
 *
 * Contexto: el módulo de Órdenes solo registraba un estado, no gestionaba el envío.
 * Mover el selector a "En proceso" no decía cómo ni cuándo salió el equipo.
 */

/**
 * Flujo acordado con el cliente: `Pagado → Preparando → Enviado → Entregado → Cerrado`,
 * y las órdenes con equipo en renta insertan `En renta → Recolectado` antes de Cerrado.
 *
 * `pendiente` es el paso 0 (no estaba en el acuerdo pero es obligado: una orden con
 * transferencia bancaria nace SIN pagar, y el flujo arranca en "Pagado").
 */
export type Fulfillment =
  | 'pendiente'
  | 'pagado'
  | 'preparando'
  | 'enviado'
  | 'entregado'
  | 'en_renta'
  | 'recolectado'
  | 'cerrado'
  | 'cancelado';

/** Cómo sale el equipo. Los tres los eligió el cliente. */
export type ShipMethod = 'paqueteria' | 'traslado' | 'sucursal';

export type FulfillmentTone = 'warn' | 'info' | 'ok' | 'bad';

export interface FulfillmentStep {
  key: Fulfillment;
  /** Etiqueta corta: badges y selector del panel. */
  label: string;
  /** Qué significa PARA EL CLIENTE: rastreo, detalle del pedido y cuerpo del aviso. */
  hint: string;
  tone: FulfillmentTone;
}

export const FULFILLMENT: Record<Fulfillment, FulfillmentStep> = {
  pendiente: {
    key: 'pendiente',
    label: 'Pendiente de pago',
    hint: 'Estamos esperando la confirmación de tu pago para preparar el pedido.',
    tone: 'warn',
  },
  pagado: {
    key: 'pagado',
    label: 'Pagado',
    hint: 'Recibimos tu pago. Enseguida preparamos tu pedido.',
    tone: 'info',
  },
  preparando: {
    key: 'preparando',
    label: 'Preparando',
    hint: 'Estamos preparando y revisando tu equipo antes de que salga.',
    tone: 'info',
  },
  enviado: {
    key: 'enviado',
    label: 'Enviado',
    hint: 'Tu pedido va en camino.',
    tone: 'info',
  },
  entregado: {
    key: 'entregado',
    label: 'Entregado',
    hint: 'Tu pedido fue entregado.',
    tone: 'ok',
  },
  en_renta: {
    key: 'en_renta',
    label: 'En renta',
    hint: 'El equipo está contigo durante el periodo contratado.',
    tone: 'info',
  },
  recolectado: {
    key: 'recolectado',
    label: 'Recolectado',
    hint: 'Recogimos el equipo. Estamos cerrando el pedido.',
    tone: 'info',
  },
  cerrado: {
    key: 'cerrado',
    label: 'Cerrado',
    hint: 'El pedido quedó cerrado. Gracias por tu compra.',
    tone: 'ok',
  },
  cancelado: {
    key: 'cancelado',
    label: 'Cancelado',
    hint: 'El pedido fue cancelado. Si crees que es un error, contáctanos.',
    tone: 'bad',
  },
};

/** El paso "enviado" se lee distinto según cómo salga el equipo. */
const SENT_BY_METHOD: Record<ShipMethod, Pick<FulfillmentStep, 'label' | 'hint'>> = {
  paqueteria: { label: 'Enviado', hint: 'Tu pedido va en camino con la paquetería.' },
  traslado: { label: 'En ruta', hint: 'Nuestra unidad va en camino con tu equipo.' },
  sucursal: { label: 'Listo para recoger', hint: 'Tu pedido ya te espera en la sucursal.' },
};

export interface ShipMethodInfo {
  key: ShipMethod;
  label: string;
  hint: string;
}

export const SHIP_METHODS: Record<ShipMethod, ShipMethodInfo> = {
  paqueteria: {
    key: 'paqueteria',
    label: 'Paquetería',
    hint: 'Sale con una paquetería y el cliente rastrea con la guía.',
  },
  traslado: {
    key: 'traslado',
    label: 'Traslado en unidad propia',
    hint: 'Lo lleva una unidad de la empresa. El flete se cotiza por km.',
  },
  sucursal: {
    key: 'sucursal',
    label: 'Recolección en sucursal',
    hint: 'El cliente lo recoge en una de las sucursales.',
  },
};

/** Los datos del envío; solo se llenan los del método activo. */
export interface ShipFields {
  method: ShipMethod | string | null;
  carrier?: string | null;
  tracking?: string | null;
  unit?: string | null;
  branch?: string | null;
}

/**
 * El dato con el que se sigue el envío, según el método: la guía, la unidad o la
 * sucursal. `null` si el método no está definido o el dato aún no se captura.
 *
 * Vive aquí porque lo preguntan tres pantallas (lista del panel, /rastreo y /pedido)
 * y tenerlo repetido hacía que cada una etiquetara el mismo dato distinto.
 */
export function shipTracker(s: ShipFields): { label: string; value: string } | null {
  const m = toShipMethod(typeof s.method === 'string' ? s.method : null);
  if (!m) return null;
  if (m === 'paqueteria') return s.tracking ? { label: s.carrier ? `Guía · ${s.carrier}` : 'Guía', value: s.tracking } : null;
  if (m === 'traslado') return s.unit ? { label: 'Unidad', value: s.unit } : null;
  return s.branch ? { label: 'Recoge en', value: s.branch } : null;
}

/** Solo venta: es el flujo principal del negocio. */
export const SALE_FLOW: Fulfillment[] = ['pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'cerrado'];

/** Con equipo en renta: el equipo va y REGRESA. */
export const RENTAL_FLOW: Fulfillment[] = [
  'pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'en_renta', 'recolectado', 'cerrado',
];

/** `cancelado` no está en la escalera: puede pasar en cualquier momento. */
export const fulfillmentFlow = (hasRental: boolean): Fulfillment[] => (hasRental ? RENTAL_FLOW : SALE_FLOW);

/** La columna es texto libre: nunca confiar en que trae un estado conocido. */
export function toFulfillment(raw: string | null | undefined): Fulfillment | null {
  const k = (raw ?? '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(FULFILLMENT, k) ? (k as Fulfillment) : null;
}

export function toShipMethod(raw: string | null | undefined): ShipMethod | null {
  const k = (raw ?? '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(SHIP_METHODS, k) ? (k as ShipMethod) : null;
}

/** Estado + método = lo que realmente se le dice al cliente. */
export function fulfillmentStep(state: Fulfillment, method?: ShipMethod | null): FulfillmentStep {
  const base = FULFILLMENT[state];
  return state === 'enviado' && method ? { ...base, ...SENT_BY_METHOD[method] } : base;
}

export type LegacyOrderStatus = 'pending' | 'processing' | 'completed' | 'declined';

/**
 * Proyección GRUESA al enum legacy `orders_status`, que se mantiene sincronizado para
 * no romper reportes ni las órdenes viejas.
 *
 * Es una SOMBRA, no el estado real: no es monótona (una renta va de `entregado`→completed
 * a `en_renta`→processing). Nada debe derivar el avance del envío de aquí: para eso está
 * `fulfillment`.
 */
export const LEGACY_STATUS: Record<Fulfillment, LegacyOrderStatus> = {
  pendiente: 'pending',
  pagado: 'pending',
  preparando: 'processing',
  enviado: 'processing',
  entregado: 'completed',
  en_renta: 'processing',
  recolectado: 'processing',
  cerrado: 'completed',
  cancelado: 'declined',
};
