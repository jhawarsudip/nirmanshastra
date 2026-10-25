import Link from 'next/link'
import { SUPPORT_EMAIL } from '@/lib/seo/site'
import { ST_TERMS_INTRO, ST_TERMS_SECTIONS, ST_TERMS_SUMMARY, ST_TERMS_UPDATED } from '@/lib/site-templates-terms'

// "{email}" in the shared wording becomes a mailto link.
function withEmail(text: string) {
  return text.split('{email}').flatMap((part, i, all) =>
    i < all.length - 1
      ? [
          part,
          <a key={i} href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>
            {SUPPORT_EMAIL}
          </a>,
        ]
      : [part],
  )
}

export default function SiteTemplatesTermsPage() {
  return (
    <main className="sheet-frame min-h-screen" style={{ background: '#F4F4F0' }}>
      {/* Header band */}
      <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.1)' }}>
        <div className="px-6 md:px-16 lg:px-24 py-16">
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 12 }}>
            LEGAL · SITE TEMPLATES
          </p>
          <h1 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1.1 }}>
            Site Templates Terms and Licence
          </h1>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: 'rgba(244,244,240,0.45)', marginTop: 16, letterSpacing: '0.04em' }}>
            Last updated: {ST_TERMS_UPDATED}
          </p>
        </div>
      </div>

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="grid-paper" style={{ border: '1px solid rgba(30,34,39,0.15)', padding: '20px 24px', marginBottom: 48 }}>
            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.75)', lineHeight: 1.75 }}>
              {ST_TERMS_INTRO}
            </p>
          </div>

          {ST_TERMS_SECTIONS.map((s) => (
            <div key={s.id} style={{ paddingBottom: 40, marginBottom: 40, borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
              <h2 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 22, fontWeight: 600, color: '#1E2227', marginBottom: 18, lineHeight: 1.3 }}>
                {s.heading}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {s.paragraphs.map((p, i) => (
                  <p key={i} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
                    {withEmail(p)}
                  </p>
                ))}
              </div>
            </div>
          ))}

          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
            {ST_TERMS_SUMMARY}
          </p>

          <div style={{ paddingTop: 20 }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.45)', letterSpacing: '0.04em', lineHeight: 1.7 }}>
              See also:{' '}
              <Link href="/terms-of-use" style={{ color: '#1F4E79' }}>Terms of Use</Link>{' '}·{' '}
              <Link href="/privacy-policy" style={{ color: '#1F4E79' }}>Privacy Policy</Link>{' '}·{' '}
              <Link href="/site-templates" style={{ color: '#1F4E79' }}>Site Templates</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
