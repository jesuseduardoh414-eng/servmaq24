import type { Metadata } from 'next';
import Image from 'next/image';
import { getTheme, t } from '@/lib/theme';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

interface InfSitio {
  frase: string | null;
  titulo: string | null;
  descripcion: string | null;
  mision: string | null;
  vision: string | null;
  objetivos: string | null;
  imagenes: string[];
}

async function getInfSitio(): Promise<InfSitio | null> {
  return fetch(`${API_URL}/content/inf-sitio`, { next: { revalidate: 60 } })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
}

export async function generateMetadata(): Promise<Metadata> {
  const [theme, info] = await Promise.all([getTheme(), getInfSitio()]);
  return {
    title: `${info?.titulo ?? t(theme, 'nav.about')} — ${t(theme, 'site.name')}`,
    description: info?.frase ?? undefined,
  };
}

export default async function AboutPage() {
  const [theme, info] = await Promise.all([getTheme(), getInfSitio()]);

  const block = (title: string, html: string | null) =>
    html ? (
      <section className="grid gap-2">
        <h2 className="font-head text-(length:--text-xl) text-ink">{title}</h2>
        <div className="leading-relaxed text-ink" dangerouslySetInnerHTML={{ __html: html }} />
      </section>
    ) : null;

  return (
    <>
      <SiteHeader theme={theme} />
      <main className="max-w-[860px] mx-auto px-6 py-8 grid gap-6">
        <header className="grid gap-2 text-center">
          {info?.frase ? (
            <span className="text-accent2 font-semibold text-(length:--text-sm) tracking-wide">{info.frase}</span>
          ) : null}
          <h1 className="font-head text-(length:--text-3xl) text-ink">
            {info?.titulo ?? t(theme, 'nav.about')}
          </h1>
        </header>

        {info?.imagenes?.length ? (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {info.imagenes.slice(0, 3).map((src) => (
              <div key={src} className="relative aspect-[4/3] rounded-(--radius-lg) overflow-hidden border border-line">
                <Image src={src} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        ) : null}

        {info?.descripcion ? (
          <div className="leading-relaxed text-ink" dangerouslySetInnerHTML={{ __html: info.descripcion }} />
        ) : null}

        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {block(t(theme, 'about.mision'), info?.mision ?? null)}
          {block(t(theme, 'about.vision'), info?.vision ?? null)}
          {block(t(theme, 'about.objetivos'), info?.objetivos ?? null)}
        </div>
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
