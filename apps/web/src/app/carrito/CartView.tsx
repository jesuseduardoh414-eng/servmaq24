'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button, Card } from '@servmaq/ui';
import { useCart } from '@/components/CartProvider';
import { formatPrice } from '@/lib/format';

/** Vista cliente del carrito. Textos resueltos en el server component. */
export function CartView({
  labels,
}: {
  labels: {
    title: string;
    empty: string;
    browse: string;
    qty: string;
    remove: string;
    total: string;
    checkout: string;
  };
}) {
  const cart = useCart();

  if (cart.items.length === 0) {
    return (
      <div style={{ textAlign: 'center', display: 'grid', gap: '1rem', padding: '3rem 0' }}>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{labels.empty}</p>
        <div>
          <Link href="/productos">
            <Button>{labels.browse}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {cart.items.map((item) => (
        <Card
          key={item.productId}
          style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}
        >
          <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0, background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            {item.image ? (
              <Image src={item.image} alt={item.name} fill sizes="84px" style={{ objectFit: 'contain' }} />
            ) : null}
          </div>
          <div style={{ flex: '1 1 180px', display: 'grid', gap: '.2rem' }}>
            <Link href={`/productos/${item.slug}`} style={{ color: 'var(--color-text)', fontWeight: 600, textDecoration: 'none' }}>
              {item.name}
            </Link>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{formatPrice(item.price)}</span>
          </div>
          <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{labels.qty}</span>
            <Button size="sm" variant="outline" aria-label="-" onClick={() => cart.setQty(item.productId, item.qty - 1)}>−</Button>
            <span style={{ minWidth: '2ch', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{item.qty}</span>
            <Button size="sm" variant="outline" aria-label="+" onClick={() => cart.setQty(item.productId, item.qty + 1)}>+</Button>
          </div>
          <Button size="sm" variant="ghost" onClick={() => cart.remove(item.productId)}>
            {labels.remove}
          </Button>
        </Card>
      ))}

      <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ fontSize: 'var(--text-lg)' }}>
          {labels.total}: <strong style={{ color: 'var(--color-primary)' }}>{formatPrice(cart.total)}</strong>
        </span>
        {/* El checkout llega en el siguiente slice de F2 */}
        <Link href="/checkout">
          <Button size="lg">{labels.checkout}</Button>
        </Link>
      </Card>
    </div>
  );
}
