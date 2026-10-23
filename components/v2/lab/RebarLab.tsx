'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useReveal } from '@/lib/v2/store'

const COPY = {
  en: {
    bench: 'Bench 01', title: 'Rebar cage',
    lede: 'Column ties are where cheap quotes save steel. Set the column and the storey height — the hinge zones tighten by code, and the tie count changes.',
    d: 'Least side of column', h: 'Clear storey height', mid: 'Mid-zone tie spacing',
    seis: 'Seismic Zone III–V detailing', ghost: 'Show 150 c/c everywhere',
    hinge: 'Hinge-zone ties', midr: 'Mid-zone ties', total: 'Ties per column', base: 'At 150 c/c everywhere',
    diff: 'Difference', rule: 'Rule · IS 13920:2016 Cl 6.3 · d/4 or 100 mm, whichever is less',
    cover: 'COVER 40', zone: 'Zone ≈ H/6 (illustrative)', ties: 'ties', fewer: 'fewer', more: 'more',
    note: 'Zone length and tie count illustrate the detailing rule; this is not a structural design. Column minimum cover 40 mm (IS 456:2000).',
    uni: 'Uniform spacing · no hinge zones',
  },
  hi: {
    bench: 'बेंच 01', title: 'सरिया केज',
    lede: 'कॉलम की टाई वहीं हैं जहाँ सस्ते कोटेशन स्टील बचाते हैं। कॉलम और मंज़िल की ऊँचाई चुनिए — हिंज ज़ोन कोड के अनुसार कसते हैं और टाई की गिनती बदलती है।',
    d: 'कॉलम की सबसे छोटी भुजा', h: 'मंज़िल की साफ़ ऊँचाई', mid: 'बीच के हिस्से में टाई दूरी',
    seis: 'भूकंप ज़ोन III–V डिटेलिंग', ghost: 'हर जगह 150 c/c दिखाएँ',
    hinge: 'हिंज ज़ोन की टाई', midr: 'बीच की टाई', total: 'प्रति कॉलम टाई', base: 'हर जगह 150 c/c पर',
    diff: 'अंतर', rule: 'नियम · IS 13920:2016 Cl 6.3 · d/4 या 100 mm, जो कम हो',
    cover: 'कवर 40', zone: 'ज़ोन ≈ H/6 (उदाहरण)', ties: 'टाई', fewer: 'कम', more: 'ज़्यादा',
    note: 'ज़ोन की लंबाई और टाई की गिनती नियम को समझाने के लिए उदाहरण है, स्ट्रक्चरल डिज़ाइन नहीं। कॉलम का न्यूनतम कवर 40 mm (IS 456:2000)।',
    uni: 'एक-सी दूरी · कोई हिंज ज़ोन नहीं',
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
  const zone = Hmm / 6
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
          <rect x="62" y={top} width="66" height={Y0 - top} fill="var(--ns-paper)" stroke="var(--ns-ink)" strokeWidth="2" />
          {/* longitudinal bars */}
          {[70, 95, 120].map(x => <line key={x} x1={x} x2={x} y1={top - 14} y2={Y0 + 12} stroke="var(--ns-laterite)" strokeWidth="3" strokeLinecap="round" />)}
          {/* ghost 150 c/c */}
          {ghost && Array.from({ length: base }, (_, k) => (
            <line key={`g${k}`} x1="38" x2="56" y1={Y(k * 150 + 75)} y2={Y(k * 150 + 75)} stroke="var(--ns-ink)" strokeWidth="1.4" strokeDasharray="3 2" opacity=".55" />
          ))}
          {/* ties */}
          {ties.map((t, i) => (
            <line key={`${t.z}${Math.round(t.y)}`} x1="64" x2="126" y1={Y(t.y)} y2={Y(t.y)}
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
          <g transform="translate(250 70)">
            <rect x="0" y="0" width="90" height="90" fill="var(--ns-paper)" stroke="var(--ns-ink)" strokeWidth="2" />
            <rect x="8" y="8" width="74" height="74" fill="none" stroke="var(--ns-ink)" strokeWidth="1.6" />
            {[[12, 12], [45, 12], [78, 12], [12, 45], [78, 45], [12, 78], [45, 78], [78, 78]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="4.6" fill="var(--ns-laterite)" stroke="var(--ns-ink)" strokeWidth="1.2" />
            ))}
            <g stroke="var(--ns-laterite)" strokeWidth="1.3" fill="none">
              <line x1="-10" x2="-10" y1="0" y2="8" /><line x1="-15" x2="-5" y1="0" y2="0" /><line x1="-15" x2="-5" y1="8" y2="8" />
            </g>
            <text x="-18" y="-10" textAnchor="start" className="ns-bench__t ns-bench__t--lat">{c.cover}</text>
            <text x="45" y="112" textAnchor="middle" className="ns-bench__t">d = {d}</text>
          </g>
          <text x="294" y="222" textAnchor="middle" className="ns-bench__t">{seis ? c.zone : c.uni}</text>
        </svg>

        <div className="ns-bench__ctl">
          <div className="ns-sc__row" role="radiogroup" aria-label={c.d}>
            <span>{c.d}</span><output className="ns-mono">{d} mm</output>
            <div className="ns-seg">{D_OPTS.map(v => <button key={v} type="button" role="radio" aria-checked={d === v} className="ns-mono" onClick={() => setD(v)}>{v}</button>)}</div>
          </div>
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

        <div className="ns-boq ns-bench__boq" aria-live="polite">
          <div className="ns-boq__head ns-mono">{c.rule}</div>
          {seis && <div className="ns-boq__r"><span>{c.hinge} <i className="ns-mono">@ {hs} mm</i></span><b className="ns-mono">{2 * nHinge} {c.ties}</b></div>}
          <div className="ns-boq__r"><span>{c.midr} <i className="ns-mono">@ {mid} mm</i></span><b className="ns-mono">{nMid} {c.ties}</b></div>
          <div className="ns-boq__r ns-boq__tot"><span>{c.total}</span><b className="ns-mono">{total}</b></div>
          <div className="ns-boq__r"><span>{c.base}</span><b className="ns-mono">{base}</b></div>
          <div className="ns-boq__r"><span>{c.diff}</span><b className={`ns-mono${diff < 0 ? ' is-warn' : ''}`}>{diff > 0 ? '+' : diff < 0 ? '−' : ''}{Math.abs(diff)} {diff < 0 ? c.fewer : diff > 0 ? c.more : ''}</b></div>
          <p className="ns-sc__note">{c.note}</p>
        </div>
      </div>
    </div>
  )
}
