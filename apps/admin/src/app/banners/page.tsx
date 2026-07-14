import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { BannerSlot } from './BannerSlot';

interface Slot {
  slot: string;
  image: string | null;
  link: string | null;
}

export default async function AdminBanners() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const slots = (await adminFetch<Slot[]>('/admin/cms/banners')) ?? [];

  return (
    <AdminShell adminName={admin.name} adminEmail={admin.email}>
      <h1 className="font-head text-(length:--text-2xl) mb-5">Banners</h1>
      <div className="grid gap-4 max-w-4xl" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {slots.map((s) => (
          <BannerSlot key={s.slot} slot={s.slot} image={s.image} link={s.link} />
        ))}
      </div>
    </AdminShell>
  );
}
