'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@servmaq/ui';

interface Faq {
  id: number;
  title: string;
  text: string;
}

export function FaqManager({ faqs }: { faqs: Faq[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>, id?: number) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    await fetch(id ? `/api/admin/cms/faqs/${id}` : '/api/admin/cms/faqs', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: String(form.get('title') ?? ''),
        text: String(form.get('text') ?? ''),
      }),
    });
    setBusy(false);
    setEditing(null);
    if (!id) (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  async function remove(id: number) {
    if (!window.confirm('¿Eliminar esta pregunta?')) return;
    await fetch(`/api/admin/cms/faqs/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  const fields = (faq?: Faq) => (
    <>
      <Input name="title" required minLength={2} defaultValue={faq?.title ?? ''} placeholder="Pregunta" aria-label="Pregunta" style={{ width: '100%' }} />
      <Input name="text" required minLength={2} defaultValue={faq?.text ?? ''} placeholder="Respuesta" aria-label="Respuesta" style={{ width: '100%' }} />
    </>
  );

  return (
    <div style={{ display: 'grid', gap: '1rem', maxWidth: 720 }}>
      <Card style={{ display: 'grid', gap: '.6rem' }}>
        <strong>Nueva pregunta</strong>
        <form onSubmit={(e) => save(e)} style={{ display: 'grid', gap: '.6rem' }}>
          {fields()}
          <div><Button type="submit" disabled={busy}>Agregar</Button></div>
        </form>
      </Card>

      {faqs.map((f) => (
        <Card key={f.id} style={{ display: 'grid', gap: '.5rem' }}>
          {editing === f.id ? (
            <form onSubmit={(e) => save(e, f.id)} style={{ display: 'grid', gap: '.6rem' }}>
              {fields(f)}
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <Button size="sm" type="submit" disabled={busy}>Guardar</Button>
                <Button size="sm" type="button" variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              </div>
            </form>
          ) : (
            <>
              <strong>{f.title}</strong>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{f.text}</span>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <Button size="sm" variant="outline" onClick={() => setEditing(f.id)}>Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(f.id)}>Eliminar</Button>
              </div>
            </>
          )}
        </Card>
      ))}
    </div>
  );
}
