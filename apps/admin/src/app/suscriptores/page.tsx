import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { Table, Td } from '@/components/Table';
import { ActionButton } from '@/components/actions';

export default async function AdminSubscribers() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const subs = (await adminFetch<Array<{ id: number; email: string }>>('/admin/subscribers')) ?? [];

  return (
    <AdminShell adminName={admin.name}>
      <h1 className="font-head text-(length:--text-2xl) mb-5">Suscriptores ({subs.length})</h1>
      <div className="max-w-xl">
        <Table headers={['Correo', 'Acciones']}>
          {subs.map((s) => (
            <tr key={s.id}>
              <Td><strong>{s.email}</strong></Td>
              <Td>
                <ActionButton path={`subscribers/${s.id}`} method="DELETE" label="Eliminar" variant="ghost" confirm="¿Eliminar este suscriptor?" />
              </Td>
            </tr>
          ))}
        </Table>
      </div>
    </AdminShell>
  );
}
