import Link from 'next/link';
import type { UniversityWithCount } from '@/types';

// Distinct gradient per university for the image area.
const GRADIENTS: Record<string, string> = {
  'di-tella': 'from-[#0071e3] to-[#46a3ff]',
  'san-andres': 'from-[#0a3d6e] to-[#0071e3]',
};
const FALLBACK_GRADIENT = 'from-[#3a90ee] to-[#6bacf4]';

export function UniversityCard({ university }: { university: UniversityWithCount }) {
  const gradient = GRADIENTS[university.slug] ?? FALLBACK_GRADIENT;
  const initials = university.name
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <Link
      href={`/${university.slug}`}
      className="card card-hover group flex flex-col overflow-hidden"
    >
      <div
        className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${gradient}`}
      >
        {university.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={university.logo_url}
            alt={university.name}
            className="h-16 w-16 rounded-2xl bg-white/90 object-contain p-2"
          />
        ) : (
          <span className="text-4xl font-bold tracking-tight text-white/95">
            {initials}
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {university.careerCount}{' '}
          {university.careerCount === 1 ? 'carrera' : 'carreras'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[17px] font-semibold leading-tight text-ink">
          {university.name}
        </h3>
        {university.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-subtle">
            {university.description}
          </p>
        )}
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-500 transition-transform group-hover:gap-1.5">
          Ver carreras
          <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}
