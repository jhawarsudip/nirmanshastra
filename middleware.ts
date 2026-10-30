import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { localeFromPath, localizePath, stripLocale } from './lib/i18n/paths'

const handleI18n = createIntlMiddleware(routing)

/**
 * Every page lives under a language: English at its plain address (/about), Hindi under /hi (/hi/about).
 * The i18n middleware does the language routing for page addresses only. These are NOT pages and have no
 * language: the API, the admin screen, and any file or metadata route (anything with a dot: sitemap.xml,
 * robots.txt, llms.txt, manifest.webmanifest, sw.js, images, PDFs).
 */
function isPagePath(pathname: string): boolean {
  if (pathname === '/api' || pathname.startsWith('/api/')) return false
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return false
  if (/\.[A-Za-z0-9]+$/.test(pathname)) return false
  return true
}

// Tool pages are deliberately NOT gated: they must render for logged-out
// visitors and for search crawlers. A session is created silently at the
// registration step instead (see lib/supabase/ensure-session.ts).
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // The home pages (/ and /hi) need no sign-in check: language routing only, as before.
  if (pathname === '/' || pathname === '/hi') return handleI18n(request)

  const page = isPagePath(pathname)

  // Supabase auth middleware: refresh the session cookie on every request, as before.
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

  // /reports and /hi/reports are gated; the visitor is sent to the sign-in page in the same language and
  // comes back to the same page afterwards. The "redirect" value is a plain path with no language prefix.
  const locale = localeFromPath(pathname)
  const barePath = stripLocale(pathname)
  const isReports = barePath === '/reports' || barePath.startsWith('/reports/')

  if (isReports && !user) {
    const redirectUrl = new URL(localizePath('/auth', locale), request.url)
    redirectUrl.searchParams.set('redirect', barePath)
    return NextResponse.redirect(redirectUrl)
  }

  if (!page) return supabaseResponse

  // Page address: language routing (/about stays English, /hi/about is Hindi, /en/about -> /about),
  // then carry any refreshed session cookies over onto that response.
  const intlResponse = handleI18n(request)
  supabaseResponse.cookies.getAll().forEach(cookie => intlResponse.cookies.set(cookie))
  return intlResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)',
  ],
}
