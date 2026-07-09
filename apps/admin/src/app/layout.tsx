import type { ReactNode } from 'react';
import { defaultTheme, themeSchema, themeToCss } from '@servmaq/config';
import './globals.css';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export const metadata = { title: 'Admin — ServMaq24' };

/** El admin comparte los tokens del tema activo (colores/tipografía de la BD). */
export default async function RootLayout({ children }: { children: ReactNode }) {
  let tokens = defaultTheme.tokens;
  try {
    const res = await fetch(`${API_URL}/theme`, { next: { revalidate: 60 } });
    if (res.ok) tokens = themeSchema.parse(await res.json()).tokens;
  } catch {
    /* tokens default */
  }

  return (
    <html lang="es">
      <head>
        <style id="theme-tokens" dangerouslySetInnerHTML={{ __html: themeToCss(tokens) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
