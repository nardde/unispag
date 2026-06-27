'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { slugify } from '@/lib/utils';
import type { University } from '@/types';

export function UniversitiesManager({
  initial,
}: {
  initial: University[];
}) {
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<University | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(u: University) {
    if (
      !confirm(
        `¿Eliminar ${u.name}? Se borrarán sus carreras, materias y archivos. No se puede deshacer.`
      )
    )
      return;
    setBusy(u.id);
    const { error } = await createClient()
      .from('universities')
      .delete()
      .eq('id', u.id);
    setBusy(null);
    if (error) return toast('No se pudo eliminar', 'error');
    setItems((prev) => prev.filter((x) => x.id !== u.id));
    toast('Universidad eliminada', 'success');
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setAdding(true)} className="btn-primary">
          + Agregar universidad
        </button>
      </div>

      <div className="space-y-3">
        {items.map((u) => (
          <div key={u.id} className="card flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-medium text-ink">
                {u.name}{' '}
                {u.acronym && (
                  <span className="text-xs text-subtle">({u.acronym})</span>
                )}
              </p>
              <p className="truncate text-xs text-subtle">
                {u.zone ?? ''} {u.description ? `· ${u.description}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 gap-3 text-sm font-medium">
              <Link href={`/${u.slug}`} className="text-subtle hover:underline">
                Ver
              </Link>
              <button
                onClick={() => setEditing(u)}
                className="text-brand-600 hover:underline"
              >
                Editar
              </button>
              <button
                onClick={() => remove(u)}
                disabled={busy === u.id}
                className="text-rose-600 hover:underline disabled:opacity-40"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="card px-6 py-10 text-center text-sm text-subtle">
            No hay universidades.
          </div>
        )}
      </div>

      {editing && (
        <UniversityModal
          university={editing}
          onClose={() => setEditing(null)}
          onSaved={(u) => {
            setItems((prev) => prev.map((x) => (x.id === u.id ? u : x)));
            setEditing(null);
          }}
        />
      )}
      {adding && (
        <UniversityModal
          onClose={() => setAdding(false)}
          onSaved={(u) => {
            setItems((prev) => [u, ...prev]);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}

function UniversityModal({
  university,
  onClose,
  onSaved,
}: {
  university?: University;
  onClose: () => void;
  onSaved: (u: University) => void;
}) {
  const { toast } = useToast();
  const isEdit = Boolean(university);
  const [name, setName] = useState(university?.name ?? '');
  const [acronym, setAcronym] = useState(university?.acronym ?? '');
  const [zone, setZone] = useState(university?.zone ?? '');
  const [description, setDescription] = useState(university?.description ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 3) {
      setError('El nombre es obligatorio.');
      return;
    }
    setBusy(true);
    const supabase = createClient();

    if (isEdit && university) {
      const { data, error } = await supabase
        .from('universities')
        .update({
          name: name.trim(),
          acronym: acronym.trim() || null,
          zone: zone.trim() || null,
          description: description.trim() || null,
        })
        .eq('id', university.id)
        .select('*')
        .single();
      setBusy(false);
      if (error) return setError('No se pudo guardar.');
      onSaved(data as University);
      toast('Universidad actualizada', 'success');
    } else {
      const { data, error } = await supabase
        .from('universities')
        .insert({
          name: name.trim(),
          slug: slugify(name),
          acronym: acronym.trim() || null,
          zone: zone.trim() || null,
          description: description.trim() || null,
        })
        .select('*')
        .single();
      setBusy(false);
      if (error)
        return setError(
          error.code === '23505'
            ? 'Ya existe una universidad con ese nombre.'
            : 'No se pudo crear.'
        );
      onSaved(data as University);
      toast('Universidad creada', 'success');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-scale-in rounded-t-3xl bg-card p-6 shadow-apple-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-[19px] font-semibold text-ink">
          {isEdit ? 'Editar universidad' : 'Agregar universidad'}
        </h2>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Nombre *</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Sigla</label>
              <input className="input" value={acronym} onChange={(e) => setAcronym(e.target.value)} maxLength={12} />
            </div>
            <div>
              <label className="label">Zona</label>
              <input className="input" value={zone} onChange={(e) => setZone(e.target.value)} maxLength={60} />
            </div>
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea
              className="input min-h-[64px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
            />
          </div>
          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={busy}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
