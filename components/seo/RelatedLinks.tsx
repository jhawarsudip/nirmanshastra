import { Link } from '@/i18n/navigation'
import { relatedLinksFor } from '@/lib/seo/related'
import '@/styles/v2/freecalc.css'

// Related guides and glossary entries for a tool page. Plain server-rendered links, so they are in the
// delivered HTML for crawlers. Pure presentational: safe inside 'use client' pages.

export default function RelatedLinks({ path }: { path: string }) {
  const links = relatedLinksFor(path)
  if (links.length === 0) return null
  return (
    <nav aria-label="Related guides" data-related className="ns-plate ns-r-sec ns-calc-sec">
      <h2>Related guides</h2>
      <ul className="ns-i-rel">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href}><span>{l.label}</span><i aria-hidden="true">→</i></Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
