// The calculation sheet at the end of a report. @react-pdf/renderer only.
// Formulas and workings are set in IBM Plex Sans, not Mono: the Mono files have no Greek letters (φ, σ, τ).
// Renders as its own pages after the report's pages. A `break` inside the report's page made react-pdf either pile the
// whole sheet onto one page or take minutes to lay out, and one very long flowing page re-lays out its remainder on every
// page break (about 35% slower than this). So: one page run for the front matter, one for each section, one for the
// reconciliation and references. Each run flows, so the page count follows the length of the working.

import React from 'react'
import { Page, Text, View } from '@react-pdf/renderer'
import type { CalcBlock, CalcLine, CalcSheet, CalcTable } from '@/lib/calcsheet'
import { C, Chrome, S, SampleMark } from './qty-kit'

const COLS = { step: 2.5, formula: 2.5, working: 3.1, result: 1.7, ref: 2.0 }

const k = {
  h3: { fontFamily: 'IBMPlexSerif', fontWeight: 700, fontSize: 10.5, marginTop: 11, marginBottom: 3.5 } as const,
  intro: { fontSize: 8.2, color: C.ink2, lineHeight: 1.45, marginBottom: 5 } as const,
  cell: { fontSize: 7.7, lineHeight: 1.38, paddingVertical: 3.2, paddingHorizontal: 4 } as const,
  head: { fontFamily: 'IBMPlexMono', fontSize: 6.6, color: C.ink2, letterSpacing: 0.4, paddingVertical: 4.5, paddingHorizontal: 4 } as const,
  input: { backgroundColor: '#F7F2E6' },
  resultRow: { backgroundColor: C.passBg },
  textRow: { backgroundColor: 'transparent' },
  ref: { fontSize: 6.9, color: C.ink3, lineHeight: 1.35, paddingVertical: 3.2, paddingHorizontal: 4 } as const,
  mono: { fontFamily: 'IBMPlexMono', fontSize: 7.1 } as const,
}

function Head({ cols }: { cols: [string, number][] }) {
  return (
    <View style={[S.tr, S.trHead]} wrap={false}>
      {cols.map(([t, w], i) => <Text key={i} style={[k.head, { flex: w }]}>{t}</Text>)}
    </View>
  )
}

function Line({ l, last }: { l: CalcLine; last: boolean }) {
  const border = last ? { borderBottomWidth: 0 } : {}
  if (l.kind === 'text') {
    return (
      <View style={[S.tr, border]} wrap={false}>
        <Text style={[k.cell, { flex: COLS.step, fontWeight: 700 }]}>{l.label}</Text>
        <Text style={[k.cell, { flex: COLS.formula + COLS.working + COLS.result }]}>{l.note}</Text>
        <Text style={[k.ref, { flex: COLS.ref }]}>{l.ref ?? ''}</Text>
      </View>
    )
  }
  const bg = l.kind === 'result' ? k.resultRow : l.kind === 'input' ? k.input : k.textRow
  return (
    <View style={[S.tr, bg, border]} wrap={false}>
      <View style={{ flex: COLS.step }}>
        <Text style={[k.cell, { fontWeight: l.kind === 'result' ? 700 : 500 }]}>{l.label}</Text>
        {l.note ? <Text style={[k.ref, { paddingTop: 0 }]}>{l.note}</Text> : null}
      </View>
      <Text style={[k.cell, { flex: COLS.formula }]}>{l.formula ?? ''}</Text>
      <Text style={[k.cell, { flex: COLS.working }]}>{l.working ?? ''}</Text>
      <Text style={[k.cell, { flex: COLS.result, fontWeight: 700, textAlign: l.kind === 'input' && !l.working ? 'left' : 'right' }]}>{l.result ?? ''}</Text>
      <Text style={[k.ref, { flex: COLS.ref }]}>{l.ref ?? ''}</Text>
    </View>
  )
}

function Lines({ lines }: { lines: CalcLine[] }) {
  return (
    <View style={S.tbl}>
      <Head cols={[['STEP', COLS.step], ['FORMULA', COLS.formula], ['WORKING', COLS.working], ['RESULT', COLS.result], ['SOURCE', COLS.ref]]} />
      {lines.map((l, i) => <Line key={i} l={l} last={i === lines.length - 1} />)}
    </View>
  )
}

function SheetTable({ t }: { t: CalcTable }) {
  const n = t.head.length
  const w = t.head.map((h, i) => Math.min(Math.max(Math.max(...h.split(/\s+/).map(x => x.length), 4) * 1.1, ...t.rows.map(r => String(r[i] ?? '').length * 0.82), 4), 30))
  const cell = (c: string, i: number, bold = false) => (
    <Text key={i} style={[k.cell, { flex: w[i], fontWeight: bold ? 700 : 400, textAlign: t.num?.includes(i) ? 'right' : 'left' }]}>{c}</Text>
  )
  return (
    <View style={S.tbl}>
      <View style={[S.tr, S.trHead]} wrap={false}>{t.head.map((h, i) => <Text key={i} style={[k.head, { flex: w[i], textAlign: t.num?.includes(i) ? 'right' : 'left' }]}>{h.toUpperCase()}</Text>)}</View>
      {t.rows.map((r, ri) => (
        <View key={ri} style={[S.tr, !t.foot && ri === t.rows.length - 1 ? S.trLast : {}]} wrap={false}>{Array.from({ length: n }, (_, i) => cell(r[i] ?? '', i, i === 0))}</View>
      ))}
      {t.foot ? <View style={[S.tr, S.trFoot]} wrap={false}>{Array.from({ length: n }, (_, i) => cell(t.foot?.[i] ?? '', i, true))}</View> : null}
    </View>
  )
}

function Block({ b }: { b: CalcBlock }) {
  const long = (b.lines?.length ?? 0) > 6
  return (
    <View wrap={long || !!b.table}>
      <Text style={k.h3} minPresenceAhead={long || b.table ? 120 : 0}>{b.title}</Text>
      {b.intro ? <Text style={k.intro}>{b.intro}</Text> : null}
      {b.lines && b.lines.length > 0 ? <Lines lines={b.lines} /> : null}
      {b.table ? <SheetTable t={b.table} /> : null}
      {b.note ? <Text style={S.note}>{b.note}</Text> : null}
    </View>
  )
}

export interface CalcChrome { tool: string; tag: string; reportId: string; /** a sample report: stamp every page */ sample?: boolean }

export default function CalcAppendix({ sheet, chrome, letter = 'A' }: { sheet: CalcSheet; chrome: CalcChrome; letter?: string }) {
  return (
    <>
    <Page size="A4" style={S.page}>
      <Chrome tool={chrome.tool} tag={chrome.tag} reportId={chrome.reportId} />
      <Text style={S.eyebrow}>APPENDIX {letter}</Text>
      <Text style={[S.title, { fontSize: 20 }]}>Calculation sheet</Text>
      <Text style={S.project}>{sheet.tool}: how every figure in this report was worked out</Text>

      <View style={S.callout} wrap={false}>
        <Text style={S.calloutT}>What this sheet is</Text>
        <Text style={S.calloutP}>{sheet.purpose}</Text>
      </View>

      <Text style={S.h2} minPresenceAhead={90}>How to read it</Text>
      <Text style={k.intro}>
        Each row is one step. STEP says what is being found. FORMULA gives it in symbols. WORKING puts the numbers in. RESULT is the answer with its unit. SOURCE names the clause or table the step rests on. Shaded rows are inputs: a figure you gave, or a value read from a code table. Green rows are figures that appear in the report. Every sum was carried out at full precision and is shown rounded, so re-keying the rounded numbers by hand may differ in the last digit.
      </Text>

      <Text style={S.h2} minPresenceAhead={90}>Method in brief</Text>
      {sheet.method.map((m, i) => (
        <View key={i} style={S.li} wrap={false}><Text style={[S.liDot, { width: 18, color: C.laterite }]}>{i + 1}.</Text><Text style={S.liT}>{m}</Text></View>
      ))}

      <Text style={S.h2} minPresenceAhead={90}>Read this before relying on the sheet</Text>
      {sheet.limits.map((m, i) => (
        <View key={i} style={S.li} wrap={false}><Text style={S.liDot}>•</Text><Text style={S.liT}>{m}</Text></View>
      ))}

      <SampleMark show={chrome.sample} />
    </Page>

      {sheet.sections.map(sec => (
        <Page key={sec.id} size="A4" style={S.page}>
          <Chrome tool={chrome.tool} tag={chrome.tag} reportId={chrome.reportId} />
          <Text style={S.h2}>{sec.title}</Text>
          {sec.intro ? <Text style={k.intro}>{sec.intro}</Text> : null}
          {sec.blocks.map(b => <Block key={b.id} b={b} />)}
          <SampleMark show={chrome.sample} />
        </Page>
      ))}

      <Page size="A4" style={S.page}>
      <Chrome tool={chrome.tool} tag={chrome.tag} reportId={chrome.reportId} />
      <Text style={S.h2} minPresenceAhead={120}>Reconciliation: the report against this sheet</Text>
      <Text style={k.intro}>The totals printed in the report, rebuilt from the working above. Every row must read the same on both sides. This shows that the report and this sheet agree with each other, which is a check of the arithmetic; it does not show that either one is right against a standard or against your site.</Text>
      <View style={S.tbl}>
        <View style={[S.tr, S.trHead]} wrap={false}>
          <Text style={[k.head, { flex: 4 }]}>ITEM</Text><Text style={[k.head, { flex: 2, textAlign: 'right' }]}>IN THE REPORT</Text><Text style={[k.head, { flex: 2, textAlign: 'right' }]}>FROM THIS SHEET</Text><Text style={[k.head, { flex: 0.8, textAlign: 'center' }]}>MATCH</Text>
        </View>
        {sheet.tie.map((t, i) => (
          <View key={i} style={[S.tr, i === sheet.tie.length - 1 ? S.trLast : {}]} wrap={false}>
            <Text style={[k.cell, { flex: 4 }]}>{t.item}</Text>
            <Text style={[k.cell, { flex: 2, textAlign: 'right' }]}>{t.report}</Text>
            <Text style={[k.cell, { flex: 2, textAlign: 'right' }]}>{t.sheet}</Text>
            <Text style={[k.cell, { flex: 0.8, textAlign: 'center', fontWeight: 700, color: t.ok ? C.pass : C.fail }]}>{t.ok ? 'Yes' : 'NO'}</Text>
          </View>
        ))}
      </View>

      <Text style={S.h2} minPresenceAhead={120}>Standards and references used in this sheet</Text>
      <View style={S.tbl}>
        <View style={[S.tr, S.trHead]} wrap={false}>
          <Text style={[k.head, { flex: 2.2 }]}>DOCUMENT</Text><Text style={[k.head, { flex: 4 }]}>TITLE</Text><Text style={[k.head, { flex: 4.5 }]}>USED FOR</Text>
        </View>
        {sheet.references.map((r, i) => (
          <View key={i} style={[S.tr, i === sheet.references.length - 1 ? S.trLast : {}]} wrap={false}>
            <Text style={[k.cell, { flex: 2.2, fontWeight: 700 }]}>{r.code}</Text>
            <Text style={[k.cell, { flex: 4 }]}>{r.title}</Text>
            <Text style={[k.cell, { flex: 4.5 }]}>{r.usedFor}</Text>
          </View>
        ))}
      </View>
      <Text style={S.small}>
        This sheet shows the method and the arithmetic behind a planning-level quantity estimate. It lets a qualified person check the formulas and the working. It is not a structural design, a drawing or a certificate, and it does not replace the drawings and calculations that a licensed professional signs for your building.
      </Text>
      <SampleMark show={chrome.sample} />
      </Page>
    </>
  )
}
