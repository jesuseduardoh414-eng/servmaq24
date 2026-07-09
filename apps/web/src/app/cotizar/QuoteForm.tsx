'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Input } from '@servmaq/ui';
import type { AuthUser, ProductCard, QuoteDetail } from '@servmaq/types';
import { useCart } from '@/components/CartProvider';

/**
 * Solicitud de cotización (B2B). Items:
 *  - con `product` (viene de /cotizar?producto=id): ese producto + qty/días
 *  - sin producto: los items del carrito
 * Funciona para invitados; si hay sesión se prellenan los datos.
 */
export function QuoteForm({
  product,
  user,
  labels,
}: {
  product: ProductCard | null;
  user: AuthUser | null;
  labels: {
    name: string;
    email: string;
    phone: string;
    company: string;
    region: string;
    industry: string;
    address: string;
    comments: string;
    qty: string;
    days: string;
    submit: string;
    successTitle: string;
    successBody: string;
    numberLabel: string;
    emptyCart: string;
    browse: string;
  };
}) {
  const cart = useCart();
  const [qty, setQty] = useState(1);
  const [days, setDays] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<QuoteDetail | null>(null);

  const items = product
    ? [{ productId: product.id, qty, ...(product.isRental ? { days } : {}) }]
    : cart.items.map((i) => ({ productId: i.productId, qty: i.qty }));

  if (done) {
    return (
      <Card style={{ maxWidth: 520, margin: '0 auto', display: 'grid', gap: '.8rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-success)' }}>{labels.successTitle}</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{labels.successBody}</p>
        <p style={{ margin: 0 }}>
          {labels.numberLabel}: <strong style={{ color: 'var(--color-primary)' }}>{done.quoteNumber}</strong>
        </p>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', display: 'grid', gap: '1rem' }}>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{labels.emptyCart}</p>
        <div>
          <Link href="/productos"><Button>{labels.browse}</Button></Link>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/cotizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        customer: {
          name: String(form.get('name') ?? ''),
          email: String(form.get('email') ?? ''),
          phone: String(form.get('phone') ?? ''),
          company: String(form.get('company') ?? '') || undefined,
          region: String(form.get('region') ?? '') || undefined,
          industry: String(form.get('industry') ?? '') || undefined,
        },
        address: String(form.get('address') ?? '') || undefined,
        comments: String(form.get('comments') ?? '') || undefined,
        acquisitionOption: product?.isRental ? 'renta' : 'compra',
      }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok || !data?.quoteNumber) {
      setError(typeof data?.message === 'string' ? data.message : 'No pudimos enviar tu solicitud');
      return;
    }
    if (!product) cart.clear();
    setDone(data as QuoteDetail);
  }

  const full = { width: '100%' } as const;

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1.2rem', maxWidth: 640, margin: '0 auto' }}>
      {product ? (
        <Card style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <strong style={{ flex: '1 1 200px' }}>{product.name}</strong>
          <label style={{ display: 'flex', gap: '.5rem', alignItems: 'center', fontSize: 'var(--text-sm)' }}>
            {labels.qty}
            <Input type="number" min={1} max={999} value={qty} onChange={(e) => setQty(Number(e.target.value) || 1)} style={{ width: 80 }} />
          </label>
          {product.isRental ? (
            <label style={{ display: 'flex', gap: '.5rem', alignItems: 'center', fontSize: 'var(--text-sm)' }}>
              {labels.days}
              <Input type="number" min={1} max={365} value={days} onChange={(e) => setDays(Number(e.target.value) || 1)} style={{ width: 80 }} />
            </label>
          ) : null}
        </Card>
      ) : null}

      <Card style={{ display: 'grid', gap: '.8rem' }}>
        <Input name="name" required minLength={2} defaultValue={user?.name ?? ''} placeholder={labels.name} aria-label={labels.name} style={full} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <Input name="email" type="email" required defaultValue={user?.email ?? ''} placeholder={labels.email} aria-label={labels.email} style={full} />
          <Input name="phone" required minLength={7} defaultValue={user?.phone ?? ''} placeholder={labels.phone} aria-label={labels.phone} style={full} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <Input name="company" placeholder={labels.company} aria-label={labels.company} style={full} />
          <Input name="industry" placeholder={labels.industry} aria-label={labels.industry} style={full} />
        </div>
        <Input name="region" placeholder={labels.region} aria-label={labels.region} style={full} />
        <Input name="address" defaultValue={user?.address ?? ''} placeholder={labels.address} aria-label={labels.address} style={full} />
        <Input name="comments" placeholder={labels.comments} aria-label={labels.comments} style={full} />
        {error ? (
          <p role="alert" style={{ color: 'var(--color-error)', margin: 0, fontSize: 'var(--text-sm)' }}>{error}</p>
        ) : null}
        <Button type="submit" size="lg" disabled={loading}>{labels.submit}</Button>
      </Card>
    </form>
  );
}
