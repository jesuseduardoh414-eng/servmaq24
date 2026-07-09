import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { PaymentMethod } from '@servmaq/types';
import { getTheme, t } from '@/lib/theme';
import { getSessionUser } from '@/lib/session';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { CheckoutForm } from './CheckoutForm';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getTheme();
  return { title: `${t(theme, 'checkout.title')} — ${t(theme, 'site.name')}` };
}

export default async function CheckoutPage() {
  const [theme, user] = await Promise.all([getTheme(), getSessionUser()]);
  if (!user) redirect('/login');

  const methods = (await fetch(`${API_URL}/payments/methods`, { cache: 'no-store' })
    .then((r) => r.json())
    .catch(() => [])) as PaymentMethod[];

  return (
    <>
      <SiteHeader theme={theme} />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.4rem' }}>
          {t(theme, 'checkout.title')}
        </h1>
        <CheckoutForm
          user={user}
          methods={methods}
          labels={{
            contactTitle: t(theme, 'checkout.contact.title'),
            name: t(theme, 'auth.field.name'),
            email: t(theme, 'auth.field.email'),
            phone: t(theme, 'checkout.field.phone'),
            address: t(theme, 'checkout.field.address'),
            city: t(theme, 'checkout.field.city'),
            zip: t(theme, 'checkout.field.zip'),
            note: t(theme, 'checkout.field.note'),
            methodTitle: t(theme, 'checkout.method.title'),
            summaryTitle: t(theme, 'checkout.summary.title'),
            submit: t(theme, 'checkout.submit'),
            emptyCart: t(theme, 'cart.empty'),
            browse: t(theme, 'cart.browse'),
            total: t(theme, 'cart.total'),
          }}
        />
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
