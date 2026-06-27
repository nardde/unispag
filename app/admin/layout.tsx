import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { getCurrentProfile } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await getCurrentProfile();

  // Route protection — only admins.
  if (!profile || profile.role !== 'admin') {
    redirect('/');
  }

  const supabase = createServerClient();
  const { count: pendingReports } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  return (
    <div className="container-page">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Panel de administración
        </h1>
        <p className="mt-1 text-sm text-subtle">
          Gestioná archivos, reportes, usuarios y contenido.
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <AdminSidebar pendingReports={pendingReports ?? 0} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
