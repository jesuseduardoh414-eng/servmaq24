import Link from 'next/link';
import Image from 'next/image';
import type { ProductCard as ProductCardDto } from '@servmaq/types';
import type { Theme } from '@servmaq/config';
import { t } from '@/lib/theme';
import { formatPrice } from '@/lib/format';

/** Precio respetando el Modo Cotización del tema. */
export function Price({ theme, price, oldPrice }: { theme: Theme; price: number | null; oldPrice?: number | null }) {
  if (theme.tokens.quoteMode || price === null) {
    return (
      <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
        {t(theme, 'product.price.onQuote')}
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', gap: '.5rem', alignItems: 'baseline' }}>
      <strong style={{ color: 'var(--color-primary)', fontSize: 'var(--text-lg)' }}>
        {formatPrice(price)}
      </strong>
      {oldPrice ? (
        <s style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          {formatPrice(oldPrice)}
        </s>
      ) : null}
    </span>
  );
}

export function ProductCard({ product, theme }: { product: ProductCardDto; theme: Theme }) {
  return (
    <Link
      href={`/productos/${product.slug}`}
      style={{
        textDecoration: 'none',
        color: 'var(--color-text)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '4 / 3', background: 'var(--color-bg)' }}>
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            style={{ objectFit: 'contain' }}
          />
        ) : null}
        {product.isRental ? (
          <span
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: 'var(--color-accent)',
              color: 'var(--color-primary-fg)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              padding: '.15em .6em',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {t(theme, 'product.rental.badge')}
          </span>
        ) : null}
      </div>
      <div style={{ padding: '.85rem 1rem', display: 'grid', gap: '.35rem' }}>
        {product.brand ? (
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{product.brand}</span>
        ) : null}
        <span style={{ fontWeight: 600, lineHeight: 1.3 }}>{product.name}</span>
        <Price theme={theme} price={product.price} oldPrice={product.oldPrice} />
        {!product.inStock ? (
          <span style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            {t(theme, 'product.outOfStock')}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
