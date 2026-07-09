'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@servmaq/ui';
import type { Copys, Palette, ThemeTokens } from '@servmaq/config';

/** Contraste WCAG (luminancia relativa). AA texto normal: ≥ 4.5. */
function contrast(hex1: string, hex2: string): number {
  const lum = (hex: string) => {
    const m = hex.replace('#', '');
    const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
    const [r, g, b] = [0, 2, 4].map((i) => {
      const v = parseInt(full.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  try {
    const [a, b] = [lum(hex1), lum(hex2)];
    return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100;
  } catch {
    return 21;
  }
}

const PALETTE_LABELS: Record<keyof Palette, string> = {
  primary: 'Primario',
  primaryFg: 'Texto sobre primario',
  secondary: 'Secundario',
  accent: 'Acento',
  background: 'Fondo',
  surface: 'Superficie',
  text: 'Texto',
  textMuted: 'Texto tenue',
  border: 'Borde',
  success: 'Éxito',
  warning: 'Advertencia',
  error: 'Error',
};

function PaletteEditor({
  title,
  palette,
  onChange,
}: {
  title: string;
  palette: Palette;
  onChange: (p: Palette) => void;
}) {
  const warnings: string[] = [];
  const cText = contrast(palette.text, palette.background);
  const cPrimary = contrast(palette.primaryFg, palette.primary);
  if (cText < 4.5) warnings.push(`Texto/Fondo: ${cText}:1 (mínimo 4.5:1)`);
  if (cPrimary < 4.5) warnings.push(`Texto sobre primario: ${cPrimary}:1 (mínimo 4.5:1)`);

  return (
    <Card style={{ display: 'grid', gap: '.7rem' }}>
      <strong>{title}</strong>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '.6rem' }}>
        {(Object.keys(PALETTE_LABELS) as Array<keyof Palette>).map((key) => (
          <label key={key} style={{ display: 'grid', gap: '.2rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            {PALETTE_LABELS[key]}
            <span style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
              <input
                type="color"
                value={palette[key]}
                onChange={(e) => onChange({ ...palette, [key]: e.target.value.toUpperCase() })}
                style={{ width: 34, height: 30, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'none', padding: 0, cursor: 'pointer' }}
              />
              <code style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{palette[key]}</code>
            </span>
          </label>
        ))}
      </div>
      {warnings.length > 0 ? (
        <div role="alert" style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)', display: 'grid', gap: '.2rem' }}>
          {warnings.map((w) => <span key={w}>⚠ Contraste insuficiente — {w}</span>)}
        </div>
      ) : (
        <span style={{ color: 'var(--color-success)', fontSize: 'var(--text-sm)' }}>✓ Contraste WCAG AA correcto</span>
      )}
    </Card>
  );
}

/** Preview con los tokens del borrador aplicados como variables locales. */
function Preview({ tokens, copys }: { tokens: ThemeTokens; copys: Copys }) {
  const p = tokens.colors.light;
  const vars = {
    '--color-primary': p.primary,
    '--color-primary-fg': p.primaryFg,
    '--color-accent': p.accent,
    '--color-bg': p.background,
    '--color-surface': p.surface,
    '--color-text': p.text,
    '--color-text-muted': p.textMuted,
    '--color-border': p.border,
    '--radius-md': tokens.shape.radiusMd,
    '--radius-lg': tokens.shape.radiusLg,
    '--radius-button': tokens.shape.buttonRadius,
    '--text-base': `${tokens.typography.baseSizePx}px`,
    '--text-lg': `${Math.round(tokens.typography.baseSizePx * tokens.typography.scaleRatio)}px`,
    '--text-2xl': `${Math.round(tokens.typography.baseSizePx * Math.pow(tokens.typography.scaleRatio, 3))}px`,
    '--font-sans': `'${tokens.typography.fontSans}', system-ui, sans-serif`,
    '--font-heading': `'${tokens.typography.fontHeading}', system-ui, sans-serif`,
  } as React.CSSProperties;

  const t = (k: string) => copys['es']?.[k] ?? k;

  return (
    <div style={{ ...vars, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.4rem', display: 'grid', gap: '.9rem', position: 'sticky', top: 16 }}>
      <span style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: '.8em', letterSpacing: '.06em' }}>VISTA PREVIA</span>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-text)', margin: 0, lineHeight: 1.15 }}>
        {t('home.hero.title')}
      </h3>
      <p style={{ color: 'var(--color-text-muted)', margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)' }}>
        {t('home.hero.subtitle')}
      </p>
      <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
        <button style={{ fontFamily: 'var(--font-sans)', background: 'var(--color-primary)', color: 'var(--color-primary-fg)', border: 'none', borderRadius: 'var(--radius-button)', padding: '.55em 1.2em', fontWeight: 600, fontSize: 'var(--text-base)' }}>
          {t('home.hero.cta')}
        </button>
        <button style={{ fontFamily: 'var(--font-sans)', background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-button)', padding: '.55em 1.2em', fontWeight: 600, fontSize: 'var(--text-base)' }}>
          {t('product.cta.quote')}
        </button>
      </div>
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '.9rem 1.1rem', fontFamily: 'var(--font-sans)' }}>
        <strong style={{ color: 'var(--color-text)', fontSize: 'var(--text-base)' }}>{t('site.name')}</strong>
        <p style={{ color: 'var(--color-text-muted)', margin: '.3rem 0 0', fontSize: 'var(--text-base)' }}>
          {t('product.price.onQuote')}
        </p>
      </div>
    </div>
  );
}

export function ThemeEditor({
  themeId,
  initialTokens,
  initialCopys,
  hasDraft,
}: {
  themeId: number;
  initialTokens: ThemeTokens;
  initialCopys: Copys;
  hasDraft: boolean;
}) {
  const router = useRouter();
  const [tokens, setTokens] = useState<ThemeTokens>(initialTokens);
  const [copys, setCopys] = useState<Copys>(initialCopys);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const copyKeys = useMemo(() => Object.keys(copys['es'] ?? {}).sort(), [copys]);

  async function call(path: string, body?: unknown) {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/themes/${themeId}/${path}`, {
      method: path === 'draft' ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: typeof data?.message === 'string' ? data.message : 'Error' });
      return false;
    }
    return true;
  }

  const saveDraft = async () => {
    if (await call('draft', { tokens, copys })) setMsg({ ok: true, text: 'Borrador guardado' });
    router.refresh();
  };
  const publish = async () => {
    if (!(await call('draft', { tokens, copys }))) return;
    if (await call('publish')) setMsg({ ok: true, text: 'Publicado — el sitio ya sirve este tema' });
    router.refresh();
  };
  const discard = async () => {
    if (await call('discard')) setMsg({ ok: true, text: 'Borrador descartado' });
    router.refresh();
  };

  const setSection = (key: string, patch: Partial<{ enabled: boolean; order: number }>) => {
    setTokens((t) => ({
      ...t,
      sections: t.sections.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    }));
  };
  const moveSection = (key: string, dir: -1 | 1) => {
    setTokens((t) => {
      const sorted = [...t.sections].sort((a, b) => a.order - b.order);
      const i = sorted.findIndex((s) => s.key === key);
      const j = i + dir;
      if (j < 0 || j >= sorted.length) return t;
      [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      return { ...t, sections: sorted.map((s, idx) => ({ ...s, order: idx })) };
    });
  };

  const inputStyle = { width: '100%' } as const;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '1.2rem', alignItems: 'start' }}>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {/* Barra de acciones */}
        <Card style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button onClick={publish} disabled={busy}>Publicar</Button>
          <Button variant="outline" onClick={saveDraft} disabled={busy}>Guardar borrador</Button>
          {hasDraft ? <Button variant="ghost" onClick={discard} disabled={busy}>Descartar borrador</Button> : null}
          {msg ? (
            <span role={msg.ok ? 'status' : 'alert'} style={{ color: msg.ok ? 'var(--color-success)' : 'var(--color-error)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              {msg.text}
            </span>
          ) : null}
        </Card>

        <PaletteEditor title="Colores — modo claro" palette={tokens.colors.light} onChange={(p) => setTokens({ ...tokens, colors: { ...tokens.colors, light: p } })} />
        <PaletteEditor title="Colores — modo oscuro" palette={tokens.colors.dark} onChange={(p) => setTokens({ ...tokens, colors: { ...tokens.colors, dark: p } })} />

        <Card style={{ display: 'grid', gap: '.7rem' }}>
          <strong>Tipografía y forma</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '.7rem' }}>
            <label style={{ display: 'grid', gap: '.2rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Fuente (Google Fonts)
              <Input value={tokens.typography.fontSans} onChange={(e) => setTokens({ ...tokens, typography: { ...tokens.typography, fontSans: e.target.value, fontHeading: e.target.value } })} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: '.2rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Tamaño base (px)
              <Input type="number" min={12} max={22} value={tokens.typography.baseSizePx} onChange={(e) => setTokens({ ...tokens, typography: { ...tokens.typography, baseSizePx: Number(e.target.value) || 16 } })} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: '.2rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Radio de botones
              <Input value={tokens.shape.buttonRadius} onChange={(e) => setTokens({ ...tokens, shape: { ...tokens.shape, buttonRadius: e.target.value } })} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: '.2rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Radio de tarjetas
              <Input value={tokens.shape.radiusLg} onChange={(e) => setTokens({ ...tokens, shape: { ...tokens.shape, radiusLg: e.target.value } })} style={inputStyle} />
            </label>
          </div>
          <label style={{ display: 'flex', gap: '.5rem', alignItems: 'center', fontSize: 'var(--text-sm)' }}>
            <input type="checkbox" checked={tokens.quoteMode} onChange={(e) => setTokens({ ...tokens, quoteMode: e.target.checked })} />
            Modo Cotización (oculta precios y carrito; muestra CTA de cotización)
          </label>
        </Card>

        <Card style={{ display: 'grid', gap: '.5rem' }}>
          <strong>Secciones de la home (orden y visibilidad)</strong>
          {[...tokens.sections].sort((a, b) => a.order - b.order).map((s, i, arr) => (
            <div key={s.key} style={{ display: 'flex', gap: '.6rem', alignItems: 'center', fontSize: 'var(--text-sm)' }}>
              <input type="checkbox" checked={s.enabled} onChange={(e) => setSection(s.key, { enabled: e.target.checked })} />
              <code style={{ flex: 1, color: s.enabled ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{s.key}</code>
              <Button size="sm" variant="ghost" onClick={() => moveSection(s.key, -1)} disabled={i === 0} aria-label="Subir">↑</Button>
              <Button size="sm" variant="ghost" onClick={() => moveSection(s.key, 1)} disabled={i === arr.length - 1} aria-label="Bajar">↓</Button>
            </div>
          ))}
        </Card>

        <Card style={{ display: 'grid', gap: '.5rem' }}>
          <strong>Textos del sitio (es)</strong>
          <div style={{ display: 'grid', gap: '.4rem', maxHeight: 420, overflowY: 'auto', paddingRight: '.4rem' }}>
            {copyKeys.map((key) => (
              <label key={key} style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '.6rem', alignItems: 'center', fontSize: 'var(--text-sm)' }}>
                <code style={{ color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{key}</code>
                <Input
                  value={copys['es']?.[key] ?? ''}
                  onChange={(e) => setCopys({ ...copys, es: { ...copys['es'], [key]: e.target.value } })}
                  aria-label={key}
                  style={inputStyle}
                />
              </label>
            ))}
          </div>
        </Card>
      </div>

      <Preview tokens={tokens} copys={copys} />
    </div>
  );
}
