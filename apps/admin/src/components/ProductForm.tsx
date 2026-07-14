'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@maqserv/ui';

export interface ProductFormData {
  id?: number;
  name?: string;
  categoryId?: number;
  price?: number;
  oldPrice?: number | null;
  description?: string;
  stock?: number | null;
  brand?: string | null;
  isRental?: boolean;
  rentalFreight?: number | null;
  featured?: boolean;
  lote?: string | null;
  caducidad?: string | null;
  image?: string | null;
}

/** Formulario completo de producto (crear/editar) — multipart con foto. */
export function ProductForm({
  initial,
  categories,
}: {
  initial: ProductFormData;
  categories: Array<{ id: number; name: string }>;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial.id);
  const [isRental, setIsRental] = useState(Boolean(initial.isRental));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const full = { width: '100%' } as const;
  const label = (text: string) => ({ display: 'grid', gap: '.25rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }) as const;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    if (!isRental) {
      fd.delete('isRental');
      fd.delete('rentalFreight');
    } else {
      fd.set('isRental', 'true');
    }
    // checkbox featured → boolean string
    fd.set('featured', fd.get('featured') === 'on' ? 'true' : 'false');
    const res = await fetch(
      isEdit ? `/api/admin/catalog/products/${initial.id}` : '/api/admin/catalog/products',
      { method: isEdit ? 'PATCH' : 'POST', body: fd },
    );
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setError(typeof data?.message === 'string' ? data.message : 'No se pudo guardar');
      return;
    }
    router.push('/productos');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" style={{ display: 'grid', gap: '1rem', maxWidth: 720 }}>
      <Card style={{ display: 'grid', gap: '.8rem' }}>
        <strong>Datos generales</strong>
        <label style={label('')}>Nombre
          <Input name="name" required minLength={2} defaultValue={initial.name ?? ''} style={full} />
        </label>
        <label style={label('')}>Categoría
          <select
            name="categoryId"
            required
            defaultValue={initial.categoryId ?? ''}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', color: 'var(--color-text)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '.5em .8em' }}
          >
            <option value="" disabled>Selecciona…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.8rem' }}>
          <label style={label('')}>Precio
            <Input name="price" type="number" step="0.01" min={0} required defaultValue={initial.price ?? ''} style={full} />
          </label>
          <label style={label('')}>Precio anterior
            <Input name="oldPrice" type="number" step="0.01" min={0} defaultValue={initial.oldPrice ?? ''} style={full} />
          </label>
          <label style={label('')}>Existencias
            <Input name="stock" type="number" min={0} defaultValue={initial.stock ?? ''} style={full} />
          </label>
        </div>
        <label style={label('')}>Marca
          <Input name="brand" defaultValue={initial.brand ?? ''} style={full} />
        </label>
        <label style={label('')}>Descripción
          <textarea
            name="description"
            required
            minLength={4}
            rows={5}
            defaultValue={initial.description ?? ''}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', color: 'var(--color-text)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '.6em .8em', resize: 'vertical' }}
          />
        </label>
        <label style={{ display: 'flex', gap: '.5rem', alignItems: 'center', fontSize: 'var(--text-sm)' }}>
          <input type="checkbox" name="featured" defaultChecked={initial.featured} /> Producto destacado (aparece en la home)
        </label>
      </Card>

      <Card style={{ display: 'grid', gap: '.8rem' }}>
        <strong>Renta</strong>
        <label style={{ display: 'flex', gap: '.5rem', alignItems: 'center', fontSize: 'var(--text-sm)' }}>
          <input type="checkbox" checked={isRental} onChange={(e) => setIsRental(e.target.checked)} /> Disponible en renta
        </label>
        {isRental ? (
          <label style={label('')}>Tarifa de flete por km
            <Input name="rentalFreight" type="number" step="0.01" min={0} defaultValue={initial.rentalFreight ?? ''} style={full} />
          </label>
        ) : null}
      </Card>

      <Card style={{ display: 'grid', gap: '.8rem' }}>
        <strong>Información técnica / médica</strong>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <label style={label('')}>Lote
            <Input name="lote" defaultValue={initial.lote ?? ''} style={full} />
          </label>
          <label style={label('')}>Fecha de caducidad
            <Input name="caducidad" type="date" defaultValue={initial.caducidad ?? ''} style={full} />
          </label>
        </div>
      </Card>

      <Card style={{ display: 'grid', gap: '.8rem' }}>
        <strong>Foto</strong>
        {initial.image ? (
          <img src={initial.image} alt="" style={{ width: 120, height: 120, objectFit: 'contain', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }} />
        ) : null}
        <input type="file" name="photo" accept="image/png,image/jpeg,image/webp,image/avif" style={{ fontSize: 'var(--text-sm)' }} />
      </Card>

      {error ? <p role="alert" style={{ color: 'var(--color-error)', margin: 0, fontSize: 'var(--text-sm)' }}>{error}</p> : null}
      <div style={{ display: 'flex', gap: '.6rem' }}>
        <Button type="submit" disabled={busy}>{isEdit ? 'Guardar cambios' : 'Crear producto'}</Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/productos')}>Cancelar</Button>
      </div>
    </form>
  );
}
