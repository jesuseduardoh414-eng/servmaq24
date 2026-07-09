'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@servmaq/ui';

interface InfSitio {
  frase: string | null;
  titulo: string | null;
  descripcion: string | null;
  mision: string | null;
  vision: string | null;
  objetivos: string | null;
}

export function InfSitioForm({ data }: { data: InfSitio | null }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/admin/cms/inf-sitio', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frase: String(form.get('frase') ?? ''),
        titulo: String(form.get('titulo') ?? ''),
        descripcion: String(form.get('descripcion') ?? ''),
        mision: String(form.get('mision') ?? ''),
        vision: String(form.get('vision') ?? ''),
        objetivos: String(form.get('objetivos') ?? ''),
      }),
    });
    setBusy(false);
    setMsg(res.ok ? 'Página Quiénes Somos guardada' : 'Error al guardar');
    router.refresh();
  }

  const area = (name: string, value: string | null, placeholder: string, rows = 3) => (
    <textarea
      name={name}
      rows={rows}
      defaultValue={value ?? ''}
      placeholder={placeholder}
      aria-label={placeholder}
      className="font-body text-(length:--text-base) text-ink bg-panel border border-line rounded-(--radius-md) px-3 py-2 resize-y"
    />
  );

  return (
    <Card className="grid gap-3">
      <strong>Página Quiénes Somos</strong>
      {msg ? <p role="status" className="text-ok text-(length:--text-sm) m-0 font-semibold">{msg}</p> : null}
      <form onSubmit={onSubmit} className="grid gap-3">
        <Input name="frase" defaultValue={data?.frase ?? ''} placeholder="Frase corta (eslogan)" aria-label="Frase" className="w-full" />
        <Input name="titulo" defaultValue={data?.titulo ?? ''} placeholder="Título" aria-label="Título" className="w-full" />
        {area('descripcion', data?.descripcion ?? null, 'Descripción (HTML permitido)', 5)}
        {area('mision', data?.mision ?? null, 'Misión')}
        {area('vision', data?.vision ?? null, 'Visión')}
        {area('objetivos', data?.objetivos ?? null, 'Objetivos')}
        <div><Button type="submit" disabled={busy}>Guardar</Button></div>
      </form>
    </Card>
  );
}
