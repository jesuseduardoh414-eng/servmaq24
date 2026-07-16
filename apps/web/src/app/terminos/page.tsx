import type { Metadata } from 'next';
import { defaultTheme, LEGAL_DEFAULTS } from '@maqserv/config';
import { getTheme, t } from '@/lib/theme';
import { LegalPage } from '@/components/LegalPage';

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getTheme();
  return { title: `Términos y Condiciones — ${t(theme, 'site.name')}` };
}

export default async function TerminosPage() {
  const theme = await getTheme();
  const legal = theme.tokens.legal ?? defaultTheme.tokens.legal;
  // Si el admin aún no editó (sin secciones), usamos la plantilla por defecto.
  const doc = legal.terms.sections.length > 0 ? legal.terms : LEGAL_DEFAULTS.terms;

  return (
    <LegalPage
      theme={theme}
      eyebrow="LEGAL"
      title="Términos y Condiciones"
      updated={doc.updated || 'Julio 2026'}
      intro={doc.intro}
      sections={doc.sections}
    />
  );
}
