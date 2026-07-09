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
  const [services, why] = await Promise.all([
    adminFetch<Item[]>('/admin/cms/services'),
    adminFetch<Item[]>('/admin/cms/why-choose-us'),
  ]);

  return (
    <AdminShell adminName={admin.name}>
      <h1 className="font-head text-(length:--text-2xl) mb-5">Contenido de la home</h1>
      <div className="grid gap-8 max-w-3xl">
        <ItemManager apiPath="cms/services" heading="Servicios" items={services ?? []} />
        <ItemManager apiPath="cms/why-choose-us" heading="¿Por qué elegirnos?" items={why ?? []} />
      </div>
    </AdminShell>
  );
}
