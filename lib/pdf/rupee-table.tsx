// The rupee table of a report PDF (Group 9). Printed ONLY when the customer typed rates on the page and asked for the PDF with rupees.
// Every figure is the report's quantity times a rate the customer typed. @react-pdf/renderer only.

import React from 'react'
import { Text, View } from '@react-pdf/renderer'
import { RESULT_LABEL, inr, inrRate, type RupeeResult } from '../rates/compute'
import { C, S, Table } from './qty-kit'

const MAX_NAMES = 10

function names(list: string[]): string {
  const shown = list.slice(0, MAX_NAMES)
  const rest = list.length - shown.length
  return shown.join('; ') + (rest > 0 ? `; and ${rest} more` : '')
}

export default function RupeeTable({ result }: { result: RupeeResult }) {
  if (result.priced === 0) return null
  const reasons = new Map<string, string[]>()
  for (const u of result.unpriced) reasons.set(u.why, [...(reasons.get(u.why) ?? []), u.item])

  return (
    <View>
      <Text style={S.h2} minPresenceAhead={result.rows.length > 8 ? 220 : 120}>In rupees, at your rates</Text>
      <Text style={S.h2s}>{RESULT_LABEL}</Text>
      <Table
        cols={[4.6, 2.4, 2, 1.9]}
        num={[2, 3]}
        repeatHead={result.rows.length > 8}
        head={['ITEM', 'QUANTITY', 'YOUR RATE', 'AMOUNT']}
        rows={result.rows.map(r => [r.label, r.need, `${inrRate(r.rate)} ${r.per}`, inr(r.amount)])}
        foot={[`Total for the ${result.priced} ${result.priced === 1 ? 'item' : 'items'} priced`, '', '', inr(result.total)]}
      />
      <View style={[S.callout, { marginTop: 8 }]} wrap={false}>
        <Text style={S.calloutT}>Read this before you use the total</Text>
        <Text style={S.calloutP}>
          The rates are the ones you typed. NirmanShastra did not supply, check or update them, and this is not a quotation. {RESULT_LABEL}
          {result.blank.length > 0 ? ` You gave a rate for ${result.priced} of ${result.of} items; the rest are not in the total.` : ''}
        </Text>
      </View>
      {result.blank.length > 0 && <Text style={S.note}>No rate given: {names(result.blank.map(b => b.label))}.</Text>}
      {[...reasons.entries()].map(([why, items]) => (
        <Text key={why} style={[S.note, { color: C.ink2 }]}>Not priced ({names(items)}): {why}</Text>
      ))}
    </View>
  )
}
