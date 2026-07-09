import Image from 'next/image';
import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { Table, Td } from '@/components/Table';
import { ActionButton } from '@/components/actions';
import { CategoryCreate } from './CategoryCreate';

interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  status: number;
  image: string | null;
  productCount: number;
}

export default async function AdminCategories() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const cats = (await adminFetch<CategoryRow[]>('/admin/catalog/categories')) ?? [];

  return (
    <AdminShell adminName={admin.name}>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.2rem' }}>Categorías</h1>
      <div style={{ display: 'grid', gap: '1.2rem' }}>
        <CategoryCreate />
        <Table headers={['', 'Nombre', 'Slug', 'Productos', 'Estado', 'Acciones']}>
          {cats.map((c) => (
            <tr key={c.id} style={{ opacity: c.status === 1 ? 1 : 0.55 }}>
              <Td>
                <span style={{ position: 'relative', width: 40, height: 40, display: 'block', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  {c.image ? <Image src={c.image} alt="" fill sizes="40px" style={{ objectFit: 'contain' }} /> : null}
                </span>
              </Td>
              <Td><strong>{c.name}</strong></Td>
              <Td muted>{c.slug}</Td>
              <Td muted>{c.productCount}</Td>
              <Td>{c.status === 1 ? 'Activa' : 'Inactiva'}</Td>
              <Td>
                <div style={{ display: 'flex', gap: '.4rem' }}>
                  <ActionButton
                    path={`catalog/categories/${c.id}`}
                    body={{ status: c.status === 1 ? 0 : 1 }}
                    label={c.status === 1 ? 'Desactivar' : 'Activar'}
                  />
                  {c.productCount === 0 ? (
                    <ActionButton
                      path={`catalog/categories/${c.id}`}
                      method="DELETE"
                      label="Eliminar"
                      variant="ghost"
                      confirm="¿Eliminar esta categoría?"
                    />
                  ) : null}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </div>
    </AdminShell>
  );
}
