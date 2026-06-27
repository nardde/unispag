import Link from 'next/link';
import type { UniversityWithCount } from '@/types';

// Distinct gradient per university for the image area.
const GRADIENTS: Record<string, string> = {
  'di-tella': 'from-[#0071e3] to-[#46a3ff]',
  'san-andres': 'from-[#0a3d6e] to-[#0071e3]',
  uade: 'from-[#c2410c] to-[#fb923c]',
  uca: 'from-[#0c4685] to-[#3a90ee]',
  uai: 'from-[#047857] to-[#34d399]',
  ub: 'from-[#7c3aed] to-[#a78bfa]',
  up: 'from-[#be123c] to-[#fb7185]',
  kennedy: 'from-[#155e75] to-[#22d3ee]',
  usal: 'from-[#1e3a8a] to-[#60a5fa]',
  austral: 'from-[#9d174d] to-[#f472b6]',
  itba: 'from-[#1f2937] to-[#4b5563]',
  ucema: 'from-[#065f46] to-[#10b981]',
};
const FALLBACK_GRADIENT = 'from-[#3a90ee] to-[#6bacf4]';

function fallbackAcronym(name: string) {
  return name
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function UniversityCard({
  university,
  highlight = false,
}: {
  university: UniversityWithCount;
  highlight?: boolean;
}) {
  const gradient = GRADIENTS[university.slug] ?? FALLBACK_GRADIENT;
  const acronym = university.acronym ?? fallbackAcronym(university.name);

  return (
    <Link
      href={`/${university.slug}`}
      className={`card card-hover group flex flex-col overflow-hidden ${
        highlight ? 'ring-2 ring-brand-500' : ''
      }`}
    >
      <div
        className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${gradient}`}
      >
        {highlight && (
          <span className="absolute left-3 top-3 rounded-full bg-white/25 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            Tu universidad
          </span>
        )}
        {university.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={university.logo_url}
            alt={university.name}
            className="h-16 w-16 rounded-2xl bg-white/90 object-contain p-2"
          />
        ) : (
          <span className="text-3xl font-bold tracking-tight text-white/95">
            {acronym}
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {university.careerCount}{' '}
          {university.careerCount === 1 ? 'carrera' : 'carreras'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[16px] font-semibold leading-tight text-ink">
          {university.name}
        </h3>
        <div className="mt-1.5 flex items-center gap-2 text-sm text-subtle">
          <span className="rounded-md bg-surface px-1.5 py-0.5 text-xs font-semibold text-ink/70">
            {acronym}
          </span>
          {university.zone && <span className="truncate">{university.zone}</span>}
        </div>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-500 transition-all group-hover:gap-1.5">
          Ver carreras
          <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}
