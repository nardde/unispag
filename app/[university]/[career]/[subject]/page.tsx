import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FileUpload } from '@/components/FileUpload';
import { FileBrowser } from '@/components/FileBrowser';
import { FollowSubject } from '@/components/FollowSubject';
import { EmptyState } from '@/components/EmptyState';
import { SetupNotice } from '@/components/SetupNotice';
import { yearLabel, semesterLabel } from '@/types';
import type { University, Career, Subject, FileRecord } from '@/types';

export const dynamic = 'force-dynamic';

async function getData(
  universitySlug: string,
  careerSlug: string,
  subjectSlug: string
): Promise<
  | {
      ok: true;
      university: University;
      career: Career;
      subject: Subject;
      files: FileRecord[];
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

  const { data: subject } = await supabase
    .from('subjects')
    .select('*')
    .eq('career_id', career.id)
    .eq('slug', subjectSlug)
    .maybeSingle();

  if (!subject) return { ok: false, reason: 'notfound' };

  const { data: files } = await supabase
    .from('files')
    .select('*, profiles(username)')
    .eq('subject_id', subject.id)
    .order('created_at', { ascending: false });

  return {
    ok: true,
    university: university as University,
    career: career as Career,
    subject: subject as Subject,
    files: (files ?? []) as FileRecord[],
  };
}

export default async function SubjectPage({
  params,
}: {
  params: { university: string; career: string; subject: string };
}) {
  const result = await getData(params.university, params.career, params.subject);

  if (!result.ok && result.reason === 'notfound') notFound();

  if (!result.ok) {
    return (
      <div className="container-page">
        <SetupNotice />
      </div>
    );
  }

  const { university, career, subject, files } = result;

  return (
    <div className="container-page">
      <Breadcrumb
        items={[
          { label: 'Inicio', href: '/' },
          { label: university.name, href: `/${university.slug}` },
          { label: career.name, href: `/${university.slug}/${career.slug}` },
          { label: yearLabel(subject.year) },
          { label: subject.name },
        ]}
      />

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            {subject.name}
          </h1>
          <p className="mt-1 text-sm text-subtle">
            {yearLabel(subject.year)} · {semesterLabel(subject.semester)} ·{' '}
            {files.length} {files.length === 1 ? 'archivo' : 'archivos'}
          </p>
          {subject.description && (
            <p className="mt-2 max-w-xl text-sm text-subtle">
              {subject.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <FollowSubject subjectId={subject.id} />
          <FileUpload
            careerId={career.id}
            universitySlug={university.slug}
            careerSlug={career.slug}
            subjects={[subject]}
            presetSubject={subject}
          />
        </div>
      </header>

      {files.length === 0 ? (
        <EmptyState
          title="Todavía no hay archivos"
          description="Sé el primero en compartir apuntes, parciales o resúmenes de esta materia."
        />
      ) : (
        <FileBrowser files={files} />
      )}
    </div>
  );
}
