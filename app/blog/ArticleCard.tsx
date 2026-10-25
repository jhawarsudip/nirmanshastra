import Link from 'next/link'
import { IcArrow } from '@/components/v2/inner/kit'
import type { BlogArticle } from '@/lib/blog-content'

const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** One guide in the blog index and in "Related guides". A server component: the whole card is a link, no script needed. */
export default function ArticleCard({ article: a }: { article: BlogArticle }) {
  return (
    <Link href={`/blog/${a.slug}`} className="ns-plate ns-bl-card">
      <div className="ns-bl-card__top">
        <span className="ns-i-pill">{a.category}</span>
        {a.language === 'hi-Latn' ? <span className="ns-i-pill">Hinglish</span> : null}
        <span className="ns-bl-card__mins">{a.readTime} min read</span>
      </div>
      <h2>{a.title}</h2>
      <p>{a.excerpt}</p>
      <div className="ns-bl-card__foot">
        <span>{fmt(a.updatedDate ?? a.publishedDate)}</span>
        <span className="ns-bl-card__go">Read <IcArrow width={20} height={10} aria-hidden="true" /></span>
      </div>
    </Link>
  )
}
