import type { CalcContent } from '@/lib/seo/calc-content'

// Answer-first box for the dark-matte calculator pages. Rendered directly under the
// H1 so the first thing a reader (or an AI crawler) meets is the answer, with a
// real number and the IS code. Pure presentational: no hooks, no client APIs, so it
// is safe inside 'use client' pages and still server-renders into the HTML.

const MONO = 'var(--font-plex-mono)'
const SANS = 'var(--font-plex-sans)'
const INK = '#F4F4F0'
const INK_65 = 'rgba(244,244,240,0.65)'
const SURF = '#171717'
const BSUB = 'rgba(255,255,255,0.08)'
const BLUEPRINT = '#1F4E79'

export default function QuickAnswer({ content }: { content: Pick<CalcContent, 'question' | 'quickAnswer'> }) {
  return (
    <section
      aria-label="Quick answer"
      data-quick-answer
      style={{
        background: SURF,
        border: `1px solid ${BSUB}`,
        borderLeft: `3px solid ${BLUEPRINT}`,
        borderRadius: 2,
        padding: '16px 18px',
        margin: '0 0 24px',
        maxWidth: 720,
      }}
    >
      <p
        style={{
          fontFamily: MONO,
          fontSize: 10,
          color: INK_65,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          margin: '0 0 8px',
        }}
      >
        Quick answer · {content.question}
      </p>
      <p style={{ fontFamily: SANS, fontSize: 16, color: INK, lineHeight: 1.7, margin: 0 }}>{content.quickAnswer}</p>
    </section>
  )
}
