// PlumbPro 9-page PDF — @react-pdf/renderer
// Design tokens from NirmanShastra_Design_Spec.md
// IS 1172:1993 + IS 1742:1983 values from Build Reference Section 8 — LOCKED

import React from 'react'
import path from 'path'
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  Svg,
  Line,
  Rect,
  Circle,
  Path,
} from '@react-pdf/renderer'

const LOGO_MARK = path.join(process.cwd(), 'public', 'icon-512.png')

import type { PlumbInput, PlumbResult } from '@/app/tools/plumbpro/plumbpro-engine'
import { formatLakhs } from '@/app/tools/plumbpro/plumbpro-engine'

// ─── Font registration ────────────────────────────────────────────────────────
const F = (name: string) => path.join(process.cwd(), 'public/fonts', name)

Font.register({
  family: 'IBMPlexSans',
  fonts: [
    { src: F('IBMPlexSans-Regular.ttf'), fontWeight: 400 },
    { src: F('IBMPlexSans-Medium.ttf'),  fontWeight: 500 },
    { src: F('IBMPlexSans-Bold.ttf'),    fontWeight: 700 },
  ],
})
Font.register({
  family: 'IBMPlexMono',
  fonts: [
    { src: F('IBMPlexMono-Regular.ttf'), fontWeight: 400 },
    { src: F('IBMPlexMono-Bold.ttf'),    fontWeight: 700 },
  ],
})
Font.register({
  family: 'IBMPlexSerif',
  fonts: [
    { src: F('IBMPlexSerif-Regular.ttf'), fontWeight: 400 },
    { src: F('IBMPlexSerif-Bold.ttf'),    fontWeight: 700 },
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
  body: { fontFamily: 'IBMPlexSans',  fontSize: 9,  color: T.ironInk, lineHeight: 1.5 },
  mono: { fontFamily: 'IBMPlexMono',  fontSize: 9,  color: T.ironInk },
  monoSm: { fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 },
  rule: { borderBottomWidth: 1, borderBottomColor: T.ironInk, marginVertical: 8 },
  row:  { flexDirection: 'row' },
  tableHeader: { fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, letterSpacing: 0.5, textTransform: 'uppercase', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: T.inkA35 },
  tableRow:    { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: T.inkA15 },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: T.inkA15, backgroundColor: 'rgba(30,34,39,0.025)' },
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
  input:       PlumbInput
  result:      PlumbResult
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
        <Text style={S.eyebrow}>NIRMANSHASTRA · PLUMBPRO · PHASE 4 — PLUMBING</Text>
        <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 13, fontWeight: 600, color: T.ironInk }}>{title}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={S.monoSm}>PAGE {page} OF {total}</Text>
        <Text style={[S.monoSm, { color: T.blueprint, marginTop: 2 }]}>IS 1172:1993 · IS 1742:1983</Text>
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

// Riser diagram SVG for PDF cover
function RiserSvg() {
  return (
    <Svg width="180" height="120" viewBox="0 0 180 120">
      {/* OHT at top */}
      <Rect x="65" y="5" width="50" height="18" fill="none" stroke={T.blueprint} strokeWidth="1.2" />
      <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.blueprint }} x="72" y="16">OHT TANK</Text>

      {/* Main riser vertical */}
      <Line x1="90" y1="23" x2="90" y2="100" stroke={T.ironInk} strokeWidth="2" />

      {/* Floor branches — 3 floors */}
      {[35, 58, 80].map((y, i) => (
        <React.Fragment key={i}>
          <Line x1="90" y1={y} x2="140" y2={y} stroke={T.blueprint} strokeWidth="1" />
          {/* P-trap */}
          <Path d={`M140 ${y} L152 ${y} L152 ${y + 10} L140 ${y + 10}`} fill="none" stroke={T.blueprint} strokeWidth="0.8" />
          {/* Floor label */}
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="92" y={y - 3}>FL{3 - i}</Text>
        </React.Fragment>
      ))}

      {/* Soil stack — dashed on left */}
      <Line x1="60" y1="23" x2="60" y2="100" stroke={T.ironInk} strokeWidth="1.2" strokeDasharray="4,3" />
      <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="40" y="60">110mm SWR</Text>
      <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="40" y="68">1:80 SLOPE</Text>

      {/* Sump at bottom */}
      <Rect x="60" y="100" width="60" height="16" fill="none" stroke={T.ironInk} strokeWidth="1" />
      <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="68" y="111">SUMP TANK</Text>

      {/* Supply label */}
      <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.ironInk }} x="92" y="110">32mm CPVC RISER</Text>

      {/* Waste label */}
      <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.blueprint }} x="115" y="55">75mm SWR</Text>
      <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.blueprint }} x="115" y="63">1:48 SLOPE</Text>
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
        constitute a Plumbing Engineer&apos;s certificate. Actual installation must be carried out by a licensed
        plumber. Municipal sanction and health department approval mandatory before occupation.
      </Text>
    </View>
  )
}

function ISCodeChecklistPage({ input, result }: Props) {
  const wd = result.waterDemand
  const ohtAdequate = wd.ohtL >= wd.dailyDemandL * 0.5
  const giViolation = result.compliance.find(c => c.detail?.toLowerCase().includes('gi') && c.status === 'fail')

  const items: ChecklistItem[] = [
    {
      status: 'pass',
      clause: 'IS 1172:1993 — Water Demand Calculation',
      description: `${wd.occupants} occupants × ${wd.lpcd} LPCD = ${wd.dailyDemandL.toLocaleString('en-IN')} L/day — calculated per IS 1172:1993 residential norms (${input.waterSource === 'municipal' ? 'municipal' : 'borewell'} source).`,
    },
    {
      status: ohtAdequate ? 'pass' : 'violation',
      clause: 'IS 1172:1993 Cl 6 — OHT / Tank Capacity',
      description: ohtAdequate
        ? `OHT capacity ${wd.ohtL.toLocaleString('en-IN')} L = ${wd.ohtM3} m³ — meets IS 1172:1993 requirement of 2/3 daily demand for overhead storage.`
        : `OHT ${wd.ohtL.toLocaleString('en-IN')} L is undersized. IS 1172:1993 requires minimum ${Math.round(wd.dailyDemandL * 0.67).toLocaleString('en-IN')} L. Increase tank size before procurement.`,
    },
    {
      status: 'pass',
      clause: 'IS 1742:1983 Cl 9 — Drainage Slopes',
      description: `75mm SWR waste pipes at 1:48 slope (20.8mm/m); 110mm soil stack branches at 1:80 slope (12.5mm/m). Both per IS 1742:1983 Table 3 — self-cleansing velocity maintained.`,
    },
    {
      status: 'pass',
      clause: 'IS 15778:2007 — CPVC Supply Pipes',
      description: `CPVC pipes specified for hot and cold water supply — rated for 93°C and 150 psi per IS 15778:2007. Suitable for all bathroom, kitchen, and riser applications.`,
    },
    {
      status: input.includeSump ? 'pass' : 'advisory',
      clause: 'IS 12701:1989 — HDPE Overhead Tank',
      description: input.includeSump
        ? `HDPE food-grade overhead tank included — ${wd.ohtL.toLocaleString('en-IN')} L capacity, covered, insect-proof per IS 12701:1989. Minimum 6-leg MS support.`
        : `OHT specified — ensure IS 12701 HDPE food-grade tank is procured. Sump tank not included in estimate. Verify with structural engineer for rooftop load.`,
    },
    {
      status: 'advisory',
      clause: 'IS 1742:1983 Cl 10 — Vent Pipe Requirement',
      description: `Soil stack must extend 900mm above roof level as vent pipe per IS 1742:1983 Cl 10. Anti-syphon vent required if soil stack length exceeds 6m. Confirm with plumber.`,
    },
    {
      status: wd.ohtL < 1000 ? 'advisory' : 'pass',
      clause: 'IS 1172:1993 — Tank Size vs Floors',
      description: wd.ohtL < 1000
        ? `OHT of ${wd.ohtL}L is small for ${input.numFloors}-floor building. Consider buffer sump to avoid supply disruptions during municipal water shutdown periods.`
        : `Tank capacity ${wd.ohtM3} m³ sufficient for ${input.numFloors}-floor, ${wd.occupants}-occupant demand per IS 1172:1993.`,
    },
    {
      status: 'advisory',
      clause: 'IS 3043:2018 — Metallic Pipe Earthing',
      description: `All metallic water supply pipes within 600mm of electrical circuits must be bonded to earth per IS 3043:2018 Cl 10. Coordinate with electrical contractor before finishing walls.`,
    },
    {
      status: 'advisory',
      clause: 'NBC 2016 Part 9 — Rainwater Harvesting',
      description: `Buildings with plot area > 300 sqm must provide rainwater harvesting per NBC 2016 and most state building by-laws. Percolation pits or tank recharge recommended.`,
    },
    {
      status: giViolation ? 'violation' : 'pass',
      clause: 'IS 1239:2004 / IS 1742:1983 — GI Pipe Restriction',
      description: giViolation
        ? `GI (Galvanised Iron) pipes are NOT recommended for potable water supply — corrosion and scaling degrade water quality over 10-15 years. Replace with CPVC or uPVC per IS 15778:2007.`
        : `No GI pipe issues detected. CPVC / uPVC supply and SWR drainage piping as specified meets IS 15778:2007 and IS 13592:2013 standards.`,
    },
  ]

  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={3} total={10} title="IS Code Compliance Checklist — Plumbing Phase" />
        <PageRule />
        <Text style={[S.eyebrow, { marginBottom: 8 }]}>
          IS 1172:1993 · IS 1742:1983 · IS 15778:2007 · IS 12701:1989 · IS 3043:2018 · NBC 2016
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

// ─── PAGE 1: COVER ────────────────────────────────────────────────────────────

function CoverPage({ input, result, contact, reportId, projectName, date }: Props) {
  const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        {/* Phase badge + report ID */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={{ borderWidth: 1, borderColor: T.blueprint, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.blueprint, letterSpacing: 1 }}>
              PHASE 4 · PLUMBING ESTIMATE
            </Text>
          </View>
          <View style={{ borderWidth: 1, borderColor: T.ironInk, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.ironInk }}>{reportId}</Text>
          </View>
        </View>

        <Text style={[S.eyebrow, { fontSize: 9, letterSpacing: 2 }]}>NIRMANSHASTRA · PLUMBPRO</Text>
        <Text style={S.h1}>{projectName}</Text>
        <View style={S.rule} />

        <RiserSvg />

        <View style={{ marginTop: 12, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {['IS 1172:1993', 'IS 1742:1983', 'IS 12701', 'NBC 2016 Part 9'].map(code => (
              <View key={code} style={S.chip}><Text>{code}</Text></View>
            ))}
          </View>
        </View>

        {/* Key specs grid */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'DAILY DEMAND',  value: `${result.waterDemand.dailyDemandL.toLocaleString('en-IN')} L` },
            { label: 'OHT SIZE',      value: `${result.waterDemand.ohtL.toLocaleString('en-IN')} L` },
            { label: 'PUMP HP',       value: result.waterDemand.pumpHPStandard },
            { label: 'TOTAL FIXTURES',value: `${result.fixtureSchedule.totalFixtures}` },
            { label: 'BATHROOMS',     value: `${input.numBathrooms}` },
          ].map(item => (
            <View key={item.label} style={{ flex: 1, borderWidth: 1, borderColor: T.blueprint, padding: 6 }}>
              <Text style={[S.monoSm, { marginBottom: 3 }]}>{item.label}</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 10, fontWeight: 700, color: T.blueprint }}>{item.value}</Text>
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
              { label: 'DRAWN BY', value: 'NIRMANSHASTRA' },
            ].map((item, i) => (
              <View key={item.label} style={{ flex: 1, borderRightWidth: i < 3 ? 1 : 0, borderRightColor: T.inkA35, paddingHorizontal: 5 }}>
                <Text style={S.monoSm}>{item.label}</Text>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.ironInk, marginTop: 2 }}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[S.monoSm, { textAlign: 'center', marginTop: 8, lineHeight: 1.6 }]}>
          This report is for estimation purposes only. Not a substitute for licensed plumbing engineer&apos;s drawings.
          All IS code values as per Build Reference Section 8 — LOCKED.
        </Text>

        <Image src={LOGO_MARK} style={{ position: 'absolute', bottom: 20, right: 20, width: 100, height: 100, opacity: 0.07 }} />
      </View>
    </Page>
  )
}

// ─── PAGE 2: WATER DEMAND CALCULATION ────────────────────────────────────────

function WaterDemandPage({ input, result }: { input: PlumbInput; result: PlumbResult }) {
  const wd = result.waterDemand
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={2} total={10} title="Water Demand Calculation — IS 1172:1993" />
        <PageRule />

        <SectionEyebrow>BUILDING DETAILS</SectionEyebrow>
        <InfoRow label="Location"      value={`${input.city}, ${input.state}`} />
        <InfoRow label="BUA per floor" value={`${input.buaPerFloorSqft} sqft`} mono />
        <InfoRow label="Floors"        value={`${input.numFloors}`} mono />
        <InfoRow label="Bedrooms"      value={`${input.numBedrooms} BHK`} mono />
        <InfoRow label="Bathrooms"     value={`${input.numBathrooms}`} mono />
        <InfoRow label="Water source"  value={input.waterSource === 'municipal' ? 'Municipal supply' : 'Borewell / Tanker'} />
        <InfoRow label="Sump tank"     value={input.includeSump ? 'Included (IS 12701 HDPE)' : 'Not included'} />

        <SectionEyebrow>IS 1172:1993 WATER DEMAND CALCULATION (LOCKED)</SectionEyebrow>
        <View style={{ borderWidth: 1, borderColor: T.blueprint, backgroundColor: T.blueprintBg, padding: 10, marginBottom: 10 }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.blueprint, marginBottom: 6 }}>STEP-BY-STEP CALCULATION</Text>
          {[
            { label: 'Occupancy',         value: `${wd.occupants} persons (bedrooms × 2 + 2)` },
            { label: 'LPCD',              value: `${wd.lpcd} L/person/day (IS 1172:1993 ${input.waterSource === 'municipal' ? 'municipal' : 'borewell'})` },
            { label: 'Daily demand',      value: `${wd.occupants} × ${wd.lpcd} = ${wd.dailyDemandL.toLocaleString('en-IN')} L/day` },
            { label: 'Total tank size',   value: `${wd.dailyDemandL.toLocaleString('en-IN')} × 0.67 = ${wd.totalTankL.toLocaleString('en-IN')} L (IS 1172:1993 Cl 6)` },
            { label: 'OHT recommended',   value: `${wd.ohtL.toLocaleString('en-IN')} L (${wd.ohtM3} m³) — 50% of total` },
            { label: 'Sump recommended',  value: input.includeSump ? `${wd.sumpL.toLocaleString('en-IN')} L (${wd.sumpM3} m³) — 50% of total` : 'Not included' },
          ].map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: 'rgba(31,78,121,0.2)' }}>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, flex: 1.2 }}>{row.label.toUpperCase()}</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.ironInk, flex: 2 }}>{row.value}</Text>
            </View>
          ))}
        </View>

        <SectionEyebrow>PUMP SIZING CALCULATION</SectionEyebrow>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          {[
            { label: 'FLOW RATE',    value: `${wd.pumpFlowLPH} LPH`,      note: 'OHT filled in 2 hours' },
            { label: 'STATIC HEAD',  value: `${wd.staticHeadM} m`,         note: `${input.numFloors} × 3.5m + 5m friction` },
            { label: 'PUMP HP',      value: wd.pumpHPStandard,             note: 'Next standard above calculated' },
          ].map(item => (
            <View key={item.label} style={{ flex: 1, borderWidth: 1, borderColor: T.blueprint, padding: 6 }}>
              <Text style={S.monoSm}>{item.label}</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 14, fontWeight: 700, color: T.blueprint, marginVertical: 4 }}>{item.value}</Text>
              <Text style={[S.monoSm, { color: T.inkA60 }]}>{item.note}</Text>
            </View>
          ))}
        </View>

        <SectionEyebrow>IS COMPLIANCE — IS 1172:1993</SectionEyebrow>
        {result.compliance.slice(0, 3).map((c, i) => {
          const colour = c.status === 'pass' ? T.approvedGreen : c.status === 'fail' ? T.stampOxide : T.markingYellow
          return (
            <View key={i} style={{ flexDirection: 'row', padding: 8, marginBottom: 5, borderWidth: 1, borderColor: colour + '44', backgroundColor: colour + '08' }}>
              <View style={{ marginRight: 8, borderWidth: 1, borderColor: colour, borderStyle: 'solid', padding: 2 }}>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: colour }}>{c.status.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: colour, marginBottom: 2 }}>{c.clause}</Text>
                <Text style={[S.body, { fontSize: 8 }]}>{c.detail}</Text>
              </View>
            </View>
          )
        })}

        <View style={{ borderWidth: 1, borderColor: T.markingYellow, backgroundColor: T.yellowBg, padding: 8, marginTop: 8 }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.markingYellow, marginBottom: 3 }}>IS 1172:1993 — CRITICAL NOTE ON TANK SIZING</Text>
          <Text style={[S.body, { fontSize: 8 }]}>
            Tank undersizing is the most common plumbing specification error in residential construction.
            Contractors sometimes propose smaller tanks to reduce quoted cost — verify every proposed tank
            size against this IS 1172:1993 calculation. A tank 30% undersized causes dry taps for
            6+ hours per day and pump short-cycling leading to motor burnout within 2–3 years.
          </Text>
        </View>
      </View>
    </Page>
  )
}

// ─── PAGE 3: WATER SUPPLY RISER SVG ──────────────────────────────────────────

function WaterSupplyRiserPage({ input, result }: { input: PlumbInput; result: PlumbResult }) {
  const floors = Math.min(input.numFloors, 5)
  const floorH = 50
  const baseY  = 40 + floors * floorH

  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={4} total={10} title="Water Supply Riser Diagram — IS 1742:1983" />
        <PageRule />

        <Text style={[S.body, { fontSize: 8, marginBottom: 8, color: T.inkA60 }]}>
          Schematic for estimation reference only. Not for construction without licensed plumbing engineer&apos;s sign-off.
          All diameters per IS 1742:1983.
        </Text>

        <Svg width="510" height={baseY + 80} viewBox={`0 0 510 ${baseY + 80}`}>
          {/* OHT */}
          <Rect x="190" y="10" width="80" height="28" fill={T.blueprintBg} stroke={T.blueprint} strokeWidth="1.5" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.blueprint }} x="200" y="22">OVERHEAD TANK</Text>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.ironInk }} x="200" y="32">{result.waterDemand.ohtL.toLocaleString('en-IN')} L (IS 12701)</Text>

          {/* Main riser from OHT down */}
          <Line x1="230" y1="38" x2="230" y2={baseY} stroke={T.ironInk} strokeWidth="2.5" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="234" y="60">32mm CPVC RISER</Text>

          {/* Floor branches */}
          {Array.from({ length: floors }, (_, i) => {
            const floorNum = floors - i
            const y = 38 + (i + 1) * floorH - 5
            return (
              <React.Fragment key={i}>
                <Line x1="230" y1={y} x2="330" y2={y} stroke={T.blueprint} strokeWidth="1.2" />
                {/* P-trap */}
                <Path d={`M330 ${y} L350 ${y} L350 ${y + 12} L330 ${y + 12}`} fill="none" stroke={T.blueprint} strokeWidth="1" />
                {/* Floor label */}
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.inkA60 }} x="190" y={y + 4}>
                  {floorNum === 1 ? 'GROUND FL.' : `FLOOR ${floorNum - 1}`}
                </Text>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="240" y={y - 4}>25mm CPVC BRANCH</Text>
                {/* Ball valve symbol */}
                <Circle cx="260" cy={y} r="4" fill="none" stroke={T.ironInk} strokeWidth="0.8" />
              </React.Fragment>
            )
          })}

          {/* Sump tank at bottom */}
          {input.includeSump && (
            <>
              <Rect x="170" y={baseY + 10} width="120" height="30" fill="none" stroke={T.ironInk} strokeWidth="1.2" />
              <Line x1="230" y1={baseY} x2="230" y2={baseY + 10} stroke={T.ironInk} strokeWidth="1.5" />
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.ironInk }} x="195" y={baseY + 22}>UNDERGROUND SUMP</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.inkA60 }} x="195" y={baseY + 32}>{result.waterDemand.sumpL.toLocaleString('en-IN')} L (IS 12701 HDPE)</Text>
            </>
          )}

          {/* Pump */}
          <Rect x="100" y={baseY - 15} width="50" height="25" fill={T.sheetWhite} stroke={T.ironInk} strokeWidth="1" />
          <Line x1="150" y1={baseY - 3} x2="230" y2={baseY - 3} stroke={T.ironInk} strokeWidth="1" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.ironInk }} x="108" y={baseY - 4}>{result.waterDemand.pumpHPStandard}</Text>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="108" y={baseY + 6}>PUMP</Text>

          {/* Gate valve on main */}
          <Rect x="220" y={baseY - 40} width="20" height="12" fill={T.sheetWhite} stroke={T.ironInk} strokeWidth="0.8" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="225" y={baseY - 31}>GV</Text>

          {/* Legend */}
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="10" y={baseY + 60}>
            —— 32mm CPVC RISER (COLD SUPPLY)  ── 25mm CPVC BRANCH  ⊙ BALL VALVE  □ P-TRAP
          </Text>
        </Svg>

        <View style={{ borderWidth: 1, borderColor: T.inkA35, padding: 8, marginTop: 10 }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.ironInk, marginBottom: 3 }}>PIPE SPECIFICATION — IS 1742:1983</Text>
          {[
            { spec: 'Riser pipe', diameter: '32mm CPVC (IS 15778:2007)', note: 'From sump/pump to OHT and down to all floors' },
            { spec: 'Branch pipe', diameter: '25mm CPVC (IS 15778:2007)', note: 'From riser to each bathroom/kitchen (IS 1742:1983 minimum)' },
            { spec: 'Ball valve', diameter: '25mm IS:778', note: 'At every branch take-off and OHT outlet' },
          ].map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: T.inkA15 }}>
              <Text style={[S.monoSm, { flex: 0.8 }]}>{row.spec.toUpperCase()}</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, flex: 0.8 }}>{row.diameter}</Text>
              <Text style={[S.body, { flex: 1.5, fontSize: 7.5 }]}>{row.note}</Text>
            </View>
          ))}
        </View>
      </View>
    </Page>
  )
}

// ─── PAGE 4: DRAINAGE LAYOUT SVG ─────────────────────────────────────────────

function DrainageLayoutPage({ input }: { input: PlumbInput; result: PlumbResult }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={5} total={10} title="Drainage Layout — IS 1742:1983 Slopes" />
        <PageRule />

        <Text style={[S.body, { fontSize: 8, marginBottom: 8, color: T.inkA60 }]}>
          Indicative schematic. Actual drainage layout must be prepared by licensed plumbing engineer per IS 1742:1983.
          All slopes are mandatory minimum — steeper slopes may be used.
        </Text>

        <Svg width="510" height="220" viewBox="0 0 510 220">
          {/* Floor slab */}
          <Rect x="20" y="10" width="470" height="180" fill="none" stroke={T.ironInk} strokeWidth="1.5" />

          {/* Soil stack (110mm) — left side */}
          <Rect x="30" y="5" width="18" height="180" fill="none" stroke={T.ironInk} strokeWidth="1.5" strokeDasharray="0" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.ironInk }} x="22" y="3">110mm SOIL STACK</Text>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="22" y="195">SLOPE 1:80 (1.25%)</Text>

          {/* WC connections to soil stack */}
          {[40, 90, 140].slice(0, Math.min(input.numBathrooms, 3)).map((y, i) => (
            <React.Fragment key={i}>
              <Line x1="48" y1={y} x2="120" y2={y} stroke={T.ironInk} strokeWidth="1.2" />
              {/* P-trap */}
              <Path d={`M120 ${y} L132 ${y} L132 ${y + 10} L120 ${y + 10}`} fill="none" stroke={T.ironInk} strokeWidth="0.8" />
              <Rect x="135" y={y - 8} width="24" height="18" fill="none" stroke={T.ironInk} strokeWidth="0.8" />
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="137" y={y + 3}>WC {i + 1}</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 4.5, fill: T.inkA60 }} x="50" y={y - 3}>110mm SWR</Text>
            </React.Fragment>
          ))}

          {/* Waste pipe (75mm) for basins/kitchen */}
          <Line x1="200" y1="80" x2="380" y2="80" stroke={T.blueprint} strokeWidth="1" strokeDasharray="5,2" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.blueprint }} x="202" y="75">75mm SWR WASTE MAIN — SLOPE 1:48 (2%)</Text>

          {/* Basin connections */}
          <Line x1="280" y1="80" x2="280" y2="110" stroke={T.blueprint} strokeWidth="0.8" />
          <Rect x="265" y="110" width="30" height="14" fill="none" stroke={T.blueprint} strokeWidth="0.8" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="267" y="120">WASH BASIN</Text>

          {/* Kitchen sink */}
          <Line x1="380" y1="80" x2="380" y2="140" stroke={T.blueprint} strokeWidth="0.8" />
          <Rect x="363" y="140" width="34" height="14" fill="none" stroke={T.blueprint} strokeWidth="0.8" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="365" y="150">KITCHEN SINK</Text>

          {/* Underground drain — to external */}
          <Line x1="30" y1="185" x2="490" y2="185" stroke={T.ironInk} strokeWidth="2" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.ironInk }} x="22" y="200">110mm uPVC UNDERGROUND DRAIN → EXTERNAL MANHOLE / SEPTIC</Text>

          {/* Clean-out access markers */}
          <Circle cx="39" cy="50"  r="5" fill="none" stroke={T.markingYellow} strokeWidth="1" />
          <Circle cx="39" cy="100" r="5" fill="none" stroke={T.markingYellow} strokeWidth="1" />
          <Circle cx="39" cy="150" r="5" fill="none" stroke={T.markingYellow} strokeWidth="1" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 4.5, fill: T.markingYellow }} x="20" y="210">⊙ CLEANOUT ACCESS EVERY 3m (IS 1742:1983 Cl 10 MANDATORY)</Text>

          {/* Legend */}
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 4.5, fill: T.inkA60 }} x="220" y="210">
            ── 110mm SWR SOIL STACK  - - - 75mm SWR WASTE  ─── uPVC DRAIN
          </Text>
        </Svg>

        <SectionEyebrow>IS 1742:1983 SLOPE SCHEDULE</SectionEyebrow>
        <View style={{ flexDirection: 'row', ...S.tableHeader }}>
          <Text style={{ flex: 1.5, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>PIPE SIZE / USE</Text>
          <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>SLOPE (IS 1742)</Text>
          <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>% GRADIENT</Text>
          <Text style={{ flex: 1.5, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>NOTE</Text>
        </View>
        {[
          { pipe: '75mm SWR — bath/kitchen waste', slope: '1:48', pct: '2.0%', note: 'IS 1742:1983 Cl 7.3 — MANDATORY MINIMUM' },
          { pipe: '110mm SWR — WC soil stack',     slope: '1:80', pct: '1.25%',note: 'IS 1742:1983 Cl 6.1 — MANDATORY MINIMUM' },
          { pipe: '110mm uPVC — underground',      slope: '1:60', pct: '1.67%',note: 'Standard for underground runs' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ flex: 1.5, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk }}>{row.pipe}</Text>
            <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 9, fontWeight: 700, color: T.blueprint, textAlign: 'right' }}>{row.slope}</Text>
            <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{row.pct}</Text>
            <Text style={{ flex: 1.5, fontFamily: 'IBMPlexSans', fontSize: 8, color: T.inkA60 }}>{row.note}</Text>
          </View>
        ))}
      </View>
    </Page>
  )
}

// ─── PAGE 5: TANK + PUMP SCHEMATIC ───────────────────────────────────────────

function TankPumpPage({ input, result }: { input: PlumbInput; result: PlumbResult }) {
  const wd = result.waterDemand
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={6} total={10} title="Tank + Pump Schematic — IS 12701 · IS 1172:1993" />
        <PageRule />

        <Svg width="510" height="200" viewBox="0 0 510 200">
          {/* OHT — elevated */}
          <Rect x="180" y="10" width="150" height="50" fill={T.blueprintBg} stroke={T.blueprint} strokeWidth="1.5" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, fill: T.blueprint }} x="220" y="28">OVERHEAD TANK</Text>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.ironInk }} x="205" y="40">{wd.ohtL.toLocaleString('en-IN')} L · IS 12701 HDPE</Text>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.inkA60 }} x="205" y="52">FOOD-GRADE · COVERED · INSECT-PROOF</Text>

          {/* OHT outlet + float valve */}
          <Line x1="255" y1="60" x2="255" y2="90" stroke={T.ironInk} strokeWidth="1.5" />
          <Rect x="240" y="90" width="30" height="10" fill={T.sheetWhite} stroke={T.ironInk} strokeWidth="0.8" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="245" y="98">FLOAT VALVE</Text>

          {/* Riser from sump to OHT */}
          <Line x1="200" y1="60" x2="200" y2="155" stroke={T.ironInk} strokeWidth="1.2" strokeDasharray="4,3" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="162" y="105">32mm CPVC</Text>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="162" y="113">RISING MAIN</Text>

          {/* Pump */}
          <Rect x="80" y="140" width="80" height="35" fill={T.sheetWhite} stroke={T.ironInk} strokeWidth="1.2" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, fill: T.ironInk }} x="90" y="153">PUMP</Text>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.blueprint }} x="90" y="165">{wd.pumpHPStandard} MOTOR</Text>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="90" y="175">{wd.pumpFlowLPH} LPH</Text>
          <Line x1="160" y1="157" x2="200" y2="157" stroke={T.ironInk} strokeWidth="1.2" />
          <Rect x="165" y="150" width="15" height="14" fill={T.sheetWhite} stroke={T.ironInk} strokeWidth="0.8" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 4.5, fill: T.inkA60 }} x="166" y="160">GV</Text>

          {/* Sump */}
          {input.includeSump && (
            <>
              <Rect x="30" y="155" width="110" height="35" fill="none" stroke={T.ironInk} strokeWidth="1.2" />
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, fill: T.ironInk }} x="55" y="170">SUMP TANK</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.inkA60 }} x="40" y="182">{wd.sumpL.toLocaleString('en-IN')} L · IS 12701</Text>
              <Line x1="80" y1="155" x2="80" y2="175" stroke={T.ironInk} strokeWidth="1" />
            </>
          )}

          {/* Municipal/borewell supply */}
          <Line x1="10" y1="170" x2="30" y2="170" stroke={T.blueprint} strokeWidth="1.5" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.blueprint }} x="10" y="165">{input.waterSource === 'municipal' ? 'MUNICIPAL' : 'BOREWELL'}</Text>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="10" y="180">SUPPLY</Text>

          {/* Distribution from OHT */}
          <Line x1="255" y1="100" x2="255" y2="130" stroke={T.blueprint} strokeWidth="1.5" />
          <Line x1="200" y1="130" x2="400" y2="130" stroke={T.blueprint} strokeWidth="1.5" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.blueprint }} x="202" y="125">DISTRIBUTION — 32mm CPVC DOWN RISER</Text>

          {/* Pressure info */}
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, fill: T.inkA60 }} x="350" y="160">
            HEAD: {wd.staticHeadM}m
          </Text>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, fill: T.inkA60 }} x="350" y="170">
            PRESSURE: {(wd.staticHeadM * 0.098).toFixed(1)} bar
          </Text>
          {input.numFloors > 2 && (
            <>
              <Rect x="340" y="125" width="80" height="25" fill={T.yellowBg} stroke={T.markingYellow} strokeWidth="0.8" />
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.markingYellow }} x="345" y="137">PRV RECOMMENDED</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }} x="345" y="147">FOR {input.numFloors}+ FLOORS</Text>
            </>
          )}
        </Svg>

        <SectionEyebrow>TANK SPECIFICATION — IS 12701</SectionEyebrow>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { label: 'OHT CAPACITY',  value: `${wd.ohtL.toLocaleString('en-IN')} L`, note: `${wd.ohtM3} m³ · min 6 legs support` },
            ...(input.includeSump ? [{ label: 'SUMP CAPACITY', value: `${wd.sumpL.toLocaleString('en-IN')} L`, note: `${wd.sumpM3} m³ · waterproof brick/RCC` }] : []),
            { label: 'PUMP HP',       value: wd.pumpHPStandard, note: `${wd.pumpFlowLPH} LPH at ${wd.staticHeadM}m head` },
          ].map(item => (
            <View key={item.label} style={{ flex: 1, borderWidth: 1, borderColor: T.blueprint, padding: 8 }}>
              <Text style={S.monoSm}>{item.label}</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 12, fontWeight: 700, color: T.blueprint, marginVertical: 3 }}>{item.value}</Text>
              <Text style={[S.monoSm, { color: T.inkA60 }]}>{item.note}</Text>
            </View>
          ))}
        </View>

        <View style={{ borderWidth: 1, borderColor: T.markingYellow, backgroundColor: T.yellowBg, padding: 8, marginTop: 12 }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.markingYellow, marginBottom: 3 }}>IS 12701 MANDATORY REQUIREMENTS</Text>
          <Text style={[S.body, { fontSize: 8 }]}>
            All domestic water storage tanks must be food-grade HDPE per IS 12701 — UV-stabilised, covered (to prevent contamination
            and mosquito breeding), and insect-proof. Tanks must bear IS 12701 ISI mark. Never use open-top tanks or galvanised
            iron tanks for potable water storage. GI tanks corrode within 5–7 years in most urban Indian water conditions.
          </Text>
        </View>
      </View>
    </Page>
  )
}

// ─── PAGE 6: PIPE SCHEDULE ────────────────────────────────────────────────────

function PipeSchedulePage({ result }: { result: PlumbResult }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={7} total={10} title="Pipe Schedule — IS 1742:1983 · IS 15778:2007" />
        <PageRule />

        <SectionEyebrow>PIPE SCHEDULE — LOCKED DIAMETERS (IS 1742:1983)</SectionEyebrow>
        <View style={{ flexDirection: 'row', ...S.tableHeader }}>
          <Text style={{ width: 28, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>ITEM NO.</Text>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>DESCRIPTION</Text>
          <Text style={{ width: 40, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>UNIT</Text>
          <Text style={{ width: 50, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>QTY</Text>
          <Text style={{ width: 55, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>RATE (₹)</Text>
          <Text style={{ width: 65, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>AMOUNT (₹)</Text>
        </View>
        {[
          { type: 'CPVC 25mm — branch supply (hot+cold) IS 15778:2007', qty: result.pipeSchedule.cpvc25m, rate: 120 },
          { type: 'CPVC 32mm — main riser supply IS 15778:2007',        qty: result.pipeSchedule.cpvc32m, rate: 180 },
          { type: 'SWR 75mm — waste pipes (slope 1:48) IS 1742:1983',  qty: result.pipeSchedule.swr75m,  rate: 95  },
          { type: 'SWR 110mm — soil stack (slope 1:80) IS 1742:1983',  qty: result.pipeSchedule.swr110m, rate: 145 },
          { type: 'uPVC 110mm — underground drain IS 4985:2000',        qty: result.pipeSchedule.upvc110m,rate: 160 },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ width: 28, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.inkA60 }}>{`1.${i + 1}`}</Text>
            <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk }}>{row.type}</Text>
            <Text style={{ width: 40, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.inkA60, textAlign: 'right' }}>m</Text>
            <Text style={{ width: 50, fontFamily: 'IBMPlexMono', fontSize: 9, fontWeight: 700, color: T.ironInk, textAlign: 'right' }}>{row.qty}</Text>
            <Text style={{ width: 55, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.inkA60, textAlign: 'right' }}>{row.rate}</Text>
            <Text style={{ width: 65, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{(row.qty * row.rate).toLocaleString('en-IN')}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', paddingVertical: 4, borderTopWidth: 1, borderTopColor: T.inkA35 }}>
          <Text style={{ width: 28 }} />
          <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk, fontStyle: 'italic' }}>1.6  Fittings allowance (35% of pipe cost)</Text>
          <Text style={{ width: 40 }} />
          <Text style={{ width: 50 }} />
          <Text style={{ width: 55 }} />
          <Text style={{ width: 65, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{result.costs.fittingsMaterial.toLocaleString('en-IN')}</Text>
        </View>
        <View style={{ flexDirection: 'row', paddingVertical: 5, borderTopWidth: 2, borderTopColor: T.ironInk }}>
          <Text style={{ width: 28 }} />
          <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 10, fontWeight: 600, color: T.ironInk }}>Total Pipe + Fittings Material</Text>
          <Text style={{ width: 40 }} />
          <Text style={{ width: 50 }} />
          <Text style={{ width: 55 }} />
          <Text style={{ width: 65, fontFamily: 'IBMPlexMono', fontSize: 10, fontWeight: 700, color: T.blueprint, textAlign: 'right' }}>
            {(result.costs.cpvcPipeMaterial + result.costs.swrPipeMaterial + result.costs.upvcPipeMaterial + result.costs.fittingsMaterial).toLocaleString('en-IN')}
          </Text>
        </View>

        <SectionEyebrow>CPWD LABOUR SCHEDULE — SECTION 16 (LOCKED)</SectionEyebrow>
        <View style={{ flexDirection: 'row', ...S.tableHeader }}>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>TRADE</Text>
          <Text style={{ width: 55, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>WORKERS</Text>
          <Text style={{ width: 70, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>RATE/DAY</Text>
          <Text style={{ flex: 1, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>PRODUCTIVITY</Text>
        </View>
        {[
          { trade: 'Licensed Plumber (Nal Mistri)',  workers: 2, rate: 1100, prod: '6–8 CPVC joints/day' },
          { trade: 'Plumber Helper',                workers: 2, rate: 600,  prod: 'Ratio to plumber' },
          { trade: 'Sanitary Fitter',               workers: 1, rate: 1000, prod: '3–4 fixtures/day' },
          { trade: 'Excavation (drainage trench)',  workers: 1, rate: 750,  prod: '~5 m/day' },
          { trade: 'Testing / Flush Test',          workers: 1, rate: 1000, prod: '1 day per site' },
          { trade: 'Night Watchman',                workers: 1, rate: 500,  prod: 'Per day' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk }}>{row.trade}</Text>
            <Text style={{ width: 55, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{row.workers}</Text>
            <Text style={{ width: 70, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>₹{row.rate}</Text>
            <Text style={{ flex: 1, fontFamily: 'IBMPlexSans', fontSize: 8, color: T.inkA60, textAlign: 'right' }}>{row.prod}</Text>
          </View>
        ))}

        <View style={{ borderWidth: 1, borderColor: T.markingYellow, backgroundColor: T.yellowBg, padding: 8, marginTop: 10 }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.markingYellow, marginBottom: 3 }}>NBC 2016 PART 9 — LICENSED PLUMBER MANDATORY</Text>
          <Text style={[S.body, { fontSize: 8 }]}>
            All plumbing work must be executed by a plumber licensed by the local municipal authority.
            Verify license before awarding contract. Hydraulic pressure test at 1.5× working pressure
            for minimum 1 hour before closing walls or backfilling drainage trenches (IS 1742:1983 Cl 14).
          </Text>
        </View>
      </View>
    </Page>
  )
}

// ─── PAGE 7: FIXTURE SCHEDULE ─────────────────────────────────────────────────

function FixtureSchedulePage({ result }: { result: PlumbResult }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={8} total={10} title="Fixture Schedule — IS 771 · IS 2548 · IS 1795" />
        <PageRule />

        <SectionEyebrow>SANITARY FIXTURE SCHEDULE</SectionEyebrow>
        <View style={{ flexDirection: 'row', ...S.tableHeader }}>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>FIXTURE TYPE</Text>
          <Text style={{ width: 40, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>QTY</Text>
          <Text style={{ flex: 1.5, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>IS STANDARD</Text>
          <Text style={{ flex: 1.5, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>NOTE</Text>
        </View>
        {[
          { name: 'EWC / Indian WC pan',       qty: result.fixtureSchedule.ewcPan,      code: 'IS 2556:1996',  note: 'P-trap / S-trap — verify trap type before order' },
          { name: 'Wash basin (pedestal/wall)', qty: result.fixtureSchedule.washBasin,   code: 'IS 771:1979',   note: 'Includes bottle trap + CP waste' },
          { name: 'Kitchen sink (SS)',          qty: result.fixtureSchedule.kitchenSink, code: 'IS 13983:1994', note: 'SS 304 grade minimum' },
          { name: 'CP shower set',              qty: result.fixtureSchedule.showerSet,   code: 'IS 1795:1986',  note: 'Overhead + hand shower or combined' },
          { name: 'CP bib tap (bathroom)',      qty: result.fixtureSchedule.bibTap,      code: 'IS 1710:1998',  note: '2 per bathroom (hot + cold)' },
          { name: 'Pillar tap (kitchen/utility)',qty: result.fixtureSchedule.pillarTap,  code: 'IS 1233:1998',  note: 'Kitchen + utility tap' },
          { name: 'Floor trap 100mm',           qty: result.fixtureSchedule.floorTrap,   code: 'IS 1543:2010',  note: 'Anti-siphon — minimum 50mm seal depth' },
          { name: 'P-trap / bottle trap',       qty: result.fixtureSchedule.pTrap,       code: 'IS 1742:1983',  note: 'Anti-siphon mandatory — IS 1742:1983 Cl 8' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk }}>{row.name}</Text>
            <Text style={{ width: 40, fontFamily: 'IBMPlexMono', fontSize: 9, fontWeight: 700, color: T.blueprint, textAlign: 'right' }}>{row.qty}</Text>
            <Text style={{ flex: 1.5, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>{row.code}</Text>
            <Text style={{ flex: 1.5, fontFamily: 'IBMPlexSans', fontSize: 8, color: T.inkA60 }}>{row.note}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', paddingVertical: 5, borderTopWidth: 2, borderTopColor: T.ironInk }}>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 9, fontWeight: 600, color: T.ironInk }}>Total Fixtures</Text>
          <Text style={{ width: 40, fontFamily: 'IBMPlexMono', fontSize: 12, fontWeight: 700, color: T.blueprint, textAlign: 'right' }}>
            {result.fixtureSchedule.totalFixtures}
          </Text>
          <Text style={{ flex: 1.5 }} />
          <Text style={{ flex: 1.5, fontFamily: 'IBMPlexSans', fontSize: 8, color: T.inkA60 }}>Sanitary fitter: 3–4/day</Text>
        </View>

        <SectionEyebrow>VALVES + ACCESSORIES</SectionEyebrow>
        <View style={{ flexDirection: 'row', ...S.tableHeader }}>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>ITEM</Text>
          <Text style={{ width: 40, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>QTY</Text>
          <Text style={{ flex: 1.5, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>NOTE</Text>
        </View>
        {[
          { item: 'Ball valve 25mm (IS 778)',       qty: result.fixtureSchedule.ewcPan * 2 + 1, note: 'Bathroom inlets + main' },
          { item: 'Gate valve 40mm — main line',    qty: 3,  note: 'Sump inlet, pump outlet, OHT outlet' },
          { item: 'Float valve (OHT)',              qty: 1,  note: 'Automatic fill cutoff' },
          { item: 'Water meter',                   qty: 1,  note: 'Municipal connection requirement' },
          { item: 'PRV (pressure reducing valve)', qty: result.fixtureSchedule.ewcPan > 2 ? 1 : 0, note: 'Required for buildings >2 floors' },
        ].filter(r => r.qty > 0).map((row, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk }}>{row.item}</Text>
            <Text style={{ width: 40, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{row.qty}</Text>
            <Text style={{ flex: 1.5, fontFamily: 'IBMPlexSans', fontSize: 8, color: T.inkA60 }}>{row.note}</Text>
          </View>
        ))}

        <View style={{ borderWidth: 1, borderColor: T.stampOxide, backgroundColor: T.oxideBg, padding: 8, marginTop: 12 }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.stampOxide, marginBottom: 3 }}>IMPORTANT — FIXTURES NOT INCLUDED IN COST ESTIMATE</Text>
          <Text style={[S.body, { fontSize: 8 }]}>
            This pipe schedule covers plumbing roughwork only (pipes, fittings, valves, traps, tanks, pump).
            Sanitary fixtures (WC pans, wash basins, kitchen sinks, shower sets, taps) are owner-supplied in most
            residential contracts. If a contractor quotes fixtures, verify unit rates match market prices.
            Do not let a contractor charge for fixtures you will supply separately.
          </Text>
        </View>
      </View>
    </Page>
  )
}

// ─── PAGE 8: SITE QUALITY CONTROL CHECKLIST (SECOND-TO-LAST) ─────────────────

function QualityChecklistPage() {
  const checks = [
    {
      item: 'Licensed plumber mandatory',
      detail: 'Verify plumber holds a valid municipal authority license before starting work. NBC 2016 Part 9. Unlicensed work is a safety defect and may void insurance.',
      critical: true,
    },
    {
      item: 'Flush test all drainage before backfill',
      detail: 'Run water through all drainage pipes simultaneously and inspect every joint for leaks before covering. IS 1742:1983 Cl 14: All drainage systems must be tested before backfilling trenches.',
      critical: true,
    },
    {
      item: 'Slope minimum 1:48 for 75mm waste pipes, 1:80 for 110mm soil stack (IS 1742:1983)',
      detail: 'Use a spirit level and tape to verify slope at every pipe run. Flatter slopes accumulate grease and solids within 2 years. Steeper than 1:48 causes self-siphoning and trap failure on 75mm pipes.',
      critical: true,
    },
    {
      item: 'Hydraulic pressure test at 1.5× working pressure for 1 hour before closing walls',
      detail: 'IS 1742:1983 Cl 14: Supply pipes must be tested at 1.5× working pressure (minimum 9 bar for 6-bar supply) for 1 hour. A 10-minute test is insufficient — micro-leaks at CPVC joints only manifest under sustained pressure.',
      critical: true,
    },
    {
      item: 'All CPVC joints — solvent cement both surfaces, hold 30 seconds minimum',
      detail: 'IS 15778:2007: Apply approved solvent cement (matching CPVC grade) to both the pipe end and the fitting socket. Hold firmly for 30 seconds minimum. Never dry-fit a joint. Solvent cement joint strength peaks at 48 hours — do not pressure test within 24 hours of joining.',
      critical: true,
    },
    {
      item: 'Tank must be food-grade HDPE, covered, insect-proof (IS 12701)',
      detail: 'IS 12701: All domestic water storage tanks must bear ISI mark per IS 12701 — food-grade HDPE, UV-stabilised, opaque (prevents algae), covered with a secured lid, and insect-proof. Open-top tanks breed mosquitoes and contaminate water.',
      critical: false,
    },
    {
      item: 'Earth all metallic pipes',
      detail: 'IS 3043:2018: All metallic pipe runs, flanges, clamps, and equipment must be bonded to the building earth system. This prevents galvanic corrosion and eliminates electrical hazard from pipe-borne stray current.',
      critical: false,
    },
    {
      item: 'Anti-siphon traps mandatory on all fixtures',
      detail: 'IS 1742:1983 Cl 8: All sanitary fixtures must have P-traps, S-traps, or bottle traps with minimum 50mm water seal depth. Dry traps allow sewer gases (H₂S, methane) into living areas — a serious health and fire hazard.',
      critical: true,
    },
    {
      item: 'Clean-out access every 3m on soil stack (IS 1742:1983)',
      detail: 'IS 1742:1983 Cl 10: Cleanout access points must be provided at every 3m interval on the soil stack, at every change of direction, and at the base of the stack. Without cleanouts, future blockage clearance requires breaking walls.',
      critical: false,
    },
    {
      item: 'Never use GI pipes for new construction — corrosion within 10 years',
      detail: 'Galvanised iron (GI) pipes corrode internally in Indian urban water conditions (chlorinated + hard water) within 8–12 years. Internal rust deposits reduce flow, contaminate water, and eventually cause pipe failure. All new construction must use CPVC (supply), SWR/uPVC (drainage), or stainless steel where required.',
      critical: true,
    },
  ]

  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={9} total={10} title="Site Quality Control Checklist — Plumbing" />
        <PageRule />

        <Text style={[S.body, { fontSize: 8, marginBottom: 8, color: T.inkA60 }]}>
          Reference: IS 1172:1993 · IS 1742:1983 · IS 12701 · IS 15778:2007 · IS 3043:2018 · NBC 2016 Part 9
        </Text>

        {checks.map((check, i) => (
          <View key={i} style={{
            marginBottom: 7,
            padding: 8,
            borderLeftWidth: 3,
            borderLeftColor: check.critical ? T.stampOxide : T.blueprint,
            borderWidth: 1,
            borderColor: check.critical ? T.stampOxide + '33' : T.blueprint + '22',
            backgroundColor: check.critical ? T.oxideBg : T.blueprintBg + '55',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3 }}>
              <View style={{
                marginRight: 6, marginTop: 1,
                borderWidth: 1,
                borderColor: check.critical ? T.stampOxide : T.blueprint,
                paddingHorizontal: 4, paddingVertical: 1,
              }}>
                <Text style={{
                  fontFamily: 'IBMPlexMono', fontSize: 6,
                  color: check.critical ? T.stampOxide : T.blueprint,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </Text>
              </View>
              <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 9, fontWeight: 600, color: T.ironInk, flex: 1 }}>
                {check.item}
              </Text>
              {check.critical && (
                <View style={{ marginLeft: 4, borderWidth: 1, borderColor: T.stampOxide, borderStyle: 'solid', paddingHorizontal: 3, paddingVertical: 1 }}>
                  <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, color: T.stampOxide }}>CRITICAL</Text>
                </View>
              )}
            </View>
            <Text style={[S.body, { fontSize: 7.5, color: T.inkA60, marginLeft: 26 }]}>
              {check.detail}
            </Text>
          </View>
        ))}

        <View style={{ borderWidth: 1, borderColor: T.ironInk, padding: 8, marginTop: 4 }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.ironInk, marginBottom: 3 }}>
            SITE INSPECTION RECORD
          </Text>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            {['Plumber License No.', 'Pressure Test Date', 'Test Pressure (bar)', 'Inspector Signature'].map(label => (
              <View key={label} style={{ flex: 1 }}>
                <Text style={S.monoSm}>{label.toUpperCase()}</Text>
                <View style={{ borderBottomWidth: 1, borderBottomColor: T.inkA35, height: 18, marginTop: 4 }} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </Page>
  )
}

// ─── PAGE 9: COST SUMMARY + INTERIORPRO CROSS-SELL (LAST) ────────────────────

function CostSummaryPage({ result, reportId }: { result: PlumbResult; reportId: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.nirmanshastra.in'
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={10} total={10} title="Cost Summary + InteriorPro Cross-sell" />
        <PageRule />

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

        <View style={{ flexDirection: 'row', ...S.tableHeader }}>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>COMPONENT</Text>
          <Text style={{ width: 90, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>STANDARD (₹)</Text>
        </View>
        {[
          { label: 'CPVC pipes (25mm + 32mm supply)',                   cost: result.costs.cpvcPipeMaterial },
          { label: 'SWR pipes (75mm waste + 110mm soil stack)',         cost: result.costs.swrPipeMaterial  },
          { label: 'uPVC 110mm underground drainage',                   cost: result.costs.upvcPipeMaterial },
          { label: 'Fittings — 35% allowance (elbows, tees, couplers)',cost: result.costs.fittingsMaterial },
          { label: 'Valves, traps, water meter, PRV',                  cost: result.costs.valvesMaterial   },
          { label: `Tanks — OHT + sump (IS 12701 HDPE)`,              cost: result.costs.tanksMaterial    },
          { label: `Pump — ${result.waterDemand.pumpHPStandard}`,      cost: result.costs.pumpMaterial     },
          { label: 'Labour — CPWD (plumber + helper + fitter + test)', cost: result.labourCost             },
          { label: 'Contractor overhead + margin (10%)',               cost: result.overheadCost           },
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

        {/* InteriorPro cross-sell */}
        <View style={{ marginTop: 14, borderWidth: 2, borderColor: T.ironInk, padding: 12, backgroundColor: T.sheetWhite }}>
          <Text style={[S.eyebrow, { color: T.blueprint, marginBottom: 4 }]}>PHASE 5 — INTERIORPRO · ₹899</Text>
          <Text style={[S.h2, { fontSize: 13, marginBottom: 4 }]}>Plumbing is done. Time to estimate your interior fit-out.</Text>
          <Text style={[S.body, { marginBottom: 8 }]}>
            Interior work starts after plumbing inspection sign-off. Use InteriorPro to estimate flooring,
            kitchen, false ceiling, paint, and doors — with grade comparisons across Basic, Standard, Premium, and Luxury.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {[
              'IS code flooring schedule', 'Kitchen running-foot estimate', 'Grade × grade comparison',
              'False ceiling + carpentry', 'CPWD paint quantities', '8-page PDF + room layout',
            ].map(f => (
              <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.approvedGreen }}>✓</Text>
                <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8, color: T.inkA60 }}>{f}</Text>
              </View>
            ))}
          </View>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 9, color: T.blueprint }}>
            {appUrl}/tools/interiorpro → ₹899
          </Text>
        </View>

        <Text style={[S.monoSm, { textAlign: 'center', marginTop: 10, lineHeight: 1.6 }]}>
          Report {reportId} · IS 1172:1993 · IS 1742:1983 · IS 12701 · IS 15778:2007 · NBC 2016{'\n'}
          This report is for estimation purposes only. Quantities computed using IS-code thumb rules.{'\n'}
          Actual quantities will vary with site conditions. Consult a licensed plumbing engineer for design drawings.
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

        <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 4, marginTop: 4 }}>WATER DEMAND (IS 1172:1993)</Text>
        {[
          'Residential municipal supply: 135 LPCD minimum',
          'Residential borewell supply: 150 LPCD minimum',
          'Overhead tank capacity: daily demand × 0.67',
          'Sump tank capacity: daily demand × 0.33 (recommended)',
          'Formula: tank litres = occupants × LPCD × 0.67',
        ].map((t, i) => (
          <Text key={i} style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, lineHeight: 1.5, marginBottom: 2 }}>• {t}</Text>
        ))}

        <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 4, marginTop: 10 }}>DRAINAGE DESIGN (IS 1742:1983)</Text>
        {[
          'Soil stack minimum diameter: 110mm SWR',
          'Waste pipe minimum diameter: 75mm SWR',
          'Minimum slope 75mm pipe: 1:48 (2.08%)',
          'Minimum slope 110mm stack: 1:80 (1.25%)',
          'Trap seal minimum: 50mm water seal',
          'Vent pipe: mandatory for stacks above 2 floors',
        ].map((t, i) => (
          <Text key={i} style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, lineHeight: 1.5, marginBottom: 2 }}>• {t}</Text>
        ))}

        <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 4, marginTop: 10 }}>PIPE SIZING</Text>
        {[
          'Supply pipe sizing based on fixture units per IS 2065:1983',
          'Minimum supply pipe to fixture: 15mm CPVC',
          'Main riser: sized per total fixture units served',
        ].map((t, i) => (
          <Text key={i} style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, lineHeight: 1.5, marginBottom: 2 }}>• {t}</Text>
        ))}

        <View style={{ marginTop: 12, borderTopWidth: 0.5, borderTopColor: T.inkA15, borderTopStyle: 'solid', paddingTop: 8 }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 6 }}>IS CODES USED</Text>
          {[
            'IS 1172:1993 — Basic Requirements for Water Supply, Drainage and Sanitation',
            'IS 1742:1983 — Code of Practice for Building Drainage',
            'IS 2065:1983 — Code of Practice for Water Supply in Buildings',
            'IS 15778 — CPVC Pipes and Fittings',
            'IS 12701 — Polyethylene Tanks for Water Storage',
          ].map((t, i) => (
            <Text key={i} style={{ fontFamily: 'IBMPlexMono', fontSize: 7.5, color: T.inkA60, lineHeight: 1.6, marginBottom: 1 }}>{t}</Text>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ marginTop: 8, borderTopWidth: 0.5, borderTopColor: T.inkA15, borderTopStyle: 'solid', paddingTop: 6 }}>
          <Text style={S.monoSm}>NIRMANSHASTRA · PLUMBPRO · {reportId}</Text>
        </View>
      </View>
    </Page>
  )
}

// ─── Plumbing Riser Schematic Page ───────────────────────────────────────────

function PlumbingRiserSchematicPage({ input, result, reportId }: { input: PlumbInput; result: PlumbResult; reportId: string }) {
  const ohtL = result.waterDemand.ohtL
  const floors = input.numFloors ?? 2
  const floorYPositions = [80, 145, 210].slice(0, Math.min(floors + 1, 3))
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <View>
            <Text style={S.eyebrow}>NIRMANSHASTRA · PLUMBPRO · IS 1172:1993 · IS 1742:1983</Text>
            <Text style={S.h2}>Plumbing Riser Diagram — Schematic</Text>
          </View>
          <View style={{ borderWidth: 1, borderColor: T.inkA35, borderStyle: 'solid', padding: 5 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, color: T.inkA60 }}>NOT FOR CONSTRUCTION</Text>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, color: T.inkA60 }}>LICENSED PLUMBER REQUIRED</Text>
          </View>
        </View>
        <View style={S.rule} />

        <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6.5, color: T.blueprint, letterSpacing: 1, marginBottom: 6 }}>
          COMBINED SUPPLY & DRAINAGE RISER — SCHEMATIC
        </Text>
        <Svg viewBox="0 0 440 380" style={{ width: 396, height: 342 }}>
          {/* OVERHEAD TANK */}
          <Rect x={120} y={10} width={100} height={28} fill={T.blueprintBg} stroke={T.blueprint} strokeWidth={1.2} />
          <Text x={125} y={24} style={{ fontFamily: 'IBMPlexMono', fontSize: 6.5, fill: T.blueprint }}>HDPE TANK</Text>
          <Text x={125} y={33} style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, fill: T.inkA60 }}>{ohtL}L — IS 12701</Text>

          {/* Supply riser (main vertical — 32mm CPVC) */}
          <Line x1={170} y1={38} x2={170} y2={285} strokeWidth={2} stroke={T.ironInk} />
          <Text x={172} y={280} style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }}>32mm CPVC</Text>

          {/* Floor branches (supply) */}
          {floorYPositions.map((y, i) => (
            <React.Fragment key={`fl-${i}`}>
              <Line x1={170} y1={y} x2={270} y2={y} strokeWidth={1.2} stroke={T.blueprint} />
              <Text x={275} y={y + 4} style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, fill: T.blueprint }}>
                {i === 0 ? 'Ground Fl.' : `Floor ${i}`} — Cold Supply — 20mm CPVC
              </Text>
            </React.Fragment>
          ))}

          {/* Drainage stack (110mm SWR) */}
          <Line x1={90} y1={38} x2={90} y2={320} strokeWidth={2} stroke={T.ironInk} strokeDasharray="6,3" />
          <Text x={50} y={180} style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, fill: T.inkA60 }}>110mm</Text>
          <Text x={50} y={188} style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, fill: T.inkA60 }}>SWR Stack</Text>
          <Text x={50} y={196} style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.inkA60 }}>1:80 slope</Text>

          {/* Floor drain connections to drainage stack */}
          {floorYPositions.map((y, i) => (
            <React.Fragment key={`dr-${i}`}>
              <Line x1={90} y1={y + 10} x2={140} y2={y + 10} strokeWidth={0.8} stroke={T.inkA60} strokeDasharray="3,3" />
            </React.Fragment>
          ))}

          {/* SUMP */}
          <Rect x={70} y={320} width={100} height={28} fill="none" stroke={T.ironInk} strokeWidth={1.2} />
          <Text x={80} y={335} style={{ fontFamily: 'IBMPlexMono', fontSize: 6.5, fill: T.ironInk }}>SUMP TANK</Text>
          <Text x={80} y={344} style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, fill: T.inkA60 }}>IS 12701 HDPE</Text>

          {/* Pump (circle P between sump and OHT) */}
          <Circle cx={170} cy={310} r={12} fill={T.sheetWhite} stroke={T.ironInk} strokeWidth={1} />
          <Text x={164} y={314} style={{ fontFamily: 'IBMPlexMono', fontSize: 7.5, fill: T.ironInk }}>P</Text>
          <Line x1={120} y1={320} x2={158} y2={316} strokeWidth={1} stroke={T.ironInk} />
          <Line x1={170} y1={298} x2={170} y2={285} strokeWidth={1.5} stroke={T.ironInk} />
          <Text x={185} y={314} style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, fill: T.inkA60 }}>{result.waterDemand.pumpHPStandard}</Text>

          {/* Earth / IS codes at bottom */}
          <Text x={10} y={368} style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, fill: T.inkA60 }}>
            IS 1172:1993 Water Demand · IS 1742:1983 Drainage · IS 15778:2007 CPVC · IS 12701 HDPE Tank
          </Text>
        </Svg>

        {/* Disclaimer */}
        <View style={{ marginTop: 10, borderWidth: 1, borderColor: T.stampOxide, borderStyle: 'solid', padding: 7, backgroundColor: T.oxideBg }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6.5, color: T.stampOxide, letterSpacing: 0.5, marginBottom: 3 }}>
            DISCLAIMER — SCHEMATIC ONLY
          </Text>
          <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 7.5, color: T.ironInk, lineHeight: 1.5 }}>
            Schematic only. Actual drawings must be prepared by a licensed plumbing engineer with site-specific pipe sizing and drainage slope calculations per IS 1172:1993 and IS 1742:1983.
          </Text>
        </View>

        <View style={{ flex: 1 }} />
        <View style={{ marginTop: 8, borderTopWidth: 0.5, borderTopColor: T.inkA35, borderTopStyle: 'solid', paddingTop: 6 }}>
          <Text style={S.monoSm}>NIRMANSHASTRA · PLUMBPRO · {reportId} · SCHEMATIC</Text>
        </View>
      </View>
    </Page>
  )
}

// ─── DOCUMENT EXPORT ──────────────────────────────────────────────────────────

export default function PlumbProPDF(props: Props) {
  return (
    <Document title={`PlumbingPro Report — ${props.reportId}`} author="NirmanShastra">
      <CoverPage {...props} />
      <WaterDemandPage    input={props.input} result={props.result} />
      <ISCodeChecklistPage {...props} />
      <WaterSupplyRiserPage input={props.input} result={props.result} />
      <DrainageLayoutPage input={props.input} result={props.result} />
      <TankPumpPage       input={props.input} result={props.result} />
      <PipeSchedulePage   result={props.result} />
      <FixtureSchedulePage result={props.result} />
      <QualityChecklistPage />
      <CostSummaryPage    result={props.result} reportId={props.reportId} />
      <PlumbingRiserSchematicPage input={props.input} result={props.result} reportId={props.reportId} />
      <EngineeringMethodPage reportId={props.reportId} />
    </Document>
  )
}
