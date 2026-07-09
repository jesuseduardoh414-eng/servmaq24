'use client';

import { useState } from 'react';
import { Button, Input } from '@servmaq/ui';

export function Newsletter({
  labels,
}: {
  labels: { title: string; placeholder: string; submit: string; success: string; error: string };
}) {
  const [state, setState] = useState<'idle' | 'ok' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/suscribir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(form.get('email') ?? '') }),
    });
    setState(res.ok ? 'ok' : 'error');
    if (res.ok) (e.target as HTMLFormElement).reset();
  }

  return (
    <div className="grid gap-2 max-w-90 mx-auto">
      <strong className="text-ink">{labels.title}</strong>
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input name="email" type="email" required placeholder={labels.placeholder} aria-label={labels.placeholder} className="flex-1" />
        <Button type="submit" size="sm">{labels.submit}</Button>
      </form>
      {state === 'ok' ? <p role="status" className="text-ok text-(length:--text-sm) m-0">{labels.success}</p> : null}
      {state === 'error' ? <p role="alert" className="text-bad text-(length:--text-sm) m-0">{labels.error}</p> : null}
    </div>
  );
}
