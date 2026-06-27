import Link from 'next/link';
import { DownloadIcon, ThumbUpIcon } from '@/components/icons';
import { CATEGORY_LABELS, type FileCategory } from '@/types';

export interface TrendingItem {
  id: string;
  title: string;
  category: FileCategory;
  downloads: number;
  score: number;
  href: string;
  subjectName: string;
  careerName: string;
  universityName: string;
}

export function TrendingFiles({ items }: { items: TrendingItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-subtle">
        Lo más descargado esta semana
      </h2>
      <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="card card-hover flex w-64 shrink-0 snap-start flex-col p-5"
          >
            <span className="inline-flex w-fit items-center rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-subtle">
              {CATEGORY_LABELS[item.category] ?? 'Otros'}
            </span>
            <h3 className="mt-2 line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
              {item.title}
            </h3>
            <p className="mt-1 line-clamp-1 text-xs text-subtle">
              {item.subjectName} · {item.careerName}
            </p>
            <p className="line-clamp-1 text-xs text-subtle">
              {item.universityName}
            </p>
            <div className="mt-3 flex items-center gap-3 border-t border-hairline/50 pt-3 text-xs text-subtle">
              <span className="flex items-center gap-1">
                <DownloadIcon className="h-3.5 w-3.5" />
                {item.downloads}
              </span>
              <span className="flex items-center gap-1">
                <ThumbUpIcon className="h-3.5 w-3.5" />
                {item.score}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
