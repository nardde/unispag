'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/archivos', label: 'Archivos' },
  { href: '/admin/reportes', label: 'Reportes' },
  { href: '/admin/reportes-materias', label: 'Reportes de materias' },
  { href: '/admin/reportes-carreras', label: 'Reportes de carreras' },
  { href: '/admin/usuarios', label: 'Usuarios' },
  { href: '/admin/universidades', label: 'Universidades' },
  { href: '/admin/materias', label: 'Materias' },
  { href: '/admin/sugerencias-carreras', label: 'Sugerencias de carreras' },
  { href: '/admin/sugerencias-usuarios', label: 'Sugerencias de usuarios' },
  { href: '/admin/opiniones', label: 'Opiniones' },
];

export function AdminSidebar({ pendingReports }: { pendingReports: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:w-56 md:shrink-0 md:flex-col md:overflow-visible">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex shrink-0 items-center justify-between rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-surface text-ink'
                : 'text-subtle hover:bg-surface hover:text-ink'
            }`}
          >
            {link.label}
            {link.label === 'Reportes' && pendingReports > 0 && (
              <span className="ml-2 rounded-full bg-rose-600 px-1.5 text-[11px] font-semibold text-white">
                {pendingReports}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
