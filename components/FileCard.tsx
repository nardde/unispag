'use client';

import { useEffect, useState } from 'react';
import type { FileRecord } from '@/types';
import { CATEGORY_LABELS, yearLabel } from '@/types';
import { formatFileSize, formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import { useAuthUser } from '@/lib/useAuthUser';
import { useToast } from '@/components/Toast';
import { ReportModal } from '@/components/ReportModal';
import { FilePreview } from '@/components/FilePreview';
import {
  FileTypeIcon,
  DownloadIcon,
  ThumbUpIcon,
  ThumbDownIcon,
  FlagIcon,
} from '@/components/icons';

const CATEGORY_STYLES: Record<string, string> = {
  notes: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  exam: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
  summary: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  other: 'bg-surface text-subtle',
};

function extOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function FileCard({
  file,
  onDelete,
  ratingsPreloaded = false,
}: {
  file: FileRecord;
  /** When provided, a delete button is shown (use only for the owner). */
  onDelete?: (file: FileRecord) => Promise<void> | void;
  /** Skip the per-card rating fetch (parent already supplied score/my_vote). */
  ratingsPreloaded?: boolean;
}) {
  const { user, verified } = useAuthUser();
  const { toast } = useToast();

  const [deleting, setDeleting] = useState(false);
  const [downloads, setDownloads] = useState(file.downloads ?? 0);
  const [score, setScore] = useState(file.score ?? 0);
  const [myVote, setMyVote] = useState<0 | 1 | -1>(file.my_vote ?? 0);
  const [voteBusy, setVoteBusy] = useState(false);
  const [reported, setReported] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Keep in sync when a parent supplies preloaded ratings asynchronously.
  useEffect(() => {
    if (ratingsPreloaded) {
      setScore(file.score ?? 0);
      setMyVote(file.my_vote ?? 0);
    }
  }, [ratingsPreloaded, file.score, file.my_vote]);

  // Load rating aggregate (+ own vote) and report state.
  useEffect(() => {
    let active = true;
    const supabase = createClient();
    if (!ratingsPreloaded) {
      supabase
        .from('file_ratings')
        .select('value, user_id')
        .eq('file_id', file.id)
        .then(({ data }) => {
          if (!active || !data) return;
          let sum = 0;
          let mine: 0 | 1 | -1 = 0;
          for (const r of data as { value: number; user_id: string }[]) {
            sum += r.value;
            if (user && r.user_id === user.id) mine = r.value as 1 | -1;
          }
          setScore(sum);
          setMyVote(mine);
        });
    }

    if (user) {
      supabase
        .from('reports')
        .select('id')
        .eq('file_id', file.id)
        .eq('reported_by', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (active && data) setReported(true);
        });
    }
    return () => {
      active = false;
    };
  }, [file.id, user, ratingsPreloaded]);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onDelete) return;
    if (!confirm(`¿Eliminar "${file.title}"? Esta acción no se puede deshacer.`))
      return;
    setDeleting(true);
    try {
      await onDelete(file);
    } finally {
      setDeleting(false);
    }
  }

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    setDownloads((n) => n + 1);
    createClient()
      .rpc('increment_downloads', { p_file_id: file.id })
      .then(
        () => {},
        () => {}
      );
  }

  async function handleVote(e: React.MouseEvent, v: 1 | -1) {
    e.stopPropagation();
    if (!user) {
      toast('Iniciá sesión para valorar', 'info');
      return;
    }
    if (!verified) {
      toast('Verificá tu email para valorar', 'info');
      return;
    }
    if (voteBusy) return;
    setVoteBusy(true);

    const supabase = createClient();
    const next: 0 | 1 | -1 = myVote === v ? 0 : v;
    setScore((s) => s - myVote + next);
    setMyVote(next);

    try {
      if (next === 0) {
        await supabase
          .from('file_ratings')
          .delete()
          .eq('file_id', file.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('file_ratings')
          .upsert(
            { file_id: file.id, user_id: user.id, value: next },
            { onConflict: 'file_id,user_id' }
          );
      }
    } catch {
      // revert on failure
      setScore((s) => s - next + myVote);
      setMyVote(myVote);
      toast('No se pudo registrar tu voto', 'error');
    } finally {
      setVoteBusy(false);
    }
  }

  async function submitReport(reason: string, details: string) {
    if (!user) return;
    const supabase = createClient();
    const { error } = await supabase.from('reports').insert({
      file_id: file.id,
      reported_by: user.id,
      reason,
      details: details || null,
    });
    if (error) {
      if (error.code === '23505') {
        setReported(true);
        setShowReport(false);
        toast('Ya reportaste este archivo', 'info');
        return;
      }
      throw error;
    }
    setReported(true);
    setShowReport(false);
    toast('Reporte enviado, gracias', 'success');
  }

  const subjectName = file.subjects?.name ?? file.subject;
  const chips = [
    subjectName,
    file.year ? yearLabel(file.year) : null,
    file.semester,
  ].filter(Boolean) as string[];

  return (
    <>
      <div
        className="card card-hover flex cursor-pointer flex-col p-5"
        onClick={() => setShowPreview(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setShowPreview(true);
        }}
      >
        <div className="mb-3 flex items-start gap-3">
          <FileTypeIcon ext={extOf(file.file_name)} className="h-11 w-11 shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
              {file.title}
            </h3>
            <span
              className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                CATEGORY_STYLES[file.category] ?? CATEGORY_STYLES.other
              }`}
            >
              {CATEGORY_LABELS[file.category] ?? 'Otros'}
            </span>
          </div>
          {user && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!reported) setShowReport(true);
              }}
              disabled={reported}
              title={reported ? 'Ya reportaste este archivo' : 'Reportar archivo'}
              className={`shrink-0 rounded-full p-1.5 transition-colors ${
                reported
                  ? 'text-subtle/40'
                  : 'text-subtle hover:bg-surface hover:text-rose-600'
              }`}
              aria-label="Reportar"
            >
              <FlagIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {file.description && (
          <p className="line-clamp-2 text-sm text-subtle">{file.description}</p>
        )}

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {chips.map((c, i) => (
              <span key={i} className="chip">
                {c}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-hairline/50 pt-3 text-xs text-subtle">
          <span className="truncate">
            {file.profiles?.username ? `@${file.profiles.username}` : 'Anónimo'} ·{' '}
            {formatDate(file.created_at)}
          </span>
          <span className="shrink-0 tabular-nums">
            {formatFileSize(file.file_size)}
          </span>
        </div>

        {/* Ratings + downloads */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center rounded-full bg-surface p-0.5">
            <button
              onClick={(e) => handleVote(e, 1)}
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition-colors ${
                myVote === 1 ? 'bg-brand-500 text-white' : 'text-subtle hover:text-ink'
              }`}
              aria-label="Voto positivo"
            >
              <ThumbUpIcon className="h-4 w-4" />
            </button>
            <span className="min-w-[1.5rem] text-center text-xs font-semibold tabular-nums text-ink">
              {score}
            </span>
            <button
              onClick={(e) => handleVote(e, -1)}
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition-colors ${
                myVote === -1
                  ? 'bg-brand-500 text-white'
                  : 'text-subtle hover:text-ink'
              }`}
              aria-label="Voto negativo"
            >
              <ThumbDownIcon className="h-4 w-4" />
            </button>
          </div>
          <span
            className="ml-auto flex items-center gap-1 text-xs text-subtle"
            title={`${downloads} descargas`}
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            {downloads}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <a
            href={file.file_url}
            target="_blank"
            rel="noopener noreferrer"
            download={file.file_name}
            onClick={handleDownload}
            className="btn-primary flex-1"
          >
            <DownloadIcon className="h-4 w-4" />
            Descargar
          </a>
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-secondary text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </button>
          )}
        </div>
      </div>

      {showReport && (
        <ReportModal
          fileTitle={file.title}
          onClose={() => setShowReport(false)}
          onSubmit={submitReport}
        />
      )}
      {showPreview && (
        <FilePreview file={file} onClose={() => setShowPreview(false)} />
      )}
    </>
  );
}
