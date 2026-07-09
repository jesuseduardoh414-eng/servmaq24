import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTheme, t } from '@/lib/theme';
import { getSessionUser } from '@/lib/session';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { ProfileForms } from './ProfileForms';

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getTheme();
  return { title: `${t(theme, 'account.title')} — ${t(theme, 'site.name')}` };
}

export default async function AccountPage() {
  const [theme, user] = await Promise.all([getTheme(), getSessionUser()]);
  if (!user) redirect('/login');

  const links = [
    { href: '/cuenta/pedidos', label: t(theme, 'account.orders.title') },
    { href: '/cuenta/cotizaciones', label: t(theme, 'account.quotes.title') },
    { href: '/cuenta/favoritos', label: t(theme, 'account.wishlist.title') },
  ];

  return (
    <>
      <SiteHeader theme={theme} />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gap: '1.4rem' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>{t(theme, 'account.title')}</h1>

        <nav style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface)',
                padding: '.5em 1em',
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <ProfileForms
          user={user}
          labels={{
            profileTitle: t(theme, 'account.profile.title'),
            name: t(theme, 'auth.field.name'),
            phone: t(theme, 'checkout.field.phone'),
            address: t(theme, 'checkout.field.address'),
            city: t(theme, 'checkout.field.city'),
            zip: t(theme, 'checkout.field.zip'),
            save: t(theme, 'account.profile.save'),
            saved: t(theme, 'account.profile.saved'),
            passwordTitle: t(theme, 'account.password.title'),
            current: t(theme, 'account.password.current'),
            next: t(theme, 'account.password.new'),
            submit: t(theme, 'account.password.submit'),
            changed: t(theme, 'account.password.changed'),
          }}
        />
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
