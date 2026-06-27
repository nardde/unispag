'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { formatDate, formatFileSize, storagePathFromUrl } from '@/lib/utils';
import { SearchIcon } from '@/components/icons';

export interface AdminFile {
  id: string;
  title: string;
  file_name: string;
  file_size: number;
  file_url: string;
  created_at: string;
  profiles: { username: string } | null;
  subjects: { name: string } | null;
  careers: { name: string; universities: { name: string } | null } | null;
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function FilesTable({ initialFiles }: { initialFiles: AdminFile[] }) {
  const { toast } = useToast();
  const [files, setFiles] = useState(initialFiles);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return files;
    return files.filter(
      (f) =>
        normalize(f.title).includes(q) ||
        normalize(f.subjects?.name ?? '').includes(q) ||
        normalize(f.profiles?.username ?? '').includes(q)
    );
  }, [files, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function removeMany(ids: string[]) {
    if (ids.length === 0) return;
    if (!confirm(`¿Eliminar ${ids.length} archivo(s)? No se puede deshacer.`))
      return;
    setBusy(true);
    const supabase = createClient();
    const targets = files.filter((f) => ids.includes(f.id));
    const paths = targets
      .map((f) => storagePathFromUrl(f.file_url))
      .filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from('files').remove(paths);
    const { error } = await supabase.from('files').delete().in('id', ids);
    setBusy(false);
    if (error) {
      toast('No se pudieron eliminar', 'error');
      return;
    }
    setFiles((prev) => prev.filter((f) => !ids.includes(f.id)));
    setSelected(new Set());
    toast(`${ids.length} archivo(s) eliminado(s)`, 'success');
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, materia o autor…"
            className="input pl-10"
          />
        </div>
        {selected.size > 0 && (
          <button
            onClick={() => removeMany(Array.from(selected))}
            disabled={busy}
            className="btn-secondary text-rose-600"
          >
            Eliminar seleccionados ({selected.size})
          </button>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-hairline/60 text-xs uppercase text-subtle">
            <tr>
              <th className="w-10 p-3"></th>
              <th className="p-3">Archivo</th>
              <th className="p-3">Universidad / Carrera</th>
              <th className="p-3">Materia</th>
              <th className="p-3">Autor</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Tamaño</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/40">
            {visible.map((f) => (
              <tr key={f.id} className="align-top">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(f.id)}
                    onChange={() => toggle(f.id)}
                    aria-label={`Seleccionar ${f.title}`}
                  />
                </td>
                <td className="max-w-[200px] p-3">
                  <p className="truncate font-medium text-ink">{f.title}</p>
                  <p className="truncate text-xs text-subtle">{f.file_name}</p>
                </td>
                <td className="p-3 text-subtle">
                  {f.careers?.universities?.name ?? '—'}
                  <br />
                  <span className="text-xs">{f.careers?.name ?? ''}</span>
                </td>
                <td className="p-3 text-subtle">{f.subjects?.name ?? '—'}</td>
                <td className="p-3 text-subtle">
                  {f.profiles?.username ? `@${f.profiles.username}` : '—'}
                </td>
                <td className="p-3 text-subtle">{formatDate(f.created_at)}</td>
                <td className="p-3 tabular-nums text-subtle">
                  {formatFileSize(f.file_size)}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => removeMany([f.id])}
                    disabled={busy}
                    className="font-medium text-rose-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-subtle">
                  No hay archivos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
