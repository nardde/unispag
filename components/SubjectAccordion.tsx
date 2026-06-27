'use client';

import { useMemo, useState } from 'react';
import type { SubjectWithCount } from '@/types';
import { yearLabel, semesterLabel } from '@/types';
import { SubjectCard } from '@/components/SubjectCard';
import { SearchIcon, ChevronIcon } from '@/components/icons';

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function SubjectAccordion({
  subjects,
  basePath,
}: {
  subjects: SubjectWithCount[];
  basePath: string;
}) {
  const [query, setQuery] = useState('');

  // Group: year -> semester -> subjects (sorted)
  const years = useMemo(() => {
    const byYear = new Map<number, Map<number, SubjectWithCount[]>>();
    for (const s of subjects) {
      if (!byYear.has(s.year)) byYear.set(s.year, new Map());
      const bySem = byYear.get(s.year)!;
      if (!bySem.has(s.semester)) bySem.set(s.semester, []);
      bySem.get(s.semester)!.push(s);
    }
    return Array.from(byYear.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, bySem]) => ({
        year,
        semesters: Array.from(bySem.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([semester, items]) => ({
            semester,
            items: items.sort((a, b) => a.name.localeCompare(b.name, 'es')),
          })),
      }));
  }, [subjects]);

  const [openYears, setOpenYears] = useState<Set<number>>(
    () => new Set(years.length ? [years[0].year] : [])
  );

  function toggleYear(year: number) {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  const q = normalize(query.trim());
  const searchResults = useMemo(() => {
    if (!q) return null;
    return subjects
      .filter((s) => normalize(s.name).includes(q))
      .sort((a, b) => a.year - b.year || a.name.localeCompare(b.name, 'es'));
  }, [q, subjects]);

  return (
    <div>
      <div className="relative mb-6 max-w-md">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-subtle" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar materia…"
          className="input pl-10"
          aria-label="Buscar materia"
        />
      </div>

      {searchResults ? (
        searchResults.length === 0 ? (
          <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-subtle">
            No se encontraron materias para “{query}”.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((s) => (
              <SubjectCard key={s.id} subject={s} basePath={basePath} />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {years.map(({ year, semesters }) => {
            const open = openYears.has(year);
            const total = semesters.reduce((n, s) => n + s.items.length, 0);
            return (
              <div key={year} className="card overflow-hidden">
                <button
                  onClick={() => toggleYear(year)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-surface/60"
                  aria-expanded={open}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[15px] font-semibold text-ink">
                      {yearLabel(year)}
                    </span>
                    <span className="chip">{total} materias</span>
                  </span>
                  <ChevronIcon
                    className={`h-5 w-5 text-subtle transition-transform duration-200 ${
                      open ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {open && (
                  <div className="space-y-5 border-t border-hairline/50 px-5 pb-5 pt-4">
                    {semesters.map(({ semester, items }) => (
                      <div key={semester}>
                        <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-subtle">
                          {semesterLabel(semester)}
                        </h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {items.map((s) => (
                            <SubjectCard key={s.id} subject={s} basePath={basePath} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
