/** DTOs de cuenta y engagement: comentarios, wishlist, cupones, rastreo, perfil. */

import type { OrderEvent, OrderShipping } from './orders';

export interface ProductComment {
  id: number;
  author: string;
  rating: number; // 1..5
  text: string;
  date: string | null;
  /** Reseña proveniente de una compra verificada. */
  verified?: boolean;
}

export interface ProductCommentsSummary {
  items: ProductComment[];
  average: number; // 0 si no hay
  count: number;
}

export interface CouponCheck {
  valid: boolean;
  /** Motivo si no es válido (clave de copy la decide el front). */
  reason: 'not_found' | 'expired' | 'exhausted' | null;
  code: string;
  /** Descuento calculado sobre el subtotal enviado. */
  discount: number;
  /** "5%" o monto fijo formateado por el front. */
  label: string | null;
}

/** Guía cargada en el sistema VIEJO (tabla `rastreos`). El módulo de envíos usa `events`. */
export interface TrackingEntry {
  numTracking: string;
  nota: string | null;
  fechaEntrega: string; // ISO date
  status: number;
}

export interface TrackingResult {
  orderNumber: string;
  /** Crudos del legacy: el front los traduce con `order-status.ts`. */
  status: string;
  paymentStatus: string;
  createdAt: string | null;
  /** Envío. null en órdenes viejas que nunca pasaron por el módulo. */
  shipping: OrderShipping | null;
  hasRental: boolean;
  /** Historial del envío, del más viejo al más nuevo. */
  events: OrderEvent[];
  entries: TrackingEntry[];
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
}
