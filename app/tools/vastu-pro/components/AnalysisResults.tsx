'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import PlanEditor from './PlanEditor'
import { CATALOGUE } from '../vastu-catalogue'
import type { DoorMark, PlacedItem, PlanImage } from '../vastu-model'
import type { Poly } from '../vastu-geometry'
import { SOURCES, ZONES } from '../vastu-rules'
import { BASIS_LABEL, SEVERITY_LABEL, SEVERITY_ORDER, type Finding, type PlotNote, type Reading, type RemedySet, type Severity } from '../vastu-types'
import { Note, IcArrow } from '@/components/v2/inner/kit'
import { TOOLS } from '@/lib/v2/content'

interface Props {
  reading: Reading
  contactName: string
  house: Poly
  northDeg: number
  items: PlacedItem[]
  doors: DoorMark[]
  image: PlanImage | null
  onBackToPlan: () => void
}

// The sheet is always paper-coloured, so the plan uses the light-theme severity colours.
const SEV_COLOUR: Record<Severity, string> = { POSITIVE: '#2F7D5B', NEUTRAL: '#7A7266', MODERATE: '#9A6A12', CRITICAL: '#A3322A' }
const ZONE_NAMES = ZONES.map(z => z.short)
const NOOP = () => {}

const hasRemedies = (r: RemedySet) => r.structural.length + r.practical.length > 0

function List({ items }: { items: string[] }) {
  return (
    <ul className="ns-v-list">
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  )
}

function Remedies({ r, dos, donts }: { r: RemedySet; dos: string[]; donts: string[] }) {
  if (!hasRemedies(r) && dos.length + donts.length === 0) return null
  return (
    <details className="ns-v-more">
      <summary>If you want to act on this</summary>
      <div className="ns-v-more__b">
        {r.practical.length > 0 && (
          <div>
            <h4>Without building work</h4>
            <List items={r.practical} />
          </div>
        )}
        {r.structural.length > 0 && (
          <div>
            <h4>If you can still change the plan</h4>
            <List items={r.structural} />
          </div>
        )}
        {dos.length > 0 && (
          <div>
            <h4>Usually advised</h4>
            <List items={dos} />
          </div>
        )}
        {donts.length > 0 && (
          <div>
            <h4>Usually advised against</h4>
            <List items={donts} />
          </div>
        )}
      </div>
    </details>
  )
}

function FindingCard({ f }: { f: Finding }) {
  return (
    <article className="ns-plate ns-v-find" data-sev={f.severity}>
      <div className="ns-v-find__top">
        <h3>{f.label}</h3>
        <span className="ns-v-badge" data-sev={f.severity}>{SEVERITY_LABEL[f.severity]}</span>
      </div>
      <p className="ns-v-find__z">
        {f.zoneText}
        {f.alsoText ? `, ${f.alsoText}` : ''}
        {f.centre && <span className="ns-v-tag">part is in the Brahmasthan</span>}
        {f.borderline && <span className="ns-v-tag">close to a zone line</span>}
      </p>

      <p className="ns-v-find__t"><b>{f.headline}</b></p>
      <p className="ns-v-find__t">{f.tradition}</p>

      {f.detail.length > 0 && <List items={f.detail} />}

      {f.borderline && f.altSeverity && f.altSeverity !== f.severity && (
        <p className="ns-v-find__alt">
          This one sits close to a zone line. Read from the other side of the line it would be <b>{SEVERITY_LABEL[f.altSeverity].toLowerCase()}</b>. Check it against a measured plan before acting.
        </p>
      )}

      {f.disputed && <p className="ns-v-find__disp"><b>Teachers differ.</b> {f.disputed}</p>}
      {f.practical && <p className="ns-v-find__prac"><b>A practical reason.</b> {f.practical}</p>}

      <p className="ns-v-find__basis">
        <span className="ns-v-basis" data-basis={f.basis}>{BASIS_LABEL[f.basis]}</span>
        {f.source && <span>{f.source}</span>}
      </p>

      {f.severity !== 'POSITIVE' && <Remedies r={f.remedies} dos={f.dos} donts={f.donts} />}
    </article>
  )
}

function PlotCard({ n }: { n: PlotNote }) {
  return (
    <article className="ns-plate ns-v-find ns-v-find--plot" data-sev={n.severity}>
      <div className="ns-v-find__top">
        <h3>{n.title}</h3>
        <span className="ns-v-badge" data-sev={n.severity}>{n.counted ? SEVERITY_LABEL[n.severity] : 'For your information'}</span>
      </div>
      <p className="ns-v-find__t">{n.text}</p>
      <p className="ns-v-find__basis"><span className="ns-v-basis" data-basis={n.basis}>{BASIS_LABEL[n.basis]}</span></p>
      {n.remedies && <Remedies r={n.remedies} dos={[]} donts={[]} />}
    </article>
  )
}

export default function AnalysisResults({ reading, contactName, house, northDeg, items, doors, image, onBackToPlan }: Props) {
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const struct = TOOLS.find(t => t.key === 'struct')!
  const { findings, plot, counts, missing, basisNotes } = reading

  const sevOf = useMemo(() => {
    const m = new Map<string, Severity>()
    for (const f of findings) m.set(f.id, f.severity)
    return m
  }, [findings])
  const zoneOf = useMemo(() => {
    const m = new Map<string, string>()
    for (const f of findings) {
      const hit = /\(([A-Z]+)\)/.exec(f.zoneText)
      if (hit) m.set(f.id, hit[1])
    }
    return m
  }, [findings])

  // Worst first, then the heavier rule first, so what matters most is at the top.
  const ordered = useMemo(
    () => [...findings].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) || b.weight - a.weight),
    [findings],
  )
  const countedPlot = plot.filter(p => p.counted)
  const infoPlot = plot.filter(p => !p.counted)

  async function downloadPdf() {
    setPdfBusy(true)
    setPdfError('')
    try {
      const res = await fetch('/api/vastu-pro/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          northDeg,
          house: house.map(p => ({ x: p.x, y: p.y })),
          items: items.map(i => ({ id: i.id, kind: i.kind, x: i.x, y: i.y, w: i.w, h: i.h })),
          doors: doors.map(d => ({ id: d.id, kind: d.kind, pt: { x: d.pt.x, y: d.pt.y } })),
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'We could not make the PDF. Please try again.')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'VastuPro-findings.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'We could not make the PDF. Please try again.')
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <div>
      <div className="ns-v-reshead">
        <div>
          <span className="ns-i-pill ns-i-pill--tc">VastuPro · Your reading</span>
          <h1>Your Vastu reading</h1>
          <p>What the traditional texts and today’s teachers say about each door and room you marked, and where each rule comes from.</p>
        </div>
        <button type="button" className="ns-v-sbtn" onClick={onBackToPlan}>← Back to my plan</button>
      </div>

      <Note kind="info" title="What this reading is, and is not">
        It is a reading of your plan against the rules that the old Vastu texts and today’s teachers give. It is not a structural or safety check, and it does not say what will happen to anyone who lives there: no text or study shows that a layout decides health, money or luck. Some rules below are old and widely repeated, some are only taught today, and a few are modern habits. Each finding says which, and says where teachers disagree.
      </Note>

      <div className="ns-plate ns-v-summary">
        <div className="ns-v-summary__l">
          <h2>{contactName ? `Prepared for ${contactName}` : 'Summary'}</h2>
          <p className="ns-v-score__meta">
            North at {Math.round(northDeg)}° · {items.length} room{items.length !== 1 ? 's' : ''} and {doors.length} door{doors.length !== 1 ? 's' : ''} read
          </p>
          <div className="ns-v-counts">
            {([...SEVERITY_ORDER] as Severity[]).map(sev => (
              <div key={sev} className="ns-v-count" data-sev={sev}>
                <b>{counts[sev]}</b>
                <span>{SEVERITY_LABEL[sev]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ns-v-summary__r">
          <p className="ns-v-index__k">How to read these counts</p>
          <p className="ns-v-index__how">
            There is no overall mark out of 100, because no text gives one and a single number would hide which rules sit behind it. “Cautioned” is used only where the traditional texts themselves caution against a placement. Where only today’s teachers (or a recent habit) say so, the most a finding can read is “To review”.
          </p>
          {missing.length > 0 && (
            <p className="ns-v-index__m">Not on the plan yet: {missing.join(', ')}. The reading is provisional until they are.</p>
          )}
        </div>
      </div>

      <div className="ns-v-twin">
      <div className="ns-v-block">
        <h2>Your plan, as read</h2>
        <div className="ns-plate ns-v-sheet">
          <div className="ns-v-canvaswrap">
            <PlanEditor
              mode="view"
              house={house}
              onHouse={NOOP}
              northDeg={northDeg}
              items={items}
              onItems={NOOP}
              doors={doors}
              onDoors={NOOP}
              catalogue={CATALOGUE}
              activeDoorKind="main_door"
              selectedId={null}
              onSelect={NOOP}
              image={image}
              zoneNames={ZONE_NAMES}
              colourOf={id => { const s = sevOf.get(id); return s ? SEV_COLOUR[s] : undefined }}
              chipOf={id => zoneOf.get(id)}
            />
          </div>
          <div className="ns-v-sheet__foot">
            <ul className="ns-v-legend" aria-label="Colour key">
              {([...SEVERITY_ORDER].reverse() as Severity[]).map(s => (
                <li key={s}><i style={{ background: SEV_COLOUR[s] }} />{SEVERITY_LABEL[s]}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

        <div className="ns-v-twin__side">
      <div className="ns-v-block ns-plate ns-v-next">
        <h2>Keep a copy</h2>
        <p>A PDF with your plan, every finding with its source, and the remedies. It is made when you ask, from the plan on this page, and it is not stored.</p>
        {pdfError && <Note kind="err" title="That did not work">{pdfError}</Note>}
        <div className="ns-v-next__row">
          <button type="button" className="ns-btn" onClick={downloadPdf} disabled={pdfBusy}>
            {pdfBusy ? 'Making your PDF…' : 'Download the PDF'}
            {!pdfBusy && <IcArrow width={22} height={11} />}
          </button>
          <span className="ns-i-fine">Free. No payment.</span>
        </div>
      </div>

        </div>
      </div>

      <div className="ns-v-block">
        <h2>Door and room by room</h2>
        {ordered.length === 0 ? (
          <Note kind="info">Nothing on the plan could be read yet. Go back and mark a door or a room.</Note>
        ) : (
          <div className="ns-v-finds">
            {ordered.map(f => <FindingCard key={f.id} f={f} />)}
          </div>
        )}
      </div>

      {plot.length > 0 && (
        <div className="ns-v-block">
          <h2>About the plot itself</h2>
          <div className="ns-v-finds">
            {countedPlot.map(n => <PlotCard key={n.id} n={n} />)}
            {infoPlot.map(n => <PlotCard key={n.id} n={n} />)}
          </div>
        </div>
      )}

      <div className="ns-v-block ns-plate ns-v-how2">
        <h2>How this was read</h2>
        <List items={basisNotes} />
        <h3>Where the rules come from</h3>
        <ul className="ns-v-sources">
          {SOURCES.map(s => (
            <li key={s.work}><b>{s.work}.</b> {s.note}</li>
          ))}
        </ul>
        <p className="ns-i-fine">
          Where the older texts and today’s teachers differ, the finding says so. Rules marked “Modern convention” never count as more than “to review”. {reading.rulesVersion}.
        </p>
      </div>

      <div className="ns-v-block ns-plate ns-v-next">
        <h2>Layout settled? Next, the frame.</h2>
        <p>
          Once the rooms are where you want them, the next question is how much cement, steel and concrete the frame of the house will need. StructurePro works that out from a few plain questions about your plot and plan. The first look is free: your earthquake zone, the concrete and steel grades that apply, the IS-code checks and a 3D model of your frame. The full quantity report is {struct.price}.
        </p>
        <div className="ns-v-next__row">
          <Link href="/tools/structopro" className="ns-btn">
            See my frame, free
            <IcArrow width={22} height={11} />
          </Link>
        </div>
      </div>
    </div>
  )
}
