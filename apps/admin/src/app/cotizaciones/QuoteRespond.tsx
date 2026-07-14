'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@maqserv/ui';

/** Responder cotización: flete/impuesto/condiciones → status completed. */
export function QuoteRespond({ quoteId, subtotal }: { quoteId: number; subtotal: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) {
    return <Button size="sm" onClick={() => setOpen(true)}>Responder</Button>;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await fetch(`/api/admin/quotes/${quoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        freightCost: Number(form.get('freight') ?? 0),
        tax: Number(form.get('tax') ?? 0),
        conditions: String(form.get('conditions') ?? '') || undefined,
        status: 'completed',
      }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '.4rem', minWidth: 220 }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
        Subtotal: ${subtotal.toLocaleString('es-MX')}
      </span>
      <Input name="freight" type="number" step="0.01" min={0} placeholder="Flete" aria-label="Flete" />
      <Input name="tax" type="number" step="0.01" min={0} placeholder="Impuesto" aria-label="Impuesto" />
      <Input name="conditions" placeholder="Condiciones" aria-label="Condiciones" />
      <div style={{ display: 'flex', gap: '.4rem' }}>
        <Button size="sm" type="submit" disabled={loading}>Completar</Button>
        <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </form>
  );
}
