'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@servmaq/ui';

export function BannerSlot({ slot, image, link }: { slot: string; image: string | null; link: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    await fetch(`/api/admin/cms/banners/${slot}`, { method: 'PATCH', body: fd });
    setBusy(false);
    router.refresh();
  }

  async function clear() {
    if (!window.confirm(`¿Vaciar el banner ${slot}?`)) return;
    const fd = new FormData();
    fd.set('clear', 'true');
    await fetch(`/api/admin/cms/banners/${slot}`, { method: 'PATCH', body: fd });
    router.refresh();
  }

  return (
    <Card className="grid gap-3">
      <div className="flex justify-between items-baseline">
        <strong className="uppercase text-(length:--text-sm) tracking-wide">{slot}</strong>
        {image ? (
          <Button size="sm" variant="ghost" onClick={clear}>Vaciar</Button>
        ) : null}
      </div>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="w-full aspect-[21/9] object-cover rounded-(--radius-sm) border border-line" />
      ) : (
        <div className="w-full aspect-[21/9] rounded-(--radius-sm) border border-dashed border-line grid place-items-center text-ink-muted text-(length:--text-sm)">
          Sin imagen
        </div>
      )}
      <form onSubmit={save} encType="multipart/form-data" className="grid gap-2">
        <input type="file" name="photo" accept="image/*" className="text-(length:--text-sm)" />
        <Input name="link" defaultValue={link ?? ''} placeholder="Enlace (opcional)" aria-label="Enlace" className="w-full" />
        <div><Button size="sm" type="submit" disabled={busy}>Guardar</Button></div>
      </form>
    </Card>
  );
}
