import type { InputHTMLAttributes } from 'react';

export function Input({ className = '', style, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`font-body text-(length:--text-base) text-ink bg-panel border border-line rounded-(--radius-md) px-[0.8em] py-[0.5em] placeholder:text-ink-muted ${className}`}
      style={style}
      {...rest}
    />
  );
}
