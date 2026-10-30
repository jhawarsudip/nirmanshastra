import { useLocale } from 'next-intl'
import { pickFaq, type CalcFaqBi } from '@/lib/seo/calc-content'
import '@/styles/v2/freecalc.css'

// Visible FAQ for the free calculator pages. Native <details>, so every answer is in the delivered HTML even
// while collapsed. The same items feed the FAQPage JSON-LD (lib/seo/schema.ts), so markup and page text cannot
// drift apart. Pure presentational: safe inside 'use client' pages. The questions and answers follow the page
// language (each item carries its Hindi beside the English).

export default function CalcFaq({
  items,
  heading,
}: {
  items: CalcFaqBi[]
  heading?: string
}) {
  const locale = useLocale()
  const shown = pickFaq(items, locale)
  return (
    <section data-faq className="ns-plate ns-r-sec ns-calc-sec">
      <h2>{heading ?? (locale === 'hi' ? 'अक्सर पूछे जाने वाले सवाल' : 'Frequently asked questions')}</h2>
      <div className="ns-i-faq">
        {shown.map((item) => (
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
