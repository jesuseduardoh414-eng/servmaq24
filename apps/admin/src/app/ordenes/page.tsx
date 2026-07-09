import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { Table, Td } from '@/components/Table';
import { StatusSelect } from '@/components/actions';

interface OrderRow {
  id: number;
  orderNumber: string;
  customer: string | null;
  email: string | null;
  method: string | null;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string | null;
}

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const sp = await searchParams;
  const data = await adminFetch<{ items: OrderRow[]; page: number; pages: number }>(
    `/admin/orders?page=${sp.page ?? 1}`,
  );

  return (
    <AdminShell adminName={admin.name}>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.2rem' }}>Órdenes</h1>
      <Table headers={['Orden', 'Cliente', 'Método', 'Total', 'Pago', 'Estado', 'Fecha']}>
        {(data?.items ?? []).map((o) => (
          <tr key={o.id}>
            <Td><strong>{o.orderNumber}</strong></Td>
            <Td>{o.customer}<br /><span style={{ color: 'var(--color-text-muted)' }}>{o.email}</span></Td>
            <Td muted>{o.method}</Td>
            <Td><strong style={{ fontVariantNumeric: 'tabular-nums' }}>${o.total.toLocaleString('es-MX')}</strong></Td>
            <Td>
              <StatusSelect path={`orders/${o.id}`} field="paymentStatus" value={o.paymentStatus} options={['Pending', 'Completed']} />
            </Td>
            <Td>
              <StatusSelect path={`orders/${o.id}`} field="status" value={o.status} options={['pending', 'processing', 'completed', 'declined']} />
            </Td>
            <Td muted>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('es-MX') : ''}</Td>
          </tr>
        ))}
      </Table>
    </AdminShell>
  );
}
