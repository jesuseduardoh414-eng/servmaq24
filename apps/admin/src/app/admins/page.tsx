import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { Table, Td } from '@/components/Table';
import { ActionButton } from '@/components/actions';
import { AdminCreate } from './AdminCreate';

interface AdminRow {
  id: number;
  name: string;
  email: string;
  role: string;
  status: number;
}

export default async function AdminAdmins() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const admins = (await adminFetch<AdminRow[]>('/admin/admins')) ?? [];

  return (
    <AdminShell adminName={admin.name} adminEmail={admin.email}>
      <h1 className="font-head text-(length:--text-2xl) mb-5">Administradores</h1>
      <div className="grid gap-4 max-w-3xl">
        <AdminCreate />
        <Table headers={['Nombre', 'Correo', 'Rol', 'Estado', 'Acciones']}>
          {admins.map((a) => (
            <tr key={a.id} style={{ opacity: a.status === 1 ? 1 : 0.55 }}>
              <Td><strong>{a.name}</strong>{a.id === admin.id ? <span className="text-accent2 text-(length:--text-sm)"> · tú</span> : null}</Td>
              <Td muted>{a.email}</Td>
              <Td muted>{a.role}</Td>
              <Td>{a.status === 1 ? 'Activo' : 'Inactivo'}</Td>
              <Td>
                {a.id !== admin.id ? (
                  <ActionButton
                    path={`admins/${a.id}`}
                    body={{ status: a.status === 1 ? 0 : 1 }}
                    label={a.status === 1 ? 'Desactivar' : 'Activar'}
                    confirm={a.status === 1 ? '¿Desactivar el acceso de este administrador?' : undefined}
                  />
                ) : null}
              </Td>
            </tr>
          ))}
        </Table>
      </div>
    </AdminShell>
  );
}
