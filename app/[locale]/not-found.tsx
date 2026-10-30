import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import NotFoundView from '@/components/v2/inner/NotFoundView'
import { asLocale } from '@/lib/i18n/paths'

export async function generateMetadata(): Promise<Metadata> {
  const locale = asLocale(await getLocale())
  return {
    title: locale === 'hi' ? 'पेज नहीं मिला' : 'Page not found',
    robots: { index: false, follow: false },
  }
}

// A missing page under /hi/... answers in Hindi, a missing page under a plain address in English.
export default async function LocaleNotFound() {
  const locale = asLocale(await getLocale())
  return <NotFoundView locale={locale} />
}
