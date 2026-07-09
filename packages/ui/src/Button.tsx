import type { ButtonHTMLAttributes, CSSProperties } from 'react';

type Variant = 'solid' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

// Todo valor visual sale de tokens (var(--...)). Nada hardcodeado.
const base: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  borderRadius: 'var(--radius-button)',
  border: '1px solid transparent',
  cursor: 'pointer',
  fontWeight: 600,
  lineHeight: 1.2,
  transition: 'filter .15s ease, background-color .15s ease',
};

const variants: Record<Variant, CSSProperties> = {
  solid: {
    background: 'var(--color-primary)',
    color: 'var(--color-primary-fg)',
  },
  outline: {
    background: 'transparent',
    color: 'var(--color-primary)',
    borderColor: 'var(--color-primary)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-primary)',
  },
};

const sizes: Record<Size, CSSProperties> = {
  sm: { fontSize: 'var(--text-sm)', padding: '0.4em 0.9em' },
  md: { fontSize: 'var(--text-base)', padding: '0.55em 1.2em' },
  lg: { fontSize: 'var(--text-lg)', padding: '0.65em 1.5em' },
};

export function Button({ variant = 'solid', size = 'md', style, ...rest }: ButtonProps) {
  return (
    <button
      style={{ ...base, ...variants[variant], ...sizes[size], ...style }}
      {...rest}
    />
  );
}
