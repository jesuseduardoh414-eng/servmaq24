/**
 * DTOs de checkout y órdenes (F2).
 * REGLA: los precios SIEMPRE se calculan en el servidor contra la BD;
 * el cliente solo manda productId + qty.
 */

export type PaymentMethodId = 'transferencia' | 'mercadopago';

export interface PaymentMethod {
  id: PaymentMethodId;
  /** Título mostrado (del gateway legacy o del proveedor). */
  title: string;
  /** Instrucciones HTML (p.ej. pasos de la transferencia). */
  instructions: string | null;
  available: boolean;
}

export interface CheckoutItemInput {
  productId: number;
  qty: number;
}

export interface CheckoutInput {
  items: CheckoutItemInput[];
  method: PaymentMethodId;
  /** Cupón opcional; el descuento lo calcula y aplica el servidor. */
  couponCode?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
  };
  note?: string;
}

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  qty: number;
  image: string | null;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  method: string;
  total: number;
  totalQty: number;
  createdAt: string | null;
}

export interface OrderDetail extends OrderSummary {
  /** Vacío para órdenes del sistema viejo (cart comprimido bzip2). */
  items: OrderItem[];
  customer: {
    name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    zip: string | null;
  };
  note: string | null;
}

export interface CheckoutResult {
  order: OrderSummary;
  /** URL de redirección al proveedor de pago (MercadoPago init_point). */
  redirectUrl: string | null;
  /** Instrucciones del método offline (transferencia). */
  instructions: string | null;
}
