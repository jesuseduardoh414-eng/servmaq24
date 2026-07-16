'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  href: string;
  label: string;
}

/**
 * Navegación principal del header. Client component para resaltar el enlace
 * activo según la ruta actual (usePathname). Los textos llegan ya resueltos
 * desde el server (copys del tema).
 */
export function MainNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname() || '/';
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    // `hdr-nav`: debajo de 1024px la oculta el CSS y manda el drawer (MobileNav).
    <nav className="hdr-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, fontSize: '14.5px', fontWeight: 600, flex: 1, flexWrap: 'wrap' }}>
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            style={{
              color: 'var(--color-text)',
              textDecoration: 'none',
              paddingBottom: 3,
              borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
