import type { Metadata } from 'next';
import { Button, Input } from '@servmaq/ui';
import { getTheme, t } from '@/lib/theme';
import { getProducts, getCategories } from '@/lib/api';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { ProductCard } from '@/components/ProductCard';
import { Pagination } from '@/components/Pagination';
import Link from 'next/link';

type Search = { q?: string; categoria?: string; page?: string };

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getTheme();
  return {
    title: `${t(theme, 'catalog.title')} — ${t(theme, 'site.name')}`,
  };
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1) || 1;
  const [theme, categories, result] = await Promise.all([
    getTheme(),
    getCategories(),
    getProducts({ page, search: sp.q, category: sp.categoria }),
  ]);

  const makeHref = (p: number) => {
    const q = new URLSearchParams();
    if (sp.q) q.set('q', sp.q);
    if (sp.categoria) q.set('categoria', sp.categoria);
    if (p > 1) q.set('page', String(p));
    const qs = q.toString();
    return `/productos${qs ? `?${qs}` : ''}`;
  };

  return (
    <>
      <SiteHeader theme={theme} />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.2rem' }}>
          {t(theme, 'catalog.title')}
        </h1>

        {/* Búsqueda (GET nativo: funciona sin JS, SSR-friendly) */}
        <form action="/productos" method="get" style={{ display: 'flex', gap: '.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <Input
            type="search"
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder={t(theme, 'catalog.search.placeholder')}
            aria-label={t(theme, 'catalog.search.placeholder')}
            style={{ flex: '1 1 240px' }}
          />
          {sp.categoria ? <input type="hidden" name="categoria" value={sp.categoria} /> : null}
          <Button type="submit">{t(theme, 'catalog.search.button')}</Button>
        </form>

        {/* Filtro por categoría */}
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.6rem' }}>
          <CategoryChip href="/productos" active={!sp.categoria} label={t(theme, 'catalog.filter.all')} />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              href={`/productos?categoria=${c.slug}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ''}`}
              active={sp.categoria === c.slug}
              label={`${c.name} (${c.productCount})`}
            />
          ))}
        </div>

        {result.items.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '2rem 0' }}>{t(theme, 'catalog.empty')}</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1.2rem',
            }}
          >
            {result.items.map((p) => (
              <ProductCard key={p.id} product={p} theme={theme} />
            ))}
          </div>
        )}

        <Pagination page={result.page} pages={result.pages} makeHref={makeHref} theme={theme} />
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}

function CategoryChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: 'none',
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        padding: '.35em .9em',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid',
        borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
        background: active ? 'var(--color-primary)' : 'var(--color-surface)',
        color: active ? 'var(--color-primary-fg)' : 'var(--color-text)',
      }}
    >
      {label}
    </Link>
  );
}
