import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { VendorOrderRow } from '@servmaq/types';
import { getTheme, t } from '@/lib/theme';
import { SESSION_COOKIE } from '@/lib/session';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { formatPrice } from '@/lib/format';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getTheme();
  return { title: `${t(theme, 'vendor.panel.orders')} — ${t(theme, 'site.name')}` };
}

export default async function VendorOrdersPage() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) redirect('/login');

  const [theme, res] = await Promise.all([
    getTheme(),
    fetch(`${API_URL}/vendor/orders`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
  ]);
  if (res.status === 401) redirect('/login');
  if (res.status === 403) redirect('/vendedor');
  const orders = (await res.json().catch(() => [])) as VendorOrderRow[];

  return (
    <>
      <SiteHeader theme={theme} />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.4rem' }}>{t(theme, 'vendor.panel.orders')}</h1>
        {orders.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>{t(theme, 'vendor.orders.empty')}</p>
        ) : (
          <div style={{ display: 'grid', gap: '.7rem' }}>
            {orders.map((o) => (
              <div
                key={o.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)',
                  padding: '1rem 1.2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <span><strong>{o.orderNumber}</strong> · ×{o.qty} · {o.status}</span>
                <strong style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatPrice(o.price)}
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
