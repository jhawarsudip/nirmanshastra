/**
 * Language and path helpers that work anywhere (server, client, middleware, scripts).
 * English has no prefix; Hindi lives under /hi.
 */
export type Locale = 'en' | 'hi'
export const LOCALES: readonly Locale[] = ['en', 'hi']

/** "/hi/tools/x" -> "hi"; everything else -> "en". */
export function localeFromPath(pathname: string): Locale {
  return pathname === '/hi' || pathname.startsWith('/hi/') ? 'hi' : 'en'
}

/** "/hi/tools/x" -> "/tools/x"; "/hi" -> "/"; paths without the prefix are returned unchanged. */
export function stripLocale(pathname: string): string {
  if (pathname === '/hi') return '/'
  return pathname.startsWith('/hi/') ? pathname.slice(3) : pathname
}

/** "/tools/x" + "hi" -> "/hi/tools/x"; "/" + "hi" -> "/hi"; English is returned unchanged. */
export function localizePath(path: string, locale: Locale): string {
  if (locale === 'en') return path
  if (path === '/') return '/hi'
  return `/hi${path.startsWith('/') ? path : `/${path}`}`
}

/** Pages that exist in both languages need the pair declared to search engines. */
export function languageAlternates(path: string): Record<string, string> {
  return { 'en-IN': path, 'hi-IN': localizePath(path, 'hi'), 'x-default': path }
}

/** Route params as Next hands them to a layout or page under app/[locale]. */
export type LocaleParams = { params: Promise<{ locale: string }> }

/** Anything that is not Hindi is English (the layout under app/[locale] has already 404'd unknown languages). */
export function asLocale(value: string | undefined): Locale {
  return value === 'hi' ? 'hi' : 'en'
}
