import { Button, Card, Input } from '@servmaq/ui';
import { getTheme, t } from '@/lib/theme';

/**
 * Página de prueba de la Fase 0: demuestra que TODO (colores, textos,
 * radios, tipografía) proviene del tema en la BD. Cambiar un token en la
 * tabla `themes` y refrescar debe alterar esta página sin recompilar.
 * En la Fase 1 se reemplaza por la home real con secciones configurables.
 */
export default async function Home() {
  const theme = await getTheme();
  const palette = Object.entries(theme.tokens.colors.light);

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '3rem 1.5rem', display: 'grid', gap: '2rem' }}>
      <header style={{ display: 'grid', gap: '.5rem' }}>
        <p style={{ color: 'var(--color-accent)', fontWeight: 600, margin: 0 }}>
          {t(theme, 'site.name')} · Fase 0 — sistema de tokens vivo
        </p>
        <h1 style={{ fontSize: 'var(--text-3xl)' }}>{t(theme, 'home.hero.title')}</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{t(theme, 'home.hero.subtitle')}</p>
        <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
          <Button>{t(theme, 'home.hero.cta')}</Button>
          <Button variant="outline">{t(theme, 'product.cta.quote')}</Button>
          <Button variant="ghost">{t(theme, 'nav.contact')}</Button>
        </div>
      </header>

      <Card>
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '.75rem' }}>
          Tema activo: <code>{theme.slug}</code>
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 0 }}>
          Servido por la API desde la tabla <code>themes</code>. Edita un color ahí y refresca.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '.6rem' }}>
          {palette.map(([name, hex]) => (
            <div key={name} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <div style={{ background: hex, height: 42 }} />
              <div style={{ padding: '.35rem .5rem', fontSize: 'var(--text-sm)' }}>
                <strong>{name}</strong>
                <div style={{ color: 'var(--color-text-muted)' }}>{hex}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ display: 'grid', gap: '.75rem' }}>
        <h2 style={{ fontSize: 'var(--text-xl)' }}>Componentes base</h2>
        <Input placeholder="Input sobre tokens…" aria-label="Ejemplo de input" />
        <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
          <Button size="sm">Pequeño</Button>
          <Button size="md">Mediano</Button>
          <Button size="lg">Grande</Button>
        </div>
      </Card>
    </main>
  );
}
