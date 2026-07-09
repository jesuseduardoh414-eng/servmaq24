'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
      }}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--color-primary)',
        fontWeight: 600,
        fontSize: 'var(--text-sm)',
        textAlign: 'left',
        padding: '0 .6rem',
        fontFamily: 'var(--font-sans)',
      }}
    >
      Cerrar sesión
    </button>
  );
}
