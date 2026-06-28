'use client';

import { useMemo, useState } from 'react';
import type { SubjectWithCount } from '@/types';
import { yearLabel } from '@/types';
import { SubjectCard } from '@/components/SubjectCard';
import { SearchIcon, ChevronIcon } from '@/components/icons';

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const UNASSIGNED = 0;

// Sort key that pushes "Sin asignar" (0) to the bottom.
const orderKey = (y: number) => (y === UNASSIGNED ? Infinity : y);

export function SubjectAccordion({
  subjects,
  basePath,
}: {
  subjects: SubjectWithCount[];
  basePath: string;
}) {
  const [query, setQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<'all' | number>('all');

  // Years present (subjects with no year fall under UNASSIGNED = 0).
  const presentYears = useMemo(() => {
    const set = new Set<number>();
    subjects.forEach((s) => set.add(s.year || UNASSIGNED));
    return Array.from(set).sort((a, b) => orderKey(a) - orderKey(b));
  }, [subjects]);

  const [openYears, setOpenYears] = useState<Set<number>>(
    () => new Set(presentYears)
  );

  function toggleYear(y: number) {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(y)) next.delete(y);
      else next.add(y);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return subjects.filter((s) => {
      const y = s.year || UNASSIGNED;
      if (yearFilter !== 'all' && y !== yearFilter) return false;
      if (q && !normalize(s.name).includes(q)) return false;
      return true;
    });
  }, [subjects, query, yearFilter]);

  // Group: year -> [sem1[], sem2[]]
  const groups = useMemo(() => {
    const byYear = new Map<number, SubjectWithCount[]>();
    filtered.forEach((s) => {
      const y = s.year || UNASSIGNED;
      if (!byYear.has(y)) byYear.set(y, []);
      byYear.get(y)!.push(s);
    });
    return Array.from(byYear.entries())
      .sort((a, b) => orderKey(a[0]) - orderKey(b[0]))
      .map(([year, items]) => ({
        year,
        sem1: items
          .filter((s) => s.semester === 1)
          .sort((a, b) => a.name.localeCompare(b.name, 'es')),
        sem2: items
          .filter((s) => s.semester !== 1)
          .sort((a, b) => a.name.localeCompare(b.name, 'es')),
        total: items.length,
      }));
  }, [filtered]);

  return (
    <div>
      {/* Sticky filter bar */}
      <div className="sticky top-14 z-20 -mx-5 mb-5 border-b border-hairline/50 bg-canvas/85 px-5 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar materia…"
              className="input pl-10"
            />
          </div>
          <select
            value={yearFilter}
            onChange={(e) =>
              setYearFilter(
                e.target.value === 'all' ? 'all' : Number(e.target.value)
              )
            }
            className="input sm:w-44"
            aria-label="Filtrar por año"
          >
            <option value="all">Todos los años</option>
            {presentYears.map((y) => (
              <option key={y} value={y}>
                {y === UNASSIGNED ? 'Sin asignar' : yearLabel(y)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-2xl bg-surface px-4 py-10 text-center text-sm text-subtle">
          No se encontraron materias.
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map(({ year, sem1, sem2, total }) => {
            const open = openYears.has(year);
            return (
              <div key={year} className="card overflow-hidden">
                <button
                  onClick={() => toggleYear(year)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-surface/60"
                  aria-expanded={open}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[15px] font-semibold text-ink">
                      {year === UNASSIGNED ? 'Sin asignar' : yearLabel(year)}
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
                  <div className="grid grid-cols-1 gap-5 border-t border-hairline/50 px-5 pb-5 pt-4 sm:grid-cols-2">
                    {[
                      { label: '1° Cuatrimestre', items: sem1 },
                      { label: '2° Cuatrimestre', items: sem2 },
                    ].map((col) => (
                      <div key={col.label}>
                        <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-subtle">
                          {col.label}
                        </h4>
                        {col.items.length === 0 ? (
                          <p className="text-sm text-subtle/70">—</p>
                        ) : (
                          <div className="space-y-2.5">
                            {col.items.map((s) => (
                              <SubjectCard
                                key={s.id}
                                subject={s}
                                basePath={basePath}
                                showSemester={false}
                              />
                            ))}
                          </div>
                        )}
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
