'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useReveal } from '@/lib/v2/store'
import Calc from '../Calc'

const COPY = {
  en: {
    bench: 'Try it · 1', title: 'Steel rings in a column',
    lede: 'Inside a column, tall steel bars are held in place by small steel rings called ties. Rings are an easy place to quietly save steel, so it helps to know how many there should be. Move the controls and watch the count change.',
    d: 'Width of the column', h: 'Floor height', mid: 'Ring spacing, middle of the column',
    seis: 'Earthquake area (closer rings near the ends)', ghost: 'Compare with even spacing',
    ansK: 'Steel rings in one column',
    hinge: 'Rings near the two ends', midr: 'Rings in the middle', total: 'Rings per column', base: 'If evenly spaced at 150 mm',
    diff: 'Difference', zoneHow: 'each end zone is the largest of: the column width, a sixth of the height, or 450 mm',
    spacing: 'Ring spacing near the ends', spacingHow: (d: number) => `a quarter of ${d} mm is ${d / 4} mm, but never more than 100 mm`,
    hintOff: 'Column width only changes the rings near the ends, so it has no effect while the earthquake option is off.',
    hintCap: 'Near the ends, rings are never spaced wider than 100 mm. So a 400 mm and a 450 mm column need the same number of rings.',
    rule: 'Near the ends of a column the rings sit closer: a quarter of the column width or 100 mm apart, whichever is less.',
    cover: 'COVER 40', zone: 'Rings sit closer near both ends', wide: (d: number) => `${d} mm wide`, ties: 'rings', fewer: 'fewer', more: 'more',
    note: 'This shows how the rule works; it is not a structural design. Concrete cover over the steel is at least 40 mm in a column.',
    uni: 'Even spacing · no closer end zones',
    same: 'Exactly what even spacing at 150 mm would give.',
    moreThan: (n: number) => `${n} more than rings spaced evenly at 150 mm. The extra rings are what keep a column strong in an earthquake.`,
    fewerThan: (n: number) => `${n} fewer than rings spaced evenly at 150 mm.`,
  },
  hi: {
    bench: 'आज़माइए · 1', title: 'कॉलम में स्टील के छल्ले',
    lede: 'कॉलम के अंदर लंबे सरिये होते हैं, जिन्हें टाई नाम के छोटे स्टील के छल्ले बाँधे रखते हैं। छल्लों में चुपचाप स्टील बचाना आसान है, इसलिए यह जानना काम आता है कि कितने होने चाहिए। कंट्रोल हिलाइए और गिनती बदलते देखिए।',
    d: 'कॉलम की चौड़ाई', h: 'मंज़िल की ऊँचाई', mid: 'कॉलम के बीच में छल्लों की दूरी',
    seis: 'भूकंप वाला इलाक़ा (सिरों पर पास-पास छल्ले)', ghost: 'बराबर दूरी से तुलना करें',
    ansK: 'एक कॉलम में स्टील के छल्ले',
    hinge: 'दोनों सिरों के पास छल्ले', midr: 'बीच में छल्ले', total: 'प्रति कॉलम छल्ले', base: 'अगर 150 mm पर बराबर लगें',
    diff: 'अंतर', zoneHow: 'हर सिरे का हिस्सा इनमें जो सबसे बड़ा हो: कॉलम की चौड़ाई, ऊँचाई का छठा भाग या 450 mm',
    spacing: 'सिरों के पास छल्लों की दूरी', spacingHow: (d: number) => `${d} mm का चौथाई ${d / 4} mm है, पर 100 mm से ज़्यादा कभी नहीं`,
    hintOff: 'कॉलम की चौड़ाई सिर्फ़ सिरों के छल्लों को बदलती है, इसलिए भूकंप वाला विकल्प बंद हो तो इसका कोई असर नहीं।',
    hintCap: 'सिरों के पास छल्ले 100 mm से ज़्यादा दूर नहीं लगते। इसलिए 400 mm और 450 mm के कॉलम में छल्लों की गिनती बराबर रहती है।',
    rule: 'कॉलम के सिरों के पास छल्ले पास-पास लगते हैं: कॉलम की चौड़ाई का एक-चौथाई या 100 mm, जो कम हो।',
    cover: 'कवर 40', zone: 'दोनों सिरों के पास छल्ले पास-पास', wide: (d: number) => `${d} mm चौड़ा`, ties: 'छल्ले', fewer: 'कम', more: 'ज़्यादा',
    note: 'यह नियम को समझाने के लिए है, स्ट्रक्चरल डिज़ाइन नहीं। कॉलम में स्टील के ऊपर कंक्रीट का कवर कम से कम 40 mm होता है।',
    uni: 'बराबर दूरी · सिरों पर कोई पास-पास हिस्सा नहीं',
    same: '150 mm की बराबर दूरी के बिल्कुल बराबर।',
    moreThan: (n: number) => `150 mm पर बराबर लगने वाले छल्लों से ${n} ज़्यादा। यही अतिरिक्त छल्ले भूकंप में कॉलम को मज़बूत रखते हैं।`,
    fewerThan: (n: number) => `150 mm पर बराबर लगने वाले छल्लों से ${n} कम।`,
  },
} as const

const D_OPTS = [300, 350, 400, 450]
const MID_OPTS = [100, 125, 150, 175, 200]
const Y0 = 338            // column base (drawing units)
const SC = 330 / 3600     // units per mm

export default function RebarLab() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const c = COPY[loc]
  const [d, setD] = useState(350)
  const [H, setH] = useState(3.0)
  const [mid, setMid] = useState(150)
  const [seis, setSeis] = useState(true)
  const [ghost, setGhost] = useState(false)
  const [armed, setArmed] = useState(true)
  const { ref, seen } = useReveal<HTMLDivElement>()

  useEffect(() => {
    if (!seen) return
    const t = window.setTimeout(() => setArmed(false), 2600)
    return () => window.clearTimeout(t)
  }, [seen])

  const hinge = Math.min(d / 4, 100)
  const Hmm = H * 1000
  const zone = Math.max(d, Hmm / 6, 450)   // IS 13920: largest of column width, a sixth of the height, 450 mm
  const nHinge = seis ? Math.ceil(zone / hinge) : 0
  const midLen = seis ? Hmm - 2 * zone : Hmm
  const nMid = Math.ceil(midLen / mid)
  const total = seis ? 2 * nHinge + nMid : nMid
  const base = Math.ceil(Hmm / 150)
  const diff = total - base
  const hs = hinge % 1 ? hinge.toFixed(1) : String(hinge)

  const ties: { y: number; z: 'h' | 'm' }[] = []
  if (seis) {
    for (let k = 0; k < nHinge; k++) { ties.push({ y: k * hinge + hinge / 2, z: 'h' }); ties.push({ y: Hmm - (k * hinge + hinge / 2), z: 'h' }) }
    for (let k = 0; k < nMid; k++) ties.push({ y: zone + k * mid + mid / 2, z: 'm' })
  } else {
    for (let k = 0; k < nMid; k++) ties.push({ y: k * mid + mid / 2, z: 'm' })
  }
  const Y = (mm: number) => Y0 - mm * SC
  const top = Y(Hmm)
  const colW = d * 0.17                 // drawing units: a wider column is drawn wider
  const cx = 95
  const left = cx - colW / 2
  const right = cx + colW / 2
  const sz = d * 0.2                    // cross-section square, 60 to 90 units

  return (
    <div className="ns-bench ns-rb" ref={ref}>
      <header className="ns-bench__head">
        <span className="ns-mono">{c.bench}</span>
        <h3 className="ns-h3">{c.title}</h3>
      </header>
      <p className="ns-bench__lede">{c.lede}</p>
      <div className="ns-bench__grid">
        <svg className="ns-bench__svg" viewBox="0 0 390 392" role="img" aria-label={`${c.title}: d ${d}, H ${H} m`}>
          {/* footing + slab */}
          <rect x="30" y={Y0} width="140" height="30" fill="url(#h-concrete)" stroke="var(--ns-ink)" strokeWidth="1.6" />
          <rect x="30" y={top - 24} width="140" height="24" fill="url(#h-concrete)" stroke="var(--ns-ink)" strokeWidth="1.6" />
          {/* hinge bands */}
          {seis && (
            <g>
              <rect x="46" y={Y(zone)} width="108" height={zone * SC} fill="var(--ns-laterite)" opacity=".14" />
              <rect x="46" y={top} width="108" height={zone * SC} fill="var(--ns-laterite)" opacity=".14" />
            </g>
          )}
          {/* column outline */}
          <rect x={left} y={top} width={colW} height={Y0 - top} fill="var(--ns-paper)" stroke="var(--ns-ink)" strokeWidth="2" />
          {/* longitudinal bars */}
          {[left + 8, cx, right - 8].map(x => <line key={x} x1={x} x2={x} y1={top - 14} y2={Y0 + 12} stroke="var(--ns-laterite)" strokeWidth="3" strokeLinecap="round" />)}
          {/* ghost 150 c/c */}
          {ghost && Array.from({ length: base }, (_, k) => (
            <line key={`g${k}`} x1="38" x2="56" y1={Y(k * 150 + 75)} y2={Y(k * 150 + 75)} stroke="var(--ns-ink)" strokeWidth="1.4" strokeDasharray="3 2" opacity=".55" />
          ))}
          {/* ties */}
          {ties.map((t, i) => (
            <line key={`${t.z}${Math.round(t.y)}`} x1={left + 2} x2={right - 2} y1={Y(t.y)} y2={Y(t.y)}
              stroke={t.z === 'h' ? 'var(--ns-ink)' : 'var(--ns-ink-2)'} strokeWidth={t.z === 'h' ? 1.8 : 1.4}
              className={armed ? 'ns-tie' : undefined} style={{ ['--i' as string]: Math.min(i, 60) }} />
          ))}
          {/* dimension: zone */}
          {seis && (
            <g stroke="var(--ns-ink)" strokeWidth="1" fill="none">
              <line x1="150" x2="150" y1={Y(zone)} y2={Y0} /><line x1="143" x2="157" y1={Y(zone)} y2={Y(zone)} /><line x1="143" x2="157" y1={Y0} y2={Y0} />
              <line x1="150" x2="150" y1={top} y2={top + zone * SC} /><line x1="143" x2="157" y1={top} y2={top} /><line x1="143" x2="157" y1={top + zone * SC} y2={top + zone * SC} />
            </g>
          )}
          {seis && <text x="164" y={Y(zone / 2)} className="ns-bench__t">@ {hs}</text>}
          {seis && <text x="164" y={top + (zone * SC) / 2} className="ns-bench__t">@ {hs}</text>}
          {!seis && <text x="164" y={(top + Y0) / 2} className="ns-bench__t">@ {mid}</text>}

          {/* cross-section */}
          <g transform={`translate(${250 + (90 - sz) / 2} ${70 + (90 - sz) / 2})`}>
            <rect x="0" y="0" width={sz} height={sz} fill="var(--ns-paper)" stroke="var(--ns-ink)" strokeWidth="2" />
            <rect x="8" y="8" width={sz - 16} height={sz - 16} fill="none" stroke="var(--ns-ink)" strokeWidth="1.6" />
            {[[12, 12], [sz / 2, 12], [sz - 12, 12], [12, sz / 2], [sz - 12, sz / 2], [12, sz - 12], [sz / 2, sz - 12], [sz - 12, sz - 12]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="4.6" fill="var(--ns-laterite)" stroke="var(--ns-ink)" strokeWidth="1.2" />
            ))}
            <g stroke="var(--ns-laterite)" strokeWidth="1.3" fill="none">
              <line x1="-10" x2="-10" y1="0" y2="8" /><line x1="-15" x2="-5" y1="0" y2="0" /><line x1="-15" x2="-5" y1="8" y2="8" />
            </g>
            <text x="-18" y="-10" textAnchor="start" className="ns-bench__t ns-bench__t--lat">{c.cover}</text>
            <text x={sz / 2} y={sz + 22} textAnchor="middle" className="ns-bench__t">{c.wide(d)}</text>
          </g>
          <text x="294" y="222" textAnchor="middle" className="ns-bench__t">{seis ? c.zone : c.uni}</text>
        </svg>

        <div className="ns-bench__ctl">
          <div className="ns-sc__row" role="radiogroup" aria-label={c.d}>
            <span>{c.d}</span><output className="ns-mono">{d} mm</output>
            <div className="ns-seg">{D_OPTS.map(v => <button key={v} type="button" role="radio" aria-checked={d === v} className="ns-mono" onClick={() => setD(v)}>{v}</button>)}</div>
          </div>
          {(!seis || d >= 400) && <p className="ns-sc__note" role="note">{!seis ? c.hintOff : c.hintCap}</p>}
          <label className="ns-sc__row">
            <span>{c.h}</span><output className="ns-mono">{H.toFixed(1)} m</output>
            <input type="range" className="ns-range" min={2.4} max={3.6} step={0.1} value={H} onChange={e => setH(+e.target.value)} />
          </label>
          <div className="ns-sc__row" role="radiogroup" aria-label={c.mid}>
            <span>{c.mid}</span><output className="ns-mono">{mid} mm</output>
            <div className="ns-seg">{MID_OPTS.map(v => <button key={v} type="button" role="radio" aria-checked={mid === v} className="ns-mono" onClick={() => setMid(v)}>{v}</button>)}</div>
          </div>
          <div className="ns-bench__tg">
            <button type="button" className="ns-toggle" aria-pressed={seis} onClick={() => setSeis(v => !v)}><i />{c.seis}</button>
            <button type="button" className="ns-toggle" aria-pressed={ghost} onClick={() => setGhost(v => !v)}><i />{c.ghost}</button>
          </div>
        </div>

        <div className="ns-bench__boq">
          <div className="ns-ans" aria-live="polite">
            <p className="ns-ans__k">{c.ansK}</p>
            <p className="ns-ans__v">{total}<small>{c.ties}</small></p>
            <p className="ns-ans__s">{diff === 0 ? c.same : diff > 0 ? c.moreThan(diff) : c.fewerThan(-diff)}</p>
          </div>
          <Calc
            loc={loc}
            rows={[
              ...(seis ? [
                { label: c.spacing, how: c.spacingHow(d), value: `${hs} mm` },
                { label: c.hinge, how: `${Math.round(zone)} mm · ${c.zoneHow}`, value: String(2 * nHinge) },
              ] : []),
              { label: c.midr, how: `${mid} mm`, value: String(nMid) },
              { label: c.total, value: String(total), strong: true },
              { label: c.base, how: `${Hmm} mm ÷ 150 mm`, value: String(base) },
            ]}
            note={`${c.rule} ${c.note}`}
            standards={['IS 13920:2016', 'IS 456:2000']}
          />
        </div>
      </div>
    </div>
  )
}
