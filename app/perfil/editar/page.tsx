import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { getCurrentProfile } from '@/lib/auth';
import { Breadcrumb } from '@/components/Breadcrumb';
import { EditProfileForm } from '@/components/EditProfileForm';
import { SetupNotice } from '@/components/SetupNotice';

export const dynamic = 'force-dynamic';

export default async function EditProfilePage() {
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

  const { userId, profile } = await getCurrentProfile();
  if (!userId || !profile) redirect('/auth/login?redirect=/perfil/editar');

  const [{ data: unis }, { data: careers }, { data: uu }, { data: uc }] =
    await Promise.all([
      supabase.from('universities').select('id, name, acronym').order('name'),
      supabase.from('careers').select('id, name, university_id'),
      supabase.from('user_universities').select('university_id').eq('user_id', userId),
      supabase.from('user_careers').select('career_id').eq('user_id', userId),
    ]);

  return (
    <div className="container-page">
      <Breadcrumb
        items={[
          { label: 'Inicio', href: '/' },
          { label: `@${profile.username}`, href: `/profile/${profile.username}` },
          { label: 'Editar perfil' },
        ]}
      />
      <h1 className="mb-8 text-3xl font-semibold tracking-tight text-ink">
        Editar perfil
      </h1>

      <EditProfileForm
        userId={userId}
        initial={{
          username: profile.username,
          bio: profile.bio,
          year_of_study: profile.year_of_study,
          avatar_url: profile.avatar_url,
        }}
        universities={(unis ?? []) as { id: string; name: string; acronym: string | null }[]}
        careers={(careers ?? []) as { id: string; name: string; university_id: string }[]}
        initialUnis={(uu ?? []).map((r: { university_id: string }) => r.university_id)}
        initialCareers={(uc ?? []).map((r: { career_id: string }) => r.career_id)}
      />
    </div>
  );
}
