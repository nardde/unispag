'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/utils';
import type { ReportStatus } from '@/types';

export interface EntityReportRow {
  id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  reporter: string | null;
  entityId: string | null;
  entityName: string;
  entityHref: string | null;
}

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: 'Pendiente',
  resolved: 'Resuelto',
  dismissed: 'Desestimado',
};
const STATUS_STYLE: Record<ReportStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  resolved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  dismissed: 'bg-surface text-subtle',
};

export function EntityReportsTable({
  initialRows,
  reportTable,
  entityTable,
  entityLabel,
}: {
  initialRows: EntityReportRow[];
  reportTable: 'subject_reports' | 'career_reports';
  entityTable: 'subjects' | 'careers';
  entityLabel: string;
}) {
  const { toast } = useToast();
  const [rows, setRows] = useState(initialRows);
  const [filter, setFilter] = useState<ReportStatus | 'all'>('pending');
  const [busy, setBusy] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === 'all' ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  );

  function setStatus(id: string, status: ReportStatus) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  async function dismiss(r: EntityReportRow) {
    setBusy(r.id);
    const { error } = await createClient()
      .from(reportTable)
      .update({ status: 'dismissed' })
      .eq('id', r.id);
    setBusy(null);
    if (error) return toast('No se pudo actualizar', 'error');
    setStatus(r.id, 'dismissed');
    toast('Reporte desestimado', 'success');
  }

  async function deleteEntity(r: EntityReportRow) {
    if (!r.entityId) return;
    if (!confirm(`¿Eliminar "${r.entityName}"? No se puede deshacer.`)) return;
    setBusy(r.id);
    const supabase = createClient();
    const { error } = await supabase.from(entityTable).delete().eq('id', r.entityId);
    if (!error)
      await supabase.from(reportTable).update({ status: 'resolved' }).eq('id', r.id);
    setBusy(null);
    if (error) return toast('No se pudo eliminar', 'error');
    setStatus(r.id, 'resolved');
    toast(`${entityLabel} eliminada y reporte resuelto`, 'success');
  }

  const filters: { value: ReportStatus | 'all'; label: string }[] = [
    { value: 'pending', label: 'Pendientes' },
    { value: 'resolved', label: 'Resueltos' },
    { value: 'dismissed', label: 'Desestimados' },
    { value: 'all', label: 'Todos' },
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
          No hay reportes en esta categoría.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {r.entityName || `(${entityLabel} eliminada)`}
                  </p>
                  <p className="mt-0.5 text-sm text-subtle">
                    <span className="font-medium text-ink/80">{r.reason}</span>
                    {r.details ? ` — ${r.details}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-subtle">
                    Reportado por {r.reporter ? `@${r.reporter}` : 'anónimo'} ·{' '}
                    {formatDate(r.created_at)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[r.status]}`}
                >
                  {STATUS_LABEL[r.status]}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {r.entityHref && (
                  <Link href={r.entityHref} className="btn-secondary !px-3 !py-1.5 text-sm">
                    Ver {entityLabel.toLowerCase()}
                  </Link>
                )}
                {r.status === 'pending' && (
                  <>
                    {r.entityId && (
                      <button
                        onClick={() => deleteEntity(r)}
                        disabled={busy === r.id}
                        className="btn-secondary !px-3 !py-1.5 text-sm text-rose-600"
                      >
                        Eliminar {entityLabel.toLowerCase()}
                      </button>
                    )}
                    <button
                      onClick={() => dismiss(r)}
                      disabled={busy === r.id}
                      className="btn-ghost !px-3 !py-1.5 text-sm"
                    >
                      Desestimar reporte
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
