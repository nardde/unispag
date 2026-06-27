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
    .select('*, profiles(username)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const username = profile?.username ?? user.email?.split('@')[0] ?? 'usuario';

  return (
    <div className="container-page">
      <Breadcrumb items={[{ label: 'Inicio', href: '/' }, { label: 'Mi perfil' }]} />

      <header className="mb-8 flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
          {username[0]?.toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            @{username}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{user.email}</p>
        </div>
      </header>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Mis archivos
      </h2>

      <ProfileFiles initialFiles={(files ?? []) as FileRecord[]} />
    </div>
  );
}
