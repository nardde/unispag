import Link from 'next/link';
import { createServerClient } from '@/lib/supabase-server';
import { getCurrentProfile } from '@/lib/auth';
import { UniversityGrid } from '@/components/UniversityGrid';
import { TrendingFiles, type TrendingItem } from '@/components/TrendingFiles';
import { Onboarding } from '@/components/onboarding/Onboarding';
import { SetupNotice } from '@/components/SetupNotice';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import { yearLabel, semesterLabel } from '@/types';
import type { University, UniversityWithCount, FileCategory } from '@/types';

export const dynamic = 'force-dynamic';

interface TrendingRow {
  id: string;
  title: string;
  category: FileCategory;
  downloads: number;
  subjects: { name: string; slug: string } | null;
  careers: {
    name: string;
    slug: string;
    universities: { name: string; slug: string } | null;
  } | null;
}

async function getUniversities(): Promise<UniversityWithCount[] | null> {
  try {
    const supabase = createServerClient();
    const { data: universities, error } = await supabase
      .from('universities')
      .select('*')
      .order('name');
    if (error) throw error;

    const { data: careers } = await supabase
      .from('careers')
      .select('university_id');
    const counts = new Map<string, number>();
    (careers ?? []).forEach((c: { university_id: string }) => {
      counts.set(c.university_id, (counts.get(c.university_id) ?? 0) + 1);
    });

    return (universities as University[]).map((u) => ({
      ...u,
      careerCount: counts.get(u.id) ?? 0,
    }));
  } catch {
    return null;
  }
}

async function getTrending(): Promise<TrendingItem[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from('files')
      .select(
        'id, title, category, downloads, subjects(name, slug), careers(name, slug, universities(name, slug))'
      )
      .not('subject_id', 'is', null)
      .order('downloads', { ascending: false })
      .limit(6);

    const rows = (data ?? []) as unknown as TrendingRow[];
    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    const { data: ratings } = await supabase
      .from('file_ratings')
      .select('file_id, value')
      .in('file_id', ids);
    const scores = new Map<string, number>();
    (ratings ?? []).forEach((r: { file_id: string; value: number }) => {
      scores.set(r.file_id, (scores.get(r.file_id) ?? 0) + r.value);
    });

    return rows
      .filter((r) => r.subjects && r.careers && r.careers.universities)
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        downloads: r.downloads ?? 0,
        score: scores.get(r.id) ?? 0,
        subjectName: r.subjects!.name,
        careerName: r.careers!.name,
        universityName: r.careers!.universities!.name,
        href: `/${r.careers!.universities!.slug}/${r.careers!.slug}/${r.subjects!.slug}`,
      }));
  } catch {
    return [];
  }
}

interface MateriaRow {
  id: string;
  name: string;
  slug: string;
  year: number;
  semester: number;
  careers: { slug: string; name: string; universities: { slug: string } | null } | null;
}

async function getPersonalization(userId: string) {
  const supabase = createServerClient();
  const [{ data: uu }, { data: uc }] = await Promise.all([
    supabase.from('user_universities').select('university_id').eq('user_id', userId),
    supabase.from('user_careers').select('career_id').eq('user_id', userId),
  ]);
  const myUniIds = (uu ?? []).map((r: { university_id: string }) => r.university_id);
  const myCareerIds = (uc ?? []).map((r: { career_id: string }) => r.career_id);

  let materias: {
    id: string;
    name: string;
    href: string;
    year: number;
    semester: number;
    fileCount: number;
    latest: string | null;
  }[] = [];

  if (myCareerIds.length) {
    const { data: subs } = await supabase
      .from('subjects')
      .select('id, name, slug, year, semester, careers(slug, name, universities(slug))')
      .in('career_id', myCareerIds)
      .limit(40);
    const rows = (subs ?? []) as unknown as MateriaRow[];
    const subIds = rows.map((r) => r.id);
    const counts = new Map<string, number>();
    const latest = new Map<string, string>();
    if (subIds.length) {
      const { data: files } = await supabase
        .from('files')
        .select('subject_id, created_at')
        .in('subject_id', subIds);
      (files ?? []).forEach((f: { subject_id: string; created_at: string }) => {
        counts.set(f.subject_id, (counts.get(f.subject_id) ?? 0) + 1);
        const prev = latest.get(f.subject_id);
        if (!prev || f.created_at > prev) latest.set(f.subject_id, f.created_at);
      });
    }
    materias = rows
      .filter((r) => r.careers?.universities)
      .map((r) => ({
        id: r.id,
        name: r.name,
        year: r.year,
        semester: r.semester,
        fileCount: counts.get(r.id) ?? 0,
        latest: latest.get(r.id) ?? null,
        href: `/${r.careers!.universities!.slug}/${r.careers!.slug}/${r.slug}`,
      }))
      .sort((a, b) => b.fileCount - a.fileCount)
      .slice(0, 12);
  }

  return { myUniIds, myCareerIds, materias };
}

export default async function HomePage() {
  const universities = await getUniversities();
  const { userId, emailVerified, profile } = await getCurrentProfile();

  const personalization =
    universities && userId ? await getPersonalization(userId) : null;
  const trending = universities === null ? [] : await getTrending();
  const autoOnboarding =
    Boolean(userId) && emailVerified && profile?.onboarding_completed === false;

  return (
    <div className="container-page">
      <section className="mx-auto mb-14 max-w-3xl pt-8 text-center sm:pt-12">
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
          Todo el material de tu carrera,
          <br className="hidden sm:block" />{' '}
          <span className="bg-gradient-to-r from-brand-500 to-[#46a3ff] bg-clip-text text-transparent">
            en un solo lugar.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-subtle sm:text-xl">
          Apuntes, parciales y resúmenes organizados por universidad, carrera y
          materia. Gratis, hecho por estudiantes.
        </p>
        {userId && (
          <Onboarding
            userId={userId}
            autoOpen={autoOnboarding}
            showButton={false}
            initialUniversities={personalization?.myUniIds ?? []}
            initialCareers={personalization?.myCareerIds ?? []}
          />
        )}
      </section>

      {universities === null ? (
        <SetupNotice />
      ) : universities.length === 0 ? (
        <EmptyState
          title="Todavía no hay universidades"
          description="Ejecutá el script de datos iniciales (seed) descrito en el README para cargar las universidades y carreras."
        />
      ) : (
        <>
          {personalization && personalization.materias.length > 0 && (
            <section className="mb-12">
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-subtle">
                Tus materias
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {personalization.materias.map((m) => (
                  <Link
                    key={m.id}
                    href={m.href}
                    className="card card-hover flex flex-col justify-center gap-0.5 p-4"
                  >
                    <p className="truncate text-[15px] font-medium text-ink">
                      {m.name}
                    </p>
                    <p className="text-xs text-subtle">
                      {yearLabel(m.year)} · {semesterLabel(m.semester)}
                      {m.latest ? ` · último ${formatDate(m.latest)}` : ''}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <UniversityGrid
            universities={universities}
            highlightIds={personalization?.myUniIds ?? []}
          />
          <TrendingFiles items={trending} />
        </>
      )}
    </div>
  );
}
