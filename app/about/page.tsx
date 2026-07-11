import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About NirmanShastra — Built by a Civil Engineer',
  description: 'The founder story: a NITian civil engineer building IS-code-verified construction cost transparency for every Indian homeowner.',
}

export default function AboutPage() {
  return (
    <main className="sheet-frame min-h-screen" style={{ background: '#F4F4F0' }}>

      {/* Header band */}
      <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.1)' }}>
        <div className="px-6 md:px-16 lg:px-24 py-16">
          <h1 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            About NirmanShastra
          </h1>
        </div>
      </div>

      {/* Main content */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 md:px-12">

          {/* Founder bio block */}
          <div style={{ borderLeft: '3px solid #1F4E79', paddingLeft: 28, marginBottom: 48 }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
              THE FOUNDER
            </p>
            <p style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 22, fontWeight: 600, color: '#1E2227', lineHeight: 1.4, margin: 0 }}>
              The Founder — a NITian civil engineer, formerly at a leading real estate construction company, based in India.
            </p>
          </div>

          {/* Founder story */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
              I built NirmanShastra because I&rsquo;ve been on both sides of a construction quote — and I know how much money disappears in the gap between what a contractor says and what the Indian Standards actually require.
            </p>

            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
              I am a NITian civil engineer who then worked at a leading real estate construction company — one of India&rsquo;s most respected — where I learned what rigorous quantity estimation actually looks like. There, a BOQ is not a vague per-sqft guess. It is a precise document: so many bags of OPC 53, so many kilograms of Fe500D steel, so many cubic metres of M20 concrete poured to IS 456:2000 specifications. Every number traces back to a code clause. Every clause is verifiable.
            </p>

            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
              Then I watched what happens when a regular homeowner tries to build. A contractor arrives and quotes ₹1,800 per sqft. No breakdown. No quantities. No way to know if the steel tonnage is right, whether the mortar ratio is correct, or whether the cement bags match what IS 1077 and IS 456 actually prescribe for that wall thickness and concrete grade. The homeowner has no choice but to trust. And trust, in Indian residential construction, is expensive.
            </p>

            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
              NirmanShastra exists to close that gap. I wanted every homeowner in India — not just the ones who can afford a professional estimator — to have access to IS-code-verified quantity calculations. Not per-sqft thumb rules. Not city averages dressed up as analysis. Exact numbers: how many bricks for your specific wall type, how many cement bags for your mix ratio, how many metres of CPVC pipe for your floor plan. Numbers a contractor cannot argue with because they come from the Bureau of Indian Standards itself.
            </p>

            {/* What makes it different */}
            <div className="grid-paper" style={{ border: '1px solid rgba(30,34,39,0.15)', padding: '32px', marginTop: 8 }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
                WHAT MAKES NIRMANSHASTRA DIFFERENT
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  ['IS-code locked values', 'Every mix ratio, cover depth, steel percentage, and material factor is sourced from BIS publications — IS 456:2000, IS 1786:2008, IS 1893:2016, and 22 more — and locked at source. No one can change them.'],
                  ['Exact quantities, not averages', 'You enter your actual floor dimensions, wall types, and local material rates. The output is a line-item BOQ your contractor can price against — not a round number with a 30% error band.'],
                  ['Contractor comparison built in', 'Enter your contractor&rsquo;s quote. We show you the discrepancy, line by line, with the IS-code reason for each difference. Inflation, substitution, and missing items become visible.'],
                  ['Your data stays yours', 'NirmanShastra is not a lead generation platform. We do not sell your project details to contractors. Your estimate is your property.'],
                ].map(([title, body]) => (
                  <div key={title} style={{ display: 'flex', gap: 16 }}>
                    <span style={{ color: '#1F4E79', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</span>
                    <div>
                      <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, fontWeight: 600, color: '#1E2227', marginBottom: 4 }}>{title}</p>
                      <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.7)', lineHeight: 1.7 }}>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
              This is a bootstrapped product. I built it myself, verified every IS code value against BIS publications, and continue to update material rates quarterly. It is not a funded startup. It is an engineer&rsquo;s answer to a real problem — one I saw up close for years.
            </p>

            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
              If you are building your house in India, you deserve to know exactly what it should cost, down to the cement bag. That is what NirmanShastra gives you.
            </p>

            <p style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 16, fontWeight: 600, color: '#1E2227', fontStyle: 'italic' }}>
              — The Founder, India
            </p>
          </div>

          {/* CTA block */}
          <div style={{ marginTop: 56, paddingTop: 40, borderTop: '1px solid rgba(30,34,39,0.12)', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Link
              href="/tools/vastu-pro"
              style={{ background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 14, padding: '14px 28px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.02em' }}
            >
              Start Free — VastuPro →
            </Link>
            <Link
              href="/contact"
              style={{ border: '1px solid #1E2227', color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 14, padding: '14px 28px', borderRadius: 6, textDecoration: 'none', background: 'transparent', letterSpacing: '0.02em' }}
            >
              Contact →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
