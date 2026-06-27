'use client';

import type { FileRecord } from '@/types';
import { CATEGORY_LABELS } from '@/types';
import { formatFileSize, formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import { useAuthUser } from '@/lib/useAuthUser';
import { recordDownload } from '@/lib/engagement';
import { CloseIcon, DownloadIcon, FileTypeIcon } from '@/components/icons';

function extOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function FilePreview({
  file,
  onClose,
}: {
  file: FileRecord;
  onClose: () => void;
}) {
  const { user } = useAuthUser();
  const ext = extOf(file.file_name);
  const isPdf = ext === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
  const subjectName = file.subjects?.name ?? file.subject;

  function bumpDownload() {
    recordDownload(user?.id);
    createClient()
      .rpc('increment_downloads', { p_file_id: file.id })
      .then(
        () => {},
        () => {}
      );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-4xl animate-scale-in flex-col overflow-hidden bg-card shadow-apple-lg sm:h-[88vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-hairline/60 p-4 sm:p-5">
          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-semibold text-ink">
              {file.title}
            </h2>
            <p className="mt-0.5 truncate text-sm text-subtle">
              {subjectName} · {CATEGORY_LABELS[file.category] ?? 'Otros'} ·{' '}
              {file.profiles?.username ? `@${file.profiles.username}` : 'Anónimo'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              download={file.file_name}
              onClick={bumpDownload}
              className="btn-primary"
            >
              <DownloadIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Descargar</span>
            </a>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-subtle hover:bg-hairline/60"
              aria-label="Cerrar"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-surface">
          {isPdf ? (
            <iframe
              src={`${file.file_url}#view=FitH`}
              title={file.title}
              className="h-full w-full"
            />
          ) : isImage ? (
            <div className="flex h-full items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.file_url}
                alt={file.title}
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <FileTypeIcon ext={ext} className="h-20 w-20" />
              <div>
                <p className="font-medium text-ink">{file.file_name}</p>
                <p className="mt-1 text-sm text-subtle">
                  {formatFileSize(file.file_size)} · {formatDate(file.created_at)}
                </p>
                <p className="mt-3 max-w-xs text-sm text-subtle">
                  La vista previa no está disponible para este tipo de archivo.
                  Descargalo para abrirlo.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
