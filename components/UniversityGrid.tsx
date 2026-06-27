'use client';

import { useMemo, useState } from 'react';
import type { UniversityWithCount } from '@/types';
import { UniversityCard } from '@/components/UniversityCard';
import { SearchIcon } from '@/components/icons';

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function UniversityGrid({
  universities,
  highlightIds = [],
}: {
  universities: UniversityWithCount[];
  highlightIds?: string[];
}) {
  const [query, setQuery] = useState('');
  const highlight = useMemo(() => new Set(highlightIds), [highlightIds]);

  const ordered = useMemo(() => {
    if (highlight.size === 0) return universities;
    return [...universities].sort((a, b) => {
      const aH = highlight.has(a.id) ? 0 : 1;
      const bH = highlight.has(b.id) ? 0 : 1;
      return aH - bH;
    });
  }, [universities, highlight]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return ordered;
    return ordered.filter(
      (u) =>
        normalize(u.name).includes(q) ||
        normalize(u.acronym ?? '').includes(q) ||
        normalize(u.zone ?? '').includes(q)
    );
  }, [ordered, query]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">
          Universidades
        </h2>
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar universidad…"
            className="input pl-10"
            aria-label="Buscar universidad"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-surface px-4 py-12 text-center text-sm text-subtle">
          No se encontraron universidades para “{query}”.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((u) => (
            <UniversityCard
              key={u.id}
              university={u}
              highlight={highlight.has(u.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
