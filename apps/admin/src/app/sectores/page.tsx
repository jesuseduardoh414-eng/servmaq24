import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { Table, Td } from '@/components/Table';
import { ActionButton } from '@/components/actions';
import { SectorCreate } from './SectorCreate';

interface SectorRow {
  id: number;
  title: string;
  status: number;
  image: string | null;
}

export default async function AdminSectors() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const sectors = (await adminFetch<SectorRow[]>('/admin/cms/sectors')) ?? [];

  return (
    <AdminShell adminName={admin.name}>
      <h1 className="font-head text-(length:--text-2xl) mb-5">Sectores estratégicos</h1>
      <div className="grid gap-4 max-w-3xl">
        <SectorCreate />
        <Table headers={['', 'Sector', 'Estado', 'Acciones']}>
          {sectors.map((s) => (
            <tr key={s.id} style={{ opacity: s.status === 1 ? 1 : 0.55 }}>
              <Td>
                <span className="relative block w-14 h-10 bg-page rounded-(--radius-sm) overflow-hidden">
                  {s.image ? <Image src={s.image} alt="" fill sizes="56px" style={{ objectFit: 'cover' }} /> : null}
                </span>
              </Td>
              <Td><strong>{s.title}</strong></Td>
              <Td>{s.status === 1 ? 'Visible' : 'Oculto'}</Td>
              <Td>
                <div className="flex gap-2 items-center">
                  <Link href={`/sectores/${s.id}`} className="text-brand font-semibold text-(length:--text-sm) no-underline">
                    Editar
                  </Link>
                  <ActionButton path={`cms/sectors/${s.id}`} body={{ status: s.status === 1 ? 0 : 1 }} label={s.status === 1 ? 'Ocultar' : 'Mostrar'} />
                  <ActionButton path={`cms/sectors/${s.id}`} method="DELETE" label="Eliminar" variant="ghost" confirm="¿Eliminar este sector?" />
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </div>
    </AdminShell>
  );
}
