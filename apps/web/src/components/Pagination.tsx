import Link from 'next/link';
import type { Theme } from '@servmaq/config';
import { t } from '@/lib/theme';

export function Pagination({
  page,
  pages,
  makeHref,
  theme,
}: {
  page: number;
  pages: number;
  makeHref: (page: number) => string;
  theme: Theme;
}) {
  if (pages <= 1) return null;
  const linkStyle = {
    color: 'var(--color-primary)',
    textDecoration: 'none',
    fontWeight: 600,
    padding: '.4em .9em',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
  } as const;
  return (
    <nav style={{ display: 'flex', gap: '.8rem', alignItems: 'center', justifyContent: 'center', marginTop: '2rem' }}>
      {page > 1 ? (
        <Link href={makeHref(page - 1)} style={linkStyle}>{t(theme, 'pagination.prev')}</Link>
      ) : null}
      <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
        {page} / {pages}
      </span>
      {page < pages ? (
        <Link href={makeHref(page + 1)} style={linkStyle}>{t(theme, 'pagination.next')}</Link>
      ) : null}
    </nav>
  );
}
