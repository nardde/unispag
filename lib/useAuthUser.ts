'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';

// Module-level singleton so many components share one auth subscription.
let current: User | null = null;
let loaded = false;
let started = false;
const listeners = new Set<(u: User | null) => void>();

function start() {
  if (started) return;
  started = true;
  const supabase = createClient();
  supabase.auth.getUser().then(({ data }) => {
    current = data.user ?? null;
    loaded = true;
    listeners.forEach((l) => l(current));
  });
  supabase.auth.onAuthStateChange((_e, session) => {
    current = session?.user ?? null;
    loaded = true;
    listeners.forEach((l) => l(current));
  });
}

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(current);
  const [ready, setReady] = useState(loaded);

  useEffect(() => {
    start();
    const l = (u: User | null) => {
      setUser(u);
      setReady(true);
    };
    listeners.add(l);
    if (loaded) {
      setUser(current);
      setReady(true);
    }
    return () => {
      listeners.delete(l);
    };
  }, []);

  return {
    user,
    verified: Boolean(user?.email_confirmed_at),
    loading: !ready,
  };
}
