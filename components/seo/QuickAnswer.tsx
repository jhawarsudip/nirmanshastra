import type { CalcContent } from '@/lib/seo/calc-content'
import '@/styles/v2/freecalc.css'

// Answer-first box for the free calculator pages. Rendered directly under the H1 so the first thing a
// reader (or an AI crawler) meets is the answer, with a real number and the IS code. Pure presentational:
// no hooks, no client APIs, so it is safe inside 'use client' pages and still server-renders into the HTML.

export default function QuickAnswer({ content }: { content: Pick<CalcContent, 'question' | 'quickAnswer'> }) {
  return (
    <section aria-label="Quick answer" data-quick-answer className="ns-plate ns-calc-qa">
      <p className="ns-calc-qa__k">Quick answer · {content.question}</p>
      <p className="ns-calc-qa__t">{content.quickAnswer}</p>
    </section>
  )
}
