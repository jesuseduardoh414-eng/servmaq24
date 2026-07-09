import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { parseProductSlug } from '@servmaq/config';
import type { BlogDetail } from '@servmaq/types';
import { getTheme, t } from '@/lib/theme';
import { getBlog } from '@/lib/api';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';

type Params = { slug: string };

async function fetchBySlug(slug: string): Promise<BlogDetail | null> {
  const id = parseProductSlug(slug);
  if (!id) return null;
  try {
    return await getBlog(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const [theme, blog] = await Promise.all([getTheme(), fetchBySlug(slug)]);
  if (!blog) return { title: t(theme, 'site.name') };
  return {
    title: `${blog.metaTitle ?? blog.title} — ${t(theme, 'site.name')}`,
    description: (blog.metaDescription ?? blog.excerpt).slice(0, 160),
    alternates: { canonical: `/blog/${blog.slug}` },
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      images: blog.image ? [blog.image] : [],
      type: 'article',
    },
  };
}

export default async function BlogPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [theme, blog] = await Promise.all([getTheme(), fetchBySlug(slug)]);
  if (!blog) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    image: blog.image ? [blog.image] : [],
    datePublished: blog.date ?? undefined,
  };

  return (
    <>
      <SiteHeader theme={theme} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main style={{ maxWidth: 780, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <nav style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '1.2rem' }}>
          <Link href="/" style={{ color: 'inherit' }}>{t(theme, 'nav.home')}</Link>
          {' / '}
          <span>{t(theme, 'nav.blog')}</span>
        </nav>
        <article style={{ display: 'grid', gap: '1.2rem' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', lineHeight: 1.2 }}>{blog.title}</h1>
          {blog.date ? (
            <time dateTime={blog.date} style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              {new Date(blog.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
          ) : null}
          {blog.image ? (
            <div style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <Image src={blog.image} alt={blog.title} fill priority sizes="(max-width: 780px) 100vw, 780px" style={{ objectFit: 'cover' }} />
            </div>
          ) : null}
          <div style={{ lineHeight: 1.75 }} dangerouslySetInnerHTML={{ __html: blog.contentHtml }} />
        </article>
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
