import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import '@/styles/v2/results.css'
import '@/styles/v2/content.css'
import { BLOG_ARTICLES } from '@/lib/blog-content'
import JsonLd from '@/components/seo/JsonLd'
import { ToolHead } from '@/components/v2/inner/kit'
import ArticleCard from './ArticleCard'
import { CalcCta } from '@/components/v2/inner/calc'
import { REVIEW_NOTE } from '@/lib/seo/site'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'
import { REVIEW_NOTE_HI } from '@/lib/i18n/labels/pages-common'
import { blogIndexJsonLd } from '@/lib/i18n/labels/blog-jsonld'
import { BLOG_COPY } from '@/lib/blog-hi/copy'
import { blogIndexMetadata } from '@/lib/blog-hi/meta'
import { viewArticle } from '@/lib/blog-hi/pick'

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return blogIndexMetadata(asLocale(locale))
}

export default async function BlogPage({ params }: LocaleParams) {
  const { locale: raw } = await params
  setRequestLocale(raw)
  const locale = asLocale(raw)
  const c = BLOG_COPY[locale]
  // the Hindi edition of each guide where one exists, else the English guide (see lib/blog-hi/pick.ts)
  const articles = BLOG_ARTICLES.map((a) => viewArticle(a, locale))

  return (
    <div className="ns-i-page">
      <JsonLd data={blogIndexJsonLd(locale, articles)} />
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead eyebrow={c.eyebrow} name={c.name} blurb={c.blurb(BLOG_ARTICLES.length)} />
        <p className="ns-r-tblnote">{locale === 'hi' ? REVIEW_NOTE_HI : REVIEW_NOTE}</p>

        <div className="ns-bl-grid">
          {articles.map((a) => (
            <ArticleCard key={a.slug} article={a} locale={locale} />
          ))}
        </div>

        <CalcCta kicker={c.indexCta.kicker} text={c.indexCta.text} href="/tools/structopro" label={c.indexCta.label} />
      </div>
    </div>
  )
}
