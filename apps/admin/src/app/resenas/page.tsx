import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { Table, Td } from '@/components/Table';
import { ActionButton } from '@/components/actions';

interface SiteReview {
  id: number;
  author: string;
  rating: number;
  review: string;
  status: number;
  createdAt: string | null;
}

interface Comment {
  id: number;
  author: string;
  product: string;
  rating: number;
  text: string;
  createdAt: string | null;
}

export default async function AdminReviews() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const [reviews, comments] = await Promise.all([
    adminFetch<SiteReview[]>('/admin/site-reviews'),
    adminFetch<Comment[]>('/admin/comments'),
  ]);

  return (
    <AdminShell adminName={admin.name}>
      <h1 className="font-head text-(length:--text-2xl) mb-5">Reseñas y opiniones</h1>

      <h2 className="font-head text-(length:--text-xl) mb-3">Reseñas del sitio</h2>
      <Table headers={['Autor', 'Calificación', 'Reseña', 'Estado', 'Acciones']}>
        {(reviews ?? []).map((r) => (
          <tr key={r.id} style={{ opacity: r.status === 1 ? 1 : 0.6 }}>
            <Td><strong>{r.author}</strong></Td>
            <Td>{'★'.repeat(r.rating)}</Td>
            <Td muted>{r.review.slice(0, 90)}</Td>
            <Td>{r.status === 1 ? 'Aprobada' : 'Pendiente'}</Td>
            <Td>
              <div className="flex gap-2">
                <ActionButton
                  path={`site-reviews/${r.id}`}
                  body={{ status: r.status === 1 ? 0 : 1 }}
                  label={r.status === 1 ? 'Ocultar' : 'Aprobar'}
                />
                <ActionButton path={`site-reviews/${r.id}`} method="DELETE" label="Eliminar" variant="ghost" confirm="¿Eliminar esta reseña?" />
              </div>
            </Td>
          </tr>
        ))}
      </Table>

      <h2 className="font-head text-(length:--text-xl) mt-8 mb-3">Opiniones de productos</h2>
      <Table headers={['Autor', 'Producto', 'Calificación', 'Opinión', 'Acciones']}>
        {(comments ?? []).map((c) => (
          <tr key={c.id}>
            <Td><strong>{c.author}</strong></Td>
            <Td muted>{c.product}</Td>
            <Td>{'★'.repeat(c.rating)}</Td>
            <Td muted>{c.text.slice(0, 90)}</Td>
            <Td>
              <ActionButton path={`comments/${c.id}`} method="DELETE" label="Eliminar" variant="ghost" confirm="¿Eliminar esta opinión?" />
            </Td>
          </tr>
        ))}
      </Table>
    </AdminShell>
  );
}
