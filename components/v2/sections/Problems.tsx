'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useReveal } from '@/lib/v2/store'
import '@/styles/v2/story.css'

const TOOL_COLOURS = ['--ns-t-struct', '--ns-t-mason', '--ns-t-elec', '--ns-t-plumb', '--ns-t-int']

/** Three small drafted illustrations; each reacts on hover / focus. */
function Art({ i }: { i: number }) {
  if (i === 0) {
    return (
      <svg viewBox="0 0 260 150" className="ns-prob__art" aria-hidden="true">
        <rect x="30" y="8" width="200" height="134" fill="var(--ns-bg)" stroke="var(--ns-ink)" strokeWidth="1.5" />
        <text x="44" y="30" className="ns-prob__t">QUOTATION</text>
        <g className="ns-prob__lines">
          <text x="44" y="56" className="ns-prob__t">CEMENT ......... ___ bags</text>
          <text x="44" y="76" className="ns-prob__t">STEEL .......... ___ kg</text>
          <text x="44" y="96" className="ns-prob__t">SAND ........... ___ cft</text>
        </g>
        <g className="ns-prob__redact" fill="var(--ns-ink)">
          <rect x="42" y="44" width="170" height="16" /><rect x="42" y="64" width="150" height="16" /><rect x="42" y="84" width="176" height="16" />
        </g>
        <line x1="44" x2="216" y1="114" y2="114" stroke="var(--ns-ink)" strokeWidth="2" />
        <text x="44" y="132" className="ns-prob__t ns-prob__t--b">LUMP SUM  ₹ ________</text>
      </svg>
    )
  }
  if (i === 1) {
    return (
      <svg viewBox="0 0 260 150" className="ns-prob__art" aria-hidden="true">
        <text x="130" y="62" textAnchor="middle" className="ns-prob__big">₹ / sq ft</text>
        <g className="ns-prob__lines">
          <text x="130" y="100" textAnchor="middle" className="ns-prob__t">brick count · mortar ratio · pipe Ø</text>
          <text x="130" y="120" textAnchor="middle" className="ns-prob__t">steel kg · cement grade · cover</text>
        </g>
        <rect className="ns-prob__lid ns-hatch-steel" x="30" y="76" width="200" height="56" fill="var(--ns-bg)" stroke="var(--ns-ink)" strokeWidth="1.5" />
        <rect className="ns-prob__lid" x="30" y="76" width="200" height="56" fill="url(#h-steel)" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 260 150" className="ns-prob__art" aria-hidden="true">
      <g className="ns-prob__five">
        {TOOL_COLOURS.map((c, k) => (
          <rect key={c} className="ns-prob__blk" x={14 + k * 48} y="40" width="38" height="54" fill={`var(${c})`} stroke="var(--ns-ink)" strokeWidth="1.5" style={{ ['--k' as string]: k }} />
        ))}
      </g>
      <text x="130" y="126" textAnchor="middle" className="ns-prob__t">Σ = ?</text>
    </svg>
  )
}

export default function Problems() {
  const tp = useTranslations('problems')
  const hi = useLocale() === 'hi'
  const { ref } = useReveal<HTMLDivElement>()

  return (
    <section className="ns-section" id="problems" aria-labelledby="ns-prob-h">
      <div className="ns-wrap" ref={ref}>
        <p className="ns-eyebrow ns-rise">{hi ? 'समस्या' : 'The problem'}</p>
        <h2 className="ns-h2 ns-prob__h ns-rise" id="ns-prob-h" style={{ ['--d' as string]: '.05s' }}>{tp('title')}</h2>
        <div className="ns-prob">
          {[0, 1, 2].map(i => (
            <article key={i} className="ns-plate ns-prob__card ns-rise" tabIndex={0} data-snap style={{ ['--d' as string]: `${0.12 * (i + 1)}s` }}>
              <span className="ns-prob__no ns-mono" aria-hidden="true">{tp(`${i}no` as '0no')}</span>
              <Art i={i} />
              <h3 className="ns-prob__t3">{tp(`${i}heading` as '0heading')}</h3>
              <p>{tp(`${i}body` as '0body')}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
