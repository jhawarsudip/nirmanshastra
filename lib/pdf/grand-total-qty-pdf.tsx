// The Grand Total report: the paid reports of one building added into one buying list. @react-pdf/renderer only.
// Quantities only: no rates, no cost.

import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { GRAND_META, type GrandFree, type GrandPaid } from '@/lib/qty/grand'
import type { CalcSheet } from '@/lib/calcsheet'
import CalcAppendix from './calc-appendix'
import { Bullets, C, Chrome, S, Table, Tot, statusColor, type Cell, type ContactInfo } from './qty-kit'

export interface GrandTotalPDFProps {
  free: GrandFree
  paid: GrandPaid
  contact: ContactInfo
  reportId: string
  projectName: string
  date: Date
  where: string // "Pune, Maharashtra"
  /** the working behind every figure, printed after the report; null when it could not be made to agree with the report */
  calc?: CalcSheet | null
}

/** Column weights from the longest word in the heading and the longest cell, so text columns get room and number columns stay narrow. */
function weights(head: string[], rows: Cell[][], foot?: Cell[]): number[] {
  return head.map((h, i) => {
    const headW = Math.max(...h.split(/\s+/).map(w => w.length), 4) * 1.15
    const cellW = Math.max(0, ...rows.map(r => String(r[i] ?? '').length), foot ? String(foot[i] ?? '').length : 0)
    return Math.min(Math.max(headW, cellW, 5), 46)
  })
}

const pct = (low: number, high: number) => ({ below: Math.round((1 - low) * 100), above: Math.round((high - 1) * 100) })
const h3 = { fontFamily: 'IBMPlexSerif', fontWeight: 700, fontSize: 11, marginTop: 10, marginBottom: 4 } as const

export default function GrandTotalQtyPDF({ free, paid, contact, reportId, projectName, date, where, calc }: GrandTotalPDFProps) {
  const dateText = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const tiles = paid.tiles.slice(0, 4)

  return (
    <Document title={`Grand Total quantities report ${reportId}`} author="NirmanShastra" subject={GRAND_META.heading} language="en-IN">
      <Page size="A4" style={S.page}>
        <Chrome tool={GRAND_META.label} tag={GRAND_META.tag} reportId={reportId} />

        <Text style={S.eyebrow}>QUANTITIES REPORT</Text>
        <Text style={S.title}>{GRAND_META.heading}</Text>
        <Text style={S.project}>{projectName}</Text>

        <View style={S.metaRow}>
          <View style={S.metaCol}><Text style={S.metaK}>PREPARED FOR</Text><Text style={S.metaV}>{contact.name || 'Owner'}</Text></View>
          <View style={S.metaCol}><Text style={S.metaK}>LOCATION</Text><Text style={S.metaV}>{where || '—'}</Text></View>
          <View style={S.metaCol}><Text style={S.metaK}>REPORT ID</Text><Text style={[S.metaV, { fontFamily: 'IBMPlexMono' }]}>{reportId}</Text></View>
          <View style={S.metaCol}><Text style={S.metaK}>DATE</Text><Text style={S.metaV}>{dateText}</Text></View>
        </View>

        <Text style={S.h2} minPresenceAhead={90}>What to order</Text>
        <Text style={S.h2s}>The main totals across {free.phases.length} phases. The line under each figure is the range the real number is likely to fall in.</Text>
        <View style={S.totals}>
          {tiles.map((t, i) => (
            <Tot key={t.k} k={t.k.toUpperCase()} v={t.v} u={t.unit} r={t.range ?? ' '} last={i === tiles.length - 1} />
          ))}
        </View>

        <View style={S.callout} wrap={false}>
          <Text style={S.calloutT}>How to use this report</Text>
          <Text style={S.calloutP}>
            This list adds the reports you already bought, phase by phase, into one buying list. Each figure is a code-based planning estimate worked out from the answers you gave, not a design for your drawings. Use it to plan, to check a contractor&apos;s quantities for gross errors and to order the first lots. Final quantities come from the drawings and the professional who signs them.
          </Text>
        </View>

        <Text style={S.h2} minPresenceAhead={90}>Before you rely on this list</Text>
        {free.checks.map(c => {
          const sc = statusColor(c.status)
          return (
            <View key={c.id} style={[S.chk, { backgroundColor: sc.bg }]} wrap={false}>
              <Text style={[S.chkS, { color: sc.c }]}>{sc.t}</Text>
              <View style={S.chkB}>
                <Text style={S.chkC}>{c.clause}</Text>
                <Text style={S.chkT}>{c.description}</Text>
                <Text style={S.chkD}>{c.detail}</Text>
              </View>
            </View>
          )
        })}
        {free.warnings.length > 0 && (
          <View style={{ marginTop: 6 }}>
            <Text style={[S.calloutT, { color: C.fail }]}>Please read</Text>
            <Bullets items={free.warnings} />
          </View>
        )}

        {paid.tables.map(tb => (
          <View key={tb.id} wrap={tb.rows.length > 8}>
            <Text style={S.h2} minPresenceAhead={tb.rows.length > 8 ? 220 : 0}>{tb.title}</Text>
            {tb.sub ? <Text style={S.h2s}>{tb.sub}</Text> : null}
            <Table
              cols={weights(tb.head, tb.rows, tb.foot)}
              num={tb.num ?? []}
              repeatHead={tb.rows.length > 8}
              head={tb.head.map(h => h.toUpperCase())}
              rows={tb.rows}
              foot={tb.foot}
            />
            {tb.note ? <Text style={S.note}>{tb.note}</Text> : null}
          </View>
        ))}

        <Text style={S.h2} minPresenceAhead={90}>How far off can this be</Text>
        <Bullets items={paid.bands.map(b => {
          const p = pct(b.low, b.high)
          return `${b.label}: from ${p.below}% below to ${p.above}% above the figure shown.`
        })} />

        <Text style={S.h2} minPresenceAhead={90}>How the reports were added</Text>
        <Bullets items={paid.assumptions} />

        <Text style={S.h2} minPresenceAhead={120}>The assumptions in each phase</Text>
        {paid.phaseNotes.map(p => (
          <View key={p.key}>
            <Text style={h3} minPresenceAhead={60}>{p.label}</Text>
            <Bullets items={p.assumptions} />
          </View>
        ))}

        <Text style={S.h2} minPresenceAhead={90}>Not counted in this report</Text>
        <Bullets items={paid.notIncluded} />
        {paid.phaseNotes.map(p => (
          <View key={p.key}>
            <Text style={h3} minPresenceAhead={60}>{p.label}: not counted</Text>
            <Bullets items={p.notIncluded} />
          </View>
        ))}

        <Text style={S.h2} minPresenceAhead={90}>Standards and sources used</Text>
        <Bullets items={paid.sources} />

        <Text style={S.small}>
          NirmanShastra · India&apos;s IS-code construction quantities platform. This report is for estimation and planning only. It is not a substitute for drawings and calculations signed by a licensed professional. Where a figure is an assumption, change it in the phase report and the quantities change.
        </Text>
      </Page>
      {calc ? <CalcAppendix sheet={calc} chrome={{ tool: GRAND_META.label, tag: GRAND_META.tag, reportId }} /> : null}
    </Document>
  )
}
