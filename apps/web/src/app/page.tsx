import type { ReactNode } from 'react';
import type { Theme } from '@servmaq/config';
import { getTheme } from '@/lib/theme';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import {
  BannersSection,
  BlogSection,
  CategoriesSection,
  FaqSection,
  FeaturedSection,
  Hero,
  ReviewsSection,
  SectorsSection,
  SuccessCasesSection,
  ServicesSection,
  WhyChooseUsSection,
} from '@/components/home-sections';

/**
 * Home con SECCIONES CONFIGURABLES: qué se muestra y en qué orden lo decide
 * `theme.tokens.sections` (editable desde el admin en F4). Las claves sin
 * componente registrado se omiten sin romper.
 */
const SECTIONS: Record<string, (props: { theme: Theme }) => Promise<ReactNode> | ReactNode> = {
  'home.hero': Hero,
  'home.categories': CategoriesSection,
  'home.featured-products': FeaturedSection,
  'home.strategic-sectors': SectorsSection,
  'home.why-choose-us': WhyChooseUsSection,
  'home.services': ServicesSection,
  'home.banners': BannersSection,
  'home.blog': BlogSection,
  'home.reviews': ReviewsSection,
  'home.success-cases': SuccessCasesSection,
  'home.faq': FaqSection,
};

export default async function Home() {
  const theme = await getTheme();
  const enabled = theme.tokens.sections
    .filter((s) => s.enabled && SECTIONS[s.key])
    .sort((a, b) => a.order - b.order);

  return (
    <>
      <SiteHeader theme={theme} />
      <main>
        {enabled.map((s) => {
          const Section = SECTIONS[s.key];
          return <Section key={s.key} theme={theme} />;
        })}
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
