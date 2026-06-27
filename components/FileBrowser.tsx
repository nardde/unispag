'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FileRecord, FileCategory } from '@/types';
import { FILE_CATEGORIES } from '@/types';
import { FileCard } from '@/components/FileCard';
import { createClient } from '@/lib/supabase';
import { useAuthUser } from '@/lib/useAuthUser';

type Sort = 'recent' | 'downloads' | 'rating';

export function FileBrowser({ files }: { files: FileRecord[] }) {
  const { user } = useAuthUser();
  const [category, setCategory] = useState<FileCategory | 'all'>('all');
  const [sort, setSort] = useState<Sort>('recent');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [myVotes, setMyVotes] = useState<Record<string, 1 | -1>>({});
  const [loaded, setLoaded] = useState(false);

  // One batched query for all ratings in this list.
  useEffect(() => {
    let active = true;
    const ids = files.map((f) => f.id);
    if (ids.length === 0) {
      setLoaded(true);
      return;
    }
    createClient()
      .from('file_ratings')
      .select('file_id, value, user_id')
      .in('file_id', ids)
      .then(({ data }) => {
        if (!active) return;
        const s: Record<string, number> = {};
        const mv: Record<string, 1 | -1> = {};
        for (const r of (data ?? []) as {
          file_id: string;
          value: number;
          user_id: string;
        }[]) {
          s[r.file_id] = (s[r.file_id] ?? 0) + r.value;
          if (user && r.user_id === user.id) mv[r.file_id] = r.value as 1 | -1;
        }
        setScores(s);
        setMyVotes(mv);
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [files, user]);

  const enriched = useMemo(
    () =>
      files.map((f) => ({
        ...f,
        score: scores[f.id] ?? 0,
        my_vote: myVotes[f.id] ?? 0,
      })),
    [files, scores, myVotes]
  );

  const visible = useMemo(() => {
    const filtered =
      category === 'all'
        ? enriched
        : enriched.filter((f) => f.category === category);
    return [...filtered].sort((a, b) => {
      if (sort === 'downloads') return (b.downloads ?? 0) - (a.downloads ?? 0);
      if (sort === 'rating') return (b.score ?? 0) - (a.score ?? 0);
      return +new Date(b.created_at) - +new Date(a.created_at);
    });
  }, [enriched, category, sort]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={category === 'all'} onClick={() => setCategory('all')}>
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

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="input sm:w-52"
          aria-label="Ordenar"
        >
          <option value="recent">Más reciente</option>
          <option value="downloads">Más descargado</option>
          <option value="rating">Mejor valorado</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl bg-surface px-4 py-10 text-center text-sm text-subtle">
          No hay archivos en esta categoría.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((file) => (
            <FileCard key={file.id} file={file} ratingsPreloaded={loaded} />
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
        active ? 'bg-ink text-canvas' : 'bg-surface text-ink/80 hover:bg-hairline/50'
      }`}
    >
      {children}
    </button>
  );
}
