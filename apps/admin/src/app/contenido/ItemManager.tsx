'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@servmaq/ui';

interface Item {
  id: number;
  title: string;
  text: string;
  image: string | null;
}

/** CRUD compacto para colecciones título+texto+foto (servicios, why-choose-us). */
export function ItemManager({ apiPath, heading, items }: { apiPath: string; heading: string; items: Item[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>, id?: number) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    await fetch(id ? `/api/admin/${apiPath}/${id}` : `/api/admin/${apiPath}`, {
      method: id ? 'PATCH' : 'POST',
      body: fd,
    });
    setBusy(false);
    setEditing(null);
    if (!id) (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  async function remove(id: number) {
    if (!window.confirm('¿Eliminar este elemento?')) return;
    await fetch(`/api/admin/${apiPath}/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  const fields = (item?: Item) => (
    <>
      <Input name="title" required minLength={2} defaultValue={item?.title ?? ''} placeholder="Título" aria-label="Título" className="w-full" />
      <Input name="text" required minLength={2} defaultValue={item?.text ?? ''} placeholder="Texto" aria-label="Texto" className="w-full" />
      <input type="file" name="photo" accept="image/*" className="text-(length:--text-sm)" />
    </>
  );

  return (
    <section className="grid gap-4">
      <h2 className="font-head text-(length:--text-xl) text-ink">{heading}</h2>
      <Card className="grid gap-3">
        <strong>Nuevo</strong>
        <form onSubmit={(e) => save(e)} encType="multipart/form-data" className="grid gap-3">
          {fields()}
          <div><Button type="submit" disabled={busy}>Agregar</Button></div>
        </form>
      </Card>
      {items.map((item) => (
        <Card key={item.id} className="grid gap-2">
          {editing === item.id ? (
            <form onSubmit={(e) => save(e, item.id)} encType="multipart/form-data" className="grid gap-3">
              {fields(item)}
              <div className="flex gap-2">
                <Button size="sm" type="submit" disabled={busy}>Guardar</Button>
                <Button size="sm" type="button" variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              </div>
            </form>
          ) : (
            <div className="flex gap-4 items-center flex-wrap">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt="" className="w-14 h-14 object-contain bg-page rounded-(--radius-sm)" />
              ) : null}
              <div className="flex-1 min-w-40 grid gap-1">
                <strong>{item.title}</strong>
                <span className="text-ink-muted text-(length:--text-sm)">{item.text}</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditing(item.id)}>Editar</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(item.id)}>Eliminar</Button>
            </div>
          )}
        </Card>
      ))}
    </section>
  );
}
