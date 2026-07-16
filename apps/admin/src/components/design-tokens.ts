/**
 * Paleta y fuentes del cromo del admin (valores literales, no tokens del tema:
 * el panel es oscuro siempre; el acento del SITIO se edita en Diseño).
 *
 * Módulo SIN 'use client' a propósito: `editor-kit` sí lo es, y un componente de
 * servidor no puede leer los valores que exporta un módulo de cliente. Al vivir
 * aquí, la paleta la pueden usar los dos lados. `editor-kit` la reexporta para
 * no romper a quien ya la importaba de ahí.
 */
export const D = {
  card: '#141416',
  cardBorder: 'rgba(255,255,255,0.06)',
  inputBg: 'rgba(255,255,255,0.03)',
  inputBorder: 'rgba(255,255,255,0.08)',
  amber: '#f5b81e',
  text: '#f5f5f4',
  muted: '#6b6b72',
  muted2: '#71717a',
  previewBg: '#0e0e12',
  tabsBg: '#101012',
};

export const FONT = "'Manrope', system-ui, sans-serif";

export const PRESETS = ['#f5b81e', '#5b9dff', '#3fbf8f', '#ff7a59', '#b98cff', '#ffffff', '#c2c6cf'];
