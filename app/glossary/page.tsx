import Link from 'next/link'
import '@/styles/v2/results.css'
import JsonLd from '@/components/seo/JsonLd'
import { ToolHead, Note, IcArrow } from '@/components/v2/inner/kit'
import { breadcrumbSchema, glossarySchema } from '@/lib/seo/schema'
import { GLOSSARY, GLOSSARY_TERM_COUNT, GLOSSARY_UPDATED } from '@/lib/seo/glossary'
import { REVIEW_NOTE } from '@/lib/seo/site'

// Server component: every term and definition is in the delivered HTML. The data also feeds the DefinedTermSet JSON-LD.

const H2 = { fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 } as const
const groupId = (title: string) => `g-${title.replace(/[^a-z]+/gi, '-').toLowerCase()}`

const updatedLabel = new Date(`${GLOSSARY_UPDATED}T00:00:00Z`).toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export default function GlossaryPage() {
  const allTerms = GLOSSARY.flatMap((g) => g.terms).sort((a, b) => a.term.localeCompare(b.term))

  return (
    <div className="ns-i-page">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Glossary', path: '/glossary' },
          ]),
          glossarySchema(GLOSSARY, GLOSSARY_UPDATED),
        ]}
      />
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead
          eyebrow="Reference"
          name="Construction glossary"
          blurb={`${GLOSSARY_TERM_COUNT} terms you meet in a construction quote, a bill of quantities or an IS-code calculation, such as BOQ, M20 concrete, TMT bar, RA bill and LPCD. Each one is defined the way NirmanShastra’s calculators use it, with the same numbers and IS codes.`}
        />

        <p className="ns-r-tblnote">
          {REVIEW_NOTE} Last updated <time dateTime={GLOSSARY_UPDATED}>{updatedLabel}</time>.
        </p>

        <details className="ns-gl-jump">
          <summary><span>Jump to a term <span aria-hidden="true">({allTerms.length})</span></span></summary>
          <nav aria-label="All glossary terms" className="ns-faq-nav">
            {allTerms.map((t) => (
              <a key={t.id} href={`#${t.id}`} className="ns-i-pill">{t.term}</a>
            ))}
          </nav>
        </details>

        {GLOSSARY.map((g) => (
          <section key={g.title} className="ns-plate ns-r-sec ns-faq-sec" aria-labelledby={groupId(g.title)}>
            <h2 id={groupId(g.title)} style={H2}>{g.title}</h2>
            <p className="ns-r-sec__sub">{g.intro}</p>
            <div className="ns-gl">
              {g.terms.map((t) => (
                <article key={t.id} id={t.id} className="ns-gl__term">
                  <h3>{t.term}</h3>
                  <p>{t.definition}</p>
                  {t.links.length > 0 ? (
                    <p className="ns-gl__links">
                      {t.links.map((l) => (
                        <Link key={l.href} href={l.href}>{l.label} <IcArrow width={16} height={8} aria-hidden="true" /></Link>
                      ))}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}

        <Note kind="warn" title="A glossary is not a design">
          Definitions explain how the terms are used in NirmanShastra’s tools. They are not a substitute for the Indian Standards themselves or for a structural engineer’s design. See the <Link href="/is-codes-used" style={{ textDecoration: 'underline' }}>IS codes used</Link> page for the full list of standards.
        </Note>
      </div>
    </div>
  )
}
