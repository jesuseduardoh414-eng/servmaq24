import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { D, FONT } from '@/components/design-tokens';
import { AdminCreate } from './AdminCreate';
import { AdminRowActions } from './AdminRowActions';

interface AdminRow {
  id: number;
  name: string;
  email: string;
  role: string;
  status: number;
  /** Sin cuenta en Supabase no puede entrar, por más "Activo" que se vea. */
  canLogin: boolean;
  isMe: boolean;
  createdAt: string | null;
}

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const GREEN = '#3fbf8f';
const RED = '#f55';
const GRID = '1.5fr 1.8fr 1fr 1.6fr';
const th: React.CSSProperties = { fontSize: 10.5, letterSpacing: '1px', fontWeight: 700, color: '#7A7A7F' };
const statCard: React.CSSProperties = { minWidth: 150, background: D.card, border: `1px solid ${D.inputBorder}`, borderRadius: 14, padding: '14px 18px' };

/** Quién puede entrar al panel. Acceso total: aquí no hay roles parciales. */
export default async function AdminAdmins() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const admins = (await adminFetch<AdminRow[]>('/admin/admins')) ?? [];

  const activos = admins.filter((a) => a.status === 1).length;
  const rotos = admins.filter((a) => !a.canLogin);

  return (
    <AdminShell adminName={admin.name} adminEmail={admin.email}>
      <div style={{ fontFamily: FONT, color: D.text }}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" />
        <style>{`
          .am-row:hover{ background: rgba(255,255,255,0.022); }
          @media (max-width: 900px){ .am-grid{ grid-template-columns: 1fr 1fr !important; row-gap: 10px !important; } .am-head{ display:none !important; } }
        `}</style>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#8A8A8F', fontWeight: 500 }}>
              <span>Configuración</span><span style={{ color: '#4C4C51' }}>/</span><span style={{ color: '#B4B4B9' }}>Administradores</span>
            </div>
            <h1 style={{ margin: '8px 0 0', fontSize: 30, fontWeight: 800, letterSpacing: '-0.8px', color: '#FBFBFA' }}>Administradores</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#8A8A8F', maxWidth: '70ch' }}>
              Quién puede entrar a este panel. Todos tienen acceso total: no hay permisos por sección.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={statCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN, boxShadow: `0 0 10px ${GREEN}99` }} />
                <span style={{ fontSize: 12, color: '#8A8A8F', fontWeight: 600 }}>Con acceso</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, color: GREEN, fontFamily: MONO }}>{activos}</div>
            </div>
          </div>
        </div>

        {/* Cuentas que se ven "Activo" pero no pueden entrar (creadas antes del arreglo). */}
        {rotos.length > 0 ? (
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'flex-start', gap: 11, background: 'rgba(255,85,85,0.06)', border: '1px solid rgba(255,85,85,0.3)', borderRadius: 12, padding: '13px 17px' }}>
            <i className="ph ph-warning" style={{ color: RED, fontSize: 16, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: '#D4D4D8', lineHeight: 1.55 }}>
              <strong style={{ color: '#FBFBFA' }}>
                {rotos.length} cuenta{rotos.length === 1 ? '' : 's'} sin acceso configurado.
              </strong>{' '}
              Existe{rotos.length === 1 ? '' : 'n'} en la lista pero no puede{rotos.length === 1 ? '' : 'n'} entrar: le{rotos.length === 1 ? '' : 's'} falta la cuenta
              de acceso. Bórrala{rotos.length === 1 ? '' : 's'} y vuelve a crearla{rotos.length === 1 ? '' : 's'} desde aquí.
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 20 }}>
          <AdminCreate />
        </div>

        <div style={{ marginTop: 18, background: '#0F0F11', border: `1px solid ${D.inputBorder}`, borderRadius: 16, overflow: 'hidden' }}>
          <div className="am-head" style={{ display: 'grid', gridTemplateColumns: GRID, gap: 16, padding: '15px 24px', borderBottom: `1px solid ${D.cardBorder}`, background: '#131315' }}>
            <div style={th}>NOMBRE</div>
            <div style={th}>CORREO</div>
            <div style={th}>ESTADO</div>
            <div style={{ ...th, textAlign: 'right' }}>ACCIONES</div>
          </div>

          {admins.map((a) => {
            const activo = a.status === 1;
            // "Activo" sin cuenta de acceso es mentira: se dice.
            const color = !a.canLogin ? RED : activo ? GREEN : '#6B6B71';
            const label = !a.canLogin ? 'Sin acceso' : activo ? 'Activo' : 'Inactivo';
            return (
              <div key={a.id} className="am-row am-grid" style={{ display: 'grid', gridTemplateColumns: GRID, gap: 16, padding: '15px 24px', borderBottom: '1px solid rgba(255,255,255,0.045)', alignItems: 'center', opacity: activo ? 1 : 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <span style={{ width: 3, alignSelf: 'stretch', minHeight: 24, borderRadius: 3, background: color, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#EDEDEC' }}>
                      {a.name}
                      {a.isMe ? <span style={{ color: D.amber, fontWeight: 600, fontSize: 11.5 }}> · tú</span> : null}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#5C5C61', marginTop: 3 }}>{a.role}</div>
                  </div>
                </div>

                <div style={{ fontSize: 12.5, color: '#B4B4B9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email}</div>

                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color, whiteSpace: 'nowrap', background: `color-mix(in srgb, ${color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 26%, transparent)`, borderRadius: 20, padding: '5px 11px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    {label}
                  </span>
                </div>

                <AdminRowActions adminId={a.id} name={a.name} status={a.status} isMe={a.isMe} canLogin={a.canLogin} />
              </div>
            );
          })}
        </div>

        <p style={{ margin: '16px 0 0', fontSize: 11.5, color: '#5C5C61', lineHeight: 1.55, maxWidth: '80ch' }}>
          Desactivar corta el acceso de inmediato, incluso si la persona tiene la sesión abierta. No puedes desactivar tu propia cuenta.
        </p>
      </div>
    </AdminShell>
  );
}
