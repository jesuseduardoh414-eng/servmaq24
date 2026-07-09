import { notFound, redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { SectorForm, type SectorData } from './SectorForm';

export default async function EditSectorPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const { id } = await params;
  const sector = await adminFetch<SectorData>(`/admin/cms/sectors/${id}`);
  if (!sector) notFound();

  return (
    <AdminShell adminName={admin.name}>
      <h1 className="font-head text-(length:--text-2xl) mb-5">Sector: {sector.title}</h1>
      <SectorForm data={sector} />
    </AdminShell>
  );
}
