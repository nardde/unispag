'use client';

import { useMemo, useState } from 'react';
import { SearchIcon, CloseIcon } from '@/components/icons';

export interface Option {
  id: string;
  label: string;
  sublabel?: string;
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function SearchMultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Buscar…',
  emptyText = 'Sin resultados.',
}: {
  options: Option[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  emptyText?: string;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const base = q
      ? options.filter(
          (o) =>
            normalize(o.label).includes(q) ||
            normalize(o.sublabel ?? '').includes(q)
        )
      : options;
    return base.slice(0, 50);
  }, [options, query]);

  const selectedOptions = options.filter((o) => selected.includes(o.id));

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
    );
  }

  return (
    <div>
      {selectedOptions.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedOptions.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-1 text-xs font-medium text-white"
            >
              {o.label}
              <button
                type="button"
                onClick={() => toggle(o.id)}
                className="opacity-80 hover:opacity-100"
                aria-label={`Quitar ${o.label}`}
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative mb-2">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-subtle" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="input pl-10"
        />
      </div>

      <div className="max-h-52 overflow-y-auto rounded-xl border border-hairline">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-subtle">{emptyText}</p>
        ) : (
          filtered.map((o) => {
            const isSel = selected.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => toggle(o.id)}
                className={`flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm transition-colors hover:bg-surface ${
                  isSel ? 'text-ink' : 'text-ink/80'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{o.label}</span>
                  {o.sublabel && (
                    <span className="block truncate text-xs text-subtle">
                      {o.sublabel}
                    </span>
                  )}
                </span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    isSel
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-hairline'
                  }`}
                >
                  {isSel && '✓'}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
