import { createServerClient } from '@/lib/supabase-server';
import {
  EntityReportsTable,
  type EntityReportRow,
} from '@/components/admin/EntityReportsTable';

export const dynamic = 'force-dynamic';

export default async function AdminReportesCarreras() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('career_reports')
    .select(
      'id, reason, details, status, created_at, reporter:profiles(username), careers(id, name, slug, universities(slug))'
    )
    .order('created_at', { ascending: false })
    .limit(300);

  const rows: EntityReportRow[] = (data ?? []).map((r: any) => {
    const c = r.careers;
    const href = c && c.universities ? `/${c.universities.slug}/${c.slug}` : null;
    return {
      id: r.id,
      reason: r.reason,
      details: r.details,
      status: r.status,
      created_at: r.created_at,
      reporter: r.reporter?.username ?? null,
      entityId: c?.id ?? null,
      entityName: c?.name ?? '',
      entityHref: href,
    };
  });

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-ink">Reportes de carreras</h2>
      <EntityReportsTable
        initialRows={rows}
        reportTable="career_reports"
        entityTable="careers"
        entityLabel="Carrera"
      />
    </div>
  );
}
