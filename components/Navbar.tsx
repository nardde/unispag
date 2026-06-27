'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { ChevronIcon } from '@/components/icons';

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  }

  return (
    <header className="glass sticky top-0 z-30 border-b border-black/[0.06]">
      <nav className="container-page flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-brand-500 text-[13px] font-bold text-white">
            U
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-ink">
            UniFiles
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-full bg-surface" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {(user.email ?? '?')[0].toUpperCase()}
                </span>
                <span className="hidden max-w-[11rem] truncate text-sm text-ink/80 sm:block">
                  {user.email}
                </span>
                <ChevronIcon className="h-4 w-4 text-subtle" />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-52 origin-top-right animate-scale-in overflow-hidden rounded-2xl bg-white p-1.5 shadow-apple-lg ring-1 ring-black/[0.06]">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-3 py-2 text-sm text-ink hover:bg-surface"
                    >
                      Mi perfil
                    </Link>
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
              <Link href="/auth/login" className="btn-ghost">
                Iniciar sesión
              </Link>
              <Link href="/auth/signup" className="btn-primary">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
