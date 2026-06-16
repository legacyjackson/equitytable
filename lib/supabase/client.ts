import { createBrowserClient } from '@supabase/ssr'

// Browser-side Supabase client.
// Safe to use in Client Components and hooks.
// Uses the publishable (anon) key — respects RLS.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
