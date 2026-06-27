import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { Breadcrumb } from '@/components/Breadcrumb';
import { AddSubject } from '@/components/AddSubject';
import { SubjectAccordion } from '@/components/SubjectAccordion';
import { FileCard } from '@/components/FileCard';
import { EmptyState } from '@/components/EmptyState';
import { SetupNotice } from '@/components/SetupNotice';
import type {
  University,
  Career,
  Subject,
  SubjectWithCount,
  FileRecord,
} from '@/types';

export const dynamic = 'force-dynamic';

async function getData(
  universitySlug: string,
  careerSlug: string
): Promise<
  | {
      ok: true;
      university: University;
      career: Career;
      subjects: SubjectWithCount[];
      orphanFiles: FileRecord[];
    }
  | { ok: false; reason: 'config' | 'notfound' }
> {
  let supabase;
  try {
    supabase = createServerClient();
  } catch {
    return { ok: false, reason: 'config' };
  }

  const { data: university, error: uErr } = await supabase
    .from('universities')
    .select('*')
    .eq('slug', universitySlug)
    .maybeSingle();

  if (uErr) return { ok: false, reason: 'config' };
  if (!university) return { ok: false, reason: 'notfound' };

  const { data: career } = await supabase
    .from('careers')
    .select('*')
    .eq('university_id', university.id)
    .eq('slug', careerSlug)
    .maybeSingle();

  if (!career) return { ok: false, reason: 'notfound' };

  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .eq('career_id', career.id);

  // File counts per subject + orphan (subject-less) files.
  const { data: files } = await supabase
    .from('files')
    .select('*, profiles(username)')
    .eq('career_id', career.id)
    .order('created_at', { ascending: false });

  const fileList = (files ?? []) as FileRecord[];
  const counts = new Map<string, number>();
  fileList.forEach((f) => {
    if (f.subject_id)
      counts.set(f.subject_id, (counts.get(f.subject_id) ?? 0) + 1);
  });

  const subjectsWithCount = ((subjects ?? []) as Subject[]).map((s) => ({
    ...s,
    fileCount: counts.get(s.id) ?? 0,
  }));

  return {
    ok: true,
    university: university as University,
    career: career as Career,
    subjects: subjectsWithCount,
    orphanFiles: fileList.filter((f) => !f.subject_id),
  };
}

export default async function CareerPage({
  params,
}: {
  params: { university: string; career: string };
}) {
  const result = await getData(params.university, params.career);

  if (!result.ok && result.reason === 'notfound') notFound();

  if (!result.ok) {
    return (
      <div className="container-page">
        <SetupNotice />
      </div>
    );
  }

  const { university, career, subjects, orphanFiles } = result;
  const basePath = `/${university.slug}/${career.slug}`;
  const totalFiles = subjects.reduce((n, s) => n + s.fileCount, 0) + orphanFiles.length;

  return (
    <div className="container-page">
      <Breadcrumb
        items={[
          { label: 'Inicio', href: '/' },
          { label: university.name, href: `/${university.slug}` },
          { label: career.name },
        ]}
      />

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            {career.name}
          </h1>
          <p className="mt-1 text-sm text-subtle">
            {university.name} · {subjects.length}{' '}
            {subjects.length === 1 ? 'materia' : 'materias'} · {totalFiles}{' '}
            {totalFiles === 1 ? 'archivo' : 'archivos'}
          </p>
        </div>
        {subjects.length > 0 && (
          <AddSubject
            careerId={career.id}
            universitySlug={university.slug}
            careerSlug={career.slug}
            existingSubjects={subjects}
          />
        )}
      </header>

      {subjects.length === 0 ? (
        <EmptyState
          title="Todavía no hay materias para esta carrera"
          description="¡Sé el primero en agregarla! Las materias las cargan los estudiantes, de forma colaborativa."
        >
          <AddSubject
            careerId={career.id}
            universitySlug={university.slug}
            careerSlug={career.slug}
            existingSubjects={subjects}
          />
        </EmptyState>
      ) : (
        <SubjectAccordion subjects={subjects} basePath={basePath} />
      )}

      {orphanFiles.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-subtle">
            Sin materia asignada
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {orphanFiles.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
