// Grand Total Report — 12-page PDF — @react-pdf/renderer
// Combines all 5 phases into one master project summary.
// Design tokens from NirmanShastra_Design_Spec.md

import React from 'react'
import {
  Document,
  Font,
  Page,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
  Line,
} from '@react-pdf/renderer'

// ─── Font registration ────────────────────────────────────────────────────────
const CDN = 'https://cdn.jsdelivr.net/npm/@ibm/plex@6.4.0'

Font.register({
  family: 'IBMPlexMono',
  fonts: [
    { src: `${CDN}/IBM-Plex-Mono/fonts/complete/ttf/IBMPlexMono-Regular.ttf`, fontWeight: 400 },
    { src: `${CDN}/IBM-Plex-Mono/fonts/complete/ttf/IBMPlexMono-Medium.ttf`,  fontWeight: 500 },
    { src: `${CDN}/IBM-Plex-Mono/fonts/complete/ttf/IBMPlexMono-Bold.ttf`,    fontWeight: 700 },
  ],
})
Font.register({
  family: 'IBMPlexSerif',
  fonts: [
    { src: `${CDN}/IBM-Plex-Serif/fonts/complete/ttf/IBMPlexSerif-SemiBold.ttf`, fontWeight: 600 },
    { src: `${CDN}/IBM-Plex-Serif/fonts/complete/ttf/IBMPlexSerif-Bold.ttf`,     fontWeight: 700 },
  ],
})
Font.register({
  family: 'IBMPlexSans',
  fonts: [
    { src: `${CDN}/IBM-Plex-Sans/fonts/complete/ttf/IBMPlexSans-Regular.ttf`,  fontWeight: 400 },
    { src: `${CDN}/IBM-Plex-Sans/fonts/complete/ttf/IBMPlexSans-Medium.ttf`,   fontWeight: 500 },
    { src: `${CDN}/IBM-Plex-Sans/fonts/complete/ttf/IBMPlexSans-SemiBold.ttf`, fontWeight: 600 },
  ],
})
Font.registerHyphenationCallback(word => [word])

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  sheetWhite:    '#F4F4F0',
  ironInk:       '#1E2227',
  blueprint:     '#1F4E79',
  stampOxide:    '#8C3A22',
  approvedGreen: '#14532D',
  markingYellow: '#D99A06',
  inkA15:        '#D0D2D4',
  inkA35:        '#A8AAAD',
  inkA60:        '#788085',
  blueprintBg:   '#EBF0F7',
  greenBg:       '#E9F2EB',
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ContactInfo {
  name:    string
  email:   string
  mobile:  string
  city:    string
  state:   string
}

export interface PhaseEstimate {
  appType:     string
  projectName: string | null
  resultData:  Record<string, unknown>
}

export interface GrandTotalData {
  combinedTotal:  { basic: number; standard: number; premium: number }
  phaseBreakdown: { appType: string; basic: number; standard: number; premium: number }[]
}

interface Props {
  contact:     ContactInfo
  reportId:    string
  projectName: string
  date:        Date
  phases:      PhaseEstimate[]
  grandTotal:  GrandTotalData
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtLakhs(n: number): string {
  if (n >= 10_000_000) return `Rs.${(n / 10_000_000).toFixed(1)} Cr`
  if (n >= 100_000)    return `Rs.${(n / 100_000).toFixed(1)} L`
  return `Rs.${n.toLocaleString('en-IN')}`
}

function phaseLabel(appType: string): string {
  const map: Record<string, string> = {
    structopro:  'P1 — RCC Structure',
    masonpro:    'P2 — Masonry',
    electropro:  'P3 — Electrical',
    plumbpro:    'P4 — Plumbing',
    interiorpro: 'P5 — Interior',
  }
  return map[appType] ?? appType.toUpperCase()
}

function phaseShort(appType: string): string {
  const map: Record<string, string> = {
    structopro:  'StructurePro',
    masonpro:    'MasonryPro',
    electropro:  'ElectricalPro',
    plumbpro:    'PlumbingPro',
    interiorpro: 'InteriorPro',
  }
  return map[appType] ?? appType
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    backgroundColor: T.sheetWhite,
    padding: 28,
    fontFamily: 'IBMPlexSans',
    fontSize: 10,
    color: T.ironInk,
    flexDirection: 'column',
  },
  frame: {
    borderWidth: 1,
    borderColor: T.inkA15,
    flex: 1,
    padding: 20,
    flexDirection: 'column',
  },
  mono: { fontFamily: 'IBMPlexMono' },
  serif: { fontFamily: 'IBMPlexSerif' },
  eyebrow: {
    fontFamily: 'IBMPlexMono',
    fontSize: 8,
    color: T.blueprint,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: 'IBMPlexSerif',
    fontSize: 16,
    fontWeight: 700,
    color: T.ironInk,
    marginBottom: 14,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: T.inkA15,
    marginVertical: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: T.ironInk,
    paddingBottom: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: T.inkA15,
  },
  tableCell: { fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk },
  tableCellMono: { fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' },
  tableHeaderCell: { fontFamily: 'IBMPlexMono', fontSize: 8, color: T.inkA60, textTransform: 'uppercase', letterSpacing: 0.5 },
})

// ─── Reusable components ──────────────────────────────────────────────────────
function PageHeader({ title, subtitle, phase }: { title: string; subtitle: string; phase?: string }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 }}>
            {subtitle}
          </Text>
          <Text style={{ fontFamily: 'IBMPlexSerif', fontSize: 16, fontWeight: 700, color: T.ironInk }}>
            {title}
          </Text>
        </View>
        {phase && (
          <View style={{ borderWidth: 1, borderColor: T.blueprint, padding: '3 8' }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1 }}>
              {phase}
            </Text>
          </View>
        )}
      </View>
      <View style={{ borderBottomWidth: 1, borderBottomColor: T.inkA15, marginTop: 10 }} />
    </View>
  )
}

function TitleBlock({ reportId, projectName, date }: { reportId: string; projectName: string; date: Date }) {
  const rows = [
    ['PROJECT',      projectName || 'Master Report'],
    ['DRG NO.',      reportId],
    ['DRAWN BY',     'NIRMANSHASTRA'],
    ['CHECKED',      'IS 456 · 1077 · 732 · 1172 · 1893'],
    ['SCALE',        '1:1 COST CERTAINTY'],
    ['DATE',         date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()],
  ]
  return (
    <View style={{ borderWidth: 1, borderColor: T.ironInk, marginTop: 4 }}>
      {rows.map(([label, val], i) => (
        <View key={label} style={{ flexDirection: 'row', borderBottomWidth: i < rows.length - 1 ? 1 : 0, borderBottomColor: T.inkA15 }}>
          <View style={{ width: 80, borderRightWidth: 1, borderRightColor: T.inkA15, padding: '3 6' }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
          </View>
          <View style={{ flex: 1, padding: '3 6' }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.ironInk }}>{val}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

function Footer({ reportId, page, total }: { reportId: string; page: number; total: number }) {
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: T.inkA15, marginTop: 12, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>
        NIRMANSHASTRA · MASTER PROJECT REPORT · {reportId}
      </Text>
      <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>
        {page} / {total}
      </Text>
    </View>
  )
}

// ─── Gantt chart SVG for construction timeline ────────────────────────────────
function GanttChart({ includedPhases }: { includedPhases: string[] }) {
  const allPhases = [
    { key: 'structopro',  label: 'Structure (RCC)',     start: 0, end: 3,   color: T.blueprint },
    { key: 'masonpro',    label: 'Masonry',             start: 3, end: 5,   color: T.approvedGreen },
    { key: 'electropro',  label: 'Electrical (rough-in)', start: 3, end: 5, color: T.markingYellow },
    { key: 'plumbpro',    label: 'Plumbing (rough-in)',  start: 3, end: 5,  color: T.stampOxide },
    { key: 'interiorpro', label: 'Interior',             start: 5, end: 8,  color: '#6B21A8' },
  ]

  const phases = allPhases.filter(p => includedPhases.includes(p.key))
  if (phases.length === 0) return null

  const width  = 460
  const rowH   = 22
  const labelW = 140
  const barArea = width - labelW - 10
  const months  = 9
  const monthW  = barArea / months
  const height  = phases.length * rowH + 36

  return (
    <Svg width={width} height={height} style={{ marginTop: 8 }}>
      {/* Month labels */}
      {Array.from({ length: months + 1 }, (_, i) => (
        <Text key={i} style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}
          x={labelW + i * monthW} y={10}>
          {`M${i}`}
        </Text>
      ))}
      {/* Grid lines */}
      {Array.from({ length: months + 1 }, (_, i) => (
        <Line key={i} x1={labelW + i * monthW} y1={16} x2={labelW + i * monthW} y2={height - 4}
          strokeWidth={0.5} stroke={T.inkA15} />
      ))}
      {/* Rows */}
      {phases.map((ph, ri) => {
        const y = 20 + ri * rowH
        const barX = labelW + ph.start * monthW
        const barW = (ph.end - ph.start) * monthW
        return (
          <React.Fragment key={ph.key}>
            <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, color: T.ironInk }}
              x={4} y={y + 12}>{ph.label}</Text>
            <Rect x={barX} y={y + 2} width={barW} height={14} fill={ph.color} rx={1} />
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: '#fff' }}
              x={barX + 4} y={y + 12}>
              {`Mth ${ph.start + 1}–${ph.end}`}
            </Text>
          </React.Fragment>
        )
      })}
    </Svg>
  )
}

// ─── Bar chart for phase cost breakdown ──────────────────────────────────────
function PhaseBarChart({ breakdown }: { breakdown: { appType: string; basic: number; standard: number; premium: number }[] }) {
  if (!breakdown.length) return null

  const maxVal = Math.max(...breakdown.map(b => b.premium))
  const width  = 460
  const height = 120
  const barW   = Math.min(40, (width - 60) / (breakdown.length * 3 + breakdown.length))
  const groupW = barW * 3 + 6
  const startX = 50

  return (
    <Svg width={width} height={height}>
      {/* Y-axis label */}
      <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }} x={2} y={10}>₹L</Text>
      {breakdown.map((ph, gi) => {
        const gx = startX + gi * (groupW + 10)
        const bars = [
          { val: ph.basic,    color: T.blueprint,      label: 'B' },
          { val: ph.standard, color: T.approvedGreen,  label: 'S' },
          { val: ph.premium,  color: T.stampOxide,     label: 'P' },
        ]
        return (
          <React.Fragment key={ph.appType}>
            {bars.map((bar, bi) => {
              const barH = maxVal > 0 ? (bar.val / maxVal) * 90 : 0
              const bx   = gx + bi * (barW + 2)
              const by   = height - 24 - barH
              return (
                <React.Fragment key={bar.label}>
                  <Rect x={bx} y={by} width={barW} height={barH} fill={bar.color} rx={1} />
                </React.Fragment>
              )
            })}
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.ironInk }}
              x={gx + groupW / 2 - 14} y={height - 8}>
              {phaseShort(ph.appType).replace('Pro', '')}
            </Text>
          </React.Fragment>
        )
      })}
      {/* Legend */}
      {[['B', 'Basic', T.blueprint], ['S', 'Standard', T.approvedGreen], ['P', 'Premium', T.stampOxide]].map(([k, lbl, col], i) => (
        <React.Fragment key={k}>
          <Rect x={startX + i * 60} y={height - 4} width={8} height={6} fill={col as string} />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, color: T.ironInk }}
            x={startX + i * 60 + 10} y={height - 1}>{lbl}</Text>
        </React.Fragment>
      ))}
    </Svg>
  )
}

// ─── Phase summary page ───────────────────────────────────────────────────────
function PhaseSummaryPage({
  phase,
  pageNum,
  reportId,
}: {
  phase:    PhaseEstimate
  pageNum:  number
  reportId: string
}) {
  const rd = phase.resultData as Record<string, unknown>
  const gt = rd.grandTotal as { basic: number; standard: number; premium: number; luxury?: number } | undefined
  const compliance = rd.compliance as { check: string; status: string; clause?: string }[] | undefined

  const keyStats: { label: string; value: string }[] = []

  if (phase.appType === 'structopro') {
    const totalBUA = rd.totalBUA as number | undefined
    if (totalBUA) keyStats.push({ label: 'Total BUA', value: `${totalBUA.toFixed(0)} sqft` })
    const foundation = rd.foundationRecommendation as { label?: string } | undefined
    if (foundation?.label) keyStats.push({ label: 'Foundation', value: foundation.label })
    const seismic = rd.seismicZone as string | undefined
    if (seismic) keyStats.push({ label: 'Seismic Zone', value: `Zone ${seismic}` })
  }

  if (phase.appType === 'masonpro') {
    const area = rd.totalExternalWallAreaSqm as number | undefined
    if (area) keyStats.push({ label: 'External Wall Area', value: `${area.toFixed(1)} sqm` })
    const seismic = rd.seismicZone as string | undefined
    if (seismic) keyStats.push({ label: 'Seismic Zone', value: `Zone ${seismic}` })
  }

  if (phase.appType === 'electropro') {
    const bua = rd.totalBuaSqft as number | undefined
    if (bua) keyStats.push({ label: 'Total BUA', value: `${bua.toFixed(0)} sqft` })
    const lightCircuits = rd.lightCircuits as number | undefined
    if (lightCircuits != null) keyStats.push({ label: 'Lighting Circuits', value: String(lightCircuits) })
    const powerCircuits = rd.powerCircuits as number | undefined
    if (powerCircuits != null) keyStats.push({ label: 'Power Circuits', value: String(powerCircuits) })
  }

  if (phase.appType === 'plumbpro') {
    const bua = rd.totalBuaSqft as number | undefined
    if (bua) keyStats.push({ label: 'Total BUA', value: `${bua.toFixed(0)} sqft` })
  }

  if (phase.appType === 'interiorpro') {
    const bua = rd.totalBuaSqft as number | undefined
    if (bua) keyStats.push({ label: 'Total BUA', value: `${bua.toFixed(0)} sqft` })
  }

  const passCount     = compliance?.filter(c => c.status === 'pass').length ?? 0
  const advisoryCount = compliance?.filter(c => c.status === 'advisory').length ?? 0
  const failCount     = compliance?.filter(c => c.status === 'fail').length ?? 0

  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader
          subtitle={`PHASE SUMMARY · ${pageNum - 4} OF 5`}
          title={phaseShort(phase.appType)}
          phase={phaseLabel(phase.appType)}
        />

        {/* Grand Total range */}
        {gt && (
          <View style={{ marginBottom: 14, padding: 12, borderWidth: 1, borderColor: T.blueprint, backgroundColor: T.blueprintBg }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>
              Phase Cost Range
            </Text>
            <View style={{ flexDirection: 'row', gap: 20 }}>
              {[
                { label: 'Basic',    val: gt.basic },
                { label: 'Standard', val: gt.standard },
                { label: 'Premium',  val: gt.premium },
                ...(gt.luxury != null ? [{ label: 'Luxury', val: gt.luxury }] : []),
              ].map(({ label, val }) => (
                <View key={label}>
                  <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, marginBottom: 2 }}>{label}</Text>
                  <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 13, fontWeight: 700, color: T.blueprint }}>{fmtLakhs(val)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Key stats */}
        {keyStats.length > 0 && (
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.inkA60, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
              Key Quantities
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {keyStats.map(s => (
                <View key={s.label} style={{ borderWidth: 1, borderColor: T.inkA15, padding: '6 10', minWidth: 100 }}>
                  <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, marginBottom: 2 }}>{s.label}</Text>
                  <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 11, color: T.ironInk, fontWeight: 500 }}>{s.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* IS Compliance summary */}
        {compliance && compliance.length > 0 && (
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.inkA60, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
              IS Code Compliance Summary
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1, borderWidth: 1, borderColor: T.approvedGreen, padding: '6 10', backgroundColor: T.greenBg }}>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.approvedGreen, marginBottom: 2 }}>PASS</Text>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 16, color: T.approvedGreen, fontWeight: 700 }}>{passCount}</Text>
              </View>
              <View style={{ flex: 1, borderWidth: 1, borderColor: T.markingYellow, padding: '6 10', backgroundColor: '#FBF5E6' }}>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.markingYellow, marginBottom: 2 }}>ADVISORY</Text>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 16, color: T.markingYellow, fontWeight: 700 }}>{advisoryCount}</Text>
              </View>
              <View style={{ flex: 1, borderWidth: 1, borderColor: T.stampOxide, padding: '6 10', backgroundColor: '#F5EDEB' }}>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.stampOxide, marginBottom: 2 }}>FAIL</Text>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 16, color: T.stampOxide, fontWeight: 700 }}>{failCount}</Text>
              </View>
            </View>
            {compliance.slice(0, 4).map((c, i) => (
              <View key={i} style={[S.tableRow, { alignItems: 'center' }]}>
                <View style={{
                  width: 6, height: 6, borderRadius: 3,
                  backgroundColor: c.status === 'pass' ? T.approvedGreen : c.status === 'advisory' ? T.markingYellow : T.stampOxide,
                  marginRight: 8, flexShrink: 0,
                }} />
                <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 9, flex: 1 }}>{c.check}</Text>
                {c.clause && (
                  <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.inkA60 }}>{c.clause}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <Footer reportId={reportId} page={pageNum} total={12} />
      </View>
    </Page>
  )
}

// ─── Main document ────────────────────────────────────────────────────────────
export default function GrandTotalPDF({ contact, reportId, projectName, date, phases, grandTotal }: Props) {
  const allPhaseKeys   = phases.map(p => p.appType)
  const totalISCodes   = phases.reduce((acc, p) => {
    const compliance = (p.resultData as { compliance?: unknown[] }).compliance ?? []
    return acc + compliance.length
  }, 0)

  const combinedMaterials: { label: string; value: string; unit: string }[] = []
  // Aggregate cement bags across structure+masonry if both present
  let totalCementBags = 0
  for (const ph of phases) {
    const rd = ph.resultData as Record<string, unknown>
    if (ph.appType === 'structopro') {
      const qty = rd.quantities as { cementBags?: number; steelKg?: number } | undefined
      if (qty?.cementBags) totalCementBags += qty.cementBags
    }
    if (ph.appType === 'masonpro') {
      const bq = rd.brickworkQuantities as { cementBags?: number } | undefined
      if (bq?.cementBags) totalCementBags += bq.cementBags
    }
  }
  if (totalCementBags > 0) combinedMaterials.push({ label: 'Total Cement', value: Math.ceil(totalCementBags).toLocaleString('en-IN'), unit: 'bags (50 kg)' })

  const structResult = phases.find(p => p.appType === 'structopro')?.resultData as { quantities?: { steelKg?: number } } | undefined
  if (structResult?.quantities?.steelKg) {
    combinedMaterials.push({ label: 'Structural Steel', value: Math.ceil(structResult.quantities.steelKg).toLocaleString('en-IN'), unit: 'kg TMT Fe500' })
  }

  return (
    <Document title={`Master Project Report — ${reportId}`} author="NirmanShastra">

      {/* ── Page 1: Cover ─────────────────────────────────────────────────── */}
      <Page size="A4" style={[S.page, { justifyContent: 'space-between' }]}>
        <View style={[S.frame, { justifyContent: 'space-between' }]}>
          {/* Top bar */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: T.inkA15, paddingBottom: 12, marginBottom: 16 }}>
            <View>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 10, color: T.ironInk, fontWeight: 700, letterSpacing: 2 }}>NIRMANSHASTRA</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, marginTop: 2 }}>Build With Certainty</Text>
            </View>
            <View style={{ borderWidth: 1.5, borderColor: T.stampOxide, padding: '4 10', transform: 'rotate(-2deg)' }}>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.stampOxide, letterSpacing: 1, textTransform: 'uppercase' }}>
                MASTER PROJECT REPORT
              </Text>
            </View>
          </View>

          {/* Centre — title */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 9, color: T.inkA60, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              COMPLETE PROJECT COST SUMMARY
            </Text>
            <Text style={{ fontFamily: 'IBMPlexSerif', fontSize: 32, fontWeight: 700, color: T.ironInk, textAlign: 'center', marginBottom: 4 }}>
              {contact.name}
            </Text>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 13, color: T.blueprint, marginBottom: 20 }}>
              {contact.city}{contact.state ? `, ${contact.state}` : ''}
            </Text>

            {/* Phase badges */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
              {phases.map(ph => (
                <View key={ph.appType} style={{ borderWidth: 1, borderColor: T.blueprint, padding: '4 10' }}>
                  <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint }}>{phaseLabel(ph.appType)}</Text>
                </View>
              ))}
            </View>

            {/* Combined total */}
            <View style={{ borderWidth: 1, borderColor: T.ironInk, padding: 16, alignItems: 'center', minWidth: 280 }}>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.inkA60, letterSpacing: 1, marginBottom: 6 }}>COMBINED PROJECT COST</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, marginBottom: 4 }}>
                Basic: {fmtLakhs(grandTotal.combinedTotal.basic)} — Premium: {fmtLakhs(grandTotal.combinedTotal.premium)}
              </Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 22, fontWeight: 700, color: T.blueprint }}>
                {fmtLakhs(grandTotal.combinedTotal.standard)}
              </Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, marginTop: 4 }}>STANDARD ESTIMATE</Text>
            </View>
          </View>

          {/* Title block */}
          <TitleBlock reportId={reportId} projectName={projectName} date={date} />
        </View>
      </Page>

      {/* ── Page 2: Executive Summary ─────────────────────────────────────── */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          <PageHeader subtitle="SHEET 02 · EXECUTIVE SUMMARY" title="Executive Summary" phase="MASTER REPORT" />

          {/* Property details table */}
          <View style={{ flexDirection: 'row', gap: 14, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.inkA60, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                Project Details
              </Text>
              {[
                ['Client',     contact.name],
                ['Mobile',     contact.mobile],
                ['Email',      contact.email],
                ['City',       contact.city],
                ['State',      contact.state],
                ['Report ID',  reportId],
                ['Date',       date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
                ['Phases',     `${phases.length} of 5`],
                ['IS Codes',   `${totalISCodes} references`],
              ].map(([lbl, val]) => (
                <View key={lbl} style={[S.tableRow, { paddingVertical: 3 }]}>
                  <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.inkA60, width: 80 }}>{lbl}</Text>
                  <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 9, flex: 1, color: T.ironInk }}>{val}</Text>
                </View>
              ))}
            </View>

            {/* Cost summary card */}
            <View style={{ width: 180 }}>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.inkA60, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                Combined Cost
              </Text>
              {[
                { label: 'Basic',    val: grandTotal.combinedTotal.basic,    color: T.inkA60 },
                { label: 'Standard', val: grandTotal.combinedTotal.standard, color: T.blueprint },
                { label: 'Premium',  val: grandTotal.combinedTotal.premium,  color: T.stampOxide },
              ].map(({ label, val, color }) => (
                <View key={label} style={{ borderWidth: 1, borderColor: T.inkA15, padding: '6 10', marginBottom: 4 }}>
                  <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, marginBottom: 2 }}>{label.toUpperCase()}</Text>
                  <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 14, fontWeight: 500, color }}>{fmtLakhs(val)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Timeline overview */}
          <View style={{ marginBottom: 12, padding: 10, borderWidth: 1, borderColor: T.inkA15 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.inkA60, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              Project Timeline Overview
            </Text>
            {[
              { phase: 'Phase 1 (Structure)', months: 'Months 1–3', note: 'RCC work: foundation → columns → beams → slab' },
              { phase: 'Phase 2 (Masonry)',   months: 'Months 3–5', note: '60–90 day RCC curing, then brickwork + plaster' },
              { phase: 'Phase 3 (Electrical)', months: 'Months 4–5', note: 'Rough-in conduit + wiring, parallel with masonry' },
              { phase: 'Phase 4 (Plumbing)',  months: 'Months 4–5', note: 'Soil + waste rough-in, parallel with masonry' },
              { phase: 'Phase 5 (Interior)',  months: 'Months 6–8', note: 'Flooring, kitchen, paint, false ceiling' },
            ].filter(row => {
              const keyMap: Record<string, string> = {
                'Phase 1 (Structure)': 'structopro', 'Phase 2 (Masonry)': 'masonpro',
                'Phase 3 (Electrical)': 'electropro', 'Phase 4 (Plumbing)': 'plumbpro',
                'Phase 5 (Interior)': 'interiorpro',
              }
              return allPhaseKeys.includes(keyMap[row.phase])
            }).map(row => (
              <View key={row.phase} style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' }}>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, width: 120 }}>{row.phase}</Text>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.ironInk, width: 80 }}>{row.months}</Text>
                <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, color: T.inkA60, flex: 1 }}>{row.note}</Text>
              </View>
            ))}
          </View>

          <Footer reportId={reportId} page={2} total={12} />
        </View>
      </Page>

      {/* ── Page 3: Phase-wise Cost Breakdown ────────────────────────────── */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          <PageHeader subtitle="SHEET 03 · COST BREAKDOWN" title="Phase-wise Cost Breakdown" />

          {/* Table */}
          <View style={S.tableHeader}>
            {['Phase', 'Basic', 'Standard', 'Premium', '% of Total (Std.)'].map(h => (
              <Text key={h} style={[S.tableHeaderCell, { flex: h === 'Phase' ? 2 : 1 }]}>{h}</Text>
            ))}
          </View>
          {grandTotal.phaseBreakdown.map(ph => {
            const pct = grandTotal.combinedTotal.standard > 0
              ? ((ph.standard / grandTotal.combinedTotal.standard) * 100).toFixed(1)
              : '—'
            return (
              <View key={ph.appType} style={S.tableRow}>
                <Text style={[S.tableCell, { flex: 2 }]}>{phaseLabel(ph.appType)}</Text>
                <Text style={[S.tableCellMono, { flex: 1 }]}>{fmtLakhs(ph.basic)}</Text>
                <Text style={[S.tableCellMono, { flex: 1 }]}>{fmtLakhs(ph.standard)}</Text>
                <Text style={[S.tableCellMono, { flex: 1 }]}>{fmtLakhs(ph.premium)}</Text>
                <Text style={[S.tableCellMono, { flex: 1 }]}>{pct}%</Text>
              </View>
            )
          })}
          {/* Totals row */}
          <View style={[S.tableRow, { borderBottomWidth: 2, borderBottomColor: T.ironInk }]}>
            <Text style={[S.tableCell, { flex: 2, fontWeight: 600 }]}>COMBINED TOTAL</Text>
            <Text style={[S.tableCellMono, { flex: 1, fontWeight: 700 }]}>{fmtLakhs(grandTotal.combinedTotal.basic)}</Text>
            <Text style={[S.tableCellMono, { flex: 1, fontWeight: 700, color: T.blueprint }]}>{fmtLakhs(grandTotal.combinedTotal.standard)}</Text>
            <Text style={[S.tableCellMono, { flex: 1, fontWeight: 700 }]}>{fmtLakhs(grandTotal.combinedTotal.premium)}</Text>
            <Text style={[S.tableCellMono, { flex: 1, fontWeight: 700 }]}>100%</Text>
          </View>

          <View style={S.divider} />

          {/* Bar chart */}
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.inkA60, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
            Phase Cost Distribution — Bar Chart (B/S/P)
          </Text>
          <PhaseBarChart breakdown={grandTotal.phaseBreakdown} />

          <Footer reportId={reportId} page={3} total={12} />
        </View>
      </Page>

      {/* ── Page 4: Construction Timeline ─────────────────────────────────── */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          <PageHeader subtitle="SHEET 04 · TIMELINE" title="Construction Timeline" />

          <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 10, color: T.inkA60, marginBottom: 14, lineHeight: 1.5 }}>
            The timeline below shows the construction sequence for your selected phases.
            RCC curing (60–90 days) governs when masonry can start. Electrical and plumbing
            rough-in work runs parallel with masonry to compress the schedule.
          </Text>

          <GanttChart includedPhases={allPhaseKeys} />

          <View style={S.divider} />

          {/* Key notes */}
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.inkA60, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            Critical Path Notes
          </Text>
          {[
            'RCC pours must cure 28 days minimum (IS 456:2000 Cl.13). Full masonry load: 60–90 days.',
            'Electrical conduit must be embedded before plaster. Coordinate with masonry team.',
            'Sanitary rough-in (soil stack, waste traps) must be cast into slab before concreting.',
            'Do not start interior flooring until all wet work (plaster, waterproofing) is complete.',
            'Interior work can start on lower floors while upper floors are still in masonry phase.',
          ].map((note, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 5 }}>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, marginRight: 6 }}>{`${i + 1}.`}</Text>
              <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk, flex: 1, lineHeight: 1.4 }}>{note}</Text>
            </View>
          ))}

          <Footer reportId={reportId} page={4} total={12} />
        </View>
      </Page>

      {/* ── Pages 5–9: Phase summaries ────────────────────────────────────── */}
      {[...Array(5)].map((_, idx) => {
        const ph = phases[idx]
        if (!ph) {
          return (
            <Page key={`empty-${idx}`} size="A4" style={S.page}>
              <View style={S.frame}>
                <PageHeader subtitle={`SHEET ${String(5 + idx).padStart(2, '0')} · PHASE ${idx + 1}`} title={`Phase ${idx + 1} — Not Included`} />
                <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 10, color: T.inkA60, marginTop: 20 }}>
                  This phase was not included in the Grand Total Report selection.
                  Complete the tool and purchase again to include it.
                </Text>
                <Footer reportId={reportId} page={5 + idx} total={12} />
              </View>
            </Page>
          )
        }
        return <PhaseSummaryPage key={ph.appType} phase={ph} pageNum={5 + idx} reportId={reportId} />
      })}

      {/* ── Page 10: Master Material Summary ──────────────────────────────── */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          <PageHeader subtitle="SHEET 10 · MATERIALS" title="Master Material Summary" />

          <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 10, color: T.inkA60, marginBottom: 12, lineHeight: 1.5 }}>
            Combined material quantities across all included phases. Purchase planning
            in bulk across phases can yield 5–12% savings on cement and steel.
          </Text>

          {combinedMaterials.length > 0 ? (
            <>
              <View style={S.tableHeader}>
                {['Material', 'Quantity', 'Unit'].map(h => (
                  <Text key={h} style={[S.tableHeaderCell, { flex: h === 'Unit' ? 2 : 1 }]}>{h}</Text>
                ))}
              </View>
              {combinedMaterials.map(m => (
                <View key={m.label} style={S.tableRow}>
                  <Text style={[S.tableCell, { flex: 1 }]}>{m.label}</Text>
                  <Text style={[S.tableCellMono, { flex: 1 }]}>{m.value}</Text>
                  <Text style={[S.tableCell, { flex: 2, color: T.inkA60 }]}>{m.unit}</Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 10, color: T.inkA60 }}>
              Detailed material quantities are available in each individual phase report.
            </Text>
          )}

          <View style={S.divider} />

          {/* Procurement notes */}
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.inkA60, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            Procurement Notes
          </Text>
          {[
            'Cement: Order 60–70% of total quantity upfront. Store in dry, elevated conditions. Shelf life 3 months.',
            'Steel: Verify IS 1786:2008 marking on each bundle. Reject unbundled or unmarked bars.',
            'Bricks: Soak minimum 2 hours before laying (IS 2212:1991 Cl.8.2).',
            'AAC blocks: Use manufacturer-specified adhesive mortar only. Do not use cement-sand mortar.',
            'Wire: Verify IS 694:2010 marking. Reject wire without FR/FRLS marking in habitable spaces.',
            'CPVC pipes: Verify IS 15778:2007 marking. Store away from direct sunlight.',
          ].map((note, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 5 }}>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, marginRight: 6 }}>{'>'}</Text>
              <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk, flex: 1, lineHeight: 1.4 }}>{note}</Text>
            </View>
          ))}

          <Footer reportId={reportId} page={10} total={12} />
        </View>
      </Page>

      {/* ── Page 11: Master IS Code Compliance ────────────────────────────── */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          <PageHeader subtitle="SHEET 11 · IS CODE COMPLIANCE" title="Master IS Code Compliance" />

          {phases.map(ph => {
            const compliance = ((ph.resultData as { compliance?: { check: string; status: string; clause?: string }[] }).compliance ?? [])
            if (!compliance.length) return null
            return (
              <View key={ph.appType} style={{ marginBottom: 14 }}>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>
                  {phaseShort(ph.appType)}
                </Text>
                {compliance.map((c, i) => (
                  <View key={i} style={[S.tableRow, { alignItems: 'center' }]}>
                    <View style={{
                      width: 5, height: 5, borderRadius: 3,
                      backgroundColor: c.status === 'pass' ? T.approvedGreen : c.status === 'advisory' ? T.markingYellow : T.stampOxide,
                      marginRight: 8, flexShrink: 0,
                    }} />
                    <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, flex: 1 }}>{c.check}</Text>
                    {c.clause && (
                      <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>{c.clause}</Text>
                    )}
                  </View>
                ))}
              </View>
            )
          })}

          <Footer reportId={reportId} page={11} total={12} />
        </View>
      </Page>

      {/* ── Page 12: The Complete Engineering Picture ──────────────────────── */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          <PageHeader subtitle="SHEET 12 · ENGINEERING OVERVIEW" title="The Complete Engineering Picture" />

          <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 10, color: T.ironInk, lineHeight: 1.6, marginBottom: 12 }}>
            A building is not five separate projects — it is one engineering system. Each phase
            depends on the one before it. The RCC frame determines wall-panel sizes in masonry.
            The masonry determines conduit chase depths in electrical. The sanitary rough-in is
            cast into the slab before concreting. The finishing grades in interior work determine
            the final surface thickness, which affects finished floor levels set at the structural stage.
          </Text>

          {/* How phases interact */}
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.inkA60, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
            Phase Interdependencies
          </Text>
          {[
            { from: 'StructurePro → MasonryPro',    note: 'Column spacing sets masonry panel dimensions. Seismic zone determines if seismic bands are mandatory (IS 4326:1993).' },
            { from: 'StructurePro → ElectricalPro',  note: 'Slab thickness and beam depths determine conduit routing paths.' },
            { from: 'StructurePro → PlumbingPro',    note: 'Sunken slab depths for bathrooms are set at the structural design stage.' },
            { from: 'MasonryPro → ElectricalPro',    note: 'Conduit must be embedded before plastering. Coordinate chase depths with plaster thickness.' },
            { from: 'MasonryPro → PlumbingPro',      note: 'Pipe chases in 9-inch walls must be planned before brickwork starts.' },
            { from: 'ElectricalPro → InteriorPro', note: 'DB panel location determines kitchen backsplash tile layout. Fixture positions set before tiling.' },
            { from: 'PlumbingPro → InteriorPro',   note: 'Sanitary fixture positions, floor traps, and waste pipe heights must be confirmed before flooring starts.' },
          ].map(row => (
            <View key={row.from} style={{ marginBottom: 7 }}>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, marginBottom: 2 }}>{row.from}</Text>
              <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk, lineHeight: 1.4 }}>{row.note}</Text>
            </View>
          ))}

          <View style={S.divider} />

          {/* Disclaimer */}
          <View style={{ borderWidth: 1, borderColor: T.stampOxide, padding: 10, backgroundColor: '#F5EDEB' }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.stampOxide, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>
              IMPORTANT DISCLAIMER
            </Text>
            <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, color: T.ironInk, lineHeight: 1.5 }}>
              This report provides IS-code-backed cost estimates for budgeting and contractor comparison
              purposes only. It is NOT a substitute for licensed structural engineer drawings, approved
              architectural plans, or local authority-sanctioned BOQs. All quantities are computed from
              IS 456:2000, IS 1786:2008, IS 1077:1992, IS 732:2019, IS 1172:1993, IS 4326:1993 and
              NBC 2016 using the dimensions you provided. Site-specific conditions (soil bearing
              capacity, water table, wind load zone) require independent geotechnical and structural
              investigation. Actual costs may vary ±15–25% based on contractor negotiations, material
              availability, and site conditions. NirmanShastra bears no liability for construction
              decisions made solely on the basis of this report.
            </Text>
          </View>

          <Footer reportId={reportId} page={12} total={12} />
        </View>
      </Page>

    </Document>
  )
}
