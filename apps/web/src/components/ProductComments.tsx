'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Input } from '@servmaq/ui';
import type { ProductComment, ProductCommentsSummary } from '@servmaq/types';

function Stars({ value, size = 'var(--text-base)' }: { value: number; size?: string }) {
  const full = Math.round(value);
  return (
    <span aria-label={`${value} de 5`} style={{ color: 'var(--color-warning)', fontSize: size, letterSpacing: '.08em' }}>
      {'★'.repeat(full)}
      <span style={{ color: 'var(--color-border)' }}>{'★'.repeat(5 - full)}</span>
    </span>
  );
}

/** Selector de calificación accesible (radios visualmente como estrellas). */
function RatingPicker({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <fieldset style={{ border: 'none', padding: 0, margin: 0, display: 'flex', gap: '.4rem', alignItems: 'center' }}>
      <legend style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', padding: 0, marginRight: '.4rem' }}>{label}</legend>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} style={{ cursor: 'pointer', fontSize: 'var(--text-xl)', color: n <= value ? 'var(--color-warning)' : 'var(--color-border)' }}>
          <input
            type="radio"
            name="rating"
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
            style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
          />
          ★
        </label>
      ))}
    </fieldset>
  );
}

export function ProductComments({
  productId,
  initial,
  labels,
}: {
  productId: number;
  initial: ProductCommentsSummary;
  labels: {
    title: string;
    empty: string;
    formTitle: string;
    rating: string;
    text: string;
    submit: string;
    loginToComment: string;
  };
}) {
  const [items, setItems] = useState<ProductComment[]>(initial.items);
  const [rating, setRating] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Sesión en cliente para que la página de producto siga siendo cacheable
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => setIsLoggedIn(Boolean(d.user)))
      .catch(() => setIsLoggedIn(false));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/proxy/catalog/products/${productId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: String(form.get('text') ?? ''), rating }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok || !data?.id) {
      setError(typeof data?.message === 'string' ? data.message : 'No pudimos publicar tu opinión');
      return;
    }
    setItems((prev) => [data as ProductComment, ...prev]);
    (e.target as HTMLFormElement).reset();
    setRating(5);
  }

  const count = items.length;
  const average = count === 0 ? 0 : Math.round((items.reduce((s, i) => s + i.rating, 0) / count) * 10) / 10;

  return (
    <section style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '.8rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>{labels.title}</h2>
        {count > 0 ? (
          <span style={{ display: 'inline-flex', gap: '.4rem', alignItems: 'center' }}>
            <Stars value={average} />
            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', fontVariantNumeric: 'tabular-nums' }}>
              {average} ({count})
            </span>
          </span>
        ) : null}
      </div>

      {count === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{labels.empty}</p>
      ) : (
        <div style={{ display: 'grid', gap: '.7rem' }}>
          {items.map((c) => (
            <Card key={c.id} style={{ display: 'grid', gap: '.3rem', padding: '.9rem 1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <strong>{c.author}</strong>
                <Stars value={c.rating} size="var(--text-sm)" />
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{c.text}</p>
            </Card>
          ))}
        </div>
      )}

      {isLoggedIn ? (
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '.7rem' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{labels.formTitle}</h3>
          <RatingPicker value={rating} onChange={setRating} label={labels.rating} />
          <Input name="text" required minLength={3} maxLength={2000} placeholder={labels.text} aria-label={labels.text} />
          {error ? (
            <p role="alert" style={{ color: 'var(--color-error)', margin: 0, fontSize: 'var(--text-sm)' }}>{error}</p>
          ) : null}
          <div><Button type="submit" disabled={loading}>{labels.submit}</Button></div>
        </form>
      ) : (
        <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
          {labels.loginToComment}
        </Link>
      )}
    </section>
  );
}
