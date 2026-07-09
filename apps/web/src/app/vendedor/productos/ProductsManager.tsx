'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@servmaq/ui';
import type { Category, VendorProductRow } from '@servmaq/types';
import { formatPrice } from '@/lib/format';

export function ProductsManager({
  products,
  categories,
  labels,
}: {
  products: VendorProductRow[];
  categories: Category[];
  labels: {
    newTitle: string;
    name: string;
    category: string;
    price: string;
    oldPrice: string;
    stock: string;
    brand: string;
    description: string;
    photo: string;
    isRental: string;
    rentalFreight: string;
    create: string;
    created: string;
    deactivate: string;
    empty: string;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRental, setIsRental] = useState(false);
  const full = { width: '100%' } as const;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setLoading(true);
    // multipart directo: el proxy conserva el boundary
    const fd = new FormData(e.currentTarget);
    if (!isRental) {
      fd.delete('isRental');
      fd.delete('rentalFreight');
    } else {
      fd.set('isRental', 'true');
    }
    const res = await fetch('/api/proxy/vendor/products', { method: 'POST', body: fd });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(typeof data?.message === 'string' ? data.message : 'No pudimos publicar el producto');
      return;
    }
    setOk(true);
    (e.target as HTMLFormElement).reset();
    setIsRental(false);
    router.refresh();
  }

  async function deactivate(id: number) {
    await fetch(`/api/proxy/vendor/products/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div style={{ display: 'grid', gap: '1.4rem' }}>
      <Card style={{ display: 'grid', gap: '.8rem' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{labels.newTitle}</h2>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '.8rem' }} encType="multipart/form-data">
          <Input name="name" required minLength={2} placeholder={labels.name} aria-label={labels.name} style={full} />
          <select
            name="categoryId"
            required
            aria-label={labels.category}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-base)',
              color: 'var(--color-text)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '.5em .8em',
            }}
          >
            <option value="">{labels.category}…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.8rem' }}>
            <Input name="price" type="number" step="0.01" min={0} required placeholder={labels.price} aria-label={labels.price} style={full} />
            <Input name="oldPrice" type="number" step="0.01" min={0} placeholder={labels.oldPrice} aria-label={labels.oldPrice} style={full} />
            <Input name="stock" type="number" min={0} placeholder={labels.stock} aria-label={labels.stock} style={full} />
          </div>
          <Input name="brand" placeholder={labels.brand} aria-label={labels.brand} style={full} />
          <Input name="description" required minLength={4} placeholder={labels.description} aria-label={labels.description} style={full} />
          <label style={{ display: 'flex', gap: '.5rem', alignItems: 'center', fontSize: 'var(--text-sm)' }}>
            <input type="checkbox" name="isRental" checked={isRental} onChange={(e) => setIsRental(e.target.checked)} />
            {labels.isRental}
          </label>
          {isRental ? (
            <Input name="rentalFreight" type="number" step="0.01" min={0} placeholder={labels.rentalFreight} aria-label={labels.rentalFreight} style={full} />
          ) : null}
          <label style={{ display: 'grid', gap: '.3rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            {labels.photo}
            <input type="file" name="photo" accept="image/png,image/jpeg,image/webp,image/avif" />
          </label>
          {error ? <p role="alert" style={{ color: 'var(--color-error)', margin: 0, fontSize: 'var(--text-sm)' }}>{error}</p> : null}
          {ok ? <p role="status" style={{ color: 'var(--color-success)', margin: 0, fontSize: 'var(--text-sm)' }}>{labels.created}</p> : null}
          <div><Button type="submit" disabled={loading}>{labels.create}</Button></div>
        </form>
      </Card>

      {products.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{labels.empty}</p>
      ) : (
        <div style={{ display: 'grid', gap: '.7rem' }}>
          {products.map((p) => (
            <Card key={p.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', opacity: p.status === 1 ? 1 : 0.55 }}>
              <div style={{ position: 'relative', width: 64, height: 64, background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                {p.image ? <Image src={p.image} alt={p.name} fill sizes="64px" style={{ objectFit: 'contain' }} /> : null}
              </div>
              <div style={{ flex: '1 1 180px', display: 'grid', gap: '.15rem' }}>
                <strong>{p.name}</strong>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                  {formatPrice(p.price)}{p.stock !== null ? ` · stock ${p.stock}` : ''}
                </span>
              </div>
              {p.status === 1 ? (
                <Button size="sm" variant="ghost" onClick={() => deactivate(p.id)}>{labels.deactivate}</Button>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
