import Link from 'next/link';
import Image from 'next/image';
import type { Theme } from '@servmaq/config';
import { Button } from '@servmaq/ui';
import { t } from '@/lib/theme';
import {
  getBanners,
  getBlogs,
  getCategories,
  getFaqs,
  getHero,
  getProducts,
  getReviews,
  getSectors,
  getServices,
  getWhyChooseUs,
} from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';

/**
 * Secciones de la home. Cada una:
 *  - toma su contenido de la BD (vía API) y sus textos fijos de los copys del tema
 *  - se auto-omite (return null) si no hay datos
 *  - usa SOLO tokens para estilos
 * El orden/visibilidad lo decide theme.tokens.sections (ver page.tsx).
 */

const sectionWrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '2.5rem 1.5rem',
};

const sectionTitle: React.CSSProperties = {
  fontSize: 'var(--text-2xl)',
  marginBottom: '1.2rem',
};

export async function Hero({ theme }: { theme: Theme }) {
  // Réplica del hero original: imagen de fondo a lo ancho con overlay,
  // badge, título en letra display (script), pills y CTA.
  // Contenido desde la BD (hero_sections, editable en admin) con fallback a copys.
  const hero = await getHero().catch(() => null);
  const title = hero?.title ?? t(theme, 'home.hero.title');
  const subtitle = hero?.subtitle ?? t(theme, 'home.hero.subtitle');
  const pills = [hero?.feature1, hero?.feature2].filter((x): x is string => Boolean(x));

  return (
    <section className="relative overflow-hidden">
      {/* Imagen de fondo + overlay oscuro */}
      {hero?.image ? (
        <Image
          src={hero.image}
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
          aria-hidden
        />
      ) : null}
      <div className="absolute inset-0" style={{ background: 'color-mix(in srgb, var(--color-secondary) 55%, transparent)' }} />

      <div className="relative max-w-[900px] mx-auto px-6 py-20 md:py-28 grid gap-5 text-center justify-items-center">
        {hero?.badge ? (
          <span
            className="uppercase tracking-[.25em] font-semibold text-(length:--text-sm) text-white px-4 py-1.5"
            style={{ background: 'color-mix(in srgb, var(--color-secondary) 75%, black)' }}
          >
            {hero.badge}
          </span>
        ) : null}

        <h1
          className="text-white leading-tight"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.2rem, 6vw, 4rem)',
            textShadow: '0 2px 12px rgba(0,0,0,.45)',
          }}
        >
          {title}
        </h1>

        <p className="text-white/95 text-(length:--text-lg) max-w-2xl m-0" style={{ textShadow: '0 1px 8px rgba(0,0,0,.5)' }}>
          {subtitle}
        </p>

        {pills.length > 0 ? (
          <div className="flex gap-4 flex-wrap justify-center">
            {pills.map((p) => (
              <span
                key={p}
                className="uppercase tracking-wide font-semibold text-(length:--text-sm) text-white px-5 py-3 border-b-4 border-brand"
                style={{ background: 'color-mix(in srgb, var(--color-secondary) 85%, black)' }}
              >
                ✓ {p}
              </span>
            ))}
          </div>
        ) : null}

        <Link href="/contacto" className="no-underline mt-2">
          <Button size="lg" className="uppercase tracking-widest px-10">
            {t(theme, 'home.hero.cta')}
          </Button>
        </Link>
      </div>
    </section>
  );
}

export async function CategoriesSection({ theme }: { theme: Theme }) {
  const categories = await getCategories();
  if (categories.length === 0) return null;
  return (
    <section style={sectionWrap}>
      <h2 style={sectionTitle}>{t(theme, 'home.categories.title')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/productos?categoria=${c.slug}`}
            style={{
              textDecoration: 'none',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              padding: '1rem',
              display: 'grid',
              gap: '.5rem',
              textAlign: 'center',
            }}
          >
            {c.image ? (
              <span style={{ position: 'relative', width: '100%', aspectRatio: '1', display: 'block' }}>
                <Image src={c.image} alt={c.name} fill sizes="150px" style={{ objectFit: 'contain' }} />
              </span>
            ) : null}
            <strong>{c.name}</strong>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{c.productCount}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function FeaturedSection({ theme }: { theme: Theme }) {
  const { items } = await getProducts({ featured: true });
  const products = items.length > 0 ? items : (await getProducts({})).items;
  if (products.length === 0) return null;
  return (
    <section style={sectionWrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '.5rem' }}>
        <h2 style={sectionTitle}>{t(theme, 'home.featured.title')}</h2>
        <Link href="/productos" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
          {t(theme, 'home.featured.viewAll')}
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.2rem' }}>
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} theme={theme} />
        ))}
      </div>
    </section>
  );
}

export async function SectorsSection({ theme }: { theme: Theme }) {
  const sectors = await getSectors();
  if (sectors.length === 0) return null;
  return (
    <section style={sectionWrap}>
      <h2 style={sectionTitle}>{t(theme, 'home.sectors.title')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.2rem' }}>
        {sectors.map((s) => (
          <Link
            key={s.id}
            href={`/sectores/${s.slug}`}
            style={{
              textDecoration: 'none',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-surface)',
              overflow: 'hidden',
              display: 'grid',
            }}
          >
            {s.image ? (
              <span style={{ position: 'relative', aspectRatio: '16 / 9', display: 'block' }}>
                <Image src={s.image} alt={s.title} fill sizes="(max-width: 640px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
              </span>
            ) : null}
            <span style={{ padding: '1rem', display: 'grid', gap: '.4rem' }}>
              <strong style={{ fontSize: 'var(--text-lg)' }}>{s.title}</strong>
              {s.description ? (
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{s.description}</span>
              ) : null}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function WhyChooseUsSection({ theme }: { theme: Theme }) {
  const items = await getWhyChooseUs();
  if (items.length === 0) return null;
  return (
    <section style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
      <div style={sectionWrap}>
        <h2 style={sectionTitle}>{t(theme, 'home.whyChooseUs.title')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.2rem' }}>
          {items.map((w) => (
            <div key={w.id} style={{ display: 'grid', gap: '.5rem', alignContent: 'start' }}>
              {w.photo ? (
                <span style={{ position: 'relative', width: 56, height: 56, display: 'block' }}>
                  <Image src={w.photo} alt="" fill sizes="56px" style={{ objectFit: 'contain' }} />
                </span>
              ) : null}
              <strong>{w.title}</strong>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{w.description}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function ServicesSection({ theme }: { theme: Theme }) {
  const services = await getServices();
  if (services.length === 0) return null;
  return (
    <section style={sectionWrap}>
      <h2 style={sectionTitle}>{t(theme, 'home.services.title')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.2rem' }}>
        {services.map((s) => (
          <div
            key={s.id}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-surface)',
              overflow: 'hidden',
            }}
          >
            {s.photo ? (
              <span style={{ position: 'relative', aspectRatio: '16 / 9', display: 'block' }}>
                <Image src={s.photo} alt={s.title} fill sizes="(max-width: 640px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
              </span>
            ) : null}
            <div style={{ padding: '1rem', display: 'grid', gap: '.4rem' }}>
              <strong>{s.title}</strong>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{s.text}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export async function BannersSection(_: { theme: Theme }) {
  const banners = await getBanners();
  const all = [...banners.top, ...banners.bottom];
  if (all.length === 0) return null;
  return (
    <section style={sectionWrap}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {all.map((b, i) => {
          const img = (
            <span key={i} style={{ position: 'relative', aspectRatio: '21 / 9', display: 'block', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <Image src={b.image} alt="" fill sizes="(max-width: 640px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
            </span>
          );
          return b.link ? (
            <a key={i} href={b.link} target="_blank" rel="noopener noreferrer">{img}</a>
          ) : (
            img
          );
        })}
      </div>
    </section>
  );
}

export async function BlogSection({ theme }: { theme: Theme }) {
  const blogs = await getBlogs(3);
  if (blogs.length === 0) return null;
  return (
    <section style={sectionWrap}>
      <h2 style={sectionTitle}>{t(theme, 'home.blog.title')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.2rem' }}>
        {blogs.map((b) => (
          <Link
            key={b.id}
            href={`/blog/${b.slug}`}
            style={{
              textDecoration: 'none',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-surface)',
              overflow: 'hidden',
              display: 'grid',
            }}
          >
            {b.image ? (
              <span style={{ position: 'relative', aspectRatio: '16 / 9', display: 'block' }}>
                <Image src={b.image} alt={b.title} fill sizes="(max-width: 640px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
              </span>
            ) : null}
            <span style={{ padding: '1rem', display: 'grid', gap: '.4rem' }}>
              <strong style={{ lineHeight: 1.3 }}>{b.title}</strong>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{b.excerpt}</span>
              <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                {t(theme, 'home.blog.readMore')}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function FaqSection({ theme }: { theme: Theme }) {
  const faqs = await getFaqs();
  if (faqs.length === 0) return null;
  return (
    <section style={sectionWrap}>
      <h2 style={sectionTitle}>{t(theme, 'home.faq.title')}</h2>
      <div style={{ display: 'grid', gap: '.6rem', maxWidth: 780 }}>
        {faqs.map((f) => (
          <details
            key={f.id}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              padding: '.8rem 1.1rem',
            }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{f.question}</summary>
            <div
              style={{ marginTop: '.6rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: f.answer }}
            />
          </details>
        ))}
      </div>
    </section>
  );
}

export async function SuccessCasesSection({ theme }: { theme: Theme }) {
  const API_URL = process.env.API_URL ?? 'http://localhost:4000';
  const cases = (await fetch(`${API_URL}/content/success-cases`, { next: { revalidate: 60 } })
    .then((r) => r.json())
    .catch(() => [])) as Array<{ id: number; client: string; review: string; image: string | null }>;
  if (cases.length === 0) return null;
  return (
    <section style={sectionWrap}>
      <h2 style={sectionTitle}>{t(theme, 'home.successCases.title')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.2rem' }}>
        {cases.map((c) => (
          <figure
            key={c.id}
            style={{
              margin: 0,
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-surface)',
              overflow: 'hidden',
              display: 'grid',
            }}
          >
            {c.image ? (
              <span style={{ position: 'relative', aspectRatio: '16 / 9', display: 'block' }}>
                <Image src={c.image} alt={c.client} fill sizes="(max-width: 640px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
              </span>
            ) : null}
            <div style={{ padding: '1rem', display: 'grid', gap: '.4rem' }}>
              <strong>{c.client}</strong>
              <blockquote style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                “{c.review}”
              </blockquote>
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} de 5`} style={{ color: 'var(--color-warning)', letterSpacing: '.1em' }}>
      {'★'.repeat(rating)}
      <span style={{ color: 'var(--color-border)' }}>{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

export async function ReviewsSection({ theme }: { theme: Theme }) {
  const reviews = await getReviews(6);
  if (reviews.length === 0) return null;
  return (
    <section style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
      <div style={sectionWrap}>
        <h2 style={sectionTitle}>{t(theme, 'home.reviews.title')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.2rem' }}>
          {reviews.map((r) => (
            <figure
              key={r.id}
              style={{
                margin: 0,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg)',
                padding: '1rem 1.2rem',
                display: 'grid',
                gap: '.5rem',
                alignContent: 'start',
              }}
            >
              <Stars rating={r.rating} />
              <blockquote style={{ margin: 0, color: 'var(--color-text)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                “{r.review}”
              </blockquote>
              <figcaption style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                — {r.author}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
