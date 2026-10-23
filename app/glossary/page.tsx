import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbSchema, glossarySchema } from '@/lib/seo/schema'
import { GLOSSARY, GLOSSARY_TERM_COUNT, GLOSSARY_UPDATED } from '@/lib/seo/glossary'
import { REVIEW_NOTE } from '@/lib/seo/site'

const title = `Construction Glossary: ${GLOSSARY_TERM_COUNT} Terms from BOQ to TMT`
const description =
  'Plain-English definitions of BOQ, M20, IS 456, TMT, BBS, RA bill, retention, LPCD, RCCB, earned value and more, with the IS code and the number each one uses.'
const url = '/glossary'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'NirmanShastra',
    url,
    title: `${title} | NirmanShastra`,
    description,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NirmanShastra construction glossary',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} | NirmanShastra`,
    description,
  },
}

const MONO = 'var(--font-plex-mono)'
const SANS = 'var(--font-plex-sans)'
const SERIF = 'var(--font-plex-serif)'
const INK = '#1E2227'
const BLUEPRINT = '#1F4E79'

const updatedLabel = new Date(`${GLOSSARY_UPDATED}T00:00:00Z`).toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export default function GlossaryPage() {
  const allTerms = GLOSSARY.flatMap((g) => g.terms).sort((a, b) => a.term.localeCompare(b.term))

  return (
    <main className="sheet-frame min-h-screen" style={{ background: '#F4F4F0' }}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Glossary', path: '/glossary' },
          ]),
          glossarySchema(GLOSSARY, GLOSSARY_UPDATED),
        ]}
      />

      {/* Header band */}
      <div style={{ background: BLUEPRINT, borderBottom: '1px solid rgba(244,244,240,0.1)' }}>
        <div className="px-6 md:px-16 lg:px-24 py-16">
          <p style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(244,244,240,0.6)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 12 }}>
            REFERENCE · GLOSSARY
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(34px,5vw,54px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1.1 }}>
            Construction Glossary
          </h1>
          <p style={{ fontFamily: MONO, fontSize: 14, color: 'rgba(244,244,240,0.65)', marginTop: 16, letterSpacing: '0.04em' }}>
            {GLOSSARY_TERM_COUNT} terms · defined the way NirmanShastra’s calculators use them
          </p>
        </div>
      </div>

      {/* Answer-first intro */}
      <div style={{ background: INK, borderBottom: '1px solid rgba(244,244,240,0.08)' }}>
        <div className="px-6 md:px-16 lg:px-24 py-8">
          <p style={{ fontFamily: SANS, fontSize: 16, color: 'rgba(244,244,240,0.8)', lineHeight: 1.7, maxWidth: 760 }}>
            This glossary explains the {GLOSSARY_TERM_COUNT} terms you meet in a construction quote, a bill of quantities or an IS-code
            calculation, such as BOQ, M20 concrete, TMT bar, RA bill and LPCD. Each definition uses the same numbers and IS codes
            that the NirmanShastra calculators apply.
          </p>
          <p style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(244,244,240,0.5)', letterSpacing: '0.05em', marginTop: 14 }}>
            {REVIEW_NOTE} Last updated <time dateTime={GLOSSARY_UPDATED}>{updatedLabel}</time>.
          </p>
        </div>
      </div>

      <section className="py-14">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          {/* Jump list */}
          <nav aria-label="All glossary terms" style={{ marginBottom: 56 }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(30,34,39,0.5)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 12 }}>
              Jump to a term
            </p>
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
              {allTerms.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    style={{ fontFamily: SANS, fontSize: 13, color: BLUEPRINT, border: '1px solid rgba(31,78,121,0.3)', padding: '4px 10px', textDecoration: 'none', display: 'inline-block' }}
                  >
                    {t.term}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
            {GLOSSARY.map((g) => (
              <section key={g.title} aria-labelledby={`g-${g.title.replace(/[^a-z]+/gi, '-').toLowerCase()}`}>
                <div style={{ paddingBottom: 14, borderBottom: `2px solid ${INK}`, marginBottom: 8 }}>
                  <h2
                    id={`g-${g.title.replace(/[^a-z]+/gi, '-').toLowerCase()}`}
                    style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: INK, lineHeight: 1.2 }}
                  >
                    {g.title}
                  </h2>
                  <p style={{ fontFamily: SANS, fontSize: 14, color: 'rgba(30,34,39,0.6)', marginTop: 4 }}>{g.intro}</p>
                </div>

                {g.terms.map((t) => (
                  <article
                    key={t.id}
                    id={t.id}
                    style={{ padding: '20px 0', borderBottom: '1px solid rgba(30,34,39,0.1)', scrollMarginTop: 90 }}
                  >
                    <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: INK, lineHeight: 1.3, marginBottom: 6 }}>{t.term}</h3>
                    <p style={{ fontFamily: SANS, fontSize: 15.5, color: 'rgba(30,34,39,0.85)', lineHeight: 1.75, maxWidth: 720 }}>{t.definition}</p>
                    {t.links.length > 0 && (
                      <p style={{ fontFamily: SANS, fontSize: 14, marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: '4px 18px' }}>
                        {t.links.map((l) => (
                          <Link key={l.href} href={l.href} style={{ color: BLUEPRINT, textDecoration: 'underline' }}>
                            {l.label} →
                          </Link>
                        ))}
                      </p>
                    )}
                  </article>
                ))}
              </section>
            ))}
          </div>

          <p style={{ fontFamily: SANS, fontSize: 13, color: 'rgba(30,34,39,0.55)', lineHeight: 1.7, marginTop: 56, maxWidth: 720 }}>
            Definitions explain how the terms are used in NirmanShastra’s tools. They are not a substitute for the Indian Standards
            themselves or for a structural engineer’s design. See the{' '}
            <Link href="/is-codes-used" style={{ color: BLUEPRINT, textDecoration: 'underline' }}>
              IS codes used
            </Link>{' '}
            page for the full list of standards.
          </p>
        </div>
      </section>
    </main>
  )
}
