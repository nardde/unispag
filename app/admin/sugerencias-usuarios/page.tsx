import { createServerClient } from '@/lib/supabase-server';
import {
  UserSuggestionsTable,
  type AdminSuggestionRow,
} from '@/components/admin/UserSuggestionsTable';

export const dynamic = 'force-dynamic';

export default async function AdminSugerenciasUsuarios() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('suggestions')
    .select('id, title, type, status, created_at, profiles(username)')
    .order('created_at', { ascending: false })
    .limit(500);

  const rows = (data ?? []) as any[];
  const ids = rows.map((r) => r.id);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: votes } = await supabase
      .from('suggestion_upvotes')
      .select('suggestion_id')
      .in('suggestion_id', ids);
    (votes ?? []).forEach((v: { suggestion_id: string }) => {
      counts.set(v.suggestion_id, (counts.get(v.suggestion_id) ?? 0) + 1);
    });
  }

  const tableRows: AdminSuggestionRow[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    status: r.status,
    created_at: r.created_at,
    submitter: r.profiles?.username ?? null,
    upvotes: counts.get(r.id) ?? 0,
  }));

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-ink">
        Sugerencias de usuarios
      </h2>
      <UserSuggestionsTable initialRows={tableRows} />
    </div>
  );
}
