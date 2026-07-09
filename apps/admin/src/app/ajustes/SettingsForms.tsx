'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@servmaq/ui';

interface Hero {
  badge: string | null;
  title: string | null;
  subtitle: string | null;
  feature1: string | null;
  feature2: string | null;
  image: string | null;
}

interface Settings {
  email: string | null;
  phone: string | null;
  street: string | null;
}

export function SettingsForms({ hero, settings }: { hero: Hero | null; settings: Settings | null }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const full = { width: '100%' } as const;

  async function saveHero(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/admin/cms/hero', { method: 'PATCH', body: fd });
    setBusy(false);
    setMsg(res.ok ? 'Hero guardado' : 'Error al guardar el hero');
    router.refresh();
  }

  async function saveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/admin/cms/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: String(form.get('email') ?? ''),
        phone: String(form.get('phone') ?? ''),
        street: String(form.get('street') ?? ''),
      }),
    });
    setBusy(false);
    setMsg(res.ok ? 'Datos de contacto guardados' : 'Error al guardar');
    router.refresh();
  }

  return (
    <div style={{ display: 'grid', gap: '1.2rem', maxWidth: 720 }}>
      {msg ? <p role="status" style={{ color: 'var(--color-success)', margin: 0, fontWeight: 600, fontSize: 'var(--text-sm)' }}>{msg}</p> : null}

      <Card style={{ display: 'grid', gap: '.8rem' }}>
        <strong>Hero de la portada</strong>
        <form onSubmit={saveHero} encType="multipart/form-data" style={{ display: 'grid', gap: '.7rem' }}>
          <Input name="badge" defaultValue={hero?.badge ?? ''} placeholder="Badge (ej. MAQUINARIA DISPONIBLE)" aria-label="Badge" style={full} />
          <Input name="title" defaultValue={hero?.title ?? ''} placeholder="Título" aria-label="Título" style={full} />
          <Input name="subtitle" defaultValue={hero?.subtitle ?? ''} placeholder="Subtítulo" aria-label="Subtítulo" style={full} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem' }}>
            <Input name="feature1" defaultValue={hero?.feature1 ?? ''} placeholder="Punto destacado 1" aria-label="Punto 1" style={full} />
            <Input name="feature2" defaultValue={hero?.feature2 ?? ''} placeholder="Punto destacado 2" aria-label="Punto 2" style={full} />
          </div>
          {hero?.image ? (
            <img src={hero.image} alt="" style={{ width: 200, aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
          ) : null}
          <input type="file" name="image" accept="image/*" style={{ fontSize: 'var(--text-sm)' }} />
          <div><Button type="submit" disabled={busy}>Guardar hero</Button></div>
        </form>
      </Card>

      <Card style={{ display: 'grid', gap: '.8rem' }}>
        <strong>Contacto de la empresa</strong>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          La dirección es el ORIGEN del cálculo de fletes (Distance Matrix).
        </p>
        <form onSubmit={saveSettings} style={{ display: 'grid', gap: '.7rem' }}>
          <Input name="email" type="email" defaultValue={settings?.email ?? ''} placeholder="Correo de contacto" aria-label="Correo" style={full} />
          <Input name="phone" defaultValue={settings?.phone ?? ''} placeholder="Teléfono" aria-label="Teléfono" style={full} />
          <Input name="street" defaultValue={settings?.street ?? ''} placeholder="Dirección de la empresa" aria-label="Dirección" style={full} />
          <div><Button type="submit" disabled={busy}>Guardar contacto</Button></div>
        </form>
      </Card>
    </div>
  );
}
