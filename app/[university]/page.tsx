import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { Breadcrumb } from '@/components/Breadcrumb';
import { CareerCard } from '@/components/CareerCard';
import { SetupNotice } from '@/components/SetupNotice';
import type { University, Career, CareerWithCount } from '@/types';

export const dynamic = 'force-dynamic';

async function getData(slug: string): Promise<
  | { ok: true; university: University; careers: CareerWithCount[] }
  | { ok: false; reason: 'config' | 'notfound' }
> {
  let supabase;
  try {
    supabase = createServerClient();
  } catch {
    return { ok: false, reason: 'config' };
  }

  const { data: university, error } = await supabase
    .from('universities')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return { ok: false, reason: 'config' };
  if (!university) return { ok: false, reason: 'notfound' };

  const { data: careers } = await supabase
    .from('careers')
    .select('*')
    .eq('university_id', university.id)
    .order('name');

  const careerList = (careers ?? []) as Career[];

  // File counts per career.
  const counts = new Map<string, number>();
  if (careerList.length) {
    const { data: files } = await supabase
      .from('files')
      .select('career_id')
      .in(
        'career_id',
        careerList.map((c) => c.id)
      );
    (files ?? []).forEach((f: { career_id: string }) => {
      counts.set(f.career_id, (counts.get(f.career_id) ?? 0) + 1);
    });
  }

  return {
    ok: true,
    university: university as University,
    careers: careerList.map((c) => ({
      ...c,
      fileCount: counts.get(c.id) ?? 0,
    })),
  };
}

export default async function UniversityPage({
  params,
}: {
  params: { university: string };
}) {
  const result = await getData(params.university);

  if (!result.ok && result.reason === 'notfound') notFound();

  if (!result.ok) {
    return (
      <div className="container-page">
        <SetupNotice />
      </div>
    );
  }

  const { university, careers } = result;

  return (
    <div className="container-page">
      <Breadcrumb
        items={[{ label: 'Inicio', href: '/' }, { label: university.name }]}
      />

      <header className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-[#46a3ff] text-2xl font-bold text-white">
          {university.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={university.logo_url}
              alt={university.name}
              className="h-full w-full object-contain p-1.5"
            />
          ) : (
            university.name.slice(0, 1)
          )}
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            {university.name}
          </h1>
          {university.description && (
            <p className="mt-1 text-subtle">{university.description}</p>
          )}
        </div>
      </header>

      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-subtle">
        Carreras
      </h2>

      {careers.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-subtle">
          Todavía no hay carreras cargadas para esta universidad.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {careers.map((career) => (
            <CareerCard
              key={career.id}
              career={career}
              universitySlug={university.slug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
