import Link from 'next/link';
import { createServerClient } from '@/lib/supabase-server';
import { DeleteFileButton } from '@/components/admin/DeleteFileButton';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function count(table: string, filter?: (q: any) => any) {
  const supabase = createServerClient();
  let q = supabase.from(table).select('id', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

export default async function AdminDashboard() {
  const supabase = createServerClient();

  const [users, files, universities, subjects, pending] = await Promise.all([
    count('profiles'),
    count('files'),
    count('universities'),
    count('subjects'),
    count('reports', (q) => q.eq('status', 'pending')),
  ]);

  const { data: lastFiles } = await supabase
    .from('files')
    .select('id, title, file_url, file_name, created_at, profiles(username)')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: lastUsers } = await supabase
    .from('profiles')
    .select('id, username, role, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const stats = [
    { label: 'Usuarios', value: users },
    { label: 'Archivos', value: files },
    { label: 'Universidades', value: universities },
    { label: 'Materias', value: subjects },
    { label: 'Reportes pendientes', value: pending, alert: pending > 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p
              className={`text-2xl font-semibold tabular-nums ${
                s.alert ? 'text-rose-600' : 'text-ink'
              }`}
            >
              {s.value}
            </p>
            <p className="mt-0.5 text-xs text-subtle">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink">
            Últimos archivos
          </h2>
          <ul className="divide-y divide-hairline/50">
            {(lastFiles ?? []).map((f: any) => (
              <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {f.title}
                  </p>
                  <p className="text-xs text-subtle">
                    {f.profiles?.username ? `@${f.profiles.username}` : 'Anónimo'} ·{' '}
                    {formatDate(f.created_at)}
                  </p>
                </div>
                <DeleteFileButton
                  fileId={f.id}
                  fileUrl={f.file_url}
                  title={f.title}
                />
              </li>
            ))}
            {(lastFiles ?? []).length === 0 && (
              <li className="py-3 text-sm text-subtle">Sin archivos.</li>
            )}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink">Nuevos usuarios</h2>
          <ul className="divide-y divide-hairline/50">
            {(lastUsers ?? []).map((u: any) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/60 dark:text-brand-200">
                    {u.username?.[0]?.toUpperCase() ?? '?'}
                  </span>
                  <div>
                    <Link
                      href={`/profile/${u.username}`}
                      className="text-sm font-medium text-ink hover:underline"
                    >
                      @{u.username}
                    </Link>
                    <p className="text-xs text-subtle">{formatDate(u.created_at)}</p>
                  </div>
                </div>
                {u.role === 'admin' && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                    admin
                  </span>
                )}
              </li>
            ))}
            {(lastUsers ?? []).length === 0 && (
              <li className="py-3 text-sm text-subtle">Sin usuarios.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
