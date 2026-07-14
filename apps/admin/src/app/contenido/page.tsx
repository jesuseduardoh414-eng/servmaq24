import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { ItemManager } from './ItemManager';

interface Item {
  id: number;
  title: string;
  text: string;
  image: string | null;
}

export default async function AdminContent() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  // Nota: «¿Por qué elegirnos?» (las razones) se editó aquí; ahora vive en
  // Diseño → Sección 4 · Quiénes somos (pestaña «Razones»).
  const [services, cases] = await Promise.all([
    adminFetch<Item[]>('/admin/cms/services'),
    adminFetch<Item[]>('/admin/cms/success-cases'),
  ]);

  return (
    <AdminShell adminName={admin.name} adminEmail={admin.email}>
      <h1 className="font-head text-(length:--text-2xl) mb-5">Contenido de la home</h1>
      <div className="grid gap-8 max-w-3xl">
        <ItemManager apiPath="cms/services" heading="Servicios" items={services ?? []} />
        <ItemManager apiPath="cms/success-cases" heading="Casos de éxito (cliente + reseña)" items={cases ?? []} />
      </div>
    </AdminShell>
  );
}
