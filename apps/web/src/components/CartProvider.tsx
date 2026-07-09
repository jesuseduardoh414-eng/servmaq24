'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Carrito del lado cliente con persistencia en localStorage.
 * Al hacer checkout (siguiente slice de F2) se materializa como orden en la
 * API — el carrito en sí no necesita servidor para invitados.
 */
export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  qty: number;
}

interface CartApi {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartApi | null>(null);
const STORAGE_KEY = 'servmaq_cart_v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hidratar desde localStorage solo en cliente (evita mismatch SSR)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* carrito corrupto → empezar vacío */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const api = useMemo<CartApi>(() => ({
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    total: items.reduce((s, i) => s + i.price * i.qty, 0),
    add: (item, qty = 1) =>
      setItems((prev) => {
        const found = prev.find((i) => i.productId === item.productId);
        if (found) {
          return prev.map((i) => (i.productId === item.productId ? { ...i, qty: i.qty + qty } : i));
        }
        return [...prev, { ...item, qty }];
      }),
    setQty: (productId, qty) =>
      setItems((prev) =>
        qty <= 0 ? prev.filter((i) => i.productId !== productId)
                 : prev.map((i) => (i.productId === productId ? { ...i, qty } : i)),
      ),
    remove: (productId) => setItems((prev) => prev.filter((i) => i.productId !== productId)),
    clear: () => setItems([]),
  }), [items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
