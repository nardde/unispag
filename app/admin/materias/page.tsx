import { createServerClient } from '@/lib/supabase-server';
import { SubjectsTable, type AdminSubject } from '@/components/admin/SubjectsTable';

export const dynamic = 'force-dynamic';

export default async function AdminMaterias() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('subjects')
    .select('id, name, year, semester, careers(name, universities(name))')
    .order('name')
    .limit(1000);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-ink">Materias</h2>
      <SubjectsTable initial={(data ?? []) as unknown as AdminSubject[]} />
    </div>
  );
}
