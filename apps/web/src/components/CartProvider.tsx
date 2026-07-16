'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { RentalPeriod } from '@maqserv/types';

/**
 * Carrito del lado cliente con persistencia en localStorage.
 * Modelo de renta: PERIODO (día/semana/mes) × cantidad — el servidor recalcula
 * el precio del periodo contra la BD al hacer checkout (nunca se confía del cliente).
 */
export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  /** Unitario ya ajustado al periodo elegido. */
  price: number;
  image: string | null;
  qty: number;
  /** Renta: periodo elegido y su etiqueta ("MES"/"SEMANA"/"DÍA"). */
  period?: RentalPeriod;
  unitLabel?: string;
}

/** Total de línea: precio (del periodo) × cantidad. */
export function cartLineTotal(i: CartItem): number {
  return i.price * i.qty;
}

interface CartApi {
  items: CartItem[];
  count: number;
  total: number;
  /** Add-on "operador certificado" (se cobra por equipo; monto lo define el panel). */
  operator: boolean;
  setOperator: (v: boolean) => void;
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartApi | null>(null);
const STORAGE_KEY = 'servmaq_cart_v1';

interface Stored { items: CartItem[]; operator: boolean }

function readStored(raw: string): Stored {
  const parsed = JSON.parse(raw);
  // Compat: antes se guardaba solo el arreglo de items.
  if (Array.isArray(parsed)) return { items: parsed as CartItem[], operator: false };
  return {
    items: Array.isArray(parsed?.items) ? (parsed.items as CartItem[]) : [],
    operator: Boolean(parsed?.operator),
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [operator, setOperator] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hidratar desde localStorage solo en cliente (evita mismatch SSR)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = readStored(raw);
        setItems(s.items);
        setOperator(s.operator);
      }
    } catch {
      /* carrito corrupto → empezar vacío */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, operator }));
  }, [items, operator, hydrated]);

  const api = useMemo<CartApi>(() => ({
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    total: items.reduce((s, i) => s + cartLineTotal(i), 0),
    operator,
    setOperator,
    add: (item, qty = 1) =>
      setItems((prev) => {
        const found = prev.find((i) => i.productId === item.productId);
        if (found) {
          return prev.map((i) => (i.productId === item.productId ? { ...i, ...item, qty: i.qty + qty } : i));
        }
        return [...prev, { ...item, qty }];
      }),
    setQty: (productId, qty) =>
      setItems((prev) =>
        qty <= 0 ? prev.filter((i) => i.productId !== productId)
                 : prev.map((i) => (i.productId === productId ? { ...i, qty } : i)),
      ),
    remove: (productId) => setItems((prev) => prev.filter((i) => i.productId !== productId)),
    clear: () => { setItems([]); setOperator(false); },
  }), [items, operator]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
