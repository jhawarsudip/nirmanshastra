import type { CalcFaq as CalcFaqItem } from '@/lib/seo/calc-content'

// Visible FAQ for the dark-matte calculator pages. Native <details>, so every answer
// is in the delivered HTML even while collapsed. The same items feed the FAQPage
// JSON-LD (lib/seo/schema.ts), so markup and page text cannot drift apart.
// Pure presentational: safe inside 'use client' pages.

const SANS = 'var(--font-plex-sans)'
const SERIF = 'var(--font-plex-serif)'
const MONO = 'var(--font-plex-mono)'
const INK = '#F4F4F0'
const INK_65 = 'rgba(244,244,240,0.65)'
const BSUB = 'rgba(255,255,255,0.08)'
const BLUEPRINT = '#1F4E79'

export default function CalcFaq({
  items,
  heading = 'Frequently asked questions',
}: {
  items: CalcFaqItem[]
  heading?: string
}) {
  return (
    <section style={{ marginBottom: 40 }} data-faq>
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: 'clamp(22px,2.6vw,28px)',
          fontWeight: 600,
          color: INK,
          lineHeight: 1.25,
          marginBottom: 14,
        }}
      >
        {heading}
      </h2>
      <div style={{ borderTop: `1px solid ${BSUB}` }}>
        {items.map((item) => (
          <details key={item.question} className="ns-faq-item" style={{ borderBottom: `1px solid ${BSUB}` }}>
            <summary
              style={{
                padding: '16px 0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
                listStyle: 'none',
              }}
            >
              <h3
                style={{
                  fontFamily: SERIF,
                  fontSize: 17,
                  fontWeight: 600,
                  color: INK,
                  lineHeight: 1.4,
                  margin: 0,
                  flex: 1,
                }}
              >
                {item.question}
              </h3>
              <span
                className="ns-faq-plus"
                aria-hidden="true"
                style={{
                  fontFamily: MONO,
                  fontSize: 16,
                  color: BLUEPRINT,
                  flexShrink: 0,
                  marginTop: 2,
                  display: 'inline-block',
                  transition: 'transform 0.2s',
                }}
              >
                +
              </span>
            </summary>
            <p style={{ fontFamily: SANS, fontSize: 15.5, color: INK_65, lineHeight: 1.75, margin: '0 0 18px', paddingRight: 28 }}>
              {item.answer}
            </p>
          </details>
        ))}
      </div>
      <style>{`
        .ns-faq-item > summary::-webkit-details-marker { display: none; }
        .ns-faq-item[open] .ns-faq-plus { transform: rotate(45deg); }
        .ns-faq-item > summary:focus-visible { outline: 2px solid ${BLUEPRINT}; outline-offset: 2px; }
      `}</style>
    </section>
  )
}
