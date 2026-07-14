'use client';

import { createContext, useContext, type ReactNode } from 'react';

/** Identidad de marca del tema activo (logos + favicon), servida por el layout. */
export type Branding = {
  logoLight?: string | null;
  logoDark?: string | null;
  favicon?: string | null;
  icon?: string | null;
  logoAlt?: string | null;
};

const BrandingContext = createContext<Branding>({});

export function BrandingProvider({ value, children }: { value: Branding; children: ReactNode }) {
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding(): Branding {
  return useContext(BrandingContext);
}
