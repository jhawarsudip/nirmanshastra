import { Link } from '@/i18n/navigation'
import { setRequestLocale } from 'next-intl/server'
import '@/styles/v2/results.css'
import JsonLd from '@/components/seo/JsonLd'
import { ToolHead, Note, IcArrow } from '@/components/v2/inner/kit'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { GLOSSARY, GLOSSARY_TERM_COUNT, GLOSSARY_UPDATED } from '@/lib/seo/glossary'
import { REVIEW_NOTE } from '@/lib/seo/site'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'
import { crumbs, isoDateHi, REVIEW_NOTE_HI } from '@/lib/i18n/labels/pages-common'
import { GLOSSARY_PAGE, GLOSSARY_NOTE, glossaryFor, glossaryJsonLd } from '@/lib/i18n/labels/pages-glossary'

// Server component: every term and definition is in the delivered HTML. The data also feeds the DefinedTermSet JSON-LD.
// The section ids come from the English group titles (the Hindi group is the same position in the same list), so the anchors never change with the language.

const H2 = { fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 } as const
const groupId = (title: string) => `g-${title.replace(/[^a-z]+/gi, '-').toLowerCase()}`

const updatedEn = new Date(`${GLOSSARY_UPDATED}T00:00:00Z`).toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export default async function GlossaryPage({ params }: LocaleParams) {
  const { locale: raw } = await params
  setRequestLocale(raw)
  const locale = asLocale(raw)
  const hi = locale === 'hi'
  const t = GLOSSARY_PAGE[locale]
  const note = GLOSSARY_NOTE[locale]
  const groups = glossaryFor(locale)
  const updatedLabel = hi ? isoDateHi(GLOSSARY_UPDATED) : updatedEn
  const allTerms = groups.flatMap((g) => g.terms).sort((a, b) => (hi ? a.term.localeCompare(b.term, 'hi') : a.term.localeCompare(b.term)))

  return (
    <div className="ns-i-page">
      <JsonLd
        data={[
          breadcrumbSchema(crumbs(locale, 'Glossary', 'शब्दावली', '/glossary')),
          glossaryJsonLd(locale),
        ]}
      />
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead eyebrow={t.eyebrow} name={t.name} blurb={t.blurb(GLOSSARY_TERM_COUNT)} />

        <p className="ns-r-tblnote">
          {hi ? REVIEW_NOTE_HI : REVIEW_NOTE} {t.lastUpdated}{hi ? ': ' : ' '}<time dateTime={GLOSSARY_UPDATED}>{updatedLabel}</time>{hi ? '।' : '.'}
        </p>

        <details className="ns-gl-jump">
          <summary><span>{t.jump} <span aria-hidden="true">({allTerms.length})</span></span></summary>
          <nav aria-label={t.navAria} className="ns-faq-nav">
            {allTerms.map((term) => (
              <a key={term.id} href={`#${term.id}`} className="ns-i-pill">{term.term}</a>
            ))}
          </nav>
        </details>

        {groups.map((g, gi) => (
          <section key={GLOSSARY[gi].title} className="ns-plate ns-r-sec ns-faq-sec" aria-labelledby={groupId(GLOSSARY[gi].title)}>
            <h2 id={groupId(GLOSSARY[gi].title)} style={H2}>{g.title}</h2>
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

        <Note kind="warn" title={t.noteTitle}>
          {note.a}<Link href="/is-codes-used" style={{ textDecoration: 'underline' }}>{note.link}</Link>{note.b}
        </Note>
      </div>
    </div>
  )
}
