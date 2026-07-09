import type { HTMLAttributes } from 'react';

export function Card({ className = '', style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-panel text-ink border border-line rounded-(--radius-lg) p-5 ${className}`}
      style={style}
      {...rest}
    />
  );
}
