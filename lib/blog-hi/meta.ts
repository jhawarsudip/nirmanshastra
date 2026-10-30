import type { Metadata } from 'next'
import { getArticleBySlug } from '@/lib/blog-content'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import type { Locale } from '@/lib/i18n/paths'
import { BLOG_COPY, BLOG_INDEX_HI } from './copy'
import { viewArticle } from './pick'

/*
  Page metadata of the blog index and of one guide, in the page language.
  The English metadata is built exactly as before; localizeMetadata (lib/i18n/meta.ts) adds the en/hi pair and the /hi
  address once the blog is listed in lib/i18n/translated.ts, and on /hi swaps in the Hindi title and description
  (the Hindi edition's title and excerpt, or BLOG_INDEX_HI for the index).
*/

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const INDEX_TITLE = 'IS Code Guides: What the Indian Standards Say, in Plain English'
const INDEX_DESCRIPTION =
  'Plain-English guides to IS 456:2000, IS 1786:2008, IS 1893:2016 and more: what each standard fixes, which numbers it uses, and how to check a contractor’s quantities against them.'

const INDEX_BASE: Metadata = {
  title: INDEX_TITLE,
  description: INDEX_DESCRIPTION,
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'NirmanShastra',
    url: '/blog',
    title: `${INDEX_TITLE} | NirmanShastra`,
    description: INDEX_DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra: IS code guides' }],
  },
  twitter: { card: 'summary_large_image', title: `${INDEX_TITLE} | NirmanShastra`, description: INDEX_DESCRIPTION },
}

export function blogIndexMetadata(locale: Locale): Metadata {
  return localizeMetadata(INDEX_BASE, locale, '/blog', BLOG_INDEX_HI)
}

export function blogArticleMetadata(slug: string, locale: Locale): Metadata {
  const article = getArticleBySlug(slug)
  if (!article) return { title: BLOG_COPY[locale].notFoundTitle }
  const url = `/blog/${article.slug}`
  const ogTitle = `${article.title} | NirmanShastra`
  const base: Metadata = {
    // Root layout's title template appends " | NirmanShastra"; do not repeat it here.
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      locale: article.language === 'hi-Latn' ? 'hi_IN' : 'en_IN',
      siteName: 'NirmanShastra',
      url,
      title: ogTitle,
      description: article.excerpt,
      publishedTime: article.publishedDate,
      modifiedTime: article.updatedDate ?? article.publishedDate,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: article.excerpt,
    },
  }
  const view = viewArticle(article, locale)
  // A guide opened under /hi that has no Hindi edition yet is still the English article: it keeps its English words and
  // points search engines at the English address (the same rule lib/i18n/meta.ts applies to a page that is not Hindi-ready).
  if (locale === 'hi' && !view.hi) return base
  // The Hindi edition's title and excerpt, when it exists.
  const hi: HiMeta | undefined = view.hi ? { title: view.title, description: view.excerpt, imageAlt: view.title } : undefined
  return localizeMetadata(base, locale, url, hi)
}
