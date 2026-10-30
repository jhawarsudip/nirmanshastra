import { articleSchema, blogIndexSchema, breadcrumbSchema, faqPageSchema } from '@/lib/seo/schema'
import { abs } from '@/lib/seo/site'
import { localizePath, type Locale } from '@/lib/i18n/paths'
import { BLOG_COPY } from '@/lib/blog-hi/copy'
import type { ArticleView } from '@/lib/blog-hi/pick'

type Json = Record<string, unknown>

/**
 * Structured data of the blog index and of one guide.
 *
 * English is exactly what lib/seo/schema.ts builds (the same calls the pages made before they were bilingual).
 * On /hi, a guide that has its Hindi edition gets the same nodes with the words in Hindi, the language tag hi-IN and the
 * /hi addresses; the Article, the BreadcrumbList and the FAQPage are built from the very text the page shows, so markup
 * and page cannot drift apart. A guide still shown in English on /hi keeps its English nodes. lib/seo/schema.ts is not touched.
 */

/** The Hindi of ORG_REVIEW_DESCRIPTION (lib/seo/site.ts): same claims, nothing added. */
const ORG_REVIEW_DESCRIPTION_HI =
  'एक सिविल इंजीनियर (B.Tech सिविल, NIT) द्वारा लिखा गया, बजट और मात्रा की जाँच के लिए; स्ट्रक्चरल डिज़ाइन के लिए फिर भी लाइसेंस प्राप्त इंजीनियर चाहिए। मात्राएँ प्रयुक्त IS कोड पेज पर दिए भारतीय मानकों के अनुसार हैं, और हर रिपोर्ट बताती है कि वह क्या नहीं जाँच सकी।'

const hiPath = (path: string) => localizePath(path, 'hi')

export function blogIndexJsonLd(locale: Locale, articles: ArticleView[]): Json[] {
  if (locale !== 'hi') {
    return [
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
      ]),
      blogIndexSchema(articles),
    ]
  }
  const c = BLOG_COPY.hi
  const index = blogIndexSchema(articles) as Json
  const main = index.mainEntity as Json
  const items = main.itemListElement as { url: string; name: string }[]
  return [
    breadcrumbSchema([
      { name: c.crumbHome, path: hiPath('/') },
      { name: c.crumbBlog, path: hiPath('/blog') },
    ]),
    {
      ...index,
      name: c.indexSchemaName,
      url: abs(hiPath('/blog')),
      inLanguage: 'hi-IN',
      mainEntity: {
        ...main,
        itemListElement: items.map((it, i) => {
          const a = articles[i]
          // an article still in English keeps its English address and name
          return a.hi ? { ...it, url: abs(hiPath(`/blog/${a.slug}`)), name: a.title } : it
        }),
      },
    },
  ]
}

export function articleJsonLd(locale: Locale, article: ArticleView): Json[] {
  const faq = article.faq?.length ? [faqPageSchema(article.faq)] : []
  if (locale !== 'hi' || !article.hi) {
    return [
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: article.title, path: `/blog/${article.slug}` },
      ]),
      articleSchema(article),
      ...faq,
    ]
  }
  const c = BLOG_COPY.hi
  const path = hiPath(`/blog/${article.slug}`)
  const url = abs(path)
  const base = articleSchema(article) as Json
  return [
    breadcrumbSchema([
      { name: c.crumbHome, path: hiPath('/') },
      { name: c.crumbBlog, path: hiPath('/blog') },
      { name: article.title, path },
    ]),
    {
      ...base,
      '@id': `${url}#article`,
      url,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      inLanguage: 'hi-IN',
      author: { ...(base.author as Json), description: ORG_REVIEW_DESCRIPTION_HI },
    },
    ...faq,
  ]
}
