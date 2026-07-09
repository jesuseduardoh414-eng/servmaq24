import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { parseProductSlug } from '@servmaq/config';
import type { StrategicSectorDetail } from '@servmaq/types';
import { getTheme, t } from '@/lib/theme';
import { getSector } from '@/lib/api';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';

type Params = { slug: string };

async function fetchBySlug(slug: string): Promise<StrategicSectorDetail | null> {
  const id = parseProductSlug(slug);
  if (!id) return null;
  try {
    return await getSector(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const [theme, sector] = await Promise.all([getTheme(), fetchBySlug(slug)]);
  if (!sector) return { title: t(theme, 'site.name') };
  return {
    title: `${sector.title} — ${t(theme, 'site.name')}`,
    description: sector.description ? sector.description.replace(/<[^>]+>/g, ' ').slice(0, 160) : undefined,
    alternates: { canonical: `/sectores/${sector.slug}` },
  };
}

/** Bloques de texto largos del sector (legacy: HTML libre). */
function Block({ title, html }: { title: string; html: string | null }) {
  if (!html) return null;
  return (
    <section style={{ display: 'grid', gap: '.6rem' }}>
      <h2 style={{ fontSize: 'var(--text-xl)' }}>{title}</h2>
      <div style={{ lineHeight: 1.75, color: 'var(--color-text)' }} dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}

export default async function SectorPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [theme, sector] = await Promise.all([getTheme(), fetchBySlug(slug)]);
  if (!sector) notFound();

  return (
    <>
      <SiteHeader theme={theme} />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gap: '1.6rem' }}>
        <nav style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          <Link href="/" style={{ color: 'inherit' }}>{t(theme, 'nav.home')}</Link>
          {' / '}
          <span>{t(theme, 'home.sectors.title')}</span>
        </nav>

        <h1 style={{ fontSize: 'var(--text-2xl)', lineHeight: 1.2 }}>{sector.title}</h1>

        {sector.image ? (
          <div style={{ position: 'relative', aspectRatio: '21 / 9', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <Image src={sector.image} alt={sector.title} fill priority sizes="(max-width: 860px) 100vw, 860px" style={{ objectFit: 'cover' }} />
          </div>
        ) : null}

        {sector.description ? (
          <div style={{ lineHeight: 1.75 }} dangerouslySetInnerHTML={{ __html: sector.description }} />
        ) : null}

        <Block title="Trayectoria" html={sector.trayectoria} />
        <Block title="Esencia" html={sector.esencia} />
        <Block title="Servicios" html={sector.servicios} />
        <Block title="Excelencia" html={sector.excelencia} />

        {sector.serviciosLista.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '.4rem', color: 'var(--color-text)' }}>
            {sector.serviciosLista.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
