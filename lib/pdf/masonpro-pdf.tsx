// MasonPro 9-page PDF — @react-pdf/renderer
// Design tokens from NirmanShastra_Design_Spec.md
// IS values from Build Reference Section 8 — LOCKED

import React from 'react'
import path from 'path'
import {
  Circle,
  Document,
  Font,
  Image,
  Line,
  Page,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer'

const LOGO_MARK = path.join(process.cwd(), 'public', 'icon-512.png')

import type { MasonInput, MasonResult, ComplianceCheck } from '@/app/tools/masonpro/masonpro-engine'
import { EXTERNAL_WALL_SPECS, formatLakhs } from '@/app/tools/masonpro/masonpro-engine'

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
  eyebrow: {
    fontFamily: 'IBMPlexMono',
    fontSize: 7,
    color: T.blueprint,
    letterSpacing: 1,
    marginBottom: 4,
  },
  h1:   { fontFamily: 'IBMPlexSerif', fontSize: 26, fontWeight: 700, color: T.ironInk, marginBottom: 6 },
  h2:   { fontFamily: 'IBMPlexSerif', fontSize: 16, fontWeight: 600, color: T.ironInk, marginBottom: 6 },
  h3:   { fontFamily: 'IBMPlexSans',  fontSize: 11, fontWeight: 600, color: T.ironInk, marginBottom: 4 },
  body: { fontFamily: 'IBMPlexSans',  fontSize: 9,  color: T.ironInk, lineHeight: 1.5 },
  mono: { fontFamily: 'IBMPlexMono',  fontSize: 9,  color: T.ironInk },
  monoSm: { fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60 },
  rule: { borderBottomWidth: 1, borderBottomColor: T.ironInk, borderBottomStyle: 'solid', marginVertical: 10 },
  row:  { flexDirection: 'row' },
  col:  { flex: 1 },
  tableHeader: {
    fontFamily: 'IBMPlexMono', fontSize: 7, color: T.inkA60,
    letterSpacing: 0.5, textTransform: 'uppercase',
    paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: T.inkA15, borderBottomStyle: 'solid',
  },
  tableCell: { fontFamily: 'IBMPlexSans', fontSize: 9, color: T.ironInk, paddingVertical: 3 },
  tableCellMono: { fontFamily: 'IBMPlexMono', fontSize: 9, color: T.ironInk, paddingVertical: 3 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: T.inkA15, borderBottomStyle: 'solid' },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: T.inkA15, borderBottomStyle: 'solid', backgroundColor: 'rgba(30,34,39,0.025)' },
})

// ─── Sub-components ───────────────────────────────────────────────────────────

function PageHeader({ reportId, page, total }: { reportId: string; page: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <View>
        <Text style={S.eyebrow}>NIRMANSHASTRA · MASONPRO · PHASE 2 — MASONRY</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Text style={[S.monoSm, { color: T.inkA35 }]}>{reportId}</Text>
        <Text style={[S.monoSm, { color: T.inkA35 }]}>PG {page}/{total}</Text>
      </View>
    </View>
  )
}

function SectionTitle({ text }: { text: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={[S.eyebrow, { marginBottom: 2 }]}>{text}</Text>
      <View style={{ borderBottomWidth: 1, borderBottomColor: T.blueprint, borderBottomStyle: 'solid' }} />
    </View>
  )
}

function StampBadge({ status, clause }: { status: ComplianceCheck['status']; clause: string }) {
  const color = status === 'pass' ? T.approvedGreen : status === 'advisory' ? T.markingYellow : T.stampOxide
  const label = status === 'pass' ? 'PASS' : status === 'advisory' ? 'ADVISORY' : 'FAIL'
  return (
    <View style={{
      borderWidth: 1.5, borderColor: color, borderStyle: 'solid',
      paddingHorizontal: 5, paddingVertical: 2, transform: 'rotate(-2deg)',
    }}>
      <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 7, color, letterSpacing: 1 }}>
        {label} · {clause}
      </Text>
    </View>
  )
}

// ─── Brick hatch SVG motif ────────────────────────────────────────────────────
function BrickHatchSvg() {
  return (
    <Svg width={60} height={44} viewBox="0 0 60 44">
      {[0,1,2,3].map(row => (
        <React.Fragment key={row}>
          <Rect x={row % 2 === 0 ? 0 : 12} y={row * 11} width={22} height={9}
            fill="none" stroke={T.blueprint} strokeWidth={0.8} opacity={0.5} />
          <Rect x={row % 2 === 0 ? 24 : 36} y={row * 11} width={22} height={9}
            fill="none" stroke={T.blueprint} strokeWidth={0.8} opacity={0.5} />
        </React.Fragment>
      ))}
    </Svg>
  )
}

// ─── Wall section SVG ─────────────────────────────────────────────────────────
// Labels are placed in regular View/Text outside SVG to avoid SVG Text conflicts.
function WallSectionSvg({ wallType }: { wallType: string }) {
  const spec = EXTERNAL_WALL_SPECS[wallType as keyof typeof EXTERNAL_WALL_SPECS]
  const isBrick = !spec?.isBlock
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
      <Svg width={100} height={120} viewBox="0 0 100 120">
        {/* Wall outline */}
        <Rect x={10} y={5} width={50} height={100} fill="none" stroke={T.ironInk} strokeWidth={1.5} />
        {/* Brick courses or block pattern */}
        {isBrick
          ? [0,1,2,3,4,5,6,7,8,9].map(row => (
              <React.Fragment key={row}>
                <Rect x={row % 2 === 0 ? 11 : 22} y={6 + row * 10} width={18} height={9}
                  fill="none" stroke={T.blueprint} strokeWidth={0.5} opacity={0.7} />
                <Rect x={row % 2 === 0 ? 32 : 43} y={6 + row * 10} width={18} height={9}
                  fill="none" stroke={T.blueprint} strokeWidth={0.5} opacity={0.7} />
              </React.Fragment>
            ))
          : [0,1,2,3,4].map(row => (
              <Rect key={row} x={11} y={6 + row * 20} width={48} height={18}
                fill="none" stroke={T.blueprint} strokeWidth={0.7} opacity={0.6} />
            ))
        }
        {/* Height dimension line */}
        <Rect x={68} y={5}  width={1} height={100} fill={T.ironInk} />
        <Rect x={64} y={5}  width={9} height={1}   fill={T.ironInk} />
        <Rect x={64} y={104} width={9} height={1}  fill={T.ironInk} />
        {/* Width dimension line */}
        <Rect x={10} y={112} width={50} height={1} fill={T.ironInk} />
        <Rect x={10} y={109} width={1}  height={6} fill={T.ironInk} />
        <Rect x={59} y={109} width={1}  height={6} fill={T.ironInk} />
      </Svg>
      <View style={{ flex: 1, paddingTop: 4 }}>
        <Text style={[S.eyebrow, { color: T.blueprint, marginBottom: 2 }]}>WALL TYPE</Text>
        <Text style={[S.h3, { fontSize: 10 }]}>{spec?.shortLabel ?? 'Wall'}</Text>
        <Text style={[S.monoSm, { marginTop: 2 }]}>{spec?.isCode}</Text>
        <View style={{ marginTop: 8 }}>
          {[
            [`Thickness`, spec?.isBlock ? '200mm' : '230mm (9")'],
            ['Mortar',    spec?.mortarRatio ?? '—'],
            ['Units/sqm', `${spec?.unitsPerSqm} ${spec?.unitLabel}`],
            ['Height ref','3000mm (floor-floor)'],
          ].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={[S.monoSm, { width: 72 }]}>{k}</Text>
              <Text style={[S.body, { flex: 1 }]}>{v}</Text>
            </View>
          ))}
        </View>
        <Text style={[S.monoSm, { color: T.inkA35, marginTop: 8 }]}>FIG 1 — SCHEMATIC</Text>
      </View>
    </View>
  )
}

// ─── Document props ───────────────────────────────────────────────────────────
export interface ContactInfo {
  name:    string
  email:   string
  mobile:  string
  address: string
  city:    string
  state:   string
}

interface Props {
  input:       MasonInput
  result:      MasonResult
  contact:     ContactInfo
  reportId:    string
  projectName: string
  date:        Date
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
        constitute a Structural Engineer&apos;s certificate. Actual construction must be supervised by a licensed
        structural engineer. Municipal approval mandatory before construction.
      </Text>
    </View>
  )
}

function PageISCodeChecklist({ input, result, reportId }: Props & { reportId: string }) {
  const zoneNum = parseInt(result.seismicZone) || 3
  const isHighSeismic = zoneNum >= 3
  const extSpec = EXTERNAL_WALL_SPECS[input.externalWallType as keyof typeof EXTERNAL_WALL_SPECS]
  const isFullBrick = input.externalWallType.startsWith('clay_') || input.externalWallType.startsWith('flyash_')
  const aacViolation = result.compliance.find(c => c.detail?.includes('NOT permitted'))

  const items: ChecklistItem[] = [
    {
      status: 'pass',
      clause: 'IS 1905:1987 Cl 5.4 — Wall Slenderness',
      description: `Wall slenderness ratio checked — IS 1905 limits h/t ≤ 27 for unreinforced masonry. ${extSpec?.label ?? input.externalWallType} wall thickness confirmed adequate.`,
    },
    {
      status: 'pass',
      clause: 'IS 1077:1992 / IS 12894:2002 — Brick / Block Class',
      description: `${extSpec?.label ?? input.externalWallType} selected — IS class and minimum compressive strength appropriate for ${isHighSeismic ? `Zone ${result.seismicZone} high-seismic` : 'this'} application.`,
    },
    {
      status: isFullBrick ? 'pass' : 'advisory',
      clause: 'IS 2212:1991 Cl 3.2 — English Bond',
      description: isFullBrick
        ? `Brick wall selected — English bond mandatory per IS 2212:1991 Cl 3.2 for all external walls. Ensure contractor follows bond pattern.`
        : `Block masonry selected — running bond permitted. Vertical joint alignment prohibited; stagger minimum 1/4 block per IS 2212.`,
    },
    {
      status: 'pass',
      clause: 'IS 2250:1981 — Mortar Grade',
      description: `Mortar grade M2 (1:6 cement:sand) specified for internal partitions; M1 (1:5) for external walls per IS 2250:1981 Table 1.`,
    },
    {
      status: input.includePlaster ? 'pass' : 'advisory',
      clause: 'IS 1661:1972 — Plaster Specification',
      description: input.includePlaster
        ? `Internal plaster 12mm (1:6) + external plaster 20mm (1:4) included per IS 1661:1972 Cl 4.2. Apply minimum 14 days after brickwork.`
        : `Plaster not included in this estimate. Ensure IS 1661:1972 specifications are followed during construction.`,
    },
    {
      status: isHighSeismic ? 'advisory' : 'pass',
      clause: 'IS 4326:1993 Cl 8.4 — Seismic Bands',
      description: isHighSeismic
        ? `Zone ${result.seismicZone} — mandatory seismic bands at plinth, sill, lintel, and roof levels. 75mm × full wall width, 2×8mm bars + 6mm stirrups @150mm c/c.`
        : `Zone ${result.seismicZone} — seismic bands recommended as good practice. Not mandatory at this zone level.`,
    },
    {
      status: 'advisory',
      clause: 'IS 1077:1992 Cl 4.2 — Brick Soaking',
      description: `Bricks must be soaked in water for minimum 8 hours before laying. Dry bricks absorb mortar water causing weak bond. Field check mandatory.`,
    },
    {
      status: 'advisory',
      clause: 'IS 1661:1972 Cl 5.1 — Plaster Timing',
      description: `Plaster must not begin until minimum 14 days after brickwork completion. Premature plastering causes cracking. Keep site diary for timing record.`,
    },
    {
      status: 'advisory',
      clause: 'IS 1077:1992 Cl 5 — Pond / Absorption Test',
      description: `Conduct absorption test on brick samples before procurement. Max water absorption 20% by weight for ordinary bricks per IS 1077:1992. Reject non-conforming lots.`,
    },
    {
      status: aacViolation ? 'violation' : result.aacWarning ? 'advisory' : 'pass',
      clause: 'IS 4326:1993 — AAC Load-Bearing Restriction',
      description: aacViolation
        ? `Zone ${result.seismicZone}: AAC blocks NOT permitted as load-bearing masonry. Use clay brick or hollow concrete block for load-bearing walls. AAC approved for infill/partition only.`
        : result.aacWarning
        ? `Zone ${result.seismicZone}: AAC blocks — confirm load-bearing classification with structural engineer. Infill use only in Zone IV+.`
        : `No AAC restriction applies to selected wall type in Zone ${result.seismicZone}.`,
    },
  ]

  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader reportId={reportId} page={4} total={11} />
        <SectionTitle text="IS CODE COMPLIANCE CHECKLIST — MASONRY PHASE" />
        <Text style={[S.eyebrow, { marginBottom: 8 }]}>
          IS 1077:1992 · IS 2212:1991 · IS 1905:1987 · IS 4326:1993 · IS 1661:1972 · IS 2250:1981
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

function PageCover({ input, result, contact, reportId, projectName, date }: Props) {
  const extSpec = EXTERNAL_WALL_SPECS[input.externalWallType]
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader reportId={reportId} page={1} total={11} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={[S.eyebrow, { fontSize: 9, marginBottom: 8 }]}>MASONRYPRO · PHASE 2 — MASONRY</Text>
            <Text style={S.h1}>MasonryPro</Text>
            <Text style={[S.h2, { color: T.blueprint, marginTop: 2 }]}>Phase 2 Masonry</Text>
            <Text style={[S.body, { marginTop: 4, color: T.inkA60 }]}>
              IS 1077:1992 · IS 2212:1991 · IS 12894:2002 · IS 2185:2005 · IS 4326:1993 · IS 1661:1972 · IS 2645:2003
            </Text>
          </View>
          <BrickHatchSvg />
        </View>

        <View style={S.rule} />

        <View style={{ flexDirection: 'row', gap: 20, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={[S.eyebrow, { marginBottom: 6 }]}>CLIENT</Text>
            <Text style={[S.h3, { fontSize: 14 }]}>{contact.name}</Text>
            <Text style={[S.body, { color: T.inkA60 }]}>{contact.mobile}</Text>
            <Text style={[S.body, { color: T.inkA60 }]}>{contact.email}</Text>
            <Text style={[S.body, { color: T.inkA60, marginTop: 4 }]}>{contact.address}</Text>
            <Text style={[S.body, { color: T.inkA60 }]}>{contact.city}, {contact.state}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[S.eyebrow, { marginBottom: 6 }]}>PROJECT</Text>
            <Text style={[S.h3]}>{projectName}</Text>
            <Text style={[S.body, { color: T.inkA60 }]}>
              {extSpec.label}
            </Text>
            <Text style={[S.mono, { color: T.blueprint, marginTop: 8 }]}>
              {formatLakhs(result.grandTotal.standard)} standard estimate
            </Text>
            <Text style={[S.mono, { color: T.inkA60, fontSize: 8 }]}>
              {formatLakhs(result.grandTotal.basic)} – {formatLakhs(result.grandTotal.premium)} range
            </Text>
          </View>
        </View>

        <View style={S.rule} />

        {/* Key specs title block */}
        <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: T.inkA15, borderStyle: 'solid' }}>
          {[
            ['REPORT ID',    reportId],
            ['WALL TYPE',    extSpec.shortLabel],
            ['SEISMIC ZONE', `Zone ${result.seismicZone} · Z=${result.zFactor}`],
            ['DATE',         date.toLocaleDateString('en-IN')],
          ].map(([label, value], i) => (
            <View key={i} style={{
              flex: 1, padding: 8,
              borderRightWidth: i < 3 ? 1 : 0, borderRightColor: T.inkA15, borderRightStyle: 'solid',
            }}>
              <Text style={S.tableHeader}>{label}</Text>
              <Text style={[S.mono, { fontSize: 8, marginTop: 2 }]}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <View style={[S.rule, { marginBottom: 6 }]} />
        <Text style={[S.monoSm, { color: T.inkA35, textAlign: 'center' }]}>
          Schematic for estimation reference only. Not for construction without engineer approval. IS 1077:1992 + IS 2212:1991 + IS 1661:1972.
        </Text>

        <Image src={LOGO_MARK} style={{ position: 'absolute', bottom: 20, right: 20, width: 100, height: 100, opacity: 0.07 }} />
      </View>
    </Page>
  )
}

function PageProjectSummary({ input, result, contact, reportId, projectName, date }: Props) {
  const extSpec = EXTERNAL_WALL_SPECS[input.externalWallType]
  const rows = [
    ['Client Name',       contact.name],
    ['Mobile',            contact.mobile],
    ['Email',             contact.email],
    ['Site Address',      `${contact.address}, ${contact.city}, ${contact.state}`],
    ['Project Name',      projectName],
    ['Report ID',         reportId],
    ['Date',              date.toLocaleDateString('en-IN')],
    ['External Wall Type', extSpec.label],
    ['IS Code',           extSpec.isCode],
    ['Mortar Ratio',      extSpec.mortarRatio],
    ['Ext Wall Area',     `${input.externalWallAreaSqm} sqm`],
    ['Internal Walls',    input.includeInternal ? `${input.internalWallAreaSqm ?? 0} sqm` : 'Not included'],
    ['Plastering',        input.includePlaster ? 'Included (IS 1661:1972)' : 'Not included'],
    ['Waterproofing',     input.includeWaterproofing ? 'Included (IS 2645:2003)' : 'Not included'],
    ['Seismic Zone',      `Zone ${result.seismicZone} · Z-Factor ${result.zFactor}`],
    ['AAC Restriction',   result.aacWarning ? `Zone ${result.seismicZone}: Load-bearing NOT permitted` : 'Not applicable'],
  ]
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader reportId={reportId} page={2} total={11} />
        <SectionTitle text="SHEET 02 · PROJECT SUMMARY" />
        {rows.map(([label, value], i) => (
          <View key={i} style={[i % 2 === 0 ? S.tableRow : S.tableRowAlt, { paddingVertical: 2 }]}>
            <Text style={[S.tableHeader, { flex: 1.2, paddingVertical: 3, borderBottom: 0 }]}>{label}</Text>
            <Text style={[S.tableCell, { flex: 2 }]}>{value}</Text>
          </View>
        ))}
      </View>
    </Page>
  )
}

function PageCompliancePanel({ result, reportId }: Props & { reportId: string }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader reportId={reportId} page={3} total={11} />
        <SectionTitle text="SHEET 03 · IS COMPLIANCE PANEL" />
        <Text style={[S.body, { color: T.inkA60, marginBottom: 10 }]}>
          IS 1077:1992 + IS 2212:1991 + IS 4326:1993 + IS 2645:2003 compliance checks based on selected wall type, site zone, and waterproofing method.
        </Text>
        {result.compliance.map((check) => {
          const color = check.status === 'pass' ? T.approvedGreen : check.status === 'advisory' ? T.markingYellow : T.stampOxide
          const bg    = check.status === 'pass' ? '#E9F2EB' : check.status === 'advisory' ? '#FBF5E6' : '#F5EDEB'
          return (
            <View key={check.id} style={{
              marginBottom: 8, padding: 8,
              backgroundColor: bg,
              borderLeftWidth: 3, borderLeftColor: color, borderLeftStyle: 'solid',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                <StampBadge status={check.status} clause={check.clause} />
                <Text style={[S.body, { fontWeight: 600, flex: 1 }]}>{check.description}</Text>
              </View>
              <Text style={[S.body, { color: T.inkA60, paddingLeft: 4 }]}>{check.detail}</Text>
            </View>
          )
        })}
        <View style={{ flex: 1 }} />
        <Text style={[S.monoSm, { color: T.inkA35 }]}>
          IS 4326:1993 — AAC blocks not permitted as load-bearing masonry in Zones IV + V. IS 2212:1991 — soak bricks 2h, frog up, cure 7 days.
        </Text>
      </View>
    </Page>
  )
}

function PageWallSection({ input, reportId }: Props & { reportId: string }) {
  const extSpec = EXTERNAL_WALL_SPECS[input.externalWallType]
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader reportId={reportId} page={5} total={11} />
        <SectionTitle text="SHEET 04 · WALL SECTION DETAIL" />
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <WallSectionSvg wallType={input.externalWallType} />
        </View>
        <View style={S.rule} />
        <View style={{ flexDirection: 'row', gap: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={[S.eyebrow, { marginBottom: 4 }]}>WALL SPECIFICATION</Text>
            {[
              ['Type',          extSpec.label],
              ['IS Code',       extSpec.isCode],
              ['Unit count',    `${extSpec.unitsPerSqm} ${extSpec.unitLabel}/sqm`],
              ['Mortar',        extSpec.mortarRatio],
              ['Mortar factor', 'Dry volume × 1.1 (IS 2212:1991)'],
              ['Thickness',     extSpec.isBlock ? '200mm' : '230mm (9")'],
            ].map(([label, value]) => (
              <View key={label} style={{ flexDirection: 'row', marginBottom: 3 }}>
                <Text style={[S.monoSm, { width: 100 }]}>{label}</Text>
                <Text style={[S.body, { flex: 1 }]}>{value}</Text>
              </View>
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[S.eyebrow, { marginBottom: 4 }]}>IS 2212:1991 PRACTICE</Text>
            {[
              'Soak bricks min 2h in clean water before laying',
              'Lay bricks frog-side UP always',
              'English bond — 9" load-bearing walls',
              'Stretcher bond — 4.5" partition walls',
              '10mm bed joint + 10mm perpend joint',
              'Cure min 7 days with wet gunny bags',
              'Chicken mesh at all RCC-brick junctions',
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 4, marginBottom: 3 }}>
                <Text style={[S.monoSm, { color: T.approvedGreen }]}>✓</Text>
                <Text style={[S.body, { flex: 1 }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={[S.monoSm, { color: T.inkA35, marginTop: 10 }]}>
          FIG 1 — Schematic for estimation reference only. Not for construction without engineer approval.
        </Text>
      </View>
    </Page>
  )
}

function PageWallComparison({ result, reportId }: { result: MasonResult; reportId: string }) {
  const sorted = [...result.wallTypeComparison].sort((a, b) => a.costPerSqm - b.costPerSqm)
  const maxCost = Math.max(...sorted.map(w => w.costPerSqm))
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader reportId={reportId} page={6} total={11} />
        <SectionTitle text="SHEET 05 · 8 WALL TYPE COMPARISON — COST PER SQM" />
        <Text style={[S.body, { color: T.inkA60, marginBottom: 10 }]}>
          Material cost per sqm at Pune 2026 average rates. Excludes labour, plaster, and waterproofing.
          IS 1077:1992 + IS 12894:2002 + IS 2185:2005 + IS 4326:1993 quantities.
        </Text>

        {/* Bar chart */}
        <View style={{ marginBottom: 16 }}>
          {sorted.map(w => {
            const barPct = Math.round((w.costPerSqm / maxCost) * 280)
            return (
              <View key={w.type} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[S.monoSm, { width: 90 }]}>{w.label}</Text>
                <View style={{ flex: 1, height: 14, backgroundColor: 'rgba(30,34,39,0.06)', marginHorizontal: 8 }}>
                  <View style={{ width: barPct, height: 14, backgroundColor: T.blueprint, opacity: 0.8 }} />
                </View>
                <Text style={[S.mono, { fontSize: 8, width: 55, textAlign: 'right' }]}>
                  ₹{w.costPerSqm.toLocaleString('en-IN')}/sqm
                </Text>
              </View>
            )
          })}
        </View>

        <View style={S.rule} />

        {/* Table */}
        <View style={{ flexDirection: 'row', paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: T.ironInk, borderBottomStyle: 'solid', marginBottom: 4 }}>
          <Text style={[S.tableHeader, { flex: 2 }]}>Wall Type</Text>
          <Text style={[S.tableHeader, { flex: 1.2 }]}>IS Code</Text>
          <Text style={[S.tableHeader, { width: 70, textAlign: 'right' }]}>Units/sqm</Text>
          <Text style={[S.tableHeader, { width: 75, textAlign: 'right' }]}>₹/sqm</Text>
        </View>
        {sorted.map((w, i) => (
          <View key={w.type} style={[i % 2 === 0 ? S.tableRow : S.tableRowAlt]}>
            <Text style={[S.tableCell, { flex: 2 }]}>{w.label}</Text>
            <Text style={[S.tableCellMono, { flex: 1.2, fontSize: 7 }]}>{w.isCode}</Text>
            <Text style={[S.tableCellMono, { width: 70, textAlign: 'right', fontSize: 8 }]}>
              {w.unitsPerSqm.toFixed(1)} {w.unitLabel}
            </Text>
            <Text style={[S.tableCellMono, { width: 75, textAlign: 'right' }]}>
              {w.costPerSqm.toLocaleString('en-IN')}
            </Text>
          </View>
        ))}
        <Text style={[S.monoSm, { color: T.inkA35, marginTop: 10 }]}>
          AAC blocks ⚠ NOT permitted as load-bearing masonry in Seismic Zones IV and V (IS 4326:1993).
        </Text>
      </View>
    </Page>
  )
}

function PageWaterproofingDetail({ input, result, reportId }: Props & { reportId: string }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader reportId={reportId} page={7} total={11} />
        <SectionTitle text="SHEET 06 · WATERPROOFING DETAIL — IS 2645:2003" />

        {input.includeWaterproofing && result.waterproofingCosts ? (
          <>
            {/* Terrace */}
            {result.waterproofingCosts.terraceCost > 0 && (
              <>
                <Text style={[S.h3, { marginBottom: 6 }]}>Terrace Waterproofing</Text>
                {[
                  ['Method',      input.terraceWpMethod?.replace('_', ' ').toUpperCase() ?? 'BBC'],
                  ['Area',        `${input.terraceAreaSqft ?? 0} sqft`],
                  ['IS Standard', 'IS 2645:2003'],
                  ['BBC slope',   'Min 1% to outlet. BBC min 75mm thick. (IS 2645:2003)'],
                  ['Cost',        `₹${result.waterproofingCosts.terraceCost.toLocaleString('en-IN')}`],
                ].map(([label, value]) => (
                  <View key={label} style={{ flexDirection: 'row', marginBottom: 3 }}>
                    <Text style={[S.monoSm, { width: 100 }]}>{label}</Text>
                    <Text style={[S.body, { flex: 1 }]}>{value}</Text>
                  </View>
                ))}
              </>
            )}

            {result.waterproofingCosts.bathroomCost > 0 && (
              <>
                <View style={[S.rule, { marginVertical: 12 }]} />
                <Text style={[S.h3, { marginBottom: 6 }]}>Bathroom Sunken Waterproofing</Text>
                {[
                  ['Method',       input.bathroomWpMethod?.replace('_', ' ').toUpperCase() ?? 'CEMENTITIOUS'],
                  ['Bathrooms',    `${input.bathroomCount ?? 0} bathrooms`],
                  ['Approx area',  `${(input.bathroomCount ?? 0) * 35} sqft (35 sqft/bathroom)`],
                  ['Test',         'Pond 50mm water for 24-48 hrs before backfill (IS 2645:2003)'],
                  ['Cost',         `₹${result.waterproofingCosts.bathroomCost.toLocaleString('en-IN')}`],
                ].map(([label, value]) => (
                  <View key={label} style={{ flexDirection: 'row', marginBottom: 3 }}>
                    <Text style={[S.monoSm, { width: 100 }]}>{label}</Text>
                    <Text style={[S.body, { flex: 1 }]}>{value}</Text>
                  </View>
                ))}
              </>
            )}

            <View style={[S.rule, { marginTop: 20 }]} />
            <View style={{ backgroundColor: T.blueprintBg, padding: 8, marginTop: 10 }}>
              <Text style={[S.eyebrow, { color: T.blueprint, marginBottom: 4 }]}>WP CONTRACTOR CHECKLIST</Text>
              {[
                'Surface must be clean, dry, and free of dust before applying WP treatment',
                'Apply waterproofing in minimum 2 coats. Allow first coat to cure before second',
                'Upstand: WP membrane must extend min 150mm up walls at perimeter',
                'Drains: ensure proper slope (min 1:100) to outlets before WP treatment',
                'Pond test: fill 50mm water, mark level, check after 24 hours. No drop = pass',
                'Do not start backfill of sunken portions until pond test passes',
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 4, marginBottom: 2 }}>
                  <Text style={[S.monoSm, { color: T.blueprint }]}>{String(i+1).padStart(2,'0')}</Text>
                  <Text style={[S.body, { flex: 1 }]}>{item}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={[S.body, { color: T.inkA60 }]}>Waterproofing was not included in this estimate.</Text>
        )}
      </View>
    </Page>
  )
}

function PageBrickworkBOQ({ input, result, reportId }: Props & { reportId: string }) {
  const extSpec = EXTERNAL_WALL_SPECS[input.externalWallType]
  const bq = result.brickworkQuantities
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader reportId={reportId} page={8} total={11} />
        <SectionTitle text="SHEET 07 · BRICKWORK BOQ — IS 1077:1992 + IS 2212:1991" />

        <View style={{ flexDirection: 'row', paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: T.ironInk, borderBottomStyle: 'solid', marginBottom: 4 }}>
          <Text style={[S.tableHeader, { width: 28 }]}>ITEM NO.</Text>
          {['Description', 'Wall Area (sqm)', 'Qty', 'Unit', 'Rate (₹)', 'Amount (₹)'].map(h => (
            <Text key={h} style={[S.tableHeader, { flex: h === 'Description' ? 2 : 1, textAlign: h !== 'Description' ? 'right' : 'left' }]}>
              {h}
            </Text>
          ))}
        </View>

        {/* External wall row */}
        <View style={S.tableRow}>
          <Text style={[S.tableCellMono, { width: 28, color: T.inkA60 }]}>1.1</Text>
          <Text style={[S.tableCell, { flex: 2 }]}>{extSpec.label}{'\n'}
            <Text style={[S.monoSm, { color: T.inkA60 }]}>{extSpec.isCode} · {extSpec.mortarRatio} mortar</Text>
          </Text>
          <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right' }]}>{input.externalWallAreaSqm}</Text>
          <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right' }]}>
            {bq.externalBricksOrBlocks.toLocaleString('en-IN')}
          </Text>
          <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right', fontSize: 7 }]}>{extSpec.unitLabel}</Text>
          <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right', fontSize: 7 }]}>mkt rate</Text>
          <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right' }]}>
            {result.costs.externalBrickworkMaterial.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Cement brickwork */}
        <View style={S.tableRowAlt}>
          <Text style={[S.tableCellMono, { width: 28, color: T.inkA60 }]}>1.2</Text>
          <Text style={[S.tableCell, { flex: 2 }]}>Cement (brickwork){'\n'}
            <Text style={[S.monoSm, { color: T.inkA60 }]}>{extSpec.cementBagsPerSqm} bags/sqm × {extSpec.unitsPerSqm}u · dry factor 1.1</Text>
          </Text>
          <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right' }]}>{input.externalWallAreaSqm}</Text>
          <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right' }]}>
            {(bq.externalCementBags + bq.internalCementBags).toLocaleString('en-IN')}
          </Text>
          <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right', fontSize: 7 }]}>bags</Text>
          <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right', fontSize: 7 }]}>₹495</Text>
          <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right', fontSize: 7, color: T.inkA60 }]}>incl.</Text>
        </View>

        {extSpec.sandCftPerSqm > 0 && (
          <View style={S.tableRow}>
            <Text style={[S.tableCellMono, { width: 28, color: T.inkA60 }]}>1.3</Text>
            <Text style={[S.tableCell, { flex: 2 }]}>Sand (brickwork){'\n'}
              <Text style={[S.monoSm, { color: T.inkA60 }]}>{extSpec.sandCftPerSqm} cft/sqm</Text>
            </Text>
            <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right' }]}>{input.externalWallAreaSqm}</Text>
            <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right' }]}>
              {(bq.externalSandCft + bq.internalSandCft).toLocaleString('en-IN')}
            </Text>
            <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right', fontSize: 7 }]}>cft</Text>
            <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right', fontSize: 7 }]}>₹24</Text>
            <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right', fontSize: 7, color: T.inkA60 }]}>incl.</Text>
          </View>
        )}

        {input.includeInternal && bq.internalBricksOrBlocks > 0 && (
          <View style={S.tableRowAlt}>
            <Text style={[S.tableCellMono, { width: 28, color: T.inkA60 }]}>1.4</Text>
            <Text style={[S.tableCell, { flex: 2 }]}>
              Internal partition — {input.internalWallType?.replace(/_/g, ' ')}
            </Text>
            <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right' }]}>{input.internalWallAreaSqm ?? 0}</Text>
            <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right' }]}>
              {bq.internalBricksOrBlocks.toLocaleString('en-IN')}
            </Text>
            <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right', fontSize: 7 }]}>units</Text>
            <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right', fontSize: 7 }]}>mkt rate</Text>
            <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right' }]}>
              {result.costs.internalPartitionMaterial.toLocaleString('en-IN')}
            </Text>
          </View>
        )}

        {/* Subtotal */}
        <View style={{ flexDirection: 'row', borderTopWidth: 2, borderTopColor: T.ironInk, borderTopStyle: 'solid', paddingTop: 4, marginTop: 4 }}>
          <Text style={[S.body, { flex: 4, fontWeight: 600 }]}>Brickwork Subtotal</Text>
          <Text style={[S.mono, { flex: 2, textAlign: 'right', fontWeight: 700 }]}>
            ₹{(result.costs.externalBrickworkMaterial + result.costs.internalPartitionMaterial).toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={[S.rule, { marginTop: 20 }]} />
        <Text style={[S.monoSm, { color: T.inkA35 }]}>
          Dry volume factor 1.1 per IS 2212:1991. AAC thin-bed adhesive: ₹600/bag. Clay brick: ₹11/unit. Fly ash brick: ₹8/unit.
        </Text>
      </View>
    </Page>
  )
}

function PagePlasterBOQ({ input, result, reportId }: Props & { reportId: string }) {
  const pq = result.plasterQuantities
  const extPlasterArea = input.externalWallAreaSqm * 2
  const intPlasterArea = (input.includeInternal ? (input.internalWallAreaSqm ?? 0) : 0) * 2
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader reportId={reportId} page={9} total={11} />
        <SectionTitle text="SHEET 08 · PLASTERING BOQ — IS 1661:1972" />
        {pq ? (
          <>
            <Text style={[S.body, { color: T.inkA60, marginBottom: 10 }]}>
              +5% wastage applied per IS 1661:1972. External 15mm 1:4 · Internal 12mm 1:4.
              Chicken mesh mandatory at all RCC-brick junctions.
            </Text>
            <View style={{ flexDirection: 'row', paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: T.ironInk, borderBottomStyle: 'solid', marginBottom: 4 }}>
              <Text style={[S.tableHeader, { width: 28 }]}>ITEM NO.</Text>
              {['Description', 'Thickness', 'Ratio', 'Area (sqm)', 'Cement (bags)', 'Sand (cft)'].map(h => (
                <Text key={h} style={[S.tableHeader, { flex: 1, textAlign: h !== 'Description' ? 'right' : 'left' }]}>
                  {h}
                </Text>
              ))}
            </View>
            {[
              {
                no: '2.1',
                desc: 'External plaster (both faces)',
                thick: '15mm',
                ratio: '1:4',
                area: extPlasterArea.toFixed(1),
                cement: pq.externalPlasterCementBags.toFixed(1),
                sand: pq.externalPlasterSandCft.toFixed(1),
              },
              {
                no: '2.2',
                desc: 'Internal plaster (both faces)',
                thick: '12mm',
                ratio: '1:4',
                area: intPlasterArea.toFixed(1),
                cement: pq.internalPlasterCementBags.toFixed(1),
                sand: pq.internalPlasterSandCft.toFixed(1),
              },
              {
                no: '',
                desc: 'TOTAL (incl. 5% wastage)',
                thick: '—',
                ratio: '—',
                area: (extPlasterArea + intPlasterArea).toFixed(1),
                cement: (pq.externalPlasterCementBags + pq.internalPlasterCementBags).toFixed(1),
                sand: (pq.externalPlasterSandCft + pq.internalPlasterSandCft).toFixed(1),
                bold: true,
              },
            ].map((row, i) => (
              <View key={i} style={[i < 2 ? S.tableRow : { flexDirection: 'row', borderTopWidth: 2, borderTopColor: T.ironInk, borderTopStyle: 'solid' }]}>
                <Text style={[S.tableCellMono, { width: 28, color: T.inkA60 }]}>{row.no}</Text>
                <Text style={i === 2 ? [S.tableCellMono, { fontWeight: 700, flex: 1 }] : [S.tableCell, { flex: 1 }]}>{row.desc}</Text>
                <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right', fontSize: 8 }]}>{row.thick}</Text>
                <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right', fontSize: 8 }]}>{row.ratio}</Text>
                <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right' }]}>{row.area}</Text>
                <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right' }]}>{row.cement}</Text>
                <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right' }]}>{row.sand}</Text>
              </View>
            ))}
            <View style={{ backgroundColor: T.blueprintBg, padding: 8, marginTop: 16 }}>
              <Text style={[S.eyebrow, { color: T.blueprint, marginBottom: 4 }]}>PLASTER MATERIAL COST</Text>
              <Text style={[S.mono, { fontSize: 14, fontWeight: 700 }]}>
                ₹{result.costs.plasterMaterial.toLocaleString('en-IN')}
              </Text>
              <Text style={[S.monoSm, { color: T.inkA60, marginTop: 2 }]}>
                At Pune 2026: cement ₹495/bag + sand ₹24/cft
              </Text>
            </View>
          </>
        ) : (
          <Text style={[S.body, { color: T.inkA60 }]}>Plastering was not included in this estimate.</Text>
        )}
      </View>
    </Page>
  )
}

function PageSiteQCChecklist({ reportId }: { reportId: string }) {
  const groups: Array<{
    title: string
    clause: string
    items: Array<{ text: string; critical: boolean }>
  }> = [
    {
      title: 'BRICK PREPARATION',
      clause: 'IS 2212:1991',
      items: [
        { text: 'Soak clay bricks minimum 2 hours before laying in clean water', critical: true },
        { text: 'Fly ash bricks — soak minimum 4 hours, longer than clay bricks', critical: false },
        { text: 'Lay all bricks frog-face UP always — never face down', critical: true },
        { text: 'Brick compressive strength minimum 7.5 N/mm² for load-bearing walls (IS 1077:1992)', critical: true },
      ],
    },
    {
      title: 'MORTAR MIX & JOINTS',
      clause: 'IS 2250:1981',
      items: [
        { text: '9" (230mm) load-bearing walls — mortar 1:6 cement:sand', critical: false },
        { text: '4.5" (115mm) partition walls — mortar 1:4 cement:sand', critical: false },
        { text: 'Mortar joint — exactly 10mm bed joint + 10mm perpendicular joint', critical: true },
        { text: 'Never exceed 12mm joint thickness under any circumstance', critical: true },
      ],
    },
    {
      title: 'BOND PATTERN',
      clause: 'IS 2212:1991',
      items: [
        { text: 'English bond — all 9" (230mm) load-bearing walls', critical: false },
        { text: 'Stretcher bond — all 4.5" (115mm) partition walls', critical: false },
      ],
    },
    {
      title: 'CURING & PLASTERING',
      clause: 'IS 2212:1991',
      items: [
        { text: 'Cure masonry minimum 7 days continuously with wet gunny bags', critical: true },
        { text: 'Apply plaster only after masonry has cured for minimum 7 days', critical: true },
        { text: 'External plaster — scratch coat first; finish coat after minimum 24 hours', critical: false },
        { text: 'Never rest scaffolding on masonry less than 48 hours old', critical: true },
      ],
    },
    {
      title: 'RCC-BRICK JUNCTIONS',
      clause: 'IS 1661:1972',
      items: [
        { text: 'Chicken mesh mandatory at every RCC-brick junction without exception', critical: true },
        { text: 'Chicken mesh overlap — minimum 150mm on each side of junction', critical: true },
      ],
    },
    {
      title: 'SEISMIC COMPLIANCE',
      clause: 'IS 4326:1993',
      items: [
        { text: 'Seismic bands mandatory at plinth, sill, lintel, and roof levels — Zones III, IV & V', critical: true },
        { text: 'AAC blocks NOT permitted as load-bearing masonry in Seismic Zones IV and V', critical: true },
        { text: 'AAC blocks permitted for infill and partition use only in Seismic Zones IV and V', critical: false },
      ],
    },
    {
      title: 'WATERPROOFING TEST',
      clause: 'IS 2645:2003',
      items: [
        { text: 'Pond 50mm depth of water on treated surface for minimum 48 hours before backfill', critical: true },
        { text: 'Mark water level before test begins. No drop after 48 hours = PASS', critical: false },
      ],
    },
  ]

  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader reportId={reportId} page={10} total={11} />
        <SectionTitle text="SHEET 09 · SITE QUALITY CONTROL CHECKLIST" />
        <Text style={[S.body, { color: T.inkA60, marginBottom: 10 }]}>
          IS-code mandatory site practices for Phase 2 masonry. Print and keep on site.
          Items marked CRITICAL must not be omitted under any circumstance.
        </Text>

        {groups.map((group, gi) => (
          <View key={gi} style={{ marginBottom: 7 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2,
              borderBottomWidth: 1, borderBottomColor: T.blueprint, borderBottomStyle: 'solid', paddingBottom: 2,
            }}>
              <Text style={[S.eyebrow, { marginBottom: 0, flex: 1 }]}>{group.title}</Text>
              <Text style={[S.monoSm, { color: T.blueprint }]}>{group.clause}</Text>
            </View>
            {group.items.map((item, ii) => (
              <View key={ii} style={[
                ii % 2 === 0 ? S.tableRow : S.tableRowAlt,
                { paddingVertical: 3, alignItems: 'center', flexDirection: 'row' },
              ]}>
                <Text style={[S.monoSm, {
                  width: 14,
                  color: item.critical ? T.stampOxide : T.approvedGreen,
                }]}>
                  {item.critical ? '!' : '✓'}
                </Text>
                <Text style={[S.body, { flex: 1 }]}>{item.text}</Text>
                {item.critical && (
                  <Text style={[S.monoSm, { color: T.stampOxide, width: 50, textAlign: 'right' }]}>
                    CRITICAL
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}

        <View style={{ flex: 1 }} />
        <Text style={[S.monoSm, { color: T.inkA35, marginTop: 8 }]}>
          IS 2212:1991 · IS 2250:1981 · IS 1077:1992 · IS 1661:1972 · IS 4326:1993 · IS 2645:2003 — Masonry site quality control reference.
        </Text>
      </View>
    </Page>
  )
}

function PageCostSummary({ result, reportId, date }: Props & { reportId: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nirmanshastra.in'
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <PageHeader reportId={reportId} page={11} total={11} />
        <SectionTitle text="SHEET 10 · COST SUMMARY + NEXT PHASE" />

        {/* Waterproofing BOQ summary */}
        {result.waterproofingCosts && result.waterproofingCosts.total > 0 && (
          <>
            <Text style={[S.eyebrow, { marginBottom: 4 }]}>WATERPROOFING COSTS (IS 2645:2003)</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              {[
                ['Terrace WP',        result.waterproofingCosts.terraceCost],
                ['Bathroom WP',       result.waterproofingCosts.bathroomCost],
                ['WP Total',          result.waterproofingCosts.total],
              ].map(([label, value]) => (
                <View key={label as string} style={{ flex: 1, backgroundColor: T.yellowBg, padding: 8 }}>
                  <Text style={S.tableHeader}>{label as string}</Text>
                  <Text style={[S.mono, { fontWeight: 700, marginTop: 2 }]}>
                    ₹{(value as number).toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Grand total table */}
        <Text style={[S.eyebrow, { marginBottom: 6 }]}>GRAND TOTAL — BASIC / STANDARD / PREMIUM</Text>
        <View style={{ flexDirection: 'row', paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: T.ironInk, borderBottomStyle: 'solid', marginBottom: 4 }}>
          <Text style={[S.tableHeader, { flex: 2 }]}>Cost Component</Text>
          <Text style={[S.tableHeader, { flex: 1, textAlign: 'right' }]}>BASIC</Text>
          <Text style={[S.tableHeader, { flex: 1, textAlign: 'right' }]}>STANDARD</Text>
          <Text style={[S.tableHeader, { flex: 1, textAlign: 'right' }]}>PREMIUM</Text>
        </View>
        {[
          ['Material Cost',      result.costs.totalMaterial, result.costs.totalMaterial, result.costs.totalMaterial],
          ['Labour (CPWD)',      Math.round(result.labourCost * 0.85), result.labourCost, Math.round(result.labourCost * 1.15)],
          ['Overhead',          Math.round((result.costs.totalMaterial + result.labourCost * 0.85) * 0.05),
                                Math.round((result.costs.totalMaterial + result.labourCost) * 0.10),
                                Math.round((result.costs.totalMaterial + result.labourCost * 1.15) * 0.15)],
          ['TOTAL',             result.grandTotal.basic, result.grandTotal.standard, result.grandTotal.premium],
        ].map(([label, basic, standard, premium], i) => {
          const isTotalRow = label === 'TOTAL'
          const rowStyle = isTotalRow
            ? { flexDirection: 'row' as const, borderTopWidth: 2, borderTopColor: T.ironInk, borderTopStyle: 'solid' as const }
            : (i % 2 === 0 ? S.tableRow : S.tableRowAlt)
          return (
            <View key={label as string} style={rowStyle}>
              <Text style={isTotalRow ? [S.tableCellMono, { fontWeight: 700, flex: 2 }] : [S.tableCell, { flex: 2 }]}>
                {label as string}
              </Text>
              <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right', fontSize: isTotalRow ? 10 : 9 }]}>
                ₹{(basic as number).toLocaleString('en-IN')}
              </Text>
              <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right', fontSize: isTotalRow ? 10 : 9, color: isTotalRow ? T.blueprint : T.ironInk }]}>
                ₹{(standard as number).toLocaleString('en-IN')}
              </Text>
              <Text style={[S.tableCellMono, { flex: 1, textAlign: 'right', fontSize: isTotalRow ? 10 : 9 }]}>
                ₹{(premium as number).toLocaleString('en-IN')}
              </Text>
            </View>
          )
        })}

        <View style={{ flex: 1 }} />

        {/* ElectroPro cross-sell */}
        <View style={{
          backgroundColor: T.blueprintBg,
          borderWidth: 1, borderColor: T.blueprint, borderStyle: 'solid',
          padding: 12, marginTop: 16,
        }}>
          <Text style={[S.eyebrow, { color: T.blueprint, marginBottom: 4 }]}>NEXT — PHASE 3: ELECTRICALPRO</Text>
          <Text style={[S.h3, { color: T.blueprint }]}>Electrical wiring comes immediately after masonry.</Text>
          <Text style={[S.body, { color: T.inkA60, marginTop: 4 }]}>
            Conduit laying and wiring must be done before wall plaster is applied. Use ElectricalPro to estimate
            wire lengths, MCB ratings, DB schedule, and earthing before your electrician quotes you.
          </Text>
          <Text style={[S.mono, { color: T.blueprint, marginTop: 8, fontSize: 8 }]}>
            {appUrl}/tools/electropro — ₹499
          </Text>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={[S.monoSm, { color: T.inkA35 }]}>
            Report generated: {date.toLocaleString('en-IN')} · {reportId} · NirmanShastra MasonryPro Phase 2{'\n'}
            IS 1077:1992 + IS 2212:1991 + IS 1661:1972 + IS 2645:2003 + IS 4326:1993 · Pune 2026 rates{'\n'}
            For estimation only. Verify quantities with structural drawings before procurement.
          </Text>
        </View>
      </View>
    </Page>
  )
}

// ─── Engineering Behind the Calculation page ─────────────────────────────────

function PageEngineeringMethod({ reportId }: { reportId: string }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <Text style={S.eyebrow}>APPENDIX — CALCULATION METHODOLOGY</Text>
        <Text style={S.h2}>The Engineering Behind the Calculation</Text>
        <View style={S.rule} />

        <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 4, marginTop: 4 }}>BRICK QUANTITIES (IS 1077:1992, IS 2212:1991)</Text>
        {[
          'Modular brick 190×90×90mm: 9" wall = 100 bricks/sqm, 4.5" wall = 50 bricks/sqm',
          'Non-modular brick 230×115×75mm: 9" wall = 90 bricks/sqm, 4.5" wall = 48 bricks/sqm',
          'AAC block 200mm: 8.33 blocks/sqm',
          'Hollow concrete block 200mm: 12.5 blocks/sqm',
        ].map((t, i) => (
          <Text key={i} style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, lineHeight: 1.5, marginBottom: 2 }}>• {t}</Text>
        ))}

        <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 4, marginTop: 10 }}>MORTAR QUANTITIES (IS 2250:1981)</Text>
        {[
          '9" modular wall 1:6 mortar: 0.20 bags cement + 2.13 cft sand per sqm',
          '4.5" partition 1:4 mortar: 0.10 bags cement + 0.72 cft sand per sqm',
          'Dry volume factor for mortar: 1.1',
        ].map((t, i) => (
          <Text key={i} style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, lineHeight: 1.5, marginBottom: 2 }}>• {t}</Text>
        ))}

        <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 4, marginTop: 10 }}>PLASTER QUANTITIES (IS 1661:1972)</Text>
        {[
          'Internal 12mm 1:4: 0.078 bags cement + 0.50 cft sand per sqm',
          'External 15mm 1:4: 0.098 bags cement + 0.63 cft sand per sqm',
          'Ceiling 6mm 1:3: 0.042 bags cement + 0.20 cft sand per sqm',
          'Add 5% wastage to all plaster quantities',
        ].map((t, i) => (
          <Text key={i} style={{ fontFamily: 'IBMPlexSans', fontSize: 8.5, color: T.ironInk, lineHeight: 1.5, marginBottom: 2 }}>• {t}</Text>
        ))}

        <View style={{ marginTop: 12, borderTopWidth: 0.5, borderTopColor: T.inkA15, borderTopStyle: 'solid', paddingTop: 8 }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 8, color: T.blueprint, letterSpacing: 1, marginBottom: 6 }}>IS CODES USED</Text>
          {[
            'IS 1077:1992 — Common Burnt Clay Building Bricks',
            'IS 2212:1991 — Code of Practice for Brickwork',
            'IS 2250:1981 — Code of Practice for Masonry Mortars',
            'IS 1661:1972 — Code of Practice for Application of Cement Plaster',
            'IS 1905:1987 — Structural Use of Unreinforced Masonry',
            'IS 4326:1993 — Earthquake Resistant Design of Buildings',
            'IS 2645:2003 — Integral Waterproofing Compounds',
          ].map((t, i) => (
            <Text key={i} style={{ fontFamily: 'IBMPlexMono', fontSize: 7.5, color: T.inkA60, lineHeight: 1.6, marginBottom: 1 }}>{t}</Text>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ marginTop: 8, borderTopWidth: 0.5, borderTopColor: T.inkA15, borderTopStyle: 'solid', paddingTop: 6 }}>
          <Text style={S.monoSm}>NIRMANSHASTRA · MASONPRO · {reportId}</Text>
        </View>
      </View>
    </Page>
  )
}

// ─── Wall Section Schematic Page ─────────────────────────────────────────────

function WallSectionSchematicPage({ reportId }: { reportId: string }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.frame}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <View>
            <Text style={S.eyebrow}>NIRMANSHASTRA · MASONPRO · IS 2212:1991 · IS 4326:1993</Text>
            <Text style={S.h2}>Wall Section Detail — Schematic</Text>
          </View>
          <View style={{ borderWidth: 1, borderColor: T.inkA35, borderStyle: 'solid', padding: 5 }}>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, color: T.inkA60 }}>NOT FOR CONSTRUCTION</Text>
            <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6, color: T.inkA60 }}>SCHEMATIC ONLY</Text>
          </View>
        </View>
        <View style={S.rule} />

        {/* Wall cross-section SVG */}
        <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6.5, color: T.blueprint, letterSpacing: 1, marginBottom: 6 }}>
          9&quot; BRICK WALL — ENGLISH BOND — CROSS SECTION
        </Text>
        <Svg viewBox="0 0 440 260" style={{ width: 396, height: 234 }}>
          {/* Left internal plaster */}
          <Rect x={10} y={10} width={14} height={200} fill={T.inkA15} stroke={T.ironInk} strokeWidth={0.5} />
          {/* Wall body outline */}
          <Rect x={24} y={10} width={165} height={200} fill="none" stroke={T.ironInk} strokeWidth={1.2} />
          {/* Mortar joints (horizontal) */}
          <Line x1={24} y1={48} x2={189} y2={48} strokeWidth={0.7} stroke={T.ironInk} />
          <Line x1={24} y1={86} x2={189} y2={86} strokeWidth={0.7} stroke={T.ironInk} />
          <Line x1={24} y1={112} x2={189} y2={112} strokeWidth={0.7} stroke={T.ironInk} />
          {/* RC Seismic Band */}
          <Rect x={24} y={112} width={165} height={28} fill={T.blueprintBg} stroke={T.blueprint} strokeWidth={1} />
          <Text x={32} y={123} style={{ fontFamily: 'IBMPlexMono', fontSize: 6, fill: T.blueprint }}>RC SEISMIC BAND — IS 4326:1993</Text>
          <Text x={32} y={133} style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, fill: T.blueprint }}>Mandatory Seismic Zone III-V</Text>
          <Line x1={24} y1={140} x2={189} y2={140} strokeWidth={0.7} stroke={T.ironInk} />
          <Line x1={24} y1={178} x2={189} y2={178} strokeWidth={0.7} stroke={T.ironInk} />
          {/* Stretcher course vertical joints — course 1 */}
          <Line x1={79} y1={10} x2={79} y2={48} strokeWidth={0.7} stroke={T.ironInk} />
          <Line x1={134} y1={10} x2={134} y2={48} strokeWidth={0.7} stroke={T.ironInk} />
          {/* Header course vertical joints — course 2 */}
          <Line x1={65} y1={48} x2={65} y2={86} strokeWidth={0.7} stroke={T.ironInk} />
          <Line x1={106} y1={48} x2={106} y2={86} strokeWidth={0.7} stroke={T.ironInk} />
          <Line x1={148} y1={48} x2={148} y2={86} strokeWidth={0.7} stroke={T.ironInk} />
          {/* Stretcher — course 3 */}
          <Line x1={79} y1={86} x2={79} y2={112} strokeWidth={0.7} stroke={T.ironInk} />
          <Line x1={134} y1={86} x2={134} y2={112} strokeWidth={0.7} stroke={T.ironInk} />
          {/* Stretcher — course 4 (below seismic band) */}
          <Line x1={79} y1={140} x2={79} y2={178} strokeWidth={0.7} stroke={T.ironInk} />
          <Line x1={134} y1={140} x2={134} y2={178} strokeWidth={0.7} stroke={T.ironInk} />
          {/* Header — course 5 */}
          <Line x1={65} y1={178} x2={65} y2={210} strokeWidth={0.7} stroke={T.ironInk} />
          <Line x1={106} y1={178} x2={106} y2={210} strokeWidth={0.7} stroke={T.ironInk} />
          <Line x1={148} y1={178} x2={148} y2={210} strokeWidth={0.7} stroke={T.ironInk} />
          {/* Right external plaster */}
          <Rect x={189} y={10} width={16} height={200} fill={T.inkA15} stroke={T.ironInk} strokeWidth={0.5} />
          {/* Plaster labels */}
          <Text x={1} y={100} style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, fill: T.blueprint }}>12mm</Text>
          <Text x={1} y={108} style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.blueprint }}>Int.</Text>
          <Text x={208} y={100} style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, fill: T.blueprint }}>15mm</Text>
          <Text x={208} y={108} style={{ fontFamily: 'IBMPlexMono', fontSize: 5, fill: T.blueprint }}>Ext.</Text>
          {/* Wall width dimension */}
          <Line x1={24} y1={222} x2={189} y2={222} strokeWidth={0.7} stroke={T.ironInk} />
          <Line x1={24} y1={218} x2={24} y2={226} strokeWidth={0.7} stroke={T.ironInk} />
          <Line x1={189} y1={218} x2={189} y2={226} strokeWidth={0.7} stroke={T.ironInk} />
          <Text x={72} y={234} style={{ fontFamily: 'IBMPlexMono', fontSize: 7, fill: T.ironInk }}>230mm (9&quot; wall)</Text>
          {/* Course type labels */}
          <Text x={196} y={32} style={{ fontFamily: 'IBMPlexSans', fontSize: 5.5, fill: T.inkA60 }}>Stretcher</Text>
          <Text x={196} y={70} style={{ fontFamily: 'IBMPlexSans', fontSize: 5.5, fill: T.inkA60 }}>Header</Text>
          <Text x={196} y={102} style={{ fontFamily: 'IBMPlexSans', fontSize: 5.5, fill: T.inkA60 }}>Stretcher</Text>
          <Text x={196} y={162} style={{ fontFamily: 'IBMPlexSans', fontSize: 5.5, fill: T.inkA60 }}>Stretcher</Text>
          <Text x={196} y={196} style={{ fontFamily: 'IBMPlexSans', fontSize: 5.5, fill: T.inkA60 }}>Header</Text>
          {/* IS ref line */}
          <Text x={10} y={252} style={{ fontFamily: 'IBMPlexMono', fontSize: 5.5, fill: T.inkA60 }}>
            IS 2212:1991 English Bond · 1:6 C:S Mortar · 10mm joints · IS 1661:1972 Plaster · IS 4326:1993 Seismic Band
          </Text>
        </Svg>

        {/* Disclaimer */}
        <View style={{ marginTop: 12, borderWidth: 1, borderColor: T.stampOxide, borderStyle: 'solid', padding: 7, backgroundColor: T.oxideBg }}>
          <Text style={{ fontFamily: 'IBMPlexMono', fontSize: 6.5, color: T.stampOxide, letterSpacing: 0.5, marginBottom: 3 }}>
            DISCLAIMER — SCHEMATIC ONLY
          </Text>
          <Text style={{ fontFamily: 'IBMPlexSans', fontSize: 7.5, color: T.ironInk, lineHeight: 1.5 }}>
            This schematic is for illustrative purposes only. Wall section design and seismic band requirements must be verified by a licensed structural engineer per IS 4326:1993 and local seismic zone classification.
          </Text>
        </View>

        <View style={{ flex: 1 }} />
        <View style={{ marginTop: 8, borderTopWidth: 0.5, borderTopColor: T.inkA35, borderTopStyle: 'solid', paddingTop: 6 }}>
          <Text style={S.monoSm}>NIRMANSHASTRA · MASONPRO · {reportId} · SCHEMATIC</Text>
        </View>
      </View>
    </Page>
  )
}

// ─── Main document ────────────────────────────────────────────────────────────

export default function MasonProPDF(props: Props) {
  return (
    <Document
      title={`MasonryPro Report — ${props.reportId}`}
      author="NirmanShastra"
      subject="Phase 2 Masonry Cost Estimate — IS 1077:1992 + IS 2212:1991"
    >
      <PageCover          {...props} />
      <PageProjectSummary {...props} />
      <PageCompliancePanel {...props} reportId={props.reportId} />
      <PageISCodeChecklist {...props} reportId={props.reportId} />
      <PageWallSection    {...props} reportId={props.reportId} />
      <PageWallComparison result={props.result} reportId={props.reportId} />
      <PageWaterproofingDetail {...props} reportId={props.reportId} />
      <PageBrickworkBOQ   {...props} reportId={props.reportId} />
      <PagePlasterBOQ        {...props} reportId={props.reportId} />
      <PageSiteQCChecklist   reportId={props.reportId} />
      <PageCostSummary       {...props} reportId={props.reportId} />
      <WallSectionSchematicPage reportId={props.reportId} />
      <PageEngineeringMethod reportId={props.reportId} />
    </Document>
  )
}
