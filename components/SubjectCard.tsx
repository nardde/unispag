import Link from 'next/link';
import type { SubjectWithCount } from '@/types';

export function SubjectCard({
  subject,
  basePath,
}: {
  subject: SubjectWithCount;
  /** e.g. `/di-tella/derecho` */
  basePath: string;
}) {
  return (
    <Link
      href={`${basePath}/${subject.slug}`}
      className="card card-hover group flex items-center justify-between gap-3 p-4"
    >
      <span className="min-w-0 text-[15px] font-medium leading-snug text-ink">
        {subject.name}
      </span>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
          subject.fileCount > 0
            ? 'bg-brand-50 text-brand-700'
            : 'bg-surface text-subtle'
        }`}
      >
        {subject.fileCount}
      </span>
    </Link>
  );
}
