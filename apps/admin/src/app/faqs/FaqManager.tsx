'use client';

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { D, FONT, cardStyle, inputStyle, h3Style, smallLabel, Field, Toggle } from '@/components/editor-kit';

interface Faq { id: number; title: string; text: string; status: number }

const textareaStyle: CSSProperties = { ...inputStyle, height: 'auto', minHeight: 74, padding: '11px 14px', lineHeight: 1.5, resize: 'vertical', fontFamily: 'inherit' };
const btnGhost: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${D.inputBorder}`, background: 'transparent', color: D.text, borderRadius: 10, padding: '8px 13px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const btnDanger: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid rgba(245,80,80,0.3)', background: 'rgba(245,80,80,0.08)', color: '#f87171', borderRadius: 10, padding: '8px 11px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const btnPrimary = (on: boolean): CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none', background: D.amber, color: '#0a0a0b', borderRadius: 11, padding: '10px 16px', fontWeight: 800, fontSize: 13.5, cursor: on ? 'pointer' : 'default', opacity: on ? 1 : 0.5, fontFamily: 'inherit' });

export function FaqManager({ faqs }: { faqs: Faq[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | 'new' | null>(null);
  const [nQ, setNQ] = useState('');
  const [nA, setNA] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const newReady = nQ.trim().length >= 2 && nA.trim().length >= 2;

  async function patch(id: number, body: Record<string, unknown>, key: number | 'new') {
    setBusy(key); setErr(null);
    try {
      const r = await fetch(`/api/admin/cms/faqs/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error('No se pudo guardar');
      setEditing(null); router.refresh();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
  }
  async function create() {
    if (!newReady) return;
    setBusy('new'); setErr(null);
    try {
      const r = await fetch('/api/admin/cms/faqs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: nQ, text: nA }) });
      if (!r.ok) throw new Error('No se pudo agregar');
      setNQ(''); setNA(''); router.refresh();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
  }
  async function remove(id: number) {
    if (!window.confirm('¿Eliminar esta pregunta?')) return;
    setBusy(id); setErr(null);
    try {
      const r = await fetch(`/api/admin/cms/faqs/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('No se pudo eliminar');
      router.refresh();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
  }

  return (
    <div style={{ fontFamily: FONT, color: D.text, maxWidth: 900 }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" />

      <div style={{ background: '#0c0c0e', border: `1px solid ${D.cardBorder}`, borderRadius: 16, padding: '18px 22px', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: D.muted2, fontSize: '12.5px', fontWeight: 600, marginBottom: 5 }}><i className="ph ph-question" style={{ fontSize: 14 }} /> Contenido del sitio</div>
        <h1 style={{ margin: 0, fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em' }}>Preguntas frecuentes</h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: D.muted2 }}>Dudas <b>generales</b> del negocio que se muestran en el home. Al editar solo cambias la <b>respuesta</b>; puedes <b>mostrar/ocultar</b> cada una.</p>
      </div>

      {/* Nueva pregunta */}
      <div style={{ ...cardStyle, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(245,184,30,0.14)', color: D.amber, display: 'grid', placeItems: 'center', flexShrink: 0 }}><i className="ph ph-plus" style={{ fontSize: 17 }} /></div>
          <h3 style={h3Style}>Nueva pregunta</h3>
        </div>
        <Field label="Pregunta"><input value={nQ} onChange={(e) => setNQ(e.target.value)} placeholder="¿Hacen envíos a todo México?" style={inputStyle} /></Field>
        <Field label="Respuesta"><textarea value={nA} onChange={(e) => setNA(e.target.value)} rows={3} placeholder="Sí, con flete calculado por distancia…" style={textareaStyle} /></Field>
        <div><button type="button" onClick={create} disabled={busy === 'new' || !newReady} style={btnPrimary(busy !== 'new' && newReady)}><i className="ph-bold ph-plus" /> {busy === 'new' ? 'Agregando…' : 'Agregar'}</button></div>
      </div>

      {err ? <div style={{ marginBottom: 12, fontSize: 12.5, color: '#f87171', display: 'flex', alignItems: 'center', gap: 7 }}><i className="ph ph-warning-circle" /> {err}</div> : null}

      {faqs.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', color: D.muted2, fontSize: 13 }}>Aún no hay preguntas. Agrega la primera arriba.</div>
      ) : faqs.map((f) => (
        editing === f.id
          ? <FaqEditRow key={f.id} faq={f} busy={busy === f.id} onCancel={() => setEditing(null)} onSave={(text) => patch(f.id, { text }, f.id)} />
          : (
            <div key={f.id} style={{ ...cardStyle, display: 'flex', alignItems: 'flex-start', gap: 14, opacity: f.status === 1 ? 1 : 0.55 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: 'rgba(245,184,30,0.14)', color: D.amber, display: 'grid', placeItems: 'center', fontWeight: 800 }}>?</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 14.5 }}>{f.title}</strong>
                  {f.status === 0 ? <span style={{ fontSize: 11, fontWeight: 700, color: D.muted2, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 999 }}>Oculta</span> : null}
                </div>
                <p style={{ margin: '5px 0 0', fontSize: 13, color: D.muted2, lineHeight: 1.55 }}>{f.text}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <Toggle on={f.status === 1} onClick={() => patch(f.id, { status: f.status === 1 ? 0 : 1 }, f.id)} />
                  <span style={{ ...smallLabel, fontSize: 10 }}>{f.status === 1 ? 'Visible' : 'Oculta'}</span>
                </div>
                <button type="button" onClick={() => setEditing(f.id)} style={btnGhost}><i className="ph ph-pencil-simple" /> Editar</button>
                <button type="button" onClick={() => remove(f.id)} disabled={busy === f.id} title="Eliminar" style={btnDanger}><i className="ph ph-trash" /></button>
              </div>
            </div>
          )
      ))}
    </div>
  );
}

function FaqEditRow({ faq, busy, onSave, onCancel }: { faq: Faq; busy: boolean; onSave: (text: string) => void; onCancel: () => void }) {
  const [a, setA] = useState(faq.text);
  const ready = a.trim().length >= 2;
  return (
    <div style={{ ...cardStyle, display: 'grid', gap: 12, border: `1px solid ${D.amber}44` }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <span style={smallLabel}>Pregunta (no editable)</span>
        <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', color: D.muted2, background: 'rgba(255,255,255,0.02)', cursor: 'default' }}>{faq.title}</div>
      </div>
      <Field label="Respuesta"><textarea value={a} onChange={(e) => setA(e.target.value)} rows={4} placeholder="Escribe la respuesta…" style={textareaStyle} /></Field>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => onSave(a)} disabled={busy || !ready} style={btnPrimary(!busy && ready)}><i className="ph-bold ph-check" /> {busy ? 'Guardando…' : 'Guardar respuesta'}</button>
        <button type="button" onClick={onCancel} disabled={busy} style={btnGhost}>Cancelar</button>
      </div>
    </div>
  );
}
