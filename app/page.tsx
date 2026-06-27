import { createServerClient } from '@/lib/supabase-server';
import { UniversityCard } from '@/components/UniversityCard';
import { SetupNotice } from '@/components/SetupNotice';
import { EmptyState } from '@/components/EmptyState';
import type { University, UniversityWithCount } from '@/types';

export const dynamic = 'force-dynamic';

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

export default async function HomePage() {
  const universities = await getUniversities();

  return (
    <div className="container-page">
      {/* Hero */}
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
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-subtle">
            Universidades
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {universities.map((u) => (
              <UniversityCard key={u.id} university={u} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
