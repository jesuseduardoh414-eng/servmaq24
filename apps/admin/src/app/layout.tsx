import type { ReactNode } from 'react';
import { defaultTheme, themeSchema, themeToCss } from '@servmaq/config';

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
        <style
          dangerouslySetInnerHTML={{
            __html: `*{box-sizing:border-box}body{margin:0;background:var(--color-bg);color:var(--color-text);font-family:var(--font-sans);font-size:var(--text-base);line-height:1.6}h1,h2,h3{font-family:var(--font-heading);line-height:1.15;margin:0}:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
