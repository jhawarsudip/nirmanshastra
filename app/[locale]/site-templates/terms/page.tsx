import { Link } from '@/i18n/navigation'
import '@/styles/v2/results.css'
import { ToolHead, Note } from '@/components/v2/inner/kit'
import { SUPPORT_EMAIL } from '@/lib/seo/site'
import { ST_TERMS_INTRO, ST_TERMS_SECTIONS, ST_TERMS_SUMMARY, ST_TERMS_UPDATED } from '@/lib/site-templates-terms'

const H2 = { fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 } as const

// "{email}" in the shared wording becomes a mailto link.
function withEmail(text: string) {
  return text.split('{email}').flatMap((part, i, all) =>
    i < all.length - 1
      ? [part, <a key={i} href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>]
      : [part],
  )
}

export default function SiteTemplatesTermsPage() {
  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead
          eyebrow="Legal · Site Templates"
          name="Site Templates Terms and Licence"
          blurb={`The licence, delivery and refund terms for the Excel files sold at /site-templates. Last updated ${ST_TERMS_UPDATED}.`}
        />

        <section className="ns-plate ns-r-sec ns-prose" aria-label="Scope">
          <p>{ST_TERMS_INTRO}</p>
        </section>

        {ST_TERMS_SECTIONS.map((s) => (
          <section key={s.id} className="ns-plate ns-r-sec ns-prose" aria-labelledby={`stt-${s.id}`}>
            <h2 id={`stt-${s.id}`} style={H2}>{s.heading}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i}>{withEmail(p)}</p>
            ))}
          </section>
        ))}

        <Note>
          {ST_TERMS_SUMMARY} See also the <Link href="/terms-of-use" style={{ textDecoration: 'underline' }}>Terms of Use</Link>,
          the <Link href="/privacy-policy" style={{ textDecoration: 'underline' }}>Privacy Policy</Link> and the{' '}
          <Link href="/site-templates" style={{ textDecoration: 'underline' }}>Site Templates</Link>.
        </Note>
      </div>
    </div>
  )
}
