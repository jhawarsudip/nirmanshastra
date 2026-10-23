'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useReveal, useTween } from '@/lib/v2/store'

const COPY = {
  en: {
    bench: 'Bench 03', title: 'Mix & cube',
    lede: 'The M in M20 stands for mix; the number is the strength a 150 mm cube must reach at 28 days. Pick how harsh the site is and the code sets the grade, the water limit and the cover.',
    exp: 'Exposure', vol: 'Pour volume', crush: 'Crush a cube', reset: 'Reset the cube',
    names: ['Mild', 'Moderate', 'Severe', 'Very severe', 'Extreme'],
    grade: 'Minimum grade', wc: 'Max water–cement ratio', minc: 'Minimum cement', cover: 'Nominal cover for this exposure', footing: 'Footing cover',
    nominal: 'Nominal mix 1 : 1.5 : 3', cem: 'Cement for this pour', maxw: 'Water, at most', floor: 'Cement, at least', design: 'Design mix',
    designNote: 'Above M20 the proportions come from a mix design by your structural engineer. The floor above is the code minimum, not a recipe.',
    bags: 'bags', kg: 'kg', l: 'litres', m3: 'm³', fck: 'fck', cube: '150 mm cube · 28 days',
    rule: 'IS 456:2000 Table 5 & 16', n20: 'M20 uses the calculator’s nominal-mix cement figure: 8.07 bags per m³.',
    note: 'Grade number = characteristic compressive strength in N/mm². The gauge shows that value, not a lab result. Water is a ceiling, not a target.',
    cmax: 'Code ceiling on cement: 450 kg/m³',
  },
  hi: {
    bench: 'बेंच 03', title: 'मिक्स और क्यूब',
    lede: 'M20 में M का मतलब मिक्स है; संख्या वह ताकत है जो 150 mm क्यूब को 28 दिन में छूनी चाहिए। साइट कितनी कठोर है, यह चुनिए — कोड ग्रेड, पानी की सीमा और कवर तय करता है।',
    exp: 'एक्सपोज़र', vol: 'ढलाई का आयतन', crush: 'क्यूब कुचलें', reset: 'क्यूब वापस रखें',
    names: ['सामान्य', 'मध्यम', 'तीव्र', 'अति तीव्र', 'चरम'],
    grade: 'न्यूनतम ग्रेड', wc: 'अधिकतम पानी–सीमेंट अनुपात', minc: 'न्यूनतम सीमेंट', cover: 'इस एक्सपोज़र का नॉमिनल कवर', footing: 'फुटिंग का कवर',
    nominal: 'नॉमिनल मिक्स 1 : 1.5 : 3', cem: 'इस ढलाई का सीमेंट', maxw: 'पानी, अधिकतम', floor: 'सीमेंट, कम से कम', design: 'डिज़ाइन मिक्स',
    designNote: 'M20 से ऊपर अनुपात आपके स्ट्रक्चरल इंजीनियर के मिक्स डिज़ाइन से आता है। ऊपर का न्यूनतम कोड की सीमा है, नुस्खा नहीं।',
    bags: 'बोरी', kg: 'kg', l: 'लीटर', m3: 'm³', fck: 'fck', cube: '150 mm क्यूब · 28 दिन',
    rule: 'IS 456:2000 तालिका 5 और 16', n20: 'M20 के लिए कैलकुलेटर का नॉमिनल-मिक्स सीमेंट आँकड़ा: 8.07 बोरी प्रति m³।',
    note: 'ग्रेड की संख्या = N/mm² में अभिलक्षणिक संपीडन शक्ति। गेज वही मान दिखाता है, लैब का नतीजा नहीं। पानी सीमा है, लक्ष्य नहीं।',
    cmax: 'सीमेंट पर कोड की ऊपरी सीमा: 450 kg/m³',
  },
} as const

/** Build Reference Section 8 (LOCKED) — exposure minimums (IS 456:2000 Table 5 + 16). */
const EXP = [
  { g: 20, cover: 20, wc: 0.55, min: 300 },
  { g: 25, cover: 30, wc: 0.5, min: 300 },
  { g: 30, cover: 45, wc: 0.45, min: 320 },
  { g: 35, cover: 50, wc: 0.45, min: 340 },
  { g: 40, cover: 75, wc: 0.4, min: 360 },
] as const
const M20_BAGS_PER_M3 = 8.07   // Section 8 · M20 1:1.5:3
const BAG_KG = 50
const GX = 165, GY = 126, GR = 92
const nf = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const ang = (v: number) => -90 + (Math.min(v, 50) / 50) * 180
const pt = (a: number, r: number) => [GX + r * Math.sin((a * Math.PI) / 180), GY - r * Math.cos((a * Math.PI) / 180)]

export default function MixLab() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const c = COPY[loc]
  const [ex, setEx] = useState(0)
  const [vol, setVol] = useState(12)
  const [crushed, setCrushed] = useState(false)
  const { ref } = useReveal<HTMLDivElement>()
  const e = EXP[ex]
  const nominal = e.g === 20
  const kgPerM3 = M20_BAGS_PER_M3 * BAG_KG
  const bags = M20_BAGS_PER_M3 * vol
  const water = e.wc * kgPerM3 * vol
  const floorBags = (e.min * vol) / BAG_KG
  const tBags = useTween(bags), tWater = useTween(water), tFloor = useTween(floorBags)
  const a0 = ang(0)
  const ticks = [0, 10, 20, 30, 40, 50]

  return (
    <div className="ns-bench ns-mx" ref={ref}>
      <header className="ns-bench__head">
        <span className="ns-mono">{c.bench}</span>
        <h3 className="ns-h3">{c.title}</h3>
      </header>
      <p className="ns-bench__lede">{c.lede}</p>
      <div className="ns-bench__grid">
        <div className="ns-bench__fig">
          <svg className="ns-bench__svg" viewBox="0 0 330 356" role="img" aria-label={`${c.cube}: M${e.g}, ${e.g} N/mm²`}>
            {/* gauge */}
            <path d={`M ${pt(-90, GR).join(' ')} A ${GR} ${GR} 0 0 1 ${pt(90, GR).join(' ')}`} fill="var(--ns-paper)" stroke="var(--ns-ink)" strokeWidth="2" />
            <path d={`M ${pt(ang(e.g) - 3, GR - 10).join(' ')} A ${GR - 10} ${GR - 10} 0 0 1 ${pt(ang(e.g) + 3, GR - 10).join(' ')}`} fill="none" stroke="var(--ns-laterite)" strokeWidth="9" />
            <line x1={GX - GR} x2={GX + GR} y1={GY} y2={GY} stroke="var(--ns-ink)" strokeWidth="2" />
            {ticks.map(v => {
              const [x1, y1] = pt(ang(v), GR - 2), [x2, y2] = pt(ang(v), GR - 16), [tx, ty] = pt(ang(v), GR - 30)
              return (
                <g key={v}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ns-ink)" strokeWidth="1.6" />
                  <text x={tx} y={ty + 4} textAnchor="middle" className="ns-bench__t">{v}</text>
                </g>
              )
            })}
            <text x={GX} y={GY + 22} textAnchor="middle" className="ns-bench__t">N/mm²</text>
            <g className="ns-needle" style={{ transform: `rotate(${crushed ? ang(e.g) - a0 : 0}deg)`, transformOrigin: `${GX}px ${GY}px` }}>
              <line x1={GX} y1={GY} x2={pt(a0, GR - 10)[0]} y2={pt(a0, GR - 10)[1]} stroke="var(--ns-ink)" strokeWidth="3" strokeLinecap="round" />
            </g>
            <circle cx={GX} cy={GY} r="7" fill="var(--ns-ink)" />
            {/* crushing machine */}
            <g>
              <rect x="150" y="170" width="30" height="40" fill="var(--ns-concrete)" stroke="var(--ns-ink)" strokeWidth="1.6" />
              <g className="ns-plat" style={{ transform: `translateY(${crushed ? 7 : 0}px)` }}>
                <rect x="96" y="208" width="138" height="14" fill="var(--ns-ink)" />
              </g>
              <rect x="115" y="222" width="100" height="84" fill="url(#h-concrete)" stroke="var(--ns-ink)" strokeWidth="2" style={{ transform: crushed ? 'scaleY(.96)' : 'none', transformOrigin: '165px 306px', transition: 'transform .5s' }} />
              <path className="ns-crack" d="M165 224 L158 246 L172 258 L160 280 L170 304" fill="none" stroke="var(--ns-ink)" strokeWidth="2" style={{ opacity: crushed ? 1 : 0 }} />
              <path className="ns-crack" d="M205 232 L192 250 L198 270" fill="none" stroke="var(--ns-ink)" strokeWidth="1.6" style={{ opacity: crushed ? 1 : 0 }} />
              <rect x="96" y="306" width="138" height="16" fill="var(--ns-ink)" />
              <rect x="70" y="322" width="190" height="10" fill="var(--ns-ink-2)" />
              <text x="165" y="350" textAnchor="middle" className="ns-bench__t">{c.cube}</text>
            </g>
          </svg>
          <div className="ns-bk-lab__laid">
            <span className="ns-mono">M{e.g} · {c.fck} {e.g}</span>
            <button type="button" className="ns-btn ns-btn--sm" onClick={() => setCrushed(v => !v)}>{crushed ? c.reset : c.crush}</button>
          </div>
        </div>

        <div className="ns-bench__ctl">
          <div className="ns-sc__row" role="radiogroup" aria-label={c.exp}>
            <span>{c.exp}</span><output className="ns-mono">{c.names[ex]}</output>
            <div className="ns-seg ns-seg--wrap">
              {c.names.map((n, i) => (
                <button key={n} type="button" role="radio" aria-checked={ex === i} onClick={() => { setEx(i); setCrushed(false) }}>{n}</button>
              ))}
            </div>
          </div>
          <label className="ns-sc__row">
            <span>{c.vol}</span><output className="ns-mono">{vol} {c.m3}</output>
            <input type="range" className="ns-range" min={1} max={40} step={1} value={vol} onChange={ev => setVol(+ev.target.value)} />
          </label>
        </div>

        <div className="ns-boq ns-bench__boq" aria-live="polite">
          <div className="ns-boq__head ns-mono">{c.rule}</div>
          <div className="ns-boq__r"><span>{c.grade}</span><b className="ns-mono">M{e.g}</b></div>
          <div className="ns-boq__r"><span>{c.wc}</span><b className="ns-mono">{e.wc.toFixed(2)}</b></div>
          <div className="ns-boq__r"><span>{c.minc}</span><b className="ns-mono">{e.min} {c.kg}/{c.m3}</b></div>
          <div className="ns-boq__r"><span>{c.cover}</span><b className="ns-mono">{e.cover} mm</b></div>
          <div className="ns-boq__r"><span>{c.footing}</span><b className="ns-mono">50 mm</b></div>
          {nominal ? (
            <>
              <div className="ns-boq__r ns-boq__tot"><span>{c.cem} <i className="ns-mono">{c.nominal}</i></span><b className="ns-mono">{tBags.toFixed(0)} {c.bags}</b></div>
              <div className="ns-boq__r"><span>{c.maxw}</span><b className="ns-mono">{nf.format(tWater)} {c.l}</b></div>
              <p className="ns-sc__note ns-mono">{c.n20}</p>
            </>
          ) : (
            <>
              <div className="ns-boq__r ns-boq__tot"><span>{c.floor} <i className="ns-mono">{c.design}</i></span><b className="ns-mono">{tFloor.toFixed(0)} {c.bags}</b></div>
              <p className="ns-sc__note">{c.designNote}</p>
            </>
          )}
          <p className="ns-sc__note">{c.note} {c.cmax}.</p>
        </div>
      </div>
    </div>
  )
}
