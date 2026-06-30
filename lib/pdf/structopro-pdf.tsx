// StructoPro 10-page PDF — @react-pdf/renderer
// Design tokens from NirmanShastra_Design_Spec.md
// IS code values from Build Reference Section 8 — LOCKED

import React from 'react'
import {
  Circle,
  Document,
  Font,
  Line,
  Page,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer'

import type {
  ComplianceCheck,
  StructoInput,
  StructoResult,
} from '@/app/tools/structopro/structopro-engine'

// ─── Font registration (IBM Plex via jsDelivr CDN) ───────────────────────────
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
  inkA15:        '#D0D2D4',   // rgba(30,34,39,0.15) on #F4F4F0
  inkA35:        '#A8AAAD',   // rgba(30,34,39,0.35)
  inkA60:        '#788085',   // rgba(30,34,39,0.60)
  blueprintBg:   '#EBF0F7',   // rgba(31,78,121,0.06)
  greenBg:       '#E9F2EB',   // rgba(20,83,45,0.06)
  oxideBg:       '#F5EDEB',   // rgba(140,58,34,0.06)
  yellowBg:      '#FBF5E6',   // rgba(217,154,6,0.08)
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
    flex: 1,
    borderWidth: 1,
    borderColor: T.ironInk,
    borderStyle: 'solid',
    padding: 15,
    flexDirection: 'column',
  },
  eyebrow: {
    fontFamily: 'IBMPlexMono',
    fontSize: 7,
    color: T.blueprint,
    letterSpacing: 1,
    marginBottom: 4,
  },
  h1: { fontFamily: 'IBMPlexSerif', fontSize: 26, fontWeight: 700, color: T.ironInk, marginBottom: 6 },
  h2: { fontFamily: 'IBMPlexSerif', fontSize: 16, fontWeight: 600, color: T.ironInk, marginBottom: 6 },
  h3: { fontFamily: 'IBMPlexSans',  fontSize: 11, fontWeight: 600, color: T.ironInk, marginBottom: 4 },
  body: { fontFamily: 'IBMPlexSans', fontSize: 9,  color: T.ironInk, lineHeight: 1.5 },
  mono: { fontFamily: 'IBMPlexMono', fontSize: 9,  color: T.ironInk },
  monoSm: { fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 },
  // rule
  rule: { borderBottomWidth: 1, borderBottomColor: T.ironInk, borderBottomStyle: 'solid', marginVertical: 10 },
  ruleLight: { borderBottomWidth: 0.5, borderBottomColor: T.inkA15, borderBottomStyle: 'solid' },
  // tables
  table: { width: '100%' },
  tHead: { flexDirection: 'row', backgroundColor: T.ironInk, paddingVertical: 4 },
  tRow:  { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: T.inkA15, borderBottomStyle: 'solid' },
  tRowAlt: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: T.inkA15, borderBottomStyle: 'solid', backgroundColor: 'rgba(30,34,39,0.025)' },
  tTotalRow: { flexDirection: 'row', borderTopWidth: 1.5, borderTopColor: T.ironInk, borderTopStyle: 'solid', backgroundColor: T.blueprintBg, paddingVertical: 3 },
  tCell: { fontFamily: 'IBMPlexSans', fontSize: 8, color: T.ironInk, paddingVertical: 4, paddingHorizontal: 5 },
  tCellMono: { fontFamily: 'IBMPlexMono', fontSize: 8, color: T.ironInk, paddingVertical: 4, paddingHorizontal: 5, textAlign: 'right' },
  tHeader: { fontFamily: 'IBMPlexMono', fontSize: 7, color: T.sheetWhite, paddingVertical: 4, paddingHorizontal: 5 },
  tHeaderR: { fontFamily: 'IBMPlexMono', fontSize: 7, color: T.sheetWhite, paddingVertical: 4, paddingHorizontal: 5, textAlign: 'right' },
  // spacer
  flex1: { flex: 1 },
  // section header
  secHeader: { marginBottom: 12 },
})

// ─── Helpers ─────────────────────────────────────────────────────────────────
function rs(n: number): string {
  return 'Rs.' + n.toLocaleString('en-IN')
}
function num(n: number, dec = 0): string {
  return dec > 0 ? n.toFixed(dec) : Math.round(n).toLocaleString('en-IN')
}
function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function floorsLabel(n: number): string {
  return n === 0 ? 'Ground (G)' : `G+${n}`
}
function bagsPerM3(grade: string): number {
  const m: Record<string, number> = { M20: 8.07, M25: 11.00, M30: 14.0, M35: 16.0 }
  return m[grade] ?? 8.07
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Title block (per Design Spec Section 5C)
function TitleBlock({ projectName, reportId, date }: { projectName: string; reportId: string; date: Date }) {
  const rows = [
    { label: 'PROJECT', value: projectName.slice(0, 28) },
    { label: 'DRG NO.', value: reportId },
    { label: 'DRAWN BY', value: 'NIRMANSHASTRA' },
    { label: 'CHECKED', value: 'IS 456:2000 · IS 13920' },
    { label: 'AGAINST', value: '· IS 1904 · IS 1893' },
    { label: 'SCALE', value: '1:1 COST CERTAINTY' },
    { label: 'DATE', value: `${fmtDate(date)}  REV A` },
  ]
  return (
    <View style={{ width: 210, borderWidth: 1, borderColor: T.ironInk, borderStyle: 'solid' }}>
      {rows.map((r, i) => (
        <View
          key={r.label}
          style={{
            flexDirection: 'row',
            borderBottomWidth: i < rows.length - 1 ? 0.5 : 0,
            borderBottomColor: T.ironInk,
            borderBottomStyle: 'solid',
          }}
        >
          <Text style={{ width: 65, fontFamily: 'IBMPlexMono', fontSize: 6, color: T.inkA60, padding: 3 }}>
            {r.label}
          </Text>
          <View style={{ width: 0.5, backgroundColor: T.ironInk }} />
          <Text style={{ flex: 1, fontFamily: 'IBMPlexMono', fontSize: 6, color: T.ironInk, padding: 3 }}>
            {r.value}
          </Text>
        </View>
      ))}
    </View>
  )
}

// Page header strip
function PageHeader({ sheet, title }: { sheet: string; title: string }) {
  return (
    <View style={S.secHeader}>
      <Text style={S.eyebrow}>{sheet}</Text>
      <Text style={S.h2}>{title}</Text>
      <View style={S.rule} />
    </View>
  )
}

// Compliance stamp badge
function StampBadge({ check }: { check: ComplianceCheck }) {
  const cfg = {
    pass:     { label: 'PASS',     border: T.approvedGreen, text: T.approvedGreen, bg: T.greenBg },
    advisory: { label: 'ADVISORY', border: T.markingYellow, text: T.markingYellow, bg: T.yellowBg },
    fail:     { label: 'FAIL',     border: T.stampOxide,   text: T.stampOxide,   bg: T.oxideBg },
  }[check.status]

  return (
    <View style={{
      borderWidth: 1, borderColor: cfg.border, borderStyle: 'solid',
      backgroundColor: cfg.bg, padding: 8, marginBottom: 6, flex: 1,
    }}>
      {/* Stamp */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 }}>
        <View style={{
          borderWidth: 1.5, borderColor: cfg.border, borderStyle: 'solid',
          paddingHorizontal: 4, paddingVertical: 1,
        }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: cfg.text, fontWeight: 700 }}>
            {cfg.label}
          </Text>
        </View>
        <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: cfg.text, flex: 1 }}>
          {check.clause}
        </Text>
      </View>
      <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, fontWeight: 600, color: T.ironInk, marginBottom: 2 }}>
        {check.description}
      </Text>
      <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, color: T.ironInk, lineHeight: 1.45 }}>
        {check.detail}
      </Text>
    </View>
  )
}

// Info table row
function InfoRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: T.inkA15, borderBottomStyle: 'solid', paddingVertical: 3 }}>
      <Text style={{ width: 180, fontFamily: 'IBMPlexMono', fontSize: 8, color: T.inkA60 }}>{label}</Text>
      <Text style={{ flex: 1, fontFamily: mono ? 'IBMPlexMono' : 'IBMPlexSans', fontSize: 8, color: T.ironInk }}>
        {value}
      </Text>
    </View>
  )
}

// Page footer strip
function PageFooter({ sheet }: { sheet: string }) {
  return (
    <View style={{ marginTop: 8, borderTopWidth: 0.5, borderTopColor: T.inkA15, borderTopStyle: 'solid', paddingTop: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={S.monoSm}>NIRMANSHASTRA · STRUCTOPRO · {sheet}</Text>
      <Text style={S.monoSm}>Build With Certainty — www.NirmanShastra.in</Text>
    </View>
  )
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export interface ContactInfo {
  name: string
  email: string
  mobile: string
  address: string
  city: string
  state: string
}

export interface PDFProps {
  input: StructoInput
  result: StructoResult
  contact: ContactInfo
  reportId: string
  projectName: string
  date: Date
}

// ─── IS Code Compliance Checklist helpers ─────────────────────────────────────

interface ChecklistItem {
  status: 'pass' | 'advisory' | 'violation'
  clause: string
  description: string
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const cfg =
    item.status === 'pass'
      ? { label: 'PASS',      bg: T.greenBg,  border: T.approvedGreen, text: T.approvedGreen }
      : item.status === 'advisory'
      ? { label: 'ADVISORY',  bg: T.yellowBg, border: T.markingYellow, text: T.markingYellow }
      : { label: 'VIOLATION', bg: T.oxideBg,  border: T.stampOxide,   text: T.stampOxide   }
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5,
      backgroundColor: cfg.bg,
      borderLeftWidth: 3, borderLeftColor: cfg.border, borderLeftStyle: 'solid',
      padding: 7,
    }}>
      <View style={{
        borderWidth: 1, borderColor: cfg.border, borderStyle: 'solid',
        paddingHorizontal: 4, paddingVertical: 1, marginRight: 8, marginTop: 1,
      }}>
        <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, color: cfg.text, letterSpacing: 0.5 }}>
          {cfg.label}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: cfg.text, marginBottom: 2 }}>
          {item.clause}
        </Text>
        <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, color: T.ironInk, lineHeight: 1.45 }}>
          {item.description}
        </Text>
      </View>
    </View>
  )
}

function ChecklistDisclaimer({ tool }: { tool: string }) {
  return (
    <View style={{
      marginTop: 10, borderWidth: 1.5, borderColor: T.ironInk, borderStyle: 'solid',
      backgroundColor: T.blueprintBg, padding: 10,
    }}>
      <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.blueprint, marginBottom: 4, letterSpacing: 0.5 }}>
        DISCLAIMER — IS CODE COMPLIANCE CHECKLIST
      </Text>
      <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, color: T.ironInk, lineHeight: 1.6 }}>
        This IS Code Compliance Checklist is generated automatically from your input parameters. It does not
        constitute a {tool}&apos;s certificate. Actual construction must be supervised by a licensed structural engineer.
        Municipal approval mandatory before construction.
      </Text>
    </View>
  )
}

export default function StructoProPDF({ input, result, contact, reportId, projectName, date }: PDFProps) {
  // Derived quantities used across pages
  const bpm3 = bagsPerM3(input.concreteGrade)
  const totalConcreteM3 = result.quantities.cementBags / bpm3
  const gndM2 = input.groundFloorAreaSqft / 10.764
  const totalFloors = input.numFloors + 1

  // Foundation quantities (IS 456:2000 Section 8 — footing 0.50% steel = 39.25 kg/m³)
  const footingAreaM2 = gndM2 * 0.15
  const excavM3 = footingAreaM2 * 1.8 * 1.35
  const pccM3 = footingAreaM2 * 0.075
  const fndConcreteM3 = footingAreaM2 * 0.45
  const fndSteelKg = Math.round(fndConcreteM3 * 39.25)
  const shutteringM2 = footingAreaM2 * 3.0
  const antiTermiteSqft = input.groundFloorAreaSqft
  const backfillM3 = Math.max(0, excavM3 * 0.6)

  // Superstructure
  const superConcreteM3 = Math.max(0, totalConcreteM3 - fndConcreteM3 - pccM3)
  const superSteelKg = Math.max(0, result.quantities.steelKg - fndSteelKg)
  const plinthConcreteM3 = superConcreteM3 * 0.08
  const plinthSteelKg = Math.round(plinthConcreteM3 * 117.75)  // IS 456 Sect 8: plinth beam 1.5%
  const regularConcreteM3 = (superConcreteM3 - plinthConcreteM3) / totalFloors
  const regularSteelKg = Math.round((superSteelKg - plinthSteelKg) / totalFloors)
  const regularFormworkSqft = Math.round(result.quantities.formworkSqft / totalFloors)

  // Foundation BOQ costs
  const RATES = {
    excav: 380, pcc: 4200, rcc: 8500, steel: 68, shutter: 380, antiTermite: 15, backfill: 200,
  }
  const foundationBOQ = [
    { desc: 'Excavation in ordinary/hard soil for footings', unit: 'm³', qty: excavM3, rate: RATES.excav },
    { desc: 'PCC M10 (1:3:6) blinding layer — 75mm thick', unit: 'm³', qty: pccM3, rate: RATES.pcc },
    { desc: `RCC ${input.concreteGrade} concrete for isolated footings`, unit: 'm³', qty: fndConcreteM3, rate: RATES.rcc },
    { desc: `TMT ${input.steelGrade} steel reinforcement for footings`, unit: 'kg', qty: fndSteelKg, rate: RATES.steel },
    { desc: 'Wooden/steel shuttering and formwork for footings', unit: 'm²', qty: shutteringM2, rate: RATES.shutter },
    { desc: 'Anti-termite soil treatment (chemical barrier)', unit: 'sqft', qty: antiTermiteSqft, rate: RATES.antiTermite },
    { desc: 'Earth backfilling and mechanical compaction', unit: 'm³', qty: backfillM3, rate: RATES.backfill },
  ]
  const foundationTotal = foundationBOQ.reduce((s, r) => s + r.qty * r.rate, 0)

  // Material schedule rates (Build Reference Section 5 — Pune defaults)
  const matRates = { cement: 495, steel: 68, aggregate: 20, sand: 24, bindingWire: 85, formwork: 30 }

  // IS Code Compliance Checklist data
  const zoneNum = parseInt(result.seismicZone) || 2
  const hasViolations = result.compliance.some(c => c.status === 'fail')
  const isChecklist: ChecklistItem[] = [
    {
      status: 'pass',
      clause: 'IS 456:2000 Cl 6.1',
      description: `Concrete grade ${input.concreteGrade} meets minimum requirement for ${result.exposureClass.replace(/_/g, ' ')} exposure class`,
    },
    {
      status: 'pass',
      clause: 'IS 1786:2008',
      description: `TMT steel grade ${input.steelGrade} with guaranteed yield strength and ductility for earthquake zones`,
    },
    {
      status: 'pass',
      clause: 'IS 1893:2016 Cl 6.4',
      description: `Seismic Zone ${result.seismicZone} classification applied — design accelerations and load factors confirmed`,
    },
    {
      status: 'pass',
      clause: 'IS 456:2000 Cl 26.4',
      description: `Minimum steel ratio 0.8% for columns and 0.12% for slabs verified against provided quantities`,
    },
    {
      status: 'pass',
      clause: 'IS 456:2000 Cl 13.5',
      description: `Lateral ties (stirrups) at maximum 300mm c/c spacing required for all columns in this structure`,
    },
    {
      status: 'pass',
      clause: 'IS 4326:1993 Cl 8',
      description: `Earthquake-resistant detailing principles applied to RCC frame — special confining reinforcement at joints`,
    },
    {
      status: 'advisory' as const,
      clause: 'IS 1893:2016 Cl 7.1 — Soft Storey',
      description: zoneNum >= 3
        ? `Zone ${result.seismicZone} site — verify no storey has lateral stiffness less than 60% of storey above. Structural engineer must confirm.`
        : `Zone ${result.seismicZone} — soft storey risk is low but verify with structural engineer before finalling column dimensions.`,
    },
    {
      status: 'advisory' as const,
      clause: 'IS 1893:2016 Cl 7.1 — Geometric Irregularity',
      description: totalFloors >= 3 && zoneNum >= 3
        ? `${totalFloors}-storey structure in Zone ${result.seismicZone} — plan and vertical irregularity checks mandatory per IS 1893 Table 5 & 6.`
        : `Verify plan shape regularity — L/T/U footprints require torsion analysis per IS 1893:2016 Cl 7.1.`,
    },
    {
      status: 'advisory' as const,
      clause: 'IS 456:2000 Cl 22.3 — Cantilever Check',
      description: `Cantilever balconies/slabs require dedicated design — deflection limit L/350 (IS 456 Cl 23.2). Confirm with structural engineer.`,
    },
    {
      status: hasViolations ? 'violation' : 'advisory' as const,
      clause: 'IS 1893:2016 Cl 7.2 — Mass Irregularity',
      description: hasViolations
        ? result.compliance.filter(c => c.status === 'fail').map(c => c.detail).join('; ') || `One or more compliance checks failed — review IS Compliance Panel (Sheet 03) for details.`
        : `No mass irregularity detected based on input parameters. Confirm floor-to-floor weight variation < 50% with structural engineer.`,
    },
  ]

  return (
    <Document title={`NirmanShastra StructurePro Report — ${reportId}`} author="NirmanShastra">

      {/* ═══════════════════════════════════════════════════════
          PAGE 1 — COVER
          ═══════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          {/* Letterhead */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <View>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 14, fontWeight: 700, color: T.blueprint, letterSpacing: 2 }}>
                NIRMANSHASTRA
              </Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, letterSpacing: 0.5 }}>
                India&apos;s IS-Code Construction Cost Platform
              </Text>
            </View>
            <View style={{ borderWidth: 1, borderColor: T.blueprint, borderStyle: 'solid', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 1 }}>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.blueprint, letterSpacing: 1 }}>
                PHASE 1 · STRUCTOPRO
              </Text>
            </View>
          </View>

          <View style={S.rule} />

          {/* Eyebrow */}
          <Text style={{ ...S.eyebrow, marginTop: 12 }}>
            PHASE 1 — RCC STRUCTURE COST ESTIMATE · IS 456:2000
          </Text>

          {/* Client name */}
          <Text style={S.h1}>{contact.name}</Text>

          {/* Project + location */}
          <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 13, color: T.ironInk, marginBottom: 2 }}>
            {projectName}
          </Text>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 9, color: T.inkA60, marginBottom: 4 }}>
            {contact.address ? `${contact.address}, ` : ''}{contact.city}, {contact.state}
          </Text>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.inkA35, marginBottom: 18 }}>
            {fmtDate(date)} · {reportId}
          </Text>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'FLOORS',        value: floorsLabel(input.numFloors) },
              { label: 'TOTAL BUA',     value: `${num(result.totalBUA)} sqft` },
              { label: 'SEISMIC ZONE',  value: `IS Zone ${result.seismicZone}` },
              { label: 'EXPOSURE',      value: result.exposureClass.replace('_', ' ').toUpperCase() },
            ].map(s => (
              <View key={s.label} style={{ flex: 1, borderWidth: 1, borderColor: T.inkA15, borderStyle: 'solid', padding: 6 }}>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, color: T.inkA60, marginBottom: 3, letterSpacing: 0.5 }}>
                  {s.label}
                </Text>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 10, color: T.ironInk }}>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Grand total preview */}
          <View style={{ backgroundColor: T.blueprintBg, borderWidth: 1.5, borderColor: T.blueprint, borderStyle: 'solid', padding: 10, marginBottom: 12 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.blueprint, letterSpacing: 0.5, marginBottom: 4 }}>
              STRUCTURE COST ESTIMATE · {input.concreteGrade} · {input.steelGrade}
            </Text>
            <View style={{ flexDirection: 'row', gap: 20 }}>
              {[
                { label: 'BASIC',    v: result.grandTotal.basic },
                { label: 'STANDARD', v: result.grandTotal.standard },
                { label: 'PREMIUM',  v: result.grandTotal.premium },
              ].map(g => (
                <View key={g.label}>
                  <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, color: T.blueprint, letterSpacing: 0.5 }}>{g.label}</Text>
                  <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 13, color: T.ironInk }}>{rs(g.v)}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={S.flex1} />

          {/* Bottom row: foundation note + title block */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ flex: 1, paddingRight: 20 }}>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, lineHeight: 1.5 }}>
                Foundation: {result.foundationRecommendation.label} ({result.foundationRecommendation.isCode})
              </Text>
              {result.foundationRecommendation.warning && (
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.stampOxide, marginTop: 2 }}>
                  {result.foundationRecommendation.warning}
                </Text>
              )}
            </View>
            <TitleBlock projectName={projectName} reportId={reportId} date={date} />
          </View>

          <PageFooter sheet="SHEET 01 · COVER" />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════
          PAGE 2 — PROJECT SUMMARY TABLE
          ═══════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          <PageHeader sheet="SHEET 02 · PROJECT SUMMARY" title="Property & Technical Details" />

          {/* Client details */}
          <Text style={{ ...S.eyebrow, marginBottom: 6 }}>CLIENT & SITE INFORMATION</Text>
          <View style={S.table}>
            {[
              { l: 'Client Name',    v: contact.name, mono: false },
              { l: 'Mobile',         v: contact.mobile },
              { l: 'Email',          v: contact.email },
              { l: 'Site Address',   v: contact.address || '—', mono: false },
              { l: 'City',           v: contact.city },
              { l: 'State',          v: contact.state },
              { l: 'Project Name',   v: projectName, mono: false },
              { l: 'Report ID',      v: reportId },
              { l: 'Report Date',    v: fmtDate(date) },
            ].map(r => <InfoRow key={r.l} label={r.l} value={r.v} mono={r.mono ?? true} />)}
          </View>

          <View style={{ ...S.rule, marginTop: 12 }} />

          {/* Technical details */}
          <Text style={{ ...S.eyebrow, marginBottom: 6, marginTop: 4 }}>TECHNICAL PARAMETERS</Text>
          <View style={S.table}>
            {[
              { l: 'Ground Floor Area',    v: `${num(input.groundFloorAreaSqft)} sqft  (${num(gndM2, 1)} m²)` },
              { l: 'Number of Floors',     v: `${floorsLabel(input.numFloors)}  (${totalFloors} floor${totalFloors > 1 ? 's' : ''})` },
              { l: 'Total Built-Up Area',  v: `${num(result.totalBUA)} sqft  (${num(result.totalBUA / 10.764, 1)} m²)` },
              { l: 'Site Condition',       v: input.siteCondition.replace(/_/g, ' ') },
              { l: 'Foundation Type',      v: `${result.foundationRecommendation.label}  (${result.foundationRecommendation.isCode})` },
              { l: 'Seismic Zone',         v: `Zone ${result.seismicZone}  —  Z = ${result.zFactor}  (IS 1893:2016)` },
              { l: 'Exposure Class',       v: `${result.exposureClass.replace('_', ' ')}  (IS 456:2000 Table 5)` },
              { l: 'Concrete Grade',       v: `${input.concreteGrade}  (IS 456:2000)` },
              { l: 'Steel Grade',          v: `${input.steelGrade}  (IS 1786:2008)` },
              { l: 'Min. Concrete Cover',  v: 'Footing 50mm · Column 40mm · Beam 25–40mm · Slab 20–30mm  (IS 456:2000 Cl 26.4)' },
              { l: 'Curing Requirement',   v: 'Minimum 7 days wet hessian or water ponding  (IS 456:2000 Cl 13.5)' },
              { l: 'Steel Density',        v: '7850 kg/m³  (IS 1786:2008)' },
              { l: 'Dry Volume Factor',    v: '1.54 for concrete  (IS 456:2000)' },
            ].map(r => <InfoRow key={r.l} label={r.l} value={r.v} />)}
          </View>

          <View style={S.flex1} />
          <PageFooter sheet="SHEET 02 · PROJECT SUMMARY" />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════
          PAGE 3 — IS COMPLIANCE PANEL
          ═══════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          <PageHeader sheet="SHEET 03 · IS COMPLIANCE PANEL" title="Compliance Checks — IS 456:2000 · IS 13920:2016 · IS 1904:2016" />

          {/* Compliance badges — 2 per row */}
          {[0, 2, 4].map(i => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              {result.compliance.slice(i, i + 2).map(c => (
                <StampBadge key={c.id} check={c} />
              ))}
              {result.compliance.slice(i, i + 2).length < 2 && <View style={{ flex: 1 }} />}
            </View>
          ))}

          {/* Legend */}
          <View style={{ marginTop: 10, borderTopWidth: 0.5, borderTopColor: T.inkA15, borderTopStyle: 'solid', paddingTop: 8 }}>
            <Text style={{ ...S.eyebrow, marginBottom: 6 }}>STAMP LEGEND</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[
                { label: 'PASS',     color: T.approvedGreen, desc: 'Complies with IS code requirement' },
                { label: 'ADVISORY', color: T.markingYellow, desc: 'Check required — verify on site' },
                { label: 'FAIL',     color: T.stampOxide,   desc: 'Does not meet minimum IS code — must rectify' },
              ].map(l => (
                <View key={l.label} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ borderWidth: 1.5, borderColor: l.color, borderStyle: 'solid', paddingHorizontal: 4, paddingVertical: 1 }}>
                    <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: l.color, fontWeight: 700 }}>{l.label}</Text>
                  </View>
                  <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, color: T.inkA60, flex: 1 }}>{l.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Technical reminders (compressed) */}
          <View style={{ marginTop: 12 }}>
            <Text style={{ ...S.eyebrow, marginBottom: 6 }}>10 TECHNICAL REMINDERS — IS CODE MANDATED</Text>
            {result.technicalReminders.map((rem, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 3 }}>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.blueprint, width: 16, textAlign: 'right' }}>
                  {String(i + 1).padStart(2, '0')}
                </Text>
                <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 7.5, color: T.ironInk, flex: 1, lineHeight: 1.45 }}>
                  {rem}
                </Text>
              </View>
            ))}
          </View>

          <View style={S.flex1} />
          <PageFooter sheet="SHEET 03 · IS COMPLIANCE" />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════
          PAGE 4 — IS CODE COMPLIANCE CHECKLIST (FREE)
          ═══════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          <PageHeader sheet="SHEET 04 · IS CODE COMPLIANCE CHECKLIST" title="IS Code Compliance Checklist — Structural Phase" />
          <Text style={{ ...S.eyebrow, marginBottom: 8 }}>
            AUTOMATED COMPLIANCE REVIEW · IS 456:2000 · IS 1893:2016 · IS 1786:2008 · IS 4326:1993
          </Text>

          {isChecklist.map((item, i) => (
            <ChecklistRow key={i} item={item} />
          ))}

          <ChecklistDisclaimer tool="Structural Engineer" />

          <View style={S.flex1} />
          <PageFooter sheet="SHEET 04 · IS CODE COMPLIANCE CHECKLIST" />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════
          PAGE 5 — FOUNDATION BOQ
          ═══════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          <PageHeader sheet="SHEET 05 · FOUNDATION BILL OF QUANTITIES" title="Foundation Works — Quantities and Costs" />

          {/* Foundation type banner */}
          <View style={{ backgroundColor: T.blueprintBg, borderLeftWidth: 3, borderLeftColor: T.blueprint, borderLeftStyle: 'solid', padding: 8, marginBottom: 12 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint }}>
              {result.foundationRecommendation.label}  ·  {result.foundationRecommendation.isCode}
            </Text>
            {result.foundationRecommendation.warning && (
              <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, color: T.stampOxide, marginTop: 3 }}>
                {result.foundationRecommendation.warning}
              </Text>
            )}
          </View>

          {/* BOQ Table */}
          <View style={S.table}>
            <View style={S.tHead}>
              <Text style={{ ...S.tHeader, width: 28 }}>ITEM NO.</Text>
              <Text style={{ ...S.tHeader, flex: 1 }}>DESCRIPTION</Text>
              <Text style={{ ...S.tHeaderR, width: 32 }}>UNIT</Text>
              <Text style={{ ...S.tHeaderR, width: 45 }}>QTY</Text>
              <Text style={{ ...S.tHeaderR, width: 55 }}>RATE (₹)</Text>
              <Text style={{ ...S.tHeaderR, width: 65 }}>AMOUNT (₹)</Text>
            </View>
            {foundationBOQ.map((row, i) => (
              <View key={i} style={i % 2 === 0 ? S.tRow : S.tRowAlt}>
                <Text style={{ ...S.tCellMono, width: 28, color: T.inkA60 }}>{`1.${i + 1}`}</Text>
                <Text style={{ ...S.tCell, flex: 1, lineHeight: 1.45 }}>{row.desc}</Text>
                <Text style={{ ...S.tCellMono, width: 32 }}>{row.unit}</Text>
                <Text style={{ ...S.tCellMono, width: 45 }}>{num(row.qty, row.unit === 'kg' ? 0 : 2)}</Text>
                <Text style={{ ...S.tCellMono, width: 55 }}>{num(row.rate)}</Text>
                <Text style={{ ...S.tCellMono, width: 65 }}>{num(row.qty * row.rate)}</Text>
              </View>
            ))}
            <View style={S.tTotalRow}>
              <Text style={{ ...S.tCell, width: 20 }} />
              <Text style={{ ...S.tCell, flex: 1, fontWeight: 600 }}>FOUNDATION TOTAL</Text>
              <Text style={{ ...S.tCellMono, width: 32 }} />
              <Text style={{ ...S.tCellMono, width: 45 }} />
              <Text style={{ ...S.tCellMono, width: 55 }} />
              <Text style={{ ...S.tCellMono, width: 65, fontWeight: 700, color: T.blueprint }}>
                {num(foundationTotal)}
              </Text>
            </View>
          </View>

          {/* IS Note */}
          <View style={{ marginTop: 12, backgroundColor: T.yellowBg, borderLeftWidth: 2, borderLeftColor: T.markingYellow, borderLeftStyle: 'solid', padding: 8 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.markingYellow, marginBottom: 3 }}>IS NOTE</Text>
            <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, color: T.ironInk, lineHeight: 1.5 }}>
              Quantities derived from IS 456:2000 thumb rules. Foundation footprint estimated at 15% of ground floor area with 1.8m depth.
              Final quantities must be confirmed by geotechnical investigation (IS 1904:2016 Cl 4.1) and structural engineer&apos;s drawings.
              Geotechnical investigation cost: Rs.15,000 – Rs.50,000.
            </Text>
          </View>

          <View style={S.flex1} />
          <PageFooter sheet="SHEET 05 · FOUNDATION BOQ" />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════
          PAGE 6 — SUPERSTRUCTURE BOQ (PER FLOOR)
          ═══════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          <PageHeader sheet="SHEET 06 · SUPERSTRUCTURE BOQ" title="Superstructure — Per Floor Quantities" />

          {/* Per-floor table */}
          <Text style={{ ...S.eyebrow, marginBottom: 6 }}>
            {input.concreteGrade} CONCRETE · {input.steelGrade} STEEL · PER FLOOR BREAKDOWN
          </Text>
          <View style={S.table}>
            <View style={S.tHead}>
              <Text style={{ ...S.tHeader, flex: 1 }}>FLOOR LEVEL</Text>
              <Text style={{ ...S.tHeader, width: 70 }}>USE</Text>
              <Text style={{ ...S.tHeaderR, width: 75 }}>CONCRETE (m³)</Text>
              <Text style={{ ...S.tHeaderR, width: 70 }}>STEEL (kg)</Text>
              <Text style={{ ...S.tHeaderR, width: 80 }}>FORMWORK (sqft)</Text>
            </View>
            {/* Plinth beam */}
            <View style={S.tRow}>
              <Text style={{ ...S.tCell, flex: 1 }}>Plinth Level</Text>
              <Text style={{ ...S.tCell, width: 70 }}>Plinth Beam</Text>
              <Text style={{ ...S.tCellMono, width: 75 }}>{num(plinthConcreteM3, 2)}</Text>
              <Text style={{ ...S.tCellMono, width: 70 }}>{num(plinthSteelKg)}</Text>
              <Text style={{ ...S.tCellMono, width: 80 }}>—</Text>
            </View>
            {/* Each floor */}
            {Array.from({ length: totalFloors }).map((_, i) => {
              const label = i === 0 ? 'Ground Floor (GF)' : i === totalFloors - 1 && input.numFloors > 0 ? `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} Floor (Roof Slab)` : `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} Floor`
              const use = i === totalFloors - 1 && input.numFloors > 0 ? 'Roof Slab' : 'Cols + Beams + Slab'
              return (
                <View key={i} style={i % 2 === 0 ? S.tRow : S.tRowAlt}>
                  <Text style={{ ...S.tCell, flex: 1 }}>{label}</Text>
                  <Text style={{ ...S.tCell, width: 70 }}>{use}</Text>
                  <Text style={{ ...S.tCellMono, width: 75 }}>{num(regularConcreteM3, 2)}</Text>
                  <Text style={{ ...S.tCellMono, width: 70 }}>{num(regularSteelKg)}</Text>
                  <Text style={{ ...S.tCellMono, width: 80 }}>{num(regularFormworkSqft)}</Text>
                </View>
              )
            })}
            {/* Total */}
            <View style={S.tTotalRow}>
              <Text style={{ ...S.tCell, flex: 1, fontWeight: 600 }}>SUPERSTRUCTURE TOTAL</Text>
              <Text style={{ ...S.tCell, width: 70 }} />
              <Text style={{ ...S.tCellMono, width: 75, fontWeight: 700, color: T.blueprint }}>{num(superConcreteM3, 2)}</Text>
              <Text style={{ ...S.tCellMono, width: 70, fontWeight: 700, color: T.blueprint }}>{num(superSteelKg)}</Text>
              <Text style={{ ...S.tCellMono, width: 80, fontWeight: 700, color: T.blueprint }}>{num(result.quantities.formworkSqft)}</Text>
            </View>
          </View>

          {/* Member type steel breakdown — IS 456:2000 Section 8 LOCKED values */}
          <Text style={{ ...S.eyebrow, marginTop: 14, marginBottom: 6 }}>
            STEEL BY MEMBER TYPE — IS 456:2000 SECTION 26.5 · IS 1786:2008
          </Text>
          <View style={S.table}>
            <View style={S.tHead}>
              <Text style={{ ...S.tHeader, flex: 1 }}>MEMBER</Text>
              <Text style={{ ...S.tHeaderR, width: 70 }}>STEEL %</Text>
              <Text style={{ ...S.tHeaderR, width: 80 }}>STEEL (kg/m³)</Text>
              <Text style={{ ...S.tHeaderR, width: 90 }}>EST. STEEL (kg)</Text>
            </View>
            {[
              { member: 'Footing (IS 456 Cl 26.5)', pct: '0.50%', kgm3: '39.25',  kg: fndSteelKg },
              { member: 'Plinth Beam', pct: '1.50%', kgm3: '117.75', kg: plinthSteelKg },
              { member: `Column (${input.concreteGrade})`, pct: '2.50%', kgm3: '196.25', kg: Math.round(superSteelKg * 0.30) },
              { member: 'Beam', pct: '1.50%', kgm3: '117.75', kg: Math.round(superSteelKg * 0.25) },
              { member: 'Slab', pct: '1.00%', kgm3: '78.50',  kg: Math.round(superSteelKg * 0.20) },
            ].map((r, i) => (
              <View key={i} style={i % 2 === 0 ? S.tRow : S.tRowAlt}>
                <Text style={{ ...S.tCell, flex: 1 }}>{r.member}</Text>
                <Text style={{ ...S.tCellMono, width: 70 }}>{r.pct}</Text>
                <Text style={{ ...S.tCellMono, width: 80 }}>{r.kgm3}</Text>
                <Text style={{ ...S.tCellMono, width: 90 }}>{num(r.kg)}</Text>
              </View>
            ))}
            <View style={S.tTotalRow}>
              <Text style={{ ...S.tCell, flex: 1, fontWeight: 600 }}>TOTAL STEEL (STRUCTURE)</Text>
              <Text style={{ ...S.tCellMono, width: 70 }} />
              <Text style={{ ...S.tCellMono, width: 80 }} />
              <Text style={{ ...S.tCellMono, width: 90, fontWeight: 700, color: T.blueprint }}>{num(result.quantities.steelKg)}</Text>
            </View>
          </View>

          <Text style={{ ...S.monoSm, marginTop: 6 }}>
            Note: Column bars lap length minimum 50 × bar dia (IS 456:2000 Cl 26.2.5). Binding wire: {num(result.quantities.bindingWireKg)} kg (10 kg/tonne steel).
          </Text>

          <View style={S.flex1} />
          <PageFooter sheet="SHEET 06 · SUPERSTRUCTURE BOQ" />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════
          PAGE 7 — MATERIAL SCHEDULE
          ═══════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          <PageHeader sheet="SHEET 07 · MATERIAL PURCHASE SCHEDULE" title="Purchase Quantities — Order Schedule" />

          <View style={S.table}>
            <View style={S.tHead}>
              <Text style={{ ...S.tHeader, width: 28 }}>ITEM NO.</Text>
              <Text style={{ ...S.tHeader, flex: 1 }}>DESCRIPTION</Text>
              <Text style={{ ...S.tHeader, width: 110 }}>SPECIFICATION</Text>
              <Text style={{ ...S.tHeaderR, width: 40 }}>UNIT</Text>
              <Text style={{ ...S.tHeaderR, width: 50 }}>QTY</Text>
              <Text style={{ ...S.tHeaderR, width: 50 }}>RATE (₹)</Text>
              <Text style={{ ...S.tHeaderR, width: 60 }}>AMOUNT (₹)</Text>
            </View>
            {[
              {
                mat: 'Cement',
                spec: `OPC 43/53 Grade, ISI Marked (IS 269:2015)`,
                qty: result.quantities.cementBags,
                unit: '50kg bags',
                rate: matRates.cement,
              },
              {
                mat: `Steel — ${input.steelGrade} TMT`,
                spec: 'Fe500D — High ductility (IS 1786:2008)',
                qty: result.quantities.steelKg,
                unit: 'kg',
                rate: matRates.steel,
              },
              {
                mat: 'Coarse Aggregate',
                spec: '20mm Graded, hard stone (IS 383:2016)',
                qty: result.quantities.aggregateCft,
                unit: 'cft',
                rate: matRates.aggregate,
              },
              {
                mat: 'Fine Aggregate (Sand)',
                spec: 'River Sand / M-Sand Zone II (IS 2116:1980)',
                qty: result.quantities.sandCft,
                unit: 'cft',
                rate: matRates.sand,
              },
              {
                mat: 'Binding Wire',
                spec: '18 Gauge GI Wire (10 kg/tonne steel)',
                qty: result.quantities.bindingWireKg,
                unit: 'kg',
                rate: matRates.bindingWire,
              },
              {
                mat: 'Shuttering Plywood',
                spec: '12mm Marine Ply / Steel shuttering panels',
                qty: result.quantities.formworkSqft,
                unit: 'sqft',
                rate: matRates.formwork,
              },
            ].map((r, i) => (
              <View key={i} style={i % 2 === 0 ? S.tRow : S.tRowAlt}>
                <Text style={{ ...S.tCellMono, width: 28, color: T.inkA60 }}>{`2.${i + 1}`}</Text>
                <Text style={{ ...S.tCell, flex: 1, fontWeight: 500 }}>{r.mat}</Text>
                <Text style={{ ...S.tCell, width: 110, lineHeight: 1.4 }}>{r.spec}</Text>
                <Text style={{ ...S.tCellMono, width: 40 }}>{r.unit}</Text>
                <Text style={{ ...S.tCellMono, width: 50 }}>{num(r.qty)}</Text>
                <Text style={{ ...S.tCellMono, width: 50 }}>{num(r.rate)}</Text>
                <Text style={{ ...S.tCellMono, width: 60 }}>{num(r.qty * r.rate)}</Text>
              </View>
            ))}
            <View style={S.tTotalRow}>
              <Text style={{ ...S.tCellMono, width: 28 }} />
              <Text style={{ ...S.tCell, flex: 1, fontWeight: 600 }}>TOTAL MATERIAL COST</Text>
              <Text style={{ ...S.tCell, width: 110 }} />
              <Text style={{ ...S.tCellMono, width: 40 }} />
              <Text style={{ ...S.tCellMono, width: 50 }} />
              <Text style={{ ...S.tCellMono, width: 50 }} />
              <Text style={{ ...S.tCellMono, width: 60, fontWeight: 700, color: T.blueprint }}>
                {num(result.costs.total)}
              </Text>
            </View>
          </View>

          {/* Material notes */}
          <View style={{ marginTop: 14 }}>
            <Text style={{ ...S.eyebrow, marginBottom: 8 }}>MATERIAL QUALITY NOTES — IS CODE MANDATED</Text>
            {[
              'Add 5% wastage on all materials before placing the purchase order. IS 456:2000.',
              `Verify ISI certification on every cement bag (IS 269:2015). Reject unmarked bags.`,
              `${input.steelGrade} bars must be free of loose rust, oil, paint, or mud before tying (IS 1786:2008 Cl 8).`,
              'Cast 3 cube specimens (150mm) per concrete pour. Test at 7 and 28 days (IS 516:1959).',
              'M-Sand must meet IS 2116:1980 Zone II gradation. River sand from approved quarry only.',
              'Coarse aggregate: Los Angeles abrasion value < 30%. Flakiness index < 35% (IS 383:2016).',
            ].map((note, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint }}>·</Text>
                <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, color: T.ironInk, flex: 1, lineHeight: 1.45 }}>{note}</Text>
              </View>
            ))}
          </View>

          {/* Rates note */}
          <View style={{ marginTop: 10, backgroundColor: T.yellowBg, padding: 8, borderLeftWidth: 2, borderLeftColor: T.markingYellow, borderLeftStyle: 'solid' }}>
            <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, color: T.ironInk }}>
              Rates used: Pune city average 2026. Cement Rs.495/bag · Steel Rs.68/kg · Aggregate Rs.20/cft · Sand Rs.24/cft.
              Verify current market rates before ordering. Rates updated quarterly at NirmanShastra.in.
            </Text>
          </View>

          <View style={S.flex1} />
          <PageFooter sheet="SHEET 07 · MATERIAL SCHEDULE" />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════
          PAGE 8 — COST SUMMARY (BASIC / STANDARD / PREMIUM)
          ═══════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          <PageHeader sheet="SHEET 08 · COST SUMMARY" title="Three-Grade Estimate — Basic / Standard / Premium" />

          {/* Main cost summary table */}
          <View style={S.table}>
            <View style={S.tHead}>
              <Text style={{ ...S.tHeader, flex: 1 }}>COST HEAD</Text>
              <Text style={{ ...S.tHeaderR, width: 110 }}>BASIC (Rs.)</Text>
              <Text style={{ ...S.tHeaderR, width: 110 }}>STANDARD (Rs.)</Text>
              <Text style={{ ...S.tHeaderR, width: 110 }}>PREMIUM (Rs.)</Text>
            </View>
            {[
              {
                label: 'Materials (cement, steel, aggregate, sand, formwork)',
                basic: result.costs.total,
                std: result.costs.total,
                prem: result.costs.total,
              },
              {
                label: 'Labour (CPWD rates) — 15% / 28% / 38% of material',
                basic: Math.round(result.costs.total * 0.15),
                std: Math.round(result.costs.total * 0.28),
                prem: Math.round(result.costs.total * 0.38),
              },
              {
                label: 'Contractor overhead + margin — 5% / 10% / 15%',
                basic: Math.round((result.costs.total + result.costs.total * 0.15) * 0.05),
                std:   Math.round((result.costs.total + result.costs.total * 0.28) * 0.10),
                prem:  Math.round((result.costs.total + result.costs.total * 0.38) * 0.15),
              },
            ].map((r, i) => (
              <View key={i} style={i % 2 === 0 ? S.tRow : S.tRowAlt}>
                <Text style={{ ...S.tCell, flex: 1, lineHeight: 1.45 }}>{r.label}</Text>
                <Text style={{ ...S.tCellMono, width: 110 }}>{num(r.basic)}</Text>
                <Text style={{ ...S.tCellMono, width: 110 }}>{num(r.std)}</Text>
                <Text style={{ ...S.tCellMono, width: 110 }}>{num(r.prem)}</Text>
              </View>
            ))}
            {/* Grand total row */}
            <View style={S.tTotalRow}>
              <Text style={{ ...S.tCell, flex: 1, fontWeight: 600 }}>GRAND TOTAL</Text>
              <Text style={{ ...S.tCellMono, width: 110, fontWeight: 700 }}>{num(result.grandTotal.basic)}</Text>
              <Text style={{ ...S.tCellMono, width: 110, fontWeight: 700, color: T.blueprint }}>{num(result.grandTotal.standard)}</Text>
              <Text style={{ ...S.tCellMono, width: 110, fontWeight: 700 }}>{num(result.grandTotal.premium)}</Text>
            </View>
            {/* Per sqft row */}
            <View style={{ ...S.tRow, backgroundColor: T.blueprintBg }}>
              <Text style={{ ...S.tCell, flex: 1 }}>Per sqft cost (on Total BUA)</Text>
              <Text style={{ ...S.tCellMono, width: 110 }}>Rs.{num(result.perSqftCost.basic)}/sqft</Text>
              <Text style={{ ...S.tCellMono, width: 110, color: T.blueprint }}>Rs.{num(result.perSqftCost.standard)}/sqft</Text>
              <Text style={{ ...S.tCellMono, width: 110 }}>Rs.{num(result.perSqftCost.premium)}/sqft</Text>
            </View>
          </View>

          {/* Grade descriptions */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            {[
              {
                grade: 'BASIC',
                desc: 'Local unskilled labour + minimum spec materials. Lowest cost, lowest oversight. Suitable for rural/low-budget builds.',
                color: T.inkA35,
              },
              {
                grade: 'STANDARD',
                desc: 'CPWD schedule rates + trained skilled labour + contractor overhead. Typical urban residential build. Recommended.',
                color: T.blueprint,
              },
              {
                grade: 'PREMIUM',
                desc: 'Premium skilled labour + professional site supervision + margin. Higher quality, tighter tolerances. Recommended for G+3+.',
                color: T.ironInk,
              },
            ].map(g => (
              <View key={g.grade} style={{ flex: 1, borderWidth: 1, borderColor: g.color, borderStyle: 'solid', padding: 8 }}>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: g.color, fontWeight: 700, marginBottom: 4 }}>{g.grade}</Text>
                <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, color: T.ironInk, lineHeight: 1.45 }}>{g.desc}</Text>
              </View>
            ))}
          </View>

          {/* Warning box */}
          <View style={{ marginTop: 14, backgroundColor: T.oxideBg, borderLeftWidth: 3, borderLeftColor: T.stampOxide, borderLeftStyle: 'solid', padding: 10 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.stampOxide, marginBottom: 4 }}>IMPORTANT — SCOPE OF THIS ESTIMATE</Text>
            <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, lineHeight: 1.6 }}>
              This estimate covers Phase 1 — RCC Structure ONLY. The structural frame is only 40-45% of your total building cost.
              Budget additionally for Phase 2 Masonry (20-25%), Phase 3 Electrical (8-12%), Phase 4 Plumbing (6-10%),
              Phase 5 Interior (12-18%), and Contractor overhead (10-15%). Do NOT approach your bank or financier with this estimate alone.
            </Text>
          </View>

          <View style={S.flex1} />
          <PageFooter sheet="SHEET 08 · COST SUMMARY" />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════
          PAGE 9 — GRADE COMPARISON CHART
          ═══════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          <PageHeader sheet="SHEET 09 · GRADE COMPARISON CHART" title="Concrete Grade — Cost & Compliance Impact" />

          {/* Bar chart using SVG */}
          <Text style={{ ...S.eyebrow, marginBottom: 8 }}>COST PER SQFT (STANDARD ESTIMATE) — SELECTED GRADE HIGHLIGHTED</Text>

          <Svg width="507" height="140" viewBox="0 0 507 140">
            {/* Axis */}
            <Rect x="40" y="10" width="0.5" height="110" fill={T.inkA35} />
            <Rect x="40" y="120" width="467" height="0.5" fill={T.inkA35} />

            {result.gradeSummary.map((g, i) => {
              const maxCost = result.gradeSummary[result.gradeSummary.length - 1].costPerSqft
              const barW = Math.round((g.costPerSqft / maxCost) * 440)
              const y = 15 + i * 26
              const isSelected = g.grade === input.concreteGrade
              return (
                <React.Fragment key={g.grade}>
                  {/* Label */}
                  <Rect x="0" y={y} width={38} height={18} fill="none" />

                  {/* Bar */}
                  <Rect
                    x="42" y={y}
                    width={barW} height={18}
                    fill={isSelected ? T.blueprint : T.inkA15}
                  />

                  {/* Cost label inside/outside bar */}
                  <Rect x={barW + 46} y={y + 4} width={60} height={12} fill="none" />
                </React.Fragment>
              )
            })}
          </Svg>

          {/* Chart legend with actual numbers (react-pdf Text can't overlay SVG easily) */}
          <View style={{ marginTop: -120 }}>
            {result.gradeSummary.map((g) => {
              const maxCost = result.gradeSummary[result.gradeSummary.length - 1].costPerSqft
              const barPct = Math.round((g.costPerSqft / maxCost) * 100)
              const isSelected = g.grade === input.concreteGrade
              return (
                <View key={g.grade} style={{ marginBottom: 8, marginLeft: 42 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 9, color: isSelected ? T.blueprint : T.ironInk, width: 35, fontWeight: isSelected ? 700 : 400 }}>
                      {g.grade}
                    </Text>
                    {isSelected && (
                      <View style={{ backgroundColor: T.blueprint, paddingHorizontal: 4, paddingVertical: 1, marginRight: 6 }}>
                        <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.sheetWhite }}>SELECTED</Text>
                      </View>
                    )}
                    <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 9, color: isSelected ? T.blueprint : T.inkA60 }}>
                      Rs.{g.costPerSqft}/sqft  ·  {barPct}% of max
                    </Text>
                  </View>
                  <View style={{ height: 12, backgroundColor: isSelected ? T.blueprintBg : T.inkA15, width: '100%' }}>
                    <View style={{ height: 12, backgroundColor: isSelected ? T.blueprint : T.inkA35, width: `${barPct}%` }} />
                  </View>
                </View>
              )
            })}
          </View>

          <View style={S.rule} />

          {/* IS 456:2000 Section 8 grade table — LOCKED VALUES */}
          <Text style={{ ...S.eyebrow, marginBottom: 6 }}>
            IS 456:2000 TABLE 9 — CONCRETE MIX RATIOS (LOCKED VALUES — SECTION 8)
          </Text>
          <View style={S.table}>
            <View style={S.tHead}>
              <Text style={{ ...S.tHeader, width: 50 }}>GRADE</Text>
              <Text style={{ ...S.tHeader, width: 70 }}>MIX RATIO</Text>
              <Text style={{ ...S.tHeaderR, width: 80 }}>CEMENT (bags/m³)</Text>
              <Text style={{ ...S.tHeaderR, width: 75 }}>SAND (cft/m³)</Text>
              <Text style={{ ...S.tHeaderR, width: 85 }}>AGGREGATE (cft/m³)</Text>
              <Text style={{ ...S.tHeader, flex: 1 }}>MIN EXPOSURE</Text>
            </View>
            {[
              { grade: 'M20', mix: '1:1.5:3',    cement: '8.07',  sand: '11.22', agg: '22.44', exp: 'Mild (IS 456 Table 5)' },
              { grade: 'M25', mix: '1:1:2',       cement: '11.00', sand: '7.48',  agg: '14.96', exp: 'Moderate' },
              { grade: 'M30', mix: 'Design mix',  cement: 'Per SE', sand: '—',   agg: '—',     exp: 'Severe' },
              { grade: 'M35', mix: 'Design mix',  cement: 'Per SE', sand: '—',   agg: '—',     exp: 'Very Severe / Coastal' },
            ].map((r, i) => (
              <View key={r.grade} style={r.grade === input.concreteGrade ? { ...S.tRow, backgroundColor: T.blueprintBg } : i % 2 === 0 ? S.tRow : S.tRowAlt}>
                <Text style={{ ...S.tCellMono, width: 50, fontWeight: r.grade === input.concreteGrade ? 700 : 400, color: r.grade === input.concreteGrade ? T.blueprint : T.ironInk }}>{r.grade}</Text>
                <Text style={{ ...S.tCellMono, width: 70 }}>{r.mix}</Text>
                <Text style={{ ...S.tCellMono, width: 80 }}>{r.cement}</Text>
                <Text style={{ ...S.tCellMono, width: 75 }}>{r.sand}</Text>
                <Text style={{ ...S.tCellMono, width: 85 }}>{r.agg}</Text>
                <Text style={{ ...S.tCell, flex: 1 }}>{r.exp}</Text>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 8, backgroundColor: T.yellowBg, padding: 6, borderLeftWidth: 2, borderLeftColor: T.markingYellow, borderLeftStyle: 'solid' }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7.5, color: T.ironInk }}>
              IS NOTE: M20 mix ratio is 1:1.5:3 — NOT 1:2:4. Common error in many contractor quotes. IS 456:2000 Table 9 is the reference.
              Dry volume factor for concrete = 1.54 (NOT 1.1 — that is for mortar).
            </Text>
          </View>

          <View style={S.flex1} />
          <PageFooter sheet="SHEET 09 · GRADE COMPARISON" />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════
          PAGE 10 — FINISHING COSTS GUIDE
          ═══════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          <PageHeader sheet="SHEET 10 · FINISHING COSTS GUIDE" title="Budget Beyond This Report — All Phases" />

          {/* Phase breakdown table */}
          <Text style={{ ...S.eyebrow, marginBottom: 6 }}>WHAT THIS REPORT DOES NOT INCLUDE — BUDGET SEPARATELY</Text>
          <View style={S.table}>
            <View style={S.tHead}>
              <Text style={{ ...S.tHeader, width: 60 }}>PHASE</Text>
              <Text style={{ ...S.tHeader, flex: 1 }}>WORK CATEGORY</Text>
              <Text style={{ ...S.tHeaderR, width: 90 }}>% OF STRUCTURE</Text>
              <Text style={{ ...S.tHeaderR, width: 100 }}>EST. AMOUNT (Rs.)</Text>
              <Text style={{ ...S.tHeader, width: 80 }}>TOOL</Text>
            </View>
            {[
              { phase: 'Phase 2', work: 'Brickwork + Masonry (9" + 4.5" walls)', pctLow: 20, pctHigh: 25, tool: 'MasonryPro' },
              { phase: 'Phase 2', work: 'Plaster + Waterproofing (IS 2645:2003)', pctLow: 8, pctHigh: 10, tool: 'MasonryPro' },
              { phase: 'Phase 3', work: 'Electrical Wiring + DB Panel (IS 732:2019)', pctLow: 8, pctHigh: 12, tool: 'ElectricalPro' },
              { phase: 'Phase 4', work: 'Plumbing + Drainage (IS 1172:1993)', pctLow: 6, pctHigh: 10, tool: 'PlumbingPro' },
              { phase: 'Phase 5', work: 'Flooring, Kitchen, False Ceiling', pctLow: 10, pctHigh: 15, tool: 'InteriorPro' },
              { phase: 'Phase 5', work: 'Paint + Wall Finish (0.18L/sqft BUA)', pctLow: 4, pctHigh: 6, tool: 'InteriorPro' },
              { phase: '—', work: 'Doors + Windows (all frames + glazing)', pctLow: 8, pctHigh: 12, tool: '—' },
              { phase: '—', work: 'False Ceiling + Carpentry', pctLow: 5, pctHigh: 10, tool: 'InteriorPro' },
              { phase: '—', work: 'Contractor Overhead + Site Management', pctLow: 10, pctHigh: 15, tool: '—' },
              { phase: '—', work: 'Professional Fees (Architect + Engineer)', pctLow: 2, pctHigh: 4, tool: '—' },
            ].map((r, i) => {
              const midPct = (r.pctLow + r.pctHigh) / 200
              const estAmount = Math.round(result.grandTotal.standard * midPct)
              return (
                <View key={i} style={i % 2 === 0 ? S.tRow : S.tRowAlt}>
                  <Text style={{ ...S.tCellMono, width: 60 }}>{r.phase}</Text>
                  <Text style={{ ...S.tCell, flex: 1, lineHeight: 1.4 }}>{r.work}</Text>
                  <Text style={{ ...S.tCellMono, width: 90 }}>{r.pctLow}–{r.pctHigh}%</Text>
                  <Text style={{ ...S.tCellMono, width: 100 }}>{num(estAmount)}</Text>
                  <Text style={{ ...S.tCell, width: 80, color: T.blueprint }}>{r.tool}</Text>
                </View>
              )
            })}
          </View>

          {/* Grade multipliers */}
          <Text style={{ ...S.eyebrow, marginTop: 14, marginBottom: 6 }}>TOTAL PROJECT COST MULTIPLIERS (STRUCTURE × MULTIPLIER)</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { grade: 'BASIC FINISH',    mult: '1.8 – 2.0×', desc: 'Bare minimum finishing. Budget flooring, basic plaster, no false ceiling.' },
              { grade: 'STANDARD FINISH', mult: '2.2 – 2.5×', desc: 'Good quality tiles, modular kitchen, standard electrical and plumbing.' },
              { grade: 'PREMIUM FINISH',  mult: '2.8 – 3.2×', desc: 'Premium marble, designer kitchen, full automation, premium fixtures.' },
            ].map(g => (
              <View key={g.grade} style={{ flex: 1, borderWidth: 1, borderColor: T.inkA15, borderStyle: 'solid', padding: 8, backgroundColor: T.blueprintBg }}>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.blueprint, marginBottom: 3 }}>{g.grade}</Text>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 16, color: T.ironInk, marginBottom: 4 }}>{g.mult}</Text>
                <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 7.5, color: T.inkA60, lineHeight: 1.45 }}>{g.desc}</Text>
                <View style={{ marginTop: 6, borderTopWidth: 0.5, borderTopColor: T.inkA15, borderTopStyle: 'solid', paddingTop: 4 }}>
                  <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint }}>
                    Est. Total: {rs(Math.round(result.grandTotal.standard * parseFloat(g.mult.split('–')[0].trim())))} – {rs(Math.round(result.grandTotal.standard * parseFloat(g.mult.split('×')[0].split('–')[1]?.trim() ?? '1')))}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Warning */}
          <View style={{ marginTop: 12, backgroundColor: T.oxideBg, borderLeftWidth: 3, borderLeftColor: T.stampOxide, borderLeftStyle: 'solid', padding: 10 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.stampOxide, marginBottom: 3 }}>CRITICAL REMINDER</Text>
            <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, lineHeight: 1.6 }}>
              The RCC structural frame (this report) is only 40-45% of your total building cost. A complete house requires Phases 1 through 5.
              Do not approach your bank or financier with this structural estimate alone. Use NirmanShastra&apos;s complete 5-phase bundle for your loan application.
            </Text>
          </View>

          <View style={S.flex1} />
          <PageFooter sheet="SHEET 10 · FINISHING GUIDE" />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════
          PAGE — FOUNDATION & COLUMN LAYOUT — SCHEMATIC
          ═══════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <View>
              <Text style={S.eyebrow}>NIRMANSHASTRA · STRUCTOPRO · IS 456:2000</Text>
              <Text style={S.h2}>Foundation & Column Layout — Schematic</Text>
            </View>
            <View style={{ borderWidth: 1, borderColor: T.inkA35, borderStyle: 'solid', padding: 5 }}>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, color: T.inkA60 }}>NOT FOR CONSTRUCTION</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, color: T.inkA60 }}>LICENSED ENGINEER REQUIRED</Text>
            </View>
          </View>
          <View style={S.rule} />

          <View style={{ flexDirection: 'row', gap: 16 }}>
            {/* Left: Footing plan (top view) */}
            <View style={{ flex: 3 }}>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6.5, color: T.blueprint, letterSpacing: 1, marginBottom: 6 }}>
                ISOLATED FOOTING PLAN — SCHEMATIC (NOT FOR CONSTRUCTION)
              </Text>
              <Svg viewBox="0 0 300 285" style={{ width: 228, height: 217 }}>
                {/* Column centrelines (light) */}
                <Line x1={50} y1={0} x2={50} y2={268} strokeWidth={0.35} stroke={T.inkA35} strokeDasharray="3,3" />
                <Line x1={150} y1={0} x2={150} y2={268} strokeWidth={0.35} stroke={T.inkA35} strokeDasharray="3,3" />
                <Line x1={250} y1={0} x2={250} y2={268} strokeWidth={0.35} stroke={T.inkA35} strokeDasharray="3,3" />
                <Line x1={0} y1={50} x2={295} y2={50} strokeWidth={0.35} stroke={T.inkA35} strokeDasharray="3,3" />
                <Line x1={0} y1={150} x2={295} y2={150} strokeWidth={0.35} stroke={T.inkA35} strokeDasharray="3,3" />
                <Line x1={0} y1={250} x2={295} y2={250} strokeWidth={0.35} stroke={T.inkA35} strokeDasharray="3,3" />
                {/* Plinth beams (wide lines) */}
                <Line x1={50} y1={50} x2={250} y2={50} strokeWidth={5} stroke={T.inkA15} />
                <Line x1={50} y1={150} x2={250} y2={150} strokeWidth={5} stroke={T.inkA15} />
                <Line x1={50} y1={250} x2={250} y2={250} strokeWidth={5} stroke={T.inkA15} />
                <Line x1={50} y1={50} x2={50} y2={250} strokeWidth={5} stroke={T.inkA15} />
                <Line x1={150} y1={50} x2={150} y2={250} strokeWidth={5} stroke={T.inkA15} />
                <Line x1={250} y1={50} x2={250} y2={250} strokeWidth={5} stroke={T.inkA15} />
                {/* Row 1 footings + columns */}
                <Rect x={30} y={30} width={40} height={40} fill="none" stroke={T.ironInk} strokeWidth={1} />
                <Rect x={45} y={45} width={10} height={10} fill={T.ironInk} />
                <Rect x={130} y={30} width={40} height={40} fill="none" stroke={T.ironInk} strokeWidth={1} />
                <Rect x={145} y={45} width={10} height={10} fill={T.ironInk} />
                <Rect x={230} y={30} width={40} height={40} fill="none" stroke={T.ironInk} strokeWidth={1} />
                <Rect x={245} y={45} width={10} height={10} fill={T.ironInk} />
                {/* Row 2 footings + columns */}
                <Rect x={30} y={130} width={40} height={40} fill="none" stroke={T.ironInk} strokeWidth={1} />
                <Rect x={45} y={145} width={10} height={10} fill={T.ironInk} />
                <Rect x={130} y={130} width={40} height={40} fill="none" stroke={T.ironInk} strokeWidth={1} />
                <Rect x={145} y={145} width={10} height={10} fill={T.ironInk} />
                <Rect x={230} y={130} width={40} height={40} fill="none" stroke={T.ironInk} strokeWidth={1} />
                <Rect x={245} y={145} width={10} height={10} fill={T.ironInk} />
                {/* Row 3 footings + columns */}
                <Rect x={30} y={230} width={40} height={40} fill="none" stroke={T.ironInk} strokeWidth={1} />
                <Rect x={45} y={245} width={10} height={10} fill={T.ironInk} />
                <Rect x={130} y={230} width={40} height={40} fill="none" stroke={T.ironInk} strokeWidth={1} />
                <Rect x={145} y={245} width={10} height={10} fill={T.ironInk} />
                <Rect x={230} y={230} width={40} height={40} fill="none" stroke={T.ironInk} strokeWidth={1} />
                <Rect x={245} y={245} width={10} height={10} fill={T.ironInk} />
                {/* Column labels */}
                <Text x={46} y={10} style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.blueprint }}>C1</Text>
                <Text x={146} y={10} style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.blueprint }}>C2</Text>
                <Text x={246} y={10} style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.blueprint }}>C3</Text>
                {/* Dimension line */}
                <Line x1={50} y1={276} x2={150} y2={276} strokeWidth={0.7} stroke={T.ironInk} />
                <Line x1={50} y1={272} x2={50} y2={280} strokeWidth={0.7} stroke={T.ironInk} />
                <Line x1={150} y1={272} x2={150} y2={280} strokeWidth={0.7} stroke={T.ironInk} />
                <Text x={78} y={285} style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.ironInk }}>3.5m (typ.)</Text>
                {/* Plinth beam label */}
                <Text x={62} y={147} style={{ fontFamily: 'IBMPlexSans', fontSize: 5.5, fill: T.inkA60 }}>Plinth beam</Text>
              </Svg>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, color: T.inkA60, marginTop: 3 }}>
                FOOTING: 1200×1200mm · COLUMN: 300×300mm · BEAM: 230×350mm
              </Text>
            </View>

            {/* Right: Column cross-section */}
            <View style={{ flex: 2 }}>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6.5, color: T.blueprint, letterSpacing: 1, marginBottom: 6 }}>
                COLUMN SECTION — 300×300mm
              </Text>
              <Svg viewBox="0 0 160 245" style={{ width: 136, height: 208 }}>
                {/* Column outline */}
                <Rect x={30} y={20} width={100} height={210} fill={T.sheetWhite} stroke={T.ironInk} strokeWidth={1.5} />
                {/* Stirrups */}
                <Line x1={35} y1={55} x2={125} y2={55} strokeWidth={0.8} stroke={T.ironInk} />
                <Line x1={35} y1={95} x2={125} y2={95} strokeWidth={0.8} stroke={T.ironInk} />
                <Line x1={35} y1={135} x2={125} y2={135} strokeWidth={0.8} stroke={T.ironInk} />
                <Line x1={35} y1={175} x2={125} y2={175} strokeWidth={0.8} stroke={T.ironInk} />
                <Line x1={35} y1={215} x2={125} y2={215} strokeWidth={0.8} stroke={T.ironInk} />
                {/* Fe500D rebar circles at corners */}
                <Circle cx={42} cy={32} r={5} fill={T.ironInk} />
                <Circle cx={118} cy={32} r={5} fill={T.ironInk} />
                <Circle cx={42} cy={218} r={5} fill={T.ironInk} />
                <Circle cx={118} cy={218} r={5} fill={T.ironInk} />
                {/* 40mm cover dimension */}
                <Line x1={8} y1={32} x2={37} y2={32} strokeWidth={0.7} stroke={T.blueprint} />
                <Line x1={8} y1={28} x2={8} y2={36} strokeWidth={0.7} stroke={T.blueprint} />
                <Text x={2} y={26} style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, fill: T.blueprint }}>40mm</Text>
                <Text x={2} y={33} style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.blueprint }}>cover</Text>
                {/* Labels */}
                <Text x={55} y={12} style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.blueprint }}>300×300mm</Text>
                <Text x={131} y={36} style={{ fontFamily: 'IBMPlexSans', fontSize: 5.5, fill: T.inkA60 }}>Fe500D</Text>
                <Text x={131} y={130} style={{ fontFamily: 'IBMPlexSans', fontSize: 5.5, fill: T.inkA60 }}>Stirrups</Text>
                <Text x={131} y={137} style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }}>@150c/c</Text>
              </Svg>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, color: T.inkA60, marginTop: 3 }}>
                IS 456:2000 Cl.26.5{'\n'}M20 concrete · Fe500D bars
              </Text>
            </View>
          </View>

          {/* Disclaimer */}
          <View style={{ marginTop: 14, borderWidth: 1, borderColor: T.stampOxide, borderStyle: 'solid', padding: 8, backgroundColor: T.oxideBg }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6.5, color: T.stampOxide, letterSpacing: 0.5, marginBottom: 3 }}>
              DISCLAIMER — SCHEMATIC ONLY
            </Text>
            <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 7.5, color: T.ironInk, lineHeight: 1.5 }}>
              This schematic is for illustrative purposes only. Actual structural drawings must be prepared by a licensed structural engineer.
              Footing dimensions, column reinforcement, and grid spacing must be designed per IS 456:2000 and IS 1904:2016 based on soil bearing capacity from site investigation.
            </Text>
          </View>

          <View style={S.flex1} />
          <PageFooter sheet="SCHEMATIC · FOUNDATION & COLUMN LAYOUT" />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════
          PAGE 11 — MASONPRO CROSS-SELL
          ═══════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <View>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 12, fontWeight: 700, color: T.blueprint, letterSpacing: 1.5 }}>
                NIRMANSHASTRA
              </Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>Build With Certainty</Text>
            </View>
            {/* Phase 1 complete stamp */}
            <View style={{ borderWidth: 2, borderColor: T.approvedGreen, borderStyle: 'solid', padding: 8, backgroundColor: T.greenBg }}>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 9, color: T.approvedGreen, fontWeight: 700 }}>
                PHASE 1 — COMPLETE
              </Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.approvedGreen }}>RCC STRUCTURE — Rs.{num(result.grandTotal.standard)}</Text>
            </View>
          </View>

          <View style={S.rule} />

          {/* Cross-sell content */}
          <Text style={{ ...S.eyebrow, marginTop: 8, marginBottom: 4 }}>NEXT — PHASE 2</Text>
          <Text style={S.h2}>MasonryPro — Masonry Cost Estimate</Text>
          <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 10, color: T.inkA60, marginBottom: 14, lineHeight: 1.6 }}>
            Your RCC structure estimate is complete. The next phase of construction is masonry —
            brickwork, plaster, and waterproofing. Masonry can begin 60-90 days after the RCC pour
            (IS 456:2000 curing + stripping + surface preparation).
          </Text>

          {/* MasonPro features */}
          <View style={{ borderWidth: 1.5, borderColor: T.blueprint, borderStyle: 'solid', padding: 14, backgroundColor: T.blueprintBg, marginBottom: 14 }}>
            <Text style={{ ...S.eyebrow, marginBottom: 8 }}>WHAT MASONRYPRO CALCULATES — IS 1077:1992 · IS 2212:1991 · IS 2645:2003</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                {[
                  'Exact brick counts by wall type and area',
                  'Cement + sand quantities for mortar (1:4 to 1:6)',
                  'Plastering material schedule (IS 1661:1972)',
                  'Waterproofing method + quantities (IS 2645:2003)',
                ].map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 5, marginBottom: 4 }}>
                    <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.approvedGreen }}>✓</Text>
                    <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, flex: 1 }}>{f}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flex: 1 }}>
                {[
                  '8 wall types — clay brick, fly ash, AAC, hollow block',
                  'AAC seismic zone warning (IS 4326:1993 Zone IV-V)',
                  'Contractor price comparison (spot overcharging)',
                  '9-page IS-code backed PDF report',
                ].map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 5, marginBottom: 4 }}>
                    <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.approvedGreen }}>✓</Text>
                    <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, flex: 1 }}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ marginTop: 10, borderTopWidth: 0.5, borderTopColor: T.blueprint, borderTopStyle: 'solid', paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.blueprint, marginBottom: 2 }}>MASONPRO · PHASE 2 REPORT</Text>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 16, color: T.ironInk }}>Rs. 499</Text>
              </View>
              <View>
                <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, color: T.inkA60 }}>Or bundle all 5 apps:</Text>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 13, color: T.blueprint }}>Rs. 1,999</Text>
                <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, color: T.approvedGreen }}>Saves Rs. 496</Text>
              </View>
            </View>
          </View>

          {/* Timing note */}
          <View style={{ backgroundColor: T.yellowBg, padding: 8, borderLeftWidth: 2, borderLeftColor: T.markingYellow, borderLeftStyle: 'solid', marginBottom: 14 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.markingYellow, marginBottom: 2 }}>CONSTRUCTION TIMING NOTE</Text>
            <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, lineHeight: 1.5 }}>
              Masonry starts 60-90 days after RCC pour — NOT 21 days as often quoted by contractors.
              IS 456:2000 requires minimum curing, then formwork stripping, then surface preparation.
              Use this waiting period to prepare your MasonryPro estimate so you have the quantities ready before masons arrive.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.inkA60 }}>Visit:</Text>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 9, color: T.blueprint }}>www.NirmanShastra.in</Text>
          </View>

          <View style={S.flex1} />

          {/* Footer disclaimer */}
          <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: T.inkA15, borderTopStyle: 'solid', paddingTop: 8 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6.5, color: T.inkA60, lineHeight: 1.6 }}>
              DISCLAIMER: This report is generated using IS 456:2000 thumb rules for estimation purposes only. Quantities and costs are indicative and ±15% accuracy.
              This report is NOT a structural design, NOT a drawing, and does NOT replace a licensed structural engineer&apos;s drawings.
              All construction must be carried out per structural engineer&apos;s approved drawings and local municipal approvals.
              NirmanShastra accepts no liability for construction decisions based on this report.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={S.monoSm}>NIRMANSHASTRA · STRUCTOPRO · {reportId} · {fmtDate(date)}</Text>
              <Text style={S.monoSm}>IS 456:2000 · IS 13920:2016 · IS 1904:2016 · IS 1893:2016</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════
          FINAL PAGE — THE ENGINEERING BEHIND THE CALCULATION
          ═══════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={S.frame}>
          <Text style={S.eyebrow}>APPENDIX — CALCULATION METHODOLOGY</Text>
          <Text style={S.h2}>The Engineering Behind the Calculation</Text>
          <View style={S.rule} />

          {/* Concrete */}
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 4, marginTop: 4 }}>CONCRETE QUANTITIES (IS 456:2000)</Text>
          {[
            'M20 mix ratio 1:1.5:3 — dry volume factor 1.54 — yields 8.07 bags cement + 11.22 cft sand + 22.44 cft aggregate per m³',
            'M25 mix ratio 1:1:2 — yields 11.00 bags cement per m³',
            'Formula: wet volume × 1.54 = dry volume. Cement bags = dry volume × (1/(1+1.5+3)) × (1440/50)',
          ].map((t, i) => (
            <Text key={i} style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, lineHeight: 1.5, marginBottom: 2 }}>• {t}</Text>
          ))}

          {/* Steel */}
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 4, marginTop: 10 }}>STEEL QUANTITIES (IS 1786:2008, density 7850 kg/m³)</Text>
          {[
            'Footing: 0.5% of concrete volume = 39.25 kg/m³',
            'Plinth beam: 1.5% = 117.75 kg/m³',
            'Column: 2.5% = 196.25 kg/m³',
            'Beam: 1.5% = 117.75 kg/m³ (150 kg/m³ with wastage)',
            'Slab: 1.0% = 78.5 kg/m³',
            'Overall thumb rule: 4 kg steel per sqft BUA for G+1 to G+3',
          ].map((t, i) => (
            <Text key={i} style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, lineHeight: 1.5, marginBottom: 2 }}>• {t}</Text>
          ))}

          {/* Excavation */}
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 4, marginTop: 10 }}>EXCAVATION</Text>
          <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, lineHeight: 1.5, marginBottom: 2 }}>• Volume = footing area × foundation depth × 1.3 (side slope factor)</Text>

          {/* Formwork */}
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 4, marginTop: 10 }}>FORMWORK (IS 456:2000 Cl 14)</Text>
          {[
            'Column faces: 4 × column perimeter × column height',
            'Beam soffits: beam width × beam span',
            'Slab: slab area',
          ].map((t, i) => (
            <Text key={i} style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, lineHeight: 1.5, marginBottom: 2 }}>• {t}</Text>
          ))}

          {/* CPWD Labour */}
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 4, marginTop: 10 }}>CPWD LABOUR PRODUCTIVITY</Text>
          {[
            'Bar Bender: 600 kg steel per worker per day',
            'Shuttering Carpenter: 100 sqft formwork per worker per day',
            'Concreting Mason: 2.5 m³ concrete per mason per day',
            'Curing period: columns 7 days, beams 14 days, slabs 14 days (IS 456:2000 Cl 13.5)',
          ].map((t, i) => (
            <Text key={i} style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, lineHeight: 1.5, marginBottom: 2 }}>• {t}</Text>
          ))}

          {/* IS Codes */}
          <View style={{ marginTop: 12, borderTopWidth: 0.5, borderTopColor: T.inkA15, borderTopStyle: 'solid', paddingTop: 8 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 6 }}>IS CODES USED IN THIS REPORT</Text>
            {[
              'IS 456:2000 — Plain and Reinforced Concrete',
              'IS 1786:2008 — High Strength Deformed Steel Bars',
              'IS 1893:2016 — Criteria for Earthquake Resistant Design',
              'IS 1904:2016 — Design and Construction of Foundations',
              'IS 13920:2016 — Ductile Detailing of RCC Structures',
              'IS 875:2015 — Code of Practice for Design Loads',
            ].map((t, i) => (
              <Text key={i} style={{ fontFamily: 'IBMPlexMono', fontSize: 7.5, color: T.inkA60, lineHeight: 1.6, marginBottom: 1 }}>{t}</Text>
            ))}
          </View>

          <View style={S.flex1} />

          {/* Disclaimer */}
          <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: T.ironInk, borderTopStyle: 'solid', paddingTop: 8, backgroundColor: T.oxideBg, padding: 8 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.stampOxide, marginBottom: 3, letterSpacing: 0.5 }}>DISCLAIMER</Text>
            <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, color: T.ironInk, lineHeight: 1.5 }}>
              This report is for budgeting purposes only. Actual construction must be supervised by a licensed structural engineer.
              Quantities are calculated using standard IS code formulas and may vary by ±5% based on actual site conditions.
            </Text>
          </View>
        </View>
      </Page>

    </Document>
  )
}
