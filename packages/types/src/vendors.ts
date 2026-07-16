/** DTOs del marketplace multi-vendedor (F3). */

/**
 * Estado de un vendedor. La fuente de verdad es `users.is_vendor` (0|1|2); esto le
 * pone nombre para no repartir números mágicos entre API, panel y sitio.
 *
 * OJO: `0` es también el default de CUALQUIER cliente. Un "revocado" es is_vendor 0
 * **con `shop_name`** (alguna vez solicitó); sin ese matiz, "revocados" serían todos
 * los clientes del sitio.
 */
export type VendorState = 'revocado' | 'pendiente' | 'aprobado';

export const VENDOR_STATE: Record<0 | 1 | 2, VendorState> = {
  0: 'revocado',
  1: 'pendiente',
  2: 'aprobado',
};

export interface VendorStateInfo {
  label: string;
  /** Qué significa para la operación. */
  hint: string;
  tone: 'warn' | 'ok' | 'bad';
}

export const VENDOR_STATES: Record<VendorState, VendorStateInfo> = {
  pendiente: { label: 'Pendiente', hint: 'Solicitó vender y espera tu aprobación. Todavía no puede publicar nada.', tone: 'warn' },
  aprobado: { label: 'Aprobado', hint: 'Puede publicar productos, ver sus ventas y pedir retiros.', tone: 'ok' },
  revocado: { label: 'Revocado', hint: 'Se le retiró el acceso. Sus productos siguen en el catálogo hasta que los desactives.', tone: 'bad' },
};

/** `users.is_vendor` es un entero libre: nunca confiar en que trae 0, 1 o 2. */
export const toVendorState = (isVendor: number): VendorState => VENDOR_STATE[isVendor as 0 | 1 | 2] ?? 'revocado';

/** Enum `withdraws_status` de Postgres. */
export type WithdrawState = 'pending' | 'completed' | 'rejected';

export interface WithdrawStateInfo {
  /** Para el VENDEDOR: es su dinero y está esperando. */
  label: string;
  /** Para el PANEL: es trabajo pendiente. El mismo estado se lee distinto de cada lado. */
  adminLabel: string;
  tone: 'warn' | 'ok' | 'bad';
}

export const WITHDRAW_STATES: Record<WithdrawState, WithdrawStateInfo> = {
  pending: { label: 'En revisión', adminLabel: 'Por pagar', tone: 'warn' },
  completed: { label: 'Pagado', adminLabel: 'Pagado', tone: 'ok' },
  rejected: { label: 'Rechazado', adminLabel: 'Rechazado', tone: 'bad' },
};

/** La columna llega como texto: degradar en vez de romper la vista. */
export const toWithdrawState = (raw: string | null | undefined): WithdrawState | null => {
  const k = (raw ?? '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(WITHDRAW_STATES, k) ? (k as WithdrawState) : null;
};

export interface VendorPublic {
  id: number;
  shopName: string;
  ownerName: string;
  photo: string | null;
  shopAddress: string | null;
  shopNumber: string | null;
  shopDetails: string | null;
  productCount: number;
}

/** Lo que el cliente capturó al solicitar vender. */
export interface VendorApplication {
  shopName: string | null;
  shopNumber: string | null;
  shopAddress: string | null;
  regNumber: string | null;
  shopMessage: string | null;
}

export interface VendorMe {
  /** 0 = sin acceso, 1 = solicitud pendiente, 2 = aprobado. */
  status: 0 | 1 | 2;
  shopName: string | null;
  balance: number;
  /**
   * `null` = NUNCA solicitó. Es lo que desambigua el `status: 0`, que significa dos
   * cosas: "nunca pidió" y "lo rechazaron / le revocaron". Sin esto, a un vendedor
   * revocado el sitio le mostraba el formulario en blanco, como si nada hubiera pasado.
   */
  application: VendorApplication | null;
}

export interface ApplyVendorInput {
  shopName: string;
  shopNumber?: string;
  shopAddress?: string;
  regNumber?: string;
  shopMessage?: string;
}

export interface VendorProductInput {
  name: string;
  categoryId: number;
  price: number;
  oldPrice?: number;
  description: string;
  stock?: number;
  brand?: string;
  isRental?: boolean;
  rentalFreight?: number;
}

export interface VendorProductRow {
  id: number;
  slug: string;
  name: string;
  price: number;
  stock: number | null;
  status: number; // 1 activo, 0 desactivado
  image: string | null;
  isRental: boolean;
}

export interface VendorOrderRow {
  id: number;
  orderNumber: string;
  qty: number;
  price: number;
  status: string;
}

export interface WithdrawRow {
  id: number;
  amount: number;
  fee: number;
  method: string | null;
  status: string;
  reference: string | null;
  /** Nota del admin: por qué se rechazó. Rechazar sin decir por qué no es aceptable. */
  note: string | null;
  createdAt: string | null;
}

export interface WithdrawRequestInput {
  amount: number;
  method: string;
  accName?: string;
  accEmail?: string;
  iban?: string;
  swift?: string;
  country?: string;
  address?: string;
  reference?: string;
}
