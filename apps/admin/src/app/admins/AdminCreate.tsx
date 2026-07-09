'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@servmaq/ui';

export function AdminCreate() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: String(form.get('name') ?? ''),
        email: String(form.get('email') ?? ''),
        password: String(form.get('password') ?? ''),
      }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setError(typeof data?.message === 'string' ? data.message : 'No se pudo crear');
      return;
    }
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <Card className="grid gap-2">
      <strong>Nuevo administrador</strong>
      <form onSubmit={onSubmit} className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr 1fr auto' }}>
        <Input name="name" required minLength={2} placeholder="Nombre" aria-label="Nombre" />
        <Input name="email" type="email" required placeholder="Correo" aria-label="Correo" />
        <Input name="password" type="password" required minLength={8} placeholder="Contraseña (mín. 8)" aria-label="Contraseña" />
        <Button type="submit" disabled={busy}>Crear</Button>
      </form>
      {error ? <p role="alert" className="text-bad text-(length:--text-sm) m-0">{error}</p> : null}
    </Card>
  );
}
