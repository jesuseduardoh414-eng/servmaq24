'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@maqserv/ui';

/** Botón que hace PATCH/DELETE al proxy admin y refresca la página. */
export function ActionButton({
  path,
  method = 'PATCH',
  body,
  label,
  variant = 'outline',
  confirm: confirmText,
}: {
  path: string; // ej. "orders/12"
  method?: 'PATCH' | 'DELETE' | 'POST';
  body?: unknown;
  label: string;
  variant?: 'solid' | 'outline' | 'ghost';
  confirm?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    if (confirmText && !window.confirm(confirmText)) return;
    setLoading(true);
    await fetch(`/api/admin/${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button size="sm" variant={variant} onClick={run} disabled={loading}>
      {label}
    </Button>
  );
}

/** Select de estado que aplica PATCH al cambiar. */
export function StatusSelect({
  path,
  field,
  value,
  options,
}: {
  path: string;
  field: string;
  value: string;
  options: string[];
}) {
  const router = useRouter();
  return (
    <select
      defaultValue={value}
      onChange={async (e) => {
        await fetch(`/api/admin/${path}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: e.target.value }),
        });
        router.refresh();
      }}
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        padding: '.3em .5em',
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}
