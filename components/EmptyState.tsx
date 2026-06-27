import Link from 'next/link';

/** Reusable empty state with an SVG illustration. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-20 text-center">
      <FolderIllustration className="mb-5 h-28 w-28" />
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[15px] text-subtle">{description}</p>
      {action && (
        <Link href={action.href} className="btn-primary mt-6">
          {action.label}
        </Link>
      )}
    </div>
  );
}

function FolderIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" aria-hidden>
      <defs>
        <linearGradient id="es-g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9f3fe" />
          <stop offset="1" stopColor="#cfe4fc" />
        </linearGradient>
      </defs>
      <rect x="40" y="34" width="86" height="108" rx="10" fill="#fff" stroke="#d2d2d7" strokeWidth="2" />
      <rect x="54" y="52" width="58" height="7" rx="3.5" fill="#e6e6ea" />
      <rect x="54" y="68" width="42" height="7" rx="3.5" fill="#ececed" />
      <rect x="54" y="84" width="50" height="7" rx="3.5" fill="#ececed" />
      <path
        d="M70 96c0-6 5-11 11-11h44c6 0 11 5 11 11v40c0 6-5 11-11 11H81c-6 0-11-5-11-11V96Z"
        fill="url(#es-g1)"
        stroke="#0071e3"
        strokeWidth="2"
      />
      <path
        d="M70 104c0-6 5-11 11-11h20l8 8h16c6 0 11 5 11 11v24c0 6-5 11-11 11H81c-6 0-11-5-11-11v-32Z"
        fill="#fff"
        stroke="#0071e3"
        strokeWidth="2"
      />
      <circle cx="150" cy="44" r="10" fill="#0071e3" opacity="0.15" />
      <path d="M150 39v10M145 44h10" stroke="#0071e3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
