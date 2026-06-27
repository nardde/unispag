'use client';

import { useMemo, useState } from 'react';
import type { FileRecord, FileCategory } from '@/types';
import { FILE_CATEGORIES } from '@/types';
import { FileCard } from '@/components/FileCard';

export function FileList({ files }: { files: FileRecord[] }) {
  const [category, setCategory] = useState<FileCategory | 'all'>('all');
  const [subject, setSubject] = useState<string>('all');

  const subjects = useMemo(() => {
    const set = new Set<string>();
    files.forEach((f) => f.subject && set.add(f.subject));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [files]);

  const filtered = useMemo(() => {
    return files.filter((f) => {
      if (category !== 'all' && f.category !== category) return false;
      if (subject !== 'all' && f.subject !== subject) return false;
      return true;
    });
  }, [files, category, subject]);

  if (files.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-2xl">
          📂
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Todavía no hay archivos
        </h3>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Sé el primero en compartir apuntes, exámenes o resúmenes de esta
          carrera.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-52">
          <label className="label" htmlFor="filter-category">
            Categoría
          </label>
          <select
            id="filter-category"
            className="input"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as FileCategory | 'all')
            }
          >
            <option value="all">Todas</option>
            {FILE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-64">
          <label className="label" htmlFor="filter-subject">
            Materia
          </label>
          <select
            id="filter-subject"
            className="input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="all">Todas</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-gray-400 sm:ml-auto sm:pb-2">
          {filtered.length} de {files.length}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-gray-500">
          No hay archivos que coincidan con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}
