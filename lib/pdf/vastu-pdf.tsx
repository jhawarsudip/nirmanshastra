// The VastuPro findings PDF. @react-pdf/renderer only. No rates, no cost: it is a reading of a plan, nothing more.
// What it holds: the score, the plan with its 16 zones and numbered rooms, and the tradition's reading of every room.

import React from 'react'
import { Circle, Document, Line, Page, Path, Rect, Svg, Text, View } from '@react-pdf/renderer'
import { ZONES } from '@/app/tools/vastu-pro/vastu-data'
import type { Severity } from '@/app/tools/vastu-pro/vastu-data'
import type { PlacedMarker, VastuAnalysis } from '@/app/tools/vastu-pro/vastu-engine'
import { C, Chrome, S, Tot } from './qty-kit'

export interface VastuPDFProps {
  name: string
  reportId: string
  date: Date
  northDeg: number
  /** the marks as placed on the 480-unit sheet */
  markers: PlacedMarker[]
  analysis: VastuAnalysis
}

const SEV: Record<Severity, { c: string; label: string }> = {
  POSITIVE: { c: C.pass, label: 'POSITIVE' },
  NEUTRAL: { c: C.ink3, label: 'NEUTRAL' },
  MODERATE: { c: C.warn, label: 'MODERATE' },
  CRITICAL: { c: C.fail, label: 'CRITICAL' },
}

const SHEET_UNITS = 480

/** Distance from the centre of the square to its edge along a direction. */
function reach(dx: number, dy: number, half: number): number {
  const tx = Math.abs(dx) < 1e-9 ? Infinity : half / Math.abs(dx)
  const ty = Math.abs(dy) < 1e-9 ? Infinity : half / Math.abs(dy)
  return Math.min(tx, ty)
}

/** The plan sheet: the 16 zone rays turned by the North angle, the Brahmasthan, the North arrow and one numbered dot per room. */
function Sheet({ size, northDeg, dots }: { size: number; northDeg: number; dots: { n: number; x: number; y: number; sev: Severity }[] }) {
  const k = size / SHEET_UNITS
  const cx = size / 2
  const cy = size / 2
  const bR = size * 0.11
  const nr = (northDeg * Math.PI) / 180
  const arrowLen = size * 0.22

  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = nr + ((i * 22.5 - 11.25) * Math.PI) / 180
    const dx = Math.sin(a)
    const dy = -Math.cos(a)
    const t = reach(dx, dy, size / 2)
    return { i, x1: cx + dx * bR, y1: cy + dy * bR, x2: cx + dx * t, y2: cy + dy * t }
  })
  const labels = Array.from({ length: 16 }, (_, i) => {
    const a = nr + (i * 22.5 * Math.PI) / 180
    const dx = Math.sin(a)
    const dy = -Math.cos(a)
    const t = reach(dx, dy, size / 2) - 10
    return { i, x: cx + dx * t, y: cy + dy * t, name: ZONES[i].name }
  })

  // North arrow
  const nx = cx + arrowLen * Math.sin(nr)
  const ny = cy - arrowLen * Math.cos(nr)
  const ang = Math.atan2(ny - cy, nx - cx)
  const head = arrowLen * 0.17
  const hx1 = nx - head * Math.cos(ang - Math.PI / 6)
  const hy1 = ny - head * Math.sin(ang - Math.PI / 6)
  const hx2 = nx - head * Math.cos(ang + Math.PI / 6)
  const hy2 = ny - head * Math.sin(ang + Math.PI / 6)
  const nLabel = { x: cx + (arrowLen + 11) * Math.sin(nr), y: cy - (arrowLen + 11) * Math.cos(nr) }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={0} y={0} width={size} height={size} fill={C.card} stroke={C.line} strokeWidth={0.8} />
      <Line x1={cx} y1={0} x2={cx} y2={size} stroke={C.line} strokeWidth={0.6} />
      <Line x1={0} y1={cy} x2={size} y2={cy} stroke={C.line} strokeWidth={0.6} />
      {rays.map(r => (
        <Line key={`r${r.i}`} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={C.ink3} strokeWidth={0.5} strokeDasharray="2 3" />
      ))}
      <Circle cx={cx} cy={cy} r={bR} fill={C.passBg} stroke={C.pass} strokeWidth={1.2} />
      {labels.map(l => (
        <Text key={`l${l.i}`} x={l.x} y={l.y + 2.4} textAnchor="middle" fill={l.i === 0 ? C.laterite : C.ink2} style={{ fontFamily: 'IBMPlexMono', fontSize: l.i % 2 === 0 ? 7.5 : 6.5, fontWeight: 700 }}>
          {l.name}
        </Text>
      ))}
      <Line x1={cx} y1={cy} x2={nx} y2={ny} stroke={C.laterite} strokeWidth={1.6} />
      <Path d={`M ${nx} ${ny} L ${hx1} ${hy1} L ${hx2} ${hy2} Z`} fill={C.laterite} />
      <Text x={nLabel.x} y={nLabel.y + 3} textAnchor="middle" fill={C.laterite} style={{ fontFamily: 'IBMPlexMono', fontSize: 9, fontWeight: 700 }}>N</Text>
      {dots.map(d => (
        <React.Fragment key={d.n}>
          <Circle cx={d.x * k} cy={d.y * k} r={8} fill={SEV[d.sev].c} stroke="#FFFFFF" strokeWidth={0.9} />
          <Text x={d.x * k} y={d.y * k + 2.6} textAnchor="middle" fill="#FFFFFF" style={{ fontFamily: 'IBMPlexMono', fontSize: 7.5, fontWeight: 700 }}>{String(d.n)}</Text>
        </React.Fragment>
      ))}
    </Svg>
  )
}

export default function VastuReportPDF({ name, reportId, date, northDeg, markers, analysis }: VastuPDFProps) {
  const dateText = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
  const { findings, score, criticalCount, moderateCount, positiveCount, neutralCount } = analysis

  // Findings are sorted worst first. The dot on the plan carries the same number as its finding.
  const dots = findings.flatMap((f, i) => {
    const m = markers.find(x => x.key === f.markerKey)
    return m ? [{ n: i + 1, x: m.x, y: m.y, sev: f.severity }] : []
  })

  return (
    <Document title={`VastuPro findings ${reportId}`} author="NirmanShastra" subject="Vastu check of a home plan" language="en-IN">
      <Page size="A4" style={S.page}>
        <Chrome tool="VastuPro" tag="FREE" reportId={reportId} />

        <Text style={S.eyebrow}>VASTU FINDINGS</Text>
        <Text style={S.title}>Vastu check of your home plan</Text>
        <Text style={S.project}>Each room you marked, read by the zone it sits in</Text>

        <View style={S.metaRow}>
          <View style={S.metaCol}><Text style={S.metaK}>PREPARED FOR</Text><Text style={S.metaV}>{name || 'Owner'}</Text></View>
          <View style={S.metaCol}><Text style={S.metaK}>NORTH</Text><Text style={S.metaV}>{Math.round(northDeg)}° from the top</Text></View>
          <View style={S.metaCol}><Text style={S.metaK}>ROOMS READ</Text><Text style={S.metaV}>{markers.length}</Text></View>
          <View style={S.metaCol}><Text style={S.metaK}>REPORT ID</Text><Text style={[S.metaV, { fontFamily: 'IBMPlexMono' }]}>{reportId}</Text></View>
          <View style={S.metaCol}><Text style={S.metaK}>DATE</Text><Text style={S.metaV}>{dateText}</Text></View>
        </View>

        <Text style={S.h2}>Score</Text>
        <View style={S.totals}>
          <Tot k="VASTU SCORE" v={String(score)} u="/100" r="average of the room ratings" />
          <Tot k="CRITICAL" v={String(criticalCount)} u="rooms" r="rated 0" />
          <Tot k="MODERATE" v={String(moderateCount)} u="rooms" r="rated 40" />
          <Tot k="NEUTRAL" v={String(neutralCount)} u="rooms" r="rated 70" />
          <Tot k="POSITIVE" v={String(positiveCount)} u="rooms" r="rated 100" last />
        </View>

        <View style={S.callout} wrap={false}>
          <Text style={S.calloutT}>How to read this</Text>
          <Text style={S.calloutP}>
            Vastu Shastra is a traditional system of layout and orientation. It is not part of any BIS code, and it has no bearing on the strength or safety of the structure. Each reading below is what the tradition says about that room in that zone. Where a room sits is taken from where you marked it, measured around the centre of the plan.
          </Text>
        </View>

        <View wrap={false}>
          <Text style={S.h2}>Your plan</Text>
          <Text style={S.h2s}>The 16 zones are turned so that N points the way North lies on your drawing. The number on each dot is the number of its reading on the next page.</Text>
          <View style={{ alignItems: 'center' }}>
            <Sheet size={236} northDeg={northDeg} dots={dots} />
          </View>
        </View>
      </Page>

      <Page size="A4" style={S.page}>
        <Chrome tool="VastuPro" tag="FREE" reportId={reportId} />
        <Text style={S.h2}>Room by room</Text>
        <Text style={S.h2s}>Worst-rated first. Zone names run from N through NNW around the compass.</Text>
        {findings.map((f, i) => {
          const sev = SEV[f.severity]
          return (
            <View key={f.markerKey} style={[S.chk, { borderLeftWidth: 3, borderLeftColor: sev.c }]} wrap={false}>
              <Text style={[S.chkS, { color: sev.c, width: 22 }]}>{i + 1}</Text>
              <View style={S.chkB}>
                <Text style={S.chkC}>{f.zoneFull.toUpperCase()} ZONE ({f.zoneName}) · {sev.label}</Text>
                <Text style={S.chkT}>{f.roomLabel}</Text>
                <Text style={S.chkD}>{f.impact}</Text>
              </View>
            </View>
          )
        })}

        <Text style={S.small}>
          This is a free reading made from the marks you placed on your plan. It was not stored. The Vastu ratings are the tradition&apos;s, not an engineering assessment; if you are building, the strength and safety of the structure rest on the structural engineer&apos;s drawings and the IS codes, not on this reading.
        </Text>
      </Page>
    </Document>
  )
}
