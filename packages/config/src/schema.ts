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

export const themeTokensSchema = z.object({
  colors: z.object({
    light: paletteSchema,
    dark: paletteSchema,
  }),
  typography: typographySchema,
  shape: shapeSchema,
  sections: z.array(sectionSchema),
  /** Modo Cotización B2B: oculta precios y carrito, muestra CTA de cotización. */
  quoteMode: z.boolean(),
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
export type ThemeTokens = z.infer<typeof themeTokensSchema>;
export type Copys = z.infer<typeof copysSchema>;
export type Theme = z.infer<typeof themeSchema>;
