import type { Metadata } from 'next';
import type { ProductCard } from '@maqserv/types';
import { parseProductSlug } from '@maqserv/config';
import { getTheme, t } from '@/lib/theme';
import { getSessionUser } from '@/lib/session';
import { getProduct } from '@/lib/api';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { QuoteForm } from './QuoteForm';

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getTheme();
  return { title: `${t(theme, 'quote.form.title')} — ${t(theme, 'site.name')}` };
}

type Search = { producto?: string };

export default async function QuotePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const [theme, user] = await Promise.all([getTheme(), getSessionUser()]);

  // ?producto= acepta id numérico o slug nombre-id
  let product: ProductCard | null = null;
  if (sp.producto) {
    const id = /^\d+$/.test(sp.producto) ? Number(sp.producto) : parseProductSlug(sp.producto);
    if (id) product = await getProduct(id).catch(() => null);
  }

  return (
    <>
      <SiteHeader theme={theme} />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <header style={{ textAlign: 'center', marginBottom: '1.6rem', display: 'grid', gap: '.4rem' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)' }}>{t(theme, 'quote.form.title')}</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{t(theme, 'quote.form.subtitle')}</p>
        </header>
        <QuoteForm
          product={product}
          user={user}
          labels={{
            name: t(theme, 'auth.field.name'),
            email: t(theme, 'auth.field.email'),
            phone: t(theme, 'checkout.field.phone'),
            company: t(theme, 'quote.form.company'),
            region: t(theme, 'quote.form.region'),
            industry: t(theme, 'quote.form.industry'),
            address: t(theme, 'quote.form.address'),
            comments: t(theme, 'quote.form.comments'),
            qty: t(theme, 'quote.form.qty'),
            days: t(theme, 'quote.form.days'),
            submit: t(theme, 'quote.form.submit'),
            successTitle: t(theme, 'quote.form.success.title'),
            successBody: t(theme, 'quote.form.success.body'),
            numberLabel: t(theme, 'quote.form.number'),
            emptyCart: t(theme, 'cart.empty'),
            browse: t(theme, 'cart.browse'),
          }}
        />
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
