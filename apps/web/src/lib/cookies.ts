/**
 * Nombres de las cookies de sesión. Módulo SIN imports server-only (no usa
 * next/headers) para poder importarse desde el middleware, que corre en Edge.
 */
export const SESSION_COOKIE = 'servmaq_session';
/** Refresh token de Supabase; el middleware lo usa para renovar el access token. */
export const REFRESH_COOKIE = 'servmaq_refresh';
