'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { useMotionOK, useReveal, useTween } from '@/lib/v2/store'
import Calc from '../Calc'
import { SYSTEMS, unitsPerM2, jointMortarPerM2, MORTAR_ALLOW, CEMENT_KG_PER_M3, SAND_M3_PER_M3, CEMENT_BAG_KG } from '@/lib/qty/masonry/units'

const COPY = {
  en: {
    bench: 'Try it · 2', title: 'How many bricks does my wall need?',
    lede: 'A one-brick wall takes 94 to 104 bricks for every square metre, depending on the size of the brick, because the wall is two bricks deep behind the face you see. Pick your brick and wall, then watch one metre go up.',
    one: 'One brick', half: 'Half brick',
    kind: 'Brick', mod: 'Modular', non: 'Red brick', thick: 'Wall thickness', area: 'Wall area',
    lay: 'Lay it again', laid: 'Laid', face: 'One m² of face, running left to right',
    ansK: 'Bricks for your wall', unit: 'bricks',
    ansS: (b: string, c: string) => `Plus about ${b} bags of cement and ${c} cft of sand for the mortar between them.`,
    stCem: 'Cement', stSand: 'Sand', stMix: 'Mortar mix',
    bricks: 'Bricks', cement: 'Cement (mortar)', sand: 'Sand (mortar)', mortar: 'Mortar mix', bags: 'bags', cft: 'cft', sqm: 'm²',
    per: 'per m²', bond9: 'English bond · stretchers and headers alternate', bond4: 'Stretcher bond · half-lap',
    note: 'Quantities only. Cement and sand are for the mortar between the bricks. The drawing shows one face; the count includes every brick through the thickness. Doors and windows are not taken out here; the MasonryPro report does that.',
  },
  hi: {
    bench: 'आज़माइए · 2', title: 'मेरी दीवार में कितनी ईंटें लगेंगी?',
    lede: 'एक ईंट मोटी दीवार में ईंट के आकार के हिसाब से प्रति वर्ग मीटर 94 से 104 ईंटें लगती हैं, क्योंकि दिखने वाली सतह के पीछे दीवार दो ईंट गहरी होती है। अपनी ईंट और दीवार चुनिए, फिर एक मीटर दीवार उठते देखिए।',
    one: 'एक ईंट मोटी', half: 'आधी ईंट मोटी',
    kind: 'ईंट', mod: 'मॉड्यूलर', non: 'लाल ईंट', thick: 'दीवार की मोटाई', area: 'दीवार का क्षेत्रफल',
    lay: 'फिर से चिनें', laid: 'चिनी', face: '1 m² का सामना, बाएँ से दाएँ',
    ansK: 'आपकी दीवार के लिए ईंटें', unit: 'ईंटें',
    ansS: (b: string, c: string) => `साथ में बीच के मसाले के लिए लगभग ${b} बोरी सीमेंट और ${c} cft रेत।`,
    stCem: 'सीमेंट', stSand: 'रेत', stMix: 'मसाले का अनुपात',
    bricks: 'ईंटें', cement: 'सीमेंट (मसाला)', sand: 'रेत (मसाला)', mortar: 'मसाले का अनुपात', bags: 'बोरी', cft: 'cft', sqm: 'm²',
    per: 'प्रति m²', bond9: 'इंग्लिश बॉन्ड · स्ट्रेचर और हेडर बारी-बारी', bond4: 'स्ट्रेचर बॉन्ड · आधी-आधी लैप',
    note: 'सिर्फ़ मात्राएँ। सीमेंट और रेत ईंटों के बीच के मसाले के लिए हैं। चित्र में एक सतह दिखती है; गिनती में मोटाई के भीतर की हर ईंट शामिल है। दरवाज़े-खिड़कियाँ यहाँ घटाई नहीं गई हैं; MasonryPro रिपोर्ट यह करती है।',
  },
} as const

const CFT_PER_M3 = 35.3147
const KIND_SYS = { mod: 'modular', non: 'brick' } as const
type Kind = keyof typeof KIND_SYS
type Thick = 9 | 4

/**
 * Per m² of wall: bricks, cement bags and sand (cft) in the joint mortar, worked out by the same functions the
 * MasonryPro model and the free Brick Calculator use (lib/qty/masonry/units.ts). One brick thick is the brick's
 * length (190 mm modular, 230 mm red); half brick is its width. Mortar is the exact joint volume plus the model's allowance.
 */
function rowFor(kind: Kind, thick: Thick) {
  const S = SYSTEMS[KIND_SYS[kind]]
  const tt = thick === 9 ? S.ext : S.int
  const n = unitsPerM2(S, tt, false)
  const mortar = jointMortarPerM2(S, tt, false) * MORTAR_ALLOW
  const mix = thick === 9 ? 6 : 4
  return { n, c: (mortar * CEMENT_KG_PER_M3(mix)) / CEMENT_BAG_KG, s: mortar * SAND_M3_PER_M3 * CFT_PER_M3, r: `1:${mix}`, mm: Math.round(tt * 1000) }
}

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
  const [play, setPlay] = useState(0)
  const [armed, setArmed] = useState(false)
  const [prog, setProg] = useState(1)
  const ok = useMotionOK()
  const { ref, seen } = useReveal<HTMLDivElement>()

  const t = useMemo(() => rowFor(kind, thick), [kind, thick])
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

  const tBr = useTween(nBr), tBags = useTween(bags), tCft = useTween(cft)
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
          <svg className="ns-bench__svg" viewBox="0 0 330 366" role="img" aria-label={`${c.face}: ${Math.round(t.n)} / m²`}>
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
            <b className="ns-mono">{laid} / {Math.round(t.n)}</b>
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
            <span>{c.thick}</span><output className="ns-mono">{t.mm} mm</output>
            <div className="ns-seg">
              <button type="button" role="radio" aria-checked={thick === 9} onClick={() => setThick(9)}>{c.one}</button>
              <button type="button" role="radio" aria-checked={thick === 4} onClick={() => setThick(4)}>{c.half}</button>
            </div>
          </div>
          <label className="ns-sc__row">
            <span>{c.area}</span><output className="ns-mono">{area} {c.sqm}</output>
            <input type="range" className="ns-range" min={10} max={200} step={5} value={area} onChange={e => setArea(+e.target.value)} />
          </label>
        </div>

        <div className="ns-bench__boq">
          <div className="ns-ans" aria-live="polite">
            <p className="ns-ans__k">{c.ansK}</p>
            <p className="ns-ans__v">{nf.format(tBr)}<small>{c.unit}</small></p>
            <p className="ns-ans__s">{c.ansS(bags.toFixed(1), nf.format(cft))}</p>
            <dl className="ns-ans__stats">
              <div><dt>{c.stCem}</dt><dd>{tBags.toFixed(1)} {c.bags}</dd></div>
              <div><dt>{c.stSand}</dt><dd>{nf.format(tCft)} {c.cft}</dd></div>
              <div><dt>{c.stMix}</dt><dd>{t.r}</dd></div>
            </dl>
          </div>
          <Calc
            loc={loc}
            rows={[
              { label: c.bricks, how: `${t.n.toFixed(1)} ${c.per} × ${area} ${c.sqm}`, value: nf.format(nBr) },
              { label: c.cement, how: `${t.c.toFixed(2)} ${c.bags} ${c.per} × ${area} ${c.sqm}`, value: `${bags.toFixed(1)} ${c.bags}` },
              { label: c.sand, how: `${t.s.toFixed(2)} ${c.cft} ${c.per} × ${area} ${c.sqm}`, value: `${nf.format(cft)} ${c.cft}` },
              { label: c.mortar, how: `1 : ${t.r.split(':')[1]}`, value: t.r, strong: true },
            ]}
            note={c.note}
            standards={['IS 1077:1992', 'IS 2212:1991']}
          />
        </div>
      </div>
    </div>
  )
}
