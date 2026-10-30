import type { Metadata } from 'next'
import { languageAlternates, localizePath, type Locale } from './paths'
import { isHindiReady } from './translated'

/**
 * Per-language page metadata.
 *
 * Each page frame keeps its English `metadata` object exactly as written and passes it through here.
 * English gets the canonical URL and the en/hi alternates. Hindi gets its own canonical URL (/hi/...),
 * the same alternates, og:locale hi_IN, and the Hindi title and description if the page supplies them.
 * A Hindi page that has not been given a title yet keeps the English one: the page is still correct,
 * the heading just reads English until the copy is added.
 *
 * Private pages (robots index:false) get no alternates: there is nothing for a search engine to match.
 */
export type HiMeta = {
  /** Page title. The root layout's template adds " | NirmanShastra". */
  title?: string
  description?: string
  /** Alt text of the share image. */
  imageAlt?: string
}

const BRAND = 'NirmanShastra'

function titleText(t: Metadata['title']): string | undefined {
  if (!t) return undefined
  if (typeof t === 'string') return t
  if ('absolute' in t && t.absolute) return t.absolute
  if ('default' in t && t.default) return t.default
  return undefined
}

export function localizeMetadata(base: Metadata, locale: Locale, path: string, hi?: HiMeta): Metadata {
  const isPrivate = typeof base.robots === 'object' && base.robots !== null && 'index' in base.robots && base.robots.index === false
  const paired = !isPrivate && isHindiReady(path)

  // Only a page with real Hindi text claims a Hindi twin. A page opened under /hi that is still English
  // points search engines at the English address instead (see lib/i18n/translated.ts).
  if (locale === 'en') {
    return { ...base, alternates: paired ? { canonical: path, languages: languageAlternates(path) } : { canonical: path } }
  }
  if (!isHindiReady(path)) return { ...base, alternates: { canonical: path } }
  const alternates: Metadata['alternates'] = paired
    ? { canonical: localizePath(path, 'hi'), languages: languageAlternates(path) }
    : { canonical: localizePath(path, 'hi') }

  // Hindi: replace the words, keep everything else (robots, image, structure) as the English page has it.
  let title: Metadata['title'] = base.title
  const hiTitle = hi?.title
  if (hiTitle) {
    title = typeof base.title === 'object' && base.title && 'template' in base.title
      ? { ...base.title, default: hiTitle }
      : hiTitle
  }
  const description = hi?.description ?? base.description ?? undefined
  const shownTitle = hiTitle ?? titleText(base.title)
  const ogImages = base.openGraph?.images
    ? (Array.isArray(base.openGraph.images) ? base.openGraph.images : [base.openGraph.images]).map(img =>
        hi?.imageAlt && typeof img === 'object' && !(img instanceof URL) && 'url' in img ? { ...img, alt: hi.imageAlt } : img)
    : undefined

  return {
    ...base,
    title,
    description,
    alternates,
    openGraph: base.openGraph && {
      ...base.openGraph,
      locale: 'hi_IN',
      alternateLocale: ['en_IN'],
      url: localizePath(path, 'hi'),
      title: shownTitle ? `${shownTitle} | ${BRAND}` : base.openGraph.title,
      description,
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: base.twitter && {
      ...base.twitter,
      title: shownTitle ? `${shownTitle} | ${BRAND}` : base.twitter.title,
      description,
    },
  }
}
