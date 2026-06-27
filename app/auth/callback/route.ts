import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * Handles the email-confirmation / OAuth redirect by exchanging the `code`
 * query param for a session, then redirects to the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    try {
      const supabase = createServerClient();
      await supabase.auth.exchangeCodeForSession(code);
    } catch {
      return NextResponse.redirect(`${origin}/auth/login?error=auth`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
