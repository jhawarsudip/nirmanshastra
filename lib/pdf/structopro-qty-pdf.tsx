// StructurePro quantities report (engine qty-v2). @react-pdf/renderer only.
// Quantities first. The rupee table is printed only when the customer typed their own rates; the report itself never carries a rate of ours.

import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import type { PaidPayload } from '@/lib/structopro-qty/payload'
import type { CalcSheet } from '@/lib/calcsheet'
import CalcAppendix from './calc-appendix'
import RupeeTable from './rupee-table'
import type { RupeeResult } from '@/lib/rates/compute'
import type { MemberTotals } from '@/lib/structopro-qty/types'
import { bandAbovePct, bandBelowPct, bars12m, beamLevelLabel, buildingLabelStilt, fmtIN as f, isCoil, storeyLabel } from '@/lib/structopro-qty/labels'
import { Bullets, C, Chrome, S, SampleMark, SampleNote, Table, Tot, statusColor, type ContactInfo } from './qty-kit'

// ─── the document ─────────────────────────────────────────────────────────────

export interface StructoProQtyPDFProps {
  report: PaidPayload
  contact: ContactInfo
  reportId: string
  projectName: string
  date: Date
  where: string // "Pune, Maharashtra"
  siteLabel: string
  wallLabel: string
  /** the calculation sheet, rebuilt from the saved answers and tied to this report; null leaves it out */
  calc?: CalcSheet | null
  /** a sample report for an example house: every page is stamped and the first page says so */
  sample?: { house: string } | null
  /** the customer's own rates worked into rupees; absent unless they typed rates and asked for the PDF with rupees */
  rupees?: RupeeResult | null
}

export default function StructoProQtyPDF({ report: r, contact, reportId, projectName, date, where, siteLabel, wallLabel, calc, sample, rupees }: StructoProQtyPDFProps) {
  const t = r.totals
  const m = r.materials
  const b = r.band
  const rng = (v: number, band: [number, number], d = 0) => `${f(v * band[0], d)} to ${f(v * band[1], d)}`
  const storeys = Math.max(0, ...r.schedules.columns.map(c => c.storey)) + 1
  const dateText = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  const parts: [string, MemberTotals][] = [
    ['Footings (or raft)', r.members.footings],
    ['Plinth beams', r.members.plinthBeams],
    ['Columns', r.members.columns],
    ['Floor beams', r.members.beams],
    ['Slabs', r.members.slabs],
    ['Staircase', r.members.stairs],
    ['Lintels, sunshades, parapet band, stair head-room', r.members.secondary],
    ...(r.members.balconies ? [['Balcony slabs', r.members.balconies] as [string, MemberTotals]] : []),
  ]
  const rcc = parts.reduce((s, [, mt]) => ({ c: s.c + mt.concreteM3, s: s.s + mt.steelKg, f: s.f + mt.formworkM2 }), { c: 0, s: 0, f: 0 })
  const stilt = r.inputEcho.stilt
  const barsTotal = r.steelByDiameter.reduce((a, s) => a + bars12m(s.phi, s.kg), 0)

  return (
    <Document title={`StructurePro quantities report ${reportId}`} author="NirmanShastra" subject="RCC structure quantities" language="en-IN">
      <Page size="A4" style={S.page}>
        <Chrome tool="StructurePro" tag="PHASE 1 · STRUCTUREPRO" reportId={reportId} />

        <Text style={S.eyebrow}>{sample ? 'SAMPLE QUANTITIES REPORT' : 'QUANTITIES REPORT'}</Text>
        <Text style={S.title}>RCC structure quantities</Text>
        <Text style={S.project}>{projectName}</Text>

        <View style={S.metaRow}>
          <View style={S.metaCol}><Text style={S.metaK}>PREPARED FOR</Text><Text style={S.metaV}>{contact.name || 'Owner'}</Text></View>
          <View style={S.metaCol}><Text style={S.metaK}>LOCATION</Text><Text style={S.metaV}>{where}</Text></View>
          <View style={S.metaCol}><Text style={S.metaK}>REPORT ID</Text><Text style={[S.metaV, { fontFamily: 'IBMPlexMono' }]}>{reportId}</Text></View>
          <View style={S.metaCol}><Text style={S.metaK}>DATE</Text><Text style={S.metaV}>{dateText}</Text></View>
        </View>

        <SampleNote show={!!sample} house={sample?.house ?? ''} />

        <Text style={S.h2} minPresenceAhead={90}>Your building</Text>
        <View style={S.facts}>
          <View style={S.fact}><Text style={S.factK}>FLOORS</Text><Text style={S.factV}>{buildingLabelStilt(r.inputEcho.floors, stilt)}</Text>{stilt && <Text style={S.factS}>Open parking level below the {r.inputEcho.floors === 1 ? 'floor' : 'floors'}</Text>}</View>
          <View style={S.fact}><Text style={S.factK}>BUILT-UP AREA</Text><Text style={S.factV}>{f(r.inputEcho.totalBuiltUpM2 * 10.7639)} sq ft</Text><Text style={S.factS}>{f(r.inputEcho.totalBuiltUpM2, 1)} m²</Text></View>
          <View style={S.fact}><Text style={S.factK}>EARTHQUAKE ZONE</Text><Text style={S.factV}>Zone {r.inputEcho.zone}</Text></View>
          <View style={S.fact}><Text style={S.factK}>GROUND</Text><Text style={S.factV}>{siteLabel}</Text></View>
          <View style={S.fact}><Text style={S.factK}>CONCRETE</Text><Text style={S.factV}>{r.inputEcho.gradeAbove} above, {r.inputEcho.gradeBelow} below</Text></View>
          <View style={S.fact}><Text style={S.factK}>STEEL AND WALLS</Text><Text style={S.factV}>Fe500D · {wallLabel}</Text></View>
        </View>
        <Text style={S.note}>{r.inputEcho.zoneNote}</Text>

        <Text style={S.h2} minPresenceAhead={90}>What to order</Text>
        <Text style={S.h2s}>Totals for the whole structure. The line under each figure is the range the real number is likely to fall in.</Text>
        <View style={S.totals}>
          <Tot k="CONCRETE" v={f(t.concreteM3, 1)} u="m³" r={`${rng(t.concreteM3, b.concrete)} m³`} />
          <Tot k="STEEL TO BUY" v={f(t.steelBuyKg)} u="kg" r={`${rng(t.steelBuyKg, b.steel)} kg`} />
          <Tot k="CEMENT" v={f(m.cementBags)} u="bags" r={`${rng(m.cementBags, b.cement)} bags`} />
          <Tot k="SHUTTERING" v={f(m.formworkSqft)} u="sq ft" r={`${rng(m.formworkSqft, b.formwork)} sq ft`} last />
        </View>

        <View style={S.callout} wrap={false}>
          <Text style={S.calloutT}>How to use this report</Text>
          <Text style={S.calloutP}>
            This is a code-based planning estimate, not a structural design for your drawings. It designs a regular frame to the Indian Standards and counts the extras. Use it to check a contractor&apos;s quantities for gross errors and to order the first lots. A real building is more likely to use more than this than less, so for a budget plan on the upper half of each range. Get the final bar bending schedule from the structural engineer who signs your drawings.
          </Text>
        </View>

        <Text style={S.h2} break>Buy list</Text>
        <Table
          cols={[3, 1.4, 0.9, 4.2]}
          num={[1]}
          head={['MATERIAL', 'QUANTITY', 'UNIT', 'HOW IT WAS WORKED OUT']}
          rows={[
            ['Cement (50 kg bags)', f(m.cementBags), 'bags', 'Per cubic metre of each mix, plus 3% site wastage'],
            ['Sand', f(m.sandCft), 'cft', `${f(m.sandM3, 1)} m³`],
            ['Coarse aggregate', f(m.aggregateCft), 'cft', `${f(m.aggregateM3, 1)} m³`],
            ['Reinforcement steel Fe500D', f(m.steelBuyKg), 'kg', `Bar weight ${f(t.steelNetKg)} kg + 5% cutting waste (CPWD DAR 5.22.1)`],
            ['Binding wire', f(m.bindingWireKg, 1), 'kg', '9 kg per tonne of steel'],
            ['Shuttering (contact area)', f(m.formworkSqft), 'sq ft', `${f(t.formworkM2)} m² of formwork face`],
            ['Excavation', f(m.excavationCft), 'cft', `${f(t.excavationM3, 1)} m³ for the foundation pits`],
          ]}
        />

        <Text style={S.h2} minPresenceAhead={90}>Concrete, steel and shuttering by part</Text>
        <Table
          cols={[4.6, 1, 1.5, 1.4, 1.7]}
          num={[1, 2, 3, 4]}
          head={['PART', 'PIECES', 'CONCRETE m³', 'STEEL kg', 'SHUTTERING m²']}
          rows={parts.map(([label, mt]) => [label, f(mt.count), f(mt.concreteM3, 2), f(mt.steelKg), f(mt.formworkM2, 1)])}
          foot={['Reinforced concrete total', '', f(rcc.c, 2), f(rcc.s), f(rcc.f, 1)]}
        />
        <Text style={S.note}>Steel here is the bar weight before the 5% cutting waste. Lean concrete under the footings (M7.5) is {f(r.members.pcc.concreteM3, 2)} m³ and is not part of the total above.</Text>

        <Text style={S.h2} minPresenceAhead={90}>Steel by bar diameter</Text>
        <Table
          cols={[2, 2, 2]}
          num={[1, 2]}
          head={['DIAMETER', 'WEIGHT TO BUY kg', '12 m BARS']}
          rows={r.steelByDiameter.map(s => [`${s.phi} mm`, f(s.kg), isCoil(s.phi) ? 'coil' : f(bars12m(s.phi, s.kg))])}
          foot={['All diameters', f(r.steelByDiameter.reduce((a, s) => a + s.kg, 0)), f(barsTotal)]}
        />
        <Text style={S.note}>Weights include the 5% cutting waste. The bar count rounds each diameter up to whole 12 m lengths (weight per metre = d²/162.2, IS 1786). 6 mm bar is bought as a coil and cut and bent on site, so it has no bar count.</Text>

        <Text style={S.h2} minPresenceAhead={90}>Mixes</Text>
        <Table
          cols={[3.4, 1, 1.6, 1.6, 1.8]}
          num={[2, 3, 4]}
          head={['WHERE', 'GRADE', 'CEMENT kg/m³', 'SAND m³/m³', 'AGGREGATE m³/m³']}
          rows={r.mixes.map(x => [x.where, x.grade, f(x.cementKgPerM3), f(x.sandM3PerM3, 2), f(x.aggM3PerM3, 2)])}
        />
        <View style={{ marginTop: 6 }}>
          {r.mixes.map(x => <Text key={x.where} style={S.note}>{x.grade} {x.where}: {x.basis}</Text>)}
        </View>

        <Text style={S.h2} minPresenceAhead={90}>Columns</Text>
        <Table
          cols={[1.7, 1.3, 0.9, 1.5, 1.2, 1, 1.7]}
          num={[2, 5]}
          head={['STOREY', 'TYPE', 'PIECES', 'SIZE mm', 'MAIN BARS', 'STEEL %', 'TIES']}
          rows={r.schedules.columns.map(c => [storeyLabel(c.storey, stilt), c.type, f(c.count), `${c.bMm} x ${c.dMm}`, c.bars, f(c.asPercent, 2), c.ties])}
        />

        <Text style={S.h2} minPresenceAhead={90}>Beams</Text>
        <Table
          cols={[1.4, 1.3, 0.8, 1.3, 4.6]}
          num={[2]}
          head={['SLAB LEVEL', 'BEAM', 'PIECES', 'SIZE mm', 'BARS']}
          rows={r.schedules.beams.map(x => [beamLevelLabel(x.floor, storeys), x.type, f(x.count), `${x.bMm} x ${x.dMm}`, x.note])}
        />
        <Text style={S.note}>Bars read as number-diameter: 8-16 means eight 16 mm bars. In beams, the top bars are two continuous bars plus the extra bars after the plus sign, which sit over the supports. Every size is the smallest the tool&apos;s IS 456 and IS 13920 checks accept for your zone, except where the report says a limit is reached; your engineer may round up.</Text>

        <Text style={S.h2} minPresenceAhead={90}>Smaller items, counted</Text>
        <Table
          cols={[2.6, 0.8, 1.2, 1, 4.6]}
          num={[1, 2, 3]}
          head={['ITEM', 'COUNT', 'CONCRETE m³', 'STEEL kg', 'BASIS']}
          rows={r.secondary.map(s => [s.label, f(s.count), f(s.concreteM3, 2), f(s.steelKg), s.basis])}
        />

        {rupees ? <RupeeTable result={rupees} /> : null}

        <Text style={S.h2} minPresenceAhead={90}>The frame we designed</Text>
        <View style={S.facts}>
          <View style={S.fact}><Text style={S.factK}>FOOTPRINT</Text><Text style={S.factV}>{f(r.layout.lengthM, 1)} x {f(r.layout.widthM, 1)} m</Text></View>
          <View style={S.fact}><Text style={S.factK}>COLUMN GRID</Text><Text style={S.factV}>{r.layout.baysX} x {r.layout.baysY} bays</Text><Text style={S.factS}>Spans about {f(r.layout.spanX, 2)} x {f(r.layout.spanY, 2)} m</Text></View>
          <View style={S.fact}><Text style={S.factK}>STOREY HEIGHT</Text><Text style={S.factV}>{f(r.layout.storeyHeightM, 1)} m</Text><Text style={S.factS}>Plinth {f(r.layout.plinthM, 2)} m above ground</Text></View>
          <View style={S.fact}><Text style={S.factK}>FOUNDING DEPTH</Text><Text style={S.factV}>{f(r.layout.foundingDepthM, 1)} m</Text><Text style={S.factS}>Below ground level</Text></View>
          <View style={S.fact}><Text style={S.factK}>STEEL PER m²</Text><Text style={S.factV}>{f(r.perM2.steelKgPerM2, 1)} kg</Text><Text style={S.factS}>{stilt ? 'Of roofed floor area, parking level included' : 'Of built-up floor area'}</Text></View>
          <View style={S.fact}><Text style={S.factK}>CONCRETE PER m²</Text><Text style={S.factV}>{f(r.perM2.concreteM3PerM2, 3)} m³</Text><Text style={S.factS}>{stilt ? 'Of roofed floor area, parking level included' : 'Of built-up floor area'}</Text></View>
          <View style={S.fact}><Text style={S.factK}>WIND SPEED USED</Text><Text style={S.factV}>{r.wind.vbMs} m/s</Text><Text style={S.factS}>{r.wind.governs.x === 'wind' || r.wind.governs.y === 'wind' ? 'Wind is the larger force in one direction' : 'Earthquake is the larger force'}</Text></View>
        </View>

        <Text style={S.h2} minPresenceAhead={90}>Checks against the Indian Standards</Text>
        <Text style={S.h2s}>These are the checks the tool makes. A status of PASS for the steel grade or the concrete grade follows from the tool&apos;s own choices. Where a line says a limit is reached, the section shown does not pass it. Appendix A lists what the tool does not check.</Text>
        {r.compliance.map(c => {
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
        {r.warnings.length > 0 && (
          <View style={{ marginTop: 6 }}>
            <Text style={[S.calloutT, { color: C.fail }]}>Please read</Text>
            <Bullets items={r.warnings} />
          </View>
        )}

        <Text style={S.h2} minPresenceAhead={90}>How far off can this be</Text>
        <Bullets items={[
          `Concrete: from ${bandBelowPct(b.concrete)}% below to ${bandAbovePct(b.concrete)}% above the figure shown.`,
          `Steel: from ${bandBelowPct(b.steel)}% below to ${bandAbovePct(b.steel)}% above.`,
          `Cement: from ${bandBelowPct(b.cement)}% below to ${bandAbovePct(b.cement)}% above.`,
          `Shuttering: from ${bandBelowPct(b.formwork)}% below to ${bandAbovePct(b.formwork)}% above.`,
        ]} />

        {r.practice && (
          <View>
            <Text style={S.h2} minPresenceAhead={110}>Against buildings that were actually built</Text>
            <Text style={S.h2s}>The figures in this report are the steel and concrete a code-based design of this regular frame needs, at the section sizes shown. Built houses usually use more, because site practice adds margin that no code asks for. For orientation, here is what a published study of real {r.practice.classLabel} found.</Text>
            <Table
              cols={[2.4, 1.6, 2.4, 2.6]}
              num={[1, 2, 3]}
              head={['', 'THIS REPORT', 'REAL BUILDINGS, LOW TO HIGH', 'FOR YOUR FLOOR AREA']}
              rows={[
                ['Steel per m² of floor (bar weight)', `${f(r.practice.thisReport.steelKgPerM2, 1)} kg`, `${f(r.practice.steelKgPerM2[0])} to ${f(r.practice.steelKgPerM2[1])} kg`, `${f(r.practice.steelKg[0])} to ${f(r.practice.steelKg[1])} kg`],
                ['Concrete per m² of floor', `${f(r.practice.thisReport.concreteM3PerM2, 2)} m³`, `${f(r.practice.concreteM3PerM2[0], 2)} to ${f(r.practice.concreteM3PerM2[1], 2)} m³`, `${f(r.practice.concreteM3[0], 1)} to ${f(r.practice.concreteM3[1], 1)} m³`],
              ]}
            />
            <Text style={S.note}>If your contractor&apos;s quantities fall between this report and the real-building range, that is common and worth a conversation, not an accusation. If they are above the range, ask for the bar bending schedule. Source: {r.practice.source} The study does not publish how many buildings fell in each class, so treat the range as orientation, not as a prediction for your house.</Text>
          </View>
        )}

        <Text style={S.h2} minPresenceAhead={90}>Assumptions</Text>
        <Bullets items={r.assumptions} />

        <Text style={S.h2} minPresenceAhead={90}>Not counted in this report</Text>
        <Bullets items={r.notIncluded} />

        <Text style={S.h2} minPresenceAhead={90}>Standards and sources used</Text>
        <Bullets items={[
          'IS 456:2000 Plain and reinforced concrete: limit state design, cover, detailing, slabs, beams, columns and footings.',
          'IS 875 Parts 1, 2 and 3: dead, imposed and wind loads. IS 1893 Part 1 (2002 edition): earthquake forces, zone factors and the open-storey rule. IS 13920: ductile detailing (the tool works to the 1993 edition; the 2016 edition is now in force).',
          'IS 1786:2008: Fe500D bars and mass per metre. IS 10262: concrete mix proportioning. IS 1904: foundations on soil.',
          'CPWD Delhi Analysis of Rates 2014: nominal-mix cement, sand and aggregate for M20 and below, and the 5% steel cutting waste.',
        ]} />

        <Text style={S.small}>
          NirmanShastra · India&apos;s IS-code construction quantities platform. This report is for estimation and planning only. It is not a substitute for drawings and calculations signed by a licensed structural engineer, and it does not replace a soil test. The bearing capacity, floor loads and site-practice sizes are stated assumptions; change them and the quantities change.
        </Text>
        <SampleMark show={!!sample} />
      </Page>

      {calc ? <CalcAppendix sheet={calc} chrome={{ tool: 'StructurePro', tag: 'PHASE 1 · STRUCTUREPRO', reportId, sample: !!sample }} /> : null}
    </Document>
  )
}
