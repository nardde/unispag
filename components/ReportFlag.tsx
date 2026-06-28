'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuthUser } from '@/lib/useAuthUser';
import { useToast } from '@/components/Toast';
import { FlagIcon } from '@/components/icons';

/**
 * Subtle flag button + report modal, reused for subjects and careers.
 * Only renders for logged-in users; one report per user per entity.
 */
export function ReportFlag({
  entityId,
  table,
  idColumn,
  reasons,
  title = 'Reportar',
}: {
  entityId: string;
  table: 'subject_reports' | 'career_reports';
  idColumn: 'subject_id' | 'career_id';
  reasons: readonly string[];
  title?: string;
}) {
  const { user } = useAuthUser();
  const { toast } = useToast();
  const [reported, setReported] = useState(false);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    createClient()
      .from(table)
      .select('id')
      .eq(idColumn, entityId)
      .eq('reported_by', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) setReported(true);
      });
    return () => {
      active = false;
    };
  }, [user, entityId, table, idColumn]);

  if (!user) return null;

  function openModal(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!reported) setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await createClient()
      .from(table)
      .insert({
        [idColumn]: entityId,
        reported_by: user!.id,
        reason,
        details: details.trim() || null,
      });
    setBusy(false);
    if (error) {
      if (error.code === '23505') {
        setReported(true);
        setOpen(false);
        toast('Ya reportaste esto', 'info');
        return;
      }
      toast('No se pudo enviar el reporte', 'error');
      return;
    }
    setReported(true);
    setOpen(false);
    toast('Reporte enviado, gracias', 'success');
  }

  return (
    <>
      <button
        onClick={openModal}
        disabled={reported}
        title={reported ? 'Ya reportaste esto' : title}
        aria-label={title}
        className={`rounded-full p-1 transition-colors ${
          reported
            ? 'text-subtle/30'
            : 'text-subtle/50 hover:bg-surface hover:text-rose-600'
        }`}
      >
        <FlagIcon className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[65] flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }}
        >
          <div
            className="w-full max-w-md animate-scale-in rounded-t-3xl bg-card p-6 shadow-apple-lg sm:rounded-3xl"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <h2 className="mb-4 text-[19px] font-semibold text-ink">Reportar</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Motivo</label>
                <select
                  className="input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  {reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">
                  Detalles{' '}
                  <span className="font-normal text-subtle">(opcional)</span>
                </label>
                <textarea
                  className="input min-h-[72px] resize-y"
                  value={details}
                  onChange={(e) => setDetails(e.target.value.slice(0, 300))}
                  maxLength={300}
                  placeholder="Contanos un poco más"
                />
              </div>
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
                  {busy ? 'Enviando…' : 'Enviar reporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
