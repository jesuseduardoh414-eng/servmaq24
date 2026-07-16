'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { D } from '@/components/design-tokens';

const btn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700,
  fontFamily: 'inherit', borderRadius: 10, padding: '9px 16px', cursor: 'pointer',
  background: 'transparent', color: '#B4B4B9', border: `1px solid ${D.inputBorder}`,
};

/**
 * Sacar la lista y empujarla al CRM: sin esto, juntar correos que no se pueden usar
 * no sirve de nada.
 */
export function SubscriberTools({ perfexEnabled, total }: { perfexEnabled: boolean; total: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'csv' | 'sync' | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  /** El CSV lo arma el navegador: el proxy del admin solo sabe reenviar JSON. */
  async function exportCsv() {
    setBusy('csv');
    setMsg(null);
    try {
      const res = await fetch('/api/admin/subscribers/export');
      if (!res.ok) throw new Error('No se pudo exportar');
      const rows = (await res.json()) as Array<{ email: string; createdAt: string | null }>;
      const csv = ['correo,alta', ...rows.map((r) => `${r.email},${r.createdAt ? r.createdAt.slice(0, 10) : ''}`)].join('\n');
      // BOM para que Excel en Windows respete los acentos.
      const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `suscriptores-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg({ ok: true, text: `${rows.length} correos exportados` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'No se pudo exportar' });
    } finally {
      setBusy(null);
    }
  }

  async function sync() {
    if (!window.confirm(`¿Enviar los ${total} suscriptores a Perfex como leads?`)) return;
    setBusy('sync');
    setMsg(null);
    try {
      const res = await fetch('/api/admin/subscribers/sync', { method: 'POST' });
      const data = await res.json();
      setMsg(data?.ok
        ? { ok: true, text: `${data.sent} de ${data.total} enviados a Perfex` }
        : { ok: false, text: data?.message ?? 'No se pudo sincronizar' });
    } catch {
      setMsg({ ok: false, text: 'No se pudo sincronizar' });
    } finally {
      setBusy(null);
      router.refresh();
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <style>{`.sb-btn:hover:not(:disabled){ background: rgba(255,255,255,0.06); color:#f5f5f4; }`}</style>

      <button type="button" className="sb-btn" onClick={exportCsv} disabled={busy !== null || total === 0} style={{ ...btn, opacity: busy || total === 0 ? 0.5 : 1 }}>
        <i className="ph ph-download-simple" style={{ fontSize: 15 }} />
        {busy === 'csv' ? 'Exportando…' : 'Exportar CSV'}
      </button>

      {/* Sin Perfex configurado el botón no puede hacer nada: se dice, no se esconde. */}
      <button
        type="button"
        className="sb-btn"
        onClick={sync}
        disabled={busy !== null || !perfexEnabled || total === 0}
        title={perfexEnabled ? 'Empuja todos los suscriptores a Perfex como leads' : 'Perfex no está configurado'}
        style={{ ...btn, opacity: busy || !perfexEnabled || total === 0 ? 0.4 : 1, cursor: perfexEnabled ? 'pointer' : 'not-allowed' }}
      >
        <i className="ph ph-arrow-square-out" style={{ fontSize: 15 }} />
        {busy === 'sync' ? 'Enviando…' : 'Enviar a Perfex'}
      </button>

      {msg ? (
        <span role="status" style={{ fontSize: 12.5, fontWeight: 600, color: msg.ok ? '#3fbf8f' : '#f55' }}>{msg.text}</span>
      ) : null}
    </div>
  );
}

/** Baja de la lista. Es definitivo: el correo se borra. */
export function DeleteSubscriber({ id, email }: { id: number; email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm(`¿Dar de baja a ${email}? Se borra de la lista.`)) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/subscribers/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      aria-label={`Dar de baja a ${email}`}
      style={{ fontSize: 12, fontWeight: 700, fontFamily: 'inherit', background: 'transparent', color: busy ? '#5C5C61' : '#8A8A8F', border: `1px solid ${D.inputBorder}`, borderRadius: 8, padding: '5px 12px', cursor: busy ? 'wait' : 'pointer' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = '#f55'; e.currentTarget.style.borderColor = 'rgba(255,85,85,0.3)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A8F'; e.currentTarget.style.borderColor = D.inputBorder; }}
    >
      Dar de baja
    </button>
  );
}
