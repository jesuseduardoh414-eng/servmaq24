'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';

/**
 * Zona derecha del header (cliente) al estilo SEGAshop: buscador desplegable,
 * favoritos, carrito con contador y sesión/registro. La sesión se hidrata en
 * cliente para que las páginas puedan seguir siendo estáticas (ISR).
 * Estilos: solo tokens del tema.
 */
export function HeaderActions({
  labels,
}: {
  labels: {
    search: string;
    wishlist: string;
    cart: string;
    login: string;
    register: string;
    logout: string;
    greeting: string;
    searchPlaceholder: string;
  };
}) {
  const cart = useCart();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [favCount, setFavCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => setUserName(d.user?.name ?? null))
      .catch(() => setUserName(null));
    fetch('/api/proxy/wishlist/ids')
      .then((r) => (r.ok ? r.json() : []))
      .then((ids: number[]) => Array.isArray(ids) && setFavCount(ids.length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUserName(null);
    router.refresh();
  }

  const iconBtn: React.CSSProperties = {
    position: 'relative', width: 38, height: 38, borderRadius: '50%',
    border: 'none', background: 'transparent', color: 'var(--color-text-muted)',
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <button type="button" className="hdr-icon" title={labels.search} aria-label={labels.search} style={iconBtn} onClick={() => setSearchOpen((v) => !v)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
      </button>

      <Link href="/cuenta/favoritos" className="hdr-icon" title={labels.wishlist} aria-label={labels.wishlist} style={iconBtn}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
        {favCount > 0 ? <span style={{ position: 'absolute', top: 7, right: 7, width: 8, height: 8, background: 'var(--color-primary)', borderRadius: '50%', border: '1.5px solid var(--color-surface)' }} /> : null}
      </Link>

      <Link href="/carrito" className="hdr-icon" title={labels.cart} aria-label={labels.cart} style={iconBtn}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 2h2.5l2.2 12.4a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 6H5.5" /></svg>
        {cart.count > 0 ? (
          <span style={{ position: 'absolute', top: 2, right: 2, minWidth: 17, height: 17, padding: '0 4px', borderRadius: 999, background: 'var(--color-secondary)', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--color-surface)', fontVariantNumeric: 'tabular-nums' }}>{cart.count}</span>
        ) : null}
      </Link>

      <span style={{ width: 1, height: 26, background: 'var(--color-border)', margin: '0 8px' }} />

      {userName ? (
        <>
          <span style={{ color: 'var(--color-text)', fontSize: '14px', fontWeight: 600 }}>
            {labels.greeting}, <strong>{userName.split(' ')[0]}</strong>
          </span>
          <button
            type="button"
            onClick={logout}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', fontWeight: 700, fontSize: '14px', fontFamily: 'var(--font-sans)' }}
          >
            {labels.logout}
          </button>
        </>
      ) : (
        <>
          <Link href="/login" style={{ color: 'var(--color-text)', fontWeight: 600, fontSize: '14px', padding: '0 4px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            {labels.login}
          </Link>
          <Link
            href="/registro"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-primary-fg)',
              fontWeight: 700,
              fontSize: '14px',
              padding: '10px 16px',
              whiteSpace: 'nowrap',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              boxShadow: '0 12px 24px -14px color-mix(in srgb, var(--color-primary) 95%, transparent)',
            }}
          >
            {labels.register}
          </Link>
        </>
      )}

      {/* Barra de búsqueda desplegable (anclada bajo el header sticky) */}
      {searchOpen ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '100%',
            background: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 40,
          }}
        >
          <form
            action="/productos"
            method="get"
            style={{ maxWidth: 1240, margin: '0 auto', padding: '16px 26px', display: 'flex', alignItems: 'center', gap: 12 }}
            onSubmit={() => setSearchOpen(false)}
          >
            <span style={{ fontSize: '20px', color: 'var(--grey)' }}>⌕</span>
            <input
              ref={searchInput}
              name="q"
              placeholder={labels.searchPlaceholder}
              aria-label={labels.searchPlaceholder}
              style={{ flex: 1, border: 'none', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: '16px', color: 'var(--color-text)', outline: 'none' }}
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Cerrar"
              style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', width: 34, height: 34, cursor: 'pointer', color: 'var(--grey)' }}
            >
              ✕
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
