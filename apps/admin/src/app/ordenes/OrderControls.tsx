'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { D } from '@/components/design-tokens';
import { labelOf, type StatusStyle } from './order-status';

/**
 * Selector del estado del PAGO. El estado del ENVÍO no se toca desde la lista: se
 * gestiona en el detalle del pedido, donde se ven la guía, la unidad o la sucursal.
 *
 * Menú propio en vez de `<select>`: las `<option>` nativas las pinta el sistema
 * operativo (fondo blanco y resaltado azul en Windows) y no aceptan estilos, así
 * que rompían el cromo oscuro del panel.
 */
export function StatusPicker({
  orderId,
  field,
  value,
  options,
  map,
}: {
  orderId: number;
  field: 'paymentStatus';
  value: string;
  options: string[];
  map: Record<string, StatusStyle>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  const c = labelOf(map, current);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  async function change(next: string) {
    setOpen(false);
    if (next === current) return;
    setBusy(true);
    setCurrent(next);
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: next }),
      });
      router.refresh(); // la API le manda la notificación al cliente
    } catch {
      setCurrent(value); // revertir si falló
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Estado del pago: ${c.label}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, cursor: busy ? 'wait' : 'pointer',
          fontSize: 12, fontWeight: 700, color: c.color, whiteSpace: 'nowrap', fontFamily: 'inherit',
          background: `color-mix(in srgb, ${c.color} 10%, transparent)`,
          border: `1px solid color-mix(in srgb, ${c.color} 26%, transparent)`,
          borderRadius: 20, padding: '5px 10px 5px 11px', opacity: busy ? 0.5 : 1,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
        {c.label}
        <span aria-hidden style={{ fontSize: 8, opacity: 0.75, transform: open ? 'rotate(180deg)' : undefined }}>▾</span>
      </button>

      {open ? (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50, minWidth: 178,
            background: D.card, border: `1px solid ${D.inputBorder}`, borderRadius: 11, padding: 4,
            boxShadow: '0 18px 44px -14px rgba(0,0,0,0.75)',
          }}
        >
          {options.map((o) => {
            const s = labelOf(map, o);
            const on = o.toLowerCase() === current.toLowerCase();
            return (
              <button
                key={o}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => change(o)}
                className="or-opt"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                  border: 'none', background: on ? 'rgba(255,255,255,0.05)' : 'transparent',
                  color: s.color, fontSize: 12.5, fontWeight: on ? 700 : 600, fontFamily: 'inherit',
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                {s.label}
                {on ? <span style={{ marginLeft: 'auto', fontSize: 11 }} aria-hidden>✓</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/** Búsqueda por folio, cliente o correo. Va por la URL: la API la resuelve. */
export function OrdersSearch({ initial }: { initial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [term, setTerm] = useState(initial);

  function go(next: string) {
    const n = new URLSearchParams(params.toString());
    if (next.trim()) n.set('search', next.trim());
    else n.delete('search');
    n.delete('page'); // otro filtro = volver a la primera página
    router.push(`${pathname}?${n.toString()}`);
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); go(term); }}
      style={{ display: 'flex', alignItems: 'center', gap: 9, background: D.card, border: `1px solid ${D.inputBorder}`, borderRadius: 11, height: 42, padding: '0 13px', flex: 1, minWidth: 220, maxWidth: 360 }}
    >
      <i className="ph ph-magnifying-glass" style={{ color: '#6B6B71', fontSize: 14 }} />
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Buscar folio, cliente o correo…"
        aria-label="Buscar orden"
        style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', color: D.text, fontSize: 13.5, fontFamily: 'inherit', outline: 'none' }}
      />
      {term ? (
        <button type="button" onClick={() => { setTerm(''); go(''); }} aria-label="Limpiar búsqueda" style={{ border: 'none', background: 'transparent', color: D.muted2, cursor: 'pointer', fontSize: 13, padding: 0 }}>✕</button>
      ) : null}
    </form>
  );
}
