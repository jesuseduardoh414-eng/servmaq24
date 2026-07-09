/** DTOs del marketplace multi-vendedor (F3). */

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

export interface VendorMe {
  /** 0 = no es vendedor, 1 = solicitud pendiente, 2 = aprobado. */
  status: 0 | 1 | 2;
  shopName: string | null;
  balance: number;
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
