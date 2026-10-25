'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useMotionOK, useReveal } from '@/lib/v2/store'
import { QUOTE_PROBLEMS, pick, type Bi, type Loc } from '@/lib/v2/copy'
import '@/styles/v2/story.css'

const TOOL_COLOURS = ['--ns-t-struct', '--ns-t-mason', '--ns-t-elec', '--ns-t-plumb', '--ns-t-int']

/*
  One rule for all three pictures: the quote shows what a real quote shows, and hides exactly the thing the card
  title says is missing. Hover, tap or keyboard focus reveals it.
  Quantity-only: no rupee figure and no sample quantity appears in any picture. What is hidden is shown as a question
  ("? bags"), because the point is that the quote does not say.
*/
const ART = {
  quote: { en: 'Quotation', hi: 'कोटेशन' },
  example: { en: 'Example', hi: 'उदाहरण' },
  cement: { en: 'Cement', hi: 'सीमेंट' },
  steel: { en: 'Steel', hi: 'स्टील' },
  sand: { en: 'Sand', hi: 'रेत' },
  lump: { en: 'Lump sum', hi: 'एकमुश्त' },
  qCement: { en: '? bags', hi: '? बैग' },
  qSteel: { en: '? kg', hi: '? किलो' },
  qSand: { en: '? cft', hi: '? घन फ़ुट' },
  perSqft: { en: 'one rate per sq ft', hi: 'प्रति वर्ग फ़ुट एक रेट' },
  mortar: { en: 'Mortar 1:4 or 1:6', hi: 'मसाला 1:4 या 1:6' },
  pipes: { en: 'Pipes ½″ or ¾″', hi: 'पाइप ½″ या ¾″' },
  grade: { en: 'Steel Fe 500 or Fe 500D', hi: 'स्टील Fe 500 या Fe 500D' },
  list: { en: 'lists', hi: 'सूचियाँ' },
  total: { en: '= one list', hi: '= एक सूची' },
}
const TRADE_NAMES: Bi[] = [
  { en: 'Frame', hi: 'ढाँचा' },
  { en: 'Walls', hi: 'दीवारें' },
  { en: 'Wiring', hi: 'वायरिंग' },
  { en: 'Pipes', hi: 'पाइप' },
  { en: 'Finish', hi: 'फ़िनिश' },
]

/** Three small illustrations; each reacts on hover, tap and focus. */
function Art({ i, loc }: { i: number; loc: Loc }) {
  if (i === 0) {
    const rows = [
      { y: 58, k: ART.cement, v: ART.qCement },
      { y: 78, k: ART.steel, v: ART.qSteel },
      { y: 98, k: ART.sand, v: ART.qSand },
    ]
    return (
      <svg viewBox="0 0 260 150" className="ns-prob__art" aria-hidden="true">
        <rect x="30" y="8" width="200" height="134" rx="10" fill="var(--ns-bg)" stroke="var(--ns-ink)" strokeWidth="1.5" />
        <text x="44" y="32" className="ns-prob__t ns-prob__t--b">{pick(ART.quote, loc)}</text>
        <text x="216" y="32" textAnchor="end" className="ns-prob__t ns-prob__t--dim">{pick(ART.example, loc)}</text>
        {rows.map(r => (
          <g key={r.y}>
            <text x="44" y={r.y} className="ns-prob__t">{pick(r.k, loc)}</text>
            <text x="216" y={r.y} textAnchor="end" className="ns-prob__t ns-prob__t--b">{pick(r.v, loc)}</text>
            <line x1="44" x2="216" y1={r.y + 6} y2={r.y + 6} stroke="var(--ns-hair-strong)" strokeWidth="1" strokeDasharray="2 4" />
          </g>
        ))}
        <g className="ns-prob__redact" fill="var(--ns-ink)">
          <rect x="126" y="46" width="98" height="16" rx="4" /><rect x="126" y="66" width="98" height="16" rx="4" /><rect x="126" y="86" width="98" height="16" rx="4" />
        </g>
        <line x1="44" x2="216" y1="114" y2="114" stroke="var(--ns-ink)" strokeWidth="2" strokeLinecap="round" />
        <text x="44" y="133" className="ns-prob__t ns-prob__t--b">{pick(ART.lump, loc)}</text>
        <rect x="156" y="121" width="60" height="16" rx="4" fill="var(--ns-ink)" />
      </svg>
    )
  }
  if (i === 1) {
    return (
      <svg viewBox="0 0 260 150" className="ns-prob__art" aria-hidden="true">
        <text x="130" y="62" textAnchor="middle" className="ns-prob__big" style={{ fontSize: loc === 'hi' ? 19 : 22 }}>{pick(ART.perSqft, loc)}</text>
        <g className="ns-prob__lines">
          <text x="130" y="94" textAnchor="middle" className="ns-prob__t">{pick(ART.mortar, loc)}</text>
          <text x="130" y="110" textAnchor="middle" className="ns-prob__t">{pick(ART.pipes, loc)}</text>
          <text x="130" y="126" textAnchor="middle" className="ns-prob__t">{pick(ART.grade, loc)}</text>
        </g>
        <g className="ns-prob__lid">
          <rect x="30" y="76" width="200" height="56" rx="12" fill="var(--ns-tint)" stroke="var(--ns-ink)" strokeWidth="1.5" />
          <text x="130" y="112" textAnchor="middle" className="ns-prob__big" style={{ fontSize: 34 }}>?</text>
        </g>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 260 150" className="ns-prob__art" aria-hidden="true">
      <g className="ns-prob__five">
        {TOOL_COLOURS.map((c, k) => (
          <g key={c} className="ns-prob__blk" style={{ ['--k' as string]: k }}>
            <rect x={14 + k * 48} y="14" width="38" height="46" rx="8" fill={`var(${c})`} stroke="var(--ns-ink)" strokeWidth="1.5" />
            <text x={14 + k * 48 + 19} y="78" textAnchor="middle" className="ns-prob__t ns-prob__t--b ns-prob__amt" style={{ fontSize: 11 }}>{pick(TRADE_NAMES[k], loc)}</text>
          </g>
        ))}
      </g>
      <text x="130" y="97" textAnchor="middle" className="ns-prob__t ns-prob__t--dim">5 {pick(ART.list, loc)}</text>
      <text x="130" y="130" textAnchor="middle" className="ns-prob__big ns-prob__q" style={{ fontSize: 30 }}>= ?</text>
      <text x="130" y="130" textAnchor="middle" className="ns-prob__big ns-prob__sum" style={{ fontSize: 30 }}>{pick(ART.total, loc)}</text>
    </svg>
  )
}

export default function Problems({ loc }: { loc: Loc }) {
  const { ref } = useReveal<HTMLDivElement>()
  const motion = useMotionOK()
  // Each card has its own "peek" state. On a computer, hover and keyboard focus show it (CSS). On a phone there is no hover,
  // so the card at the middle of the screen uncovers by itself and covers again as it scrolls away; a tap still toggles it.
  const [on, setOn] = useState<boolean[]>([false, false, false])
  const cards = useRef<(HTMLElement | null)[]>([])
  const toggle = (i: number) => setOn(o => o.map((v, k) => (k === i ? !v : v)))
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle(i)
    }
  }

  useEffect(() => {
    if (!motion || typeof IntersectionObserver === 'undefined' || typeof window.matchMedia !== 'function') return
    if (!window.matchMedia('(max-width: 899px), (hover: none)').matches) return
    const timers: number[] = []
    const set = (i: number, v: boolean) => setOn(o => (o[i] === v ? o : o.map((x, k) => (k === i ? v : x))))
    // The card that is crossing the middle of the screen is uncovered; the moment it moves off the middle (either way)
    // the cover slides back. The "middle" is a thin band (8% of the screen height) around the centre line, so the cover
    // returns while you keep scrolling, and two neighbouring cards are only uncovered together for a moment.
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        const i = Number((e.target as HTMLElement).dataset.i)
        window.clearTimeout(timers[i])
        if (e.isIntersecting) timers[i] = window.setTimeout(() => set(i, true), 120) // short beat, so a fast fling does not flicker
        else set(i, false)
      }
    }, { rootMargin: '-46% 0px -46% 0px', threshold: 0 })
    cards.current.forEach(el => { if (el) io.observe(el) })
    return () => { io.disconnect(); timers.forEach(t => window.clearTimeout(t)) }
  }, [motion])

  return (
    <section className="ns-section" id="problems" aria-labelledby="ns-prob-h">
      <div className="ns-wrap" ref={ref}>
        <p className="ns-eyebrow ns-rise">{pick(QUOTE_PROBLEMS.eyebrow, loc)}</p>
        <h2 className="ns-h2 ns-prob__h ns-rise" id="ns-prob-h" style={{ ['--d' as string]: '.05s' }}>{pick(QUOTE_PROBLEMS.title, loc)}</h2>
        <p className="ns-lede ns-rise" style={{ ['--d' as string]: '.1s', marginBottom: 'clamp(28px, 4vw, 52px)' }}>{pick(QUOTE_PROBLEMS.lede, loc)}</p>
        <div className="ns-prob">
          {QUOTE_PROBLEMS.cards.map((c, i) => (
            <article
              key={i}
              ref={el => { cards.current[i] = el }}
              data-i={i}
              className="ns-plate ns-prob__card ns-rise"
              tabIndex={0}
              data-snap
              data-open={on[i] ? 'true' : 'false'}
              onClick={() => toggle(i)}
              onKeyDown={e => onKey(e, i)}
              style={{ ['--d' as string]: `${0.12 * (i + 1)}s` }}
            >
              <span className="ns-prob__no" aria-hidden="true">{`0${i + 1}`}</span>
              <Art i={i} loc={loc} />
              <h3 className="ns-prob__t3">{pick(c.title, loc)}</h3>
              <p>{pick(c.body, loc)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
