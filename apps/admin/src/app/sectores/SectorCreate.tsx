'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@maqserv/ui';

export function SectorCreate() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/admin/cms/sectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: String(form.get('title') ?? '') }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (res.ok && data?.id) {
      router.push(`/sectores/${data.id}`);
      router.refresh();
    }
  }

  return (
    <Card className="grid gap-2">
      <strong>Nuevo sector</strong>
      <form onSubmit={onSubmit} className="flex gap-2 flex-wrap">
        <Input name="title" required minLength={2} placeholder="Nombre del sector" aria-label="Nombre del sector" className="flex-1 min-w-48" />
        <Button type="submit" disabled={busy}>Crear y editar</Button>
      </form>
    </Card>
  );
}
