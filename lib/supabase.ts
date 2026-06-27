/**
 * Browser Supabase client — safe to import from Client Components.
 *
 * For Server Components / Route Handlers use `@/lib/supabase-server` instead
 * (it depends on `next/headers`, which cannot be imported into client code).
 */
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Browser client for use inside Client Components. */
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Copy .env.local.example to .env.local and fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
