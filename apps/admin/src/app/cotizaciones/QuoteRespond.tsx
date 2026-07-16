'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { D, FONT, inputStyle, smallLabel } from '@/components/editor-kit';

const money = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Responder cotización: flete/impuesto/condiciones → status completed. */
export function QuoteRespond({ quoteId, subtotal }: { quoteId: number; subtotal: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [freight, setFreight] = useState(0);
  const [tax, setTax] = useState(0);
  const [conditions, setConditions] = useState('');

  // El admin capturaba flete e impuesto sin ver el total que le llega al cliente.
  const total = subtotal + freight + tax;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/admin/quotes/${quoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        freightCost: freight,
        tax,
        conditions: conditions.trim() || undefined,
        status: 'completed',
      }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ border: 'none', background: D.amber, color: '#0a0a0b', borderRadius: 9, padding: '8px 14px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
      >
        Responder
      </button>
    );
  }

  const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', fontSize: 13, color: D.muted2 };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Responder cotización"
      onClick={() => !loading && setOpen(false)}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', padding: 20, zIndex: 200, fontFamily: FONT }}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{ background: D.card, border: `1px solid ${D.cardBorder}`, borderRadius: 18, padding: 24, width: 'min(460px, 100%)', textAlign: 'left', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8)' }}
      >
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: D.text, letterSpacing: '-0.02em' }}>Responder cotización</h2>
        <p style={{ margin: '0 0 18px', fontSize: 12.5, color: D.muted }}>Al enviarla, el cliente la verá como “Cotizada” en su cuenta.</p>

        <div style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={smallLabel}>Flete / traslado ($)</span>
            <input type="number" step="0.01" min={0} value={freight || ''} onChange={(e) => setFreight(Math.max(0, Number(e.target.value) || 0))} placeholder="0.00" style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={smallLabel}>Impuesto ($)</span>
            <input type="number" step="0.01" min={0} value={tax || ''} onChange={(e) => setTax(Math.max(0, Number(e.target.value) || 0))} placeholder="0.00" style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={smallLabel}>Condiciones (opcional)</span>
            <textarea
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              rows={3}
              placeholder="Ej. Precio vigente 15 días. No incluye combustible ni operador."
              style={{ ...inputStyle, height: 'auto', padding: '12px 14px', lineHeight: 1.55, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </label>
        </div>

        {/* Desglose en vivo: lo que verá el cliente. */}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${D.cardBorder}` }}>
          <div style={row}><span>Subtotal</span><span style={{ color: D.text, fontWeight: 600 }}>{money(subtotal)}</span></div>
          {freight > 0 ? <div style={row}><span>Traslado</span><span style={{ color: D.text, fontWeight: 600 }}>{money(freight)}</span></div> : null}
          {tax > 0 ? <div style={row}><span>Impuesto</span><span style={{ color: D.text, fontWeight: 600 }}>{money(tax)}</span></div> : null}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, paddingTop: 10, marginTop: 6, borderTop: `1px solid ${D.cardBorder}` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>Total al cliente</span>
            <strong style={{ fontSize: 22, fontWeight: 800, color: D.amber, letterSpacing: '-0.02em' }}>{money(total)}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="button" onClick={() => setOpen(false)} disabled={loading} style={{ flex: 1, border: `1px solid ${D.inputBorder}`, background: 'transparent', color: D.text, borderRadius: 11, padding: '11px 16px', fontWeight: 600, fontSize: 14, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button type="submit" disabled={loading} style={{ flex: 2, border: 'none', background: D.amber, color: '#0a0a0b', borderRadius: 11, padding: '11px 18px', fontWeight: 800, fontSize: 14, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'inherit' }}>
            {loading ? 'Enviando…' : 'Enviar cotización'}
          </button>
        </div>
      </form>
    </div>
  );
}
