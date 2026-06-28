import Link from 'next/link';
import type { CareerWithCount } from '@/types';
import { CAREER_EMOJI } from '@/components/icons';
import { CAREER_REPORT_REASONS } from '@/types';
import { ReportFlag } from '@/components/ReportFlag';

export function CareerCard({
  career,
  universitySlug,
}: {
  career: CareerWithCount;
  universitySlug: string;
}) {
  const emoji = CAREER_EMOJI[career.slug] ?? '📚';

  return (
    <div className="relative">
      <Link
        href={`/${universitySlug}/${career.slug}`}
        className="card card-hover group flex items-center gap-4 p-5 pr-9"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-2xl">
          {emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-ink">
            {career.name}
          </h3>
          <p className="mt-0.5 text-sm text-subtle">
            {career.fileCount} {career.fileCount === 1 ? 'archivo' : 'archivos'}
          </p>
        </div>
        <span className="shrink-0 text-hairline transition-colors group-hover:text-brand-500">
          →
        </span>
      </Link>
      <div className="absolute bottom-2 right-2">
        <ReportFlag
          entityId={career.id}
          table="career_reports"
          idColumn="career_id"
          reasons={CAREER_REPORT_REASONS}
          title="Reportar carrera"
        />
      </div>
    </div>
  );
}
