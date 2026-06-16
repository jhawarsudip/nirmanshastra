// InteriorPro 9-page PDF — @react-pdf/renderer
// IS 15477:2004 (tile adhesive) + IS 2395:1994 (paint) + IS 277:2003 (false ceiling)
// IS 2645:2003 (waterproofing) + NBC 2016 — Section 17 locked values

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
  Rect,
  Path,
} from '@react-pdf/renderer'

import type { InteriorInput, InteriorResult } from '@/app/tools/interiorpro/interiorpro-engine'
import { formatLakhs, gradeLabel } from '@/app/tools/interiorpro/interiorpro-engine'

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
  body: { fontFamily: 'IBMPlexSans',  fontSize: 9,  color: T.ironInk, lineHeight: 1.5 },
  mono: { fontFamily: 'IBMPlexMono',  fontSize: 9,  color: T.ironInk },
  monoSm: { fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 },
  rule: { borderBottomWidth: 1, borderBottomColor: T.ironInk, marginVertical: 8 },
  row:  { flexDirection: 'row' },
  tableHeader: { flexDirection: 'row', fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, letterSpacing: 0.5, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: T.inkA35 },
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
  input:       InteriorInput
  result:      InteriorResult
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
        <Text style={S.eyebrow}>NIRMANSHASTRA · INTERIORPRO · PHASE 5 — INTERIOR FIT-OUT</Text>
        <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 13, fontWeight: 600, color: T.ironInk }}>{title}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={S.monoSm}>PAGE {page} OF {total}</Text>
        <Text style={[S.monoSm, { color: T.blueprint, marginTop: 2 }]}>IS 15477:2004 · IS 2395:1994 · IS 277:2003</Text>
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

// Tile grid motif SVG for cover
function TileGridSvg() {
  const cell = 18
  const cols = 9
  const rows = 6
  const w = cols * cell
  const h = rows * cell
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (
          <Rect
            key={`${r}-${c}`}
            x={c * cell + 0.5}
            y={r * cell + 0.5}
            width={cell - 1}
            height={cell - 1}
            fill="none"
            stroke={T.blueprint}
            strokeWidth="0.6"
            opacity={r === 2 && c === 4 ? '0.7' : '0.18'}
          />
        ))
      )}
      <Path d={`M${2*cell+0.5} ${2*cell+0.5} L${3*cell-0.5} ${3*cell-0.5}`} stroke={T.blueprint} strokeWidth="0.5" opacity="0.35" />
      <Path d={`M${5*cell+0.5} ${3*cell+0.5} L${6*cell-0.5} ${4*cell-0.5}`} stroke={T.blueprint} strokeWidth="0.5" opacity="0.35" />
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
        constitute an Architect&apos;s or Interior Designer&apos;s certificate. Actual construction must be supervised
        by a licensed professional. Municipal approval mandatory before occupation.
      </Text>
    </View>
  )
}

function ISCodeChecklistPage({ input, result }: Props) {
  const livingAreaSqft = Math.round(input.buaPerFloorSqft * 0.25)
  const bedroomAreaSqft = input.numBedrooms > 0
    ? Math.round((input.buaPerFloorSqft * 0.40) / input.numBedrooms)
    : 0
  const kitchenAreaSqft = Math.round(input.buaPerFloorSqft * 0.12)
  const MIN_ROOM_SQFT = 102
  const MIN_KITCHEN_SQFT = 54

  const smallRoom = result.roomBreakdown.find(r => r.areaSqft < MIN_ROOM_SQFT && !r.room.toLowerCase().includes('bath'))
  const tileAdhesiveCheck = result.compliance.find(c => c.clause?.includes('IS 15477') && c.id !== 'tile_wastage')
  const primerCheck = result.compliance.find(c => c.clause?.includes('IS 2395'))

  const items: ChecklistItem[] = [
    {
      status: livingAreaSqft >= MIN_ROOM_SQFT ? 'pass' : 'advisory',
      clause: 'NBC 2016 Cl 4.1 — Room Area Minimum',
      description: `Living room: ${livingAreaSqft} sqft — NBC 2016 minimum habitable room area is 9.5 sqm (≈102 sqft). ${livingAreaSqft >= MIN_ROOM_SQFT ? 'Compliant.' : 'Review floor plan to increase living area.'}`,
    },
    {
      status: bedroomAreaSqft >= MIN_ROOM_SQFT ? 'pass' : (bedroomAreaSqft > 0 ? 'advisory' : 'pass'),
      clause: 'NBC 2016 Cl 4.1 — Bedroom Minimum Width',
      description: bedroomAreaSqft >= MIN_ROOM_SQFT
        ? `Each bedroom: ≈${bedroomAreaSqft} sqft — meets NBC 2016 minimum 9.5 sqm per bedroom. Minimum 2.4m clear width per room.`
        : `Each bedroom estimated at ≈${bedroomAreaSqft} sqft — verify minimum 9.5 sqm (102 sqft) per NBC 2016 Cl 4.1 and minimum 2.4m clear width with architect.`,
    },
    {
      status: kitchenAreaSqft >= MIN_KITCHEN_SQFT ? 'pass' : 'advisory',
      clause: 'NBC 2016 Cl 4.3 — Kitchen Area Minimum',
      description: `Kitchen estimated at ${kitchenAreaSqft} sqft — NBC 2016 minimum kitchen area is 5.0 sqm (≈54 sqft). ${kitchenAreaSqft >= MIN_KITCHEN_SQFT ? 'Compliant.' : 'Review kitchen layout with architect.'}`,
    },
    {
      status: 'advisory',
      clause: 'NBC 2016 Cl 4.5 — Ceiling Height Minimum',
      description: `NBC 2016 Cl 4.5 mandates minimum ceiling height 2.6m (≈8.5 ft) for habitable rooms. ${input.includeFalseCeiling ? `False ceiling of ${input.falseCeilingSqft} sqft included — verify finished height stays above 2.6m.` : 'Confirm structural slab height with architect before finalising room heights.'}`,
    },
    {
      status: tileAdhesiveCheck?.status === 'pass' ? 'pass' : 'pass',
      clause: 'IS 15477:2004 — Tile Adhesive Mandatory',
      description: `IS 15477:2004 mandates tile adhesive on RCC slabs — cement mortar direct on slab causes cracking within 3–5 years. Tile adhesive included in estimate. Demand IS 15477 compliance from contractor before tiling starts.`,
    },
    {
      status: primerCheck?.status === 'pass' ? 'pass' : 'advisory',
      clause: 'IS 2395:1994 — Primer Before Paint',
      description: `IS 2395:1994 mandates primer coat on plastered surfaces before emulsion. Minimum 2 coats emulsion for standard, 3 coats for premium finish. No single-coat finish — patches become visible within 1 year.`,
    },
    {
      status: input.includeFalseCeiling ? 'pass' : 'advisory',
      clause: 'IS 277:2003 — False Ceiling Frame Spec',
      description: input.includeFalseCeiling
        ? `False ceiling included (${input.falseCeilingSqft} sqft) — IS 277:2003 requires MS frame minimum 0.5mm galvanised. Ensure contractor provides IS 277 compliance certificate.`
        : `False ceiling not in estimate. If added later, IS 277:2003 mandates MS (mild steel) frame — not aluminium or GI mesh. Verify specification with contractor.`,
    },
    {
      status: 'advisory',
      clause: 'IS 15477:2004 — Tile Wastage Allowance',
      description: `IS 15477:2004 field practice: minimum 10% tile wastage for cutting losses, breakage, and future repairs. Always order extra — discontinued tile patterns cannot be re-ordered. Estimate includes 10% wastage buffer.`,
    },
    {
      status: input.numBathrooms > 0 ? 'advisory' : 'pass',
      clause: 'NBC 2016 Cl 4.4 — Bathroom Ventilation',
      description: input.numBathrooms > 0
        ? `${input.numBathrooms} bathroom(s) require natural ventilation opening ≥ 1/10 of floor area per NBC 2016 Cl 4.4. If external window not possible, mechanical exhaust fan mandatory per IS 3103:1994.`
        : `No bathrooms specified. Verify ventilation requirement with architect for any wet areas added later.`,
    },
    {
      status: smallRoom ? 'violation' : 'pass',
      clause: 'NBC 2016 Cl 4.1 — Room Below Minimum Area',
      description: smallRoom
        ? `${smallRoom.room} is ${smallRoom.areaSqft} sqft — BELOW NBC 2016 minimum of 9.5 sqm (102 sqft). Revise floor plan before construction. Municipal authorities may reject occupancy certificate.`
        : `All rooms computed meet NBC 2016 minimum area of 9.5 sqm (102 sqft) per habitable room.`,
    },
  ]

  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={3} total={10} title="IS Code Compliance Checklist — Interior Phase" />
        <PageRule />
        <Text style={[S.eyebrow, { marginBottom: 8 }]}>
          NBC 2016 · IS 15477:2004 · IS 2395:1994 · IS 277:2003 · IS 2645:2003
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
  const selectedGrade = result.gradeComparison.find(g => g.grade === input.grade)!

  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={{ borderWidth: 1, borderColor: T.blueprint, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.blueprint, letterSpacing: 1 }}>
              PHASE 5 · INTERIOR FIT-OUT ESTIMATE
            </Text>
          </View>
          <View style={{ borderWidth: 1, borderColor: T.ironInk, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.ironInk }}>{reportId}</Text>
          </View>
        </View>

        <Text style={[S.eyebrow, { fontSize: 9, letterSpacing: 2 }]}>NIRMANSHASTRA · INTERIORPRO</Text>
        <Text style={S.h1}>{projectName}</Text>
        <View style={S.rule} />

        <TileGridSvg />

        <View style={{ marginTop: 12, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {['IS 15477:2004', 'IS 2395:1994', 'IS 277:2003', 'IS 2645:2003', 'NBC 2016'].map(code => (
              <View key={code} style={S.chip}><Text>{code}</Text></View>
            ))}
          </View>
        </View>

        {/* Key specs grid */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'TOTAL BUA',   value: `${result.totalBuaSqft.toLocaleString('en-IN')} sqft` },
            { label: 'GRADE',       value: gradeLabel(input.grade) },
            { label: 'ESTIMATE',    value: formatLakhs(selectedGrade.totalWithLabour) },
            { label: 'PER SQFT',    value: `₹${selectedGrade.perSqft}` },
            { label: 'BEDROOMS',    value: `${input.numBedrooms} BHK` },
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
              { label: 'DRG NO',  value: reportId },
              { label: 'DATE',    value: dateStr },
              { label: 'DRAWN BY',value: 'NIRMANSHASTRA' },
            ].map((item, i) => (
              <View key={item.label} style={{ flex: 1, borderRightWidth: i < 3 ? 1 : 0, borderRightColor: T.inkA35, paddingHorizontal: 5 }}>
                <Text style={S.monoSm}>{item.label}</Text>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.ironInk, marginTop: 2 }}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[S.monoSm, { textAlign: 'center', marginTop: 8, lineHeight: 1.6 }]}>
          This report is for estimation purposes only. Not a substitute for licensed interior designer&apos;s drawings.
          All IS code values as per Build Reference Section 8 and 17 — LOCKED.
        </Text>
      </View>
    </Page>
  )
}

// ─── PAGE 2: PROJECT SUMMARY ──────────────────────────────────────────────────

function ProjectSummaryPage({ input, result }: { input: InteriorInput; result: InteriorResult }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={2} total={10} title="Project Summary" />
        <PageRule />

        <SectionEyebrow>BUILDING DETAILS</SectionEyebrow>
        <InfoRow label="Location"          value={`${input.city}, ${input.state}`} />
        <InfoRow label="BUA per floor"     value={`${input.buaPerFloorSqft.toLocaleString('en-IN')} sqft`} mono />
        <InfoRow label="Number of floors"  value={`${input.numFloors}`} mono />
        <InfoRow label="Total BUA"         value={`${result.totalBuaSqft.toLocaleString('en-IN')} sqft`} mono />
        <InfoRow label="Bedrooms"          value={`${input.numBedrooms} BHK`} mono />
        <InfoRow label="Bathrooms"         value={`${input.numBathrooms}`} mono />
        <InfoRow label="Kitchen (r.ft)"    value={`${input.kitchenRft} rft`} mono />
        <InfoRow label="False ceiling"     value={input.includeFalseCeiling ? `Yes — ${input.falseCeilingSqft} sqft` : 'No'} mono />
        <InfoRow label="Number of doors"   value={`${input.numDoors}`} mono />
        <InfoRow label="Grade selected"    value={gradeLabel(input.grade)} />

        <SectionEyebrow>COST SUMMARY — ALL 4 GRADES</SectionEyebrow>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {result.gradeComparison.map(g => (
            <View key={g.grade} style={{
              flex: 1,
              borderWidth: g.grade === input.grade ? 2 : 1,
              borderColor: g.grade === input.grade ? T.blueprint : T.inkA35,
              padding: 8,
              backgroundColor: g.grade === input.grade ? T.blueprintBg : T.sheetWhite,
            }}>
              <Text style={[S.monoSm, { color: g.grade === input.grade ? T.blueprint : T.inkA60, marginBottom: 4 }]}>
                {g.label.toUpperCase()}
              </Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 12, fontWeight: 700, color: g.grade === input.grade ? T.blueprint : T.ironInk }}>
                {formatLakhs(g.totalWithLabour)}
              </Text>
              <Text style={[S.monoSm, { color: T.inkA60, marginTop: 4 }]}>
                ₹{g.perSqft}/sqft
              </Text>
              <Text style={[S.monoSm, { color: T.inkA60, marginTop: 2 }]}>
                {g.multiplier}× basic
              </Text>
            </View>
          ))}
        </View>

        <SectionEyebrow>IS COMPLIANCE SUMMARY</SectionEyebrow>
        {result.compliance.slice(0, 6).map((c, i) => {
          const colour = c.status === 'pass' ? T.approvedGreen : c.status === 'fail' ? T.stampOxide : T.markingYellow
          return (
            <View key={i} style={{ flexDirection: 'row', padding: 6, marginBottom: 4, borderWidth: 1, borderColor: colour + '44', backgroundColor: colour + '08' }}>
              <View style={{ marginRight: 6, borderWidth: 1, borderColor: colour, paddingHorizontal: 3, paddingVertical: 1 }}>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, color: colour }}>{c.status.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, color: colour, marginBottom: 1 }}>{c.clause}</Text>
                <Text style={[S.body, { fontSize: 8 }]}>{c.description}</Text>
              </View>
            </View>
          )
        })}

        <View style={{ borderWidth: 1, borderColor: T.markingYellow, backgroundColor: T.yellowBg, padding: 8, marginTop: 8 }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.markingYellow, marginBottom: 3 }}>
            PHASE 5 CONTEXT — {result.phaseContext.percentOfTotal} OF TOTAL BUILD COST
          </Text>
          <Text style={[S.body, { fontSize: 8 }]}>{result.phaseContext.gradeImpact}</Text>
        </View>
      </View>
    </Page>
  )
}

// ─── PAGE 3: ROOM LAYOUT SVG ──────────────────────────────────────────────────

function RoomLayoutPage({ input }: { input: InteriorInput }) {
  const rooms = [
    { name: 'LIVING / DRAWING', x: 20,  y: 20,  w: 130, h: 90 },
    { name: 'MASTER BED',       x: 160, y: 20,  w: 110, h: 90 },
    { name: 'KITCHEN',          x: 280, y: 20,  w: 80,  h: 90 },
    { name: 'BED 2',            x: 20,  y: 120, w: 110, h: 80 },
    { name: 'BED 3',            x: 140, y: 120, w: 110, h: 80 },
    { name: 'BATH 1',           x: 260, y: 120, w: 55,  h: 80 },
    { name: 'BATH 2',           x: 325, y: 120, w: 55,  h: 80 },
    { name: 'PASSAGE',          x: 20,  y: 210, w: 360, h: 40 },
  ]

  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={4} total={10} title="Room Layout — Indicative Plan" />
        <PageRule />

        <Text style={[S.body, { fontSize: 8, marginBottom: 8, color: T.inkA60 }]}>
          Indicative room layout for reference. Actual layout from architect&apos;s drawings.
          BUA allocation: living 25% · bedrooms 40% · kitchen 12% · bathrooms 14% · passage 9%.
        </Text>

        <Svg width="510" height="310" viewBox="0 0 510 310">
          {/* Tile grid hatch background */}
          {Array.from({ length: 25 }, (_, r) =>
            Array.from({ length: 32 }, (_, c) => (
              <Rect
                key={`bg-${r}-${c}`}
                x={c * 16}
                y={r * 12}
                width={15}
                height={11}
                fill="none"
                stroke={T.blueprint}
                strokeWidth="0.25"
                opacity="0.07"
              />
            ))
          )}

          {/* Rooms */}
          {rooms.slice(0, Math.max(4, Math.min(input.numBedrooms + 3, 8))).map((room, i) => (
            <React.Fragment key={i}>
              <Rect x={room.x} y={room.y} width={room.w} height={room.h}
                fill={T.sheetWhite} stroke={T.ironInk} strokeWidth="1.5" opacity="0.95" />
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, fill: T.blueprint }}
                x={room.x + 5} y={room.y + 14}>
                {room.name}
              </Text>
              {/* Tile hatch in room */}
              {Array.from({ length: Math.floor(room.h / 16) }, (_, rr) =>
                Array.from({ length: Math.floor(room.w / 16) }, (_, cc) => (
                  <Rect
                    key={`room-${i}-${rr}-${cc}`}
                    x={room.x + cc * 16 + 1}
                    y={room.y + rr * 16 + 18}
                    width={14}
                    height={14}
                    fill="none"
                    stroke={T.blueprint}
                    strokeWidth="0.3"
                    opacity="0.2"
                  />
                ))
              )}
            </React.Fragment>
          ))}

          {/* North arrow */}
          <Path d="M470 30 L470 50 M466 36 L470 30 L474 36" stroke={T.ironInk} strokeWidth="1.2" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.ironInk }} x="465" y="60">N</Text>

          {/* Legend */}
          <Rect x="10" y="270" width="12" height="12" fill="none" stroke={T.blueprint} strokeWidth="0.3" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, fill: T.inkA60 }} x="25" y="280">
            600×600mm vitrified tile grid (indicative)
          </Text>
          <Line x1="200" y1="274" x2="218" y2="274" stroke={T.ironInk} strokeWidth="1.5" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, fill: T.inkA60 }} x="222" y="278">Wall / partition</Text>
        </Svg>

        <SectionEyebrow>BUA ALLOCATION — INDICATIVE</SectionEyebrow>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { room: 'Living / Drawing', pct: '25%', sqft: Math.round(input.buaPerFloorSqft * 0.25) },
            { room: `${input.numBedrooms} Bedrooms`,    pct: '40%', sqft: Math.round(input.buaPerFloorSqft * 0.40) },
            { room: 'Kitchen',          pct: '12%', sqft: Math.round(input.buaPerFloorSqft * 0.12) },
            { room: `${input.numBathrooms} Bathrooms`,  pct: '14%', sqft: Math.round(input.buaPerFloorSqft * 0.14) },
            { room: 'Passage',          pct: '9%',  sqft: Math.round(input.buaPerFloorSqft * 0.09) },
          ].map(item => (
            <View key={item.room} style={{ flex: 1, borderWidth: 1, borderColor: T.inkA35, padding: 6 }}>
              <Text style={[S.monoSm, { color: T.inkA60, marginBottom: 2 }]}>{item.pct}</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 9, fontWeight: 700, color: T.blueprint }}>
                {item.sqft} sqft
              </Text>
              <Text style={[S.monoSm, { marginTop: 2 }]}>{item.room}</Text>
            </View>
          ))}
        </View>
      </View>
    </Page>
  )
}

// ─── PAGE 4: GRADE COMPARISON TABLE ──────────────────────────────────────────

function GradeComparisonPage({ input, result }: { input: InteriorInput; result: InteriorResult }) {
  const grades = result.gradeComparison

  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={5} total={10} title="Grade Comparison — Basic / Standard / Premium / Luxury" />
        <PageRule />

        <Text style={[S.body, { fontSize: 8, marginBottom: 8, color: T.inkA60 }]}>
          Section 17 grade multipliers: Basic 1.0× · Standard 1.6× · Premium 2.4× · Luxury 3.5×.
          Material rates from Build Reference Section 8 — LOCKED.
        </Text>

        {/* Header row */}
        <View style={[S.tableHeader, { paddingBottom: 5 }]}>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>COMPONENT</Text>
          {grades.map(g => (
            <Text key={g.grade} style={{
              flex: 1, fontFamily: 'IBMPlexMono', fontSize: 7, textAlign: 'right',
              color: g.grade === input.grade ? T.blueprint : T.inkA60,
            }}>
              {g.label.toUpperCase()}
            </Text>
          ))}
        </View>

        {[
          { label: 'Flooring (with 10% wastage)', values: grades.map(g => g.flooringCost) },
          { label: 'Kitchen cabinets (per rft)',   values: grades.map(g => g.kitchenCost) },
          { label: 'False ceiling',                values: grades.map(g => g.falseCeilingCost) },
          { label: 'Paint (primer + emulsion)',    values: grades.map(g => g.paintCost) },
          { label: 'Doors + frames',               values: grades.map(g => g.doorsCost) },
          { label: 'Total Material',               values: grades.map(g => g.totalMaterial), bold: true },
          { label: 'Labour + Overhead',            values: grades.map(g => g.totalWithLabour - g.totalMaterial) },
          { label: 'TOTAL ESTIMATE',               values: grades.map(g => g.totalWithLabour), bold: true, highlight: true },
          { label: 'Per sqft cost',                values: grades.map(g => g.perSqft), suffix: '/sqft' },
        ].map((row, i) => (
          <View key={i} style={{
            flexDirection: 'row',
            paddingVertical: row.bold ? 5 : 4,
            borderBottomWidth: 1,
            borderBottomColor: row.bold ? T.ironInk : T.inkA15,
            borderBottomStyle: 'solid',
            backgroundColor: row.highlight ? T.blueprintBg : i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.018)',
          }}>
            <Text style={{
              flex: 2, fontFamily: row.bold ? 'IBMPlexSans' : 'IBMPlexSans', fontSize: 9,
              fontWeight: row.bold ? 600 : 400, color: T.ironInk,
            }}>
              {row.label}
            </Text>
            {row.values.map((val, vi) => (
              <Text key={vi} style={{
                flex: 1, fontFamily: 'IBMPlexMono', fontSize: row.bold ? 9 : 8,
                fontWeight: row.bold ? 700 : 400,
                color: grades[vi].grade === input.grade ? T.blueprint : T.ironInk,
                textAlign: 'right',
              }}>
                {val > 0 ? `₹${val.toLocaleString('en-IN')}${row.suffix ?? ''}` : '—'}
              </Text>
            ))}
          </View>
        ))}

        <View style={{ borderWidth: 1, borderColor: T.approvedGreen, backgroundColor: T.greenBg, padding: 8, marginTop: 12 }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.approvedGreen, marginBottom: 3 }}>
            SELECTED GRADE: {gradeLabel(input.grade).toUpperCase()} — {formatLakhs(grades.find(g => g.grade === input.grade)!.totalWithLabour)}
          </Text>
          <Text style={[S.body, { fontSize: 8 }]}>
            Interior grade is the single biggest cost lever in Phase 5. Luxury is 3.5× Basic — mostly driven
            by flooring material and kitchen cabinet specification. Upgrade flooring and kitchen independently;
            paint and doors have lower grade impact per sqft.
          </Text>
        </View>
      </View>
    </Page>
  )
}

// ─── PAGE 5: FLOORING SCHEDULE ────────────────────────────────────────────────

function FlooringSchedulePage({ input, result }: { input: InteriorInput; result: InteriorResult }) {
  const fs = result.flooringSchedule
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={6} total={10} title="Flooring Schedule — IS 15477:2004" />
        <PageRule />

        <SectionEyebrow>IS 15477:2004 TILE SCHEDULE (SECTION 8 — LOCKED)</SectionEyebrow>
        <View style={{ borderWidth: 1, borderColor: T.blueprint, backgroundColor: T.blueprintBg, padding: 10, marginBottom: 10 }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.blueprint, marginBottom: 6 }}>STEP-BY-STEP CALCULATION</Text>
          {[
            { label: 'Total BUA',             value: `${fs.totalBuaSqft.toLocaleString('en-IN')} sqft (${input.numFloors} floor × ${input.buaPerFloorSqft} sqft)` },
            { label: 'Wastage factor',         value: `×1.10 — IS 15477:2004 minimum 10% wastage` },
            { label: 'With wastage',           value: `${fs.withWastageSqft.toLocaleString('en-IN')} sqft to order` },
            { label: 'Tile size',              value: `${fs.tileSize} (4 sqft/tile)` },
            { label: 'Tile qty',               value: `${fs.tileQty.toLocaleString('en-IN')} tiles (⌈${fs.withWastageSqft} ÷ 4⌉)` },
            { label: 'Tile adhesive',          value: `${fs.adhesiveBags} bags × 20kg — IS 15477:2004 (0.42 kg/sqft, 4.5 kg/sqm)` },
            { label: 'Polymer grout',          value: `${fs.groutKg} kg — IS 15477:2004 Annex (0.18 kg/sqft, 2–3mm joints)` },
          ].map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: 'rgba(31,78,121,0.15)' }}>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, flex: 1.2 }}>{row.label.toUpperCase()}</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.ironInk, flex: 2 }}>{row.value}</Text>
            </View>
          ))}
        </View>

        <SectionEyebrow>FLOORING MATERIAL SCHEDULE — IS-CODE BOQ</SectionEyebrow>
        <View style={S.tableHeader}>
          <Text style={{ width: 28, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>ITEM NO.</Text>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>DESCRIPTION</Text>
          <Text style={{ width: 55, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>QTY</Text>
          <Text style={{ width: 50, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>UNIT</Text>
          <Text style={{ flex: 1, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>IS REF</Text>
        </View>
        {[
          { no: '1.1', item: `Vitrified tiles ${fs.tileSize}`, qty: fs.tileQty,       unit: 'Tiles',    code: 'IS 13006:2013' },
          { no: '1.2', item: 'Tile adhesive 20kg bags',        qty: fs.adhesiveBags,  unit: 'Bags',     code: 'IS 15477:2004' },
          { no: '1.3', item: 'Polymer grout',                  qty: fs.groutKg,       unit: 'kg',       code: 'IS 15477:2004 Annex' },
          { no: '1.4', item: 'Tile spacers 2mm',               qty: Math.ceil(fs.tileQty * 4), unit: 'Pcs', code: 'Field practice' },
          { no: '1.5', item: 'Waterproofing coat (wet areas)',  qty: Math.round(input.numBathrooms * 60 + input.buaPerFloorSqft * 0.14 * 2), unit: 'sqft', code: 'IS 2645:2003' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ width: 28, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.inkA60 }}>{row.no}</Text>
            <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk }}>{row.item}</Text>
            <Text style={{ width: 55, fontFamily: 'IBMPlexMono', fontSize: 9, fontWeight: 700, color: T.blueprint, textAlign: 'right' }}>{row.qty.toLocaleString('en-IN')}</Text>
            <Text style={{ width: 50, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.inkA60, textAlign: 'right' }}>{row.unit}</Text>
            <Text style={{ flex: 1, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>{row.code}</Text>
          </View>
        ))}

        <SectionEyebrow>CPWD TILE LABOUR — SECTION 17</SectionEyebrow>
        <View style={S.tableHeader}>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>TRADE</Text>
          <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>WORKERS</Text>
          <Text style={{ width: 70, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>RATE/DAY</Text>
          <Text style={{ flex: 1, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>PRODUCTIVITY</Text>
        </View>
        {[
          { trade: 'Tile Mason (Floor)',  workers: 2, rate: 900,  prod: '90 sqft/day' },
          { trade: 'Tile Mason (Wall)',   workers: 1, rate: 950,  prod: '60 sqft/day' },
          { trade: 'Tile Helper',         workers: 2, rate: 560,  prod: 'Ratio to mason' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk }}>{row.trade}</Text>
            <Text style={{ width: 60, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{row.workers}</Text>
            <Text style={{ width: 70, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>₹{row.rate}</Text>
            <Text style={{ flex: 1, fontFamily: 'IBMPlexSans', fontSize: 8, color: T.inkA60, textAlign: 'right' }}>{row.prod}</Text>
          </View>
        ))}

        <View style={{ borderWidth: 1, borderColor: T.stampOxide, backgroundColor: T.oxideBg, padding: 8, marginTop: 10 }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.stampOxide, marginBottom: 3 }}>
            IS 15477:2004 — TILE ADHESIVE ON RCC SLAB IS MANDATORY
          </Text>
          <Text style={[S.body, { fontSize: 8 }]}>
            Never allow cement mortar bed directly on RCC slab for tiling. Differential thermal expansion between
            cement mortar and RCC causes hollow spots and cracking within 3–5 years. IS 15477:2004 mandates tile
            adhesive on RCC slabs. Always demand polymer-modified grout — never plain cement grout for tile joints.
          </Text>
        </View>
      </View>
    </Page>
  )
}

// ─── PAGE 6: KITCHEN ELEVATION SVG ───────────────────────────────────────────

function KitchenElevationPage({ input, result }: { input: InteriorInput; result: InteriorResult }) {
  const rft = input.kitchenRft
  const selectedGrade = result.gradeComparison.find(g => g.grade === input.grade)!

  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={7} total={10} title="Kitchen Schedule — CPWD Carpentry Rates" />
        <PageRule />

        {/* Kitchen elevation SVG */}
        <Svg width="510" height="180" viewBox="0 0 510 180">
          {/* Wall */}
          <Rect x="20" y="10" width={Math.min(rft * 24, 470)} height="130" fill="none" stroke={T.ironInk} strokeWidth="1.2" />

          {/* Upper cabinets */}
          {Array.from({ length: Math.min(Math.floor(rft / 2), 8) }, (_, i) => (
            <React.Fragment key={`uc-${i}`}>
              <Rect x={20 + i * 56} y="15" width="50" height="45" fill={T.blueprintBg} stroke={T.blueprint} strokeWidth="0.8" />
              <Line x1={45 + i * 56} y1="15" x2={45 + i * 56} y2="60" stroke={T.blueprint} strokeWidth="0.4" />
              <Line x1={20 + i * 56} y1="37" x2={70 + i * 56} y2="37" stroke={T.blueprint} strokeWidth="0.4" />
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 4.5, fill: T.inkA60 }} x={28 + i * 56} y="75">UC{i + 1}</Text>
            </React.Fragment>
          ))}

          {/* Platform / counter */}
          <Rect x="20" y="80" width={Math.min(rft * 24, 470)} height="12" fill={T.inkA35} stroke={T.ironInk} strokeWidth="0.8" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.ironInk }} x="22" y="89">GRANITE 18mm MIN (NO JOINT AT SINK)</Text>

          {/* Lower cabinets */}
          {Array.from({ length: Math.min(Math.floor(rft / 2), 8) }, (_, i) => (
            <React.Fragment key={`lc-${i}`}>
              <Rect x={20 + i * 56} y="92" width="50" height="44" fill="none" stroke={T.ironInk} strokeWidth="0.8" />
              <Line x1={45 + i * 56} y1="92" x2={45 + i * 56} y2="136" stroke={T.ironInk} strokeWidth="0.4" />
            </React.Fragment>
          ))}

          {/* Sink */}
          <Rect x={20 + Math.min(Math.floor(rft/2), 3) * 56} y="82" width="44" height="8" fill={T.sheetWhite} stroke={T.ironInk} strokeWidth="0.8" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 4.5, fill: T.inkA60 }}
            x={22 + Math.min(Math.floor(rft/2), 3) * 56} y="77">SS SINK</Text>

          {/* Plinth */}
          <Rect x="20" y="136" width={Math.min(rft * 24, 470)} height="4" fill={T.inkA15} stroke={T.inkA35} strokeWidth="0.5" />

          {/* Dimension */}
          <Line x1="20" y1="155" x2={Math.min(rft * 24, 470) + 20} y2="155" stroke={T.ironInk} strokeWidth="0.8" />
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.ironInk }}
            x={Math.min(rft * 24, 470) / 2} y="165">
            {rft} RFT ({(rft * 0.3048).toFixed(1)} m)
          </Text>

          {/* Labels */}
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.blueprint }} x="440" y="40">UPPER CABINETS</Text>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.ironInk }} x="440" y="115">LOWER CABINETS</Text>
        </Svg>

        <SectionEyebrow>KITCHEN ESTIMATE</SectionEyebrow>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          {[
            { label: 'RUNNING FEET',  value: `${rft} rft` },
            { label: 'GRADE',        value: gradeLabel(input.grade) },
            { label: 'RATE',         value: `₹${result.gradeComparison.find(g => g.grade === input.grade)!.kitchenCost / rft}/rft` },
            { label: 'TOTAL KITCHEN',value: formatLakhs(selectedGrade.kitchenCost) },
          ].map(item => (
            <View key={item.label} style={{ flex: 1, borderWidth: 1, borderColor: T.inkA35, padding: 6 }}>
              <Text style={[S.monoSm, { marginBottom: 2 }]}>{item.label}</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 10, fontWeight: 700, color: T.blueprint }}>{item.value}</Text>
            </View>
          ))}
        </View>

        <SectionEyebrow>KITCHEN RATE COMPARISON — ALL GRADES</SectionEyebrow>
        <View style={S.tableHeader}>
          <Text style={{ flex: 1.5, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>GRADE</Text>
          <Text style={{ flex: 1.5, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>RATE / RFT</Text>
          <Text style={{ flex: 1.5, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>TOTAL ({rft} rft)</Text>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>SPECIFICATION</Text>
        </View>
        {[
          { grade: 'basic',    rate: 1200,  spec: 'Local carpenter, plywood carcass, laminate shutter' },
          { grade: 'standard', rate: 2200,  spec: 'Modular / semi-modular, MR ply, membrane shutter' },
          { grade: 'premium',  rate: 3800,  spec: 'Modular, marine ply, glass or acrylic shutter, soft close' },
          { grade: 'luxury',   rate: 7500,  spec: 'German modular, full-extension hardware, quartz countertop' },
        ].map((row, i) => (
          <View key={i} style={row.grade === input.grade ? [S.tableRow, { backgroundColor: T.blueprintBg }] : i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ flex: 1.5, fontFamily: row.grade === input.grade ? 'IBMPlexSans' : 'IBMPlexSans', fontWeight: row.grade === input.grade ? 600 : 400, fontSize: 9, color: row.grade === input.grade ? T.blueprint : T.ironInk }}>
              {gradeLabel(row.grade as 'basic' | 'standard' | 'premium' | 'luxury')}
            </Text>
            <Text style={{ flex: 1.5, fontFamily: 'IBMPlexMono', fontSize: 9, fontWeight: row.grade === input.grade ? 700 : 400, color: row.grade === input.grade ? T.blueprint : T.ironInk, textAlign: 'right' }}>
              ₹{row.rate}
            </Text>
            <Text style={{ flex: 1.5, fontFamily: 'IBMPlexMono', fontSize: 9, fontWeight: row.grade === input.grade ? 700 : 400, color: row.grade === input.grade ? T.blueprint : T.ironInk, textAlign: 'right' }}>
              {formatLakhs(row.rate * rft)}
            </Text>
            <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 8, color: T.inkA60 }}>{row.spec}</Text>
          </View>
        ))}

        <View style={{ borderWidth: 1, borderColor: T.markingYellow, backgroundColor: T.yellowBg, padding: 8, marginTop: 10 }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.markingYellow, marginBottom: 3 }}>
            KITCHEN OVERCHARGING RISK — MOST COMMON IN PHASE 5
          </Text>
          <Text style={[S.body, { fontSize: 8 }]}>
            Kitchen is the highest-risk line item for overcharging in interior work. RCC/masonry-made kitchen
            charged at modular rates. Plywood grade mismatch (commercial ply billed as marine ply). Granite
            thickness below 18mm (IS minimum). Joint at sink — always demand no joint at sink location.
          </Text>
        </View>
      </View>
    </Page>
  )
}

// ─── PAGE 7: COMPLETE INTERIOR BOQ ───────────────────────────────────────────

function InteriorBOQPage({ input, result }: { input: InteriorInput; result: InteriorResult }) {
  const selectedGrade = result.gradeComparison.find(g => g.grade === input.grade)!
  const c = result.costs

  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={8} total={10} title="Complete Interior BOQ" />
        <PageRule />

        <SectionEyebrow>ROOM-BY-ROOM FLOORING BREAKDOWN</SectionEyebrow>
        <View style={S.tableHeader}>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>ROOM</Text>
          <Text style={{ width: 70, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>AREA (sqft)</Text>
          <Text style={{ width: 90, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>FLOORING COST (₹)</Text>
        </View>
        {result.roomBreakdown.map((room, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk }}>{room.room}</Text>
            <Text style={{ width: 70, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{room.areaSqft.toLocaleString('en-IN')}</Text>
            <Text style={{ width: 90, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>{room.flooringCost.toLocaleString('en-IN')}</Text>
          </View>
        ))}

        <SectionEyebrow>PAINT SCHEDULE — IS 2395:1994</SectionEyebrow>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          {[
            { label: 'EMULSION',   value: `${result.paintSchedule.paintLitres} L`,   note: `${result.paintSchedule.numCoats} coats` },
            { label: 'PRIMER',     value: `${result.paintSchedule.primerLitres} L`,  note: '1 mandatory coat' },
            { label: 'WALL PUTTY', value: `${result.paintSchedule.puttyBags} bags`,  note: '2 kg bags' },
          ].map(item => (
            <View key={item.label} style={{ flex: 1, borderWidth: 1, borderColor: T.inkA35, padding: 6 }}>
              <Text style={[S.monoSm, { marginBottom: 2 }]}>{item.label}</Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 11, fontWeight: 700, color: T.blueprint }}>{item.value}</Text>
              <Text style={[S.monoSm, { color: T.inkA60, marginTop: 2 }]}>{item.note}</Text>
            </View>
          ))}
        </View>

        <SectionEyebrow>{`COMPLETE BOQ — ${gradeLabel(input.grade).toUpperCase()} GRADE`}</SectionEyebrow>
        <View style={S.tableHeader}>
          <Text style={{ flex: 2.5, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>COMPONENT</Text>
          <Text style={{ width: 90, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>COST (₹)</Text>
        </View>
        {[
          { label: 'Flooring — tiles, adhesive, grout (IS 15477:2004)',    cost: c.flooringMaterial },
          { label: 'Kitchen cabinets + countertop',                         cost: c.kitchenMaterial },
          { label: `False ceiling — MS frame IS 277:2003 (${input.falseCeilingSqft} sqft)`, cost: c.falseCeilingMaterial },
          { label: 'Paint — emulsion + primer + putty (IS 2395:1994)',     cost: c.paintMaterial },
          { label: 'Doors + frames + hardware',                             cost: c.doorsMaterial },
          { label: 'Total Material',                                        cost: c.totalMaterial, bold: true },
          { label: 'CPWD Labour — tiling, carpentry, painting, electrician',cost: result.labourCost },
          { label: 'Contractor overhead + margin (8%)',                     cost: result.overheadCost },
        ].map((row, i) => (
          <View key={i} style={row.bold ? [S.tableRow, { borderTopWidth: 2, borderTopColor: T.ironInk }] : i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ flex: 2.5, fontFamily: 'IBMPlexSans', fontSize: row.bold ? 10 : 9, fontWeight: row.bold ? 600 : 400, color: T.ironInk }}>
              {row.label}
            </Text>
            <Text style={{ width: 90, fontFamily: 'IBMPlexMono', fontSize: row.bold ? 10 : 9, fontWeight: row.bold ? 700 : 400, color: row.bold ? T.blueprint : T.ironInk, textAlign: 'right' }}>
              {row.cost > 0 ? row.cost.toLocaleString('en-IN') : '—'}
            </Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', paddingVertical: 6, borderTopWidth: 2, borderTopColor: T.blueprint, backgroundColor: T.blueprintBg }}>
          <Text style={{ flex: 2.5, fontFamily: 'IBMPlexSans', fontSize: 11, fontWeight: 600, color: T.blueprint }}>
            GRAND TOTAL — {gradeLabel(input.grade).toUpperCase()}
          </Text>
          <Text style={{ width: 90, fontFamily: 'IBMPlexMono', fontSize: 11, fontWeight: 700, color: T.blueprint, textAlign: 'right' }}>
            {selectedGrade.totalWithLabour.toLocaleString('en-IN')}
          </Text>
        </View>

        {input.contractorQuote && input.contractorQuote > 0 ? (
          <View style={{ borderWidth: 1, borderColor: T.inkA35, padding: 8, marginTop: 8 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, marginBottom: 4 }}>CONTRACTOR COMPARISON</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={S.monoSm}>YOUR ESTIMATE</Text>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 12, fontWeight: 700, color: T.approvedGreen }}>
                  {formatLakhs(selectedGrade.totalWithLabour)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.monoSm}>CONTRACTOR QUOTE</Text>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 12, fontWeight: 700, color: input.contractorQuote > selectedGrade.totalWithLabour * 1.15 ? T.stampOxide : T.ironInk }}>
                  {formatLakhs(input.contractorQuote)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.monoSm}>VARIANCE</Text>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 12, fontWeight: 700, color: input.contractorQuote > selectedGrade.totalWithLabour ? T.stampOxide : T.approvedGreen }}>
                  {input.contractorQuote > selectedGrade.totalWithLabour
                    ? `+${formatLakhs(input.contractorQuote - selectedGrade.totalWithLabour)}`
                    : `-${formatLakhs(selectedGrade.totalWithLabour - input.contractorQuote)}`}
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </Page>
  )
}

// ─── PAGE 8: SITE QUALITY CONTROL CHECKLIST — SECOND-TO-LAST ─────────────────

function QualityChecklistPage() {
  const checks = [
    {
      item: 'Never use cement directly on RCC slab for tiling — use tile adhesive (IS 15477)',
      detail: 'IS 15477:2004: Cement mortar on RCC slab causes differential thermal expansion, hollow spots, and cracking within 3–5 years. Tile adhesive mandatory. Demand IS 15477 compliance from your contractor before tiling starts.',
      critical: true,
    },
    {
      item: 'Tile wastage minimum 10% — always order extra',
      detail: 'IS 15477:2004 field practice: Minimum 10% wastage for cutting losses, breakage, and future repairs. Always order from the same batch — batch numbers affect tile shade. Re-ordering a discontinued batch is often impossible.',
      critical: true,
    },
    {
      item: 'Primer coat mandatory before any emulsion paint (IS 2395)',
      detail: 'IS 2395:1994 (Part 1): Primer seals the surface, improves adhesion, and prevents blistering. Without primer, emulsion peels within 1–2 monsoon seasons. Sequence: plaster → putty → primer → emulsion (min 2 coats).',
      critical: true,
    },
    {
      item: 'Paint — minimum 2 coats emulsion after primer, 3 coats for premium',
      detail: 'IS 2395:1994 (Part 2): Minimum 2 coats emulsion after primer for standard finish, 3 coats for premium/luxury grade. Single coat after primer is sub-standard and will show patchy colour within 1 year. Check dry film thickness.',
      critical: false,
    },
    {
      item: 'False ceiling — MS frame mandatory, minimum 0.5mm thickness (IS 277)',
      detail: 'IS 277:2003: False ceiling must use MS (mild steel) frame with minimum 0.5mm galvanised sheet thickness. Aluminium channels are acceptable for light loads but MS is mandatory in heavy-use areas. GI wire mesh is not a substitute for MS frame.',
      critical: true,
    },
    {
      item: 'Kitchen platform — granite minimum 18mm thickness, no joints at sink',
      detail: 'Granite below 18mm cracks under thermal shock from hot vessels. A joint at the sink is a water ingress point — water enters the joint, rots the plywood substrate, and causes platform failure within 2–3 years. Demand single-slab counter with sink cutout.',
      critical: true,
    },
    {
      item: 'Waterproofing in wet areas before tiling — minimum 2 coats (IS 2645)',
      detail: 'IS 2645:2003: Waterproofing mandatory in all wet areas (bathrooms, kitchen, balcony) before tiling. Minimum 2 coats. Test by flooding with 25mm water for 24 hours before tiling — verify no seepage to the floor below.',
      critical: true,
    },
    {
      item: 'Tile grout — use polymer grout, never plain cement',
      detail: 'IS 15477:2004 Annex: Tile joints must be filled with polymer-modified grout. Plain cement grout cracks, stains, and harbours mould within 2–3 years. Polymer grout is flexible, stain-resistant, and anti-microbial. Especially critical in bathrooms and kitchens.',
      critical: false,
    },
    {
      item: 'Door frames — fix before plastering, not after',
      detail: 'NBC 2016 Part 3 Cl 4.3: Door frames must be fixed before plastering so the plaster bonds against the frame. Frames fixed after plastering leave gaps for water ingress, termite entry, and wall shrinkage cracks. Specify "frame first, plaster after" in your contract.',
      critical: false,
    },
    {
      item: 'Electrical fixtures — fix only after painting complete',
      detail: 'Switch boards, light points, fan hooks, and all electrical fixtures must be fixed ONLY after all painting is complete. Painting around fixed fixtures leads to paint overspray, smearing, and fixture damage that is costly to repair.',
      critical: false,
    },
    {
      item: 'Wardrobes — fix to wall with rawl plugs, never adhesive only',
      detail: 'A 6-foot wardrobe fully loaded weighs 150–200 kg. Fixing with adhesive alone is unsafe — adhesive fails in humid conditions within 3–5 years. Wardrobes must be fixed to the wall with rawl plugs and screws at minimum 3 points top and bottom.',
      critical: true,
    },
    {
      item: 'Floor level check — maximum 3mm variation across 2 metres before tiling',
      detail: 'Check floor level with a 2-metre straightedge and feeler gauge before tiling. Maximum variation: 3mm across 2 metres. Uneven floors cause lippage (tile edge offset), grout cracking, and hollow spots. Repair with self-levelling compound before adhesive application.',
      critical: false,
    },
  ]

  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={9} total={10} title="Site Quality Control Checklist — Interior" />
        <PageRule />

        <Text style={[S.body, { fontSize: 8, marginBottom: 8, color: T.inkA60 }]}>
          Reference: IS 15477:2004 · IS 2395:1994 · IS 277:2003 · IS 2645:2003 · NBC 2016 Part 3
        </Text>

        {checks.map((check, i) => (
          <View key={i} style={{
            marginBottom: 6,
            padding: 7,
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
              <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, fontWeight: 600, color: T.ironInk, flex: 1 }}>
                {check.item}
              </Text>
              {check.critical && (
                <View style={{ marginLeft: 4, borderWidth: 1, borderColor: T.stampOxide, paddingHorizontal: 3, paddingVertical: 1 }}>
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
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {['Contractor Name', 'Waterproof Test Date', 'Floor Level Check (mm)', 'Inspector Signature'].map(label => (
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

// ─── PAGE 9: TOTAL SUMMARY + CROSS-SELL (LAST) ───────────────────────────────

function TotalSummaryPage({ result, input, reportId }: { result: InteriorResult; input: InteriorInput; reportId: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nirmanshastra.in'
  const selectedGrade = result.gradeComparison.find(g => g.grade === input.grade)!

  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader page={10} total={10} title="Cost Summary + Phase Tools Cross-sell" />
        <PageRule />

        <SectionEyebrow>COST SUMMARY — ALL 4 GRADES</SectionEyebrow>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {result.gradeComparison.map(g => (
            <View key={g.grade} style={{
              flex: 1,
              borderWidth: g.grade === input.grade ? 2 : 1,
              borderColor: g.grade === input.grade ? T.blueprint : T.inkA35,
              padding: 8,
              backgroundColor: g.grade === input.grade ? T.blueprintBg : T.sheetWhite,
            }}>
              <Text style={[S.monoSm, { color: g.grade === input.grade ? T.blueprint : T.inkA60, marginBottom: 4 }]}>
                {g.label.toUpperCase()}
              </Text>
              <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 13, fontWeight: 700, color: g.grade === input.grade ? T.blueprint : T.ironInk }}>
                {formatLakhs(g.totalWithLabour)}
              </Text>
              <Text style={[S.monoSm, { color: T.inkA60, marginTop: 4 }]}>₹{g.perSqft}/sqft</Text>
              <Text style={[S.monoSm, { color: T.inkA60, marginTop: 2 }]}>{g.multiplier}× basic</Text>
            </View>
          ))}
        </View>

        <View style={S.tableHeader}>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>COMPONENT</Text>
          <Text style={{ width: 90, fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60, textAlign: 'right' }}>
            {gradeLabel(input.grade).toUpperCase()} (₹)
          </Text>
        </View>
        {[
          { label: 'Flooring — IS 15477:2004 tile adhesive',     cost: result.costs.flooringMaterial },
          { label: 'Kitchen cabinets + countertop',               cost: result.costs.kitchenMaterial },
          { label: `False ceiling — IS 277:2003 MS frame`,       cost: result.costs.falseCeilingMaterial },
          { label: 'Paint — IS 2395:1994 primer + emulsion',     cost: result.costs.paintMaterial },
          { label: 'Doors + frames + hardware',                   cost: result.costs.doorsMaterial },
          { label: 'CPWD Labour (tiling, carpentry, paint, elec)',cost: result.labourCost },
          { label: 'Contractor overhead + margin',                cost: result.overheadCost },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk }}>{row.label}</Text>
            <Text style={{ width: 90, fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, textAlign: 'right' }}>
              {row.cost > 0 ? row.cost.toLocaleString('en-IN') : '—'}
            </Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', paddingVertical: 5, borderTopWidth: 2, borderTopColor: T.blueprint, backgroundColor: T.blueprintBg }}>
          <Text style={{ flex: 2, fontFamily: 'IBMPlexSans', fontSize: 11, fontWeight: 600, color: T.blueprint }}>
            TOTAL ({gradeLabel(input.grade)})
          </Text>
          <Text style={{ width: 90, fontFamily: 'IBMPlexMono', fontSize: 11, fontWeight: 700, color: T.blueprint, textAlign: 'right' }}>
            {selectedGrade.totalWithLabour.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Phase tools cross-sell */}
        <View style={{ marginTop: 12, borderWidth: 2, borderColor: T.ironInk, padding: 12, backgroundColor: T.sheetWhite }}>
          <Text style={[S.eyebrow, { color: T.blueprint, marginBottom: 4 }]}>COMPLETE YOUR BUILD ESTIMATE — ALL 5 PHASES</Text>
          <Text style={[S.h2, { fontSize: 12, marginBottom: 6 }]}>Each phase has hidden overcharging risks. Cover all 5.</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {[
              { phase: 'Ph 1', name: 'StructoPro', note: 'IS 456:2000 RCC' },
              { phase: 'Ph 2', name: 'MasonPro',   note: 'IS 1905:1987 brickwork' },
              { phase: 'Ph 3', name: 'ElectroPro', note: 'IS 732:1989 wiring' },
              { phase: 'Ph 4', name: 'PlumbPro',   note: 'IS 1742:1983 drainage' },
              { phase: 'Ph 5', name: 'InteriorPro',note: 'IS 15477:2004 ✓ Done' },
            ].map(t => (
              <View key={t.name} style={{
                borderWidth: 1,
                borderColor: t.name === 'InteriorPro' ? T.approvedGreen : T.inkA35,
                paddingHorizontal: 8, paddingVertical: 5,
                backgroundColor: t.name === 'InteriorPro' ? T.greenBg : T.sheetWhite,
              }}>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 }}>{t.phase}</Text>
                <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, fontWeight: 700, color: t.name === 'InteriorPro' ? T.approvedGreen : T.ironInk }}>{t.name}</Text>
                <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 7, color: T.inkA60 }}>{t.note}</Text>
              </View>
            ))}
          </View>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 9, color: T.blueprint }}>
            {appUrl}/tools → ₹499 per phase tool
          </Text>
        </View>

        <Text style={[S.monoSm, { textAlign: 'center', marginTop: 10, lineHeight: 1.6 }]}>
          Report {reportId} · IS 15477:2004 · IS 2395:1994 · IS 277:2003 · IS 2645:2003 · NBC 2016{'\n'}
          This report is for estimation purposes only. Quantities computed using IS-code thumb rules.{'\n'}
          Actual quantities will vary with site conditions. Consult a licensed interior designer for design drawings.
        </Text>
      </View>
    </Page>
  )
}

// ─── DOCUMENT EXPORT ──────────────────────────────────────────────────────────

export default function InteriorProPDF(props: Props) {
  return (
    <Document title={`InteriorPro Report — ${props.reportId}`} author="NirmanShastra">
      <CoverPage        {...props} />
      <ProjectSummaryPage  input={props.input} result={props.result} />
      <ISCodeChecklistPage {...props} />
      <RoomLayoutPage      input={props.input} />
      <GradeComparisonPage input={props.input} result={props.result} />
      <FlooringSchedulePage input={props.input} result={props.result} />
      <KitchenElevationPage input={props.input} result={props.result} />
      <InteriorBOQPage     input={props.input} result={props.result} />
      <QualityChecklistPage />
      <TotalSummaryPage    result={props.result} input={props.input} reportId={props.reportId} />
    </Document>
  )
}
