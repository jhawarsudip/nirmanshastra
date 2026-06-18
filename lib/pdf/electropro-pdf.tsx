// ElectroPro 8-page PDF — @react-pdf/renderer
// Design tokens from NirmanShastra_Design_Spec.md
// IS 732:2019 values from Build Reference Section 8 — LOCKED

import React from 'react'
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  Svg,
  Line,
  Circle,
  Rect,
} from '@react-pdf/renderer'

import type { ElectroInput, ElectroResult } from '@/app/tools/electropro/electropro-engine'
import { formatLakhs } from '@/app/tools/electropro/electropro-engine'

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

// ─── Tokens ───────────────────────────────────────────────────────────────────
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
  oxideBg:       '#F5EDEB',
  yellowBg:      '#FBF5E6',
}

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
  eyebrow: { fontFamily: 'IBMPlexMono', fontSize: 7, color: T.blueprint, letterSpacing: 1, marginBottom: 4 },
  h1:   { fontFamily: 'IBMPlexSerif', fontSize: 24, fontWeight: 700, color: T.ironInk, marginBottom: 6 },
  h2:   { fontFamily: 'IBMPlexSerif', fontSize: 15, fontWeight: 600, color: T.ironInk, marginBottom: 4 },
  h3:   { fontFamily: 'IBMPlexSans',  fontSize: 10, fontWeight: 600, color: T.ironInk, marginBottom: 3 },
  body: { fontFamily: 'IBMPlexSans',  fontSize: 9,  color: T.ironInk, lineHeight: 1.5 },
  mono: { fontFamily: 'IBMPlexMono',  fontSize: 9,  color: T.ironInk },
  monoSm: { fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 },
  rule: { borderBottomWidth: 1, borderBottomColor: T.ironInk, marginVertical: 8 },
  row:  { flexDirection: 'row' },
  col:  { flex: 1 },
  tableHeader: { fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, letterSpacing: 0.5, textTransform: 'uppercase', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: T.inkA35 },
  tableRow:    { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: T.inkA15 },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: T.inkA15, backgroundColor: 'rgba(30,34,39,0.025)' },
  cell:        { fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk, flex: 1 },
  cellMono:    { fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right', flex: 1 },
  chip:        { fontFamily: 'IBMPlexMono', fontSize: 7, color: T.sheetWhite, backgroundColor: T.blueprint, paddingHorizontal: 5, paddingVertical: 2, marginRight: 4, marginBottom: 3 },
})

export interface ContactInfo {
  name:    string
  email:   string
  mobile:  string
  address: string
  city:    string
  state:   string
}

interface Props {
  input:       ElectroInput
  result:      ElectroResult
  contact:     ContactInfo
  reportId:    string
  projectName: string
  date:        Date
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function PageHeader({ page, total, title }: { page: number; total: number; title: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
      <View>
        <Text style={S.eyebrow}>NIRMANSHASTRA · ELECTROPRO · PHASE 3 — ELECTRICAL</Text>
        <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 13, fontWeight: 600, color: T.ironInk }}>{title}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={S.monoSm}>PAGE {page} OF {total}</Text>
        <Text style={[S.monoSm, { color: T.blueprint, marginTop: 2 }]}>IS 732:2019 · IS 3043:2018</Text>
      </View>
    </View>
  )
}

function PageRule() {
  return <View style={{ borderBottomWidth: 1, borderBottomColor: T.ironInk, marginBottom: 12 }} />
}

function SectionEyebrow({ children }: { children: string }) {
  return <Text style={[S.eyebrow, { marginBottom: 6, marginTop: 10 }]}>{children}</Text>
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: T.inkA15 }}>
      <Text style={[S.monoSm, { flex: 1.2, color: T.inkA60 }]}>{label.toUpperCase()}</Text>
      <Text style={mono ? [S.mono, { flex: 2, fontSize: 9 }] : [S.body, { flex: 2 }]}>{value}</Text>
    </View>
  )
}

// SLD SVG for PDF — single-line diagram schematic
function SLDDiagramSvg({ circuits }: { circuits: { label: string; ways: number }[] }) {
  const busY = 60
  const spacing = 60
  const totalCircuits = Math.min(circuits.length, 5)
  const startX = 40
  const width = startX + totalCircuits * spacing + 40

  return (
    <Svg width={width} height={120} viewBox={`0 0 ${width} 120`}>
      {/* Main incomer line on left */}
      <Line x1="20" y1="20" x2="20" y2={busY} stroke={T.ironInk} strokeWidth="1.5" />
      <Circle cx="20" cy="15" r="6" fill="none" stroke={T.ironInk} strokeWidth="1" />
      <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.ironInk }} x="28" y="18">MAIN</Text>

      {/* Horizontal bus bar */}
      <Line x1="20" y1={busY} x2={startX + totalCircuits * spacing} y2={busY} stroke={T.ironInk} strokeWidth="2" />

      {/* Circuit drops */}
      {circuits.slice(0, totalCircuits).map((c, i) => {
        const x = startX + i * spacing + 20
        return (
          <React.Fragment key={i}>
            <Line x1={x} y1={busY} x2={x} y2={busY - 15} stroke={T.blueprint} strokeWidth="1" />
            <Circle cx={x} cy={busY - 20} r="5" fill="none" stroke={T.blueprint} strokeWidth="1" />
            <Line x1={x} y1={busY} x2={x} y2={busY + 25} stroke={T.blueprint} strokeWidth="1" strokeDasharray="3,2" />
            <Rect x={x - 8} y={busY + 25} width="16" height="8" fill="none" stroke={T.blueprint} strokeWidth="0.8" />
          </React.Fragment>
        )
      })}

      {/* Earth line at bottom */}
      <Line x1="10" y1="105" x2={startX + totalCircuits * spacing} y2="105" stroke={T.approvedGreen} strokeWidth="0.8" strokeDasharray="4,3" />
      <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.approvedGreen }} x="12" y="114">EARTH (IS 3043:2018)</Text>
    </Svg>
  )
}

// ─── IS Code Checklist helpers ────────────────────────────────────────────────

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

function ChecklistDisclaimer() {
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
        constitute a Licensed Electrical Contractor&apos;s certificate. Actual installation must be executed by a
        licensed electrician under IE Rules 1956. Municipal approval mandatory before energising.
      </Text>
    </View>
  )
}

function ISCodeChecklistPage({ input, result }: Props) {
  const totalLoadW = result.pointSchedule.lightPoints * 20 + result.pointSchedule.fanPoints * 75 +
    result.pointSchedule.powerPoints * 250 + result.pointSchedule.acPoints * 1500 +
    result.pointSchedule.geyserPoints * 2000 + result.pointSchedule.exhaustPoints * 20
  const isThreePhase = totalLoadW > 5000
  const rccbMissing = !result.dbPanelSchedule.rccbRequired && input.numBathrooms > 0

  const items: ChecklistItem[] = [
    {
      status: 'pass',
      clause: 'IS 732:2019 — Wire Sizing',
      description: `Lighting/fan circuits: 1.5 sqmm Cu; power sockets: 2.5 sqmm Cu; AC/geyser: 4.0 sqmm Cu — per IS 732:2019 Table 1 current-carrying capacity.`,
    },
    {
      status: result.dbPanelSchedule.rccbRequired ? 'pass' : 'advisory',
      clause: 'IS 3043:2018 — RCCB / Earth Leakage Protection',
      description: result.dbPanelSchedule.rccbRequired
        ? `RCCB ${result.dbPanelSchedule.rccbRating} included for bathroom and outdoor circuits per IS 3043:2018 Cl 5.4. Trips at 30mA leakage.`
        : `No bathrooms specified — RCCB not computed. If adding bathroom circuits later, RCCB 30mA mandatory per IS 3043:2018 Cl 5.4.`,
    },
    {
      status: input.includeEarthing ? 'pass' : 'advisory',
      clause: 'IS 3043:2018 — Earthing System',
      description: input.includeEarthing
        ? `${input.numEarthingPits ?? 2} earthing pit(s) included — plate earthing or pipe earthing per IS 3043:2018. Earth resistance must be < 1Ω.`
        : `Earthing not included in estimate. IS 3043:2018 mandates earthing for all metallic enclosures and exposed conductive parts. Add before energising.`,
    },
    {
      status: 'pass',
      clause: 'IS 8828:2007 — MCB Ratings',
      description: `Lighting MCBs: 6A; Power MCBs: 16A; AC/Geyser MCBs: 20A — per IS 8828:2007 breaking capacity and discrimination requirements.`,
    },
    {
      status: 'pass',
      clause: 'IE Rules 1956, Rule 50 — Licensed Electrician',
      description: `All wiring must be executed by a licensed electrical contractor holding a valid IE licence. Contractor must submit a completion certificate before energising.`,
    },
    {
      status: isThreePhase ? 'advisory' : 'pass',
      clause: 'IS 732:2019 — Three-Phase Load Balance',
      description: isThreePhase
        ? `Total computed load ${(totalLoadW / 1000).toFixed(1)} kW exceeds single-phase threshold. Distribute loads across R/Y/B phases to maintain < 5% imbalance per IS 732:2019.`
        : `Total computed load ${(totalLoadW / 1000).toFixed(1)} kW — single-phase supply likely adequate. Confirm with DISCOM before meter application.`,
    },
    {
      status: 'advisory',
      clause: 'IS 3043:2018 Cl 8 — Earth Resistance Test',
      description: `Earth resistance must be tested with earth tester after installation. Acceptable limit: < 1Ω for main earth, < 5Ω for individual connections. Re-test annually.`,
    },
    {
      status: input.numFloors >= 2 ? 'advisory' : 'pass',
      clause: 'NBC 2016 Cl 10.6 — Lightning Protection',
      description: input.numFloors >= 2
        ? `${input.numFloors}-floor structure — evaluate lightning protection per NBC 2016 Cl 10.6. Structures > 9m height may require air terminals and down conductors.`
        : `Single-floor structure — lightning protection not mandatory per NBC 2016. Consider surge protectors for electronic equipment.`,
    },
    {
      status: rccbMissing ? 'violation' : 'pass',
      clause: 'IS 3043:2018 — RCCB Mandatory for Bathrooms',
      description: rccbMissing
        ? `${input.numBathrooms} bathroom(s) detected — RCCB 30mA is MANDATORY per IS 3043:2018 Cl 5.4. Absence of RCCB creates shock hazard. Install before energising.`
        : `RCCB requirement correctly assessed for ${input.numBathrooms} bathroom(s) in this estimate.`,
    },
  ]

  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={3} total={9} title="IS Code Compliance Checklist — Electrical Phase" />
        <PageRule />
        <Text style={[S.eyebrow, { marginBottom: 8 }]}>
          IS 732:2019 · IS 3043:2018 · IS 8828:2007 · IE RULES 1956 · NBC 2016
        </Text>

        {items.map((item, i) => (
          <ChecklistRow key={i} item={item} />
        ))}

        <ChecklistDisclaimer />

        <View style={{ flex: 1 }} />
      </View>
    </Page>
  )
}

// ─── PAGES ────────────────────────────────────────────────────────────────────

function CoverPage({ input, result, contact, reportId, projectName, date }: Props) {
  const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        {/* Phase badge */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={{ borderWidth: 1, borderColor: T.blueprint, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.blueprint, letterSpacing: 1 }}>
              PHASE 3 · ELECTRICAL ESTIMATE
            </Text>
          </View>
          <View style={{ borderWidth: 1, borderColor: T.ironInk, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.ironInk }}>
              {reportId}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[S.eyebrow, { fontSize: 9, letterSpacing: 2 }]}>NIRMANSHASTRA · ELECTROPRO</Text>
        <Text style={S.h1}>{projectName}</Text>
        <View style={S.rule} />

        {/* SLD motif */}
        <SLDDiagramSvg circuits={result.dbPanelSchedule.circuits} />

        <View style={{ marginTop: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {['IS 732:2019', 'IS 3043:2018', 'IS 694:2010', 'IS 8828:2007'].map(code => (
              <View key={code} style={S.chip}><Text>{code}</Text></View>
            ))}
          </View>
        </View>

        {/* Key specs grid */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'TOTAL BUA',    value: `${result.totalBuaSqft.toFixed(0)} sqft` },
            { label: 'FLOORS',       value: `${input.numFloors} floor${input.numFloors > 1 ? 's' : ''}` },
            { label: 'DB PANEL',     value: result.dbPanelSchedule.panelSize },
            { label: 'TOTAL WAYS',   value: `${result.dbPanelSchedule.totalWays} ways` },
            { label: 'TOTAL POINTS', value: `${result.pointSchedule.totalPoints}` },
          ].map(item => (
            <View key={item.label} style={{ flex: 1, borderWidth: 1, borderColor: T.blueprint, padding: 6 }}>
              <Text style={[S.monoSm, { marginBottom: 3 }]}>{item.label}</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 11, fontWeight: 700, color: T.blueprint }}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Client details */}
        <View style={{ borderWidth: 1, borderColor: T.inkA35, padding: 10, marginBottom: 12 }}>
          <InfoRow label="Client"    value={contact.name}    />
          <InfoRow label="Mobile"    value={contact.mobile}  mono />
          <InfoRow label="Location"  value={`${contact.city}, ${contact.state}`} />
          <InfoRow label="Address"   value={contact.address} />
          <InfoRow label="Date"      value={dateStr} mono />
          <InfoRow label="Report ID" value={reportId} mono />
        </View>

        {/* Title block */}
        <View style={{ borderWidth: 1, borderColor: T.ironInk, padding: 8, marginTop: 'auto' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {[
              { label: 'PROJECT', value: projectName.length > 18 ? projectName.slice(0, 18) + '…' : projectName },
              { label: 'DRG NO', value: reportId },
              { label: 'DATE', value: dateStr },
            ].map(item => (
              <View key={item.label} style={{ flex: 1, borderRightWidth: 1, borderRightColor: T.inkA35, paddingHorizontal: 5 }}>
                <Text style={S.monoSm}>{item.label}</Text>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.ironInk, marginTop: 2 }}>{item.value}</Text>
              </View>
            ))}
            <View style={{ flex: 1, paddingHorizontal: 5 }}>
              <Text style={S.monoSm}>DRAWN BY</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.ironInk, marginTop: 2 }}>NIRMANSHASTRA</Text>
            </View>
          </View>
        </View>

        <Text style={[S.monoSm, { textAlign: 'center', marginTop: 8, lineHeight: 1.6 }]}>
          This report is for estimation purposes only. Not a substitute for licensed electrical engineer&apos;s drawings.
          All IS code values as per Build Reference Section 8 — LOCKED.
        </Text>
      </View>
    </Page>
  )
}

function LoadAnalysisPage({ input, result }: { input: ElectroInput; result: ElectroResult }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={2} total={9} title="Load Analysis" />
        <PageRule />

        <SectionEyebrow>BUILDING DETAILS</SectionEyebrow>
        <InfoRow label="Location"       value={`${input.city}, ${input.state}`} />
        <InfoRow label="BUA per floor"  value={`${input.buaPerFloorSqft} sqft`} mono />
        <InfoRow label="Number of floors" value={`${input.numFloors}`} mono />
        <InfoRow label="Total BUA"      value={`${result.totalBuaSqft.toFixed(0)} sqft (${(result.totalBuaSqft / 10.764).toFixed(0)} sqm)`} mono />
        <InfoRow label="Bathrooms"      value={`${input.numBathrooms}`} mono />
        <InfoRow label="AC units"       value={`${input.numAC}`} mono />
        <InfoRow label="Earthing"       value={input.includeEarthing ? `Yes — ${input.numEarthingPits ?? 2} pits` : 'Not included'} />

        <SectionEyebrow>POINT SCHEDULE — IS 732:2019</SectionEyebrow>
        <View style={{ flexDirection: 'row', ...S.tableHeader }}>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>POINT TYPE</Text>
          <Text style={{ width: 50, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>COUNT</Text>
          <Text style={{ width: 70, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>WIRE</Text>
          <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>LOAD (W)</Text>
        </View>
        {[
          { type: 'Light points (LED avg 20W)', qty: result.pointSchedule.lightPoints, wire: '1.5 sqmm', load: result.pointSchedule.lightPoints * 20 },
          { type: 'Fan points (75W each)',       qty: result.pointSchedule.fanPoints,   wire: '1.5 sqmm', load: result.pointSchedule.fanPoints * 75 },
          { type: 'Power sockets (250W eff.)',   qty: result.pointSchedule.powerPoints, wire: '2.5 sqmm', load: result.pointSchedule.powerPoints * 250 },
          { type: 'AC units (1500W each)',        qty: result.pointSchedule.acPoints,    wire: '4.0 sqmm', load: result.pointSchedule.acPoints * 1500 },
          { type: 'Geysers (2000W each)',         qty: result.pointSchedule.geyserPoints,wire: '4.0 sqmm', load: result.pointSchedule.geyserPoints * 2000 },
          { type: 'Exhaust fans (20W each)',      qty: result.pointSchedule.exhaustPoints,wire:'1.5 sqmm', load: result.pointSchedule.exhaustPoints * 20 },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk }}>{row.type}</Text>
            <Text style={{ width: 50, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{row.qty}</Text>
            <Text style={{ width: 70, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.inkA60, textAlign: 'right' }}>{row.wire}</Text>
            <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{row.load.toLocaleString('en-IN')}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', paddingVertical: 5, borderTopWidth: 2, borderTopColor: T.ironInk }}>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 9, fontWeight: 600, color: T.ironInk }}>Total Points / Total Load</Text>
          <Text style={{ width: 50, fontFamily: 'IBMPlexMono', fontSize: 9, fontWeight: 700, color: T.blueprint, textAlign: 'right' }}>
            {result.pointSchedule.totalPoints}
          </Text>
          <Text style={{ width: 70, textAlign: 'right' }} />
          <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 9, fontWeight: 700, color: T.blueprint, textAlign: 'right' }}>
            {(result.pointSchedule.lightPoints * 20 + result.pointSchedule.fanPoints * 75 + result.pointSchedule.powerPoints * 250 + result.pointSchedule.acPoints * 1500 + result.pointSchedule.geyserPoints * 2000 + result.pointSchedule.exhaustPoints * 20).toLocaleString('en-IN')}W
          </Text>
        </View>

        <SectionEyebrow>CIRCUIT COUNT — IS 732:2019 MAXIMUMS (LOCKED)</SectionEyebrow>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { label: 'LIGHTING CIRCUITS', value: `${result.lightCircuits}`, note: `Max ${800}W each` },
            { label: 'POWER CIRCUITS',    value: `${result.powerCircuits}`, note: `Max ${3000}W each` },
            { label: 'AC CIRCUITS',       value: `${result.pointSchedule.acPoints}`,     note: 'Dedicated 20A' },
            { label: 'GEYSER CIRCUITS',   value: `${result.pointSchedule.geyserPoints}`, note: 'Dedicated 20A' },
          ].map(item => (
            <View key={item.label} style={{ flex: 1, borderWidth: 1, borderColor: T.blueprint, padding: 6 }}>
              <Text style={S.monoSm}>{item.label}</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 16, fontWeight: 700, color: T.blueprint, marginVertical: 3 }}>{item.value}</Text>
              <Text style={[S.monoSm, { color: T.inkA60 }]}>{item.note}</Text>
            </View>
          ))}
        </View>
      </View>
    </Page>
  )
}

function SingleLineDiagramPage({ result }: { result: ElectroResult }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={4} total={9} title="Single Line Diagram — Schematic" />
        <PageRule />

        <Text style={[S.body, { marginBottom: 10, color: T.inkA60, fontSize: 8 }]}>
          Schematic for estimation reference only. Not for construction without licensed electrical engineer&apos;s sign-off.
        </Text>

        {/* Large SLD diagram */}
        <View style={{ marginBottom: 12 }}>
          <Svg width="510" height="220" viewBox="0 0 510 220">
            {/* Incomer from utility */}
            <Line x1="40" y1="20" x2="40" y2="80" stroke={T.ironInk} strokeWidth="2" />
            <Circle cx="40" cy="15" r="8" fill="none" stroke={T.ironInk} strokeWidth="1.5" />

            {/* Energy meter */}
            <Rect x="28" y="80" width="24" height="16" fill={T.sheetWhite} stroke={T.ironInk} strokeWidth="1" />

            {/* Main MCB */}
            <Line x1="40" y1="96" x2="40" y2="115" stroke={T.ironInk} strokeWidth="2" />
            <Circle cx="40" cy="120" r="6" fill="none" stroke={T.ironInk} strokeWidth="1.5" />

            {/* Main bus bar */}
            <Line x1="40" y1="126" x2="460" y2="126" stroke={T.ironInk} strokeWidth="3" />

            {/* RCCB if required */}
            {result.dbPanelSchedule.rccbRequired && (
              <>
                <Line x1="40" y1="126" x2="40" y2="150" stroke={T.stampOxide} strokeWidth="1.5" />
                <Rect x="24" y="150" width="32" height="12" fill={T.sheetWhite} stroke={T.stampOxide} strokeWidth="1" />
              </>
            )}

            {/* Circuit drops — up to 6 */}
            {result.dbPanelSchedule.circuits.slice(0, Math.min(result.dbPanelSchedule.circuits.length, 6)).map((circuit, i) => {
              const x = 80 + i * 75
              return (
                <React.Fragment key={i}>
                  <Line x1={x} y1="126" x2={x} y2="108" stroke={T.blueprint} strokeWidth="1" />
                  <Circle cx={x} cy="103" r="6" fill="none" stroke={T.blueprint} strokeWidth="1" />
                  <Line x1={x} y1="126" x2={x} y2="175" stroke={T.blueprint} strokeWidth="1" strokeDasharray="4,3" />
                  <Rect x={x - 10} y="175" width="20" height="10" fill="none" stroke={T.blueprint} strokeWidth="0.8" />
                </React.Fragment>
              )
            })}

            {/* Earth bus */}
            <Line x1="20" y1="200" x2="450" y2="200" stroke={T.approvedGreen} strokeWidth="1.2" strokeDasharray="6,4" />

            {/* Labels */}
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.inkA60 }} x="50" y="12">UTILITY SUPPLY</Text>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.inkA60 }} x="50" y="90">ENERGY METER</Text>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.ironInk }} x="50" y="122">MAIN MCB {result.dbPanelSchedule.mainMCBRating}</Text>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.approvedGreen }} x="22" y="210">EARTH BUS (IS 3043:2018 — MAX 1Ω)</Text>
          </Svg>
        </View>

        <SectionEyebrow>DIAGRAM LEGEND</SectionEyebrow>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[
            { color: T.ironInk,       label: 'Main supply / bus bar' },
            { color: T.blueprint,     label: 'Branch circuit MCBs' },
            { color: T.approvedGreen, label: 'Earth / protective conductor' },
            { color: T.stampOxide,    label: 'RCCB (bathroom circuits)' },
          ].map(item => (
            <View key={item.label} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 14, height: 2, backgroundColor: item.color }} />
              <Text style={[S.monoSm, { color: T.inkA60, flex: 1 }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ borderWidth: 1, borderColor: T.markingYellow, backgroundColor: T.yellowBg, padding: 8, marginTop: 12 }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.markingYellow, marginBottom: 3 }}>
            IS 732:2019 CL 5 — DISCLAIMER
          </Text>
          <Text style={[S.body, { fontSize: 8 }]}>
            This single-line diagram is a schematic for cost estimation only.
            Final electrical layout drawings must be prepared and signed by a licensed electrical engineer or supervisor
            with Class B license per Indian Electricity Rules. All work subject to CEIG/State Electrical Inspector approval.
          </Text>
        </View>
      </View>
    </Page>
  )
}

function DBPanelSchedulePage({ result }: { result: ElectroResult }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={5} total={9} title="DB Panel Schedule — IS 8828:2007" />
        <PageRule />

        {/* Panel summary */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'PANEL SIZE',   value: result.dbPanelSchedule.panelSize },
            { label: 'TOTAL WAYS',   value: `${result.dbPanelSchedule.totalWays}` },
            { label: 'MAIN MCB',     value: result.dbPanelSchedule.mainMCBRating },
            { label: 'PANEL RATE',   value: `₹${result.dbPanelSchedule.panelRate.toLocaleString('en-IN')}` },
          ].map(item => (
            <View key={item.label} style={{ flex: 1, borderWidth: 1, borderColor: T.blueprint, padding: 6 }}>
              <Text style={S.monoSm}>{item.label}</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 12, fontWeight: 700, color: T.blueprint, marginTop: 3 }}>{item.value}</Text>
            </View>
          ))}
        </View>

        {result.dbPanelSchedule.rccbRequired && (
          <View style={{ borderWidth: 1, borderColor: T.stampOxide, backgroundColor: T.oxideBg, padding: 8, marginBottom: 10 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.stampOxide, marginBottom: 3 }}>
              IS 3043:2018 CL 10.4 — RCCB MANDATORY
            </Text>
            <Text style={[S.body, { fontSize: 8 }]}>
              RCCB {result.dbPanelSchedule.rccbRating} mandatory for bathroom circuits. Verify contractor has included this in their quote.
              Absence of RCCB is a safety defect — do not accept work without it.
            </Text>
          </View>
        )}

        <SectionEyebrow>CIRCUIT SCHEDULE</SectionEyebrow>
        <View style={{ flexDirection: 'row', ...S.tableHeader }}>
          <Text style={{ flex: 2.5, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>CIRCUIT TYPE</Text>
          <Text style={{ width: 40, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>WAYS</Text>
          <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>MCB RATING</Text>
          <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>WIRE SIZE</Text>
          <Text style={{ flex: 1.5, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>IS CODE</Text>
        </View>
        {result.dbPanelSchedule.circuits.map((circuit, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ flex: 2.5, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk }}>{circuit.label}</Text>
            <Text style={{ width: 40, fontFamily: 'IBMPlexMono', fontSize: 9, fontWeight: 700, color: T.blueprint, textAlign: 'right' }}>{circuit.ways}</Text>
            <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{circuit.mcbRating}</Text>
            <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{circuit.wireSize}</Text>
            <Text style={{ flex: 1.5, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>{circuit.isCode}</Text>
          </View>
        ))}
        {/* Spare ways row */}
        <View style={[S.tableRow, { borderTopWidth: 1, borderTopColor: T.inkA35 }]}>
          <Text style={{ flex: 2.5, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.inkA60, fontStyle: 'italic' }}>Spare ways (future loads)</Text>
          <Text style={{ width: 40, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.markingYellow, textAlign: 'right' }}>2</Text>
          <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>—</Text>
          <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>—</Text>
          <Text style={{ flex: 1.5, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>IS 8828:2007</Text>
        </View>
        <View style={{ flexDirection: 'row', paddingVertical: 5, borderTopWidth: 2, borderTopColor: T.ironInk }}>
          <Text style={{ flex: 2.5, fontFamily: 'IBMPlexSans', fontSize: 9, fontWeight: 600, color: T.ironInk }}>Total</Text>
          <Text style={{ width: 40, fontFamily: 'IBMPlexMono', fontSize: 9, fontWeight: 700, color: T.blueprint, textAlign: 'right' }}>
            {result.dbPanelSchedule.totalWays}
          </Text>
          <Text style={{ width: 60 }} />
          <Text style={{ width: 60 }} />
          <Text style={{ flex: 1.5 }} />
        </View>
      </View>
    </Page>
  )
}

function FloorWiringSchemPage({ input, result }: { input: ElectroInput; result: ElectroResult }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={6} total={9} title="Floor Wiring Schematic — Reference Layout" />
        <PageRule />

        <Text style={[S.body, { fontSize: 8, marginBottom: 10, color: T.inkA60 }]}>
          Indicative schematic for estimation reference. Actual conduit layout to be prepared by licensed electrician on site.
        </Text>

        {/* Schematic floor plan */}
        <Svg width="510" height="200" viewBox="0 0 510 200">
          {/* Floor boundary */}
          <Rect x="20" y="10" width="470" height="165" fill="none" stroke={T.ironInk} strokeWidth="1.5" />

          {/* Room divisions */}
          <Line x1="260" y1="10"  x2="260" y2="175" stroke={T.inkA35} strokeWidth="0.8" strokeDasharray="4,3" />
          <Line x1="20"  y1="100" x2="260" y2="100" stroke={T.inkA35} strokeWidth="0.8" strokeDasharray="4,3" />
          <Line x1="260" y1="100" x2="490" y2="100" stroke={T.inkA35} strokeWidth="0.8" strokeDasharray="4,3" />

          {/* DB panel location */}
          <Rect x="30" y="18" width="28" height="20" fill={T.blueprintBg} stroke={T.blueprint} strokeWidth="1" />

          {/* Light points */}
          <Circle cx="120" cy="55"  r="5" fill="none" stroke={T.blueprint} strokeWidth="1" />
          <Circle cx="120" cy="140" r="5" fill="none" stroke={T.blueprint} strokeWidth="1" />
          <Circle cx="350" cy="55"  r="5" fill="none" stroke={T.blueprint} strokeWidth="1" />
          <Circle cx="350" cy="140" r="5" fill="none" stroke={T.blueprint} strokeWidth="1" />

          {/* Power socket symbols */}
          <Rect x="175" y="90" width="10" height="8" fill="none" stroke={T.ironInk} strokeWidth="0.8" />
          <Rect x="175" y="105" width="10" height="8" fill="none" stroke={T.ironInk} strokeWidth="0.8" />
          <Rect x="400" y="90" width="10" height="8" fill="none" stroke={T.ironInk} strokeWidth="0.8" />

          {/* Conduit runs (dashed lines) */}
          <Line x1="58" y1="28"   x2="120" y2="55"  stroke={T.blueprint} strokeWidth="0.6" strokeDasharray="3,2" />
          <Line x1="120" y1="55"  x2="120" y2="140" stroke={T.blueprint} strokeWidth="0.6" strokeDasharray="3,2" />
          <Line x1="120" y1="55"  x2="350" y2="55"  stroke={T.blueprint} strokeWidth="0.6" strokeDasharray="3,2" />

          {/* Labels */}
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.blueprint }} x="30" y="16">DB PANEL</Text>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.inkA60 }} x="90" y="22">LIVING ROOM / HALL</Text>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.inkA60 }} x="270" y="22">BEDROOMS</Text>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.inkA60 }} x="90" y="110">KITCHEN / UTILITY</Text>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.inkA60 }} x="270" y="110">BATHROOMS</Text>

          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="22" y="190">○ LIGHT POINT  □ POWER SOCKET  --- CONDUIT RUN  ▣ DB PANEL</Text>
        </Svg>

        <SectionEyebrow>FLOOR-WISE DISTRIBUTION</SectionEyebrow>
        <View style={{ flexDirection: 'row', ...S.tableHeader }}>
          <Text style={{ flex: 1, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>FLOOR</Text>
          <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>LIGHTS</Text>
          <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>FANS</Text>
          <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>SOCKETS</Text>
          <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>DB SIZE</Text>
        </View>
        {Array.from({ length: Math.min(input.numFloors, 6) }, (_, i) => ({
          floor: i === 0 ? 'Ground Floor' : `Floor ${i}`,
          lights: Math.ceil(result.pointSchedule.lightPoints / input.numFloors),
          fans:   Math.ceil(result.pointSchedule.fanPoints   / input.numFloors),
          sockets: Math.ceil(result.pointSchedule.powerPoints / input.numFloors),
        })).map((row, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ flex: 1, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk }}>{row.floor}</Text>
            <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{row.lights}</Text>
            <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{row.fans}</Text>
            <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{row.sockets}</Text>
            <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.blueprint, textAlign: 'right' }}>{result.dbPanelSchedule.panelSize}</Text>
          </View>
        ))}
      </View>
    </Page>
  )
}

function WireSchedulePage({ result }: { result: ElectroResult }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={7} total={9} title="Wire Schedule — IS 732:2019 + IS 694:2010" />
        <PageRule />

        <SectionEyebrow>WIRE SCHEDULE (1.15 WASTAGE FACTOR — IS 732:2019)</SectionEyebrow>
        <View style={{ flexDirection: 'row', ...S.tableHeader }}>
          <Text style={{ width: 28, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>ITEM NO.</Text>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>DESCRIPTION</Text>
          <Text style={{ width: 40, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>UNIT</Text>
          <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>QTY</Text>
          <Text style={{ width: 55, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>RATE (₹)</Text>
          <Text style={{ width: 65, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>AMOUNT (₹)</Text>
        </View>
        {[
          { type: '1.5 sqmm FR — Lighting & fans & exhaust (IS 732:2019)', metres: result.wireSchedule.size_1_5_m,  rate: 22 },
          { type: '2.5 sqmm FR — Power sockets (IS 732:2019)',             metres: result.wireSchedule.size_2_5_m,  rate: 35 },
          { type: '4.0 sqmm FR — AC units & geysers (IS 732:2019)',        metres: result.wireSchedule.size_4_0_m,  rate: 55 },
          { type: '6.0 sqmm FR — Sub-panel feeds (IS 732:2019)',           metres: result.wireSchedule.size_6_0_m,  rate: 85 },
          { type: '10.0 sqmm FR — Main incomer (IS 732:2019)',             metres: result.wireSchedule.size_10_0_m, rate: 140 },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ width: 28, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.inkA60 }}>{`1.${i + 1}`}</Text>
            <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk }}>{row.type}</Text>
            <Text style={{ width: 40, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.inkA60, textAlign: 'right' }}>m</Text>
            <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{row.metres.toLocaleString('en-IN')}</Text>
            <Text style={{ width: 55, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.inkA60, textAlign: 'right' }}>{row.rate}</Text>
            <Text style={{ width: 65, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{(row.metres * row.rate).toLocaleString('en-IN')}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', paddingVertical: 5, borderTopWidth: 2, borderTopColor: T.ironInk }}>
          <Text style={{ width: 28 }} />
          <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 9, fontWeight: 600, color: T.ironInk }}>Total Wire Material</Text>
          <Text style={{ width: 40 }} />
          <Text style={{ width: 60 }} />
          <Text style={{ width: 55 }} />
          <Text style={{ width: 65, fontFamily: 'IBMPlexMono', fontSize: 9, fontWeight: 700, color: T.blueprint, textAlign: 'right' }}>
            {result.costs.wireMaterial.toLocaleString('en-IN')}
          </Text>
        </View>

        <SectionEyebrow>IS 694:2010 — WIRE QUALITY CHECK</SectionEyebrow>
        <View style={{ borderWidth: 1, borderColor: T.inkA35, padding: 8 }}>
          <Text style={[S.body, { fontSize: 8, lineHeight: 1.6 }]}>
            IS 694:2010 — PVC Insulated Cables: All wires must carry ISI mark and IS 694:2010 certification.
            Ask electrician to produce bills showing ISI-marked wire brand (Finolex, Polycab, Havells, Anchor).
            Counterfeit wires with undersized copper cross-section cause overheating, nuisance tripping, and fires.
            {'\n\n'}
            CHECK ON SITE: Verify wire cross-section by cutting a sample and measuring with a digital vernier caliper.
            1.5 sqmm wire should have conductor area of exactly 1.5 mm² not 1.1 or 1.2 mm² as found in substandard wire.
          </Text>
        </View>
      </View>
    </Page>
  )
}

function MaterialSchedulePage({ result }: { result: ElectroResult }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={8} total={9} title="Material Schedule — IS 8828:2007 · IS 3043:2018" />
        <PageRule />

        <SectionEyebrow>COMPLETE MATERIAL SCHEDULE — PUNE AVG 2026 RATES</SectionEyebrow>
        <View style={{ flexDirection: 'row', ...S.tableHeader }}>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>ITEM</Text>
          <Text style={{ width: 80, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>COST (₹)</Text>
        </View>
        {[
          { item: 'Wire material (1.5 to 10.0 sqmm — Finolex/Havells)', cost: result.costs.wireMaterial },
          { item: 'PVC conduit 16mm + fittings (bends, couplers, boxes)', cost: result.costs.conduitMaterial },
          { item: 'MCBs (6A/16A/20A) + RCCB 30mA (IS 3043:2018)',        cost: result.costs.mcbRccbMaterial },
          { item: `DB panel(s) — ${result.dbPanelSchedule.panelSize} × ${result.pointSchedule.exhaustPoints > 0 ? 1 : 1} floor`, cost: result.costs.dbPanelMaterial },
          { item: 'Switch/socket plates + concealed MS back boxes',        cost: result.costs.fixturesMaterial },
          ...(result.costs.earthingMaterial > 0 ? [{ item: `Earthing system — GI pipe earth 40mm × 2.5m (IS 3043:2018)`, cost: result.costs.earthingMaterial }] : []),
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk }}>{row.item}</Text>
            <Text style={{ width: 80, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{row.cost.toLocaleString('en-IN')}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', paddingVertical: 5, borderTopWidth: 2, borderTopColor: T.ironInk }}>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 10, fontWeight: 600, color: T.ironInk }}>Total Material Cost</Text>
          <Text style={{ width: 80, fontFamily: 'IBMPlexMono', fontSize: 10, fontWeight: 700, color: T.blueprint, textAlign: 'right' }}>
            {result.costs.totalMaterial.toLocaleString('en-IN')}
          </Text>
        </View>

        <SectionEyebrow>CPWD LABOUR SCHEDULE — SECTION 15</SectionEyebrow>
        <View style={{ flexDirection: 'row', ...S.tableHeader }}>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>TRADE</Text>
          <Text style={{ width: 50, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>WORKERS</Text>
          <Text style={{ width: 70, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>RATE/DAY</Text>
          <Text style={{ width: 80, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>IS NOTE</Text>
        </View>
        {[
          { trade: 'Licensed Electrician (Class B)',      workers: 2, rate: 1200, note: '8–10 pts/day' },
          { trade: 'Wireman',                             workers: 2, rate: 750,  note: 'Ratio' },
          { trade: 'Conduit Fixer',                       workers: 1, rate: 700,  note: '50 rft/day' },
          { trade: 'DB Panel Installer',                  workers: 1, rate: 1500, note: '1 panel/day' },
          { trade: 'Helper / Wall Chase',                 workers: 2, rate: 560,  note: 'Per day' },
          { trade: 'Testing & Commissioning',             workers: 1, rate: 1400, note: 'Per day' },
          { trade: 'Night Watchman',                      workers: 1, rate: 500,  note: 'Per day' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk }}>{row.trade}</Text>
            <Text style={{ width: 50, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{row.workers}</Text>
            <Text style={{ width: 70, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>₹{row.rate}</Text>
            <Text style={{ width: 80, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>{row.note}</Text>
          </View>
        ))}
        <View style={{ borderWidth: 1, borderColor: T.markingYellow, backgroundColor: T.yellowBg, padding: 8, marginTop: 10 }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.markingYellow, marginBottom: 3 }}>IS 732:2019 NOTE</Text>
          <Text style={[S.body, { fontSize: 8 }]}>
            Verify Class B electrician license from State Electricity Board before awarding contract.
            Unlicensed electrical work voids insurance and violates Indian Electricity Rules 1956 Rule 3(1)(f).
            CEIG inspection certificate required before commissioning.
          </Text>
        </View>
      </View>
    </Page>
  )
}

function CostSummaryPage({ result, reportId }: { result: ElectroResult; reportId: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nirmanshastra.in'
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={9} total={9} title="Cost Summary + PlumbPro Cross-sell" />
        <PageRule />

        {/* Three-column cost summary */}
        <SectionEyebrow>COST SUMMARY — BASIC / STANDARD / PREMIUM</SectionEyebrow>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'BASIC',    value: result.grandTotal.basic,    note: 'Min spec, local rates',       active: false },
            { label: 'STANDARD', value: result.grandTotal.standard, note: 'CPWD rates + 10% overhead',  active: true  },
            { label: 'PREMIUM',  value: result.grandTotal.premium,  note: 'Premium rates + supervision', active: false },
          ].map(col => (
            <View key={col.label} style={{
              flex: 1, borderWidth: col.active ? 2 : 1,
              borderColor: col.active ? T.blueprint : T.inkA35,
              padding: 8,
              backgroundColor: col.active ? T.blueprintBg : T.sheetWhite,
            }}>
              <Text style={[S.monoSm, { color: col.active ? T.blueprint : T.inkA60, marginBottom: 4 }]}>{col.label}</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 16, fontWeight: 700, color: col.active ? T.blueprint : T.ironInk }}>
                {formatLakhs(col.value)}
              </Text>
              <Text style={[S.monoSm, { color: T.inkA60, marginTop: 4 }]}>{col.note}</Text>
              <Text style={[S.monoSm, { color: T.inkA60, marginTop: 2 }]}>
                ₹{result.perSqftCost[col.label.toLowerCase() as 'basic' | 'standard' | 'premium']}/sqft
              </Text>
            </View>
          ))}
        </View>

        {/* Detailed breakdown */}
        <View style={{ flexDirection: 'row', ...S.tableHeader }}>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>COMPONENT</Text>
          <Text style={{ width: 90, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>STANDARD (₹)</Text>
        </View>
        {[
          { label: 'Materials (wire + conduit + MCB + DB + fixtures)', cost: result.costs.totalMaterial },
          { label: 'Labour — CPWD (electrician + wireman + conduit + testing)', cost: result.labourCost },
          { label: 'Contractor overhead + margin (10%)', cost: result.overheadCost },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk }}>{row.label}</Text>
            <Text style={{ width: 90, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{row.cost.toLocaleString('en-IN')}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', paddingVertical: 5, borderTopWidth: 2, borderTopColor: T.blueprint, backgroundColor: T.blueprintBg }}>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 10, fontWeight: 600, color: T.blueprint }}>TOTAL (STANDARD)</Text>
          <Text style={{ width: 90, fontFamily: 'IBMPlexMono', fontSize: 10, fontWeight: 700, color: T.blueprint, textAlign: 'right' }}>
            {result.grandTotal.standard.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* PlumbPro cross-sell */}
        <View style={{ marginTop: 16, borderWidth: 2, borderColor: T.ironInk, padding: 12, backgroundColor: T.sheetWhite }}>
          <Text style={[S.eyebrow, { color: T.blueprint, marginBottom: 4 }]}>PHASE 4 — PLUMBPRO · ₹499</Text>
          <Text style={[S.h2, { fontSize: 13, marginBottom: 4 }]}>Electrical conduit is done. Now estimate your plumbing.</Text>
          <Text style={[S.body, { marginBottom: 8 }]}>
            Plumbing must be coordinated with electrical work before plastering begins.
            Use PlumbPro to estimate pipe lengths, tank sizes, pump HP, and fixture counts —
            before your plumber quotes you.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            {[
              'IS 1172:1993 water demand',
              'Tank size calculation',
              'Pipe schedule by dia',
              'CPVC vs SWR quantities',
              'Pump HP estimate',
            ].map(f => (
              <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.approvedGreen }}>✓</Text>
                <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, color: T.inkA60 }}>{f}</Text>
              </View>
            ))}
          </View>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 9, color: T.blueprint }}>
            {appUrl}/tools/plumbpro → ₹499
          </Text>
        </View>

        {/* Footer disclaimer */}
        <Text style={[S.monoSm, { textAlign: 'center', marginTop: 12, lineHeight: 1.6 }]}>
          Report {reportId} · IS 732:2019 · IS 3043:2018 · IS 694:2010 · IS 8828:2007{'\n'}
          This report is for estimation purposes only. Quantities computed using IS-code thumb rules.{'\n'}
          Actual quantities will vary with site conditions. Consult a licensed electrical engineer for design drawings.
        </Text>
      </View>
    </Page>
  )
}

// ─── Engineering Behind the Calculation page ─────────────────────────────────

function EngineeringMethodPage({ reportId }: { reportId: string }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <Text style={S.eyebrow}>APPENDIX — CALCULATION METHODOLOGY</Text>
        <Text style={S.h2}>The Engineering Behind the Calculation</Text>
        <View style={S.rule} />

        <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 4, marginTop: 4 }}>WIRE SIZING (IS 732:2019)</Text>
        {[
          'Lighting circuits: 1.5 sqmm FR PVC copper — max 800W per circuit',
          'Power socket circuits: 2.5 sqmm FR PVC copper — max 3000W per circuit',
          'AC/Geyser circuits: 4.0 sqmm FR PVC copper — dedicated circuit mandatory',
          'Sub-panel feeder: 6.0 sqmm',
          'Main incomer: 10.0 sqmm',
          'Wastage factor: 1.15 applied to all wire lengths',
        ].map((t, i) => (
          <Text key={i} style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, lineHeight: 1.5, marginBottom: 2 }}>• {t}</Text>
        ))}

        <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 4, marginTop: 10 }}>MCB RATINGS (IS 8828:2007)</Text>
        {[
          'Lighting circuit: 6A MCB',
          'Power socket circuit: 16A MCB',
          'AC circuit: 20A MCB',
          'Geyser circuit: 20A MCB',
          'Main incomer: rated per total load',
        ].map((t, i) => (
          <Text key={i} style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, lineHeight: 1.5, marginBottom: 2 }}>• {t}</Text>
        ))}

        <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 4, marginTop: 10 }}>MANDATORY SAFETY (IS 732:2019 + CEA Regulations 2010)</Text>
        {[
          '30mA RCCB: mandatory for all bathroom and outdoor circuits',
          'Earth resistance: maximum 1 ohm (IS 3043:2018)',
          'All metallic enclosures must be earthed',
          'Licensed electrician mandatory — CEA Regulations 2010',
        ].map((t, i) => (
          <Text key={i} style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, lineHeight: 1.5, marginBottom: 2 }}>• {t}</Text>
        ))}

        <View style={{ marginTop: 12, borderTopWidth: 0.5, borderTopColor: T.inkA15, borderTopStyle: 'solid', paddingTop: 8 }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 6 }}>IS CODES USED</Text>
          {[
            'IS 732:2019 — Code of Practice for Electrical Wiring Installations',
            'IS 8828:2007 — Miniature Circuit Breakers',
            'IS 3043:2018 — Code of Practice for Earthing',
            'IS 12640 — Residual Current Circuit Breakers',
            'CEA Regulations 2010 — Measures relating to Safety and Electric Supply',
          ].map((t, i) => (
            <Text key={i} style={{ fontFamily: 'IBMPlexMono', fontSize: 7.5, color: T.inkA60, lineHeight: 1.6, marginBottom: 1 }}>{t}</Text>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ marginTop: 8, borderTopWidth: 0.5, borderTopColor: T.inkA15, borderTopStyle: 'solid', paddingTop: 6 }}>
          <Text style={S.monoSm}>NIRMANSHASTRA · ELECTROPRO · {reportId}</Text>
        </View>
      </View>
    </Page>
  )
}

// ─── DOCUMENT EXPORT ──────────────────────────────────────────────────────────

export default function ElectroProPDF(props: Props) {
  return (
    <Document title={`ElectroPro Report — ${props.reportId}`} author="NirmanShastra">
      <CoverPage {...props} />
      <LoadAnalysisPage input={props.input} result={props.result} />
      <ISCodeChecklistPage {...props} />
      <SingleLineDiagramPage result={props.result} />
      <DBPanelSchedulePage result={props.result} />
      <FloorWiringSchemPage input={props.input} result={props.result} />
      <WireSchedulePage result={props.result} />
      <MaterialSchedulePage result={props.result} />
      <CostSummaryPage result={props.result} reportId={props.reportId} />
      <EngineeringMethodPage reportId={props.reportId} />
    </Document>
  )
}
