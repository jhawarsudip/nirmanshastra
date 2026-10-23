'use client'

import { useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useReveal, useTween } from '@/lib/v2/store'
import { runCalculation, INDIAN_STATES, formatLakhs, type SiteCondition, type ConcreteGrade } from '@/app/tools/structopro/structopro-engine'
import { Arrow } from '../Icons'
import '@/styles/v2/closing.css'

const L = {
  en: {
    eye: 'Check a quote', h: 'Does your contractor’s number hold up?',
    p: 'Enter the frame-and-foundation figure you were quoted. The ruler shows the range the calculator’s own engine produces for the same building — material, labour and overhead, at India-average rates.',
    state: 'State / UT', floors: 'Floors', area: 'Built-up area per floor', site: 'Site',
    fl: ['Ground only', 'G+1', 'G+2', 'G+3'],
    sites: { flat: 'Flat / firm', bcs: 'Black cotton soil', rocky: 'Rocky', waterlogged: 'Waterlogged', coastal: 'Coastal' },
    quote: 'The quote you were given', lakh: 'lakh',
    basic: 'Basic', standard: 'Standard', premium: 'Premium', range: 'Structure range', persq: 'Per sq ft', zone: 'Seismic zone',
    below: (d: string) => `${d} below the basic end. Ask what is left out — steel grade, cover, labour, foundation.`,
    within: 'Inside the range. Now compare it line by line, not as a lump sum.',
    above: (d: string, pc: string) => `${d} (${pc}) above the premium end. That gap deserves a line-by-line BOQ.`,
    note: 'Structure only: RCC frame and foundation, grade matched to the site (IS 456:2000 exposure), Fe500D steel. Not a whole-house price, not a quotation, not for structural approval.',
    cta: 'Open StructurePro', cta2: 'Compare quotes line by line', pin: 'Your quote',
  },
  hi: {
    eye: 'कोटेशन जाँचिए', h: 'क्या ठेकेदार का आँकड़ा टिकता है?',
    p: 'फ्रेम और फाउंडेशन का जो आँकड़ा आपको बताया गया, वह भरिए। रूलर वही दायरा दिखाता है जो कैलकुलेटर का अपना इंजन उसी इमारत के लिए निकालता है — सामग्री, मज़दूरी और ओवरहेड, भारत के औसत रेट पर।',
    state: 'राज्य / UT', floors: 'मंज़िलें', area: 'प्रति मंज़िल बिल्ट-अप क्षेत्रफल', site: 'साइट',
    fl: ['सिर्फ़ भूतल', 'G+1', 'G+2', 'G+3'],
    sites: { flat: 'समतल / ठोस', bcs: 'काली कपास मिट्टी', rocky: 'चट्टानी', waterlogged: 'जलभराव', coastal: 'तटीय' },
    quote: 'आपको दिया गया कोटेशन', lakh: 'लाख',
    basic: 'बेसिक', standard: 'स्टैंडर्ड', premium: 'प्रीमियम', range: 'स्ट्रक्चर का दायरा', persq: 'प्रति वर्ग फुट', zone: 'भूकंप ज़ोन',
    below: (d: string) => `बेसिक सिरे से ${d} कम। पूछिए क्या छोड़ा गया है — स्टील ग्रेड, कवर, मज़दूरी, फाउंडेशन।`,
    within: 'दायरे के भीतर। अब इसे एकमुश्त नहीं, लाइन-दर-लाइन मिलाइए।',
    above: (d: string, pc: string) => `प्रीमियम सिरे से ${d} (${pc}) ज़्यादा। इस अंतर के लिए लाइन-दर-लाइन BOQ माँगिए।`,
    note: 'सिर्फ़ स्ट्रक्चर: RCC फ्रेम और फाउंडेशन, ग्रेड साइट के हिसाब से (IS 456:2000 एक्सपोज़र), Fe500D स्टील। पूरे घर की कीमत नहीं, कोटेशन नहीं, स्ट्रक्चरल अनुमोदन के लिए नहीं।',
    cta: 'StructurePro खोलें', cta2: 'कोटेशन लाइन-दर-लाइन मिलाएँ', pin: 'आपका कोटेशन',
  },
} as const

type Site = keyof typeof L.en.sites
const SITE: Record<Site, { cond: SiteCondition; grade: ConcreteGrade }> = {
  flat: { cond: 'flat', grade: 'M20' },
  bcs: { cond: 'bcs', grade: 'M25' },
  rocky: { cond: 'rocky', grade: 'M20' },
  waterlogged: { cond: 'waterlogged', grade: 'M30' },
  coastal: { cond: 'coastal', grade: 'M35' },
}
const LAKH = 100000
const lk = (n: number) => (n / LAKH).toFixed(1)

export default function QuoteCheck() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const c = L[loc]
  const [state, setState] = useState('Uttar Pradesh')
  const [fl, setFl] = useState(1)
  const [area, setArea] = useState(1200)
  const [site, setSite] = useState<Site>('flat')
  const [q, setQ] = useState<number | null>(null)
  const { ref } = useReveal<HTMLDivElement>()

  const res = useMemo(() => runCalculation({
    state, city: '', numFloors: fl, groundFloorAreaSqft: area, siteCondition: SITE[site].cond,
    concreteGrade: SITE[site].grade, steelGrade: 'Fe500D', includeLabour: true,
  }), [state, fl, area, site])

  const { basic, standard, premium } = res.grandTotal
  const lo = Math.floor((basic * 0.78) / LAKH) * LAKH
  const hi = Math.ceil((premium * 1.22) / LAKH) * LAKH
  const quote = Math.min(hi, Math.max(lo, q ?? Math.round(standard / LAKH) * LAKH))
  const pos = (v: number) => `${Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100))}%`
  const tB = useTween(basic), tP = useTween(premium)

  let verdict: string
  if (quote < basic) verdict = c.below('₹' + lk(basic - quote) + ' L')
  else if (quote > premium) verdict = c.above('₹' + lk(quote - premium) + ' L', Math.round(((quote - premium) / premium) * 100) + '%')
  else verdict = c.within
  const tone = quote < basic ? 'lo' : quote > premium ? 'hi' : 'ok'

  return (
    <section className="ns-section ns-qc" id="quote-check" aria-labelledby="ns-qc-h">
      <div className="ns-wrap" ref={ref}>
        <p className="ns-eyebrow ns-rise">{c.eye}</p>
        <h2 className="ns-h2 ns-rise" id="ns-qc-h" style={{ ['--d' as string]: '.05s' }}>{c.h}</h2>
        <p className="ns-lede ns-rise" style={{ ['--d' as string]: '.12s' }}>{c.p}</p>

        <div className="ns-plate ns-qc__plate ns-rise" style={{ ['--d' as string]: '.18s' }}>
          <div className="ns-qc__ctl">
            <label className="ns-field"><span>{c.state}</span>
              <select className="ns-select" value={state} onChange={e => setState(e.target.value)}>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <div className="ns-sc__row" role="radiogroup" aria-label={c.floors}>
              <span>{c.floors}</span><output className="ns-mono">{c.fl[fl]}</output>
              <div className="ns-seg ns-seg--wrap">{['G', 'G+1', 'G+2', 'G+3'].map((n, i) => <button key={n} type="button" role="radio" aria-checked={fl === i} className="ns-mono" onClick={() => setFl(i)}>{n}</button>)}</div>
            </div>
            <label className="ns-sc__row"><span>{c.area}</span><output className="ns-mono">{area} sq ft</output>
              <input type="range" className="ns-range" min={400} max={3000} step={50} value={area} onChange={e => setArea(+e.target.value)} />
            </label>
            <label className="ns-field"><span>{c.site}</span>
              <select className="ns-select" value={site} onChange={e => setSite(e.target.value as Site)}>
                {(Object.keys(c.sites) as Site[]).map(k => <option key={k} value={k}>{c.sites[k]}</option>)}
              </select>
            </label>
          </div>

          <div className="ns-qc__out" aria-live="polite">
            <div className="ns-qc__ruler" data-tone={tone}>
              <div className="ns-qc__band" style={{ left: pos(basic), width: `calc(${pos(premium)} - ${pos(basic)})` }} />
              {[['basic', basic], ['standard', standard], ['premium', premium]].map(([k, v]) => (
                <span key={k as string} className="ns-qc__tick" data-k={k as string} style={{ left: pos(v as number) }}>
                  <i /><b className="ns-mono">{c[k as 'basic']}</b><em className="ns-mono">{formatLakhs(v as number)}</em>
                </span>
              ))}
              <span className="ns-qc__pin" style={{ left: pos(quote) }}><i className="ns-mono">{c.pin} · ₹{lk(quote)} L</i></span>
            </div>
            <label className="ns-sc__row ns-qc__slide"><span>{c.quote}</span><output className="ns-mono">₹{lk(quote)} {c.lakh}</output>
              <input type="range" className="ns-range" min={lo} max={hi} step={50000} value={quote} onChange={e => setQ(+e.target.value)} />
            </label>
            <p className={`ns-qc__verdict is-${tone}`}>{verdict}</p>
            <dl className="ns-qc__facts">
              <div><dt className="ns-mono">{c.range}</dt><dd className="ns-mono">₹{lk(tB)}–{lk(tP)} L</dd></div>
              <div><dt className="ns-mono">{c.persq}</dt><dd className="ns-mono">₹{res.perSqftCost.basic}–{res.perSqftCost.premium}</dd></div>
              <div><dt className="ns-mono">{c.zone}</dt><dd className="ns-mono">{res.seismicZone} · Z {res.zFactor}</dd></div>
            </dl>
            <p className="ns-sc__note">{c.note}</p>
            <div className="ns-qc__cta">
              <Link className="ns-btn" href="/tools/structopro" data-snap>{c.cta}<Arrow /></Link>
              <Link className="ns-btn ns-btn--paper" href="/compare-quote" data-snap>{c.cta2}<Arrow /></Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
