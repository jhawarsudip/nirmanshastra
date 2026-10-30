import { getRelatedArticles, type BlogArticle } from '@/lib/blog-content'
import type { Locale } from '@/lib/i18n/paths'
import { BLOG_HI } from './index'

/**
 * An article as one language shows it. `hi` is true when the text is the Hindi edition (lib/blog-hi/articles-*.ts);
 * on /hi an article with no Hindi edition yet is shown as the English article, unchanged, with `hi: false`.
 * Everything that is not words (slug, dates, read time, related slugs) comes from the English record.
 */
export type ArticleView = BlogArticle & { hi: boolean }

export function viewArticle(a: BlogArticle, locale: Locale): ArticleView {
  const h = locale === 'hi' ? BLOG_HI[a.slug] : undefined
  if (!h) return { ...a, hi: false }
  return {
    ...a,
    title: h.title,
    excerpt: h.excerpt,
    category: h.category,
    quickAnswer: h.quickAnswer ?? a.quickAnswer,
    faq: h.faq ?? a.faq,
    content: h.content,
    // the Hindi edition is Devanagari, not the Roman-letter Hindi of the English site's post
    language: undefined,
    hi: true,
  }
}

export function viewRelated(a: BlogArticle, locale: Locale): ArticleView[] {
  return getRelatedArticles(a).map((r) => viewArticle(r, locale))
}
