import type { InputHTMLAttributes } from 'react';

export function Input({ style, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-base)',
        color: 'var(--color-text)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.5em 0.8em',
        ...style,
      }}
      {...rest}
    />
  );
}
