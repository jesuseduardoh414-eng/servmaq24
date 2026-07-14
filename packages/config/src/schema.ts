import { z } from 'zod';

/**
 * Schema del sistema de diseño configurable.
 *
 * REGLA DE ORO: todo lo que la UI muestre (color, tamaño, radio, texto)
 * debe existir aquí como token o como clave de copy. Los componentes
 * consumen variables CSS derivadas de estos tokens — nunca literales.
 *
 * El editor visual (Fase 4) edita exactamente lo que este schema permite.
 */

const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'Color hex inválido (ej. #1A2B3C)');

/** Paleta de un esquema (claro u oscuro). */
export const paletteSchema = z.object({
  primary: hexColor,
  primaryFg: hexColor, // texto sobre primario
  secondary: hexColor,
  accent: hexColor,
  background: hexColor,
  surface: hexColor,
  text: hexColor,
  textMuted: hexColor,
  border: hexColor,
  success: hexColor,
  warning: hexColor,
  error: hexColor,
});

export const typographySchema = z.object({
  /** Nombre de familia de Google Fonts para texto corrido. */
  fontSans: z.string().min(1),
  /** Familia para titulares (puede ser la misma). */
  fontHeading: z.string().min(1),
  /** Familia decorativa (título del hero, estilo script del sitio original). */
  fontDisplay: z.string().min(1).optional(),
  /** Tamaño base del body en px. */
  baseSizePx: z.number().min(12).max(22),
  /** Razón de la escala modular (1.2 = compacta, 1.333 = amplia). */
  scaleRatio: z.number().min(1.05).max(1.5),
});

export const shapeSchema = z.object({
  radiusSm: z.string(), // ej. "4px"
  radiusMd: z.string(),
  radiusLg: z.string(),
  /** Variante por defecto de los botones del sitio. */
  buttonStyle: z.enum(['solid', 'outline', 'ghost']),
  buttonRadius: z.string(),
});

/** Secciones de página activables y reordenables desde el admin. */
export const sectionSchema = z.object({
  key: z.string().min(1), // ej. "home.hero", "home.strategic-sectors"
  enabled: z.boolean(),
  order: z.number().int().min(0),
});

/**
 * Identidad de marca (por tema/sector): URLs de logos y favicon subidos desde
 * el admin. Todos opcionales — el sitio cae a texto/valores por defecto si
 * faltan. Se sirven como URLs absolutas (las resuelve la API al subir).
 */
export const brandingSchema = z.object({
  logoLight: z.string().nullable().optional(), // logo para fondos claros
  logoDark: z.string().nullable().optional(), // logo para fondos oscuros / modo oscuro
  favicon: z.string().nullable().optional(), // ícono de pestaña
  icon: z.string().nullable().optional(), // isotipo / ícono de app (cuadrado)
  logoAlt: z.string().nullable().optional(), // variación adicional
});

/**
 * Ajustes de la SECCIÓN 1 (Hero): lo configurable que NO es texto ni imagen
 * (colores propios del hero, enlaces de botones, opacidad del círculo y qué
 * subsecciones se muestran). Los textos viven en copys; título/subtítulo/
 * imagen/badge en el contenido del Hero (BD). Todo con default → si falta,
 * el hero se ve como el diseño base.
 */
export const heroSettingsSchema = z
  .object({
    showBadge: z.boolean().default(true),
    showTrust: z.boolean().default(true),
    showStats: z.boolean().default(true),
    overlay: z.number().min(0).max(100).default(100), // opacidad % del círculo
    primaryLink: z.string().default('/productos'),
    secondaryLink: z.string().default('/cotizar'),
    accentColor: z.string().default('#FFC107'),
    titleColor: z.string().default('#FFFFFF'),
    subtitleColor: z.string().default('#C2C6CF'),
    primaryBg: z.string().default('#FFC107'),
    primaryText: z.string().default('#1A1A1B'),
    secondaryBorder: z.string().default('#4A4A52'),
  })
  .default({});

/**
 * Ajustes de la SECCIÓN 2 · Categorías. El CONTENIDO (nombres/imágenes) sale
 * del módulo de categorías de productos; esto solo controla la presentación:
 * cuántas por vista (carrusel), estilo de tarjeta y colores/visibilidad
 * LOCALES a esta sección. Colores en null ⇒ heredan del tema (claro/oscuro).
 */
export const categoriesSettingsSchema = z
  .object({
    show: z.boolean().default(true),
    perView: z.number().int().min(1).max(6).default(4), // tarjetas visibles a la vez
    cardRadius: z.string().default('18px'),
    imageHeight: z.number().int().min(120).max(340).default(200),
    eyebrowColor: z.string().nullable().default(null), // null ⇒ var(--color-accent)
    titleColor: z.string().nullable().default(null), // null ⇒ var(--color-text)
    cardAccentColor: z.string().nullable().default(null), // flecha/etiqueta; null ⇒ var(--color-primary)
  })
  .default({});

/**
 * Ajustes de la PÁGINA/VISTA de categorías (/categorias). Contenido = mismas
 * categorías del catálogo; esto controla su presentación (grid, estilo tarjeta,
 * colores y qué categoría va destacada). Colores null ⇒ heredan del tema.
 */
/**
 * Bloque tipo banner con CTA (hero superior y anuncio/promo inferior de la
 * vista de categorías). Todo el contenido y presentación viven aquí para que
 * se edite en un solo lugar (Sección 2 · Vista). Colores null ⇒ heredan del tema.
 */
export const ctaBlockSchema = z
  .object({
    enabled: z.boolean().default(false),
    eyebrow: z.string().default(''),
    title: z.string().default(''),
    subtitle: z.string().default(''),
    cta: z.string().default(''), // texto del botón (vacío = sin botón)
    ctaLink: z.string().default('/productos'),
    image: z.string().nullable().default(null), // imagen a la derecha (opcional)
    bg: z.string().nullable().default(null), // fondo de la banda (null = degradado del tema)
    textColor: z.string().nullable().default(null),
    accentColor: z.string().nullable().default(null), // botón/detalles
  })
  .default({});

export const categoriesViewSchema = z
  .object({
    columns: z.number().int().min(2).max(5).default(3),
    cardRadius: z.string().default('18px'),
    imageHeight: z.number().int().min(140).max(360).default(220),
    eyebrowColor: z.string().nullable().default(null),
    titleColor: z.string().nullable().default(null),
    cardAccentColor: z.string().nullable().default(null),
    featuredSlug: z.string().nullable().default(null), // categoría destacada (grande)
    hero: ctaBlockSchema, // banda superior (hero de la página)
    promo: ctaBlockSchema, // banda inferior (anuncio/promo)
  })
  .default({});

/** Sección 3 · Productos destacados (home): presentación de la parrilla. */
export const featuredSchema = z
  .object({
    limit: z.number().int().min(4).max(24).default(8), // cuántos productos mostrar
    showTabs: z.boolean().default(true), // pestañas por categoría
    align: z.enum(['left', 'center']).default('left'), // alineación del encabezado
    eyebrowColor: z.string().nullable().default(null),
    titleColor: z.string().nullable().default(null),
  })
  .default({});

/**
 * Sección 4 · Quiénes somos ("¿Por qué elegirnos?" en el home): presentación.
 * El CONTENIDO (razones, foto) sale del módulo de contenido; esto controla el
 * estilo LOCAL de la sección (imagen principal, colores y qué piezas se ven).
 * Colores null ⇒ heredan del tema (claro/oscuro). image null ⇒ usa la foto de
 * la 1ª razón. Los textos (eyebrow/título/stats/años) viven en copys.
 */
export const whyChooseUsSchema = z
  .object({
    show: z.boolean().default(true),
    image: z.string().nullable().default(null), // imagen principal; null ⇒ foto de la 1ª razón
    showYearsBadge: z.boolean().default(true), // tarjeta flotante "12+ años"
    showStats: z.boolean().default(true), // barra de 3 estadísticas
    eyebrowColor: z.string().nullable().default(null), // null ⇒ var(--color-accent)
    titleColor: z.string().nullable().default(null), // null ⇒ var(--color-text)
    accentColor: z.string().nullable().default(null), // viñeta ◆ de cada razón; null ⇒ var(--color-primary)
    statsBg: z.string().nullable().default(null), // fondo de la barra; null ⇒ var(--color-primary)
    statsFg: z.string().nullable().default(null), // texto de la barra; null ⇒ var(--color-primary-fg)
  })
  .default({});

/**
 * Página /quienes-somos: contenido ESTRUCTURADO (lo que no es prosa). La prosa
 * (título, descripción, misión, visión, objetivos) vive en `inf_sitio` (BD); las
 * "razones" del bloque "Por qué elegirnos" reusan `why_choose_us`. Aquí solo lo
 * que es lista/config: franja de stats, valores, trayectoria, marcas y CTAs.
 */
export const qsStatSchema = z.object({ num: z.string().default(''), label: z.string().default('') });
export const qsValueSchema = z.object({ title: z.string().default(''), desc: z.string().default('') });
export const qsMilestoneSchema = z.object({ year: z.string().default(''), title: z.string().default(''), desc: z.string().default('') });

export const quienesSomosSchema = z
  .object({
    heroCta: z.string().default('Ver catálogo'),
    heroCtaLink: z.string().default('/productos'),
    heroCta2: z.string().default('Contáctanos'),
    heroCta2Link: z.string().default('/contacto'),
    stats: z.array(qsStatSchema).default([
      { num: '11+', label: 'Años de experiencia' },
      { num: '500+', label: 'Equipos en catálogo' },
      { num: '1,200+', label: 'Obras atendidas' },
      { num: '98%', label: 'Clientes satisfechos' },
    ]),
    propositoEyebrow: z.string().default('Nuestro propósito'),
    propositoTitle: z.string().default('Lo que nos mueve'),
    values: z.array(qsValueSchema).default([
      { title: 'Seguridad', desc: 'En cada equipo y operación' },
      { title: 'Compromiso', desc: 'Cumplimos lo que prometemos' },
      { title: 'Confianza', desc: 'Relaciones a largo plazo' },
      { title: 'Eficiencia', desc: 'Tiempos y costos optimizados' },
    ]),
    timelineEyebrow: z.string().default('Nuestra trayectoria'),
    timelineTitle: z.string().default('De un patio de equipos a una red de renta'),
    timeline: z.array(qsMilestoneSchema).default([
      { year: '2014', title: 'Fundación', desc: 'Nace la empresa con un pequeño patio de equipos.' },
      { year: '2017', title: 'Flota propia', desc: 'Superamos los 50 equipos certificados en operación.' },
      { year: '2020', title: 'Cobertura regional', desc: 'Entrega en obra en toda la región y estados vecinos.' },
      { year: '2023', title: 'Plataforma digital', desc: 'Catálogo y renta en línea con soporte 24/7.' },
      { year: '2025', title: '500+ equipos', desc: 'Consolidados como referente en renta de maquinaria.' },
    ]),
    ventajasEyebrow: z.string().default('Ventajas'),
    ventajasTitle: z.string().default('Por qué elegirnos'),
    brandsEyebrow: z.string().default('Trabajamos con las marcas líderes de la industria'),
    brands: z.array(z.string()).default(['CAT', 'KOMATSU', 'KUBOTA', 'JCB', 'VOLVO', 'BOBCAT']),
    ctaTitle: z.string().default('¿Listo para poner tu obra en marcha?'),
    ctaSubtitle: z.string().default('Cotiza la maquinaria que tu proyecto necesita. Entrega en obra, equipos certificados y asesoría de nuestros especialistas.'),
    ctaPrimary: z.string().default('Solicitar cotización'),
    ctaPrimaryLink: z.string().default('/contacto'),
    ctaSecondary: z.string().default('Llámanos'),
    ctaSecondaryLink: z.string().default('/contacto'),
  })
  .default({});

/**
 * Sección 5 · Sectores estratégicos (home): presentación de las tarjetas overlay.
 * El CONTENIDO (título/descr/imagen de cada sector) sale de la tabla
 * strategic_sectors; esto controla el estilo LOCAL. Colores null ⇒ heredan del tema.
 */
export const sectorsSchema = z
  .object({
    show: z.boolean().default(true),
    limit: z.number().int().min(2).max(8).default(4), // cuántas tarjetas
    cardHeight: z.number().int().min(220).max(460).default(340),
    eyebrowColor: z.string().nullable().default(null),
    titleColor: z.string().nullable().default(null),
    ctaColor: z.string().nullable().default(null), // enlace "Explorar equipos"; null ⇒ var(--color-primary)
  })
  .default({});

/**
 * Sección 6 · Oferta / Promoción (home): la banda destacada de oferta.
 * Los textos (badge/título/subtítulo/cta) viven en copys; esto controla imagen,
 * enlace, colores y visibilidad. Colores null ⇒ heredan del tema.
 */
export const offerSchema = z
  .object({
    show: z.boolean().default(true),
    image: z.string().nullable().default(null), // imagen del lado derecho (null ⇒ patrón decorativo)
    ctaLink: z.string().default('/productos'),
    bg: z.string().nullable().default(null), // fondo de la banda; null ⇒ var(--color-secondary)
    accentColor: z.string().nullable().default(null), // badge + botón; null ⇒ var(--color-primary)
    titleColor: z.string().nullable().default(null), // null ⇒ #fff
  })
  .default({});

/**
 * Sección 7 · Reseñas (home): presentación del carrusel "Lo que dicen nuestros
 * clientes". El CONTENIDO son reseñas de clientes (tabla site_reviews) que se
 * MODERAN en Clientes → Reseñas; esto solo controla textos/estilo/visibilidad.
 */
export const reviewsSchema = z
  .object({
    show: z.boolean().default(true),
    limit: z.number().int().min(3).max(20).default(8), // cuántas reseñas traer
    eyebrowColor: z.string().nullable().default(null),
    titleColor: z.string().nullable().default(null),
    accentColor: z.string().nullable().default(null), // estrellas y comillas; null ⇒ var(--color-primary)
  })
  .default({});

/**
 * Sección 8 · Preguntas frecuentes (home): presentación de la banda de FAQ.
 * El CONTENIDO (preguntas/respuestas) se edita en Contenido → FAQ; esto solo
 * controla textos del encabezado, colores y visibilidad. Colores null ⇒ tema.
 */
export const faqSchema = z
  .object({
    show: z.boolean().default(true),
    eyebrowColor: z.string().nullable().default(null),
    titleColor: z.string().nullable().default(null),
    accentColor: z.string().nullable().default(null), // signo +/- de cada item; null ⇒ var(--color-primary)
  })
  .default({});

/** Página de catálogo /productos: banner superior + anuncio intermedio + promo inferior. */
export const catalogSchema = z
  .object({
    banner: ctaBlockSchema, // banda de anuncio arriba del catálogo
    mid: ctaBlockSchema, // anuncio/visual intermedio (entre grupos de productos)
    promo: ctaBlockSchema, // banda de promoción debajo de la parrilla
  })
  .default({});

/**
 * Página de Contacto (/contacto). Además de la página, los canales (phone,
 * whatsapp, email, hours) alimentan la barra superior y el pie de página, así
 * que editar aquí actualiza el contacto en todo el sitio.
 */
export const contactStatSchema = z.object({
  value: z.string().default(''), // "<24h", "32", "3", "+15años"
  label: z.string().default(''), // "Tiempo de respuesta"
});
export const contactBranchSchema = z.object({
  city: z.string().default(''),
  address: z.string().default(''),
  phone: z.string().default(''),
  isNew: z.boolean().default(false),
  image: z.string().nullable().default(null), // foto/mapa de la sucursal (null ⇒ patrón decorativo)
});
export const contactUrgentSchema = z.object({
  show: z.boolean().default(true),
  eyebrow: z.string().default('Renta urgente'),
  title: z.string().default('¿Necesitas equipo hoy mismo?'),
  ctaLabel: z.string().default('Llamar ahora'),
});
export const contactSchema = z
  .object({
    eyebrow: z.string().default('Atención a clientes'),
    title: z.string().default('Hablemos de tu obra'),
    subtitle: z.string().default('Cotizaciones, disponibilidad de equipo o soporte técnico. Elige el canal que más te acomode.'),
    stats: z.array(contactStatSchema).default([
      { value: '<24h', label: 'Tiempo de respuesta' },
      { value: '32', label: 'Estados de cobertura' },
      { value: '3', label: 'Sucursales' },
      { value: '+15 años', label: 'De experiencia' },
    ]),
    phone: z.string().default('833 224 56 78'),
    whatsapp: z.string().default('833 224 56 78'),
    email: z.string().default('info@maqserv24.com'),
    hours: z.string().default('Lun–Sáb · 8:00–18:00'),
    urgent: contactUrgentSchema.default({}),
    needs: z.array(z.string()).default(['Rentar equipo', 'Cotización', 'Soporte técnico', 'Otro']),
    branches: z.array(contactBranchSchema).default([
      { city: 'Tampico', address: 'Av. Hidalgo 2450, Col. Centro, Tampico, Tamps. — Matriz', phone: '833 224 56 78', isNew: false, image: null },
      { city: 'Monterrey', address: 'Blvd. Díaz Ordaz 1200, San Pedro Garza García, N.L.', phone: '81 1122 3344', isNew: true, image: null },
      { city: 'Guadalajara', address: 'Periférico Norte 850, Zapopan, Jal.', phone: '33 4455 6677', isNew: false, image: null },
    ]),
  })
  .default({});

/** Pie de página (footer): boletín, columnas de enlaces, redes y copyright. */
export const footerLinkSchema = z.object({ label: z.string().default(''), href: z.string().default('/') });
export const footerColumnSchema = z.object({
  title: z.string().default(''),
  links: z.array(footerLinkSchema).default([]),
});
export const footerSocialSchema = z.object({ label: z.string().default(''), href: z.string().default('') });
export const footerSchema = z
  .object({
    tagline: z.string().default('Plataforma especializada en renta y venta de maquinaria industrial para proyectos de construcción.'),
    showNewsletter: z.boolean().default(true),
    newsletterTitle: z.string().default('Recibe nuestras novedades'),
    newsletterSubtitle: z.string().default('Novedades, disponibilidad de equipo y guías directo a tu correo.'),
    columns: z.array(footerColumnSchema).default([
      { title: 'Empresa', links: [
        { label: 'Quiénes somos', href: '/quienes-somos' },
        { label: 'Blog', href: '/blog' },
        { label: 'Vacantes', href: '/contacto' },
        { label: 'Prensa', href: '/contacto' },
      ] },
      { title: 'Productos', links: [
        { label: 'Centro de ayuda', href: '/contacto' },
        { label: 'Productos', href: '/productos' },
        { label: 'Sectores estratégicos', href: '/productos' },
      ] },
      { title: 'Ayuda', links: [
        { label: 'Centro de ayuda', href: '/contacto' },
        { label: 'Rastrear pedido', href: '/rastreo' },
        { label: 'Devoluciones', href: '/contacto' },
        { label: 'Garantías', href: '/contacto' },
        { label: 'Contacto', href: '/contacto' },
      ] },
    ]),
    social: z.array(footerSocialSchema).default([
      { label: 'f', href: '' },
      { label: 'in', href: '' },
      { label: 'ig', href: '' },
      { label: 'wa', href: '' },
    ]),
    copyright: z.string().default(''), // vacío ⇒ "© {año} {marca}. Todos los derechos reservados."
  })
  .default({});

export const themeTokensSchema = z.object({
  colors: z.object({
    light: paletteSchema,
    dark: paletteSchema,
  }),
  typography: typographySchema,
  shape: shapeSchema,
  sections: z.array(sectionSchema),
  /** Identidad de marca: logos y favicon (opcional; default {}). */
  branding: brandingSchema.default({}),
  /** Ajustes de la Sección 1 · Hero (colores, links, opacidad, toggles). */
  hero: heroSettingsSchema,
  /** Ajustes de la Sección 2 · Categorías (adelanto en el home). */
  categories: categoriesSettingsSchema,
  /** Ajustes de la página/vista de categorías (/categorias). */
  categoriesView: categoriesViewSchema,
  /** Ajustes de la Sección 3 · Productos destacados (home). */
  featured: featuredSchema,
  /** Banner + anuncio + promo de la página de catálogo (/productos). */
  catalog: catalogSchema,
  /** Ajustes de la Sección 4 · Quiénes somos ("¿Por qué elegirnos?" del home). */
  whyChooseUs: whyChooseUsSchema,
  /** Contenido estructurado de la página /quienes-somos (stats, valores, trayectoria, marcas, CTA). */
  quienesSomos: quienesSomosSchema,
  /** Ajustes de la Sección 5 · Sectores estratégicos (home). */
  sectors: sectorsSchema,
  /** Ajustes de la Sección 6 · Oferta / Promoción (home). */
  offer: offerSchema,
  /** Ajustes de la Sección 7 · Reseñas (home). */
  reviews: reviewsSchema,
  /** Ajustes de la Sección 8 · Preguntas frecuentes (home). */
  faq: faqSchema,
  /** Página de Contacto (/contacto) + canales que alimentan barra superior y footer. */
  contact: contactSchema,
  /** Pie de página (footer): boletín, columnas, redes y copyright. */
  footer: footerSchema,
  /** Modo Cotización B2B: oculta precios y carrito, muestra CTA de cotización. */
  quoteMode: z.boolean(),
  /** Modo de color por defecto del sitio: 'auto' sigue al SO; el usuario puede
   *  forzar claro/oscuro con el toggle (se guarda en su navegador). */
  defaultMode: z.enum(['auto', 'light', 'dark']).default('auto'),
});

/**
 * Copys por clave y por idioma: { es: { "home.hero.title": "..." }, en: {...} }.
 * Ningún texto visible vive en el JSX: se resuelve por clave contra esto.
 */
export const copysSchema = z.record(z.string(), z.record(z.string(), z.string()));

/** Tema completo tal como se persiste/sirve (registro de la tabla `themes`). */
export const themeSchema = z.object({
  slug: z.string().min(1), // ej. "maquinaria", "medical"
  name: z.string().min(1),
  active: z.boolean(),
  tokens: themeTokensSchema,
  copys: copysSchema,
});

export type Palette = z.infer<typeof paletteSchema>;
export type Typography = z.infer<typeof typographySchema>;
export type Shape = z.infer<typeof shapeSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Branding = z.infer<typeof brandingSchema>;
export type HeroSettings = z.infer<typeof heroSettingsSchema>;
export type CategoriesSettings = z.infer<typeof categoriesSettingsSchema>;
export type CategoriesView = z.infer<typeof categoriesViewSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type Featured = z.infer<typeof featuredSchema>;
export type WhyChooseUs = z.infer<typeof whyChooseUsSchema>;
export type QuienesSomos = z.infer<typeof quienesSomosSchema>;
export type Sectors = z.infer<typeof sectorsSchema>;
export type Offer = z.infer<typeof offerSchema>;
export type Reviews = z.infer<typeof reviewsSchema>;
export type Faq = z.infer<typeof faqSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type ContactStat = z.infer<typeof contactStatSchema>;
export type ContactBranch = z.infer<typeof contactBranchSchema>;
export type Footer = z.infer<typeof footerSchema>;
export type FooterColumn = z.infer<typeof footerColumnSchema>;
export type FooterLink = z.infer<typeof footerLinkSchema>;
export type FooterSocial = z.infer<typeof footerSocialSchema>;
export type QsStat = z.infer<typeof qsStatSchema>;
export type QsValue = z.infer<typeof qsValueSchema>;
export type QsMilestone = z.infer<typeof qsMilestoneSchema>;
export type CtaBlock = z.infer<typeof ctaBlockSchema>;
export type ThemeTokens = z.infer<typeof themeTokensSchema>;
export type Copys = z.infer<typeof copysSchema>;
export type Theme = z.infer<typeof themeSchema>;
