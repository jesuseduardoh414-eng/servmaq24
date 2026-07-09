'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Input } from '@servmaq/ui';

/**
 * Formulario compartido de login/registro. Los textos llegan por props
 * desde el server component (copys del tema) — nada hardcodeado.
 */
export function AuthForm({
  mode,
  labels,
}: {
  mode: 'login' | 'register';
  labels: {
    title: string;
    name: string;
    email: string;
    password: string;
    submit: string;
    switchText: string;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const body: Record<string, string> = {
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
    };
    if (mode === 'register') body.name = String(form.get('name') ?? '');

    const res = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(typeof data?.message === 'string' ? data.message : 'Ocurrió un error, intenta de nuevo');
      return;
    }
    router.push('/');
    router.refresh(); // refresca el header con la sesión nueva
  }

  return (
    <Card style={{ maxWidth: 420, margin: '0 auto', display: 'grid', gap: '1rem' }}>
      <h1 style={{ fontSize: 'var(--text-xl)' }}>{labels.title}</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '.8rem' }}>
        {mode === 'register' ? (
          <Input name="name" required minLength={2} placeholder={labels.name} aria-label={labels.name} autoComplete="name" />
        ) : null}
        <Input name="email" type="email" required placeholder={labels.email} aria-label={labels.email} autoComplete="email" />
        <Input
          name="password"
          type="password"
          required
          minLength={mode === 'register' ? 8 : 1}
          placeholder={labels.password}
          aria-label={labels.password}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        />
        {error ? (
          <p role="alert" style={{ color: 'var(--color-error)', margin: 0, fontSize: 'var(--text-sm)' }}>{error}</p>
        ) : null}
        <Button type="submit" disabled={loading}>{labels.submit}</Button>
      </form>
      <Link
        href={mode === 'login' ? '/registro' : '/login'}
        style={{ color: 'var(--color-primary)', fontSize: 'var(--text-sm)', textDecoration: 'none', fontWeight: 600 }}
      >
        {labels.switchText}
      </Link>
    </Card>
  );
}
