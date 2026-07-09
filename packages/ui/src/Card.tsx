import type { HTMLAttributes } from 'react';

export function Card({ style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        ...style,
      }}
      {...rest}
    />
  );
}
