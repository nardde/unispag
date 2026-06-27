import { createServerClient } from '@/lib/supabase-server';
import type { Profile } from '@/types';

/**
 * Returns the current auth user + their profile (with role), or nulls.
 * Safe to call in Server Components / Route Handlers.
 */
export async function getCurrentProfile(): Promise<{
  userId: string | null;
  email: string | null;
  emailVerified: boolean;
  profile: Profile | null;
}> {
  const empty = {
    userId: null,
    email: null,
    emailVerified: false,
    profile: null,
  };

  try {
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return empty;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return {
      userId: user.id,
      email: user.email ?? null,
      emailVerified: Boolean(user.email_confirmed_at),
      profile: (profile as Profile) ?? null,
    };
  } catch {
    // Missing env / transient error — degrade gracefully instead of crashing.
    return empty;
  }
}
