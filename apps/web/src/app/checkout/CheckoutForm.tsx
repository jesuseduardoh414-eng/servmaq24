'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@servmaq/ui';
import type { AuthUser, CheckoutResult, CouponCheck, PaymentMethod, PaymentMethodId } from '@servmaq/types';
import { cartLineTotal, useCart } from '@/components/CartProvider';
import { formatPrice } from '@/lib/format';

export function CheckoutForm({
  user,
  methods,
  labels,
}: {
  user: AuthUser;
  methods: PaymentMethod[];
  labels: {
    contactTitle: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
    note: string;
    methodTitle: string;
    summaryTitle: string;
    submit: string;
    emptyCart: string;
    browse: string;
    total: string;
    couponLabel: string;
    couponApply: string;
    couponApplied: string;
    couponInvalid: string;
    discount: string;
  };
}) {
  const cart = useCart();
  const router = useRouter();
  const available = methods.filter((m) => m.available);
  const [method, setMethod] = useState<PaymentMethodId>(available[0]?.id ?? 'transferencia');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<CouponCheck | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  async function applyCoupon() {
    setCouponError(null);
    setCoupon(null);
    const code = couponInput.trim();
    if (!code) return;
    const res = await fetch('/api/proxy/orders/coupon/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal: cart.total }),
    });
    const data = (await res.json().catch(() => null)) as CouponCheck | null;
    if (res.ok && data?.valid) setCoupon(data);
    else setCouponError(labels.couponInvalid);
  }

  const discount = coupon?.valid ? coupon.discount : 0;
  const finalTotal = Math.max(0, cart.total - discount);

  if (cart.items.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)' }}>{labels.emptyCart}</p>;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.items.map((i) => ({
          productId: i.productId,
          qty: i.qty,
          ...(i.rental ? { startDate: i.rental.startDate, endDate: i.rental.endDate } : {}),
        })),
        method,
        ...(coupon?.valid ? { couponCode: coupon.code } : {}),
        customer: {
          name: String(form.get('name') ?? ''),
          email: String(form.get('email') ?? ''),
          phone: String(form.get('phone') ?? ''),
          address: String(form.get('address') ?? ''),
          city: String(form.get('city') ?? ''),
          zip: String(form.get('zip') ?? ''),
        },
        note: String(form.get('note') ?? '') || undefined,
      }),
    });
    const data = (await res.json().catch(() => null)) as CheckoutResult | { message?: string } | null;
    setLoading(false);
    if (!res.ok || !data || !('order' in data)) {
      setError((data as { message?: string } | null)?.message ?? 'No pudimos procesar tu pedido');
      return;
    }
    cart.clear();
    if (data.redirectUrl) {
      window.location.href = data.redirectUrl; // MercadoPago Checkout Pro
      return;
    }
    router.push(`/pedido/${data.order.orderNumber}`);
  }

  const fieldStyle = { width: '100%' } as const;

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1.2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>
      <Card style={{ display: 'grid', gap: '.8rem' }}>
        <h2 style={{ fontSize: 'var(--text-lg)' }}>{labels.contactTitle}</h2>
        <Input name="name" required defaultValue={user.name} placeholder={labels.name} aria-label={labels.name} autoComplete="name" style={fieldStyle} />
        <Input name="email" type="email" required defaultValue={user.email} placeholder={labels.email} aria-label={labels.email} autoComplete="email" style={fieldStyle} />
        <Input name="phone" required minLength={7} defaultValue={user.phone ?? ''} placeholder={labels.phone} aria-label={labels.phone} autoComplete="tel" style={fieldStyle} />
        <Input name="address" required minLength={4} defaultValue={user.address ?? ''} placeholder={labels.address} aria-label={labels.address} autoComplete="street-address" style={fieldStyle} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <Input name="city" required defaultValue={user.city ?? ''} placeholder={labels.city} aria-label={labels.city} style={fieldStyle} />
          <Input name="zip" required defaultValue={user.zip ?? ''} placeholder={labels.zip} aria-label={labels.zip} autoComplete="postal-code" style={fieldStyle} />
        </div>
        <Input name="note" placeholder={labels.note} aria-label={labels.note} style={fieldStyle} />

        <h2 style={{ fontSize: 'var(--text-lg)', marginTop: '.4rem' }}>{labels.methodTitle}</h2>
        <div style={{ display: 'grid', gap: '.5rem' }}>
          {available.map((m) => (
            <label
              key={m.id}
              style={{
                display: 'flex',
                gap: '.6rem',
                alignItems: 'center',
                border: '1px solid',
                borderColor: method === m.id ? 'var(--color-primary)' : 'var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '.7rem .9rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="method"
                value={m.id}
                checked={method === m.id}
                onChange={() => setMethod(m.id)}
              />
              <span style={{ fontWeight: 600 }}>{m.title}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card style={{ display: 'grid', gap: '.7rem' }}>
        <h2 style={{ fontSize: 'var(--text-lg)' }}>{labels.summaryTitle}</h2>
        {cart.items.map((i) => (
          <div key={i.productId} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: 'var(--text-sm)' }}>
            <span>
              {i.name} × {i.qty}
              {i.rental ? <em style={{ color: 'var(--color-text-muted)' }}> ({i.rental.days} días)</em> : null}
            </span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPrice(cartLineTotal(i))}</span>
          </div>
        ))}
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '.2rem 0' }} />

        {/* Cupón: previsualiza el descuento; el server lo recalcula al confirmar */}
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <Input
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder={labels.couponLabel}
            aria-label={labels.couponLabel}
            style={{ flex: 1 }}
          />
          <Button type="button" variant="outline" onClick={applyCoupon}>{labels.couponApply}</Button>
        </div>
        {couponError ? (
          <p role="alert" style={{ color: 'var(--color-error)', margin: 0, fontSize: 'var(--text-sm)' }}>{couponError}</p>
        ) : null}
        {coupon?.valid ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--color-success)' }}>
            <span>{labels.couponApplied} ({coupon.code}{coupon.label ? ` · ${coupon.label}` : ''})</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>−{formatPrice(coupon.discount)}</span>
          </div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-lg)' }}>
          <strong>{labels.total}</strong>
          <strong style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {formatPrice(finalTotal)}
          </strong>
        </div>
        {error ? (
          <p role="alert" style={{ color: 'var(--color-error)', margin: 0, fontSize: 'var(--text-sm)' }}>{error}</p>
        ) : null}
        <Button type="submit" size="lg" disabled={loading}>{labels.submit}</Button>
      </Card>
    </form>
  );
}
