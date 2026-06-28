import { createServerClient } from '@/lib/supabase-server';
import {
  EntityReportsTable,
  type EntityReportRow,
} from '@/components/admin/EntityReportsTable';

export const dynamic = 'force-dynamic';

export default async function AdminReportesMaterias() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('subject_reports')
    .select(
      'id, reason, details, status, created_at, reporter:profiles(username), subjects(id, name, slug, careers(slug, universities(slug)))'
    )
    .order('created_at', { ascending: false })
    .limit(300);

  const rows: EntityReportRow[] = (data ?? []).map((r: any) => {
    const s = r.subjects;
    const href =
      s && s.careers?.universities
        ? `/${s.careers.universities.slug}/${s.careers.slug}/${s.slug}`
        : null;
    return {
      id: r.id,
      reason: r.reason,
      details: r.details,
      status: r.status,
      created_at: r.created_at,
      reporter: r.reporter?.username ?? null,
      entityId: s?.id ?? null,
      entityName: s?.name ?? '',
      entityHref: href,
    };
  });

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-ink">Reportes de materias</h2>
      <EntityReportsTable
        initialRows={rows}
        reportTable="subject_reports"
        entityTable="subjects"
        entityLabel="Materia"
      />
    </div>
  );
}
