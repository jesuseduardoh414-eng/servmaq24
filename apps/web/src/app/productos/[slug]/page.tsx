import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { parseProductSlug, productSlug } from '@servmaq/config';
import type { ProductDetail } from '@servmaq/types';
import { Button } from '@servmaq/ui';
import { getTheme, t } from '@/lib/theme';
import { getProduct, getSiteSettings } from '@/lib/api';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { Price } from '@/components/ProductCard';
import { AddToCart } from '@/components/AddToCart';

type Params = { slug: string };

async function fetchBySlug(slug: string): Promise<ProductDetail | null> {
  const id = parseProductSlug(slug);
  if (!id) return null;
  try {
    return await getProduct(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const [theme, product] = await Promise.all([getTheme(), fetchBySlug(slug)]);
  if (!product) return { title: t(theme, 'site.name') };

  const description = (product.metaDescription ?? stripHtml(product.description)).slice(0, 160);
  const canonical = `/productos/${productSlug(product.name, product.id)}`;
  return {
    title: `${product.metaTitle ?? product.name} — ${t(theme, 'site.name')}`,
    description,
    alternates: { canonical },
    openGraph: {
      title: product.name,
      description,
      images: product.image ? [product.image] : [],
      type: 'website',
    },
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [theme, product] = await Promise.all([getTheme(), fetchBySlug(slug)]);
  if (!product) notFound();

  const settings = await getSiteSettings();
  const quoteMode = theme.tokens.quoteMode;
  const description = stripHtml(product.description);

  // JSON-LD Product (+ Offer solo si el precio es público)
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: description.slice(0, 500),
    image: [product.image, ...product.gallery].filter(Boolean),
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    ...(!quoteMode && product.price !== null
      ? {
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'MXN',
            availability: product.inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          },
        }
      : {}),
  };

  const inquiryHref = settings.email
    ? `mailto:${settings.email}?subject=${encodeURIComponent(`${t(theme, 'product.cta.quote')}: ${product.name}`)}`
    : null;

  const medicalRows: Array<[string, string | null]> = [
    [t(theme, 'product.medical.lote'), product.medical.lote],
    [t(theme, 'product.medical.caducidad'), product.medical.caducidad],
  ];

  return (
    <>
      <SiteHeader theme={theme} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <nav style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '1.2rem' }}>
          <Link href="/" style={{ color: 'inherit' }}>{t(theme, 'nav.home')}</Link>
          {' / '}
          <Link href="/productos" style={{ color: 'inherit' }}>{t(theme, 'nav.products')}</Link>
          {product.categoryName && product.categorySlug ? (
            <>
              {' / '}
              <Link href={`/productos?categoria=${product.categorySlug}`} style={{ color: 'inherit' }}>
                {product.categoryName}
              </Link>
            </>
          ) : null}
        </nav>

        <article style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* Galería */}
          <div style={{ display: 'grid', gap: '.8rem' }}>
            <div
              style={{
                position: 'relative',
                aspectRatio: '4 / 3',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              {product.image ? (
                <Image src={product.image} alt={product.name} fill priority sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'contain' }} />
              ) : null}
            </div>
            {product.gallery.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '.6rem' }}>
                {product.gallery.map((src) => (
                  <div key={src} style={{ position: 'relative', aspectRatio: '1', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <Image src={src} alt={product.name} fill sizes="90px" style={{ objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Info */}
          <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
            {product.brand ? (
              <span style={{ color: 'var(--color-text-muted)' }}>{product.brand}</span>
            ) : null}
            <h1 style={{ fontSize: 'var(--text-2xl)', lineHeight: 1.2 }}>{product.name}</h1>

            <div style={{ display: 'flex', gap: '.7rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <Price theme={theme} price={product.price} oldPrice={product.oldPrice} />
              {product.isRental ? (
                <span style={{ background: 'var(--color-accent)', color: 'var(--color-primary-fg)', fontSize: 'var(--text-sm)', fontWeight: 600, padding: '.2em .7em', borderRadius: 'var(--radius-sm)' }}>
                  {t(theme, 'product.rental.badge')}
                </span>
              ) : null}
              {!product.inStock ? (
                <span style={{ color: 'var(--color-error)', fontWeight: 600 }}>{t(theme, 'product.outOfStock')}</span>
              ) : null}
            </div>

            {/* CTAs: carrito (oculto en quoteMode) + cotización (flujo RFQ real)
                + contacto por correo como secundario. */}
            <div style={{ display: 'flex', gap: '.7rem', flexWrap: 'wrap' }}>
              {!quoteMode && product.price !== null && product.inStock ? (
                <AddToCart
                  item={{
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                  }}
                  label={t(theme, 'product.cta.addToCart')}
                  addedLabel={t(theme, 'cart.added')}
                />
              ) : null}
              {quoteMode || product.isRental || product.price === null ? (
                <Link href={`/cotizar?producto=${product.slug}`} style={{ textDecoration: 'none' }}>
                  <Button size="lg">{t(theme, 'product.cta.quote')}</Button>
                </Link>
              ) : null}
              {inquiryHref && !quoteMode ? (
                <a href={inquiryHref} style={{ textDecoration: 'none' }}>
                  <Button size="lg" variant="ghost">{t(theme, 'product.cta.inquiry')}</Button>
                </a>
              ) : null}
            </div>

            <div
              style={{ color: 'var(--color-text)', lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />

            {/* Ficha técnica / campos médicos */}
            {(medicalRows.some(([, v]) => v) || product.medical.fichaTecnica || product.medical.certificacionDc3) ? (
              <section
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)',
                  padding: '1rem 1.2rem',
                  display: 'grid',
                  gap: '.5rem',
                }}
              >
                <h2 style={{ fontSize: 'var(--text-lg)' }}>{t(theme, 'product.medical.title')}</h2>
                {medicalRows.filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
                {product.medical.fichaTecnica ? (
                  <a href={product.medical.fichaTecnica} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                    {t(theme, 'product.medical.ficha')}
                  </a>
                ) : null}
                {product.medical.certificacionDc3 ? (
                  <a href={product.medical.certificacionDc3} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                    {t(theme, 'product.medical.dc3')}
                  </a>
                ) : null}
              </section>
            ) : null}
          </div>
        </article>
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
