import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FileUpload } from '@/components/FileUpload';
import { FileList } from '@/components/FileList';
import { SetupNotice } from '@/components/SetupNotice';
import type { University, Career, FileRecord } from '@/types';

export const dynamic = 'force-dynamic';

async function getData(
  universitySlug: string,
  careerSlug: string
): Promise<
  | { ok: true; university: University; career: Career; files: FileRecord[] }
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

  const { data: files } = await supabase
    .from('files')
    .select('*, profiles(username)')
    .eq('career_id', career.id)
    .order('created_at', { ascending: false });

  return {
    ok: true,
    university: university as University,
    career: career as Career,
    files: (files ?? []) as FileRecord[],
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

  const { university, career, files } = result;

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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {career.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {university.name} ·{' '}
            {files.length} {files.length === 1 ? 'archivo' : 'archivos'}
          </p>
        </div>
        <FileUpload
          careerId={career.id}
          universitySlug={university.slug}
          careerSlug={career.slug}
        />
      </header>

      <FileList files={files} />
    </div>
  );
}
