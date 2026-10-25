// The VastuPro findings PDF. @react-pdf/renderer only. No rates, no cost: it is a reading of a plan, nothing more.
// What it holds: the plain statement of what the reading is, the counts, the plan with its zones and numbered doors and
// rooms, every finding with where the rule comes from, the plot notes, and then the appendices: how the plan was read step
// by step, the arithmetic behind each room's verdict, the table of entrance positions, the rule table that was used, and the
// books and sources with what could not be checked. The length follows the plan: more rooms, more pages.

import React from 'react'
import { Circle, Document, Line, Page, Polygon, Rect, Svg, Text, View } from '@react-pdf/renderer'
import { brahmasthan, minAreaRect, polygonCentroid, polygonArea, type Poly } from '@/app/tools/vastu-pro/vastu-geometry'
import { CENTRE_ALL, CENTRE_SHARE, CUTOFF, PADA_EDGE, workRoom, type RoomWorking } from '@/app/tools/vastu-pro/vastu-reading'
import { CATALOGUE } from '@/app/tools/vastu-pro/vastu-catalogue'
import { BORDERLINE_DEG, ZONE_SPAN } from '@/app/tools/vastu-pro/vastu-geometry'
import { PADA_RING, ROOM_RULES, SEV_SCORE, SIDE_FULL, SIDE_ORDER, SOURCES, ZONES, basisAt, type PadaTone, type RoomRule } from '@/app/tools/vastu-pro/vastu-rules'
import { BASIS_LABEL, SEVERITY_LABEL, SEVERITY_ORDER, type Basis, type Finding, type PlotNote, type Reading, type RemedySet, type Severity } from '@/app/tools/vastu-pro/vastu-types'
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
    <View style={[S.chk, { borderLeftWidth: 3, borderLeftColor: col }]} wrap={false}>
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

// ------------------------------------------------------------------------------------------------ appendix pieces

const pc = (x: number, dp = 1) => `${(x * 100).toFixed(dp)}%`
const RATING_WORD: Record<Severity, string> = { POSITIVE: 'Favoured', NEUTRAL: 'Acceptable', MODERATE: 'To review', CRITICAL: 'Cautioned' }
const RATING_MARK: Record<Severity, string> = { POSITIVE: 'F', NEUTRAL: 'A', MODERATE: 'R', CRITICAL: 'C' }
const RATING_BG: Record<Severity, string> = { POSITIVE: C.passBg, NEUTRAL: 'transparent', MODERATE: C.warnBg, CRITICAL: C.failBg }
const TONE_BG: Record<PadaTone, string> = { favourable: C.passBg, mixed: C.card, cautioned: C.warnBg }
/** What a room's own rule says about standing in the Brahmasthan, as a reading. */
const CENTRE_RULE_WORD: Record<RoomRule['centre'], Severity> = { open: 'POSITIVE', ok: 'NEUTRAL', avoid: 'MODERATE', 'avoid-serious': 'CRITICAL' }
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const A = {
  eyebrow: { fontFamily: 'IBMPlexMono', fontSize: 7.5, color: C.laterite, letterSpacing: 1.2, marginTop: 4 } as const,
  h3: { fontFamily: 'IBMPlexSerif', fontWeight: 700, fontSize: 10.5, marginTop: 12, marginBottom: 4 } as const,
  p: { fontSize: 8.6, color: C.ink2, lineHeight: 1.5, marginBottom: 5 } as const,
  cell: { fontSize: 7.6, lineHeight: 1.4, paddingVertical: 3, paddingHorizontal: 4 } as const,
  head: { fontFamily: 'IBMPlexMono', fontSize: 6.8, color: C.ink2, letterSpacing: 0.3, paddingVertical: 4, paddingHorizontal: 4 } as const,
}

function Step({ n, children }: { n: number; children: string }) {
  return (
    <View style={S.li} wrap={false}>
      <Text style={[S.liDot, { width: 14, color: C.laterite }]}>{n}.</Text>
      <Text style={S.liT}>{children}</Text>
    </View>
  )
}

/** The arithmetic behind one room's verdict, from the saved shares and the rule table. */
function RoomWork({ n, f, w, method }: { n: number; f: Finding; w: RoomWorking; method: string }) {
  const v = w.verdict
  const lines: string[] = []
  if (w.score === null) {
    lines.push('The whole room lies in the Brahmasthan, so the zones are not used.')
  } else {
    lines.push(`Sum of the contributions ${w.sum.toFixed(2)} points. Share outside the Brahmasthan: 100% − ${pc(w.centreShare)} = ${pc(w.outside)}. Score = ${w.sum.toFixed(2)} ÷ ${w.outside.toFixed(4)} = ${w.score.toFixed(2)} out of 100, which reads ${v.fromZones ? RATING_WORD[v.fromZones] : 'none'} from the zones alone (cut-offs in Appendix ${method}, step 7).`)
  }
  if (v.centred) {
    lines.push(`${pc(CENTRE_ALL, 0)} or more of the room lies in the Brahmasthan, so its zone is not read. The rule for this kind of room in the centre reads ${RATING_WORD[CENTRE_RULE_WORD[w.centreRule]]}.`)
  } else if (w.centreShare >= CENTRE_SHARE && (w.centreRule === 'avoid' || w.centreRule === 'avoid-serious')) {
    lines.push(`${pc(CENTRE_SHARE, 0)} or more of the room lies in the Brahmasthan, where this kind of room is advised against (${RATING_WORD[CENTRE_RULE_WORD[w.centreRule]]}). The worse of the two readings is taken: ${RATING_WORD[v.afterCentre]}.`)
  }
  if (v.basis !== 'classical' && v.afterCentre === 'CRITICAL') {
    lines.push(`This rule stands on “${BASIS_LABEL[v.basis]}”, not on the traditional texts, so it is not allowed to read “Cautioned”. Lowered to ${RATING_WORD[v.final]}.`)
  }
  lines.push(`Verdict: ${RATING_WORD[v.final]}. This matches finding ${n} in the report.`)
  return (
    <View style={{ marginBottom: 8 }} wrap={false}>
      <Text style={A.h3}>{n}. {f.label} <Text style={{ fontWeight: 400, fontSize: 8, color: C.ink3 }}>· rule basis here: {BASIS_LABEL[v.basis]}</Text></Text>
      <View style={S.tbl}>
        <View style={[S.tr, S.trHead]} wrap={false}>
          <Text style={[A.head, { flex: 4.2 }]}>ZONE</Text>
          <Text style={[A.head, { flex: 1.5, textAlign: 'right' }]}>SHARE</Text>
          <Text style={[A.head, { flex: 2, textAlign: 'center' }]}>RATING</Text>
          <Text style={[A.head, { flex: 1.3, textAlign: 'right' }]}>POINTS</Text>
          <Text style={[A.head, { flex: 2, textAlign: 'right' }]}>CONTRIBUTION</Text>
        </View>
        {w.rows.map((r, i) => (
          <View key={i} style={[S.tr, i === w.rows.length - 1 && w.centreShare < 0.0005 ? S.trLast : {}]} wrap={false}>
            <Text style={[A.cell, { flex: 4.2 }]}>{r.zone}</Text>
            <Text style={[A.cell, { flex: 1.5, textAlign: 'right' }]}>{pc(r.share)}</Text>
            <Text style={[A.cell, { flex: 2, textAlign: 'center', backgroundColor: r.rating ? RATING_BG[r.rating] : 'transparent' }]}>{r.rating ? RATING_WORD[r.rating] : ''}</Text>
            <Text style={[A.cell, { flex: 1.3, textAlign: 'right' }]}>{r.points === null ? '' : String(r.points)}</Text>
            <Text style={[A.cell, { flex: 2, textAlign: 'right' }]}>{r.part.toFixed(2)}</Text>
          </View>
        ))}
        {w.centreShare >= 0.0005 && (
          <View style={[S.tr, S.trLast]} wrap={false}>
            <Text style={[A.cell, { flex: 4.2 }]}>Brahmasthan (centre of the plan)</Text>
            <Text style={[A.cell, { flex: 1.5, textAlign: 'right' }]}>{pc(w.centreShare)}</Text>
            <Text style={[A.cell, { flex: 2, textAlign: 'center' }]}>handled separately</Text>
            <Text style={[A.cell, { flex: 1.3, textAlign: 'right' }]} />
            <Text style={[A.cell, { flex: 2, textAlign: 'right' }]} />
          </View>
        )}
      </View>
      <View style={{ marginTop: 3 }}><Bullets items={lines} /></View>
    </View>
  )
}

/** The 32 entrance positions of the boundary, with the main door's position marked. */
function RingTable({ at }: { at?: { side: 'E' | 'S' | 'W' | 'N'; index: number } }) {
  return (
    <View style={S.tbl} wrap={false}>
      <View style={[S.tr, S.trHead]}>
        {SIDE_ORDER.map(side => <Text key={side} style={[A.head, { flex: 1 }]}>{SIDE_FULL[side].toUpperCase()} SIDE</Text>)}
      </View>
      {Array.from({ length: 8 }, (_, i) => (
        <View key={i} style={[S.tr, i === 7 ? S.trLast : {}]}>
          {SIDE_ORDER.map(side => {
            const p = PADA_RING[side][i]
            const mine = !!at && at.side === side && at.index === i
            return (
              <Text key={side} style={[A.cell, { flex: 1, backgroundColor: TONE_BG[p.tone], fontWeight: mine ? 700 : 400 }]}>
                {i + 1}. {p.name}{mine ? '  [your door]' : ''}
              </Text>
            )
          })}
        </View>
      ))}
    </View>
  )
}

/** One row per kind of room or door in the reading: how the rule table rates each of the 16 zones. */
function RuleGrid({ kinds }: { kinds: string[] }) {
  return (
    <View style={S.tbl}>
      <View style={[S.tr, S.trHead]} wrap={false}>
        <Text style={[A.head, { flex: 5.4 }]}>ROOM OR DOOR</Text>
        {ZONES.map(z => <Text key={z.index} style={[A.head, { flex: 1, textAlign: 'center', paddingHorizontal: 0.5 }]}>{z.short}</Text>)}
      </View>
      {kinds.map((k, i) => {
        const rule = ROOM_RULES[k]
        return (
          <View key={k} style={[S.tr, i === kinds.length - 1 ? S.trLast : {}]} wrap={false}>
            <Text style={[A.cell, { flex: 5.4, fontWeight: 700 }]}>{CATALOGUE[k]?.label ?? k}</Text>
            {rule.zones.map((sev, z) => (
              <Text key={z} style={[A.cell, { flex: 1, textAlign: 'center', paddingHorizontal: 0.5, backgroundColor: RATING_BG[sev], fontFamily: 'IBMPlexMono', fontSize: 7 }]}>{RATING_MARK[sev]}</Text>
            ))}
          </View>
        )
      })}
    </View>
  )
}

// ------------------------------------------------------------------------------------------------ the document

export default function VastuReportPDF({ name, reportId, date, northDeg, house, items, doors, reading }: VastuPDFProps) {
  const dateText = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
  const { findings, plot, counts, missing, basisNotes } = reading

  // Worst first, then the heavier rule first. The number on the plan matches the number of the finding.
  const ordered = [...findings].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) || b.weight - a.weight)
  const numberOf = new Map<string, number>(ordered.map((f, i) => [f.id, i + 1]))
  const sevOf = new Map<string, Severity>(ordered.map(f => [f.id, f.severity]))
  const plotCounted = plot.filter(p => p.counted)
  const plotInfo = plot.filter(p => !p.counted)

  // The geometry the appendix quotes, rebuilt here from the outline so the numbers are the plan's own.
  const ref = minAreaRect(house)
  const fill = polygonArea(house) / Math.max(polygonArea(ref), 1e-9)
  const completed = fill < 0.97

  // The working for each room. If a worked verdict ever disagrees with the reported one, the block is left out and logged.
  const works: { n: number; f: Finding; w: RoomWorking }[] = []
  ordered.forEach((f, i) => {
    const w = workRoom(f)
    if (!w) return
    if (w.verdict.final !== f.severity) {
      console.error(`[CRITICAL][NS-CALC] VastuPro working for ${f.id} (${w.verdict.final}) disagrees with the reported verdict (${f.severity}); left out of the report.`)
      return
    }
    works.push({ n: i + 1, f, w })
  })
  const doorFindings = ordered.map((f, i) => ({ n: i + 1, f })).filter(o => o.f.shares.every(x => x === 0) && o.f.centreShare === undefined)
  const mainDoor = doorFindings.find(o => o.f.kind === 'main_door')
  // Appendix letters follow what is printed: the table of entrance positions only appears when there is a main door.
  const L = { method: 'A', work: 'B', ring: mainDoor ? 'C' : '', rules: mainDoor ? 'D' : 'C', sources: mainDoor ? 'E' : 'D' }

  // Which kinds of rule were used, once each, in the order they first appear.
  const kinds: string[] = []
  for (const f of ordered) if (ROOM_RULES[f.kind] && !kinds.includes(f.kind)) kinds.push(f.kind)
  const byBasis: Record<Basis, number> = { classical: 0, taught: 0, modern: 0 }
  for (const f of ordered) byBasis[f.basis]++
  for (const n of plotCounted) byBasis[n.basis]++

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
            It is a reading of your plan against the rules that the old Vastu texts and today’s teachers give. It is not a structural or safety check, and it does not say what will happen to anyone who lives there: no text or study shows that a layout decides health, money or luck. Some rules are old and widely repeated, some are only taught today, and a few are modern habits. Each finding says which, and says where teachers disagree. The last pages show the working and name every book and source the rules rest on.
          </Text>
        </View>

        <Text style={S.h2}>Summary</Text>
        <View style={S.totals}>
          <Tot k="CAUTIONED" v={String(counts.CRITICAL)} u="" r="the old texts caution" />
          <Tot k="TO REVIEW" v={String(counts.MODERATE)} u="" r="worth a second look" />
          <Tot k="ACCEPTABLE" v={String(counts.NEUTRAL)} u="" r="no concern raised" />
          <Tot k="FAVOURED" v={String(counts.POSITIVE)} u="" r="as the texts prefer" last />
        </View>
        <Text style={S.note}>
          There is no overall mark out of 100: no text gives one, and a single number would hide which rules sit behind it. “Cautioned” is used only where the traditional texts themselves caution against a placement. Where only today’s teachers or a recent habit say so, the most a finding can read is “To review”.
          {missing.length > 0 ? ` Not on the plan yet: ${missing.join(', ')}. The reading is provisional until they are.` : ''}
        </Text>

        <View wrap={false}>
          <Text style={S.h2}>Your plan</Text>
          <Text style={S.h2s}>The 16 zones are turned so that N points the way North lies on your drawing. Squares are doors, circles are rooms; the number matches the finding that follows. The green centre is the Brahmasthan.</Text>
          <View style={{ alignItems: 'center' }}>
            <Sheet size={225} northDeg={northDeg} house={house} items={items} doors={doors} numberOf={numberOf} sevOf={sevOf} />
          </View>
        </View>
      </Page>

      <Page size="A4" style={S.page}>
        <Chrome tool="VastuPro" tag="FREE" reportId={reportId} />
        <Text style={S.h2}>Door and room by room</Text>
        <Text style={S.h2s}>Cautioned first, then to review, acceptable and favoured. Zone names run from N through NNW around the compass.</Text>
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

        <View style={S.callout} wrap={false}>
          <Text style={S.calloutT}>Layout settled? Next, the frame.</Text>
          <Text style={S.calloutP}>
            StructurePro works out the cement, steel and concrete the frame of your house will need, from a few plain questions about your plot and plan. The first look is free at nirmanshastra.in/tools/structopro.
          </Text>
        </View>
      </Page>

      {/* ------------------------------------------------------------------------------------ appendices */}
      <Page size="A4" style={S.page}>
        <Chrome tool="VastuPro" tag="FREE" reportId={reportId} />
        <Text style={A.eyebrow}>APPENDIX {L.method}</Text>
        <Text style={[S.title, { fontSize: 20 }]}>How your plan was read</Text>
        <Text style={S.project}>The method, step by step, with the numbers of your own plan</Text>

        <View style={S.callout} wrap={false}>
          <Text style={S.calloutT}>Why this appendix is here</Text>
          <Text style={S.calloutP}>
            So that anyone who knows Vastu can check how each verdict was reached, and see which book or teaching each rule comes from. The reading is a set of fixed rules applied to the plan you drew. Nothing in it is a prediction and nothing was decided by judgement on the day: the same plan always gives the same reading ({reading.rulesVersion}).
          </Text>
        </View>

        <Text style={A.h3}>The steps</Text>
        <Step n={1}>{`North. You set North at ${Math.round(northDeg)}° clockwise from the top of the drawing. Every direction below is measured from that line.`}</Step>
        <Step n={2}>{`The outline. Your outline fills ${pc(fill, 0)} of the smallest rectangle that holds it. ${completed ? 'It is less than 97%, so the zones are read from that completed rectangle, as practitioners do for an L-shaped or cut plot.' : 'It is 97% or more, so the outline is treated as a rectangle.'}`}</Step>
        <Step n={3}>{'The centre. The centre of the rectangle is the centre of the plan. The Brahmasthan is the middle ninth of the rectangle (one third of each side). Brihat Samhita and Mayamata both treat the centre as the part to keep open.'}</Step>
        <Step n={4}>{`The 16 zones. The compass is cut into 16 equal zones of ${ZONE_SPAN}° around the centre, N first, going clockwise (the table below). This 16-way split is a modern convention. The older texts divide the boundary into 32 positions, which is how the main door is read (step 8).`}</Step>
        <Step n={5}>{'Rooms. Each room is a rectangle you placed. Its area is sampled on a grid of 40 × 40 points; each point is sorted into a zone by its bearing from the centre, or counted as inside the Brahmasthan. A room’s share in a zone is its points in that zone ÷ all its points. So a room that straddles two zones says so.'}</Step>
        <Step n={6}>{`The rule table. For each kind of room the table (Appendix ${L.rules}) gives a rating for each of the 16 zones: Favoured, Acceptable, To review or Cautioned, and says whether the rule rests on the traditional texts, on teaching today, or on a modern convention.`}</Step>
        <Step n={7}>{`The verdict for a room. Each zone’s rating is turned into points (Favoured ${SEV_SCORE.POSITIVE}, Acceptable ${SEV_SCORE.NEUTRAL}, To review ${SEV_SCORE.MODERATE}, Cautioned ${SEV_SCORE.CRITICAL}). Score = the sum of (share of the room in a zone × points) ÷ the share of the room outside the Brahmasthan. The cut-offs are ${CUTOFF.favoured}, ${CUTOFF.acceptable} and ${CUTOFF.review}; they are this tool’s own choice, not taken from any text. Then the Brahmasthan rule applies: a room that is ${pc(CENTRE_ALL, 0)} or more inside it is read by its centre rule alone; one that is ${pc(CENTRE_SHARE, 0)} or more inside it, of a kind advised against in the centre, takes the worse reading. Last, a rule that does not rest on the traditional texts is not allowed to read “Cautioned”: it is lowered to “To review”. The working for every room is in Appendix ${L.work}.`}</Step>
        <Step n={8}>{`The doors. The main door is read twice. First by its position on the boundary: the ray from the centre through the door meets the boundary of the rectangle, and the side is divided into nine equal parts; ${L.ring ? `the table in Appendix ${L.ring}` : 'the table of the 32 positions'} gives each position its name and its rating in the translation of Brihat Samhita we read (favourable = Favoured, mixed = Acceptable, cautioned = To review). Second by direction: where the door lies from the centre in the 16 zones, rated as teachers do today. A direction teachers rate “Cautioned” lowers the position’s rating by one step, never below “To review”. A position within ${pc(PADA_EDGE, 0)} of the line between two positions is marked borderline and the next position is shown. The back door and side door are read by direction alone.`}</Step>
        <Step n={9}>{`Borderline. A door or room whose middle is within ${BORDERLINE_DEG}° of a zone line is marked borderline, and the reading from the other side of the line is shown, because a small error in North could change it.`}</Step>
        <Step n={10}>{'The plot. A missing corner, an irregular outline, and the setting of the plot are noted separately, with the same labels for where each comes from.'}</Step>

        <View wrap={false}>
        <Text style={A.h3}>The 16 zones, turned to your North</Text>
        <View style={S.tbl}>
          <View style={[S.tr, S.trHead]} wrap={false}>
            <Text style={[A.head, { flex: 1.6 }]}>ZONE</Text>
            <Text style={[A.head, { flex: 2.4 }]}>NAME</Text>
            <Text style={[A.head, { flex: 2.8, textAlign: 'right' }]}>BEARING ON YOUR DRAWING</Text>
            <Text style={[A.head, { flex: 2 }]}>  GUARDIAN</Text>
          </View>
          {ZONES.map((z, i) => {
            const from = (((northDeg + i * ZONE_SPAN - ZONE_SPAN / 2) % 360) + 360) % 360
            const to = (from + ZONE_SPAN) % 360
            return (
              <View key={z.index} style={[S.tr, i === ZONES.length - 1 ? S.trLast : {}]} wrap={false}>
                <Text style={[A.cell, { flex: 1.6, fontWeight: 700 }]}>{z.short}</Text>
                <Text style={[A.cell, { flex: 2.4 }]}>{z.full}</Text>
                <Text style={[A.cell, { flex: 2.8, textAlign: 'right' }]}>{from.toFixed(2)}° to {to.toFixed(2)}°</Text>
                <Text style={[A.cell, { flex: 2, paddingLeft: 8 }]}>{z.lord ?? ''}</Text>
              </View>
            )
          })}
        </View>
        <Text style={S.note}>Bearings are clockwise from the top of your drawing. The guardians (dikpalas) are named only for the eight main directions, as usually listed.</Text>
        </View>

        <Text style={A.h3}>Notes on the reading</Text>
        <Bullets items={basisNotes} />
      </Page>

      <Page size="A4" style={S.page}>
        <Chrome tool="VastuPro" tag="FREE" reportId={reportId} />
        <Text style={A.eyebrow}>APPENDIX {L.work}</Text>
        <Text style={[S.title, { fontSize: 20 }]}>The working, room by room</Text>
        <Text style={S.project}>Every verdict rebuilt from the saved shares and the rule table</Text>
        <Text style={A.p}>
          The share of each room in each zone is what the plan measured. The rating of each zone is taken from the rule table (Appendix {L.rules}). Each contribution is share × points. Figures are shown rounded; the sums were done at full precision, so re-keying the rounded figures by hand can differ in the last digit. Every block ends by checking that the worked verdict equals the verdict printed in the report.
        </Text>
        {works.map(o => <RoomWork key={o.f.id} n={o.n} f={o.f} w={o.w} method={L.method} />)}
        {works.length === 0 && <Text style={S.note}>No rooms were placed on the plan, so there is no room working to show.</Text>}
        {doorFindings.length > 0 && (
          <>
            <Text style={A.h3}>Doors</Text>
            <Text style={A.p}>A door has no area, so it is read at a point. The lines below are the working printed with each door’s finding.</Text>
            {doorFindings.map(o => (
              <View key={o.f.id} style={{ marginBottom: 6 }} wrap={false}>
                <Text style={[A.cell, { fontWeight: 700, paddingHorizontal: 0 }]}>{o.n}. {o.f.label}: {SEVERITY_LABEL[o.f.severity]}</Text>
                <Bullets items={o.f.detail} />
              </View>
            ))}
          </>
        )}
      </Page>

      {mainDoor && (
      <Page size="A4" style={S.page}>
        <Chrome tool="VastuPro" tag="FREE" reportId={reportId} />
        <Text style={A.eyebrow}>APPENDIX {L.ring}</Text>
        <Text style={[S.title, { fontSize: 20 }]}>The 32 entrance positions</Text>
        <Text style={S.project}>What the main door is checked against</Text>
        <Text style={A.p}>
          Brihat Samhita, chapter 53, names the 32 guardians of the boundary of the Vastu grid and says which positions of a door are good or bad. Each side of the plot is divided into nine equal parts; the first is the corner the side starts from, and the ninth is the corner it ends on, which is the first position of the next side. The ring is read clockwise from the north-east corner: east side, south side, west side, north side.
        </Text>
        <RingTable at={mainDoor?.f.pada} />
        <View style={{ flexDirection: 'row', marginTop: 5 }}>
          <Text style={[A.cell, { backgroundColor: C.passBg, paddingHorizontal: 6 }]}>Favourable</Text>
          <Text style={[A.cell, { backgroundColor: C.card, paddingHorizontal: 6, marginLeft: 4 }]}>Mixed</Text>
          <Text style={[A.cell, { backgroundColor: C.warnBg, paddingHorizontal: 6, marginLeft: 4 }]}>Cautioned</Text>
        </View>
        <View style={S.callout} wrap={false}>
          <Text style={S.calloutT}>Read this before relying on the table</Text>
          <Text style={S.calloutP}>
            The names and ratings above come from one English translation (N. Chidambaram Iyer, 1884), read through online copies. They have not yet been checked against a printed edition (for example Bhat’s, from Motilal Banarsidass) or against Dagens’s translation of Mayamata. The names of the corner positions differ between Brihat Samhita and Mayamata, and the translation lists the west side in reverse order. The table gives 7 favourable, 2 mixed and 23 cautioned positions; another reader of the same translation reports the same count. Treat a main-door position as a reading of this translation, not as “per verse”. Because the table has not been checked against a printed edition, a position it calls cautioned is shown as “To review” and never as “Cautioned”. Where the door’s position cannot be read (a plot that sits diagonally to the compass), only its direction is rated and the finding says so.
          </Text>
        </View>
      </Page>
      )}

      <Page size="A4" style={S.page}>
        <Chrome tool="VastuPro" tag="FREE" reportId={reportId} />
        <Text style={A.eyebrow}>APPENDIX {L.rules}</Text>
        <Text style={[S.title, { fontSize: 20 }]}>The rule table behind this reading</Text>
        <Text style={S.project}>What each kind of room or door was checked against, and where each rule comes from</Text>

        <Text style={A.h3}>How each zone is rated</Text>
        <Text style={A.p}>F = Favoured, A = Acceptable, R = To review, C = Cautioned. The columns run clockwise from N. Only the kinds of room and door on your plan are shown.</Text>
        <RuleGrid kinds={kinds} />

        <Text style={A.h3}>Where the labels come from</Text>
        <Bullets items={[
          `${BASIS_LABEL.classical}: the rule is stated in the traditional texts we read. For a rule that names only some places, the label holds in those places only; elsewhere the same rule is shown as “${BASIS_LABEL.taught}”.`,
          `${BASIS_LABEL.taught}: documented as established practice in Vastu manuals and by teachers today, but not found in the older texts we read.`,
          `${BASIS_LABEL.modern}: a recent convention with no basis in the texts. It never reads worse than “To review”.`,
          `In your reading: ${plural(byBasis.classical, 'finding rests', 'findings rest')} on the traditional texts, ${byBasis.taught} on teaching today and ${byBasis.modern} on modern convention.`,
        ]} />

        <Text style={A.h3}>Rule by rule</Text>
        {kinds.map(k => {
          const rule = ROOM_RULES[k]
          const named = rule.named && rule.named.length > 0 ? rule.named.map(z => ZONES[z].short).join(', ') : ''
          const mine = ordered.filter(f => f.kind === k)
          return (
            <View key={k} style={[S.chk, { borderLeftWidth: 3, borderLeftColor: C.line }]} wrap={false}>
              <View style={S.chkB}>
                <Text style={S.chkC}>{BASIS_LABEL[rule.basis].toUpperCase()}{rule.source ? ` · ${rule.source}` : ''}</Text>
                <Text style={S.chkT}>{CATALOGUE[k]?.label ?? k}</Text>
                <Text style={S.chkD}>The rule. {rule.principle}</Text>
                <Text style={S.chkD}>Preferred: {rule.prefer}.</Text>
                {named ? <Text style={S.chkD}>The traditional texts speak of these zones: {named}. Elsewhere this rule is shown as “{BASIS_LABEL.taught}”.</Text> : null}
                {rule.disputed ? <Text style={S.chkD}>Where teachers differ. {rule.disputed}</Text> : null}
                {rule.practical ? <Text style={S.chkD}>A practical reason. {rule.practical}</Text> : null}
                <Text style={S.chkD}>Used for finding{mine.length !== 1 ? 's' : ''} {mine.map(f => numberOf.get(f.id)).join(', ')}. {basisAt(rule, -1) !== rule.basis ? 'In the centre of the plan this rule is shown as ' + BASIS_LABEL[basisAt(rule, -1)] + '.' : ''}</Text>
              </View>
            </View>
          )
        })}
      </Page>

      <Page size="A4" style={S.page}>
        <Chrome tool="VastuPro" tag="FREE" reportId={reportId} />
        <Text style={A.eyebrow}>APPENDIX {L.sources}</Text>
        <Text style={[S.title, { fontSize: 20 }]}>Books and sources</Text>
        <Text style={S.project}>What each rule was taken from, how we read it, and what we could not check</Text>

        {SOURCES.map(src => (
          <View key={src.work} style={{ marginBottom: 6 }} wrap={false}>
            <Text style={{ fontWeight: 700, fontSize: 8.8 }}>{src.work}</Text>
            <Text style={S.chkD}>{src.note}</Text>
          </View>
        ))}

        <Text style={A.h3}>What we could not check</Text>
        <Bullets items={[
          `The 32 entrance positions come from one translation read online. They have not been checked against a printed edition${L.ring ? ` (see Appendix ${L.ring})` : ''}.`,
          'Mayamata was read through online reposts of Dagens’s translation and in a 2024 study, not in the printed edition. Samarangana Sutradhara was read through a digest. Chakrabarti’s book was read through reviews and excerpts, not the whole.',
          'No single old text gives a rating for every room in each of 16 directions. Those grids are compiled from the texts where they speak and from today’s published Vastu manuals where they do not. That is why most room rules carry the label “Widely taught today”.',
          'The old texts do state outcomes for some placements. This reading does not repeat them, because no controlled study we could find shows that a layout affects health, wealth or relationships.',
          'The cut-offs, the points per rating and the weights used to order the findings are this tool’s own choices, not taken from any text.',
          'The rule table has not been reviewed by a practising Vastu scholar. Teachers differ widely; where we know of a disagreement the finding says so, but we may not know of all of them.',
        ]} />

        <Text style={A.h3}>What this reading does not cover</Text>
        <Bullets items={[
          'It is not a structural or safety check. The strength of a building rests on the structural engineer’s drawings and the IS codes, not on this reading.',
          'It reads a plan you drew. It does not see the site, the slope of the land, the roads around it, or the true position of North unless you set it correctly.',
          'The old texts speak of a house standing on its own plot. In a flat, treat the reading as a rough guide against the flat’s own outline.',
          'It does not replace a consultation. If you wish to act on a finding, speak to a Vastu practitioner you trust and to your architect before moving any wall or pipe.',
        ]} />

        <Text style={S.small}>
          Made from the plan you drew on nirmanshastra.in and not stored. {reading.rulesVersion}. Report {reportId}, {dateText}.
        </Text>
      </Page>
    </Document>
  )
}
