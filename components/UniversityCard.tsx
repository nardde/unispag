import Link from 'next/link';
import type { UniversityWithCount } from '@/types';

export function UniversityCard({ university }: { university: UniversityWithCount }) {
  return (
    <Link
      href={`/${university.slug}`}
      className="card group flex flex-col p-6 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 ring-1 ring-brand-100">
          {university.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={university.logo_url}
              alt={university.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-xl font-bold text-brand-600">
              {university.name
                .split(' ')
                .filter((w) => w.length > 2)
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-gray-900 group-hover:text-brand-700">
            {university.name}
          </h3>
          <p className="text-sm text-gray-500">
            {university.careerCount}{' '}
            {university.careerCount === 1 ? 'carrera' : 'carreras'}
          </p>
        </div>
      </div>
      {university.description && (
        <p className="line-clamp-2 text-sm text-gray-500">
          {university.description}
        </p>
      )}
      <span className="mt-4 text-sm font-medium text-brand-600 group-hover:underline">
        Ver carreras →
      </span>
    </Link>
  );
}
