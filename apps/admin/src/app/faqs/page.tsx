import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { FaqManager } from './FaqManager';

export default async function AdminFaqs() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const faqs = (await adminFetch<Array<{ id: number; title: string; text: string; status: number }>>('/admin/cms/faqs')) ?? [];

  return (
    <AdminShell adminName={admin.name} adminEmail={admin.email}>
      <FaqManager faqs={faqs} />
    </AdminShell>
  );
}
