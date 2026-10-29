// Shared pieces for every NirmanShastra quantity report (@react-pdf/renderer only).
// Quantities first: no rate or cost of ours. The rupee table (lib/pdf/rupee-table.tsx) is printed only from rates the customer typed. Palette is the v2 "limewash and laterite" set, never blue.

import React from 'react'
import path from 'path'
import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { CONTACT_EMAIL } from '../site-contact'

export const LOGO_MARK = path.join(process.cwd(), 'public', 'brand', 'real', 'mark-dark-256.png')
const FONT = (name: string) => path.join(process.cwd(), 'public/fonts', name)

Font.register({
  family: 'IBMPlexSans',
  fonts: [
    { src: FONT('IBMPlexSans-Regular.ttf'), fontWeight: 400 },
    { src: FONT('IBMPlexSans-Medium.ttf'), fontWeight: 500 },
    { src: FONT('IBMPlexSans-Bold.ttf'), fontWeight: 700 },
  ],
})
Font.register({
  family: 'IBMPlexMono',
  fonts: [
    { src: FONT('IBMPlexMono-Regular.ttf'), fontWeight: 400 },
    { src: FONT('IBMPlexMono-Bold.ttf'), fontWeight: 700 },
  ],
})
Font.register({
  family: 'IBMPlexSerif',
  fonts: [
    { src: FONT('IBMPlexSerif-Regular.ttf'), fontWeight: 400 },
    { src: FONT('IBMPlexSerif-Bold.ttf'), fontWeight: 700 },
  ],
})
Font.registerHyphenationCallback(word => [word])

export const C = {
  paper: '#FAF6EC',
  card: '#F2ECDD',
  ink: '#2A2622',
  ink2: '#5B544B',
  ink3: '#8A8176',
  line: '#D8CFBD',
  charcoal: '#37332E',
  chalk: '#F3EEE2',
  laterite: '#B5502D',
  lateriteBg: '#F6E7DF',
  pass: '#2F7D5B',
  passBg: '#E4F0E9',
  warn: '#9A6A12',
  warnBg: '#F8EDD3',
  fail: '#A3322A',
  failBg: '#F6E1DE',
}

/*
  Column tints (SJ, 29 Oct 2026): in every table the columns take turns being a lighter and a slightly darker cream, from the header
  cell down to the last row, so each value sits visibly under its own header even where there are no vertical lines.
  Column 0 (first) is the lighter one. The header and total rows use the same two creams one step deeper, so they read as the ends of
  the same columns. 'input' and 'result' keep the calculation sheet's two meanings (a figure you gave / a figure that is in the report)
  in an amber and a green pair, so those rows still stand out from the cream stripes.
*/
export type Tone = 'body' | 'head' | 'input' | 'result'
const TINTS: Record<Tone, [string, string]> = {
  body: ['#FDFAF3', '#F3ECDA'],
  head: ['#EEE5CF', '#E3D8BC'],
  input: ['#FBF2D9', '#F5E8C6'],
  result: ['#E9F3EC', '#DBEBE0'],
}
export const tint = (col: number, tone: Tone = 'body'): string => TINTS[tone][col % 2]

export const S = StyleSheet.create({
  page: { backgroundColor: C.paper, paddingTop: 34, paddingBottom: 50, paddingHorizontal: 34, fontFamily: 'IBMPlexSans', fontSize: 9.5, color: C.ink },
  band: { backgroundColor: C.charcoal, borderRadius: 4, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 34, height: 35, marginRight: 10 },
  brand: { fontFamily: 'IBMPlexSerif', fontWeight: 700, fontSize: 15, color: C.chalk },
  brandSub: { fontFamily: 'IBMPlexMono', fontSize: 7, color: '#C9C0AE', marginTop: 1.5, letterSpacing: 1 },
  tag: { fontFamily: 'IBMPlexMono', fontSize: 7.5, color: C.chalk, borderWidth: 0.8, borderColor: '#9C9382', borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8, letterSpacing: 0.8 },
  eyebrow: { fontFamily: 'IBMPlexMono', fontSize: 7.5, color: C.laterite, letterSpacing: 1.2, marginTop: 20 },
  title: { fontFamily: 'IBMPlexSerif', fontWeight: 700, fontSize: 25, marginTop: 5, color: C.ink },
  project: { fontSize: 13, color: C.ink2, marginTop: 4 },
  metaRow: { flexDirection: 'row', marginTop: 14, borderTopWidth: 0.8, borderTopColor: C.line, paddingTop: 10 },
  metaCol: { flex: 1, paddingRight: 8 },
  metaK: { fontFamily: 'IBMPlexMono', fontSize: 7, color: C.ink3, letterSpacing: 0.8 },
  metaV: { fontSize: 10, marginTop: 2.5, fontWeight: 500 },
  h2: { fontFamily: 'IBMPlexSerif', fontWeight: 700, fontSize: 14, marginTop: 20, marginBottom: 8 },
  h2s: { fontSize: 8.5, color: C.ink2, marginTop: -4, marginBottom: 8, lineHeight: 1.45 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  fact: { width: '33.33%', paddingRight: 8, paddingVertical: 5 },
  factK: { fontFamily: 'IBMPlexMono', fontSize: 7, color: C.ink3, letterSpacing: 0.8 },
  factV: { fontSize: 10.5, fontWeight: 700, marginTop: 2 },
  factS: { fontSize: 7.8, color: C.ink2, marginTop: 1.5, lineHeight: 1.35 },
  totals: { flexDirection: 'row', marginTop: 6 },
  tot: { flex: 1, backgroundColor: C.card, borderWidth: 0.8, borderColor: C.line, borderRadius: 4, padding: 9, marginRight: 7 },
  totLast: { marginRight: 0 },
  totK: { fontFamily: 'IBMPlexMono', fontSize: 7, color: C.ink3, letterSpacing: 0.8 },
  totV: { fontFamily: 'IBMPlexMono', fontWeight: 700, fontSize: 17, marginTop: 4 },
  totU: { fontSize: 8.5, color: C.ink2, fontWeight: 400 },
  totR: { fontFamily: 'IBMPlexMono', fontSize: 7.3, color: C.ink2, marginTop: 4 },
  callout: { backgroundColor: C.lateriteBg, borderLeftWidth: 3, borderLeftColor: C.laterite, borderRadius: 3, padding: 9, marginTop: 14 },
  calloutT: { fontWeight: 700, fontSize: 9.5, marginBottom: 3 },
  calloutP: { fontSize: 8.6, lineHeight: 1.5, color: C.ink },
  tbl: { borderWidth: 0.8, borderColor: C.line, borderRadius: 3 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.6, borderBottomColor: C.line },
  trHead: { backgroundColor: C.card },
  trFoot: { backgroundColor: C.card, borderBottomWidth: 0 },
  trLast: { borderBottomWidth: 0 },
  th: { fontFamily: 'IBMPlexMono', fontSize: 7, color: C.ink2, letterSpacing: 0.4, paddingVertical: 5, paddingHorizontal: 5 },
  td: { fontSize: 8.6, paddingVertical: 4.5, paddingHorizontal: 5, lineHeight: 1.35 },
  num: { fontFamily: 'IBMPlexMono', textAlign: 'right' },
  bold: { fontWeight: 700 },
  note: { fontSize: 7.8, color: C.ink2, lineHeight: 1.45, marginTop: 5 },
  li: { flexDirection: 'row', marginBottom: 3.5 },
  liDot: { width: 9, color: C.laterite },
  liT: { flex: 1, fontSize: 8.8, lineHeight: 1.45 },
  chk: { flexDirection: 'row', borderWidth: 0.8, borderColor: C.line, borderRadius: 3, padding: 7, marginBottom: 5 },
  chkS: { width: 38, fontFamily: 'IBMPlexMono', fontWeight: 700, fontSize: 7.5, paddingTop: 1 },
  chkB: { flex: 1 },
  chkC: { fontFamily: 'IBMPlexMono', fontSize: 7.3, color: C.ink3 },
  chkT: { fontWeight: 700, fontSize: 9, marginTop: 1.5 },
  chkD: { fontSize: 8.3, color: C.ink2, marginTop: 2, lineHeight: 1.4 },
  footer: { position: 'absolute', left: 34, right: 34, bottom: 22, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.6, borderTopColor: C.line, paddingTop: 6 },
  footT: { fontFamily: 'IBMPlexMono', fontSize: 7, color: C.ink3 },
  small: { fontSize: 7.6, color: C.ink3, lineHeight: 1.5, marginTop: 14 },
})

// ─── pieces ───────────────────────────────────────────────────────────────────

export type Cell = string | number
type StyleRef = (typeof S)[keyof typeof S]

export function Table({ cols, head, rows, foot, num = [], repeatHead = false }: { cols: number[]; head: string[]; rows: Cell[][]; foot?: Cell[]; num?: number[]; repeatHead?: boolean }) {
  const cell = (c: Cell, i: number, style: StyleRef[], tone: Tone) => (
    <Text key={i} style={[...style, { flex: cols[i], backgroundColor: tint(i, tone) }, ...(num.includes(i) ? [S.num] : [])]}>{String(c)}</Text>
  )
  return (
    <View style={S.tbl}>
      <View style={S.tr} wrap={false} fixed={repeatHead}>{head.map((h, i) => cell(h, i, [S.th], 'head'))}</View>
      {rows.map((r, ri) => (
        <View key={ri} style={[S.tr, !foot && ri === rows.length - 1 ? S.trLast : {}]} wrap={false}>
          {r.map((c, i) => cell(c, i, i === 0 ? [S.td, S.bold] : [S.td], 'body'))}
        </View>
      ))}
      {foot ? <View style={[S.tr, S.trLast]} wrap={false}>{foot.map((c, i) => cell(c, i, [S.td, S.bold], 'head'))}</View> : null}
    </View>
  )
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((t, i) => (
        <View key={i} style={S.li} wrap={false}><Text style={S.liDot}>•</Text><Text style={S.liT}>{t}</Text></View>
      ))}
    </View>
  )
}

export function Tot({ k, v, u, r, last }: { k: string; v: string; u: string; r: string; last?: boolean }) {
  return (
    <View style={[S.tot, last ? S.totLast : {}]}>
      <Text style={S.totK}>{k}</Text>
      <Text style={S.totV}>{v} <Text style={S.totU}>{u}</Text></Text>
      <Text style={S.totR}>{r}</Text>
    </View>
  )
}

export const statusColor = (s: string) => (s === 'pass' ? { c: C.pass, bg: C.passBg, t: 'PASS' } : s === 'advisory' ? { c: C.warn, bg: C.warnBg, t: 'NOTE' } : { c: C.fail, bg: C.failBg, t: 'FAIL' })


export interface ContactInfo {
  name: string
  email: string
  mobile: string
  address: string
  city: string
  state: string
}

/** Branded band + footer shared by every report. */
export function Chrome({ tool, tag, reportId }: { tool: string; tag: string; reportId: string }) {
  return (
    <>
      <View style={S.footer} fixed>
        <Text style={S.footT}>NirmanShastra · {tool} · {reportId}</Text>
        <Text style={S.footT}>{CONTACT_EMAIL}</Text>
        <Text style={S.footT} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
      <View style={S.band}>
        <View style={S.brandRow}>
          <Image src={LOGO_MARK} style={S.logo} />
          <View>
            <Text style={S.brand}>NirmanShastra</Text>
            <Text style={S.brandSub}>BUILD WITH CERTAINTY</Text>
          </View>
        </View>
        <Text style={S.tag}>{tag}</Text>
      </View>
    </>
  )
}

/** The words stamped across every page of a sample report. */
export const SAMPLE_MARK_TEXT = 'SAMPLE — example house, not your project'

/**
 * A diagonal stamp on every page of a sample report. Render it LAST inside each <Page>, so it sits above the tables.
 * It is faint enough to read through; it is on every page so a page cannot be passed off as a customer's report.
 */
export function SampleMark({ show }: { show?: boolean }) {
  if (!show) return null
  return (
    <View fixed style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ transform: 'rotate(-38deg)', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'IBMPlexSans', fontWeight: 700, fontSize: 92, color: C.laterite, opacity: 0.1, letterSpacing: 8 }}>SAMPLE</Text>
        <Text style={{ fontFamily: 'IBMPlexSans', fontWeight: 700, fontSize: 21, color: C.laterite, opacity: 0.16, marginTop: -4 }}>example house, not your project</Text>
      </View>
    </View>
  )
}

/** A short note under the title of a sample's first page: what this document is. */
export function SampleNote({ show, house }: { show?: boolean; house: string }) {
  if (!show) return null
  return (
    <View style={[S.callout, { marginTop: 12, backgroundColor: C.warnBg, borderLeftColor: C.warn }]} wrap={false}>
      <Text style={S.calloutT}>This is a sample report</Text>
      <Text style={S.calloutP}>
        It is a real report from the same calculations a paid report uses, made for an example house ({house}). It is not your project and nothing in it applies to your plot. Your own report uses your plot, floors and city, so its figures will differ.
      </Text>
    </View>
  )
}

