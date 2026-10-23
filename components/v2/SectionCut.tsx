'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useReveal, useTween } from '@/lib/v2/store'
import { BAR_DIAS, M20_CEMENT_BAGS_PER_M3, RATES, SLAB_THUMB_KG_PER_M3, fmt, fmtInr, slabStrip } from '@/lib/v2/hero-math'
import '@/styles/v2/hero.css'

const COPY = {
  en: {
    tag: 'SECTION A–A · SLAB STRIP',
    sub: 'Drag the sliders. The section and the bill change together.',
    thick: 'Slab thickness', dia: 'Bar diameter', space: 'Spacing c/c',
    boqHead: 'Per 10 m² of slab · illustrative',
    concrete: 'Concrete M20 (1:1.5:3)', cement: 'Cement', steel: 'Steel', share: 'Steel share of concrete',
    thumb: 'Thumb rule (1.00 %)', delta: 'Mesh vs thumb rule', cost: 'Cement + steel', costNote: 'incl. 7 % wastage',
    note: 'One mesh layer: main and distribution bars at the same Ø and spacing. A teaching estimate, not a structural design.',
    rates: 'Rates: engine defaults, Pune 2026 · you set your own in the real tools',
    cover: 'COVER', window: 'WINDOW', bars: 'bars drawn ×1.6 for legibility',
    bags: 'bags', unit: 'mm',
  },
  hi: {
    tag: 'सेक्शन A–A · स्लैब पट्टी',
    sub: 'स्लाइडर खींचिए। कट-सेक्शन और बिल साथ-साथ बदलते हैं।',
    thick: 'स्लैब की मोटाई', dia: 'सरिये का व्यास', space: 'दूरी c/c',
    boqHead: '10 m² स्लैब पर · उदाहरण मात्र',
    concrete: 'कंक्रीट M20 (1:1.5:3)', cement: 'सीमेंट', steel: 'स्टील', share: 'कंक्रीट में स्टील का हिस्सा',
    thumb: 'मोटा नियम (1.00 %)', delta: 'जाली बनाम मोटा नियम', cost: 'सीमेंट + स्टील', costNote: '7 % वेस्टेज सहित',
    note: 'एक जाली-परत: मुख्य और वितरण सरिये समान व्यास व दूरी पर। यह समझाने के लिए अनुमान है, स्ट्रक्चरल डिज़ाइन नहीं।',
    rates: 'दरें: इंजन की डिफ़ॉल्ट, पुणे 2026 · असली टूल में अपनी दरें डालें',
    cover: 'कवर', window: 'विंडो', bars: 'सरिये पढ़ने के लिए ×1.6 बड़े दिखाए गए',
    bags: 'बैग', unit: 'mm',
  },
} as const

const K = 0.8            // drawing units per mm
const WIN = 600          // mm window
const X0 = 92
const X1 = X0 + WIN * K  // 572
const CY = 178
const COVER = 20         // mm, Section 8 · slab minimum cover (mild)

export default function SectionCut() {
  const locale = useLocale() === 'hi' ? 'hi' : 'en'
  const c = COPY[locale]
  const [t, setT] = useState(150)
  const [dia, setDia] = useState<number>(10)
  const [sp, setSp] = useState(150)
  const { ref } = useReveal<HTMLDivElement>({ rootMargin: '0px 0px -8% 0px' })

  const s = slabStrip(t, dia, sp)
  const tCement = useTween(s.cementBags)
  const tSteel = useTween(s.steelKg)
  const tPct = useTween(s.steelPct)
  const tThumb = useTween(s.thumbKg)
  const tDelta = useTween(s.deltaPct)
  const tCost = useTween(s.cost)
  const tVol = useTween(s.volume)

  // geometry
  const h = t * K
  const top = CY - h / 2
  const bot = CY + h / 2
  const r = (dia / 2) * K * 1.6
  const barY = bot - COVER * K - r
  const distY = barY - r - r * 0.7
  const n = Math.max(2, Math.floor(WIN / sp))
  const span = (n - 1) * sp
  const start = (WIN - span) / 2
  const xs = Array.from({ length: n }, (_, k) => X0 + (start + k * sp) * K)
  const q = h / 4
  const slabPath = [
    `M ${X0} ${top}`, `L ${X1} ${top}`,
    `L ${X1 + 7} ${top + q}`, `L ${X1 - 7} ${top + 2 * q}`, `L ${X1 + 7} ${top + 3 * q}`, `L ${X1} ${bot}`,
    `L ${X0} ${bot}`,
    `L ${X0 - 7} ${bot - q}`, `L ${X0 + 7} ${bot - 2 * q}`, `L ${X0 - 7} ${bot - 3 * q}`, 'Z',
  ].join(' ')
  const dimTx = X1 + 44
  const warn = Math.abs(s.deltaPct) > 15

  return (
    <div className="ns-sc" ref={ref}>
    <div className="ns-plate ns-sc__grid">
      <div className="ns-sc__head">
        <span className="ns-mono">{c.tag}</span>
        <span className="ns-mono ns-sc__sub">{c.sub}</span>
      </div>

      <svg className="ns-sc__svg" viewBox="72 4 586 368" role="img"
        aria-label={`${c.tag}: ${t} mm, Ø${dia} @ ${sp}`}>
        {/* slab */}
        <path d={slabPath} fill="var(--ns-paper)" />
        <path d={slabPath} fill="url(#h-concrete)" opacity=".9" />
        <path d={slabPath} fill="none" stroke="var(--ns-ink)" strokeWidth="2" strokeLinejoin="round" pathLength="1" className="ns-draw" />

        {/* distribution bars (run in plane) */}
        <line x1={X0 + 8} x2={X1 - 8} y1={distY} y2={distY} stroke="var(--ns-ink)" strokeWidth={r * 1.1} strokeLinecap="round"
          pathLength="1" className="ns-draw" style={{ ['--d' as string]: '.5s' }} />

        {/* main bars (cut across) */}
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={barY} r={r} className="ns-bar" fill="var(--ns-laterite)" stroke="var(--ns-ink)" strokeWidth="1.6"
            style={{ ['--i' as string]: i }} />
        ))}

        {/* spacing dimension */}
        <g className="ns-dimg" stroke="var(--ns-ink)" strokeWidth="1" fill="none">
          <line x1={xs[0]} x2={xs[1]} y1={top - 24} y2={top - 24} pathLength="1" className="ns-draw" style={{ ['--d' as string]: '.7s' }} />
          <line x1={xs[0]} x2={xs[0]} y1={top - 31} y2={top - 17} />
          <line x1={xs[1]} x2={xs[1]} y1={top - 31} y2={top - 17} />
          <line x1={xs[0]} x2={xs[0]} y1={top - 17} y2={barY - r} strokeDasharray="2 3" opacity=".5" />
          <line x1={xs[1]} x2={xs[1]} y1={top - 17} y2={barY - r} strokeDasharray="2 3" opacity=".5" />
        </g>
        <text x={(xs[0] + xs[1]) / 2} y={top - 32} textAnchor="middle" className="ns-sc__t">@ {sp}</text>

        {/* thickness dimension */}
        <g stroke="var(--ns-ink)" strokeWidth="1" fill="none">
          <line x1={dimTx} x2={dimTx} y1={top} y2={bot} pathLength="1" className="ns-draw" style={{ ['--d' as string]: '.8s' }} />
          <line x1={dimTx - 7} x2={dimTx + 7} y1={top} y2={top} />
          <line x1={dimTx - 7} x2={dimTx + 7} y1={bot} y2={bot} />
          <line x1={X1 + 6} x2={dimTx + 7} y1={top} y2={top} strokeDasharray="2 3" opacity=".5" />
          <line x1={X1 + 6} x2={dimTx + 7} y1={bot} y2={bot} strokeDasharray="2 3" opacity=".5" />
        </g>
        <text transform={`translate(${dimTx + 20} ${CY}) rotate(-90)`} textAnchor="middle" className="ns-sc__t">t = {t}</text>

        {/* cover */}
        <g stroke="var(--ns-laterite)" strokeWidth="1.4" fill="none">
          <line x1={X0 + 34} x2={X0 + 34} y1={bot - COVER * K} y2={bot} />
          <line x1={X0 + 28} x2={X0 + 40} y1={bot - COVER * K} y2={bot - COVER * K} />
          <line x1={X0 + 28} x2={X0 + 40} y1={bot} y2={bot} />
          <line x1={X0 + 34} x2={X0 + 34} y1={bot} y2={bot + 22} strokeDasharray="2 3" />
        </g>
        <text x={X0 + 34} y={bot + 36} textAnchor="middle" className="ns-sc__t ns-sc__t--lat">{c.cover} {COVER}</text>

        {/* window dimension */}
        <g stroke="var(--ns-ink)" strokeWidth="1" fill="none" opacity=".8">
          <line x1={X0} x2={X1} y1={bot + 64} y2={bot + 64} />
          <line x1={X0} x2={X0} y1={bot + 57} y2={bot + 71} />
          <line x1={X1} x2={X1} y1={bot + 57} y2={bot + 71} />
        </g>
        <text x={(X0 + X1) / 2} y={bot + 82} textAnchor="middle" className="ns-sc__t">{WIN} mm {c.window}</text>
      </svg>

      <div className="ns-sc__ctl">
        <label className="ns-sc__row">
          <span>{c.thick}</span>
          <output className="ns-mono">{t} mm</output>
          <input type="range" className="ns-range" min={100} max={200} step={10} value={t} onChange={e => setT(+e.target.value)} />
        </label>
        <div className="ns-sc__row" role="radiogroup" aria-label={c.dia}>
          <span>{c.dia}</span>
          <output className="ns-mono">Ø{dia}</output>
          <div className="ns-seg">
            {BAR_DIAS.map(d => (
              <button key={d} type="button" role="radio" aria-checked={dia === d} className="ns-mono" onClick={() => setDia(d)}>{d}</button>
            ))}
          </div>
        </div>
        <label className="ns-sc__row">
          <span>{c.space}</span>
          <output className="ns-mono">{sp} mm</output>
          <input type="range" className="ns-range" min={100} max={250} step={25} value={sp} onChange={e => setSp(+e.target.value)} />
        </label>
      </div>

      <div className="ns-boq" aria-live="polite">
        <div className="ns-boq__head ns-mono">{c.boqHead}</div>
        <div className="ns-boq__r"><span>{c.concrete}</span><b className="ns-mono">{fmt(tVol, 2)} m³</b></div>
        <div className="ns-boq__r"><span>{c.cement} <i className="ns-mono">{M20_CEMENT_BAGS_PER_M3} / m³</i></span><b className="ns-mono">{fmt(tCement, 1)} {c.bags}</b></div>
        <div className="ns-boq__r"><span>{c.steel} <i className="ns-mono">Ø{dia} @ {sp}</i></span><b className="ns-mono">{fmt(tSteel, 1)} kg</b></div>
        <div className="ns-boq__r"><span>{c.share}</span><b className="ns-mono">{fmt(tPct, 2)} %</b></div>
        <div className="ns-boq__r"><span>{c.thumb} <i className="ns-mono">{SLAB_THUMB_KG_PER_M3} kg/m³</i></span><b className="ns-mono">{fmt(tThumb, 1)} kg</b></div>
        <div className="ns-boq__r"><span>{c.delta}</span><b className={`ns-mono${warn ? ' is-warn' : ''}`}>{tDelta > 0 ? '+' : '−'}{fmt(Math.abs(tDelta), 0)} %</b></div>
        <div className="ns-boq__r ns-boq__tot"><span>{c.cost} <i>{c.costNote}</i></span><b className="ns-mono">{fmtInr(tCost)}</b></div>
        <p className="ns-sc__note">{c.note}</p>
        <p className="ns-sc__note ns-mono">{c.rates} · cement ₹{RATES.cement}/bag · steel ₹{RATES.steel}/kg · IS 456:2000 · IS 1786:2008 · {c.bars}</p>
      </div>
    </div>
    </div>
  )
}
