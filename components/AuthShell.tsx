import Link from 'next/link';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-[400px]">
        <Link
          href="/"
          className="mx-auto mb-6 flex w-fit items-center gap-2"
          aria-label="UniPag"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="UniPag"
            className="h-9 w-9 rounded-[9px] object-cover"
          />
          <span className="text-lg font-semibold tracking-tight text-ink">
            UniPag
          </span>
        </Link>
        <div className="card animate-fade-in p-8">
          <h1 className="text-center text-[22px] font-semibold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-1 text-center text-sm text-subtle">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
        <div className="mt-5 text-center text-sm text-subtle">{footer}</div>
      </div>
    </div>
  );
}

/** Floating-label text input. */
export function FloatingInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  maxLength,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  maxLength?: number;
}) {
  return (
    <div className="float-field">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder=" "
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}
