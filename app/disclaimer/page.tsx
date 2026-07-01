import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Disclaimer — NirmanShastra',
  description: 'NirmanShastra is a cost estimation tool, not a structural engineering service. Read the full disclaimer before relying on any estimate for construction.',
}

export default function DisclaimerPage() {
  return (
    <main className="sheet-frame min-h-screen" style={{ background: '#F4F4F0' }}>

      {/* Header band */}
      <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.1)' }}>
        <div className="px-6 md:px-16 lg:px-24 py-16">
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 12 }}>
            LEGAL · DISCLAIMER
          </p>
          <h1 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1.1 }}>
            Disclaimer
          </h1>
        </div>
      </div>

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 md:px-12">

          {/* Primary warning box */}
          <div style={{ border: '2px solid #8C3A22', padding: '28px 32px', marginBottom: 48, background: 'rgba(140,58,34,0.04)' }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#8C3A22', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 14 }}>
              CRITICAL NOTICE — READ BEFORE USE
            </p>
            <p style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 20, fontWeight: 600, color: '#1E2227', lineHeight: 1.45 }}>
              NirmanShastra is a construction cost estimation tool. It is NOT a structural engineering service, and no output from this platform constitutes structural approval, engineering certification, or a building plan submission.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

            {/* Structural engineering */}
            <div style={{ paddingBottom: 36, borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                § 1 — STRUCTURAL ENGINEERING
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
                  All structural parameters shown in NirmanShastra reports — column sizes, foundation depths, beam spans, slab thicknesses, steel percentages, concrete grades — are calculated using standard IS code formulas for budgeting and quantity estimation purposes only.
                </p>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
                  These values represent typical parameters for the floor count, BUA, and site conditions you entered. They are not a structural design. Actual column sizes, footing dimensions, reinforcement details, and concrete grades for your specific project must be determined by a licensed structural engineer who has:
                </p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 0 }}>
                  {[
                    'Conducted or reviewed a site-specific geotechnical investigation',
                    'Assessed the actual seismic zone and soil type at your site',
                    'Prepared a structural drawing set with column schedules, reinforcement details, and foundation design',
                    'Certified the design under their professional registration',
                  ].map((item, i) => (
                    <li key={i} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.8)', lineHeight: 1.75, display: 'flex', gap: 12 }}>
                      <span style={{ color: '#8C3A22', flexShrink: 0, fontWeight: 700 }}>!</span> {item}
                    </li>
                  ))}
                </ul>
                <div style={{ background: '#1E2227', color: '#F4F4F0', padding: '18px 22px', borderLeft: '3px solid #8C3A22' }}>
                  <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 13, lineHeight: 1.6 }}>
                    BEFORE ANY CONSTRUCTION, a licensed structural engineer MUST review and certify the actual structural design for your specific site, soil, and seismic conditions. NirmanShastra is not liable for any construction outcome based on these estimates.
                  </p>
                </div>
              </div>
            </div>

            {/* IS code values */}
            <div style={{ paddingBottom: 36, borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                § 2 — IS CODE VALUES
              </p>
              <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
                IS code values used in NirmanShastra calculations — mix ratios, cover depths, steel percentages, mortar factors, water demand rates, and all other parameters — are sourced from publicly available Bureau of Indian Standards (BIS) publications and applied as of the report generation date.
              </p>
              <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85, marginTop: 14 }}>
                BIS codes are revised periodically. While we make every effort to keep our values current, we cannot guarantee that the specific clauses referenced in your report reflect the most recent published version of every IS code at the time you read this. Always verify critical parameters against the current BIS publication for your application.
              </p>
            </div>

            {/* Material rates */}
            <div style={{ paddingBottom: 36, borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                § 3 — MATERIAL RATES
              </p>
              <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
                Material rates pre-filled in NirmanShastra tools are India city averages updated quarterly. Rates not overridden by you remain city averages and may differ from actual local pricing by <strong>15–40%</strong> depending on location, season, transport costs, and market conditions.
              </p>
              <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85, marginTop: 14 }}>
                You are strongly advised to obtain current rates from at least two local dealers before finalising your project budget. NirmanShastra pre-filled rates are a benchmark, not a price guarantee.
              </p>
            </div>

            {/* Vastu */}
            <div style={{ paddingBottom: 36, borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                § 4 — VASTUPRO
              </p>
              <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
                VastuPro applies classical Vastu Shastra principles as documented in traditional texts and commonly applied in Indian residential construction. Vastu Shastra is a traditional Indian architectural practice; it is not a science with controlled empirical validation. NirmanShastra makes no claims about the measurable effects of Vastu compliance or non-compliance on any person, household, or outcome. VastuPro is offered as an informational and planning tool only.
              </p>
            </div>

            {/* General */}
            <div>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                § 5 — GENERAL
              </p>
              <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
                NirmanShastra is not responsible for errors arising from incorrect data entered by the user, changes in local regulations, site conditions not accounted for in the inputs, or force majeure events affecting material prices or construction timelines.
              </p>
              <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85, marginTop: 14 }}>
                Use of this platform constitutes acceptance of the full <Link href="/terms-of-use" style={{ color: '#1F4E79' }}>Terms of Use</Link> and <Link href="/privacy-policy" style={{ color: '#1F4E79' }}>Privacy Policy</Link>.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(30,34,39,0.1)' }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.45)', letterSpacing: '0.04em', lineHeight: 1.7 }}>
              Questions: <a href="mailto:reports@nirmanshastra.in" style={{ color: '#1F4E79' }}>reports@nirmanshastra.in</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
