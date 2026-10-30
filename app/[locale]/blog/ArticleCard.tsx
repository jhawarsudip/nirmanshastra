import { Link } from '@/i18n/navigation'
import { IcArrow } from '@/components/v2/inner/kit'
import type { Locale } from '@/lib/i18n/paths'
import { BLOG_COPY, shortDate } from '@/lib/blog-hi/copy'
import type { ArticleView } from '@/lib/blog-hi/pick'

/** One guide in the blog index and in "Related guides". A server component: the whole card is a link, no script needed. */
export default function ArticleCard({ article: a, locale = 'en' }: { article: ArticleView; locale?: Locale }) {
  const c = BLOG_COPY[locale]
  // On /hi an article that has no Hindi edition yet is shown in its own language, and its words are marked so
  // (the labels around them stay Hindi). The English site never sets this.
  const missing = locale === 'hi' && !a.hi
  const textLang = missing ? (a.language === 'hi-Latn' ? 'hi-Latn' : 'en') : undefined
  // Devanagari month names are long: keep each date in one piece so the year is not left alone on a second line (English is untouched)
  const keep = locale === 'hi' ? { whiteSpace: 'nowrap' as const } : undefined
  return (
    <Link href={`/blog/${a.slug}`} className="ns-plate ns-bl-card" data-hi-missing={missing ? '1' : undefined}>
      <div className="ns-bl-card__top">
        <span className="ns-i-pill" lang={textLang}>{a.category}</span>
        {a.language === 'hi-Latn' ? <span className="ns-i-pill">{c.hinglish}</span> : null}
        <span className="ns-bl-card__mins">{c.minRead(a.readTime)}</span>
      </div>
      <h2 lang={textLang}>{a.title}</h2>
      <p lang={textLang}>{a.excerpt}</p>
      <div className="ns-bl-card__foot">
        <span className="ns-bl-card__dates">
          <time dateTime={a.publishedDate} style={keep}>{shortDate(a.publishedDate, locale)}</time>
          {a.updatedDate ? <> · <span style={keep}>{`${c.updated} `}<time dateTime={a.updatedDate}>{shortDate(a.updatedDate, locale)}</time></span></> : null}
        </span>
        <span className="ns-bl-card__go">{c.read} <IcArrow width={20} height={10} aria-hidden="true" /></span>
      </div>
    </Link>
  )
}
