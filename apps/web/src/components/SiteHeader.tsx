import Link from 'next/link';
import Image from 'next/image';
import type { Theme } from '@servmaq/config';
import { t } from '@/lib/theme';
import { getCategories, getSiteSettings } from '@/lib/api';
import { HeaderActions } from '@/components/HeaderActions';
import { Newsletter } from '@/components/Newsletter';

/**
 * Header con la estructura del sitio original:
 *  1) barra superior marina: logo + buscador + teléfono/correo
 *  2) fila de navegación: CATEGORÍAS (dropdown) + links + sesión/carrito
 * Colores/textos siempre desde tokens/copys/BD.
 */
export async function SiteHeader({ theme }: { theme: Theme }) {
  const [settings, categories] = await Promise.all([
    getSiteSettings().catch(() => ({ email: null, phone: null, logo: null })),
    getCategories().catch(() => []),
  ]);

  return (
    <header>
      {/* Barra superior (marino) */}
      <div className="bg-second text-white">
        <div className="max-w-[1160px] mx-auto px-4 py-3 flex items-center gap-5 flex-wrap">
          <Link href="/" className="no-underline shrink-0">
            {settings.logo ? (
              <Image src={settings.logo} alt={t(theme, 'site.name')} width={120} height={44} style={{ objectFit: 'contain', height: 44, width: 'auto' }} />
            ) : (
              <strong className="font-head text-(length:--text-xl) text-white">{t(theme, 'site.name')}</strong>
            )}
          </Link>

          <form action="/productos" method="get" className="flex-1 min-w-56 max-w-xl">
            <input
              type="search"
              name="q"
              placeholder={t(theme, 'catalog.search.placeholder')}
              aria-label={t(theme, 'catalog.search.placeholder')}
              className="w-full font-body text-(length:--text-sm) text-ink bg-panel border-0 rounded-full px-5 py-2.5"
            />
          </form>

          <div className="hidden md:flex items-center gap-5 text-(length:--text-sm) font-semibold tracking-wide">
            {settings.phone ? (
              <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="text-white no-underline hover:underline">
                ✆ {settings.phone}
              </a>
            ) : null}
            {settings.email ? (
              <a href={`mailto:${settings.email}`} className="text-white no-underline hover:underline uppercase">
                ✉ {settings.email}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Fila de navegación */}
      <div className="bg-panel border-b border-line">
        <div className="max-w-[1160px] mx-auto px-4 py-2 flex items-center gap-6 flex-wrap">
          {/* Dropdown de categorías (nativo, sin JS) */}
          <details className="relative">
            <summary className="cursor-pointer list-none font-semibold text-(length:--text-sm) tracking-wide uppercase text-ink flex items-center gap-2">
              ☰ {t(theme, 'nav.categories')} ▾
            </summary>
            <div className="absolute left-0 top-full mt-2 z-20 bg-panel border border-line rounded-(--radius-md) shadow-lg min-w-56 py-2">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/productos?categoria=${c.slug}`}
                  className="block px-4 py-2 text-(length:--text-sm) text-ink no-underline hover:bg-page"
                >
                  {c.name} <span className="text-ink-muted">({c.productCount})</span>
                </Link>
              ))}
            </div>
          </details>

          <nav className="flex items-center gap-5 flex-wrap text-(length:--text-sm) font-semibold tracking-wide uppercase">
            <Link href="/" className="text-ink no-underline hover:text-brand">{t(theme, 'nav.home')}</Link>
            <Link href="/productos" className="text-ink no-underline hover:text-brand">{t(theme, 'nav.products')}</Link>
            <Link href="/vendedores" className="text-ink no-underline hover:text-brand">{t(theme, 'nav.vendors')}</Link>
            <Link href="/rastreo" className="text-ink no-underline hover:text-brand">{t(theme, 'nav.track')}</Link>
            <Link href="/blog" className="text-ink no-underline hover:text-brand">{t(theme, 'nav.blog')}</Link>
            <Link href="/contacto" className="text-ink no-underline hover:text-brand">{t(theme, 'nav.contact')}</Link>
            <Link href="/quienes-somos" className="text-ink no-underline hover:text-brand">{t(theme, 'nav.about')}</Link>
          </nav>

          <div className="ml-auto">
            <HeaderActions
              labels={{
                cart: t(theme, 'nav.cart'),
                login: t(theme, 'nav.login'),
                logout: t(theme, 'auth.logout'),
                greeting: t(theme, 'auth.greeting'),
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ theme }: { theme: Theme }) {
  return (
    <footer className="bg-second mt-12">
      <div className="max-w-[1160px] mx-auto px-6 py-8 grid gap-6 text-center">
        <div className="[&_strong]:text-white [&_p]:text-white/80">
          <Newsletter
            labels={{
              title: t(theme, 'newsletter.title'),
              placeholder: t(theme, 'newsletter.placeholder'),
              submit: t(theme, 'newsletter.submit'),
              success: t(theme, 'newsletter.success'),
              error: t(theme, 'newsletter.error'),
            }}
          />
        </div>
        <span className="text-white/70 text-(length:--text-sm)">
          {t(theme, 'site.name')} © {new Date().getFullYear()} — {t(theme, 'footer.rights')}
        </span>
      </div>
    </footer>
  );
}
