import type { Metadata } from 'next';
import { getTheme, t } from '@/lib/theme';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { CartView } from './CartView';

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getTheme();
  return { title: `${t(theme, 'cart.title')} — ${t(theme, 'site.name')}` };
}

export default async function CartPage() {
  const theme = await getTheme();

  return (
    <>
      <SiteHeader theme={theme} />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.4rem' }}>{t(theme, 'cart.title')}</h1>
        <CartView
          labels={{
            title: t(theme, 'cart.title'),
            empty: t(theme, 'cart.empty'),
            browse: t(theme, 'cart.browse'),
            qty: t(theme, 'cart.qty'),
            remove: t(theme, 'cart.remove'),
            total: t(theme, 'cart.total'),
            checkout: t(theme, 'cart.checkout'),
          }}
        />
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
