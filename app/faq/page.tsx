import Link from 'next/link'
import { FAQ_CATEGORIES } from '@/lib/faq-data'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbSchema, faqPageSchema } from '@/lib/seo/schema'

// Server component: every question AND answer is in the delivered HTML (native
// <details>, so answers are in the DOM even while collapsed). Each question is
// its own <h3> under a per-category <h2>, and the same data feeds FAQPage JSON-LD.

const mono = { fontFamily: 'var(--font-plex-mono)' } as React.CSSProperties
const serif = { fontFamily: 'var(--font-plex-serif)' } as React.CSSProperties
const sans = { fontFamily: 'var(--font-plex-sans)' } as React.CSSProperties

const anchorId = (code: string) => `faq-${code.toLowerCase()}`

export default function FaqPage() {
  const totalQuestions = FAQ_CATEGORIES.reduce((acc, c) => acc + c.items.length, 0)
  const allItems = FAQ_CATEGORIES.flatMap((c) => c.items)

  return (
    <div className="sheet-frame" style={{ minHeight: '100vh', background: '#F4F4F0' }}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'FAQ', path: '/faq' },
          ]),
          faqPageSchema(allItems),
        ]}
      />

      {/* Dark header */}
      <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.1)', padding: '48px 24px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <h1 style={{ ...serif, fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1.15, margin: '0 0 14px' }}>
            Questions &amp; Answers
          </h1>
          <p style={{ ...sans, fontSize: 16, color: 'rgba(244,244,240,0.6)', maxWidth: 540, margin: 0, lineHeight: 1.65 }}>
            Everything you need to know about NirmanShastra — how estimates work, what IS codes are used, payment, and more.
          </p>
          <div style={{ ...mono, fontSize: 11, color: 'rgba(244,244,240,0.3)', marginTop: 16 }}>
            {totalQuestions} questions across {FAQ_CATEGORIES.length} categories
          </div>
        </div>
      </div>

      {/* Category jump bar */}
      <nav
        aria-label="FAQ categories"
        style={{ borderBottom: '1px solid rgba(30,34,39,0.12)', background: '#F4F4F0', position: 'sticky', top: 52, zIndex: 20 }}
      >
        <div className="max-w-5xl mx-auto px-6 md:px-12" style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {FAQ_CATEGORIES.map((cat) => (
            <a
              key={cat.code}
              href={`#${anchorId(cat.code)}`}
              style={{
                ...mono,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '14px 18px',
                borderBottom: '2px solid transparent',
                color: 'rgba(30,34,39,0.6)',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
              }}
            >
              {cat.label}
              <span style={{ marginLeft: 6, fontSize: 9, opacity: 0.6 }}>({cat.items.length})</span>
            </a>
          ))}
        </div>
      </nav>

      {/* FAQ content */}
      <div
        className="max-w-5xl mx-auto px-6 md:px-12 faq-grid"
        style={{ paddingTop: 48, paddingBottom: 80, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 60, alignItems: 'start' }}
      >
        {/* Questions */}
        <div>
          {FAQ_CATEGORIES.map((cat) => (
            <section key={cat.code} id={anchorId(cat.code)} style={{ scrollMarginTop: 130, marginBottom: 44 }}>
              <h2 style={{ ...mono, fontSize: 10, fontWeight: 400, color: 'rgba(30,34,39,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>
                {cat.code} · {cat.label}
              </h2>

              {cat.items.map((item) => (
                <details key={item.question} className="faq-item" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
                  <summary
                    style={{
                      padding: '18px 0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: '#1E2227', lineHeight: 1.4, flex: 1, margin: 0 }}>
                      {item.question}
                    </h3>
                    <span
                      className="faq-plus"
                      aria-hidden="true"
                      style={{ ...mono, fontSize: 16, color: '#1F4E79', flexShrink: 0, marginTop: 2, display: 'inline-block', transition: 'transform 0.2s' }}
                    >
                      +
                    </span>
                  </summary>
                  <div style={{ paddingBottom: 20, paddingRight: 32 }}>
                    <p style={{ ...sans, fontSize: 15, color: 'rgba(30,34,39,0.75)', lineHeight: 1.75, margin: 0 }}>{item.answer}</p>
                  </div>
                </details>
              ))}
            </section>
          ))}
        </div>

        {/* Sidebar */}
        <div className="faq-sidebar" style={{ position: 'sticky', top: 130 }}>
          <div style={{ border: '1px solid rgba(30,34,39,0.15)', padding: '24px' }}>
            <div style={{ ...mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(30,34,39,0.4)', marginBottom: 14 }}>
              ALL CATEGORIES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {FAQ_CATEGORIES.map((cat) => (
                <a
                  key={cat.code}
                  href={`#${anchorId(cat.code)}`}
                  style={{
                    ...sans,
                    fontSize: 13,
                    color: 'rgba(30,34,39,0.65)',
                    borderLeft: '2px solid transparent',
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    textDecoration: 'none',
                  }}
                >
                  <span>{cat.label}</span>
                  <span style={{ ...mono, fontSize: 11, opacity: 0.5 }}>{cat.items.length}</span>
                </a>
              ))}
            </div>

            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(30,34,39,0.1)' }}>
              <div style={{ ...mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(30,34,39,0.4)', marginBottom: 12 }}>
                STILL HAVE QUESTIONS?
              </div>
              <p style={{ ...sans, fontSize: 13, color: 'rgba(30,34,39,0.6)', lineHeight: 1.55, marginBottom: 14 }}>
                Our AI construction advisor is available on every tool page to answer project-specific questions.
              </p>
              <Link href="/tools/vastu-pro" style={{ ...mono, fontSize: 11, color: '#8C3A22', textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Try a Free Tool →
              </Link>
            </div>
          </div>

          {/* Knowledge base link */}
          <div style={{ border: '1px solid rgba(30,34,39,0.1)', marginTop: 16, padding: '18px 20px' }}>
            <div style={{ ...mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(30,34,39,0.4)', marginBottom: 10 }}>
              LEARN MORE
            </div>
            <div style={{ ...serif, fontSize: 14, fontWeight: 600, color: '#1E2227', marginBottom: 6, lineHeight: 1.35 }}>
              IS Code Guides for Homeowners
            </div>
            <p style={{ ...sans, fontSize: 12, color: 'rgba(30,34,39,0.55)', lineHeight: 1.55, marginBottom: 12 }}>
              Plain-English articles on IS 456, IS 1786, seismic zones, and contractor fraud.
            </p>
            <Link href="/blog" style={{ ...mono, fontSize: 11, color: '#1F4E79', textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Read Articles →
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .faq-item > summary { list-style: none; }
        .faq-item > summary::-webkit-details-marker { display: none; }
        .faq-item[open] .faq-plus { transform: rotate(45deg); }
        .faq-item > summary:focus-visible { outline: 2px solid #1F4E79; outline-offset: 2px; }
        @media (max-width: 768px) {
          .faq-grid { grid-template-columns: 1fr !important; }
          .faq-sidebar { position: static !important; }
        }
      `}</style>
    </div>
  )
}
