import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { BlogForm } from '../BlogForm';

export default async function NewBlogPage() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  return (
    <AdminShell adminName={admin.name}>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.2rem' }}>Nueva entrada</h1>
      <BlogForm initial={{}} />
    </AdminShell>
  );
}
