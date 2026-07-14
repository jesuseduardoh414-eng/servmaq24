'use client';

import { useEffect, useState } from 'react';

type Mode = 'light' | 'dark';

/**
 * Toggle claro/oscuro. Escribe `data-theme` en <html> (el CSS del tema ya tiene
 * `:root[data-theme="light|dark"]` con las paletas de la BD) y guarda la
 * preferencia en localStorage. El estado inicial lo pone un script inline en el
 * <head> (sin parpadeo); aquí solo sincronizamos el ícono y alternamos.
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') as Mode | null;
    const effective: Mode = current ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setMode(effective);
  }, []);

  function toggle() {
    const next: Mode = mode === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch { /* ignora */ }
    setMode(next);
  }

  const isDark = mode === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      className="hdr-icon"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      style={{
        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
        border: 'none', background: 'transparent',
        color: 'var(--color-text-muted)', cursor: 'pointer', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <span suppressHydrationWarning style={{ display: 'inline-flex' }}>
        {mode === null ? (
          <span style={{ width: 20, height: 20 }} />
        ) : isDark ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
        )}
      </span>
    </button>
  );
}
