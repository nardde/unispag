'use client';

import { useState } from 'react';
import type { FileRecord } from '@/types';
import { CATEGORY_LABELS } from '@/types';
import { formatFileSize, formatDate } from '@/lib/utils';

const CATEGORY_STYLES: Record<string, string> = {
  notes: 'bg-blue-50 text-blue-700 ring-blue-100',
  exam: 'bg-rose-50 text-rose-700 ring-rose-100',
  summary: 'bg-amber-50 text-amber-700 ring-amber-100',
  other: 'bg-gray-100 text-gray-600 ring-gray-200',
};

export function FileCard({
  file,
  onDelete,
}: {
  file: FileRecord;
  /** When provided, a delete button is shown (use only for the owner). */
  onDelete?: (file: FileRecord) => Promise<void> | void;
}) {
  const [deleting, setDeleting] = useState(false);

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

  const meta = [
    file.subject,
    file.year ? String(file.year) : null,
    file.semester,
  ].filter(Boolean);

  return (
    <div className="card flex flex-col p-5 transition-shadow hover:shadow-card-hover">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
            CATEGORY_STYLES[file.category] ?? CATEGORY_STYLES.other
          }`}
        >
          {CATEGORY_LABELS[file.category] ?? 'Otro'}
        </span>
        <span className="shrink-0 text-xs text-gray-400">
          {formatFileSize(file.file_size)}
        </span>
      </div>

      <h3 className="text-base font-semibold leading-snug text-gray-900">
        {file.title}
      </h3>

      {file.description && (
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
          {file.description}
        </p>
      )}

      {meta.length > 0 && (
        <p className="mt-3 text-sm text-gray-600">{meta.join(' · ')}</p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400">
        <span className="truncate">
          {file.profiles?.username ? `@${file.profiles.username}` : 'Anónimo'} ·{' '}
          {formatDate(file.created_at)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <a
          href={file.file_url}
          target="_blank"
          rel="noopener noreferrer"
          download={file.file_name}
          className="btn-primary flex-1"
        >
          Descargar
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
