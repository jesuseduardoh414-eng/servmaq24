import { redirect } from 'next/navigation';
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

export default async function AdminHome() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const d = await adminFetch<Dashboard>('/admin/dashboard');

  const cards: Array<[string, number, string?]> = d
    ? [
        ['Productos activos', d.products],
        ['Órdenes', d.orders, d.pendingOrders ? `${d.pendingOrders} pendientes` : undefined],
        ['Cotizaciones', d.quotes, d.pendingQuotes ? `${d.pendingQuotes} pendientes` : undefined],
        ['Clientes', d.users],
        ['Vendedores por aprobar', d.vendorsPending],
        ['Retiros pendientes', d.withdrawsPending],
      ]
    : [];

  return (
    <AdminShell adminName={admin.name}>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.4rem' }}>Panel</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {cards.map(([label, value, hint]) => (
          <div
            key={label}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.1rem 1.3rem',
              display: 'grid',
              gap: '.2rem',
            }}
          >
            <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{label}</span>
            {hint ? <span style={{ color: 'var(--color-warning)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>{hint}</span> : null}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
