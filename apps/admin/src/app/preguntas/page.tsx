import { redirect } from 'next/navigation';
import { adminFetch, getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { QuestionsManager, type AdminQuestion } from './QuestionsManager';

export default async function AdminQuestions() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const questions = (await adminFetch<AdminQuestion[]>('/admin/questions')) ?? [];

  return (
    <AdminShell adminName={admin.name} adminEmail={admin.email}>
      <QuestionsManager initial={questions} />
    </AdminShell>
  );
}
