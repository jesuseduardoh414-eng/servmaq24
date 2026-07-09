import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Theme } from '@servmaq/config';
import { Button } from '@servmaq/ui';
import { getTheme, t } from '@/lib/theme';
import { getProducts, getCategories } from '@/lib/api';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { ProductCard } from '@/components/ProductCard';

/**
 * Home con SECCIONES CONFIGURABLES: qué se muestra y en qué orden lo decide
 * `theme.tokens.sections` (editable desde el admin en F4). Las secciones aún
 * no construidas se omiten sin romper.
 */

function Hero({ theme }: { theme: Theme }) {
  return (
    <section
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '4rem 1.5rem',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: '1rem' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)' }}>{t(theme, 'home.hero.title')}</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-lg)', margin: 0 }}>
          {t(theme, 'home.hero.subtitle')}
        </p>
        <div>
          <Link href="/productos">
            <Button size="lg">{t(theme, 'home.hero.cta')}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

async function CategoriesSection({ theme }: { theme: Theme }) {
  const categories = await getCategories();
  if (categories.length === 0) return null;
  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.2rem' }}>
        {t(theme, 'home.categories.title')}
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '1rem',
        }}
      >
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/productos?categoria=${c.slug}`}
            style={{
              textDecoration: 'none',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              padding: '1rem',
              display: 'grid',
              gap: '.5rem',
              textAlign: 'center',
            }}
          >
            {c.image ? (
              <span style={{ position: 'relative', width: '100%', aspectRatio: '1', display: 'block' }}>
                <Image src={c.image} alt={c.name} fill sizes="150px" style={{ objectFit: 'contain' }} />
              </span>
            ) : null}
            <strong>{c.name}</strong>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              {c.productCount}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function FeaturedSection({ theme }: { theme: Theme }) {
  const { items } = await getProducts({ featured: true });
  const products = items.length > 0 ? items : (await getProducts({})).items;
  if (products.length === 0) return null;
  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '.5rem' }}>
        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.2rem' }}>
          {t(theme, 'home.featured.title')}
        </h2>
        <Link href="/productos" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
          {t(theme, 'home.featured.viewAll')}
        </Link>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1.2rem',
        }}
      >
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} theme={theme} />
        ))}
      </div>
    </section>
  );
}

/** Registro de secciones implementadas; las demás del plan llegan en F1–F4. */
const SECTIONS: Record<string, (props: { theme: Theme }) => Promise<ReactNode> | ReactNode> = {
  'home.hero': Hero,
  'home.categories': CategoriesSection,
  'home.featured-products': FeaturedSection,
};

export default async function Home() {
  const theme = await getTheme();
  const enabled = theme.tokens.sections
    .filter((s) => s.enabled && SECTIONS[s.key])
    .sort((a, b) => a.order - b.order);

  return (
    <>
      <SiteHeader theme={theme} />
      <main>
        {enabled.map((s) => {
          const Section = SECTIONS[s.key];
          return <Section key={s.key} theme={theme} />;
        })}
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
