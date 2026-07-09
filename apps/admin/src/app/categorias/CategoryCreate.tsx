'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@servmaq/ui';

export function CategoryCreate() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/admin/catalog/categories', { method: 'POST', body: fd });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(typeof data?.message === 'string' ? data.message : 'No se pudo crear');
      return;
    }
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <Card style={{ display: 'grid', gap: '.6rem' }}>
      <strong>Nueva categoría</strong>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center' }} encType="multipart/form-data">
        <Input name="name" required minLength={2} placeholder="Nombre" aria-label="Nombre" style={{ flex: '1 1 200px' }} />
        <input type="file" name="photo" accept="image/*" style={{ fontSize: 'var(--text-sm)' }} />
        <Button type="submit" disabled={loading}>Crear</Button>
      </form>
      {error ? <p role="alert" style={{ color: 'var(--color-error)', margin: 0, fontSize: 'var(--text-sm)' }}>{error}</p> : null}
    </Card>
  );
}
