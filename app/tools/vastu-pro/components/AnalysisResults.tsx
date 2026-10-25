'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { type VastuAnalysis, type VastuFinding, type PlacedMarker } from '../vastu-engine'
import { ZONE_SCORE, type Severity } from '../vastu-data'
import { Note, IcArrow } from '@/components/v2/inner/kit'
import { TOOLS } from '@/lib/v2/content'

const VastuMassingPreview3DWrapper = dynamic(
  () => import('./MassingPreview3DWrapper'),
  { ssr: false, loading: () => null }
)

interface Props {
  analysis: VastuAnalysis
  contactName: string
  northDeg: number
  markers: PlacedMarker[]
  onBackToPlan: () => void
}

const SEVERITY_LABEL: Record<Severity, string> = { CRITICAL: 'Critical', MODERATE: 'Moderate', NEUTRAL: 'Neutral', POSITIVE: 'Positive' }

const RING_R = 70
const RING_C = 2 * Math.PI * RING_R

function FindingCard({ finding }: { finding: VastuFinding }) {
  return (
    <article className="ns-plate ns-v-find" data-sev={finding.severity}>
      <div className="ns-v-find__top">
        <h3>{finding.roomLabel}</h3>
        <span className="ns-v-badge" data-sev={finding.severity}>{SEVERITY_LABEL[finding.severity]}</span>
      </div>
      <p className="ns-v-find__z">{finding.zoneFull} zone ({finding.zoneName})</p>
      <p className="ns-v-find__t">{finding.impact}</p>
    </article>
  )
}

export default function AnalysisResults({ analysis, contactName, northDeg, markers, onBackToPlan }: Props) {
  const { findings, score, criticalCount, moderateCount, positiveCount, neutralCount } = analysis
  const [show3D, setShow3D] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const struct = TOOLS.find(t => t.key === 'struct')!

  const scoreSev: Severity = score >= 70 ? 'POSITIVE' : score >= 40 ? 'MODERATE' : 'CRITICAL'

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
          markers: markers.map(m => ({ roomKey: m.roomKey, x: m.x, y: m.y })),
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
          <p>Every room you marked is rated by the zone it sits in, the way the Vastu tradition reads it.</p>
        </div>
        <button type="button" className="ns-v-sbtn" onClick={onBackToPlan}>← Back to my plan</button>
      </div>

      <div className="ns-plate ns-v-score">
        <div className="ns-v-ring" data-sev={scoreSev}>
          <svg viewBox="0 0 164 164" aria-hidden="true">
            <circle className="ns-v-ring__track" cx="82" cy="82" r={RING_R} />
            <circle
              className="ns-v-ring__arc"
              cx="82"
              cy="82"
              r={RING_R}
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - Math.max(0, Math.min(100, score)) / 100)}
            />
          </svg>
          <div className="ns-v-ring__v" role="img" aria-label={`Vastu score ${score} out of 100`}>
            <b>{score}</b>
            <span>out of 100</span>
          </div>
        </div>

        <div>
          <h2>{contactName ? `Prepared for ${contactName}` : 'Vastu score'}</h2>
          <p className="ns-v-score__meta">
            North at {Math.round(northDeg)}° · {markers.length} room{markers.length !== 1 ? 's' : ''} read
          </p>
          <div className="ns-v-counts">
            {([
              ['CRITICAL', criticalCount],
              ['MODERATE', moderateCount],
              ['NEUTRAL', neutralCount],
              ['POSITIVE', positiveCount],
            ] as [Severity, number][]).map(([sev, n]) => (
              <div key={sev} className="ns-v-count" data-sev={sev}>
                <b>{n}</b>
                <span>{SEVERITY_LABEL[sev]}</span>
              </div>
            ))}
          </div>
          <p className="ns-v-score__how">
            The score is the average of the room ratings: Positive counts {ZONE_SCORE.POSITIVE}, Neutral {ZONE_SCORE.NEUTRAL}, Moderate {ZONE_SCORE.MODERATE} and Critical {ZONE_SCORE.CRITICAL}.
          </p>
        </div>
      </div>

      <div className="ns-v-block">
        <Note kind="info" title="How to read this">
          Vastu Shastra is a traditional system of layout and orientation. It is not part of any BIS code, and it has no bearing on the strength or safety of the structure. Each finding below is what the tradition says about that room in that zone.
        </Note>
      </div>

      <div className="ns-v-block ns-plate ns-v-next">
        <h2>Keep a copy</h2>
        <p>A PDF with your plan, the score and every finding below. It is made when you ask, from the marks on this page, and it is not stored.</p>
        {pdfError && <Note kind="err" title="That did not work">{pdfError}</Note>}
        <div className="ns-v-next__row">
          <button type="button" className="ns-btn" onClick={downloadPdf} disabled={pdfBusy}>
            {pdfBusy ? 'Making your PDF…' : 'Download the PDF'}
            {!pdfBusy && <IcArrow width={22} height={11} />}
          </button>
          <span className="ns-i-fine">Free. No payment.</span>
        </div>
      </div>

      <div className="ns-v-block">
        <h2>Room by room</h2>
        <div className="ns-v-finds">
          {findings.map(finding => (
            <FindingCard key={finding.markerKey} finding={finding} />
          ))}
        </div>
      </div>

      <div className="ns-v-block ns-plate ns-v-3d-wrap">
        <div className="ns-v-3d">
          <div>
            <h2>See North on a 3D block of the house</h2>
            <p>A simple block with an arrow pointing North. Drag to turn it, scroll or pinch to zoom.</p>
          </div>
          <button type="button" className="ns-v-sbtn ns-v-sbtn--tc" aria-expanded={show3D} onClick={() => setShow3D(v => !v)}>
            {show3D ? 'Hide the 3D view' : 'Show the 3D view'}
          </button>
        </div>
        {show3D && (
          <div className="ns-v-stagebox">
            <VastuMassingPreview3DWrapper northDeg={northDeg} />
            <p className="ns-v-stage__cap">
              Schematic only. The arrow points to North, {Math.round(northDeg)}° clockwise from the top of your drawing. The block is a fixed two-floor shape; VastuPro does not ask for floors or area.
            </p>
          </div>
        )}
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
