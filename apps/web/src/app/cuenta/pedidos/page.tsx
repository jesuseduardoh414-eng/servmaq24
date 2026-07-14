import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { OrderSummary } from '@maqserv/types';
import { getTheme, t } from '@/lib/theme';
import { SESSION_COOKIE } from '@/lib/session';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { formatPrice } from '@/lib/format';
import { MyReviews } from './MyReviews';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getTheme();
  return { title: `${t(theme, 'account.orders.title')} — ${t(theme, 'site.name')}` };
}

export default async function MyOrdersPage() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) redirect('/login');

  const [theme, ordersRes] = await Promise.all([
    getTheme(),
    fetch(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
  ]);
  if (ordersRes.status === 401) redirect('/login');
  const orders = (await ordersRes.json().catch(() => [])) as OrderSummary[];

  return (
    <>
      <SiteHeader theme={theme} />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.4rem' }}>
          {t(theme, 'account.orders.title')}
        </h1>
        {orders.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>{t(theme, 'account.orders.empty')}</p>
        ) : (
          <div style={{ display: 'grid', gap: '.8rem' }}>
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/pedido/${o.orderNumber}`}
                style={{
                  textDecoration: 'none',
                  color: 'var(--color-text)',
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
                  <strong>{o.orderNumber}</strong>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                    {' · '}{o.method}{' · '}{o.paymentStatus}
                  </span>
                </span>
                <strong style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatPrice(o.total)}
                </strong>
              </Link>
            ))}
          </div>
        )}

        <MyReviews title="Califica tus compras" />
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
