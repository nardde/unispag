'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { formatDate, storagePathFromUrl } from '@/lib/utils';
import type { ReportStatus } from '@/types';

export interface AdminReport {
  id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  reporter: { username: string } | null;
  files: {
    id: string;
    title: string;
    file_url: string;
    subjects: { name: string; slug: string } | null;
    careers: { slug: string; universities: { slug: string } | null } | null;
  } | null;
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

function fileHref(r: AdminReport): string | null {
  const f = r.files;
  if (f?.subjects && f.careers?.universities) {
    return `/${f.careers.universities.slug}/${f.careers.slug}/${f.subjects.slug}`;
  }
  return f?.file_url ?? null;
}

export function ReportsTable({ initialReports }: { initialReports: AdminReport[] }) {
  const { toast } = useToast();
  const [reports, setReports] = useState(initialReports);
  const [filter, setFilter] = useState<ReportStatus | 'all'>('pending');
  const [busy, setBusy] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      filter === 'all' ? reports : reports.filter((r) => r.status === filter),
    [reports, filter]
  );

  function setStatus(id: string, status: ReportStatus) {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  async function dismiss(r: AdminReport) {
    setBusy(r.id);
    const { error } = await createClient()
      .from('reports')
      .update({ status: 'dismissed' })
      .eq('id', r.id);
    setBusy(null);
    if (error) return toast('No se pudo actualizar', 'error');
    setStatus(r.id, 'dismissed');
    toast('Reporte desestimado', 'success');
  }

  async function deleteFile(r: AdminReport) {
    if (!r.files) return;
    if (!confirm(`¿Eliminar "${r.files.title}"? No se puede deshacer.`)) return;
    setBusy(r.id);
    const supabase = createClient();
    const path = storagePathFromUrl(r.files.file_url);
    if (path) await supabase.storage.from('files').remove([path]);
    const { error } = await supabase.from('files').delete().eq('id', r.files.id);
    if (!error) {
      await supabase.from('reports').update({ status: 'resolved' }).eq('id', r.id);
    }
    setBusy(null);
    if (error) return toast('No se pudo eliminar el archivo', 'error');
    setStatus(r.id, 'resolved');
    toast('Archivo eliminado y reporte resuelto', 'success');
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
          {visible.map((r) => {
            const href = fileHref(r);
            return (
              <div key={r.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {r.files?.title ?? 'Archivo eliminado'}
                    </p>
                    <p className="mt-0.5 text-sm text-subtle">
                      <span className="font-medium text-ink/80">{r.reason}</span>
                      {r.details ? ` — ${r.details}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-subtle">
                      Reportado por{' '}
                      {r.reporter?.username ? `@${r.reporter.username}` : 'anónimo'} ·{' '}
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
                  {href && (
                    <Link
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      className="btn-secondary !px-3 !py-1.5 text-sm"
                    >
                      Ver archivo
                    </Link>
                  )}
                  {r.status === 'pending' && (
                    <>
                      {r.files && (
                        <button
                          onClick={() => deleteFile(r)}
                          disabled={busy === r.id}
                          className="btn-secondary !px-3 !py-1.5 text-sm text-rose-600"
                        >
                          Eliminar archivo
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
            );
          })}
        </div>
      )}
    </div>
  );
}
