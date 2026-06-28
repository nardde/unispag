'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useAuthUser } from '@/lib/useAuthUser';
import { useToast } from '@/components/Toast';

export function SuggestCareer({ universityId }: { universityId: string }) {
  const { user } = useAuthUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="mt-6 text-center text-sm text-subtle">
        ¿No encontrás tu carrera?{' '}
        <Link href="/auth/login" className="font-medium text-brand-500 hover:underline">
          Iniciá sesión para sugerirla
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 3) {
      setError('Ingresá el nombre de la carrera.');
      return;
    }
    setBusy(true);
    const { error } = await createClient().from('career_suggestions').insert({
      university_id: universityId,
      suggested_by: user!.id,
      career_name: name.trim(),
      faculty: faculty.trim() || null,
      additional_info: info.trim() || null,
    });
    setBusy(false);
    if (error) {
      setError('No se pudo enviar. Intentá de nuevo.');
      return;
    }
    setOpen(false);
    setName('');
    setFaculty('');
    setInfo('');
    toast('¡Gracias! Revisaremos tu sugerencia', 'success');
  }

  return (
    <div className="mt-6 text-center">
      <button onClick={() => setOpen(true)} className="btn-secondary">
        ¿No encontrás tu carrera? Sugerila
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md animate-scale-in rounded-t-3xl bg-card p-6 text-left shadow-apple-lg sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-[19px] font-semibold text-ink">
              Sugerir una carrera
            </h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Nombre de la carrera *</label>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  placeholder="Ej: Licenciatura en Biotecnología"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">
                  Facultad <span className="font-normal text-subtle">(opcional)</span>
                </label>
                <input
                  className="input"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  maxLength={120}
                />
              </div>
              <div>
                <label className="label">
                  Información adicional{' '}
                  <span className="font-normal text-subtle">(opcional)</span>
                </label>
                <textarea
                  className="input min-h-[64px] resize-y"
                  value={info}
                  onChange={(e) => setInfo(e.target.value.slice(0, 300))}
                  maxLength={300}
                />
              </div>
              {error && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-secondary"
                  disabled={busy}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? 'Enviando…' : 'Enviar sugerencia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
