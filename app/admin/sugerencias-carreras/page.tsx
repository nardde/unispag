import { createServerClient } from '@/lib/supabase-server';
import {
  CareerSuggestionsTable,
  type CareerSuggestionRow,
} from '@/components/admin/CareerSuggestionsTable';

export const dynamic = 'force-dynamic';

export default async function AdminSugerenciasCarreras() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('career_suggestions')
    .select(
      'id, career_name, faculty, additional_info, status, created_at, universities(id, name), suggester:profiles(username)'
    )
    .order('created_at', { ascending: false })
    .limit(300);

  const rows: CareerSuggestionRow[] = (data ?? []).map((r: any) => ({
    id: r.id,
    career_name: r.career_name,
    faculty: r.faculty,
    additional_info: r.additional_info,
    status: r.status,
    created_at: r.created_at,
    universityId: r.universities?.id ?? null,
    universityName: r.universities?.name ?? '',
    suggester: r.suggester?.username ?? null,
  }));

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-ink">
        Sugerencias de carreras
      </h2>
      <CareerSuggestionsTable initialRows={rows} />
    </div>
  );
}
