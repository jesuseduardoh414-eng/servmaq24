import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getTheme, t } from '@/lib/theme';
import { getBlogs } from '@/lib/api';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getTheme();
  return { title: `${t(theme, 'nav.blog')} — ${t(theme, 'site.name')}` };
}

export default async function BlogIndexPage() {
  const [theme, blogs] = await Promise.all([getTheme(), getBlogs(12)]);

  return (
    <>
      <SiteHeader theme={theme} />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.4rem' }}>
          {t(theme, 'home.blog.title')}
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' }}>
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
                {b.date ? (
                  <time dateTime={b.date} style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                    {new Date(b.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                ) : null}
                <strong style={{ lineHeight: 1.3 }}>{b.title}</strong>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{b.excerpt}</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                  {t(theme, 'home.blog.readMore')}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
