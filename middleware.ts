import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_PREFIXES = ['/app', '/admin', '/invite']

// Routes that super-admin users only can access
const ADMIN_PREFIXES = ['/admin']

// Routes that are always public
const PUBLIC_PATHS = [
  '/',
  '/pricing',
  '/how-it-works',
  '/table-types',
  '/equity-tables',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/callback',
  '/legal',
  '/events',
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — keeps the user logged in on long sessions
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Check if this path requires auth
  const requiresAuth = PROTECTED_PREFIXES.some(prefix =>
    pathname.startsWith(prefix)
  )

  // Redirect unauthenticated users to sign in
  if (requiresAuth && !user) {
    const redirectUrl = new URL('/auth/sign-in', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname.startsWith('/auth/sign-in') || pathname.startsWith('/auth/sign-up'))) {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  // Admin route protection — check platform_roles
  if (user && ADMIN_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    const { data: roleData } = await supabase
      .from('platform_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['super_admin', 'content_admin', 'support_admin'])
      .limit(1)
      .maybeSingle()

    if (!roleData) {
      // Not an admin — redirect to app
      return NextResponse.redirect(new URL('/app', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    // Match all paths except static files and Next internals
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
