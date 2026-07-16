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

// StatusSelect vivía aquí: mostraba los valores crudos en inglés y solo lo usaba
// Órdenes, que ahora trae su propio `StatusPicker` con etiquetas en español.
