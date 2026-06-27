import { createServerClient } from '@/lib/supabase-server';
import { UniversityCard } from '@/components/UniversityCard';
import { SetupNotice } from '@/components/SetupNotice';
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
      <section className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Apuntes, exámenes y resúmenes
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Encontrá y compartí material de estudio organizado por universidad y
          carrera. Gratis, hecho por estudiantes.
        </p>
      </section>

      {universities === null ? (
        <SetupNotice />
      ) : universities.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Universidades
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {universities.map((u) => (
              <UniversityCard key={u.id} university={u} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-2xl">
        🎓
      </div>
      <h3 className="text-lg font-semibold text-gray-900">
        Todavía no hay universidades
      </h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        Ejecutá el script de datos iniciales (seed) descrito en el README para
        cargar las universidades y carreras.
      </p>
    </div>
  );
}
