'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { FileCard } from '@/components/FileCard';
import { EmptyState } from '@/components/EmptyState';
import type { FileRecord } from '@/types';

/** Derive the storage object path from a public file URL. */
function storagePathFromUrl(url: string): string | null {
  const marker = '/storage/v1/object/public/files/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export function ProfileFiles({ initialFiles }: { initialFiles: FileRecord[] }) {
  const [files, setFiles] = useState(initialFiles);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(file: FileRecord) {
    setError(null);
    const supabase = createClient();

    // Remove the storage object first (best-effort), then the DB row.
    const path = storagePathFromUrl(file.file_url);
    if (path) {
      await supabase.storage.from('files').remove([path]);
    }

    const { error: deleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', file.id);

    if (deleteError) {
      setError('No se pudo eliminar el archivo. Intentá nuevamente.');
      return;
    }

    setFiles((prev) => prev.filter((f) => f.id !== file.id));
  }

  if (files.length === 0) {
    return (
      <EmptyState
        title="Todavía no subiste archivos"
        description="Explorá las universidades y compartí tu primer apunte o resumen."
        action={{ label: 'Explorar universidades', href: '/' }}
      />
    );
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((file) => (
          <FileCard key={file.id} file={file} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
