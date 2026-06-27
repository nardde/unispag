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

export function FlagIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 3v14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 4h9l-1.5 3L14 10H5V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function ThumbUpIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M6 9l3-5.5c1 0 1.8.8 1.8 1.8V8h3.4c1 0 1.7.9 1.5 1.9l-1 4.6c-.2.9-1 1.5-1.9 1.5H6V9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 9H4.5A.5.5 0 0 0 4 9.5v5a.5.5 0 0 0 .5.5H6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function ThumbDownIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M14 11l-3 5.5c-1 0-1.8-.8-1.8-1.8V12H5.8c-1 0-1.7-.9-1.5-1.9l1-4.6C5.5 4.6 6.3 4 7.2 4H14v7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 11h1.5a.5.5 0 0 0 .5-.5v-5a.5.5 0 0 0-.5-.5H14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M6 8a4 4 0 0 1 8 0c0 3.5 1 4.5 1.5 5.5h-11C5 12.5 6 11.5 6 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.5 16a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 2.5v1.5M10 16v1.5M17.5 10H16M4 10H2.5M15 5l-1 1M6 14l-1 1M15 15l-1-1M6 6 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M16 11.5A6.5 6.5 0 0 1 8.5 4a6.5 6.5 0 1 0 7.5 7.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/** Per-career symbol (keyed by career slug). */
export const CAREER_EMOJI: Record<string, string> = {
  derecho: '⚖️',
  abogacia: '⚖️',
  'administracion-de-empresas': '📊',
  administracion: '📊',
  'recursos-humanos': '👥',
  economia: '📈',
  finanzas: '💵',
  'contador-publico': '🧾',
  marketing: '📣',
  'relaciones-publicas': '🤝',
  'relaciones-internacionales': '🌐',
  'ciencias-politicas': '🏛️',
  'ingenieria-informatica': '💻',
  'ingenieria-en-informatica': '💻',
  'ingenieria-en-sistemas': '💻',
  'ingenieria-industrial': '🏭',
  'ingenieria-civil': '🏗️',
  'ingenieria-electronica': '🔌',
  'ingenieria-quimica': '⚗️',
  'ingenieria-en-petroleo': '🛢️',
  'licenciatura-en-analisis-de-negocios': '📉',
  ingenieria: '🛠️',
  arquitectura: '📐',
  'diseno-grafico': '🎨',
  'diseno-industrial': '🛋️',
  'diseno-de-indumentaria': '🧵',
  comunicacion: '📡',
  'comunicacion-social': '📰',
  psicologia: '🧠',
  medicina: '🩺',
  enfermeria: '💉',
  kinesiologia: '🦴',
  nutricion: '🥗',
  filosofia: '📜',
  teologia: '✝️',
  historia: '🏺',
  'ciencias-de-la-educacion': '🎓',
};
