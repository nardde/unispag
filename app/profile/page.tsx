import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ProfileFiles } from '@/components/ProfileFiles';
import { SetupNotice } from '@/components/SetupNotice';
import type { FileRecord } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirect=/profile');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, created_at')
    .eq('id', user.id)
    .maybeSingle();

  const { data: files } = await supabase
    .from('files')
    .select('*, profiles(username), subjects(name, slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const username = profile?.username ?? user.email?.split('@')[0] ?? 'usuario';

  return (
    <div className="container-page">
      <Breadcrumb items={[{ label: 'Inicio', href: '/' }, { label: 'Mi perfil' }]} />

      <header className="mb-8 flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-[#46a3ff] text-2xl font-bold text-white">
          {username[0]?.toUpperCase()}
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            @{username}
          </h1>
          <p className="mt-1 text-sm text-subtle">{user.email}</p>
        </div>
      </header>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-subtle">
        Mis archivos
      </h2>

      <ProfileFiles initialFiles={(files ?? []) as FileRecord[]} />
    </div>
  );
}
