import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { VendorMe } from '@maqserv/types';
import { getTheme, t } from '@/lib/theme';
import { SESSION_COOKIE } from '@/lib/session';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { formatPrice } from '@/lib/format';
import { VendorApply } from './VendorApply';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getTheme();
  return { title: `${t(theme, 'vendor.panel.title')} — ${t(theme, 'site.name')}` };
}

export default async function VendorPanelPage() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) redirect('/login');

  const [theme, meRes] = await Promise.all([
    getTheme(),
    fetch(`${API_URL}/vendor/me`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
  ]);
  if (meRes.status === 401) redirect('/login');
  const me = (await meRes.json()) as VendorMe;

  return (
    <>
      <SiteHeader theme={theme} />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gap: '1.4rem' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>{t(theme, 'vendor.panel.title')}</h1>

        {me.status === 0 ? (
          <VendorApply
            labels={{
              title: t(theme, 'vendor.apply.title'),
              subtitle: t(theme, 'vendor.apply.subtitle'),
              shopName: t(theme, 'vendor.apply.shopName'),
              shopNumber: t(theme, 'vendor.apply.shopNumber'),
              shopAddress: t(theme, 'vendor.apply.shopAddress'),
              regNumber: t(theme, 'vendor.apply.regNumber'),
              message: t(theme, 'vendor.apply.message'),
              submit: t(theme, 'vendor.apply.submit'),
            }}
          />
        ) : me.status === 1 ? (
          <p
            role="status"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.2rem',
              color: 'var(--color-text-muted)',
              margin: 0,
            }}
          >
            {t(theme, 'vendor.apply.pending')}
          </p>
        ) : (
          <>
            <section
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.2rem 1.4rem',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                alignItems: 'baseline',
              }}
            >
              <strong style={{ fontSize: 'var(--text-lg)' }}>{me.shopName}</strong>
              <span>
                {t(theme, 'vendor.panel.balance')}:{' '}
                <strong style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatPrice(me.balance)}
                </strong>
              </span>
            </section>
            <nav style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
              {[
                { href: '/vendedor/productos', label: t(theme, 'vendor.panel.products') },
                { href: '/vendedor/ordenes', label: t(theme, 'vendor.panel.orders') },
                { href: '/vendedor/retiros', label: t(theme, 'vendor.panel.withdraws') },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    textDecoration: 'none',
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface)',
                    padding: '.6em 1.1em',
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </>
        )}
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
