import { redirect } from 'next/navigation';
import Link from 'next/link';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';

interface Dashboard {
  products: number;
  orders: number;
  pendingOrders: number;
  quotes: number;
  pendingQuotes: number;
  users: number;
  vendorsPending: number;
  withdrawsPending: number;
}

interface StatCard {
  value: number;
  label: string;
  icon: string;
  href: string;
  pending?: string;
  accent?: boolean;
}

export default async function AdminHome() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const d = await adminFetch<Dashboard>('/admin/dashboard');

  const cards: StatCard[] = d
    ? [
        { value: d.products, label: 'Productos activos', icon: 'ph-package', href: '/productos' },
        {
          value: d.orders,
          label: 'Órdenes',
          icon: 'ph-receipt',
          href: '/ordenes',
          pending: d.pendingOrders ? `${d.pendingOrders} pendientes` : undefined,
        },
        {
          value: d.quotes,
          label: 'Cotizaciones',
          icon: 'ph-file-text',
          href: '/cotizaciones',
          pending: d.pendingQuotes ? `${d.pendingQuotes} pendientes` : undefined,
        },
        { value: d.users, label: 'Clientes', icon: 'ph-users', href: '/usuarios' },
        { value: d.vendorsPending, label: 'Vendedores por aprobar', icon: 'ph-storefront', href: '/vendedores' },
        { value: d.withdrawsPending, label: 'Retiros pendientes', icon: 'ph-hand-coins', href: '/retiros', accent: true },
      ]
    : [];

  return (
    <AdminShell adminName={admin.name} adminEmail={admin.email}>
      <div className="adm-pagehead">
        <div>
          <h1 className="adm-page-title">Panel</h1>
          <p className="adm-page-sub">Resumen general de la actividad de tu tienda.</p>
        </div>
        <Link href="/productos/nuevo" className="adm-cta">
          <i className="ph-bold ph-plus" aria-hidden /> Nuevo producto
        </Link>
      </div>

      <div className="adm-stat-grid">
        {cards.map((c) => {
          const accentIcon = c.accent || Boolean(c.pending);
          return (
            <Link key={c.label} href={c.href} className="adm-stat-card">
              <div className="adm-stat-top">
                <div className={`adm-stat-ico${accentIcon ? ' accent' : ''}`}>
                  <i className={`ph ${c.icon}`} aria-hidden />
                </div>
                <i className="ph ph-arrow-up-right adm-stat-arrow" aria-hidden />
              </div>
              <div className="adm-stat-body">
                <div className="adm-stat-value">{c.value}</div>
                <div className="adm-stat-meta">
                  <span className="adm-stat-label">{c.label}</span>
                  {c.pending ? (
                    <span className="adm-stat-pill">
                      <span /> {c.pending}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </AdminShell>
  );
}
