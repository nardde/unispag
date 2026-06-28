import Link from 'next/link';
import type { SubjectWithCount } from '@/types';
import { SUBJECT_REPORT_REASONS, yearLabel, semesterLabel } from '@/types';
import { ReportFlag } from '@/components/ReportFlag';

export function SubjectCard({
  subject,
  basePath,
  showSemester = true,
}: {
  subject: SubjectWithCount;
  /** e.g. `/di-tella/derecho` */
  basePath: string;
  showSemester?: boolean;
}) {
  return (
    <div className="relative">
      <Link
        href={`${basePath}/${subject.slug}`}
        className="card card-hover group flex min-h-[68px] flex-col justify-center p-4 pr-8"
      >
        <p className="truncate text-[15px] font-medium leading-snug text-ink">
          {subject.name}
        </p>
        {showSemester && (
          <p className="mt-0.5 text-xs text-subtle">
            {yearLabel(subject.year)} · {semesterLabel(subject.semester)}
          </p>
        )}
      </Link>
      <div className="absolute bottom-2 right-2">
        <ReportFlag
          entityId={subject.id}
          table="subject_reports"
          idColumn="subject_id"
          reasons={SUBJECT_REPORT_REASONS}
          title="Reportar materia"
        />
      </div>
    </div>
  );
}
