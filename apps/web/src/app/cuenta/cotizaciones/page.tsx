import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { QuoteSummary } from '@servmaq/types';
import { getTheme, t } from '@/lib/theme';
import { SESSION_COOKIE } from '@/lib/session';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { formatPrice } from '@/lib/format';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getTheme();
  return { title: `${t(theme, 'account.quotes.title')} — ${t(theme, 'site.name')}` };
}

export default async function MyQuotesPage() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) redirect('/login');

  const [theme, res] = await Promise.all([
    getTheme(),
    fetch(`${API_URL}/quotes/mine`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
  ]);
  if (res.status === 401) redirect('/login');
  const quotes = (await res.json().catch(() => [])) as QuoteSummary[];

  const statusLabel = (s: string) =>
    s === 'completed' ? t(theme, 'quote.status.completed') : t(theme, 'quote.status.pending');

  return (
    <>
      <SiteHeader theme={theme} />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.4rem' }}>
          {t(theme, 'account.quotes.title')}
        </h1>
        {quotes.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>{t(theme, 'account.quotes.empty')}</p>
        ) : (
          <div style={{ display: 'grid', gap: '.8rem' }}>
            {quotes.map((q) => (
              <div
                key={q.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)',
                  padding: '1rem 1.2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <span style={{ display: 'grid', gap: '.15rem' }}>
                  <strong>{q.quoteNumber}</strong>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                    {q.createdAt ? new Date(q.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  </span>
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 700,
                    padding: '.25em .8em',
                    borderRadius: '999px',
                    background: q.status === 'completed' ? 'var(--color-success)' : 'var(--color-warning)',
                    color: 'var(--color-primary-fg)',
                  }}
                >
                  {statusLabel(q.status)}
                </span>
                <strong style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatPrice(q.total)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
