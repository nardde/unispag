import Link from 'next/link';
import type { Career } from '@/types';

export function CareerCard({
  career,
  universitySlug,
}: {
  career: Career;
  universitySlug: string;
}) {
  return (
    <Link
      href={`/${universitySlug}/${career.slug}`}
      className="card group flex items-center justify-between p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-gray-900 group-hover:text-brand-700">
          {career.name}
        </h3>
        {career.description && (
          <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">
            {career.description}
          </p>
        )}
      </div>
      <span className="ml-4 shrink-0 text-gray-300 transition-colors group-hover:text-brand-500">
        →
      </span>
    </Link>
  );
}
