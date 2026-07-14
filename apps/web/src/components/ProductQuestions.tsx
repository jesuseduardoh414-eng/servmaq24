'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface QA {
  id: number;
  author: string;
  question: string;
  answer: string | null;
  date: string | null;
  answeredAt: string | null;
}

const fmt = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Preguntas y respuestas de un producto (tipo MercadoLibre). El cliente pregunta; el admin responde. */
export function ProductQuestions({ productId }: { productId: number }) {
  const [list, setList] = useState<QA[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/proxy/catalog/products/${productId}/questions`).then((r) => (r.ok ? r.json() : [])).then((d: QA[]) => setList(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/auth/session').then((r) => r.json()).then((d) => setLoggedIn(Boolean(d.user))).catch(() => {});
  }, [productId]);

  async function ask() {
    if (q.trim().length < 5) { setMsg({ ok: false, text: 'Escribe una pregunta de al menos 5 caracteres.' }); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/proxy/catalog/products/${productId}/questions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q.trim() }),
      });
      if (!r.ok) { const d = await r.json().catch(() => null); throw new Error(d?.message ?? 'No se pudo enviar tu pregunta'); }
      setQ('');
      setMsg({ ok: true, text: 'Tu pregunta fue enviada. Te responderemos pronto (aparecerá aquí al responderse).' });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  }

  const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', padding: '11px 13px', fontFamily: 'inherit', fontSize: '14.5px', lineHeight: 1.5, resize: 'vertical' };

  return (
    <section style={{ display: 'grid', gap: '1rem' }}>
      <h2 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>Preguntas y respuestas</h2>

      {/* Preguntar */}
      {loggedIn ? (
        <div style={{ display: 'grid', gap: '.6rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem 1.1rem' }}>
          <strong style={{ fontSize: '14.5px' }}>¿Tienes una duda sobre este equipo?</strong>
          <textarea value={q} onChange={(e) => setQ(e.target.value)} rows={2} maxLength={500} placeholder="Escribe tu pregunta…" style={inputStyle} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={ask} disabled={busy} style={{ border: 'none', background: 'var(--color-primary)', color: 'var(--color-primary-fg)', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>{busy ? 'Enviando…' : 'Preguntar'}</button>
            {msg ? <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: msg.ok ? 'var(--color-success)' : 'var(--color-error)' }}>{msg.text}</span> : null}
          </div>
        </div>
      ) : (
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Inicia sesión</Link> para hacer una pregunta sobre este equipo.
        </p>
      )}

      {/* Lista de Q&A respondidas */}
      {list.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 'var(--text-sm)' }}>Aún no hay preguntas respondidas. ¡Sé el primero en preguntar!</p>
      ) : (
        <div style={{ display: 'grid', gap: '.8rem' }}>
          {list.map((item) => (
            <div key={item.id} style={{ display: 'grid', gap: '.5rem', padding: '1rem 1.1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ color: 'var(--color-primary)', fontWeight: 800, flexShrink: 0 }}>P:</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14.5px', color: 'var(--color-text)' }}>{item.question}</p>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{item.author}{item.date ? ` · ${fmt(item.date)}` : ''}</span>
                </div>
              </div>
              {item.answer ? (
                <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--color-border)', paddingTop: '.6rem' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 800, flexShrink: 0 }}>R:</span>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: 'var(--color-text)' }}>{item.answer}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
