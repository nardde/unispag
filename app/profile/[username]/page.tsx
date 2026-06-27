import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ProfileFiles } from '@/components/ProfileFiles';
import { FileCard } from '@/components/FileCard';
import { EditProfile } from '@/components/EditProfile';
import { SetupNotice } from '@/components/SetupNotice';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import type { FileRecord, Profile } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  let supabase;
  try {
    supabase = createServerClient();
  } catch {
    return (
      <div className="container-page">
        <SetupNotice />
      </div>
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .maybeSingle();

  if (!profile) notFound();
  const p = profile as Profile;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwn = user?.id === p.id;

  const { data: files } = await supabase
    .from('files')
    .select('*, profiles(username), subjects(name, slug)')
    .eq('user_id', p.id)
    .order('created_at', { ascending: false });

  const fileList = (files ?? []) as FileRecord[];
  const totalDownloads = fileList.reduce((n, f) => n + (f.downloads ?? 0), 0);

  // Total upvotes received across their files.
  let upvotes = 0;
  if (fileList.length) {
    const { count } = await supabase
      .from('file_ratings')
      .select('id', { count: 'exact', head: true })
      .eq('value', 1)
      .in(
        'file_id',
        fileList.map((f) => f.id)
      );
    upvotes = count ?? 0;
  }

  return (
    <div className="container-page">
      <Breadcrumb
        items={[{ label: 'Inicio', href: '/' }, { label: `@${p.username}` }]}
      />

      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-[#46a3ff] text-2xl font-bold text-white">
            {p.username[0]?.toUpperCase()}
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              @{p.username}
            </h1>
            <p className="mt-1 text-sm text-subtle">
              Miembro desde {formatDate(p.created_at)}
            </p>
          </div>
        </div>
        {isOwn && (
          <EditProfile userId={p.id} currentUsername={p.username} />
        )}
      </header>

      <div className="mb-10 grid grid-cols-3 gap-3 sm:max-w-xl">
        <Stat label="Archivos" value={fileList.length} />
        <Stat label="Descargas" value={totalDownloads} />
        <Stat label="Votos 👍" value={upvotes} />
      </div>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-subtle">
        {isOwn ? 'Mis archivos' : 'Archivos subidos'}
      </h2>

      {fileList.length === 0 ? (
        <EmptyState
          title={isOwn ? 'Todavía no subiste archivos' : 'Sin archivos todavía'}
          description={
            isOwn
              ? 'Explorá las materias y compartí tu primer apunte o resumen.'
              : 'Este usuario aún no compartió ningún archivo.'
          }
          action={isOwn ? { label: 'Explorar', href: '/' } : undefined}
        />
      ) : isOwn ? (
        <ProfileFiles initialFiles={fileList} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {fileList.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card flex flex-col items-center justify-center p-4 text-center">
      <span className="text-2xl font-semibold tabular-nums text-ink">{value}</span>
      <span className="mt-0.5 text-xs text-subtle">{label}</span>
    </div>
  );
}
