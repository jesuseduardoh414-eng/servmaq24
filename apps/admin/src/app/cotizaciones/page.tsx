import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { Table, Td } from '@/components/Table';
import { QuoteRespond } from './QuoteRespond';

interface QuoteRow {
  id: number;
  quoteNumber: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  subtotal: number;
  freightCost: number;
  total: number;
  status: string;
  comments: string | null;
  createdAt: string | null;
}

export default async function AdminQuotes() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const data = await adminFetch<{ items: QuoteRow[] }>('/admin/quotes');

  return (
    <AdminShell adminName={admin.name} adminEmail={admin.email}>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.2rem' }}>Cotizaciones</h1>
      <Table headers={['Cotización', 'Cliente', 'Subtotal', 'Total', 'Estado', 'Acción']}>
        {(data?.items ?? []).map((q) => (
          <tr key={q.id}>
            <Td>
              <strong>{q.quoteNumber}</strong>
              <br />
              <span style={{ color: 'var(--color-text-muted)' }}>
                {q.createdAt ? new Date(q.createdAt).toLocaleDateString('es-MX') : ''}
              </span>
            </Td>
            <Td>
              {q.name}{q.company ? ` · ${q.company}` : ''}
              <br />
              <span style={{ color: 'var(--color-text-muted)' }}>{q.email} · {q.phone}</span>
            </Td>
            <Td><span style={{ fontVariantNumeric: 'tabular-nums' }}>${q.subtotal.toLocaleString('es-MX')}</span></Td>
            <Td><strong style={{ fontVariantNumeric: 'tabular-nums' }}>${q.total.toLocaleString('es-MX')}</strong></Td>
            <Td>
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  padding: '.2em .7em',
                  borderRadius: '999px',
                  background: q.status === 'completed' ? 'var(--color-success)' : 'var(--color-warning)',
                  color: 'var(--color-primary-fg)',
                }}
              >
                {q.status}
              </span>
            </Td>
            <Td>{q.status === 'pending' ? <QuoteRespond quoteId={q.id} subtotal={q.subtotal} /> : null}</Td>
          </tr>
        ))}
      </Table>
    </AdminShell>
  );
}
