import type { ReactNode } from 'react';
import { themeToCss } from '@servmaq/config';
import { getTheme, t } from '@/lib/theme';
import { CartProvider } from '@/components/CartProvider';
import './globals.css';

export async function generateMetadata() {
  const theme = await getTheme();
  return { title: t(theme, 'site.name') };
}

/** URL de Google Fonts a partir de las familias del tema (configurables). */
function googleFontsHref(fonts: Array<string | undefined>): string {
  const families = [...new Set(fonts.filter((f): f is string => Boolean(f)))]
    .map((f) => `family=${f.replace(/ /g, '+')}:wght@400;600;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // El tema (colores, tipografía, radios…) viene de la BD vía API y se
  // inyecta como variables CSS ANTES del primer render: sin flash de estilos.
  const theme = await getTheme();
  const { fontSans, fontHeading, fontDisplay } = theme.tokens.typography;

  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={googleFontsHref([fontSans, fontHeading, fontDisplay])} />
        <style
          id="theme-tokens"
          dangerouslySetInnerHTML={{ __html: themeToCss(theme.tokens) }}
        />
      </head>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
