'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ProductCard as ProductCardDto } from '@maqserv/types';
import type { Theme } from '@maqserv/config';
import { t } from '@/lib/theme';
import { ProductCard } from '@/components/ProductCard';

/**
 * Grid de productos destacados con tabs por categoría (diseño "Productos -
 * Destacados y Catálogo"). Datos reales de la BD; filtrado en cliente. La card
 * (compartida con el catálogo) trae carrito y wishlist; aquí se precarga qué
 * productos ya están en favoritos para pintar el corazón.
 */
export function HomeProductGrid({
  products,
  categories,
  theme,
  align = 'center',
  showTabs = true,
}: {
  products: ProductCardDto[];
  categories: Array<{ slug: string; name: string }>;
  theme: Theme;
  align?: 'left' | 'center';
  showTabs?: boolean;
}) {
  const [tab, setTab] = useState<string>('all');
  const [wish, setWish] = useState<Set<number>>(new Set());

  const tabs = useMemo(() => {
    const present = new Set(products.map((p) => p.categorySlug).filter(Boolean) as string[]);
    return categories.filter((c) => present.has(c.slug));
  }, [products, categories]);

  const visible = tab === 'all' ? products : products.filter((p) => p.categorySlug === tab);

  useEffect(() => {
    fetch('/api/proxy/wishlist/ids')
      .then((r) => (r.ok ? r.json() : []))
      .then((ids: number[]) => Array.isArray(ids) && setWish(new Set(ids)))
      .catch(() => {});
  }, []);

  const tabBtn = (active: boolean): React.CSSProperties => ({
    border: active ? 'none' : '1px solid var(--color-border)',
    background: active ? 'var(--color-primary)' : 'var(--color-surface)',
    color: active ? 'var(--color-primary-fg)' : 'var(--color-text)',
    fontWeight: active ? 700 : 600,
    fontSize: '13.5px',
    padding: '11px 20px',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  });

  return (
    <>
      {showTabs ? (
        <div style={{ display: 'flex', justifyContent: align === 'left' ? 'flex-start' : 'center', gap: 10, flexWrap: 'wrap', margin: '28px 0 34px' }}>
          <button type="button" style={tabBtn(tab === 'all')} onClick={() => setTab('all')}>
            {t(theme, 'home.featured.filterAll')}
          </button>
          {tabs.map((c) => (
            <button key={c.slug} type="button" style={tabBtn(tab === c.slug)} onClick={() => setTab(c.slug)}>
              {c.name}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ height: 34 }} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 22 }}>
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} theme={theme} initialFaved={wish.has(p.id)} />
        ))}
      </div>
    </>
  );
}
