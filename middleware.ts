import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const handleI18n = createIntlMiddleware(routing)

// Tool pages are deliberately NOT gated: they must render for logged-out
// visitors and for search crawlers. A session is created silently at the
// registration step instead (see lib/supabase/ensure-session.ts).
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Apply i18n routing only for the homepage (/ and /hi).
  // Tool pages stay at their exact current URLs — completely outside locale routing.
  if (pathname === '/' || pathname === '/hi') {
    return handleI18n(request)
  }

  // Supabase auth middleware for all other routes
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isReports = pathname.startsWith('/reports')

  if (isReports && !user) {
    const redirectUrl = new URL('/auth', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
