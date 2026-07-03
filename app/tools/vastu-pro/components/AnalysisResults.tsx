'use client'

import { type VastuAnalysis, type VastuFinding } from '../vastu-engine'
import { type Severity } from '../vastu-data'

interface Props {
  analysis: VastuAnalysis
  contactName: string
  northDeg: number
  markerCount: number
  onStartOver: () => void
}

const SEVERITY_COLOUR: Record<Severity, string> = {
  CRITICAL: '#8C3A22',
  MODERATE: '#D99A06',
  POSITIVE: '#14532D',
  NEUTRAL: 'rgba(30,34,39,0.45)',
}

const SEVERITY_BG: Record<Severity, string> = {
  CRITICAL: 'rgba(140,58,34,0.06)',
  MODERATE: 'rgba(217,154,6,0.06)',
  POSITIVE: 'rgba(20,83,45,0.06)',
  NEUTRAL: 'rgba(30,34,39,0.03)',
}

function SeverityStamp({ severity }: { severity: Severity }) {
  const colour = SEVERITY_COLOUR[severity]
  const isYellow = severity === 'MODERATE'
  return (
    <span
      style={{
        display: 'inline-block',
        border: `1px solid ${colour}`,
        outline: `1px solid ${colour}`,
        outlineOffset: 2,
        padding: '1px 6px',
        transform: 'rotate(-2deg)',
        color: isYellow ? '#1E2227' : colour,
        background: isYellow ? 'rgba(217,154,6,0.15)' : 'transparent',
        fontFamily: 'var(--font-plex-mono)',
        fontSize: 9,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        borderRadius: 1,
        fontWeight: 500,
        whiteSpace: 'nowrap' as const,
      }}
    >
      {severity}
    </span>
  )
}

function FindingCard({ finding }: { finding: VastuFinding }) {
  const borderColour = SEVERITY_COLOUR[finding.severity]
  return (
    <div
      className="rounded-[2px] p-4"
      style={{
        background: SEVERITY_BG[finding.severity],
        border: `1px solid rgba(30,34,39,0.08)`,
        borderLeft: `3px solid ${borderColour}`,
      }}
    >
      <div className="mb-2">
        <SeverityStamp severity={finding.severity} />
      </div>
      <p
        className="text-[15px] font-semibold"
        style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}
      >
        {finding.roomLabel}
      </p>
      <p
        className="text-[12px] mb-2"
        style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}
      >
        {finding.zoneFull} Zone · {finding.zoneName}
      </p>
      <p
        className="text-[13px] leading-relaxed mb-3"
        style={{ color: 'rgba(30,34,39,0.72)', fontFamily: 'var(--font-plex-sans)' }}
      >
        {finding.impact}
      </p>
      <div
        className="rounded-[2px] px-3 py-2.5"
        style={{ background: 'rgba(30,34,39,0.04)', border: '1px dashed rgba(30,34,39,0.14)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px]" style={{ color: 'rgba(30,34,39,0.3)' }}>🔒</span>
          <p
            className="text-[10px] uppercase tracking-widest"
            style={{ color: 'rgba(30,34,39,0.38)', fontFamily: 'var(--font-plex-mono)' }}
          >
            In Your Free PDF Report
          </p>
        </div>
        <p
          className="text-[11px]"
          style={{ color: 'rgba(30,34,39,0.38)', fontFamily: 'var(--font-plex-sans)' }}
        >
          Technical remedy · Actionable remedy · Do&apos;s · Don&apos;ts
        </p>
      </div>
    </div>
  )
}

export default function AnalysisResults({
  analysis,
  contactName,
  northDeg,
  markerCount,
  onStartOver,
}: Props) {
  const { findings, score, criticalCount, moderateCount, positiveCount, neutralCount } = analysis

  const scoreColour =
    score >= 70 ? '#14532D' : score >= 40 ? '#D99A06' : '#8C3A22'

  return (
    <div className="min-h-screen bg-sheet-white">
      {/* Header */}
      <div
        className="px-4 py-4"
        style={{ background: '#1E2227', borderBottom: '1px solid rgba(201,168,76,0.2)' }}
      >
        <div className="flex items-center justify-between gap-4 px-6 md:px-16 lg:px-24">
          <div>
            <p
              className="text-[10px] uppercase tracking-widest"
              style={{ color: 'rgba(201,168,76,0.5)', fontFamily: 'var(--font-plex-mono)' }}
            >
              NIRMANSHASTRA · VASTUPRO · PHASE 0 · FREE
            </p>
            <h1
              className="text-[20px] font-bold"
              style={{ color: '#C9A84C', fontFamily: 'var(--font-plex-serif)' }}
            >
              Vastu Analysis Results
            </h1>
          </div>
          <button
            onClick={onStartOver}
            className="shrink-0 text-[11px] px-3 py-1.5 rounded-[4px]"
            style={{
              background: 'rgba(201,168,76,0.1)',
              color: 'rgba(201,168,76,0.7)',
              border: '1px solid rgba(201,168,76,0.2)',
              fontFamily: 'var(--font-plex-mono)',
            }}
          >
            ← Mark Again
          </button>
        </div>
      </div>

      <div className="px-6 md:px-16 lg:px-24 py-8">
        {/* Score card */}
        <div
          className="rounded-[2px] p-5 mb-6"
          style={{ background: '#1E2227', border: '1px solid rgba(201,168,76,0.3)' }}
        >
          <div className="flex items-center gap-6">
            {/* Score circle */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className="w-24 h-24 rounded-full flex flex-col items-center justify-center"
                style={{ border: `3px solid ${scoreColour}`, background: 'rgba(0,0,0,0.2)' }}
              >
                <span
                  className="leading-none"
                  style={{
                    color: scoreColour,
                    fontFamily: 'var(--font-plex-mono)',
                    fontWeight: 500,
                    fontSize: 36,
                  }}
                >
                  {score}
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: 'rgba(201,168,76,0.45)', fontFamily: 'var(--font-plex-mono)' }}
                >
                  /100
                </span>
              </div>
              <p
                className="text-[9px] mt-2 uppercase tracking-widest"
                style={{ color: 'rgba(201,168,76,0.45)', fontFamily: 'var(--font-plex-mono)' }}
              >
                VASTU SCORE
              </p>
            </div>

            {/* Counts */}
            <div className="flex-1">
              {contactName && (
                <p
                  className="text-[14px] font-medium mb-3"
                  style={{ color: '#F4F4F0', fontFamily: 'var(--font-plex-sans)' }}
                >
                  {contactName}&apos;s Home
                </p>
              )}
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                {[
                  { label: 'CRITICAL', count: criticalCount, colour: '#8C3A22' },
                  { label: 'MODERATE', count: moderateCount, colour: '#D99A06' },
                  { label: 'POSITIVE', count: positiveCount, colour: '#14532D' },
                  { label: 'NEUTRAL',  count: neutralCount,  colour: 'rgba(201,168,76,0.4)' },
                ].map(({ label, count, colour }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span
                      style={{ color: colour, fontFamily: 'var(--font-plex-mono)', fontSize: 18, fontWeight: 500 }}
                    >
                      {count}
                    </span>
                    <span
                      className="text-[9px] uppercase tracking-widest"
                      style={{ color: 'rgba(201,168,76,0.4)', fontFamily: 'var(--font-plex-mono)' }}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <p
                className="text-[10px] mt-3"
                style={{ color: 'rgba(201,168,76,0.35)', fontFamily: 'var(--font-plex-mono)' }}
              >
                North {Math.round(northDeg)}° · {markerCount} room{markerCount !== 1 ? 's' : ''} analysed
              </p>
            </div>
          </div>
        </div>

        {/* Findings */}
        <div className="mb-6">
          <p
            className="text-[10px] uppercase tracking-widest mb-3"
            style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}
          >
            ROOM-BY-ROOM FINDINGS
          </p>
          <div className="flex flex-col gap-3">
            {findings.map(finding => (
              <FindingCard key={finding.markerKey} finding={finding} />
            ))}
          </div>
        </div>

        {/* PDF CTA */}
        <div
          className="rounded-[2px] p-5 mb-6"
          style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.28)' }}
        >
          <div className="flex items-start gap-3">
            <span className="text-[22px] shrink-0" style={{ color: '#C9A84C' }}>✦</span>
            <div>
              <p
                className="text-[14px] font-semibold mb-1"
                style={{ color: '#1E2227', fontFamily: 'var(--font-plex-serif)' }}
              >
                Your Free VastuPro PDF Report
              </p>
              <p
                className="text-[12px] mb-3 leading-relaxed"
                style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}
              >
                6 pages: full Vastu Mandala diagram, technical remedies, actionable remedies,
                Do&apos;s &amp; Don&apos;ts for every room, general Vastu guidelines, and a priority action table.
              </p>
              <button
                className="px-5 py-2.5 rounded-[6px] text-[13px] font-semibold text-white"
                style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}
              >
                Download Free PDF Report →
              </button>
              <p
                className="text-[10px] mt-2"
                style={{ color: 'rgba(30,34,39,0.38)', fontFamily: 'var(--font-plex-mono)' }}
              >
                Free forever · No payment required
              </p>
            </div>
          </div>
        </div>

        {/* StructoPro cross-sell */}
        <div
          className="rounded-[2px] p-5"
          style={{ background: 'rgba(20,83,45,0.05)', border: '1px solid rgba(20,83,45,0.22)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[9px] px-2 py-0.5 rounded-[2px]"
              style={{ background: '#14532D', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}
            >
              PHASE 1
            </span>
            <p
              className="text-[10px] uppercase tracking-widest"
              style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}
            >
              RCC Structure
            </p>
          </div>
          <p
            className="text-[17px] font-semibold mb-1"
            style={{ color: '#1E2227', fontFamily: 'var(--font-plex-serif)' }}
          >
            Your Vastu layout is complete.
          </p>
          <p
            className="text-[13px] leading-relaxed mb-4"
            style={{ color: 'rgba(30,34,39,0.62)', fontFamily: 'var(--font-plex-sans)' }}
          >
            The next step: know exactly what your RCC structure will cost before your contractor
            quotes you. Your plot dimensions are noted. The form takes 8 minutes.
          </p>
          <button
            className="px-5 py-2.5 rounded-[6px] text-[13px] font-semibold text-white"
            style={{ background: '#1F4E79', fontFamily: 'var(--font-plex-sans)' }}
          >
            Estimate My Structure Cost — StructurePro ₹499 →
          </button>
        </div>
      </div>
    </div>
  )
}
