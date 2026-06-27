import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { Breadcrumb } from '@/components/Breadcrumb';
import { CareerCard } from '@/components/CareerCard';
import { SetupNotice } from '@/components/SetupNotice';
import type { University, Career } from '@/types';

export const dynamic = 'force-dynamic';

async function getData(slug: string): Promise<
  | { ok: true; university: University; careers: Career[] }
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

  return {
    ok: true,
    university: university as University,
    careers: (careers ?? []) as Career[],
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
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 ring-1 ring-brand-100">
          {university.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={university.logo_url}
              alt={university.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-2xl font-bold text-brand-600">
              {university.name.slice(0, 1)}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {university.name}
          </h1>
          {university.description && (
            <p className="mt-1 text-gray-600">{university.description}</p>
          )}
        </div>
      </header>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Carreras
      </h2>

      {careers.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-gray-500">
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
