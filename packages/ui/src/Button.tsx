import type { ButtonHTMLAttributes } from 'react';

type Variant = 'solid' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/**
 * Tailwind sobre tokens: bg-brand === var(--color-primary) (BD, runtime).
 * Nada de colores/tamaños literales — la regla de oro sigue intacta.
 */
const variants: Record<Variant, string> = {
  solid: 'bg-brand text-brand-fg hover:opacity-90 disabled:opacity-60',
  outline: 'bg-transparent text-brand border-brand hover:bg-brand hover:text-brand-fg disabled:opacity-60',
  ghost: 'bg-transparent text-brand hover:underline disabled:opacity-60',
};

const sizes: Record<Size, string> = {
  sm: 'text-(length:--text-sm) px-[0.9em] py-[0.4em]',
  md: 'text-(length:--text-base) px-[1.2em] py-[0.55em]',
  lg: 'text-(length:--text-lg) px-[1.5em] py-[0.65em]',
};

export function Button({ variant = 'solid', size = 'md', className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`font-body font-semibold leading-tight rounded-btn border border-transparent cursor-pointer transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    />
  );
}
