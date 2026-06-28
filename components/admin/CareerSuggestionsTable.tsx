'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { formatDate, slugify } from '@/lib/utils';

type SugStatus = 'pending' | 'approved' | 'rejected';

export interface CareerSuggestionRow {
  id: string;
  career_name: string;
  faculty: string | null;
  additional_info: string | null;
  status: SugStatus;
  created_at: string;
  universityId: string | null;
  universityName: string;
  suggester: string | null;
}

const STATUS_STYLE: Record<SugStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  rejected: 'bg-surface text-subtle',
};
const STATUS_LABEL: Record<SugStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

export function CareerSuggestionsTable({
  initialRows,
}: {
  initialRows: CareerSuggestionRow[];
}) {
  const { toast } = useToast();
  const [rows, setRows] = useState(initialRows);
  const [filter, setFilter] = useState<SugStatus | 'all'>('pending');
  const [busy, setBusy] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === 'all' ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  );

  function setStatus(id: string, status: SugStatus) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  async function approve(r: CareerSuggestionRow) {
    if (!r.universityId) return;
    setBusy(r.id);
    const supabase = createClient();
    const { error } = await supabase.from('careers').insert({
      university_id: r.universityId,
      name: r.career_name.trim(),
      slug: slugify(r.career_name),
    });
    if (error && error.code !== '23505') {
      setBusy(null);
      return toast('No se pudo crear la carrera', 'error');
    }
    await supabase
      .from('career_suggestions')
      .update({ status: 'approved' })
      .eq('id', r.id);
    setBusy(null);
    setStatus(r.id, 'approved');
    toast(
      error?.code === '23505'
        ? 'La carrera ya existía; sugerencia aprobada'
        : 'Carrera creada y sugerencia aprobada',
      'success'
    );
  }

  async function reject(r: CareerSuggestionRow) {
    setBusy(r.id);
    await createClient()
      .from('career_suggestions')
      .update({ status: 'rejected' })
      .eq('id', r.id);
    setBusy(null);
    setStatus(r.id, 'rejected');
    toast('Sugerencia rechazada', 'info');
  }

  const filters: { value: SugStatus | 'all'; label: string }[] = [
    { value: 'pending', label: 'Pendientes' },
    { value: 'approved', label: 'Aprobadas' },
    { value: 'rejected', label: 'Rechazadas' },
    { value: 'all', label: 'Todas' },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-ink text-canvas'
                : 'bg-surface text-ink/80 hover:bg-hairline/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card px-6 py-10 text-center text-sm text-subtle">
          No hay sugerencias en esta categoría.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{r.career_name}</p>
                  <p className="mt-0.5 text-sm text-subtle">
                    {r.universityName}
                    {r.faculty ? ` · ${r.faculty}` : ''}
                  </p>
                  {r.additional_info && (
                    <p className="mt-1 text-sm text-subtle">{r.additional_info}</p>
                  )}
                  <p className="mt-1 text-xs text-subtle">
                    Sugerida por {r.suggester ? `@${r.suggester}` : 'anónimo'} ·{' '}
                    {formatDate(r.created_at)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[r.status]}`}
                >
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
              {r.status === 'pending' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => approve(r)}
                    disabled={busy === r.id}
                    className="btn-primary !px-3 !py-1.5 text-sm"
                  >
                    Aprobar (crear carrera)
                  </button>
                  <button
                    onClick={() => reject(r)}
                    disabled={busy === r.id}
                    className="btn-ghost !px-3 !py-1.5 text-sm"
                  >
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
