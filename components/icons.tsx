/** Lightweight inline SVG icons (stroke-based, Apple-ish). */

type IconProps = { className?: string };

export function SearchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="m14 14 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function FileTypeIcon({ ext, className }: { ext: string; className?: string }) {
  const palette: Record<string, string> = {
    pdf: '#e3504f',
    doc: '#2b7cd3',
    docx: '#2b7cd3',
    ppt: '#d35230',
    pptx: '#d35230',
    xls: '#1f9d55',
    xlsx: '#1f9d55',
    png: '#8b5cf6',
    jpg: '#8b5cf6',
    jpeg: '#8b5cf6',
    zip: '#6e6e73',
  };
  const color = palette[ext] ?? '#6e6e73';
  const label = (ext || 'file').slice(0, 4).toUpperCase();
  return (
    <svg className={className} viewBox="0 0 40 48" fill="none" aria-hidden>
      <path
        d="M6 4a4 4 0 0 1 4-4h16l10 10v34a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V4Z"
        fill={color}
        opacity="0.12"
      />
      <path d="M26 0l10 10H30a4 4 0 0 1-4-4V0Z" fill={color} opacity="0.25" />
      <rect x="6" y="28" width="28" height="14" rx="3" fill={color} />
      <text
        x="20"
        y="38"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill="#fff"
        fontFamily="-apple-system, system-ui, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}

/** Per-career symbol (emoji kept minimal & monochrome-friendly). */
export const CAREER_EMOJI: Record<string, string> = {
  derecho: '⚖️',
  'administracion-de-empresas': '📊',
  administracion: '📊',
  economia: '📈',
  'ingenieria-informatica': '💻',
  ingenieria: '🛠️',
  arquitectura: '📐',
  comunicacion: '📡',
};
