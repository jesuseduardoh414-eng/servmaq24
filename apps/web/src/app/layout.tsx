import type { ReactNode } from 'react';
import { themeToCss } from '@servmaq/config';
import { getTheme, t } from '@/lib/theme';
import './globals.css';

export async function generateMetadata() {
  const theme = await getTheme();
  return { title: t(theme, 'site.name') };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // El tema (colores, tipografía, radios…) viene de la BD vía API y se
  // inyecta como variables CSS ANTES del primer render: sin flash de estilos.
  const theme = await getTheme();

  return (
    <html lang="es">
      <head>
        <style
          id="theme-tokens"
          dangerouslySetInnerHTML={{ __html: themeToCss(theme.tokens) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
