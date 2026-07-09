'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@servmaq/ui';

export interface SectorData {
  id: number;
  title: string;
  description: string | null;
  trayectoria: string | null;
  esencia: string | null;
  servicios: string | null;
  excelencia: string | null;
  serviciosLista: string | null;
  image: string | null;
}

export function SectorForm({ data }: { data: SectorData }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/cms/sectors/${data.id}`, { method: 'PATCH', body: fd });
    setBusy(false);
    setMsg(res.ok ? 'Sector guardado' : 'Error al guardar');
    router.refresh();
  }

  const area = (name: string, value: string | null, placeholder: string, rows = 4) => (
    <label className="grid gap-1 text-(length:--text-sm) text-ink-muted">
      {placeholder}
      <textarea
        name={name}
        rows={rows}
        defaultValue={value ?? ''}
        className="font-body text-(length:--text-base) text-ink bg-panel border border-line rounded-(--radius-md) px-3 py-2 resize-y"
      />
    </label>
  );

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" className="grid gap-4 max-w-3xl">
      {msg ? <p role="status" className="text-ok font-semibold text-(length:--text-sm) m-0">{msg}</p> : null}

      <Card className="grid gap-3">
        <strong>Datos generales</strong>
        <label className="grid gap-1 text-(length:--text-sm) text-ink-muted">
          Título
          <Input name="title" required minLength={2} defaultValue={data.title} className="w-full" />
        </label>
        {area('description', data.description, 'Descripción (aparece en la tarjeta de la home y arriba de la página)')}
        {data.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.image} alt="" className="w-52 aspect-[16/9] object-cover rounded-(--radius-sm)" />
        ) : null}
        <label className="grid gap-1 text-(length:--text-sm) text-ink-muted">
          Imagen principal
          <input type="file" name="image" accept="image/*" />
        </label>
      </Card>

      <Card className="grid gap-3">
        <strong>Bloques de la página del sector (HTML permitido)</strong>
        {area('trayectoria', data.trayectoria, 'Trayectoria')}
        {area('esencia', data.esencia, 'Esencia')}
        {area('servicios', data.servicios, 'Servicios (texto)')}
        {area('excelencia', data.excelencia, 'Excelencia')}
        {area('serviciosLista', data.serviciosLista, 'Lista de servicios (uno por línea)', 5)}
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>Guardar sector</Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/sectores')}>Volver</Button>
      </div>
    </form>
  );
}
