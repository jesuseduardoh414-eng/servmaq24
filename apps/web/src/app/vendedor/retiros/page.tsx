import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { VendorMe, WithdrawRow } from '@servmaq/types';
import { getTheme, t } from '@/lib/theme';
import { SESSION_COOKIE } from '@/lib/session';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { formatPrice } from '@/lib/format';
import { WithdrawForm } from './WithdrawForm';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getTheme();
  return { title: `${t(theme, 'vendor.panel.withdraws')} — ${t(theme, 'site.name')}` };
}

export default async function VendorWithdrawsPage() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) redirect('/login');
  const headers = { Authorization: `Bearer ${token}` };

  const [theme, meRes, listRes] = await Promise.all([
    getTheme(),
    fetch(`${API_URL}/vendor/me`, { headers, cache: 'no-store' }),
    fetch(`${API_URL}/vendor/withdraws`, { headers, cache: 'no-store' }),
  ]);
  if (meRes.status === 401) redirect('/login');
  if (listRes.status === 403) redirect('/vendedor');
  const me = (await meRes.json()) as VendorMe;
  const withdraws = (await listRes.json().catch(() => [])) as WithdrawRow[];

  return (
    <>
      <SiteHeader theme={theme} />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gap: '1.4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>{t(theme, 'vendor.panel.withdraws')}</h1>
          <span>
            {t(theme, 'vendor.panel.balance')}:{' '}
            <strong style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {formatPrice(me.balance)}
            </strong>
          </span>
        </div>

        <WithdrawForm
          labels={{
            title: t(theme, 'vendor.withdraws.request'),
            amount: t(theme, 'vendor.withdraws.amount'),
            method: t(theme, 'vendor.withdraws.method'),
            reference: t(theme, 'vendor.withdraws.reference'),
            submit: t(theme, 'vendor.withdraws.submit'),
          }}
        />

        {withdraws.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{t(theme, 'vendor.withdraws.empty')}</p>
        ) : (
          <div style={{ display: 'grid', gap: '.7rem' }}>
            {withdraws.map((w) => (
              <div
                key={w.id}
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
                <span>
                  <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPrice(w.amount)}</strong>
                  {w.method ? ` · ${w.method}` : ''} · {w.status}
                </span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                  {w.createdAt ? new Date(w.createdAt).toLocaleDateString('es-MX') : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
