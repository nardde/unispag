'use client';

import { useState } from 'react';
import { REPORT_REASONS } from '@/types';
import { CloseIcon } from '@/components/icons';

export function ReportModal({
  fileTitle,
  onClose,
  onSubmit,
}: {
  fileTitle: string;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => Promise<void>;
}) {
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(reason, details.trim());
    } catch {
      setError('No se pudo enviar el reporte. Intentá nuevamente.');
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-scale-in overflow-y-auto rounded-t-3xl bg-card p-6 shadow-apple-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[19px] font-semibold text-ink">Reportar archivo</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-subtle hover:bg-hairline/60"
            aria-label="Cerrar"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 line-clamp-1 text-sm text-subtle">“{fileTitle}”</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="report-reason">
              Motivo
            </label>
            <select
              id="report-reason"
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="report-details">
              Detalles <span className="font-normal text-subtle">(opcional)</span>
            </label>
            <textarea
              id="report-details"
              className="input min-h-[72px] resize-y"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Contanos qué pasa con este archivo"
              maxLength={400}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40">
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
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Enviando…' : 'Enviar reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
