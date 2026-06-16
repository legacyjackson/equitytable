import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles Supabase's email confirmation and OAuth redirects
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if onboarding is complete
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        if (!profile?.onboarding_completed) {
          return NextResponse.redirect(`${origin}/app/onboarding`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth error — redirect to sign-in with error message
  return NextResponse.redirect(`${origin}/auth/sign-in?error=auth_callback_failed`)
}
