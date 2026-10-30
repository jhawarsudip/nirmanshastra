import { Link } from '@/i18n/navigation'
import { setRequestLocale } from 'next-intl/server'
import '@/styles/v2/results.css'
import { ToolHead, Note } from '@/components/v2/inner/kit'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbSchema, faqPageSchema } from '@/lib/seo/schema'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'
import { crumbs } from '@/lib/i18n/labels/pages-common'
import { FAQ_PAGE, FAQ_NOTE, faqFor } from '@/lib/i18n/labels/pages-faq'

// Server component: every question AND answer is in the delivered HTML (native <details>, so the
// answers are in the DOM even while collapsed). Each question is its own <h3> under a per-category <h2>,
// and the same data feeds the FAQPage JSON-LD and /llms-full.txt (English). On /hi the page, its FAQPage
// markup and its breadcrumb all read the Hindi questions and answers (lib/i18n/labels/pages-faq.ts).

const H2 = { fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 } as const

const anchorId = (code: string) => `faq-${code.toLowerCase()}`

export default async function FaqPage({ params }: LocaleParams) {
  const { locale: raw } = await params
  setRequestLocale(raw)
  const locale = asLocale(raw)
  const t = FAQ_PAGE[locale]
  const note = FAQ_NOTE[locale]
  const categories = faqFor(locale)
  const total = categories.reduce((n, c) => n + c.items.length, 0)
  const allItems = categories.flatMap((c) => c.items)

  return (
    <div className="ns-i-page">
      <JsonLd
        data={[
          breadcrumbSchema(crumbs(locale, 'FAQ', 'अक्सर पूछे जाने वाले सवाल', '/faq')),
          faqPageSchema(allItems),
        ]}
      />
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead
          eyebrow={t.eyebrow}
          name={t.name}
          // The English sentence stays here in the page (scripts/check-standards.ts reads it from this file); the Hindi one is in the labels.
          blurb={locale === 'hi' ? t.blurb(total) : `${total} answers on what NirmanShastra works out, how, and what it leaves out. The reports for homeowners give exact quantities, with no labour, dealer prices or contractor rates of ours; add your own rates if you want the rupees. The Excel toolkits for contractors work from the rates you enter.`}
        />

        <nav aria-label={t.navAria} className="ns-faq-nav">
          {categories.map((c) => (
            <a key={c.code} href={`#${anchorId(c.code)}`} className="ns-i-pill">
              {c.label} <span aria-hidden="true">({c.items.length})</span>
            </a>
          ))}
        </nav>

        {categories.map((c) => (
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

        <Note title={t.noteTitle}>
          {note.a}<Link href="/contact" style={{ textDecoration: 'underline' }}>{note.contact}</Link>{note.b}<Link href="/blog" style={{ textDecoration: 'underline' }}>{note.blog}</Link>{note.c}<Link href="/is-codes-used" style={{ textDecoration: 'underline' }}>{note.codes}</Link>{note.d}
        </Note>
      </div>
    </div>
  )
}
