'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuthUser } from '@/lib/useAuthUser';
import { GlobalSearch } from '@/components/GlobalSearch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { ChevronIcon } from '@/components/icons';

export function Navbar() {
  const router = useRouter();
  const { user, loading } = useAuthUser();
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string>('user');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setUsername(null);
      setRole('user');
      return;
    }
    createClient()
      .from('profiles')
      .select('username, role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setUsername(data.username);
          setRole(data.role ?? 'user');
        }
      });
  }, [user]);

  async function handleLogout() {
    await createClient().auth.signOut();
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  }

  return (
    <header className="glass sticky top-0 z-30 border-b border-black/[0.06] dark:border-white/[0.08]">
      <nav className="container-page flex h-14 items-center gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="UniFiles"
            className="h-8 w-8 rounded-[8px] object-cover"
          />
          <span className="hidden text-[17px] font-semibold tracking-tight text-ink sm:block">
            UniFiles
          </span>
        </Link>

        <div className="flex flex-1 justify-center">
          <GlobalSearch />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          {user && <NotificationBell />}

          {loading ? (
            <div className="ml-1 h-8 w-8 animate-pulse rounded-full bg-surface" />
          ) : user ? (
            <div className="relative ml-1">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1 rounded-full py-1 pl-1 pr-1.5 transition-colors hover:bg-surface"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/60 dark:text-brand-200">
                  {(username ?? user.email ?? '?')[0].toUpperCase()}
                </span>
                <ChevronIcon className="h-4 w-4 text-subtle" />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-56 origin-top-right animate-scale-in overflow-hidden rounded-2xl bg-card p-1.5 shadow-apple-lg ring-1 ring-black/[0.06] dark:ring-white/[0.08]">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold text-ink">
                        {username ? `@${username}` : 'Mi cuenta'}
                      </p>
                      <p className="truncate text-xs text-subtle">{user.email}</p>
                    </div>
                    <div className="my-1 h-px bg-hairline/60" />
                    {username && (
                      <Link
                        href={`/profile/${username}`}
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-xl px-3 py-2 text-sm text-ink hover:bg-surface"
                      >
                        Mi perfil
                      </Link>
                    )}
                    {role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-xl px-3 py-2 text-sm font-medium text-brand-500 hover:bg-surface"
                      >
                        Panel de admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm text-ink hover:bg-surface"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost hidden sm:inline-flex">
                Iniciar sesión
              </Link>
              <Link href="/auth/signup" className="btn-primary ml-1">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
