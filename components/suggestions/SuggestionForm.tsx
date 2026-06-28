'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuthUser } from '@/lib/useAuthUser';
import { SUGGESTION_TYPES } from '@/types';

export function SuggestionForm({ defaultEmail }: { defaultEmail: string | null }) {
  const router = useRouter();
  const { user } = useAuthUser();
  const [type, setType] = useState<string>(SUGGESTION_TYPES[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="card flex flex-col items-center px-6 py-12 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-3xl dark:bg-emerald-950/40">
          ✓
        </div>
        <h2 className="text-lg font-semibold text-ink">¡Gracias por tu idea!</h2>
        <p className="mt-1 max-w-sm text-sm text-subtle">
          La vamos a revisar. Si la aprobamos, va a aparecer abajo para que otros
          la voten.
        </p>
        <button onClick={() => setDone(false)} className="btn-secondary mt-5">
          Enviar otra
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card px-6 py-10 text-center">
        <p className="text-sm text-subtle">
          <Link href="/auth/login" className="font-medium text-brand-500 hover:underline">
            Iniciá sesión
          </Link>{' '}
          para enviar una sugerencia.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 3) return setError('Ingresá un título.');
    if (description.trim().length < 5)
      return setError('Contanos un poco más en la descripción.');

    setBusy(true);
    const { error } = await createClient().from('suggestions').insert({
      user_id: user!.id,
      type,
      title: title.trim(),
      description: description.trim(),
      contact_email: email.trim() || null,
    });
    setBusy(false);
    if (error) {
      setError('No se pudo enviar. Intentá de nuevo.');
      return;
    }
    setTitle('');
    setDescription('');
    setDone(true);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div>
        <label className="label">Tipo</label>
        <select
          className="input"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {SUGGESTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Título</label>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 100))}
          maxLength={100}
          placeholder="Resumí tu idea en una frase"
        />
      </div>
      <div>
        <label className="label">Descripción</label>
        <textarea
          className="input min-h-[96px] resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
          maxLength={1000}
          placeholder="Contanos en detalle"
        />
        <p className="mt-1 text-right text-xs text-subtle">
          {description.length}/1000
        </p>
      </div>
      <div>
        <label className="label">
          Email <span className="font-normal text-subtle">(opcional)</span>
        </label>
        <input
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Para contactarte si hace falta"
        />
      </div>
      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary w-full !rounded-xl" disabled={busy}>
        {busy ? 'Enviando…' : 'Enviar sugerencia'}
      </button>
    </form>
  );
}
