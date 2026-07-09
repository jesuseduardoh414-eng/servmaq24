import type { Metadata } from 'next';
import type { TrackingResult } from '@servmaq/types';
import { Button, Input } from '@servmaq/ui';
import { getTheme, t } from '@/lib/theme';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getTheme();
  return { title: `${t(theme, 'track.title')} — ${t(theme, 'site.name')}` };
}

type Search = { orden?: string; email?: string };

/** Rastreo público (form GET → SSR, sin JS requerido), como el /track legacy. */
export default async function TrackPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const theme = await getTheme();

  let result: TrackingResult | null = null;
  let notFound = false;
  if (sp.orden && sp.email) {
    const res = await fetch(
      `${API_URL}/track?number=${encodeURIComponent(sp.orden)}&email=${encodeURIComponent(sp.email)}`,
      { cache: 'no-store' },
    );
    if (res.ok) result = (await res.json()) as TrackingResult;
    else notFound = true;
  }

  return (
    <>
      <SiteHeader theme={theme} />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gap: '1.4rem' }}>
        <header style={{ display: 'grid', gap: '.4rem' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>{t(theme, 'track.title')}</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{t(theme, 'track.subtitle')}</p>
        </header>

        <form action="/rastreo" method="get" style={{ display: 'grid', gap: '.8rem' }}>
          <Input name="orden" required defaultValue={sp.orden ?? ''} placeholder={t(theme, 'track.field.number')} aria-label={t(theme, 'track.field.number')} />
          <Input name="email" type="email" required defaultValue={sp.email ?? ''} placeholder={t(theme, 'auth.field.email')} aria-label={t(theme, 'auth.field.email')} />
          <div><Button type="submit">{t(theme, 'track.submit')}</Button></div>
        </form>

        {notFound ? (
          <p role="alert" style={{ color: 'var(--color-error)', margin: 0 }}>{t(theme, 'track.notFound')}</p>
        ) : null}

        {result ? (
          <section style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface)', padding: '1.2rem 1.4rem', display: 'grid', gap: '.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <strong>{result.orderNumber}</strong>
              <span style={{ color: 'var(--color-text-muted)' }}>
                {result.status} · {result.paymentStatus}
              </span>
            </div>
            <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{t(theme, 'track.entries.title')}</h2>
            {result.entries.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 'var(--text-sm)' }}>
                {t(theme, 'track.noEntries')}
              </p>
            ) : (
              <ol style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '.5rem' }}>
                {result.entries.map((e, i) => (
                  <li key={i} style={{ fontSize: 'var(--text-sm)' }}>
                    <strong>{e.numTracking}</strong>
                    {e.nota ? <> — {e.nota}</> : null}
                    <div style={{ color: 'var(--color-text-muted)' }}>{e.fechaEntrega}</div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ) : null}
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
