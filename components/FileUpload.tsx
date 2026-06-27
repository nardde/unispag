'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import {
  FILE_CATEGORIES,
  type FileCategory,
  type Subject,
  yearLabel,
  semesterLabel,
} from '@/types';
import { formatFileSize, sanitizeFileName } from '@/lib/utils';
import { recordUpload } from '@/lib/engagement';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

interface Props {
  careerId: string;
  universitySlug: string;
  careerSlug: string;
  subjects: Subject[];
  /** When set, the subject is locked (used on a subject page). */
  presetSubject?: Subject;
  /** Visual style of the trigger button. */
  variant?: 'primary' | 'secondary';
}

export function FileUpload({
  careerId,
  universitySlug,
  careerSlug,
  subjects,
  presetSubject,
  variant = 'primary',
}: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return <div className="h-10 w-36 animate-pulse rounded-full bg-surface" />;
  }

  if (!user) {
    return (
      <Link href="/auth/login" className="btn-secondary">
        Iniciá sesión para subir
      </Link>
    );
  }

  if (!user.email_confirmed_at) {
    return (
      <Link
        href="/verify-email"
        className="btn-secondary"
        title="Verificá tu email para subir archivos"
      >
        Verificá tu email para subir
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={variant === 'secondary' ? 'btn-secondary' : 'btn-primary'}
      >
        + Subir archivo
      </button>
      {open && (
        <UploadModal
          userId={user.id}
          careerId={careerId}
          universitySlug={universitySlug}
          careerSlug={careerSlug}
          subjects={subjects}
          presetSubject={presetSubject}
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function UploadModal({
  userId,
  careerId,
  universitySlug,
  careerSlug,
  subjects,
  presetSubject,
  onClose,
  onSuccess,
}: {
  userId: string;
  careerId: string;
  universitySlug: string;
  careerSlug: string;
  subjects: Subject[];
  presetSubject?: Subject;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FileCategory>('notes');

  // Cascading selection
  const [year, setYear] = useState<number | ''>(presetSubject?.year ?? '');
  const [semester, setSemester] = useState<number | ''>(
    presetSubject?.semester ?? ''
  );
  const [subjectId, setSubjectId] = useState<string>(presetSubject?.id ?? '');

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const yearOptions = useMemo(
    () => Array.from(new Set(subjects.map((s) => s.year))).sort((a, b) => a - b),
    [subjects]
  );
  const semesterOptions = useMemo(
    () =>
      Array.from(
        new Set(
          subjects.filter((s) => s.year === year).map((s) => s.semester)
        )
      ).sort((a, b) => a - b),
    [subjects, year]
  );
  const subjectOptions = useMemo(
    () =>
      subjects
        .filter((s) => s.year === year && s.semester === semester)
        .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [subjects, year, semester]
  );

  function validate(): string | null {
    if (!title.trim()) return 'El título es obligatorio.';
    if (!subjectId) return 'Seleccioná año, cuatrimestre y materia.';
    if (!file) return 'Seleccioná un archivo.';
    if (file.size > MAX_BYTES) return 'El archivo supera el límite de 25 MB.';
    return null;
  }

  function pickFile(f: File | null) {
    if (f && f.size > MAX_BYTES) {
      setError('El archivo supera el límite de 25 MB.');
      return;
    }
    setError(null);
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const subject = subjects.find((s) => s.id === subjectId)!;
    setSubmitting(true);
    const supabase = createClient();

    try {
      const safeName = sanitizeFileName(file!.name);
      const path = `${universitySlug}/${careerSlug}/${subject.slug}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(path, file!, {
          cacheControl: '3600',
          upsert: false,
          contentType: file!.type || undefined,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('files').getPublicUrl(path);

      const { error: insertError } = await supabase.from('files').insert({
        career_id: careerId,
        subject_id: subject.id,
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        category,
        subject: subject.name,
        semester: semesterLabel(subject.semester),
        year: subject.year,
        file_url: publicUrl,
        file_name: file!.name,
        file_size: file!.size,
      });

      if (insertError) {
        await supabase.storage.from('files').remove([path]);
        throw insertError;
      }

      recordUpload(userId);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al subir el archivo.'
      );
      setSubmitting(false);
    }
  }

  const noSubjects = subjects.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-t-3xl bg-card p-6 shadow-apple-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[19px] font-semibold text-ink">Subir archivo</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-subtle hover:bg-hairline/60"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {noSubjects ? (
          <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-subtle">
            Esta carrera todavía no tiene materias cargadas, así que aún no se
            pueden subir archivos.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Drag & drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pickFile(e.dataTransfer.files?.[0] ?? null);
              }}
              onClick={() => inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors ${
                dragging
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-hairline bg-surface/50 hover:border-brand-300'
              }`}
            >
              {file ? (
                <div>
                  <p className="text-sm font-medium text-ink">{file.name}</p>
                  <p className="mt-0.5 text-xs text-subtle">
                    {formatFileSize(file.size)} · Tocá para cambiar
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-ink">
                    Arrastrá tu archivo acá
                  </p>
                  <p className="mt-0.5 text-xs text-subtle">
                    o hacé clic para elegir · máx. 25 MB
                  </p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.zip"
              />
            </div>

            <div>
              <label className="label" htmlFor="title">
                Título *
              </label>
              <input
                id="title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Resumen final 2024"
                maxLength={140}
              />
            </div>

            <div>
              <label className="label" htmlFor="description">
                Descripción
              </label>
              <textarea
                id="description"
                className="input min-h-[72px] resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descripción (opcional)"
                maxLength={500}
              />
            </div>

            {/* Cascading: Year -> Semester -> Subject */}
            {presetSubject ? (
              <div>
                <label className="label">Materia</label>
                <div className="input flex items-center justify-between bg-surface/60">
                  <span>{presetSubject.name}</span>
                  <span className="text-xs text-subtle">
                    {yearLabel(presetSubject.year)} ·{' '}
                    {semesterLabel(presetSubject.semester)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="label" htmlFor="year">
                    Año *
                  </label>
                  <select
                    id="year"
                    className="input"
                    value={year}
                    onChange={(e) => {
                      setYear(e.target.value ? Number(e.target.value) : '');
                      setSemester('');
                      setSubjectId('');
                    }}
                  >
                    <option value="">—</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {yearLabel(y)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="semester">
                    Cuatrimestre *
                  </label>
                  <select
                    id="semester"
                    className="input"
                    value={semester}
                    disabled={year === ''}
                    onChange={(e) => {
                      setSemester(e.target.value ? Number(e.target.value) : '');
                      setSubjectId('');
                    }}
                  >
                    <option value="">—</option>
                    {semesterOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}°
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="subject">
                    Materia *
                  </label>
                  <select
                    id="subject"
                    className="input"
                    value={subjectId}
                    disabled={semester === ''}
                    onChange={(e) => setSubjectId(e.target.value)}
                  >
                    <option value="">—</option>
                    {subjectOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="label" htmlFor="category">
                Categoría *
              </label>
              <select
                id="category"
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value as FileCategory)}
              >
                {FILE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Subiendo…' : 'Subir'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
