'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';

/**
 * Zona derecha del header (cliente): contador del carrito + sesión.
 * La sesión se hidrata en cliente vía /api/auth/session para que las
 * páginas con header puedan seguir siendo estáticas (ISR).
 */
export function HeaderActions({
  labels,
}: {
  labels: { cart: string; login: string; logout: string; greeting: string };
}) {
  const cart = useCart();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => setUserName(d.user?.name ?? null))
      .catch(() => setUserName(null));
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUserName(null);
    router.refresh();
  }

  const linkStyle: React.CSSProperties = {
    color: 'var(--color-text-muted)',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 'var(--text-sm)',
  };

  return (
    <div style={{ display: 'flex', gap: '1.1rem', alignItems: 'center' }}>
      <Link href="/carrito" style={linkStyle} aria-label={labels.cart}>
        {labels.cart}
        {cart.count > 0 ? (
          <span
            style={{
              marginLeft: 6,
              background: 'var(--color-primary)',
              color: 'var(--color-primary-fg)',
              borderRadius: '999px',
              fontSize: 'var(--text-sm)',
              padding: '.05em .5em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {cart.count}
          </span>
        ) : null}
      </Link>
      {userName ? (
        <>
          <span style={{ color: 'var(--color-text)', fontSize: 'var(--text-sm)' }}>
            {labels.greeting}, <strong>{userName.split(' ')[0]}</strong>
          </span>
          <button
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-primary)',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              padding: 0,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {labels.logout}
          </button>
        </>
      ) : (
        <Link href="/login" style={{ ...linkStyle, color: 'var(--color-primary)' }}>
          {labels.login}
        </Link>
      )}
    </div>
  );
}
