'use client';

import { useMemo, useState } from 'react';
import type { FileRecord, FileCategory } from '@/types';
import { FILE_CATEGORIES } from '@/types';
import { FileCard } from '@/components/FileCard';

type Sort = 'recent' | 'downloads';

export function FileBrowser({ files }: { files: FileRecord[] }) {
  const [category, setCategory] = useState<FileCategory | 'all'>('all');
  const [sort, setSort] = useState<Sort>('recent');

  const visible = useMemo(() => {
    const filtered =
      category === 'all'
        ? files
        : files.filter((f) => f.category === category);
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'downloads') return (b.downloads ?? 0) - (a.downloads ?? 0);
      return +new Date(b.created_at) - +new Date(a.created_at);
    });
    return sorted;
  }, [files, category, sort]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category segmented control */}
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            active={category === 'all'}
            onClick={() => setCategory('all')}
          >
            Todos
          </FilterChip>
          {FILE_CATEGORIES.map((c) => (
            <FilterChip
              key={c.value}
              active={category === c.value}
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </FilterChip>
          ))}
        </div>

        {/* Sort toggle */}
        <div className="inline-flex shrink-0 rounded-full bg-surface p-0.5 text-sm">
          <SortButton active={sort === 'recent'} onClick={() => setSort('recent')}>
            Más recientes
          </SortButton>
          <SortButton
            active={sort === 'downloads'}
            onClick={() => setSort('downloads')}
          >
            Más descargados
          </SortButton>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl bg-surface px-4 py-10 text-center text-sm text-subtle">
          No hay archivos en esta categoría.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-ink text-white'
          : 'bg-surface text-ink/80 hover:bg-hairline/50'
      }`}
    >
      {children}
    </button>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
        active ? 'bg-white text-ink shadow-sm' : 'text-subtle hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}
