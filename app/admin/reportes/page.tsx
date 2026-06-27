import { createServerClient } from '@/lib/supabase-server';
import { ReportsTable, type AdminReport } from '@/components/admin/ReportsTable';

export const dynamic = 'force-dynamic';

export default async function AdminReportes() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('reports')
    .select(
      'id, reason, details, status, created_at, reporter:profiles(username), files(id, title, file_url, subjects(name, slug), careers(slug, universities(slug)))'
    )
    .order('created_at', { ascending: false })
    .limit(300);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-ink">Reportes</h2>
      <ReportsTable initialReports={(data ?? []) as unknown as AdminReport[]} />
    </div>
  );
}
