import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { Table, Td } from '@/components/Table';
import { ActionButton } from '@/components/actions';

interface ProductRow {
  id: number;
  name: string;
  brand: string | null;
  price: number;
  stock: number | null;
  status: number;
  featured: boolean;
  isRental: boolean;
  image: string | null;
  categoryName: string | null;
}

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const sp = await searchParams;
  const q = sp.q ? `&search=${encodeURIComponent(sp.q)}` : '';
  const data = await adminFetch<{ items: ProductRow[]; page: number; pages: number; total: number }>(
    `/admin/catalog/products?page=${sp.page ?? 1}${q}`,
  );

  return (
    <AdminShell adminName={admin.name}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>Productos ({data?.total ?? 0})</h1>
        <Link
          href="/productos/nuevo"
          style={{
            textDecoration: 'none',
            color: 'var(--color-primary-fg)',
            background: 'var(--color-primary)',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            padding: '.5em 1em',
            borderRadius: 'var(--radius-button)',
          }}
        >
          + Nuevo producto
        </Link>
        <form action="/productos" method="get">
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Buscar…"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              padding: '.45em .8em',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          />
        </form>
      </div>
      <Table headers={['', 'Producto', 'Categoría', 'Precio', 'Stock', 'Estado', 'Acciones']}>
        {(data?.items ?? []).map((p) => (
          <tr key={p.id} style={{ opacity: p.status === 1 ? 1 : 0.55 }}>
            <Td>
              <span style={{ position: 'relative', width: 44, height: 44, display: 'block', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                {p.image ? <Image src={p.image} alt="" fill sizes="44px" style={{ objectFit: 'contain' }} /> : null}
              </span>
            </Td>
            <Td>
              <strong>{p.name}</strong>
              {p.brand ? <><br /><span style={{ color: 'var(--color-text-muted)' }}>{p.brand}</span></> : null}
              {p.isRental ? <span style={{ color: 'var(--color-accent)', fontSize: 'var(--text-sm)' }}> · renta</span> : null}
              {p.featured ? <span style={{ color: 'var(--color-warning)', fontSize: 'var(--text-sm)' }}> ★</span> : null}
            </Td>
            <Td muted>{p.categoryName}</Td>
            <Td><span style={{ fontVariantNumeric: 'tabular-nums' }}>${p.price.toLocaleString('es-MX')}</span></Td>
            <Td muted>{p.stock ?? '—'}</Td>
            <Td>{p.status === 1 ? 'Activo' : 'Inactivo'}</Td>
            <Td>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <Link href={`/productos/editar/${p.id}`} style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 'var(--text-sm)', textDecoration: 'none' }}>
                  Editar
                </Link>
                <ActionButton
                  path={`catalog/products/${p.id}`}
                  body={{ status: p.status === 1 ? 0 : 1 }}
                  label={p.status === 1 ? 'Desactivar' : 'Activar'}
                />
                <ActionButton
                  path={`catalog/products/${p.id}`}
                  body={{ featured: !p.featured }}
                  label={p.featured ? 'Quitar ★' : 'Destacar'}
                  variant="ghost"
                />
              </div>
            </Td>
          </tr>
        ))}
      </Table>
      {data && data.pages > 1 ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: '.8rem' }}>
          Página {data.page} de {data.pages} — usa ?page=N{sp.q ? `&q=${sp.q}` : ''}
        </p>
      ) : null}
    </AdminShell>
  );
}
