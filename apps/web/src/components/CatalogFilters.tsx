'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Filtros del catálogo con dropdown propio (etiqueta + valor + chevron y menú
 * con check), estilo "Catálogo Mejorado". Por ahora VISUAL (la selección solo
 * cambia la etiqueta); se conectará a la API cuando soporte estos filtros.
 */
interface FilterDef { id: string; label: string; options: [string, string][] }

const DEFS: FilterDef[] = [
  { id: 'precio', label: 'Precio', options: [['', 'Todos los precios'], ['a', 'Hasta $10,000'], ['b', '$10,000 – $50,000'], ['c', 'Más de $50,000']] },
  { id: 'calif', label: 'Calificación', options: [['', 'Cualquiera'], ['4', '4★ o más'], ['3', '3★ o más'], ['2', '2★ o más']] },
  { id: 'disp', label: 'Disponibilidad', options: [['', 'Todas'], ['now', 'Disponible ahora'], ['rent', 'Solo renta'], ['oferta', 'En oferta']] },
  { id: 'orden', label: 'Ordenar por', options: [['', 'Relevancia'], ['low', 'Precio: menor a mayor'], ['high', 'Precio: mayor a menor'], ['new', 'Más recientes']] },
];

export function CatalogFilters() {
  const [open, setOpen] = useState<string | null>(null);
  const [sel, setSel] = useState<Record<string, string>>({});
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {DEFS.map((d) => {
        const isOpen = open === d.id;
        const cur = d.options.find((o) => o[0] === (sel[d.id] ?? '')) ?? d.options[0];
        return (
          <div key={d.id} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setOpen((o) => (o === d.id ? null : d.id))}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, minWidth: 168, background: 'var(--color-surface)', border: `1px solid ${isOpen ? 'var(--color-text)' : 'var(--color-border)'}`, borderRadius: 13, padding: '9px 16px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', boxShadow: '0 1px 2px rgba(16,24,40,.03)', transition: 'border-color .15s' }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.02em', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{d.label}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--color-text)' }}>{cur[1]}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .18s', transform: isOpen ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9" /></svg>
              </span>
            </button>
            {isOpen ? (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: '100%', width: 'max-content', maxWidth: 280, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, boxShadow: '0 12px 32px rgba(16,24,40,.18)', padding: 6, zIndex: 40 }}>
                {d.options.map((o) => {
                  const selected = o[0] === (sel[d.id] ?? '');
                  return (
                    <button
                      key={o[0]}
                      type="button"
                      className="filter-opt"
                      onClick={() => { setSel((s) => ({ ...s, [d.id]: o[0] })); setOpen(null); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, border: 'none', background: selected ? 'color-mix(in srgb, var(--color-primary) 14%, transparent)' : 'transparent', fontFamily: 'inherit', fontSize: 14, fontWeight: selected ? 700 : 600, color: 'var(--color-text)', textAlign: 'left', padding: '10px 12px', borderRadius: 9, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      <span>{o[1]}</span>
                      {selected ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
