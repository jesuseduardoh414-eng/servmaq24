import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { OrderDetail } from '@servmaq/types';
import { getTheme, t } from '@/lib/theme';
import { SESSION_COOKIE } from '@/lib/session';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { formatPrice } from '@/lib/format';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

type Params = { orderNumber: string };

async function fetchOrder(orderNumber: string): Promise<OrderDetail | null | 'unauthorized'> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return 'unauthorized';
  const res = await fetch(`${API_URL}/orders/${orderNumber}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (res.status === 401) return 'unauthorized';
  if (!res.ok) return null;
  return (await res.json()) as OrderDetail;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const theme = await getTheme();
  const { orderNumber } = await params;
  return { title: `${t(theme, 'order.title')} ${orderNumber} — ${t(theme, 'site.name')}` };
}

export default async function OrderPage({ params }: { params: Promise<Params> }) {
  const { orderNumber } = await params;
  const [theme, order] = await Promise.all([getTheme(), fetchOrder(orderNumber)]);
  if (order === 'unauthorized') redirect('/login');
  if (!order) notFound();

  const row = (label: string, value: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: 'var(--text-sm)' }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <strong>{value}</strong>
    </div>
  );

  return (
    <>
      <SiteHeader theme={theme} />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gap: '1.2rem' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>{t(theme, 'order.thanks')}</h1>

        <section style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface)', padding: '1.2rem 1.4rem', display: 'grid', gap: '.6rem' }}>
          {row(t(theme, 'order.number'), order.orderNumber)}
          {row(t(theme, 'order.method'), order.method)}
          {row(t(theme, 'order.paymentStatus'), order.paymentStatus)}
          {row(t(theme, 'cart.total'), formatPrice(order.total))}
        </section>

        {order.items.length > 0 ? (
          <section style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface)', padding: '1.2rem 1.4rem', display: 'grid', gap: '.5rem' }}>
            <h2 style={{ fontSize: 'var(--text-lg)' }}>{t(theme, 'order.items.title')}</h2>
            {order.items.map((i) => (
              <div key={i.productId} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: 'var(--text-sm)' }}>
                <span>{i.name} × {i.qty}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPrice(i.price * i.qty)}</span>
              </div>
            ))}
          </section>
        ) : null}

        <InstructionsBlock theme={theme} method={order.method} />

        <div>
          <Link href="/cuenta/pedidos" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            {t(theme, 'account.orders.title')} →
          </Link>
        </div>
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}

/** Instrucciones de pago para métodos offline (del gateway legacy, editable). */
async function InstructionsBlock({ theme, method }: { theme: Awaited<ReturnType<typeof getTheme>>; method: string }) {
  if (!/deposito|transferencia/i.test(method)) return null;
  const methods = (await fetch(`${API_URL}/payments/methods`, { next: { revalidate: 60 } })
    .then((r) => r.json())
    .catch(() => [])) as Array<{ id: string; instructions: string | null }>;
  const instructions = methods.find((m) => m.id === 'transferencia')?.instructions;
  if (!instructions) return null;
  return (
    <section style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface)', padding: '1.2rem 1.4rem' }}>
      <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: '.6rem' }}>{t(theme, 'order.instructions.title')}</h2>
      <div style={{ lineHeight: 1.7, color: 'var(--color-text-muted)' }} dangerouslySetInnerHTML={{ __html: instructions }} />
    </section>
  );
}
