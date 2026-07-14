import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { Table, Td } from '@/components/Table';

interface UserRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  isVendor: boolean;
  orders: number;
  createdAt: string | null;
}

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const sp = await searchParams;
  const q = sp.q ? `&search=${encodeURIComponent(sp.q)}` : '';
  const data = await adminFetch<{ items: UserRow[]; total: number; page: number; pages: number }>(
    `/admin/users?page=${sp.page ?? 1}${q}`,
  );

  return (
    <AdminShell adminName={admin.name} adminEmail={admin.email}>
      <div className="flex justify-between items-baseline flex-wrap gap-4 mb-5">
        <h1 className="font-head text-(length:--text-2xl)">Clientes ({data?.total ?? 0})</h1>
        <form action="/usuarios" method="get">
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Buscar por nombre o correo…"
            className="font-body text-(length:--text-sm) px-3 py-2 border border-line rounded-(--radius-md) bg-panel text-ink"
          />
        </form>
      </div>
      <Table headers={['Cliente', 'Contacto', 'Ciudad', 'Pedidos', 'Alta']}>
        {(data?.items ?? []).map((u) => (
          <tr key={u.id}>
            <Td>
              <strong>{u.name}</strong>
              {u.isVendor ? <span className="text-accent2 text-(length:--text-sm)"> · vendedor</span> : null}
            </Td>
            <Td muted>{u.email}{u.phone ? ` · ${u.phone}` : ''}</Td>
            <Td muted>{u.city ?? '—'}</Td>
            <Td><span className="tabular-nums">{u.orders}</span></Td>
            <Td muted>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-MX') : ''}</Td>
          </tr>
        ))}
      </Table>
      {data && data.pages > 1 ? (
        <p className="text-ink-muted text-(length:--text-sm) mt-3">Página {data.page} de {data.pages}</p>
      ) : null}
    </AdminShell>
  );
}
