'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/utils';
import {
  SUGGESTION_TYPES,
  SUGGESTION_STATUS_LABELS,
  type SuggestionStatus,
} from '@/types';

export interface AdminSuggestionRow {
  id: string;
  title: string;
  type: string;
  status: SuggestionStatus;
  created_at: string;
  submitter: string | null;
  upvotes: number;
}

const ACTIONS: { status: SuggestionStatus; label: string }[] = [
  { status: 'approved', label: 'Aprobar' },
  { status: 'planned', label: 'Planificado' },
  { status: 'completed', label: 'Completado' },
  { status: 'rejected', label: 'Rechazar' },
];

export function UserSuggestionsTable({
  initialRows,
}: {
  initialRows: AdminSuggestionRow[];
}) {
  const { toast } = useToast();
  const [rows, setRows] = useState(initialRows);
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [busy, setBusy] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      rows.filter(
        (r) =>
          (statusFilter === 'all' || r.status === statusFilter) &&
          (typeFilter === 'all' || r.type === typeFilter)
      ),
    [rows, statusFilter, typeFilter]
  );

  async function setStatus(r: AdminSuggestionRow, status: SuggestionStatus) {
    setBusy(r.id);
    const { error } = await createClient()
      .from('suggestions')
      .update({ status })
      .eq('id', r.id);
    setBusy(null);
    if (error) return toast('No se pudo actualizar', 'error');
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status } : x)));
    toast('Estado actualizado', 'success');
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as SuggestionStatus | 'all')
          }
          className="input sm:w-44"
        >
          <option value="all">Todos los estados</option>
          {(['pending', 'approved', 'planned', 'completed', 'rejected'] as const).map(
            (s) => (
              <option key={s} value={s}>
                {s === 'pending' ? 'Pendiente' : SUGGESTION_STATUS_LABELS[s]}
              </option>
            )
          )}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input sm:w-56"
        >
          <option value="all">Todos los tipos</option>
          {SUGGESTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-hairline/60 text-xs uppercase text-subtle">
            <tr>
              <th className="p-3">Título</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Por</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Votos</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/40">
            {visible.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="max-w-[220px] p-3 font-medium text-ink">{r.title}</td>
                <td className="p-3 text-subtle">{r.type}</td>
                <td className="p-3 text-subtle">
                  {r.submitter ? `@${r.submitter}` : '—'}
                </td>
                <td className="p-3 text-subtle">{formatDate(r.created_at)}</td>
                <td className="p-3 tabular-nums text-subtle">{r.upvotes}</td>
                <td className="p-3">
                  {r.status === 'pending'
                    ? 'Pendiente'
                    : SUGGESTION_STATUS_LABELS[r.status]}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {ACTIONS.filter((a) => a.status !== r.status).map((a) => (
                      <button
                        key={a.status}
                        onClick={() => setStatus(r, a.status)}
                        disabled={busy === r.id}
                        className="text-xs font-medium text-brand-600 hover:underline disabled:opacity-40"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-subtle">
                  No hay sugerencias.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
