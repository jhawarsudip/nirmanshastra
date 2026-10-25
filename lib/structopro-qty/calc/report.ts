// Section 14: the figures of the report that are not quantities of material, and where each check, warning and assumption of the report is worked.
// The ranges under the four totals, the steel and concrete per square metre, the comparison with built houses, the frame at a glance.

import type { CalcBlock, CalcSection, Ledger } from '@/lib/calcsheet'
import type { CalcCtx } from './ctx'
import { COVER_BEAM, COVER_COLUMN, COVER_FOOTING, COVER_SLAB } from '../codes'
import { M2_TO_SQFT, bandsFor } from '../model'
import { complianceChecks, practiceRange } from '../payload'
import { SQFT_TO_M2 } from '../plan'
import { bandAbovePct, bandBelowPct } from '../labels'
import { STD, d0, d1, d2, d3, ex, plural, rebuilt, table, tableBlock, takeBlock } from './helpers'
import { fig, put, putText } from './figs'

export const BAND_KEYS = ['concrete', 'steel', 'cement', 'formwork'] as const
export type BandKey = (typeof BAND_KEYS)[number]

/** The frame facts the report prints, as the earlier sections rebuilt them. */
export interface FrameFacts {
  len: number
  wid: number
  bx: number
  by: number
  sx: number
  sy: number
  hs: number
  plinth: number
  depth: number
  vb: number
  windGoverns: boolean
}

export function frameFacts(L: Ledger): FrameFacts {
  const g = (label: string) => rebuilt(L, label)
  return {
    len: g('Plan length against the report'),
    wid: g('Plan width against the report'),
    bx: g('Bays along the length'),
    by: g('Bays along the width'),
    sx: g('Span along the length (centre to centre of columns)'),
    sy: g('Span along the width (centre to centre of columns)'),
    hs: g('Storey height against the report'),
    plinth: g('Plinth height against the report'),
    depth: g('Founding depth against the report'),
    vb: g('Vb against the report'),
    windGoverns: g('Which governs along x, against the report') === 1 || g('Which governs along y, against the report') === 1,
  }
}

const SERIES_REF = `${STD.assume}: set from the published range of built houses and one Bill of Quantities; not a code value`
const STUDY_REF = 'GKSPL, Building the Baseline (v1, March 2026), as reported by Conserve Consultants; not re-read'

const ASSUME: Array<[RegExp, string, string]> = [
  [/^Layout:/, 'Layout', 'Section 3'],
  [/^Seismic zone/, 'Seismic zone', 'Section 2'],
  [/^Zone III and above:|^Zone II: ordinary/, 'Type of frame', 'Sections 5 to 7'],
  [/^Concrete:/, 'Concrete grades', 'Sections 2 and 13'],
  [/^Foundation:/, 'Foundation', 'Sections 2 and 8'],
  [/^Loads:/, 'Loads', 'Section 4'],
  [/^Slab /, 'Slab, beams and columns', 'Sections 3, 6, 7 and 9'],
  [/^Reinforcement is bought/, 'Steel supply', 'Section 11'],
  [/^Lintels, sunshades/, 'Small items', 'Section 10'],
  [/^Cement, sand and aggregate/, 'Cement, sand and aggregate', 'Section 13'],
  [/^Wind to IS 875/, 'Wind', 'Section 5'],
  [/^Soil-structure/, 'What is not analysed', 'limits at the start of this sheet'],
  [/^The ground level is open/, 'Open parking level', 'Sections 5 and 7'],
  [/^Zone II: 6 mm/, 'Links in Zone II', 'Sections 6 and 7'],
  [/^Each balcony/, 'Balconies', 'Section 10'],
]

/** The name the sheet gives an assumption of the report, from the way the sentence begins. */
export function assumptionLabel(s: string): string {
  const hit = ASSUME.find(([re]) => re.test(s))
  return hit ? hit[1] : 'Other note'
}

export function reportSection(c: CalcCtx): CalcSection {
  const { L, work, result } = c
  const blocks: CalcBlock[] = []
  const stilt = work.ctx.stilt
  const F = work.plan.F
  const bal = result.balcony !== undefined

  // ---- area and per-square-metre figures
  const built = rebuilt(L, 'Total built-up area')
  const sqft = L.calc('Built-up area in square feet', 'm² × 10.7639', '{a} × {k}', { a: built, k: M2_TO_SQFT }, (v) => v.a * v.k, { unit: 'sq ft', dp: 0, ref: 'Unit conversion', ...ex(result.inputEcho.totalBuiltUpM2 * M2_TO_SQFT), result: true })
  put(L, 'rep.builtSqft', sqft)
  put(L, 'rep.builtM2', built)
  let parking = 0
  if (stilt) parking = L.calc('Area of the open parking level', 'area of the first floor listed × 0.09290304', '{a} × {k}', { a: work.areasSqft[0], k: SQFT_TO_M2 }, (v) => v.a * v.k, { unit: 'm²', dp: 1, ref: STD.rule, note: 'The parking level has the footprint of the first floor', ...ex(work.plan.floors[0].areaM2) })
  const roofed = L.calc('Roofed floor area', 'built-up area + open parking level', '{a} + {p}', { a: built, p: parking }, (v) => v.a + v.p, { unit: 'm²', dp: 1, ref: STD.rule, note: stilt ? 'The parking level has a roof slab, so the per-m² figures divide by it as well' : undefined, ...ex(result.inputEcho.roofedAreaM2) })
  const steelNet = fig(L, 'steel.net')
  const conc = fig(L, 'conc.total')
  const steelPer = L.calc('Steel per m² of floor', 'net steel ÷ roofed area', '{s} ÷ {a}', { s: steelNet, a: roofed }, (v) => v.s / v.a, { unit: 'kg/m²', dp: 1, ref: STD.rule, note: 'Bar weight before the cutting waste', ...ex(result.perM2.steelKgPerM2), result: true })
  const concPer = L.calc('Concrete per m² of floor', 'concrete ÷ roofed area', '{c} ÷ {a}', { c: conc, a: roofed }, (v) => v.c / v.a, { unit: 'm³/m²', dp: 3, ref: STD.rule, ...ex(result.perM2.concreteM3PerM2), result: true })
  put(L, 'rep.roofed', roofed)
  put(L, 'rep.steelPerM2', steelPer)
  put(L, 'rep.concPerM2', concPer)
  blocks.push(takeBlock(L, 'rep-area', 'Area, steel per m² and concrete per m²'))

  // ---- the ranges under the four totals
  const bands = bandsFor(stilt, bal)
  const tiles: Record<BandKey, { label: string; value: number; unit: string; dp: number }> = {
    concrete: { label: 'Concrete', value: conc, unit: 'm³', dp: 0 },
    steel: { label: 'Steel to buy', value: fig(L, 'steel.buy'), unit: 'kg', dp: 0 },
    cement: { label: 'Cement', value: fig(L, 'mat.cement.bags'), unit: 'bags', dp: 0 },
    formwork: { label: 'Shuttering', value: fig(L, 'mat.form.sqft'), unit: 'sq ft', dp: 0 },
  }
  L.pick('Where the range factors come from', 'the real figure is the figure shown × a factor from the low to the high one', 'concrete 0.92 to 1.40, cement 0.92 to 1.40, shuttering 0.85 to 1.25, steel 0.90 to 1.60 (1.65 with an open parking level or balconies)', SERIES_REF, 'The model designs to the code minimum; built houses usually use more, so the high factors are larger than the low ones')
  const cv = tiles.concrete
  const lo = L.calc(`Lowest likely ${cv.label.toLowerCase()}`, 'figure × low factor', '{v} × {f}', { v: cv.value, f: bands.concrete[0] }, (v) => v.v * v.f, { unit: cv.unit, dp: 0, ref: SERIES_REF, result: true, ...ex(result.totals.concreteM3 * result.band.concrete[0]) })
  const hi = L.calc(`Highest likely ${cv.label.toLowerCase()}`, 'figure × high factor', '{v} × {f}', { v: cv.value, f: bands.concrete[1] }, (v) => v.v * v.f, { unit: cv.unit, dp: 0, ref: SERIES_REF, result: true, ...ex(result.totals.concreteM3 * result.band.concrete[1]) })
  const below = L.calc('Concrete: per cent below the figure shown', '(1 − low factor) × 100, to the whole number', '(1 − {f}) × 100', { f: bands.concrete[0] }, (v) => Math.round((1 - v.f) * 100), { unit: '%', dp: 0, ref: STD.rule, expect: bandBelowPct(result.band.concrete), tol: 0, result: true })
  const above = L.calc('Concrete: per cent above the figure shown', '(high factor − 1) × 100, to the whole number', '({f} − 1) × 100', { f: bands.concrete[1] }, (v) => Math.round((v.f - 1) * 100), { unit: '%', dp: 0, ref: STD.rule, expect: bandAbovePct(result.band.concrete), tol: 0, result: true })
  blocks.push(takeBlock(L, 'rep-bands', 'The range under each total: concrete worked', { intro: 'The same two products are worked for the other three totals in the table below.' }))
  const bandRows: string[][] = []
  for (const k of BAND_KEYS) {
    const t = tiles[k]
    const f = bands[k]
    const l = k === 'concrete' ? lo : t.value * f[0]
    const h = k === 'concrete' ? hi : t.value * f[1]
    const pb = k === 'concrete' ? below : Math.round((1 - f[0]) * 100)
    const pa = k === 'concrete' ? above : Math.round((f[1] - 1) * 100)
    L.compare(`Range factors of ${t.label.toLowerCase()}`, f[0] + f[1], result.band[k][0] + result.band[k][1])
    put(L, `rep.band.${k}.f0`, f[0])
    put(L, `rep.band.${k}.f1`, f[1])
    put(L, `rep.range.${k}.lo`, l)
    put(L, `rep.range.${k}.hi`, h)
    put(L, `rep.pct.${k}.below`, pb)
    put(L, `rep.pct.${k}.above`, pa)
    bandRows.push([t.label, `${d0(t.value)} ${t.unit}`, d2(f[0]), d2(f[1]), `${d0(l)} to ${d0(h)} ${t.unit}`, `${d0(pb)} % below, ${d0(pa)} % above`])
  }
  blocks.push(tableBlock('rep-band-table', 'Range under each total', table(['Total', 'Figure shown', 'Low factor', 'High factor', 'Range', 'In the report as'], bandRows, { num: [1, 2, 3] })))

  // ---- built houses
  const pr = practiceRange(result)
  const lowClass = rebuilt(L, 'Storeys of the frame') <= 4
  putText(L, 'rep.practice.class', lowClass ? 'buildings of up to four storeys' : 'buildings of five to twelve storeys')
  L.pick('Class of building', 'up to 4 storeys, or 5 to 12 storeys', lowClass ? 'up to four storeys' : 'five to twelve storeys', STUDY_REF, `${F} ${plural(F, 'storey', 'storeys')} in the frame`)
  L.input('Steel per m² of real buildings of this class', `${d0(pr.steelKgPerM2[0])} to ${d0(pr.steelKgPerM2[1])} kg`, STUDY_REF, 'Published range; the sample size of each class is not published')
  L.input('Concrete per m² of real buildings of this class', `${d2(pr.concreteM3PerM2[0])} to ${d2(pr.concreteM3PerM2[1])} m³`, STUDY_REF)
  const forFloor = (k: string, lab: string, unit: string, dp: number, engine: number, per: number) =>
    put(L, `rep.practice.${k}`, L.calc(lab, 'range per m² × roofed area', '{r} × {a}', { r: per, a: roofed }, (x) => x.r * x.a, { unit, dp, ref: STUDY_REF, ...ex(engine), result: true }))
  forFloor('steel.lo', 'Steel of real buildings of your floor area, low', 'kg', 0, pr.steelKg[0], pr.steelKgPerM2[0])
  forFloor('steel.hi', 'Steel of real buildings of your floor area, high', 'kg', 0, pr.steelKg[1], pr.steelKgPerM2[1])
  forFloor('conc.lo', 'Concrete of real buildings of your floor area, low', 'm³', 1, pr.concreteM3[0], pr.concreteM3PerM2[0])
  forFloor('conc.hi', 'Concrete of real buildings of your floor area, high', 'm³', 1, pr.concreteM3[1], pr.concreteM3PerM2[1])
  put(L, 'rep.practice.perM2.steel.lo', pr.steelKgPerM2[0])
  put(L, 'rep.practice.perM2.steel.hi', pr.steelKgPerM2[1])
  put(L, 'rep.practice.perM2.conc.lo', pr.concreteM3PerM2[0])
  put(L, 'rep.practice.perM2.conc.hi', pr.concreteM3PerM2[1])
  blocks.push(takeBlock(L, 'rep-practice', 'This report against buildings that were built', { note: 'The study range is an outside figure that the tool only multiplies by your floor area. It is not a code value and not a prediction for your house.' }))

  // ---- the frame at a glance
  const ff = frameFacts(L)
  blocks.push(
    tableBlock(
      'rep-frame',
      'The frame at a glance',
      table(
        ['Item in the report', 'Value', 'Worked in'],
        [
          ['Footprint', `${d1(ff.len)} × ${d1(ff.wid)} m`, 'Section 3'],
          ['Column grid', `${d0(ff.bx)} × ${d0(ff.by)} bays`, 'Section 3'],
          ['Spans', `${d2(ff.sx)} × ${d2(ff.sy)} m`, 'Section 3'],
          ['Storey height', `${d1(ff.hs)} m`, 'Section 3'],
          ['Plinth above ground', `${d2(ff.plinth)} m`, 'Section 3'],
          ['Founding depth', `${d1(ff.depth)} m`, 'Section 2'],
          ['Steel per m²', `${d1(steelPer)} kg`, 'this section'],
          ['Concrete per m²', `${d3(concPer)} m³`, 'this section'],
          ['Wind speed used', `${d0(ff.vb)} m/s`, 'Section 2'],
          ['Which lateral force is the larger', ff.windGoverns ? 'wind, in at least one direction' : 'earthquake, in both directions', 'Section 5'],
        ],
        { num: [1] }
      )
    )
  )

  // ---- the checks of the report
  const checks = complianceChecks(result)
  const quotedBeam = Number(/beam (\d+) mm/.exec(checks.find((k) => k.id === 'cover')?.detail ?? '')?.[1])
  const coverNote =
    Number.isFinite(quotedBeam) && quotedBeam !== (COVER_BEAM as number)
      ? `The working uses ${COVER_FOOTING} mm for footings, ${COVER_COLUMN} mm for columns, ${COVER_BEAM} mm for beams and ${COVER_SLAB} mm for slabs, and does not raise them with the exposure. The wording of the check quotes ${quotedBeam} mm for beams. The covers in Section 2 are the ones the bars were counted with.`
      : 'The covers used in the working are listed in Section 2.'
  const WHERE: Record<string, [string, string]> = {
    concrete_grade: ['Sections 2 and 13', 'Grade, minimum cement and water-cement ratio come from IS 456 Table 5.'],
    steel_grade: ['Section 2', 'Fe 500D is assumed throughout. The tool follows IS 13920:1993; IS 13920:2016 is the edition now in force.'],
    ductile: ['Sections 6 and 7', 'The ductile rules followed are those of IS 13920:1993. The confining steel of the columns is not checked by the model (Section 7 shows the comparison).'],
    foundation: ['Section 8', 'The footing sizes follow the bearing capacity assumed for the ground class.'],
    cover: ['Section 2', coverNote],
    wind: ['Section 5', 'The tool follows IS 875 (Part 3):1987. IS 875 (Part 3):2015 is the edition now in force.'],
    stilt: ['Sections 5 and 7', 'The tool follows IS 1893 (Part 1):2002. IS 1893 (Part 1):2016 is the edition now in force; its rules for an open storey were not read for this sheet. IS 1893:2002 cl. 7.8.1 asks for a dynamic analysis of an irregular framed building over 12 m in Zone IV or V; the model makes none.'],
    balcony: ['Section 10', 'Balcony thickness, bars and anchorage are worked in Section 10.'],
    review: ['the warnings below', 'This line gathers the warnings of the report.'],
  }
  blocks.push(
    tableBlock(
      'rep-checks',
      'The checks printed in the report, and where they are worked',
      table(
        ['Check in the report', 'Status', 'Worked in', 'Note'],
        checks.map((k) => [k.description, k.status, WHERE[k.id]?.[0] ?? 'Sections 1 to 13', WHERE[k.id]?.[1] ?? '']),
        { note: 'The report names a clause or standard beside each check. Those pointers are written by the tool and have not been re-read against the published text; use them as a pointer to check, not as a quotation.' }
      )
    )
  )

  // ---- the warnings of the report
  const H = work.plan.floors[F - 1].zTop
  const w = Math.min(work.plan.L, work.plan.W)
  const slender = H / w >= 5
  if (slender) L.calc('Height ÷ width', 'roof level ÷ shorter side of the plan', '{h} ÷ {w}', { h: H, w }, (v) => v.h / v.w, { dp: 1, ref: STD.rule, note: 'At 5 or more the tool warns that wind sway is not covered' })
  if (H > 30) L.value('Height of the roof level', H, 'm', 1, STD.rule, 'Over 30 m the tool warns that the gust factor and dynamic response are not covered')
  L.value('Steel per m² of floor', steelPer, 'kg/m²', 1, 'this section', 'The tool warns when this is over 55 or under 22 kg/m²')
  const WARN: Array<[RegExp, string, string]> = [
    [/raft foundation/i, 'Raft foundation', 'The ground class calls for a raft, or the isolated footings would cover too much of the plan (Section 8).'],
    [/black cotton/i, 'Black cotton soil', 'You gave black cotton soil as the ground.'],
    [/open parking level/i, 'Open parking level', 'You asked for an open parking level.'],
    [/tall and narrow/i, 'Tall and narrow building', 'Height at least five times the width.'],
    [/over 30 m/i, 'Height over 30 m', 'The roof is higher than 30 m.'],
    [/no upper floor/i, 'Balconies without an upper floor', 'Balconies were asked for on a building with one floor.'],
    [/fewer bays/i, 'Balconies that do not fit', 'Some floors have fewer bays than the balconies asked for.'],
    [/five or more floors/i, 'Five or more floors', 'The frame has five or more floors.'],
    [/steel per square metre/i, 'Steel per m² out of range', 'Steel per m² is over 55 or under 22 kg/m².'],
    [/4 % steel limit/i, 'Heavily loaded column', 'A column reached the 4 % steel limit (Section 7).'],
  ]
  const warnRows = result.warnings.map((s) => {
    const hit = WARN.find(([re]) => re.test(s))
    return [hit ? hit[1] : 'Design routine', hit ? hit[2] : 'Raised by the beam, column or balcony design (Sections 6, 7 and 10).']
  })
  blocks.push(takeBlock(L, 'rep-warn-figures', 'Figures behind the warnings'))
  blocks.push(
    warnRows.length > 0
      ? tableBlock('rep-warnings', 'The warnings printed in the report', table(['Warning', 'Raised when'], warnRows))
      : { id: 'rep-warnings', title: 'The warnings printed in the report', note: 'This run raised no warning.' }
  )

  // ---- the assumptions of the report
  const assumeRows = result.assumptions.map((s) => {
    const hit = ASSUME.find(([re]) => re.test(s))
    return [hit ? hit[1] : 'Other note', hit ? hit[2] : 'Sections 1 to 13']
  })
  blocks.push(tableBlock('rep-assumptions', 'The assumptions printed in the report, and where each is worked', table(['Assumption', 'Worked in'], assumeRows)))

  // ---- what the report does not count
  blocks.push(
    tableBlock('rep-notcounted', 'Not counted in the report', table(['Item'], result.notIncluded.map((s) => [s])), {
      note: 'These items are outside the model: the sheet does not work them and the report does not include them.',
    })
  )

  return { id: 'report', title: '14. Other figures of the report', intro: 'The report also prints ranges, per-square-metre figures, a comparison with built houses, the frame at a glance, the checks, the warnings, the assumptions and a list of what is not counted. Each is worked or placed here.', blocks }
}
