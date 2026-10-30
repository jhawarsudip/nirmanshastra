import { useLocale } from 'next-intl'
import { pickQuick, type QuickContent } from '@/lib/seo/calc-content'
import '@/styles/v2/freecalc.css'

// Answer-first box for the free calculator pages. Rendered directly under the H1 so the first thing a
// reader (or an AI crawler) meets is the answer, with a real number and the IS code. Pure presentational:
// no client-only APIs, so it is safe inside 'use client' pages and still server-renders into the HTML.
// The words follow the page language (English at the plain address, Hindi under /hi).

export default function QuickAnswer({ content }: { content: QuickContent }) {
  const locale = useLocale()
  // the label follows the text: a box with no Hindi (a blog article) keeps its English label
  const hi = locale === 'hi' && !!content.hi
  const c = pickQuick(content, locale)
  return (
    <section aria-label={hi ? 'सीधा जवाब' : 'Quick answer'} data-quick-answer className="ns-plate ns-calc-qa">
      <p className="ns-calc-qa__k">{hi ? 'सीधा जवाब' : 'Quick answer'} · {c.question}</p>
      <p className="ns-calc-qa__t">{c.quickAnswer}</p>
    </section>
  )
}
