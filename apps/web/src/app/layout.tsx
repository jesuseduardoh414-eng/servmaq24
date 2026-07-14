import type { ReactNode } from 'react';
import { themeToCss } from '@maqserv/config';
import { getTheme, t } from '@/lib/theme';
import { CartProvider } from '@/components/CartProvider';
import { DevAutoRefresh } from '@/components/DevAutoRefresh';
import './globals.css';

export async function generateMetadata() {
  const theme = await getTheme();
  return { title: t(theme, 'site.name') };
}

/**
 * URL de Google Fonts a partir de las familias del tema (configurables).
 * La familia de TEXTO (sans) pide el rango completo de pesos; las de titular/
 * display suelen ser de un solo peso (p. ej. Archivo Black), así que se piden
 * sin eje `wght` — pedir un peso inexistente hace que Google devuelva 400 y no
 * cargue ninguna fuente.
 */
function googleFontsHref(sans: string, displayFamilies: Array<string | undefined>): string {
  const enc = (f: string) => f.replace(/ /g, '+');
  const parts = [`family=${enc(sans)}:wght@300;400;500;600;700;800`];
  for (const fam of new Set(displayFamilies.filter((f): f is string => Boolean(f) && f !== sans))) {
    parts.push(`family=${enc(fam)}`);
  }
  return `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap`;
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // El tema (colores, tipografía, radios…) viene de la BD vía API y se
  // inyecta como variables CSS ANTES del primer render: sin flash de estilos.
  const theme = await getTheme();
  const { fontSans, fontHeading, fontDisplay } = theme.tokens.typography;
  const defaultMode = theme.tokens.defaultMode ?? 'auto';
  // Anti-parpadeo: fija data-theme ANTES del primer pintado, según la
  // preferencia guardada por el usuario o el modo por defecto del tema (BD).
  const themeInit = `(function(){try{var s=localStorage.getItem('theme');var d='${defaultMode}';var m=s||(d==='auto'?'':d);if(m==='light'||m==='dark')document.documentElement.setAttribute('data-theme',m);}catch(e){}})();`;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={googleFontsHref(fontSans, [fontHeading, fontDisplay])} />
        {theme.tokens.branding?.favicon ? <link rel="icon" href={theme.tokens.branding.favicon} /> : null}
        {theme.tokens.branding?.icon ? <link rel="apple-touch-icon" href={theme.tokens.branding.icon} /> : null}
        <style
          id="theme-tokens"
          dangerouslySetInnerHTML={{ __html: themeToCss(theme.tokens) }}
        />
      </head>
      <body>
        <CartProvider>{children}</CartProvider>
        <DevAutoRefresh />
      </body>
    </html>
  );
}
