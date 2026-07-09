import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogoutButton } from './LogoutButton';

const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/productos', label: 'Productos' },
  { href: '/categorias', label: 'Categorías' },
  { href: '/ordenes', label: 'Órdenes' },
  { href: '/cotizaciones', label: 'Cotizaciones' },
  { href: '/vendedores', label: 'Vendedores' },
  { href: '/retiros', label: 'Retiros' },
  { href: '/blog', label: 'Blog' },
  { href: '/faqs', label: 'FAQ' },
  { href: '/ajustes', label: 'Ajustes' },
  { href: '/temas', label: 'Temas / Diseño' },
];

export function AdminShell({ adminName, children }: { adminName: string; children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh' }}>
      <aside
        style={{
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          padding: '1.2rem .9rem',
          display: 'grid',
          gap: '.3rem',
          alignContent: 'start',
        }}
      >
        <strong style={{ fontSize: 'var(--text-lg)', padding: '.3rem .6rem', marginBottom: '.6rem' }}>
          ServMaq24 <span style={{ color: 'var(--color-accent)', fontSize: 'var(--text-sm)' }}>admin</span>
        </strong>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            style={{
              textDecoration: 'none',
              color: 'var(--color-text)',
              padding: '.45rem .6rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
            }}
          >
            {n.label}
          </Link>
        ))}
        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '.8rem', display: 'grid', gap: '.4rem' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', padding: '0 .6rem' }}>{adminName}</span>
          <LogoutButton />
        </div>
      </aside>
      <main style={{ padding: '1.6rem 2rem', maxWidth: 1100 }}>{children}</main>
    </div>
  );
}
