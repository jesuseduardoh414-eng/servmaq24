import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { Table, Td } from '@/components/Table';
import { ActionButton } from '@/components/actions';

interface VendorRow {
  id: number;
  name: string;
  email: string;
  shopName: string | null;
  status: number;
  balance: number;
}

export default async function AdminVendors() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const vendors = (await adminFetch<VendorRow[]>('/admin/vendors')) ?? [];

  return (
    <AdminShell adminName={admin.name} adminEmail={admin.email}>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.2rem' }}>Vendedores</h1>
      <Table headers={['Tienda', 'Titular', 'Saldo', 'Estado', 'Acciones']}>
        {vendors.map((v) => (
          <tr key={v.id}>
            <Td><strong>{v.shopName ?? '—'}</strong></Td>
            <Td>{v.name}<br /><span style={{ color: 'var(--color-text-muted)' }}>{v.email}</span></Td>
            <Td><span style={{ fontVariantNumeric: 'tabular-nums' }}>${v.balance.toLocaleString('es-MX')}</span></Td>
            <Td>{v.status === 2 ? 'Aprobado' : 'Pendiente'}</Td>
            <Td>
              <div style={{ display: 'flex', gap: '.4rem' }}>
                {v.status === 1 ? (
                  <ActionButton path={`vendors/${v.id}`} body={{ status: 2 }} label="Aprobar" variant="solid" />
                ) : null}
                <ActionButton
                  path={`vendors/${v.id}`}
                  body={{ status: 0 }}
                  label="Revocar"
                  variant="ghost"
                  confirm="¿Revocar la cuenta de vendedor?"
                />
              </div>
            </Td>
          </tr>
        ))}
      </Table>
    </AdminShell>
  );
}
