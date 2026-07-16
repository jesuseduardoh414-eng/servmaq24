'use client';

import { useCallback, useState } from 'react';
import type { CheckoutFreight } from '@maqserv/config';

export interface FreightQuote {
  status: 'ok' | 'quote' | 'no_address' | 'not_found' | 'out_of_range' | 'not_applicable' | 'disabled';
  cost: number;
  km: number | null;
  chargedKm: number | null;
  distanceText: string | null;
  estimated: boolean;
  mode: CheckoutFreight['mode'];
  label: string;
  help: string;
  message: string;
}

/** La dirección que el cliente escribió en el carrito, para reusarla en el checkout. */
export const FREIGHT_ADDRESS_KEY = 'maqserv.freight.address';

export interface FreightItem {
  productId: number;
  qty: number;
}

/**
 * Cotiza el traslado contra la API. El monto que se cobra lo vuelve a calcular
 * el servidor al crear la orden — esto es solo lo que ve el cliente.
 */
export function useFreightQuote() {
  const [quote, setQuote] = useState<FreightQuote | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (address: string, items: FreightItem[]) => {
    setLoading(true);
    try {
      const r = await fetch('/api/proxy/freight/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address || undefined, items }),
      });
      if (!r.ok) throw new Error('no');
      setQuote((await r.json()) as FreightQuote);
    } catch {
      setQuote(null); // sin cotización → el desglose muestra "a cotizar"
    } finally {
      setLoading(false);
    }
  }, []);

  return { quote, loading, run };
}

/** Costo a sumar: solo cuando la cotización salió bien. */
export const freightCostOf = (q: FreightQuote | null): number => (q && q.status === 'ok' ? q.cost : 0);
