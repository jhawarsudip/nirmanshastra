import Link from 'next/link'
import '@/styles/v2/results.css'
import { ToolHead, Note } from '@/components/v2/inner/kit'
import { FAQ_CATEGORIES } from '@/lib/faq-data'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbSchema, faqPageSchema } from '@/lib/seo/schema'

// Server component: every question AND answer is in the delivered HTML (native <details>, so the
// answers are in the DOM even while collapsed). Each question is its own <h3> under a per-category <h2>,
// and the same data feeds the FAQPage JSON-LD and /llms-full.txt.

const H2 = { fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 } as const

const anchorId = (code: string) => `faq-${code.toLowerCase()}`

export default function FaqPage() {
  const total = FAQ_CATEGORIES.reduce((n, c) => n + c.items.length, 0)
  const allItems = FAQ_CATEGORIES.flatMap((c) => c.items)

  return (
    <div className="ns-i-page">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'FAQ', path: '/faq' },
          ]),
          faqPageSchema(allItems),
        ]}
      />
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead
          eyebrow="Questions"
          name="Questions and answers"
          blurb={`${total} answers on what NirmanShastra works out, how, and what it leaves out. The reports for homeowners give exact quantities, with no labour, dealer prices or contractor rates of ours; add your own rates if you want the rupees. The Excel toolkits for contractors work from the rates you enter.`}
        />

        <nav aria-label="FAQ categories" className="ns-faq-nav">
          {FAQ_CATEGORIES.map((c) => (
            <a key={c.code} href={`#${anchorId(c.code)}`} className="ns-i-pill">
              {c.label} <span aria-hidden="true">({c.items.length})</span>
            </a>
          ))}
        </nav>

        {FAQ_CATEGORIES.map((c) => (
          <section key={c.code} id={anchorId(c.code)} className="ns-plate ns-r-sec ns-faq-sec" aria-labelledby={`${anchorId(c.code)}-h`}>
            <h2 id={`${anchorId(c.code)}-h`} style={H2}>{c.label}</h2>
            <div className="ns-i-faq">
              {c.items.map((item) => (
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
        ))}

        <Note title="Something not covered here?">
          Ask the construction advisor in the corner of any tool page, or write to us from the <Link href="/contact" style={{ textDecoration: 'underline' }}>contact page</Link>. Plain-English articles on IS 456, IS 1786 and seismic zones are on the <Link href="/blog" style={{ textDecoration: 'underline' }}>blog</Link>, and every source behind the numbers is on the <Link href="/is-codes-used" style={{ textDecoration: 'underline' }}>IS Codes Used</Link> page.
        </Note>
      </div>
    </div>
  )
}
