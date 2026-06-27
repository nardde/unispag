import { createServerClient } from '@/lib/supabase-server';
import { UniversitiesManager } from '@/components/admin/UniversitiesManager';
import type { University } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AdminUniversidades() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('universities')
    .select('*')
    .order('name');

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-ink">Universidades</h2>
      <UniversitiesManager initial={(data ?? []) as University[]} />
    </div>
  );
}
