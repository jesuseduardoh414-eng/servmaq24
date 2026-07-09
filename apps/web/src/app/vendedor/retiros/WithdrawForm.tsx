'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@servmaq/ui';

export function WithdrawForm({
  labels,
}: {
  labels: { title: string; amount: string; method: string; reference: string; submit: string };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/proxy/vendor/withdraws', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(form.get('amount') ?? 0),
        method: String(form.get('method') ?? ''),
        reference: String(form.get('reference') ?? '') || undefined,
      }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(typeof data?.message === 'string' ? data.message : 'No pudimos registrar el retiro');
      return;
    }
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <Card style={{ display: 'grid', gap: '.8rem', maxWidth: 480 }}>
      <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{labels.title}</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '.8rem' }}>
        <Input name="amount" type="number" step="0.01" min={1} required placeholder={labels.amount} aria-label={labels.amount} />
        <Input name="method" required minLength={2} placeholder={labels.method} aria-label={labels.method} />
        <Input name="reference" placeholder={labels.reference} aria-label={labels.reference} />
        {error ? <p role="alert" style={{ color: 'var(--color-error)', margin: 0, fontSize: 'var(--text-sm)' }}>{error}</p> : null}
        <div><Button type="submit" disabled={loading}>{labels.submit}</Button></div>
      </form>
    </Card>
  );
}
