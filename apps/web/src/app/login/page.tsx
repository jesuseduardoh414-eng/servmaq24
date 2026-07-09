import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTheme, t } from '@/lib/theme';
import { getSessionUser } from '@/lib/session';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { AuthForm } from '@/components/AuthForm';

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getTheme();
  return { title: `${t(theme, 'auth.login.title')} — ${t(theme, 'site.name')}` };
}

export default async function LoginPage() {
  const [theme, user] = await Promise.all([getTheme(), getSessionUser()]);
  if (user) redirect('/');

  return (
    <>
      <SiteHeader theme={theme} />
      <main style={{ padding: '3rem 1.5rem' }}>
        <AuthForm
          mode="login"
          labels={{
            title: t(theme, 'auth.login.title'),
            name: t(theme, 'auth.field.name'),
            email: t(theme, 'auth.field.email'),
            password: t(theme, 'auth.field.password'),
            submit: t(theme, 'auth.login.submit'),
            switchText: t(theme, 'auth.login.noAccount'),
          }}
        />
      </main>
      <SiteFooter theme={theme} />
    </>
  );
}
