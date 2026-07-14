'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@maqserv/ui';

export function VendorApply({
  labels,
}: {
  labels: {
    title: string;
    subtitle: string;
    shopName: string;
    shopNumber: string;
    shopAddress: string;
    regNumber: string;
    message: string;
    submit: string;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const full = { width: '100%' } as const;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/proxy/vendor/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopName: String(form.get('shopName') ?? ''),
        shopNumber: String(form.get('shopNumber') ?? '') || undefined,
        shopAddress: String(form.get('shopAddress') ?? '') || undefined,
        regNumber: String(form.get('regNumber') ?? '') || undefined,
        shopMessage: String(form.get('shopMessage') ?? '') || undefined,
      }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(typeof data?.message === 'string' ? data.message : 'No pudimos enviar tu solicitud');
      return;
    }
    router.refresh();
  }

  return (
    <Card style={{ maxWidth: 520, display: 'grid', gap: '.8rem' }}>
      <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{labels.title}</h2>
      <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 'var(--text-sm)' }}>{labels.subtitle}</p>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '.8rem' }}>
        <Input name="shopName" required minLength={2} placeholder={labels.shopName} aria-label={labels.shopName} style={full} />
        <Input name="shopNumber" placeholder={labels.shopNumber} aria-label={labels.shopNumber} style={full} />
        <Input name="shopAddress" placeholder={labels.shopAddress} aria-label={labels.shopAddress} style={full} />
        <Input name="regNumber" placeholder={labels.regNumber} aria-label={labels.regNumber} style={full} />
        <Input name="shopMessage" placeholder={labels.message} aria-label={labels.message} style={full} />
        {error ? <p role="alert" style={{ color: 'var(--color-error)', margin: 0, fontSize: 'var(--text-sm)' }}>{error}</p> : null}
        <div><Button type="submit" disabled={loading}>{labels.submit}</Button></div>
      </form>
    </Card>
  );
}
