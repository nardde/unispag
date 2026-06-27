'use client';

import { useMemo } from 'react';
import { formatDate } from '@/lib/utils';

export interface AdminFeedback {
  id: string;
  rating: number | null;
  liked: string[] | null;
  improvements: string[] | null;
  improvements_other: string | null;
  nps_score: number | null;
  contact_email: string | null;
  created_at: string;
}

export function FeedbackPanel({ rows }: { rows: AdminFeedback[] }) {
  const stats = useMemo(() => {
    const rated = rows.filter((r) => r.rating != null);
    const avg = rated.length
      ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
      : 0;

    const dist = [1, 2, 3, 4, 5].map(
      (star) => rated.filter((r) => r.rating === star).length
    );
    const maxDist = Math.max(1, ...dist);

    const nps = rows.filter((r) => r.nps_score != null);
    const promoters = nps.filter((r) => (r.nps_score ?? 0) >= 9).length;
    const detractors = nps.filter((r) => (r.nps_score ?? 0) <= 6).length;
    const npsScore = nps.length
      ? Math.round(((promoters - detractors) / nps.length) * 100)
      : 0;

    const tally = (key: 'liked' | 'improvements') => {
      const map = new Map<string, number>();
      rows.forEach((r) =>
        (r[key] ?? []).forEach((t) => map.set(t, (map.get(t) ?? 0) + 1))
      );
      return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    };

    return {
      avg,
      count: rated.length,
      dist,
      maxDist,
      npsScore,
      likes: tally('liked'),
      improvements: tally('improvements'),
    };
  }, [rows]);

  function exportCsv() {
    const header = [
      'fecha',
      'rating',
      'nps',
      'likes',
      'improvements',
      'otro',
      'email',
    ];
    const lines = rows.map((r) =>
      [
        r.created_at,
        r.rating ?? '',
        r.nps_score ?? '',
        (r.liked ?? []).join('|'),
        (r.improvements ?? []).join('|'),
        (r.improvements_other ?? '').replace(/[\n,]/g, ' '),
        r.contact_email ?? '',
      ].join(',')
    );
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feedback.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <p className="text-3xl font-semibold text-ink">
            {stats.avg.toFixed(1)}
            <span className="text-base text-amber-400"> ★</span>
          </p>
          <p className="mt-0.5 text-xs text-subtle">
            Promedio ({stats.count})
          </p>
        </div>
        <div className="card p-4">
          <p
            className={`text-3xl font-semibold ${
              stats.npsScore >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {stats.npsScore > 0 ? '+' : ''}
            {stats.npsScore}
          </p>
          <p className="mt-0.5 text-xs text-subtle">NPS</p>
        </div>
        <div className="card col-span-2 p-4">
          <p className="mb-2 text-xs font-medium text-subtle">Distribución</p>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-subtle">{star}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{
                      width: `${(stats.dist[star - 1] / stats.maxDist) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-6 text-right tabular-nums text-subtle">
                  {stats.dist[star - 1]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TagCloud title="Lo que más gusta" tags={stats.likes} tone="brand" />
        <TagCloud title="A mejorar" tags={stats.improvements} tone="amber" />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">
          Respuestas ({rows.length})
        </h3>
        <button onClick={exportCsv} className="btn-secondary text-sm">
          Exportar CSV
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-hairline/60 text-xs uppercase text-subtle">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Rating</th>
              <th className="p-3">NPS</th>
              <th className="p-3">Comentarios</th>
              <th className="p-3">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/40">
            {rows.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="p-3 text-subtle">{formatDate(r.created_at)}</td>
                <td className="p-3">{r.rating ? `${r.rating}★` : '—'}</td>
                <td className="p-3">{r.nps_score ?? '—'}</td>
                <td className="max-w-xs p-3 text-subtle">
                  {[...(r.liked ?? []), ...(r.improvements ?? [])].join(', ') ||
                    '—'}
                  {r.improvements_other ? ` · "${r.improvements_other}"` : ''}
                </td>
                <td className="p-3 text-subtle">{r.contact_email ?? '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-subtle">
                  Todavía no hay opiniones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TagCloud({
  title,
  tags,
  tone,
}: {
  title: string;
  tags: [string, number][];
  tone: 'brand' | 'amber';
}) {
  const cls =
    tone === 'brand'
      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
  return (
    <div className="card p-4">
      <p className="mb-3 text-xs font-medium text-subtle">{title}</p>
      {tags.length === 0 ? (
        <p className="text-sm text-subtle">Sin datos.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map(([tag, n]) => (
            <span
              key={tag}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}
              style={{ fontSize: `${Math.min(16, 11 + n)}px` }}
            >
              {tag} · {n}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
