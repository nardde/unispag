'use client';

import { useState } from 'react';
import type { FileRecord } from '@/types';
import { CATEGORY_LABELS, yearLabel } from '@/types';
import { formatFileSize, formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import { FileTypeIcon, DownloadIcon } from '@/components/icons';

const CATEGORY_STYLES: Record<string, string> = {
  notes: 'bg-blue-50 text-blue-700',
  exam: 'bg-rose-50 text-rose-700',
  summary: 'bg-amber-50 text-amber-700',
  other: 'bg-surface text-subtle',
};

function extOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function FileCard({
  file,
  onDelete,
}: {
  file: FileRecord;
  /** When provided, a delete button is shown (use only for the owner). */
  onDelete?: (file: FileRecord) => Promise<void> | void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [downloads, setDownloads] = useState(file.downloads ?? 0);

  async function handleDelete() {
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

  function handleDownload() {
    // Fire-and-forget counter bump; never block the download.
    setDownloads((n) => n + 1);
    try {
      createClient()
        .rpc('increment_downloads', { p_file_id: file.id })
        .then(
          () => {},
          () => {}
        );
    } catch {
      /* ignore */
    }
  }

  const subjectName = file.subjects?.name ?? file.subject;
  const chips = [
    subjectName,
    file.year ? yearLabel(file.year) : null,
    file.semester,
  ].filter(Boolean) as string[];

  return (
    <div className="card card-hover flex flex-col p-5">
      <div className="mb-3 flex items-start gap-3">
        <FileTypeIcon ext={extOf(file.file_name)} className="h-11 w-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-snug text-ink line-clamp-2">
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
        <span className="shrink-0 tabular-nums">{formatFileSize(file.file_size)}</span>
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
          {downloads > 0 && (
            <span className="ml-1 rounded-full bg-white/20 px-1.5 text-[11px] font-semibold">
              {downloads}
            </span>
          )}
        </a>
        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-secondary text-rose-600 hover:bg-rose-50"
          >
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </button>
        )}
      </div>
    </div>
  );
}
