'use client';
import { useEffect, useState } from 'react';
import { fetchRealtimeToken, supabaseBrowser } from '@/lib/supabase-browser';

/**
 * Muestra el estado de pago del pedido y lo actualiza EN VIVO vía Supabase Realtime.
 * Se suscribe a UPDATE de `orders` filtrado por order_number; RLS asegura que solo
 * el dueño (o admin) reciba el evento.
 */
export function OrderStatusLive({
  orderNumber,
  label,
  initialPaymentStatus,
}: {
  orderNumber: string;
  label: string;
  initialPaymentStatus: string;
}) {
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let active = true;
    const sb = supabaseBrowser();
    let channel: ReturnType<typeof sb.channel> | null = null;

    (async () => {
      const token = await fetchRealtimeToken();
      if (!token || !active) return;
      sb.realtime.setAuth(token);
      channel = sb
        .channel(`order-${orderNumber}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `order_number=eq.${orderNumber}` },
          (payload) => {
            const row = payload.new as { payment_status?: string };
            if (row.payment_status) setPaymentStatus(row.payment_status);
          },
        )
        .subscribe((s) => {
          if (s === 'SUBSCRIBED' && active) setLive(true);
        });
    })();

    return () => {
      active = false;
      if (channel) sb.removeChannel(channel);
    };
  }, [orderNumber]);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: 'var(--text-sm)', alignItems: 'center' }}>
      <span style={{ color: 'var(--color-text-muted)' }}>
        {label}
        {live ? <span style={{ color: 'var(--color-primary)', marginLeft: '.4rem' }}>· en vivo</span> : null}
      </span>
      <strong>{paymentStatus}</strong>
    </div>
  );
}
