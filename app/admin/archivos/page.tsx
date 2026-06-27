import { createServerClient } from '@/lib/supabase-server';
import { FilesTable, type AdminFile } from '@/components/admin/FilesTable';

export const dynamic = 'force-dynamic';

export default async function AdminArchivos() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('files')
    .select(
      'id, title, file_name, file_size, file_url, created_at, profiles(username), subjects(name), careers(name, universities(name))'
    )
    .order('created_at', { ascending: false })
    .limit(500);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-ink">Archivos</h2>
      <FilesTable initialFiles={(data ?? []) as unknown as AdminFile[]} />
    </div>
  );
}
