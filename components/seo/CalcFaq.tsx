import type { CalcFaq as CalcFaqItem } from '@/lib/seo/calc-content'
import '@/styles/v2/freecalc.css'

// Visible FAQ for the free calculator pages. Native <details>, so every answer is in the delivered HTML even
// while collapsed. The same items feed the FAQPage JSON-LD (lib/seo/schema.ts), so markup and page text cannot
// drift apart. Pure presentational: safe inside 'use client' pages.

export default function CalcFaq({
  items,
  heading = 'Frequently asked questions',
}: {
  items: CalcFaqItem[]
  heading?: string
}) {
  return (
    <section data-faq className="ns-plate ns-r-sec ns-calc-sec">
      <h2>{heading}</h2>
      <div className="ns-i-faq">
        {items.map((item) => (
          <details key={item.question} className="ns-i-faq__item">
            <summary>
              <h3>{item.question}</h3>
              <span className="ns-i-faq__plus" aria-hidden="true" />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
