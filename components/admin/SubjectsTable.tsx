'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { yearLabel, semesterLabel } from '@/types';
import { SearchIcon } from '@/components/icons';

export interface AdminSubject {
  id: string;
  name: string;
  year: number;
  semester: number;
  careers: { name: string; universities: { name: string } | null } | null;
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function SubjectsTable({ initial }: { initial: AdminSubject[] }) {
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return items;
    return items.filter(
      (s) =>
        normalize(s.name).includes(q) ||
        normalize(s.careers?.name ?? '').includes(q) ||
        normalize(s.careers?.universities?.name ?? '').includes(q)
    );
  }, [items, query]);

  async function remove(s: AdminSubject) {
    if (
      !confirm(`¿Eliminar "${s.name}"? Se borrarán sus archivos. No se puede deshacer.`)
    )
      return;
    setBusy(s.id);
    const { error } = await createClient().from('subjects').delete().eq('id', s.id);
    setBusy(null);
    if (error) return toast('No se pudo eliminar', 'error');
    setItems((prev) => prev.filter((x) => x.id !== s.id));
    toast('Materia eliminada', 'success');
  }

  return (
    <div>
      <div className="relative mb-4 w-full sm:max-w-sm">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-subtle" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por materia, carrera o universidad…"
          className="input pl-10"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-hairline/60 text-xs uppercase text-subtle">
            <tr>
              <th className="p-3">Materia</th>
              <th className="p-3">Carrera</th>
              <th className="p-3">Universidad</th>
              <th className="p-3">Año / Cuat.</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/40">
            {visible.map((s) => (
              <tr key={s.id}>
                <td className="p-3 font-medium text-ink">{s.name}</td>
                <td className="p-3 text-subtle">{s.careers?.name ?? '—'}</td>
                <td className="p-3 text-subtle">
                  {s.careers?.universities?.name ?? '—'}
                </td>
                <td className="p-3 text-subtle">
                  {yearLabel(s.year)} · {semesterLabel(s.semester)}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => remove(s)}
                    disabled={busy === s.id}
                    className="font-medium text-rose-600 hover:underline disabled:opacity-40"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-subtle">
                  No hay materias.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
