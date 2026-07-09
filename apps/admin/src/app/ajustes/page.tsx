import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { SettingsForms } from './SettingsForms';
import { InfSitioForm } from './InfSitioForm';

export default async function AdminSettings() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const [hero, settings, infSitio] = await Promise.all([
    adminFetch<Parameters<typeof SettingsForms>[0]['hero']>('/admin/cms/hero'),
    adminFetch<Parameters<typeof SettingsForms>[0]['settings']>('/admin/cms/settings'),
    adminFetch<Parameters<typeof InfSitioForm>[0]['data']>('/admin/cms/inf-sitio'),
  ]);

  return (
    <AdminShell adminName={admin.name}>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.2rem' }}>Ajustes del sitio</h1>
      <div className="grid gap-5 max-w-3xl">
        <SettingsForms hero={hero} settings={settings} />
        <InfSitioForm data={infSitio} />
      </div>
    </AdminShell>
  );
}
