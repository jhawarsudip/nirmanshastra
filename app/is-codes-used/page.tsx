import type { Metadata } from 'next'
import Link from 'next/link'
import { CODES_BY_TOOL } from '@/lib/is-codes-data'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbSchema, isCodesItemList } from '@/lib/seo/schema'

const title = 'IS Codes Used in Construction Estimation — 25 Indian Standards'
const description = 'All 25 IS codes used across NirmanShastra tools: IS 456:2000 (concrete), IS 1786:2008 (steel), IS 1893:2016 (seismic), IS 732:2019 (electrical), IS 1172:1993 (plumbing) and more — with full titles and scope.'
const url = '/is-codes-used'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'NirmanShastra',
    url,
    title,
    description,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NirmanShastra — India’s IS-Code Construction Cost Estimator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

const phaseColor: Record<string, string> = {
  P0: '#C9A84C',
  P1: '#1F4E79',
  P2: '#1F4E79',
  P3: '#1F4E79',
  P4: '#1F4E79',
  P5: '#1F4E79',
  '': '#14532D',
}

export default function ISCodesPage() {
  // Unique codes: IS 4326:1993 and IS 2547:1976 are listed under two tools each.
  const totalCodes = new Set(CODES_BY_TOOL.flatMap(t => t.codes.map(c => c.code))).size

  return (
    <main className="sheet-frame min-h-screen" style={{ background: '#F4F4F0' }}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'IS Codes Used', path: '/is-codes-used' },
          ]),
          isCodesItemList(CODES_BY_TOOL),
        ]}
      />

      {/* Header band */}
      <div style={{ background: '#1F4E79', borderBottom: '1px solid rgba(244,244,240,0.1)' }}>
        <div className="px-6 md:px-16 lg:px-24 py-16">
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.6)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 12 }}>
            REFERENCE · IS CODE LIBRARY
          </p>
          <h1 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1.1 }}>
            IS Codes Used
          </h1>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 14, color: 'rgba(244,244,240,0.65)', marginTop: 16, letterSpacing: '0.04em' }}>
            {totalCodes} IS codes across 6 tools · Sourced from Bureau of Indian Standards publications
          </p>
        </div>
      </div>

      {/* Intro note */}
      <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.08)' }}>
        <div className="px-6 md:px-16 lg:px-24 py-8">
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(244,244,240,0.65)', lineHeight: 1.7, maxWidth: 760 }}>
            Every material quantity, mix ratio, cover depth, steel percentage, and structural parameter in NirmanShastra traces back to a specific clause in one of these codes. IS code values are locked at source — they cannot be altered by user input, and they are updated only when BIS revises the relevant publication.
          </p>
        </div>
      </div>

      {/* Code sections */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
          {CODES_BY_TOOL.map(tool => (
            <div key={tool.tool}>
              {/* Tool header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 16, borderBottom: '2px solid #1E2227' }}>
                {tool.phase && (
                  <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, padding: '4px 10px', border: `1px solid ${phaseColor[tool.phase]}`, color: phaseColor[tool.phase], letterSpacing: '0.05em' }}>
                    {tool.phase}
                  </span>
                )}
                <div>
                  <h2 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 24, fontWeight: 700, color: '#1E2227', lineHeight: 1.2 }}>
                    {tool.tool}
                  </h2>
                  <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.5)', letterSpacing: '0.05em', marginTop: 3 }}>
                    {tool.desc}
                  </p>
                </div>
              </div>

              {/* Codes table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.15)' }}>
                      <th style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(30,34,39,0.45)', letterSpacing: '0.09em', textTransform: 'uppercase', textAlign: 'left', padding: '8px 16px 8px 0', minWidth: 130 }}>
                        Code No.
                      </th>
                      <th style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(30,34,39,0.45)', letterSpacing: '0.09em', textTransform: 'uppercase', textAlign: 'left', padding: '8px 16px', minWidth: 280 }}>
                        Full Title
                      </th>
                      <th style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(30,34,39,0.45)', letterSpacing: '0.09em', textTransform: 'uppercase', textAlign: 'left', padding: '8px 0 8px 16px' }}>
                        What it Governs in NirmanShastra
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tool.codes.map((c, i) => (
                      <tr key={c.code} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.03)', borderBottom: '1px solid rgba(30,34,39,0.07)' }}>
                        <td style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 13, color: '#1F4E79', padding: '14px 16px 14px 0', verticalAlign: 'top', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {c.code}
                        </td>
                        <td style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: '#1E2227', padding: '14px 16px', verticalAlign: 'top', lineHeight: 1.55 }}>
                          {c.title}
                        </td>
                        <td style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.7)', padding: '14px 0 14px 16px', verticalAlign: 'top', lineHeight: 1.65 }}>
                          {c.governs}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="grid-paper" style={{ border: '1px solid rgba(30,34,39,0.1)', padding: '24px 28px', marginTop: 56 }}>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            NOTE ON CODE CURRENCY
          </p>
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(30,34,39,0.75)', lineHeight: 1.75 }}>
            IS codes are published and periodically revised by the Bureau of Indian Standards (BIS). NirmanShastra uses values from the editions listed above. If BIS revises a code referenced here, we update our platform values. We recommend verifying critical parameters against the current BIS publication before committing to specifications for your project.
          </p>
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(30,34,39,0.75)', lineHeight: 1.75, marginTop: 12 }}>
            See also:{' '}
            <Link href="/disclaimer" style={{ color: '#1F4E79' }}>Disclaimer</Link>{' '}·{' '}
            <Link href="/terms-of-use" style={{ color: '#1F4E79' }}>Terms of Use</Link>
          </p>
        </div>
        </div>
      </section>
    </main>
  )
}
