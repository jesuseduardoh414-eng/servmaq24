'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@maqserv/ui';

interface Settings {
  email: string | null;
  phone: string | null;
  street: string | null;
}

// El Hero (contenido + diseño) se edita en Diseño → Sección 1 · Hero. Aquí solo
// quedan los ajustes generales (contacto/dirección, origen de fletes).
export function SettingsForms({ settings }: { settings: Settings | null }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const full = { width: '100%' } as const;

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
