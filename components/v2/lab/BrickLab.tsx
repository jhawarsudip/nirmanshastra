'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { useMotionOK, useReveal, useTween } from '@/lib/v2/store'
import { DEFAULT_RATES } from '@/app/tools/structopro/structopro-engine'

const COPY = {
  en: {
    bench: 'Bench 02', title: 'Brick wall',
    lede: 'A 9″ wall is not 50 bricks a square metre — it is 100. Half of them hide inside the thickness. Pick the brick and the wall, then lay a metre.',
    kind: 'Brick', mod: 'Modular', non: 'Non-modular', thick: 'Wall thickness', area: 'Wall area', rate: 'Your brick rate',
    rateHint: 'optional · ₹ per brick', lay: 'Lay it again', laid: 'Laid', face: 'One m² of face, running left to right',
    bricks: 'Bricks', cement: 'Cement (mortar)', sand: 'Sand (mortar)', mortar: 'Mortar', cc: 'Cement cost', sc: 'Sand cost',
    bc: 'Brick cost', tot: 'Brick + mortar', tot2: 'Mortar materials only', bags: 'bags', cft: 'cft', sqm: 'm²',
    rule: 'IS 1077:1992 · IS 2212:1991', bond9: 'English bond · stretchers and headers alternate', bond4: 'Stretcher bond · half-lap',
    note: 'Cement ₹495/bag and sand ₹24/cft are the calculator’s default rates. Brick rates differ town to town, so we leave that to you. Drawing shows one face; the table counts every brick through the thickness.',
  },
  hi: {
    bench: 'बेंच 02', title: 'ईंट की दीवार',
    lede: '9″ की दीवार प्रति वर्ग मीटर 50 नहीं, 100 ईंट लेती है। आधी ईंटें मोटाई के भीतर छिपी रहती हैं। ईंट और दीवार चुनिए, फिर एक मीटर चिनिए।',
    kind: 'ईंट', mod: 'मॉड्यूलर', non: 'नॉन-मॉड्यूलर', thick: 'दीवार की मोटाई', area: 'दीवार का क्षेत्रफल', rate: 'आपकी ईंट का रेट',
    rateHint: 'वैकल्पिक · ₹ प्रति ईंट', lay: 'फिर से चिनें', laid: 'चिनी', face: '1 m² का सामना, बाएँ से दाएँ',
    bricks: 'ईंटें', cement: 'सीमेंट (मसाला)', sand: 'रेत (मसाला)', mortar: 'मसाला', cc: 'सीमेंट खर्च', sc: 'रेत खर्च',
    bc: 'ईंट खर्च', tot: 'ईंट + मसाला', tot2: 'सिर्फ़ मसाले की सामग्री', bags: 'बोरी', cft: 'cft', sqm: 'm²',
    rule: 'IS 1077:1992 · IS 2212:1991', bond9: 'इंग्लिश बॉन्ड · स्ट्रेचर और हेडर बारी-बारी', bond4: 'स्ट्रेचर बॉन्ड · आधी-आधी लैप',
    note: 'सीमेंट ₹495/बोरी और रेत ₹24/cft कैलकुलेटर के डिफ़ॉल्ट रेट हैं। ईंट का रेट शहर-शहर बदलता है, इसलिए वह आप भरें। चित्र में एक सतह है; तालिका मोटाई के भीतर की हर ईंट गिनती है।',
  },
} as const

/** Build Reference Section 8 (LOCKED) — Brickwork, per m² of wall. */
const TABLE = {
  mod: { 9: { n: 100, c: 0.2, s: 2.13, r: '1:6' }, 4: { n: 50, c: 0.1, s: 0.72, r: '1:4' } },
  non: { 9: { n: 90, c: 0.18, s: 1.65, r: '1:6' }, 4: { n: 48, c: 0.09, s: 0.6, r: '1:4' } },
} as const
type Kind = keyof typeof TABLE
type Thick = 9 | 4

interface B { x: number; y: number; w: number; h: number; hd: boolean; tone: number }

/** Face of one square metre: 300 drawing units = 1 m (0.3 units per mm). Illustration only. */
function layout(kind: Kind, thick: Thick): B[] {
  const mod = kind === 'mod'
  const rows = mod ? 10 : 12
  const rp = 300 / rows
  const sp = (mod ? 200 : 240) * 0.3
  const hp = (mod ? 100 : 125) * 0.3
  const out: B[] = []
  for (let r = 0; r < rows; r++) {
    const hd = thick === 9 && r % 2 === 1
    const p = hd ? hp : sp
    const off = hd ? hp / 2 : thick === 4 && r % 2 ? sp / 2 : 0
    for (let k = -1; k <= Math.ceil(300 / p); k++) {
      out.push({ x: k * p - off + 1.5, y: 300 - (r + 1) * rp + 1.5, w: p - 3, h: rp - 3, hd, tone: (r * 7 + k * 13 + 50) % 5 })
    }
  }
  return out.filter(b => b.x + b.w > 0 && b.x < 300)
}
const TONES = [0.8, 0.9, 1, 0.86, 0.95]
const nf = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export default function BrickLab() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const c = COPY[loc]
  const [kind, setKind] = useState<Kind>('mod')
  const [thick, setThick] = useState<Thick>(9)
  const [area, setArea] = useState(60)
  const [rate, setRate] = useState('')
  const [play, setPlay] = useState(0)
  const [armed, setArmed] = useState(false)
  const [prog, setProg] = useState(1)
  const ok = useMotionOK()
  const { ref, seen } = useReveal<HTMLDivElement>()

  const t = TABLE[kind][thick]
  const bricks = useMemo(() => layout(kind, thick), [kind, thick])
  const dur = Math.min(1800, bricks.length * 14 + 350)

  useEffect(() => {
    if (!seen) return
    setArmed(true)
    if (!ok) { setProg(1); return }
    setProg(0)
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur)
      setProg(k)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, play, kind, thick, ok, dur])

  const nBr = t.n * area
  const bags = t.c * area
  const cft = t.s * area
  const cementCost = bags * DEFAULT_RATES.cement
  const sandCost = cft * DEFAULT_RATES.sand
  const r = parseFloat(rate)
  const brickCost = Number.isFinite(r) && r > 0 ? nBr * r : null
  const total = cementCost + sandCost + (brickCost ?? 0)

  const tBr = useTween(nBr), tBags = useTween(bags), tCft = useTween(cft), tTot = useTween(total)
  const tCc = useTween(cementCost), tSc = useTween(sandCost), tBc = useTween(brickCost ?? 0)
  const laid = Math.round(t.n * prog)

  return (
    <div className="ns-bench ns-bk-lab" ref={ref}>
      <header className="ns-bench__head">
        <span className="ns-mono">{c.bench}</span>
        <h3 className="ns-h3">{c.title}</h3>
      </header>
      <p className="ns-bench__lede">{c.lede}</p>
      <div className="ns-bench__grid">
        <div className="ns-bench__fig">
          <svg className="ns-bench__svg" viewBox="0 0 330 366" role="img" aria-label={`${c.face}: ${t.n} / m²`}>
            <defs><clipPath id="ns-bk-clip"><rect x="0" y="0" width="300" height="300" /></clipPath></defs>
            <g transform="translate(24 8)">
              <rect x="0" y="0" width="300" height="300" fill="var(--ns-paper)" stroke="var(--ns-ink)" strokeWidth="2" />
              <g clipPath="url(#ns-bk-clip)" className="ns-bkg" data-armed={armed ? '1' : '0'} key={`${play}${kind}${thick}`}>
                {bricks.map((b, i) => (
                  <rect key={i} className="ns-bk" x={b.x} y={b.y} width={b.w} height={b.h}
                    fill={b.hd ? 'var(--ns-laterite-deep)' : 'var(--ns-laterite)'} fillOpacity={TONES[b.tone]}
                    stroke="var(--ns-ink)" strokeWidth=".8" style={{ ['--i' as string]: Math.min(i, 140) }} />
                ))}
              </g>
              <rect x="0" y="0" width="300" height="300" fill="none" stroke="var(--ns-ink)" strokeWidth="2" />
              {/* 1 m dimension */}
              <g stroke="var(--ns-ink)" strokeWidth="1" fill="none">
                <line x1="-12" x2="-12" y1="0" y2="300" /><line x1="-17" x2="-7" y1="0" y2="0" /><line x1="-17" x2="-7" y1="300" y2="300" />
                <line x1="0" x2="300" y1="316" y2="316" /><line x1="0" x2="0" y1="311" y2="321" /><line x1="300" x2="300" y1="311" y2="321" />
              </g>
              <text x="150" y="338" textAnchor="middle" className="ns-bench__t">1 m × 1 m</text>
              <text x="150" y="354" textAnchor="middle" className="ns-bench__t">{thick === 9 ? c.bond9 : c.bond4}</text>
            </g>
          </svg>
          <div className="ns-bk-lab__laid">
            <span className="ns-mono">{c.laid}</span>
            <b className="ns-mono">{laid} / {t.n}</b>
            <button type="button" className="ns-btn ns-btn--sm" onClick={() => setPlay(v => v + 1)}>{c.lay}</button>
          </div>
        </div>

        <div className="ns-bench__ctl">
          <div className="ns-sc__row" role="radiogroup" aria-label={c.kind}>
            <span>{c.kind}</span><output className="ns-mono">{kind === 'mod' ? '190×90×90' : '230×115×75'}</output>
            <div className="ns-seg">
              <button type="button" role="radio" aria-checked={kind === 'mod'} onClick={() => setKind('mod')}>{c.mod}</button>
              <button type="button" role="radio" aria-checked={kind === 'non'} onClick={() => setKind('non')}>{c.non}</button>
            </div>
          </div>
          <div className="ns-sc__row" role="radiogroup" aria-label={c.thick}>
            <span>{c.thick}</span><output className="ns-mono">{thick === 9 ? '9″ · 230' : '4.5″ · 115'} mm</output>
            <div className="ns-seg">
              <button type="button" role="radio" aria-checked={thick === 9} className="ns-mono" onClick={() => setThick(9)}>9″</button>
              <button type="button" role="radio" aria-checked={thick === 4} className="ns-mono" onClick={() => setThick(4)}>4.5″</button>
            </div>
          </div>
          <label className="ns-sc__row">
            <span>{c.area}</span><output className="ns-mono">{area} {c.sqm}</output>
            <input type="range" className="ns-range" min={10} max={200} step={5} value={area} onChange={e => setArea(+e.target.value)} />
          </label>
          <label className="ns-field ns-bk-lab__rate">
            <span className="ns-label">{c.rate} <i className="ns-mono">{c.rateHint}</i></span>
            <input className="ns-input ns-mono" inputMode="decimal" placeholder="—" value={rate} onChange={e => setRate(e.target.value.replace(/[^0-9.]/g, '').slice(0, 6))} />
          </label>
        </div>

        <div className="ns-boq ns-bench__boq" aria-live="polite">
          <div className="ns-boq__head ns-mono">{c.rule} · {c.mortar} {t.r}</div>
          <div className="ns-boq__r"><span>{c.bricks} <i className="ns-mono">{t.n} / {c.sqm}</i></span><b className="ns-mono">{nf.format(tBr)}</b></div>
          <div className="ns-boq__r"><span>{c.cement} <i className="ns-mono">{t.c.toFixed(2)} / {c.sqm}</i></span><b className="ns-mono">{tBags.toFixed(1)} {c.bags}</b></div>
          <div className="ns-boq__r"><span>{c.sand} <i className="ns-mono">{t.s.toFixed(2)} / {c.sqm}</i></span><b className="ns-mono">{nf.format(tCft)} {c.cft}</b></div>
          <div className="ns-boq__r"><span>{c.cc}</span><b className="ns-mono">₹{nf.format(tCc)}</b></div>
          <div className="ns-boq__r"><span>{c.sc}</span><b className="ns-mono">₹{nf.format(tSc)}</b></div>
          {brickCost !== null && <div className="ns-boq__r"><span>{c.bc}</span><b className="ns-mono">₹{nf.format(tBc)}</b></div>}
          <div className="ns-boq__r ns-boq__tot"><span>{brickCost !== null ? c.tot : c.tot2}</span><b className="ns-mono">₹{nf.format(tTot)}</b></div>
          <p className="ns-sc__note">{c.note}</p>
        </div>
      </div>
    </div>
  )
}
