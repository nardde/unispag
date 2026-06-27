import { createServerClient } from '@/lib/supabase-server';
import { getCurrentProfile } from '@/lib/auth';
import { UsersTable, type AdminUser } from '@/components/admin/UsersTable';

export const dynamic = 'force-dynamic';

export default async function AdminUsuarios() {
  const supabase = createServerClient();
  const { userId } = await getCurrentProfile();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, role, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  const { data: files } = await supabase.from('files').select('user_id');
  const counts = new Map<string, number>();
  (files ?? []).forEach((f: { user_id: string }) => {
    counts.set(f.user_id, (counts.get(f.user_id) ?? 0) + 1);
  });

  const users: AdminUser[] = (profiles ?? []).map((p: any) => ({
    id: p.id,
    username: p.username,
    role: p.role,
    created_at: p.created_at,
    fileCount: counts.get(p.id) ?? 0,
  }));

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-ink">Usuarios</h2>
      <UsersTable initialUsers={users} currentUserId={userId ?? ''} />
    </div>
  );
}
