'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { SearchIcon } from '@/components/icons';

type Kind = 'file' | 'subject' | 'career' | 'university';
interface Result {
  kind: Kind;
  label: string;
  sublabel?: string;
  href: string;
}

const one = <T,>(x: T | T[] | null | undefined): T | undefined =>
  Array.isArray(x) ? x[0] : (x ?? undefined);

const GROUP_LABELS: Record<Kind, string> = {
  file: 'Archivos',
  subject: 'Materias',
  career: 'Carreras',
  university: 'Universidades',
};

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      void runSearch(q);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function runSearch(q: string) {
    const supabase = createClient();
    const like = `%${q}%`;
    const [unis, careers, subjects, files] = await Promise.all([
      supabase.from('universities').select('name, slug').ilike('name', like).limit(4),
      supabase
        .from('careers')
        .select('name, slug, universities(slug)')
        .ilike('name', like)
        .limit(4),
      supabase
        .from('subjects')
        .select('name, slug, careers(slug, universities(slug))')
        .ilike('name', like)
        .limit(5),
      supabase
        .from('files')
        .select('title, subjects(slug, careers(slug, universities(slug)))')
        .ilike('title', like)
        .limit(5),
    ]);

    const out: Result[] = [];

    for (const f of (files.data ?? []) as any[]) {
      const sub = one(f.subjects);
      const car = one(sub?.careers);
      const uni = one(car?.universities);
      if (sub && car && uni) {
        out.push({
          kind: 'file',
          label: f.title,
          sublabel: sub.slug.replace(/-/g, ' '),
          href: `/${uni.slug}/${car.slug}/${sub.slug}`,
        });
      }
    }
    for (const s of (subjects.data ?? []) as any[]) {
      const car = one(s.careers);
      const uni = one(car?.universities);
      if (car && uni) {
        out.push({
          kind: 'subject',
          label: s.name,
          sublabel: car.slug.replace(/-/g, ' '),
          href: `/${uni.slug}/${car.slug}/${s.slug}`,
        });
      }
    }
    for (const c of (careers.data ?? []) as any[]) {
      const uni = one(c.universities);
      if (uni) {
        out.push({
          kind: 'career',
          label: c.name,
          sublabel: uni.slug,
          href: `/${uni.slug}/${c.slug}`,
        });
      }
    }
    for (const u of (unis.data ?? []) as any[]) {
      out.push({ kind: 'university', label: u.name, href: `/${u.slug}` });
    }

    setResults(out);
    setLoading(false);
    setOpen(true);
  }

  function go(href: string) {
    setOpen(false);
    setQuery('');
    setResults([]);
    router.push(href);
  }

  const grouped: { kind: Kind; items: Result[] }[] = (
    ['file', 'subject', 'career', 'university'] as Kind[]
  )
    .map((kind) => ({ kind, items: results.filter((r) => r.kind === kind) }))
    .filter((g) => g.items.length > 0);

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-subtle" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        placeholder="Buscar archivos, materias, carreras…"
        className="input pl-10"
        aria-label="Búsqueda global"
      />

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl bg-card p-2 shadow-apple-lg ring-1 ring-black/[0.06] dark:ring-white/[0.08]">
          {loading ? (
            <p className="px-3 py-4 text-sm text-subtle">Buscando…</p>
          ) : grouped.length === 0 ? (
            <p className="px-3 py-4 text-sm text-subtle">
              No encontramos nada para “{query.trim()}”.
            </p>
          ) : (
            grouped.map((g) => (
              <div key={g.kind} className="mb-1 last:mb-0">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">
                  {GROUP_LABELS[g.kind]}
                </p>
                {g.items.map((r, i) => (
                  <button
                    key={`${g.kind}-${i}`}
                    onClick={() => go(r.href)}
                    className="flex w-full flex-col items-start rounded-xl px-3 py-2 text-left hover:bg-surface"
                  >
                    <span className="line-clamp-1 text-sm font-medium text-ink">
                      {r.label}
                    </span>
                    {r.sublabel && (
                      <span className="line-clamp-1 text-xs capitalize text-subtle">
                        {r.sublabel}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
