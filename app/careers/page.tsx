import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Careers — NirmanShastra',
  description: 'NirmanShastra is a solo-founder bootstrapped company. Not actively hiring, but we would love to hear from civil engineers, developers, and growth people passionate about construction transparency.',
}

export default function CareersPage() {
  return (
    <main className="sheet-frame min-h-screen" style={{ background: '#F4F4F0' }}>

      {/* Header band */}
      <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.1)' }}>
        <div className="px-6 md:px-16 lg:px-24 py-16">
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 12 }}>
            CL. 0.2 — TEAM
          </p>
          <h1 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1.1 }}>
            Careers
          </h1>
        </div>
      </div>

      <section className="px-6 md:px-16 lg:px-24 py-20">
        <div style={{ maxWidth: 720 }}>

          {/* Status */}
          <div style={{ border: '1px solid rgba(217,154,6,0.4)', background: 'rgba(217,154,6,0.08)', padding: '20px 24px', marginBottom: 48, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 14, color: '#D99A06', flexShrink: 0 }}>⚠</span>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: '#1E2227', letterSpacing: '0.04em', lineHeight: 1.6 }}>
              NOT ACTIVELY HIRING — We are a solo-founder company right now. No open roles.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
              NirmanShastra is a solo-founder company — bootstrapped, building, and profitable from day one. Right now it is just me: one civil engineer, one product, one mission.
            </p>

            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
              We are not actively hiring. There are no open positions and no imminent funding round that changes that. If you send a CV expecting a quick reply about an offer, this is not the right moment.
            </p>

            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
              That said — if you are deeply passionate about fixing construction transparency in India, and you fit one of these descriptions, write to us anyway:
            </p>

            {/* Who we'd want to hear from */}
            <div className="grid-paper" style={{ border: '1px solid rgba(30,34,39,0.15)', padding: '32px' }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
                PROFILES WE&apos;D WANT TO HEAR FROM
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {[
                  {
                    role: 'Civil Engineer',
                    desc: 'You understand IS codes, have site experience, and are frustrated by how opaque construction pricing is in India. You want to help build tools that give homeowners real information.',
                  },
                  {
                    role: 'Frontend Developer',
                    desc: 'You can build clean, data-heavy interfaces in Next.js and TypeScript. You care about performance and correctness more than visual flourishes. Construction knowledge is a bonus, not a requirement.',
                  },
                  {
                    role: 'Growth / Content',
                    desc: 'You understand the Indian homeowner — what they fear, what they trust, how they search for construction information. You can write clearly about technical subjects without dumbing them down.',
                  },
                ].map(({ role, desc }) => (
                  <div key={role} style={{ paddingBottom: 20, borderBottom: '1px solid rgba(30,34,39,0.08)' }}>
                    <p style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 18, fontWeight: 600, color: '#1E2227', marginBottom: 8 }}>{role}</p>
                    <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.7)', lineHeight: 1.7 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
              If that sounds like you, send a short note via the Contact page. Tell us what you would build or fix first. No CV templates needed — just tell us what you see.
            </p>
          </div>

          <div style={{ marginTop: 48, paddingTop: 36, borderTop: '1px solid rgba(30,34,39,0.12)' }}>
            <Link
              href="/contact"
              style={{ background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 14, padding: '14px 28px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.02em', display: 'inline-block' }}
            >
              Write to us via Contact →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
