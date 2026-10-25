// The VastuPro findings PDF. @react-pdf/renderer only. No rates, no cost: it is a reading of a plan, nothing more.
// What it holds: the plain statement of what the reading is, the counts and index, the plan with its zones and numbered
// doors and rooms, every finding with where the rule comes from, the plot notes, how the reading was made and the sources.

import React from 'react'
import { Circle, Document, Line, Page, Polygon, Rect, Svg, Text, View } from '@react-pdf/renderer'
import { brahmasthan, minAreaRect, polygonCentroid, polygonArea, type Poly } from '@/app/tools/vastu-pro/vastu-geometry'
import { SOURCES, ZONES } from '@/app/tools/vastu-pro/vastu-rules'
import { BASIS_LABEL, SEVERITY_LABEL, SEVERITY_ORDER, type Finding, type PlotNote, type Reading, type RemedySet, type Severity } from '@/app/tools/vastu-pro/vastu-types'
import type { DoorMark, PlacedItem } from '@/app/tools/vastu-pro/vastu-model'
import { SHEET_UNITS } from '@/app/tools/vastu-pro/vastu-model'
import { C, Chrome, S, Tot, Bullets } from './qty-kit'

export interface VastuPDFProps {
  name: string
  reportId: string
  date: Date
  northDeg: number
  house: Poly
  items: PlacedItem[]
  doors: DoorMark[]
  reading: Reading
}

const SEV_C: Record<Severity, string> = { POSITIVE: C.pass, NEUTRAL: C.ink3, MODERATE: C.warn, CRITICAL: C.fail }

/** Distance from a point inside the square to its edge along a direction, with a margin. */
function reach(px: number, py: number, dx: number, dy: number, size: number, margin: number): number {
  const tx = Math.abs(dx) < 1e-9 ? Infinity : (dx > 0 ? size - margin - px : px - margin) / Math.abs(dx)
  const ty = Math.abs(dy) < 1e-9 ? Infinity : (dy > 0 ? size - margin - py : py - margin) / Math.abs(dy)
  return Math.max(0, Math.min(tx, ty))
}

const pts = (poly: Poly, k: number) => poly.map(p => `${(p.x * k).toFixed(1)},${(p.y * k).toFixed(1)}`).join(' ')

/** The plan: outline, completed rectangle, the 16 zones turned to North, the Brahmasthan, numbered doors and rooms. */
function Sheet({ size, northDeg, house, items, doors, numberOf, sevOf }: {
  size: number
  northDeg: number
  house: Poly
  items: PlacedItem[]
  doors: DoorMark[]
  numberOf: Map<string, number>
  sevOf: Map<string, Severity>
}) {
  const k = size / SHEET_UNITS
  const ref = minAreaRect(house)
  const c = polygonCentroid(ref)
  const cx = c.x * k
  const cy = c.y * k
  const core = brahmasthan(ref)
  const completed = polygonArea(house) < polygonArea(ref) * 0.97
  const nr = (northDeg * Math.PI) / 180

  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = nr + ((i * 22.5 - 11.25) * Math.PI) / 180
    const dx = Math.sin(a)
    const dy = -Math.cos(a)
    const t = reach(cx, cy, dx, dy, size, 2)
    return { i, x2: cx + dx * t, y2: cy + dy * t }
  })
  const labels = Array.from({ length: 16 }, (_, i) => {
    const a = nr + (i * 22.5 * Math.PI) / 180
    const dx = Math.sin(a)
    const dy = -Math.cos(a)
    const t = reach(cx, cy, dx, dy, size, 9)
    return { i, x: cx + dx * t, y: cy + dy * t, name: ZONES[i].short }
  })
  const arrowLen = size * 0.2
  const nx = cx + arrowLen * Math.sin(nr)
  const ny = cy - arrowLen * Math.cos(nr)

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={0} y={0} width={size} height={size} fill={C.card} stroke={C.line} strokeWidth={0.8} />
      {rays.map(r => (
        <Line key={`r${r.i}`} x1={cx} y1={cy} x2={r.x2} y2={r.y2} stroke={C.ink3} strokeWidth={0.45} strokeDasharray="2 3" />
      ))}
      {completed && <Polygon points={pts(ref, k)} fill="none" stroke={C.ink3} strokeWidth={0.8} strokeDasharray="3 3" />}
      <Polygon points={pts(house, k)} fill={C.paper} stroke={C.ink} strokeWidth={1.4} />
      <Polygon points={pts(core, k)} fill={C.passBg} stroke={C.pass} strokeWidth={0.8} />
      {items.map(it => {
        const sev = sevOf.get(it.id)
        const col = sev ? SEV_C[sev] : C.ink3
        return <Rect key={it.id} x={it.x * k} y={it.y * k} width={it.w * k} height={it.h * k} fill={col} fillOpacity={0.22} stroke={col} strokeWidth={1} />
      })}
      {labels.map(l => (
        <Text key={`l${l.i}`} x={l.x} y={l.y + 2.4} textAnchor="middle" fill={l.i === 0 ? C.laterite : C.ink2} style={{ fontFamily: 'IBMPlexMono', fontSize: l.i % 2 === 0 ? 7.5 : 6, fontWeight: 700 }}>
          {l.name}
        </Text>
      ))}
      <Line x1={cx} y1={cy} x2={nx} y2={ny} stroke={C.laterite} strokeWidth={1.6} />
      <Circle cx={nx} cy={ny} r={2.2} fill={C.laterite} />
      {items.map(it => {
        const n = numberOf.get(it.id)
        if (!n) return null
        const sev = sevOf.get(it.id)
        const col = sev ? SEV_C[sev] : C.ink3
        const x = (it.x + it.w / 2) * k
        const y = (it.y + it.h / 2) * k
        return (
          <React.Fragment key={`n${it.id}`}>
            <Circle cx={x} cy={y} r={6.5} fill={col} stroke="#FFFFFF" strokeWidth={0.8} />
            <Text x={x} y={y + 2.4} textAnchor="middle" fill="#FFFFFF" style={{ fontFamily: 'IBMPlexMono', fontSize: 7, fontWeight: 700 }}>{String(n)}</Text>
          </React.Fragment>
        )
      })}
      {doors.map(d => {
        const n = numberOf.get(d.id)
        if (!n) return null
        const sev = sevOf.get(d.id)
        const col = sev ? SEV_C[sev] : C.ink
        const x = d.pt.x * k
        const y = d.pt.y * k
        return (
          <React.Fragment key={`d${d.id}`}>
            <Rect x={x - 6.5} y={y - 6.5} width={13} height={13} fill={col} stroke="#FFFFFF" strokeWidth={0.8} />
            <Text x={x} y={y + 2.4} textAnchor="middle" fill="#FFFFFF" style={{ fontFamily: 'IBMPlexMono', fontSize: 7, fontWeight: 700 }}>{String(n)}</Text>
          </React.Fragment>
        )
      })}
    </Svg>
  )
}

function Remedy({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <View style={{ marginTop: 5 }}>
      <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: C.ink3, letterSpacing: 0.6, marginBottom: 2.5 }}>{title.toUpperCase()}</Text>
      <Bullets items={items} />
    </View>
  )
}

function Remedies({ r, dos, donts }: { r: RemedySet; dos: string[]; donts: string[] }) {
  return (
    <>
      <Remedy title="Without building work" items={r.practical} />
      <Remedy title="If you can still change the plan" items={r.structural} />
      <Remedy title="Usually advised" items={dos} />
      <Remedy title="Usually advised against" items={donts} />
    </>
  )
}

function FindingBlock({ f, n }: { f: Finding; n: number }) {
  const col = SEV_C[f.severity]
  return (
    <View style={[S.chk, { borderLeftWidth: 3, borderLeftColor: col }]}>
      <Text style={[S.chkS, { color: col, width: 22 }]}>{n}</Text>
      <View style={S.chkB}>
        <Text style={S.chkC}>{f.zoneText.toUpperCase()}{f.alsoText ? `, ${f.alsoText.toUpperCase()}` : ''} · {SEVERITY_LABEL[f.severity].toUpperCase()}</Text>
        <Text style={S.chkT}>{f.label}</Text>
        <Text style={[S.chkD, { color: C.ink, fontWeight: 700 }]}>{f.headline}</Text>
        <Text style={S.chkD}>{f.tradition}</Text>
        {f.detail.length > 0 && <View style={{ marginTop: 3 }}><Bullets items={f.detail} /></View>}
        {f.borderline && f.altSeverity && f.altSeverity !== f.severity && (
          <Text style={S.chkD}>Close to a zone line: read from the other side of it, this would be {SEVERITY_LABEL[f.altSeverity].toLowerCase()}. Check against a measured plan before acting.</Text>
        )}
        {f.disputed && <Text style={S.chkD}>Teachers differ. {f.disputed}</Text>}
        {f.practical && <Text style={S.chkD}>A practical reason. {f.practical}</Text>}
        <Text style={[S.chkC, { marginTop: 3 }]}>{BASIS_LABEL[f.basis].toUpperCase()}{f.source ? ` · ${f.source}` : ''}</Text>
        {f.severity !== 'POSITIVE' && <Remedies r={f.remedies} dos={f.dos} donts={f.donts} />}
      </View>
    </View>
  )
}

function PlotBlock({ n }: { n: PlotNote }) {
  const col = SEV_C[n.severity]
  return (
    <View style={[S.chk, { borderLeftWidth: 3, borderLeftColor: col }]} wrap={false}>
      <View style={S.chkB}>
        <Text style={S.chkC}>{(n.counted ? SEVERITY_LABEL[n.severity] : 'For your information').toUpperCase()} · {BASIS_LABEL[n.basis].toUpperCase()}</Text>
        <Text style={S.chkT}>{n.title}</Text>
        <Text style={S.chkD}>{n.text}</Text>
        {n.remedies && <Remedies r={n.remedies} dos={[]} donts={[]} />}
      </View>
    </View>
  )
}

export default function VastuReportPDF({ name, reportId, date, northDeg, house, items, doors, reading }: VastuPDFProps) {
  const dateText = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
  const { findings, plot, score, range, counts, missing, basisNotes } = reading

  // Worst first, then the heavier rule first. The number on the plan matches the number of the finding.
  const ordered = [...findings].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) || b.weight - a.weight)
  const numberOf = new Map<string, number>(ordered.map((f, i) => [f.id, i + 1]))
  const sevOf = new Map<string, Severity>(ordered.map(f => [f.id, f.severity]))
  const plotCounted = plot.filter(p => p.counted)
  const plotInfo = plot.filter(p => !p.counted)

  return (
    <Document title={`VastuPro reading ${reportId}`} author="NirmanShastra" subject="Vastu reading of a home plan" language="en-IN">
      <Page size="A4" style={S.page}>
        <Chrome tool="VastuPro" tag="FREE" reportId={reportId} />

        <Text style={S.eyebrow}>VASTU READING</Text>
        <Text style={S.title}>Vastu reading of your home plan</Text>
        <Text style={S.project}>Door by door and room by room, with where each rule comes from</Text>

        <View style={S.metaRow}>
          <View style={S.metaCol}><Text style={S.metaK}>PREPARED FOR</Text><Text style={S.metaV}>{name || 'Owner'}</Text></View>
          <View style={S.metaCol}><Text style={S.metaK}>NORTH</Text><Text style={S.metaV}>{Math.round(northDeg)}° from the top</Text></View>
          <View style={S.metaCol}><Text style={S.metaK}>READ</Text><Text style={S.metaV}>{items.length} room{items.length !== 1 ? 's' : ''}, {doors.length} door{doors.length !== 1 ? 's' : ''}</Text></View>
          <View style={S.metaCol}><Text style={S.metaK}>REPORT ID</Text><Text style={[S.metaV, { fontFamily: 'IBMPlexMono' }]}>{reportId}</Text></View>
          <View style={S.metaCol}><Text style={S.metaK}>DATE</Text><Text style={S.metaV}>{dateText}</Text></View>
        </View>

        <View style={S.callout} wrap={false}>
          <Text style={S.calloutT}>What this reading is, and is not</Text>
          <Text style={S.calloutP}>
            It is a reading of your plan against the rules that the old Vastu texts and today’s teachers give. It is not a structural or safety check, and it does not say what will happen to anyone who lives there: no text or study shows that a layout decides health, money or luck. Some rules are old and widely repeated, some are only taught today, and a few are modern habits. Each finding says which, and says where teachers disagree.
          </Text>
        </View>

        <Text style={S.h2}>Summary</Text>
        <View style={S.totals}>
          <Tot k="SERIOUS" v={String(counts.CRITICAL)} u="" r="to look at first" />
          <Tot k="TO REVIEW" v={String(counts.MODERATE)} u="" r="worth a second look" />
          <Tot k="ACCEPTABLE" v={String(counts.NEUTRAL)} u="" r="no concern raised" />
          <Tot k="FAVOURABLE" v={String(counts.POSITIVE)} u="" r="as the texts prefer" last />
        </View>
        <Text style={S.note}>
          {score === null
            ? 'Overall index: not given, because too little is on the plan for a fair number.'
            : `Overall index, a rough summary: ${score} out of 100${range && range[0] !== range[1] ? `, between ${range[0]} and ${range[1]} once the “to review” items are settled` : ''}. Doors, kitchen and toilets count most. The counts above are the real result.`}
          {missing.length > 0 ? ` Not on the plan yet: ${missing.join(', ')}. The reading is provisional until they are.` : ''}
        </Text>

        <View wrap={false}>
          <Text style={S.h2}>Your plan</Text>
          <Text style={S.h2s}>The 16 zones are turned so that N points the way North lies on your drawing. Squares are doors, circles are rooms; the number matches the finding that follows. The green centre is the Brahmasthan.</Text>
          <View style={{ alignItems: 'center' }}>
            <Sheet size={250} northDeg={northDeg} house={house} items={items} doors={doors} numberOf={numberOf} sevOf={sevOf} />
          </View>
        </View>
      </Page>

      <Page size="A4" style={S.page}>
        <Chrome tool="VastuPro" tag="FREE" reportId={reportId} />
        <Text style={S.h2}>Door and room by room</Text>
        <Text style={S.h2s}>Most serious first. Zone names run from N through NNW around the compass.</Text>
        {ordered.map((f, i) => <FindingBlock key={f.id} f={f} n={i + 1} />)}
        {ordered.length === 0 && <Text style={S.note}>Nothing on the plan could be read.</Text>}

        {plot.length > 0 && (
          <>
            {[...plotCounted, ...plotInfo].map((n, i) => (
              <View key={n.id} wrap={false}>
                {i === 0 && <Text style={S.h2}>About the plot itself</Text>}
                <PlotBlock n={n} />
              </View>
            ))}
          </>
        )}
      </Page>

      <Page size="A4" style={S.page}>
        <Chrome tool="VastuPro" tag="FREE" reportId={reportId} />
        <Text style={S.h2}>How this was read</Text>
        <Bullets items={basisNotes} />

        <Text style={S.h2}>Where the rules come from</Text>
        {SOURCES.map(s => (
          <View key={s.work} style={{ marginBottom: 5 }} wrap={false}>
            <Text style={{ fontWeight: 700, fontSize: 8.8 }}>{s.work}</Text>
            <Text style={S.chkD}>{s.note}</Text>
          </View>
        ))}
        <Text style={S.note}>Where the older texts and today’s teachers differ, the finding says so. Rules marked “Modern convention” never count as more than “to review”.</Text>

        <View style={S.callout} wrap={false}>
          <Text style={S.calloutT}>Layout settled? Next, the frame.</Text>
          <Text style={S.calloutP}>
            StructurePro works out the cement, steel and concrete the frame of your house will need, from a few plain questions about your plot and plan. The first look is free at nirmanshastra.in/tools/structopro.
          </Text>
        </View>

        <Text style={S.small}>
          Made from the plan you drew on nirmanshastra.in and not stored. {reading.rulesVersion}. If you are building, the strength and safety of the structure rest on the structural engineer’s drawings and the IS codes, not on this reading.
        </Text>
      </Page>
    </Document>
  )
}
