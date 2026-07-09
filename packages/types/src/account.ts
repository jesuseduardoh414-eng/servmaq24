/** DTOs de cuenta y engagement: comentarios, wishlist, cupones, rastreo, perfil. */

export interface ProductComment {
  id: number;
  author: string;
  rating: number; // 1..5
  text: string;
  date: string | null;
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

export interface TrackingEntry {
  numTracking: string;
  nota: string | null;
  fechaEntrega: string; // ISO date
  status: number;
}

export interface TrackingResult {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string | null;
  entries: TrackingEntry[];
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
}
