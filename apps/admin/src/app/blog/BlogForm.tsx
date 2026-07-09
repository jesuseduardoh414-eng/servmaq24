'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@servmaq/ui';

export interface BlogFormData {
  id?: number;
  title?: string;
  details?: string;
  metaTag?: string | null;
  metaDescription?: string | null;
  image?: string | null;
}

export function BlogForm({ initial }: { initial: BlogFormData }) {
  const router = useRouter();
  const isEdit = Boolean(initial.id);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const full = { width: '100%' } as const;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(
      isEdit ? `/api/admin/cms/blogs/${initial.id}` : '/api/admin/cms/blogs',
      { method: isEdit ? 'PATCH' : 'POST', body: fd },
    );
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setError(typeof data?.message === 'string' ? data.message : 'No se pudo guardar');
      return;
    }
    router.push('/blog');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" style={{ display: 'grid', gap: '1rem', maxWidth: 720 }}>
      <Card style={{ display: 'grid', gap: '.8rem' }}>
        <Input name="title" required minLength={2} defaultValue={initial.title ?? ''} placeholder="Título" aria-label="Título" style={full} />
        <textarea
          name="details"
          required
          minLength={4}
          rows={10}
          defaultValue={initial.details ?? ''}
          placeholder="Contenido (HTML permitido)"
          aria-label="Contenido"
          style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', color: 'var(--color-text)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '.6em .8em', resize: 'vertical' }}
        />
        <Input name="metaTag" defaultValue={initial.metaTag ?? ''} placeholder="Meta título (SEO)" aria-label="Meta título" style={full} />
        <Input name="metaDescription" defaultValue={initial.metaDescription ?? ''} placeholder="Meta descripción (SEO)" aria-label="Meta descripción" style={full} />
        {initial.image ? (
          <img src={initial.image} alt="" style={{ width: 160, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
        ) : null}
        <input type="file" name="photo" accept="image/*" style={{ fontSize: 'var(--text-sm)' }} />
      </Card>
      {error ? <p role="alert" style={{ color: 'var(--color-error)', margin: 0, fontSize: 'var(--text-sm)' }}>{error}</p> : null}
      <div style={{ display: 'flex', gap: '.6rem' }}>
        <Button type="submit" disabled={busy}>{isEdit ? 'Guardar' : 'Publicar entrada'}</Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/blog')}>Cancelar</Button>
      </div>
    </form>
  );
}
