import type { Metadata } from 'next';
import { getTheme, t } from '@/lib/theme';
import { getSiteSettings } from '@/lib/api';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getTheme();
  return { title: `${t(theme, 'contact.title')} — ${t(theme, 'site.name')}` };
}

/** Contacto: datos reales de la empresa (editables en admin → Ajustes). */
export default async function ContactPage() {
  const [theme, settings] = await Promise.all([getTheme(), getSiteSettings()]);

  const row = (label: string, value: string | null, href?: string) =>
    value ? (
      <div className="flex justify-between gap-4 flex-wrap items-baseline border-b border-line pb-3">
        <span className="text-ink-muted text-(length:--text-sm)">{label}</span>
        {href ? (
          <a href={href} className="text-brand font-semibold no-underline hover:underline">{value}</a>
        ) : (
          <strong>{value}</strong>
        )}
      </div>
    ) : null;

  return (
    <>
      <SiteHeader theme={theme} />
      <main className="max-w-[640px] mx-auto px-6 py-8 grid gap-6">
        <header className="grid gap-2 text-center">
          <h1 className="font-head text-(length:--text-3xl) text-ink">{t(theme, 'contact.title')}</h1>
          <p className="text-ink-muted m-0">{t(theme, 'contact.subtitle')}</p>
        </header>
        <section className="bg-panel border border-line rounded-(--radius-lg) p-6 grid gap-4">
          {row(t(theme, 'contact.email'), settings.email, settings.email ? `mailto:${settings.email}` : undefined)}
          {row(t(theme, 'contact.phone'), settings.phone, settings.phone ? `tel:${settings.phone.replace(/\s+/g, '')}` : undefined)}
        </section>
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
