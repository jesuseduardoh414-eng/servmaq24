'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@maqserv/ui';

type Branding = Record<string, string | null>;

const SLOTS: Array<{ slot: string; label: string; hint: string; dark?: boolean }> = [
  { slot: 'logoLight', label: 'Logo — modo claro', hint: 'Para fondos claros (cabecera). PNG con fondo transparente.' },
  { slot: 'logoDark', label: 'Logo — modo oscuro', hint: 'Versión clara del logo, para fondos oscuros / modo oscuro.', dark: true },
  { slot: 'favicon', label: 'Favicon', hint: 'Ícono de la pestaña del navegador. PNG/ICO/SVG cuadrado (32×32+).' },
  { slot: 'icon', label: 'Isotipo / ícono de app', hint: 'Símbolo cuadrado sin texto (apple-touch-icon).', dark: true },
  { slot: 'logoAlt', label: 'Logo alterno', hint: 'Otra variación (horizontal, monocromo, etc.).' },
];

/** Módulo de identidad de marca: sube/gestiona logos y favicon del tema activo. */
export function BrandingEditor({ initial }: { initial: Branding }) {
  const router = useRouter();
  const [branding, setBranding] = useState<Branding>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function send(slot: string, fd: FormData) {
    setBusy(slot);
    setMsg(null);
    try {
      fd.set('slot', slot);
      const res = await fetch('/api/admin/cms/branding', { method: 'PATCH', body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof data?.message === 'string' ? data.message : 'No se pudo guardar');
      if (data?.branding) setBranding(data.branding);
      setMsg({ ok: true, text: 'Guardado ✓ — refresca el sitio para verlo' });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  function onUpload(slot: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set('asset', file);
    void send(slot, fd);
    e.target.value = '';
  }

  function onClear(slot: string, label: string) {
    if (!window.confirm(`¿Quitar "${label}"?`)) return;
    const fd = new FormData();
    fd.set('clear', 'true');
    void send(slot, fd);
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>Diseño del sitio</p>
        <h1 style={{ fontSize: 'var(--text-2xl)', margin: '.1rem 0 0' }}>Identidad de marca</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: '.3rem 0 0', maxWidth: 640 }}>
          Logos y favicon del sitio. Se aplican al instante (refresca el sitio con F5). Formatos: PNG, JPG, WebP, SVG o ICO.
        </p>
        {msg ? (
          <p role={msg.ok ? 'status' : 'alert'} style={{ margin: '.5rem 0 0', color: msg.ok ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>{msg.text}</p>
        ) : null}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {SLOTS.map(({ slot, label, hint, dark }) => {
          const url = branding[slot] ?? null;
          return (
            <Card key={slot} style={{ display: 'grid', gap: '.7rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '.5rem' }}>
                <strong>{label}</strong>
                {url ? <Button size="sm" variant="ghost" onClick={() => onClear(slot, label)} disabled={busy === slot}>Quitar</Button> : null}
              </div>

              {/* Vista previa (fondo oscuro para logos de modo oscuro/favicon) */}
              <div
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  minHeight: 120,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: dark ? '#1A1A1B' : 'var(--color-bg)',
                  padding: '1rem',
                }}
              >
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={label} style={{ maxWidth: '100%', maxHeight: 90, objectFit: 'contain' }} />
                ) : (
                  <span style={{ color: dark ? 'rgba(255,255,255,.5)' : 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Sin imagen</span>
                )}
              </div>

              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.4 }}>{hint}</span>

              <label
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', cursor: busy === slot ? 'default' : 'pointer',
                  background: 'var(--color-primary)', color: 'var(--color-primary-fg)', fontWeight: 700, fontSize: 'var(--text-sm)',
                  padding: '.5em 1em', borderRadius: 'var(--radius-button)', opacity: busy === slot ? 0.6 : 1,
                }}
              >
                {busy === slot ? 'Subiendo…' : url ? 'Reemplazar' : 'Subir imagen'}
                <input type="file" accept="image/*,.ico,.svg" onChange={(e) => onUpload(slot, e)} disabled={busy === slot} style={{ display: 'none' }} />
              </label>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
