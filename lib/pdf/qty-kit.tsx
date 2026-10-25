// Shared pieces for every NirmanShastra quantity report (@react-pdf/renderer only).
// Quantities only: no rates, no cost. Palette is the v2 "limewash and laterite" set, never blue.

import React from 'react'
import path from 'path'
import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

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
  const cell = (c: Cell, i: number, style: StyleRef[]) => (
    <Text key={i} style={[...style, { flex: cols[i] }, ...(num.includes(i) ? [S.num] : [])]}>{String(c)}</Text>
  )
  return (
    <View style={S.tbl}>
      <View style={[S.tr, S.trHead]} wrap={false} fixed={repeatHead}>{head.map((h, i) => cell(h, i, [S.th]))}</View>
      {rows.map((r, ri) => (
        <View key={ri} style={[S.tr, !foot && ri === rows.length - 1 ? S.trLast : {}]} wrap={false}>
          {r.map((c, i) => cell(c, i, i === 0 ? [S.td, S.bold] : [S.td]))}
        </View>
      ))}
      {foot ? <View style={[S.tr, S.trFoot]} wrap={false}>{foot.map((c, i) => cell(c, i, [S.td, S.bold]))}</View> : null}
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
