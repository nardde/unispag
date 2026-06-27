'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { FILE_CATEGORIES, type FileCategory } from '@/types';
import { sanitizeFileName } from '@/lib/utils';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

interface Props {
  careerId: string;
  universitySlug: string;
  careerSlug: string;
}

export function FileUpload({ careerId, universitySlug, careerSlug }: Props) {
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
    return <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-100" />;
  }

  if (!user) {
    return (
      <Link href="/auth/login" className="btn-secondary">
        Iniciá sesión para subir
      </Link>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        + Subir archivo
      </button>
      {open && (
        <UploadModal
          userId={user.id}
          careerId={careerId}
          universitySlug={universitySlug}
          careerSlug={careerSlug}
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
  onClose,
  onSuccess,
}: {
  userId: string;
  careerId: string;
  universitySlug: string;
  careerSlug: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FileCategory>('notes');
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!title.trim()) return 'El título es obligatorio.';
    if (!subject.trim()) return 'La materia es obligatoria.';
    if (!file) return 'Seleccioná un archivo.';
    if (file.size > MAX_BYTES) return 'El archivo supera el límite de 25 MB.';
    if (year && !/^\d{4}$/.test(year)) return 'El año debe tener 4 dígitos.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    try {
      const safeName = sanitizeFileName(file!.name);
      const path = `${universitySlug}/${careerSlug}/${Date.now()}-${safeName}`;

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
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        category,
        subject: subject.trim(),
        semester: semester.trim() || null,
        year: year ? Number(year) : null,
        file_url: publicUrl,
        file_name: file!.name,
        file_size: file!.size,
      });

      if (insertError) {
        // Roll back the uploaded object so we don't leave orphans.
        await supabase.storage.from('files').remove([path]);
        throw insertError;
      }

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Subir archivo</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="title">
              Título *
            </label>
            <input
              id="title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Resumen final de Microeconomía"
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
              placeholder="Breve descripción del contenido (opcional)"
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="label" htmlFor="subject">
                Materia *
              </label>
              <input
                id="subject"
                className="input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej: Microeconomía I"
                maxLength={120}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="year">
                Año
              </label>
              <input
                id="year"
                className="input"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2025"
                inputMode="numeric"
                maxLength={4}
              />
            </div>
            <div>
              <label className="label" htmlFor="semester">
                Cuatrimestre / Semestre
              </label>
              <input
                id="semester"
                className="input"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="Ej: 1er cuatrimestre"
                maxLength={40}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="file">
              Archivo * <span className="font-normal text-gray-400">(máx. 25 MB)</span>
            </label>
            <input
              id="file"
              type="file"
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.zip"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
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
      </div>
    </div>
  );
}
