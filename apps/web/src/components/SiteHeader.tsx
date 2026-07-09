import Link from 'next/link';
import type { Theme } from '@servmaq/config';
import { t } from '@/lib/theme';
import { HeaderActions } from '@/components/HeaderActions';
import { Newsletter } from '@/components/Newsletter';

export function SiteHeader({ theme }: { theme: Theme }) {
  return (
    <header
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0.9rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none', color: 'var(--color-text)' }}>
          <strong style={{ fontSize: 'var(--text-lg)', fontFamily: 'var(--font-heading)' }}>
            {t(theme, 'site.name')}
          </strong>
        </Link>
        <nav style={{ display: 'flex', gap: '1.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            {t(theme, 'nav.home')}
          </Link>
          <Link href="/productos" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            {t(theme, 'nav.products')}
          </Link>
          <Link href="/quienes-somos" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            {t(theme, 'nav.about')}
          </Link>
          <Link href="/contacto" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            {t(theme, 'nav.contact')}
          </Link>
          <HeaderActions
            labels={{
              cart: t(theme, 'nav.cart'),
              login: t(theme, 'nav.login'),
              logout: t(theme, 'auth.logout'),
              greeting: t(theme, 'auth.greeting'),
            }}
          />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ theme }: { theme: Theme }) {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--color-border)',
        marginTop: '3rem',
        padding: '2rem 1.5rem 1.5rem',
        display: 'grid',
        gap: '1.4rem',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: 'var(--text-sm)',
      }}
    >
      <Newsletter
        labels={{
          title: t(theme, 'newsletter.title'),
          placeholder: t(theme, 'newsletter.placeholder'),
          submit: t(theme, 'newsletter.submit'),
          success: t(theme, 'newsletter.success'),
          error: t(theme, 'newsletter.error'),
        }}
      />
      <span>
        {t(theme, 'site.name')} © {new Date().getFullYear()} — {t(theme, 'footer.rights')}
      </span>
    </footer>
  );
}
