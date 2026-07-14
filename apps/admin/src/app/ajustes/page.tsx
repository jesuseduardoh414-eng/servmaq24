import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { SettingsForms } from './SettingsForms';

// Nota: el HERO se edita en Diseño → Sección 1 · Hero, y «Quiénes somos»
// (inf_sitio) en Diseño → Sección 4 · Quiénes somos. Aquí solo quedan los
// ajustes generales (contacto).
export default async function AdminSettings() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const settings = await adminFetch<Parameters<typeof SettingsForms>[0]['settings']>('/admin/cms/settings');

  return (
    <AdminShell adminName={admin.name} adminEmail={admin.email}>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.2rem' }}>Ajustes del sitio</h1>
      <div className="grid gap-5 max-w-3xl">
        <SettingsForms settings={settings} />
      </div>
    </AdminShell>
  );
}
