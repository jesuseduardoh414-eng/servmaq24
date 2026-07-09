import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { Table, Td } from '@/components/Table';
import { ActionButton } from '@/components/actions';

interface BlogRow {
  id: number;
  title: string;
  status: number;
  createdAt: string | null;
}

export default async function AdminBlog() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const blogs = (await adminFetch<BlogRow[]>('/admin/cms/blogs')) ?? [];

  return (
    <AdminShell adminName={admin.name}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>Blog</h1>
        <Link href="/blog/nuevo" style={{ textDecoration: 'none', color: 'var(--color-primary-fg)', background: 'var(--color-primary)', fontWeight: 600, fontSize: 'var(--text-sm)', padding: '.5em 1em', borderRadius: 'var(--radius-button)' }}>
          + Nueva entrada
        </Link>
      </div>
      <Table headers={['Título', 'Fecha', 'Estado', 'Acciones']}>
        {blogs.map((b) => (
          <tr key={b.id} style={{ opacity: b.status === 1 ? 1 : 0.55 }}>
            <Td><strong>{b.title}</strong></Td>
            <Td muted>{b.createdAt ? new Date(b.createdAt).toLocaleDateString('es-MX') : ''}</Td>
            <Td>{b.status === 1 ? 'Publicado' : 'Oculto'}</Td>
            <Td>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                <Link href={`/blog/editar/${b.id}`} style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 'var(--text-sm)', textDecoration: 'none' }}>
                  Editar
                </Link>
                <ActionButton path={`cms/blogs/${b.id}`} body={{ status: b.status === 1 ? 0 : 1 }} label={b.status === 1 ? 'Ocultar' : 'Publicar'} />
                <ActionButton path={`cms/blogs/${b.id}`} method="DELETE" label="Eliminar" variant="ghost" confirm="¿Eliminar esta entrada?" />
              </div>
            </Td>
          </tr>
        ))}
      </Table>
    </AdminShell>
  );
}
