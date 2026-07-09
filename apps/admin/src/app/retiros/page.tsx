import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { Table, Td } from '@/components/Table';
import { ActionButton } from '@/components/actions';

interface WithdrawRow {
  id: number;
  vendor: string | null;
  amount: number;
  method: string | null;
  reference: string | null;
  status: string;
  createdAt: string | null;
}

export default async function AdminWithdraws() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const rows = (await adminFetch<WithdrawRow[]>('/admin/withdraws')) ?? [];

  return (
    <AdminShell adminName={admin.name}>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.2rem' }}>Retiros</h1>
      <Table headers={['Vendedor', 'Monto', 'Método', 'Referencia', 'Estado', 'Acciones']}>
        {rows.map((w) => (
          <tr key={w.id}>
            <Td><strong>{w.vendor ?? '—'}</strong></Td>
            <Td><span style={{ fontVariantNumeric: 'tabular-nums' }}>${w.amount.toLocaleString('es-MX')}</span></Td>
            <Td muted>{w.method}</Td>
            <Td muted>{w.reference}</Td>
            <Td>{w.status}</Td>
            <Td>
              {w.status === 'pending' ? (
                <div style={{ display: 'flex', gap: '.4rem' }}>
                  <ActionButton path={`withdraws/${w.id}`} body={{ status: 'completed' }} label="Pagado" variant="solid" />
                  <ActionButton
                    path={`withdraws/${w.id}`}
                    body={{ status: 'rejected' }}
                    label="Rechazar (reembolsa)"
                    variant="ghost"
                    confirm="¿Rechazar y reembolsar el saldo al vendedor?"
                  />
                </div>
              ) : null}
            </Td>
          </tr>
        ))}
      </Table>
    </AdminShell>
  );
}
