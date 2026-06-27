'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import type { Subject } from '@/types';
import { slugify } from '@/lib/utils';

interface Props {
  careerId: string;
  universitySlug: string;
  careerSlug: string;
  existingSubjects: Subject[];
  variant?: 'primary' | 'secondary';
  label?: string;
}

function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function AddSubject({
  careerId,
  universitySlug,
  careerSlug,
  existingSubjects,
  variant = 'primary',
  label = '+ Agregar materia',
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
    return <div className="h-10 w-40 animate-pulse rounded-full bg-surface" />;
  }

  if (!user) {
    return (
      <Link href="/auth/login" className="btn-secondary">
        Iniciá sesión para agregar
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={variant === 'secondary' ? 'btn-secondary' : 'btn-primary'}
      >
        {label}
      </button>
      {open && (
        <AddSubjectModal
          careerId={careerId}
          universitySlug={universitySlug}
          careerSlug={careerSlug}
          existingSubjects={existingSubjects}
          onClose={() => setOpen(false)}
          onCreated={(slug) => {
            router.push(`/${universitySlug}/${careerSlug}/${slug}`);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function AddSubjectModal({
  careerId,
  universitySlug,
  careerSlug,
  existingSubjects,
  onClose,
  onCreated,
}: {
  careerId: string;
  universitySlug: string;
  careerSlug: string;
  existingSubjects: Subject[];
  onClose: () => void;
  onCreated: (slug: string) => void;
}) {
  const [name, setName] = useState('');
  const [year, setYear] = useState<number>(1);
  const [semester, setSemester] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live duplicate hint (case/accent-insensitive).
  const duplicate = name.trim()
    ? existingSubjects.find((s) => normalize(s.name) === normalize(name))
    : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 3) {
      setError('El nombre de la materia debe tener al menos 3 caracteres.');
      return;
    }
    if (duplicate) {
      setError('Ya existe una materia con ese nombre en esta carrera.');
      return;
    }

    const slug = slugify(name);
    if (!slug) {
      setError('Ingresá un nombre válido.');
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const { error: insertError } = await supabase.from('subjects').insert({
      career_id: careerId,
      name: name.trim(),
      slug,
      description: description.trim() || null,
      year,
      semester,
    });

    if (insertError) {
      // Unique violation → slug collides with an existing subject.
      setError(
        insertError.code === '23505'
          ? 'Ya existe una materia con un nombre muy similar en esta carrera.'
          : 'No se pudo crear la materia. Intentá nuevamente.'
      );
      setSubmitting(false);
      return;
    }

    onCreated(slug);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-scale-in overflow-y-auto rounded-t-3xl bg-white p-6 shadow-apple-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[19px] font-semibold text-ink">Agregar materia</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-subtle hover:bg-hairline/60"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="subject-name">
              Nombre de la materia *
            </label>
            <input
              id="subject-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Análisis Matemático I"
              maxLength={120}
              autoFocus
            />
            {duplicate && (
              <p className="mt-1.5 text-xs text-amber-600">
                Ya existe “{duplicate.name}” en esta carrera.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="subject-year">
                Año *
              </label>
              <select
                id="subject-year"
                className="input"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6].map((y) => (
                  <option key={y} value={y}>
                    {y}°
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="subject-semester">
                Cuatrimestre *
              </label>
              <select
                id="subject-semester"
                className="input"
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
              >
                <option value={1}>1°</option>
                <option value={2}>2°</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="subject-description">
              Descripción <span className="font-normal text-subtle">(opcional)</span>
            </label>
            <textarea
              id="subject-description"
              className="input min-h-[64px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción de la materia"
              maxLength={300}
            />
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
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !!duplicate}
            >
              {submitting ? 'Creando…' : 'Crear materia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
