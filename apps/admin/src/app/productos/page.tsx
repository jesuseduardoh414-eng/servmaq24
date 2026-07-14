import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { ProductsManager, type ProductRow } from './ProductsManager';

interface Paged { total: number; page: number; pages: number; items: ProductRow[] }

/** Gestión de productos: crear, editar, destacar, activar/desactivar y dar de baja. */
export default async function AdminProducts() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');

  // Traemos todo el catálogo en UNA consulta (pageSize alto) para no encadenar N
  // peticiones. El gestor pagina en cliente. Fallback: si la API ignora pageSize
  // (build anterior) devuelve varias páginas y las completamos en bucle.
  const first = await adminFetch<Paged>('/admin/catalog/products?page=1&pageSize=500');
  let items = first?.items ?? [];
  const pages = first?.pages ?? 1;
  for (let p = 2; p <= pages; p++) {
    const next = await adminFetch<Paged>(`/admin/catalog/products?page=${p}&pageSize=500`);
    if (next?.items) items = items.concat(next.items);
  }
  // dedupe defensivo por id (por si la paginación se solapa)
  const seen = new Set<number>();
  items = items.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
  const cats = (await adminFetch<Array<{ id: number; name: string }>>('/admin/catalog/categories')) ?? [];

  return (
    <AdminShell adminName={admin.name} adminEmail={admin.email}>
      <ProductsManager initial={items} categories={cats.map((c) => ({ id: c.id, name: c.name }))} />
    </AdminShell>
  );
}
