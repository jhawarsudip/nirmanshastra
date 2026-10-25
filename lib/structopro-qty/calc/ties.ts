// The reconciliation: every figure the report prints is set beside the same figure rebuilt in this sheet.
// The report side is read from the report (`PaidPayload`) the customer holds. The sheet side is a figure a section of this sheet worked out
// (kept in `figs.ts`), or, for a sentence, the same sentence from the model's own run. A row is ok only when the two agree.

import type { CalcTieRow } from '@/lib/calcsheet'
import { tie } from '@/lib/calcsheet'
import type { CalcCtx } from './ctx'
import type { PaidPayload } from '../payload'
import type { MemberTotals } from '../types'
import { complianceChecks, practiceRange } from '../payload'
import { bars12m, beamLevelLabel, buildingLabelStilt, fmtIN as f, isCoil, storeyLabel } from '../labels'
import { fig, figText, hasFig } from './figs'
import { BAND_KEYS, assumptionLabel, frameFacts } from './report'
import { figuresOf, rebuilt, squash } from './helpers'

const ZONES = ['II', 'III', 'IV', 'V']

const near = (a: number, b: number): boolean => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))

/** The items of the design half (Sections 1 to 7): the report's value is read from the report, the sheet's value is what those sections rebuilt. */
const DESIGN_ITEMS: Array<{ label: string; item: string; unit: string; dp: number; report: (r: PaidPayload) => number }> = [
  { label: 'Storeys of the frame', item: 'Storeys of the frame', unit: '', dp: 0, report: (r) => r.inputEcho.storeys },
  { label: 'Total built-up area', item: 'Total built-up area', unit: 'm²', dp: 1, report: (r) => r.inputEcho.totalBuiltUpM2 },
  { label: 'Footprint of the frame (the largest storey)', item: 'Footprint of the frame', unit: 'm²', dp: 2, report: (r) => r.inputEcho.footprintM2 },
  { label: 'Plan length against the report', item: 'Length of the plan', unit: 'm', dp: 2, report: (r) => r.layout.lengthM },
  { label: 'Plan width against the report', item: 'Width of the plan', unit: 'm', dp: 2, report: (r) => r.layout.widthM },
  { label: 'Bays along the length', item: 'Bays along the length', unit: '', dp: 0, report: (r) => r.layout.baysX },
  { label: 'Bays along the width', item: 'Bays along the width', unit: '', dp: 0, report: (r) => r.layout.baysY },
  { label: 'Span along the length (centre to centre of columns)', item: 'Span along the length', unit: 'm', dp: 2, report: (r) => r.layout.spanX },
  { label: 'Span along the width (centre to centre of columns)', item: 'Span along the width', unit: 'm', dp: 2, report: (r) => r.layout.spanY },
  { label: 'Storey height against the report', item: 'Storey height', unit: 'm', dp: 1, report: (r) => r.layout.storeyHeightM },
  { label: 'Plinth height against the report', item: 'Plinth above ground', unit: 'm', dp: 2, report: (r) => r.layout.plinthM },
  { label: 'Founding depth against the report', item: 'Founding depth', unit: 'm', dp: 1, report: (r) => r.layout.foundingDepthM },
  { label: 'Vb against the report', item: 'Basic wind speed', unit: 'm/s', dp: 0, report: (r) => r.wind.vbMs },
  { label: 'Base shear along x against the report', item: 'Earthquake base shear along x', unit: 'kN', dp: 0, report: (r) => r.wind.quakeBaseKN.x },
  { label: 'Base shear along y against the report', item: 'Earthquake base shear along y', unit: 'kN', dp: 0, report: (r) => r.wind.quakeBaseKN.y },
  { label: 'Wind base shear along x against the report', item: 'Wind base shear along x', unit: 'kN', dp: 0, report: (r) => r.wind.windBaseKN.x },
  { label: 'Wind base shear along y against the report', item: 'Wind base shear along y', unit: 'kN', dp: 0, report: (r) => r.wind.windBaseKN.y },
  { label: 'Pressure at the roof against the report', item: 'Wind pressure at the roof', unit: 'kN/m²', dp: 2, report: (r) => r.wind.pzRoofKnM2 },
  { label: 'Net coefficient against the report', item: 'Net wind pressure coefficient', unit: '', dp: 2, report: (r) => r.wind.ct },
  { label: 'Number of beams against the report', item: 'Beams in the frame', unit: '', dp: 0, report: (r) => r.members.beams.count },
  { label: 'Number of columns against the report', item: 'Columns in the frame', unit: '', dp: 0, report: (r) => r.members.columns.count },
]

/** The tie rows of Sections 1 to 7 (the design half), against the report. Call after the sections have run on the same CalcCtx. */
export function designTies(c: CalcCtx, report: PaidPayload): CalcTieRow[] {
  return DESIGN_ITEMS.map((t) => tie(t.item, t.report(report), rebuilt(c.L, t.label), t.unit, t.dp))
}

/** The tie rows of Sections 8 to 14 and of the other figures the report prints. */
export function reportTies(c: CalcCtx, report: PaidPayload): CalcTieRow[] {
  const { L, work, result } = c
  const r = report
  const rows: CalcTieRow[] = []
  const stilt = work.ctx.stilt

  /** Figures: every pair must agree; the row prints the report's own rendering when they do and each side's rendering when they do not. */
  const figs = (item: string, pairs: Array<[number, number]>, render: (v: number[]) => string, also = true): void => {
    const ok = also && pairs.every(([a, b]) => near(a, b))
    const rep = render(pairs.map(([a]) => a))
    rows.push({ item, report: rep, sheet: ok ? rep : render(pairs.map(([, b]) => b)), ok })
  }
  /** Words: the two strings must be the same. */
  const words = (item: string, a: string, b: string): void => {
    rows.push({ item, report: a, sheet: b, ok: squash(a) === squash(b) })
  }
  /** A sentence: the figures in it must be the same, in the same order; a sentence with no figure must read the same. */
  const sentence = (item: string, a: string, b: string): void => {
    const fa = figuresOf(a)
    const fb = figuresOf(b)
    const ok = fa.length > 0 || fb.length > 0 ? fa.length === fb.length && fa.every((x, i) => x === fb[i]) : squash(a) === squash(b)
    const show = (_s: string, fs: string[]) => (fs.length > 0 ? `figures ${fs.join(', ')}` : 'same wording')
    let ra = show(a, fa)
    let rb = show(b, fb)
    if (!ok && ra === rb) {
      ra += ' (wording)'
      rb += ' (wording)'
    }
    rows.push({ item, report: ra, sheet: rb, ok })
  }

  rows.push(...designTies(c, r))

  // ---- version
  words('Model version', r.engine, 'qty-v2')

  // ---- facts
  words('Floors', buildingLabelStilt(r.inputEcho.floors, r.inputEcho.stilt), buildingLabelStilt(work.areasSqft.length, stilt))
  figs('Built-up area, sq ft and m²', [[r.inputEcho.totalBuiltUpM2 * 10.7639, fig(L, 'rep.builtSqft')], [r.inputEcho.totalBuiltUpM2, fig(L, 'rep.builtM2')]], (v) => `${f(v[0])} sq ft, ${f(v[1], 1)} m²`)
  words('Earthquake zone', `Zone ${r.inputEcho.zone}`, `Zone ${ZONES[rebuilt(L, 'Zone against the report')]}`)
  sentence('Note on the zone', r.inputEcho.zoneNote, work.zr.note)
  words('Concrete grades', `${r.inputEcho.gradeAbove} above, ${r.inputEcho.gradeBelow} below`, `M${rebuilt(L, 'Grade above, against the design routines')} above, M${rebuilt(L, 'Grade below, against the foundation design')} below`)
  words('Type of foundation', r.inputEcho.foundation, work.analysis.raft ? 'raft' : 'isolated')

  // ---- the four totals, each with its range
  const tile: Record<(typeof BAND_KEYS)[number], { label: string; unit: string; value: number; sheet: number; dp: number }> = {
    concrete: { label: 'Concrete', unit: 'm³', value: r.totals.concreteM3, sheet: fig(L, 'conc.total'), dp: 1 },
    steel: { label: 'Steel to buy', unit: 'kg', value: r.totals.steelBuyKg, sheet: fig(L, 'steel.buy'), dp: 0 },
    cement: { label: 'Cement', unit: 'bags', value: r.materials.cementBags, sheet: fig(L, 'mat.cement.bags'), dp: 0 },
    formwork: { label: 'Shuttering', unit: 'sq ft', value: r.materials.formworkSqft, sheet: fig(L, 'mat.form.sqft'), dp: 0 },
  }
  for (const k of BAND_KEYS) {
    const t = tile[k]
    const b = r.band[k]
    const pb = Math.round((1 - b[0]) * 100)
    const pa = Math.round((b[1] - 1) * 100)
    figs(
      `Total and range: ${t.label.toLowerCase()}`,
      [
        [t.value, t.sheet],
        [t.value * b[0], fig(L, `rep.range.${k}.lo`)],
        [t.value * b[1], fig(L, `rep.range.${k}.hi`)],
        [pb, fig(L, `rep.pct.${k}.below`)],
        [pa, fig(L, `rep.pct.${k}.above`)],
      ],
      (v) => `${f(v[0], t.dp)} ${t.unit}, ${f(v[1])} to ${f(v[2])}, ${f(v[3])} % below, ${f(v[4])} % above`
    )
  }

  // ---- the buy list
  figs('Cement, 50 kg bags', [[r.materials.cementBags, fig(L, 'mat.cement.bags')]], (v) => `${f(v[0])} bags`)
  figs('Sand', [[r.materials.sandCft, fig(L, 'mat.sand.cft')], [r.materials.sandM3, fig(L, 'mat.sand.m3')]], (v) => `${f(v[0])} cft, ${f(v[1], 1)} m³`)
  figs('Coarse aggregate', [[r.materials.aggregateCft, fig(L, 'mat.agg.cft')], [r.materials.aggregateM3, fig(L, 'mat.agg.m3')]], (v) => `${f(v[0])} cft, ${f(v[1], 1)} m³`)
  figs('Reinforcement steel to buy, and bar weight', [[r.materials.steelBuyKg, fig(L, 'steel.buy')], [r.totals.steelNetKg, fig(L, 'steel.net')]], (v) => `${f(v[0])} kg to buy, ${f(v[1])} kg of bars`)
  figs('Binding wire', [[r.materials.bindingWireKg, fig(L, 'steel.binding')], [r.totals.bindingWireKg, fig(L, 'steel.binding')]], (v) => `${f(v[0], 1)} kg`)
  figs('Shuttering', [[r.materials.formworkSqft, fig(L, 'mat.form.sqft')], [r.totals.formworkM2, fig(L, 'form.total')]], (v) => `${f(v[0])} sq ft, ${f(v[1])} m²`)
  figs('Excavation', [[r.materials.excavationCft, fig(L, 'mat.exc.cft')], [r.totals.excavationM3, fig(L, 'mat.exc.m3')]], (v) => `${f(v[0])} cft, ${f(v[1], 1)} m³`)

  // ---- concrete, steel and shuttering by part
  const keys = ['footings', 'plinthBeams', 'columns', 'beams', 'slabs', 'stairs', 'secondary', 'balconies'] as const
  const names: Record<(typeof keys)[number], string> = {
    footings: 'Footings (or raft)',
    plinthBeams: 'Plinth beams',
    columns: 'Columns',
    beams: 'Floor beams',
    slabs: 'Slabs',
    stairs: 'Staircase',
    secondary: 'Lintels, sunshades, parapet band, stair head-room',
    balconies: 'Balcony slabs',
  }
  const sheetHas = (k: string) => hasFig(L, `part.${k}.conc`)
  words('Balcony slabs in the table of parts', r.members.balconies ? 'present' : 'absent', sheetHas('balconies') ? 'present' : 'absent')
  const repParts = keys.filter((k) => r.members[k] !== undefined)
  for (const k of repParts) {
    const m = r.members[k]
    if (!m) continue
    if (!sheetHas(k)) {
      rows.push({ item: names[k], report: `${f(m.count)} pieces, ${f(m.concreteM3, 2)} m³`, sheet: 'not rebuilt', ok: false })
      continue
    }
    figs(
      names[k],
      [[m.count, fig(L, `part.${k}.count`)], [m.concreteM3, fig(L, `part.${k}.conc`)], [m.steelKg, fig(L, `part.${k}.steel`)], [m.formworkM2, fig(L, `part.${k}.form`)]],
      (v) => `${f(v[0])} pieces, ${f(v[1], 2)} m³, ${f(v[2])} kg, ${f(v[3], 1)} m²`
    )
  }
  const sheetKeys = keys.filter((k) => sheetHas(k))
  const sumRep = (pick: (m: MemberTotals) => number) => repParts.reduce((s, k) => s + pick(r.members[k] as MemberTotals), 0)
  const sumSheet = (suffix: string) => sheetKeys.reduce((s, k) => s + fig(L, `part.${k}.${suffix}`), 0)
  figs(
    'Reinforced concrete total (foot of the table of parts)',
    [[sumRep((m) => m.concreteM3), sumSheet('conc')], [sumRep((m) => m.steelKg), sumSheet('steel')], [sumRep((m) => m.formworkM2), sumSheet('form')]],
    (v) => `${f(v[0], 2)} m³, ${f(v[1])} kg, ${f(v[2], 1)} m²`
  )
  figs('Lean concrete under the footings', [[r.members.pcc.concreteM3, fig(L, 'footing.pcc')]], (v) => `${f(v[0], 2)} m³`)

  // ---- steel by diameter
  const sheetDia = figText(L, 'steel.dia.list') === '' ? [] : figText(L, 'steel.dia.list').split(',').map(Number)
  words('Bar diameters in the table of steel', r.steelByDiameter.map((s) => s.phi).join(', '), sheetDia.join(', '))
  for (const s of r.steelByDiameter) {
    const has = hasFig(L, `steel.dia.${s.phi}.buy`)
    if (!has) {
      rows.push({ item: `Steel of ${s.phi} mm`, report: `${f(s.kg)} kg`, sheet: 'not rebuilt', ok: false })
      continue
    }
    figs(`Steel of ${s.phi} mm bars`, [[s.kg, fig(L, `steel.dia.${s.phi}.buy`)], [bars12m(s.phi, s.kg), fig(L, `steel.dia.${s.phi}.n`)]], (v) => `${f(v[0])} kg, ${isCoil(s.phi) ? 'coil' : `${f(v[1])} bars of 12 m`}`)
  }
  figs(
    'Foot of the table of steel by diameter',
    [[r.steelByDiameter.reduce((a, s) => a + s.kg, 0), fig(L, 'steel.buy')], [r.steelByDiameter.reduce((a, s) => a + bars12m(s.phi, s.kg), 0), fig(L, 'steel.lengths')]],
    (v) => `${f(v[0])} kg, ${f(v[1])} bars`
  )

  // ---- mixes
  const mk = ['above', 'below', 'pcc'] as const
  words('Number of mixes', String(r.mixes.length), String(mk.length))
  r.mixes.forEach((m, i) => {
    const key = mk[i]
    if (!key) return
    words(`Mix ${i + 1}: where and grade`, `${m.grade} ${m.where}`, `${figText(L, `mat.mix.${key}.grade`)} ${figText(L, `mat.mix.${key}.where`)}`)
    figs(
      `Mix ${i + 1}: cement, sand and aggregate per m³`,
      [[m.cementKgPerM3, fig(L, `mat.mix.${key}.cement`)], [m.sandM3PerM3, fig(L, `mat.mix.${key}.sand`)], [m.aggM3PerM3, fig(L, `mat.mix.${key}.agg`)]],
      (v) => `${f(v[0])} kg, ${f(v[1], 2)} m³, ${f(v[2], 2)} m³`
    )
    sentence(`Mix ${i + 1}: how it was found`, m.basis, figText(L, `mat.mix.${key}.basis`))
  })

  // ---- schedules
  const storeys = Math.max(0, ...r.schedules.columns.map((x) => x.storey)) + 1
  type ColRow = { k: number; type: string; count: number; b: number; D: number; bars: string; pct: number; ties: string }
  type BeamRow = { k: number; type: string; count: number; b: number; D: number; note: string }
  const sc: ColRow[] = JSON.parse(figText(L, 'sched.columns'))
  const sb: BeamRow[] = JSON.parse(figText(L, 'sched.beams'))
  figs('Rows in the column schedule', [[r.schedules.columns.length, sc.length]], (v) => f(v[0]))
  const usedCol = new Set<number>()
  for (const x of r.schedules.columns) {
    const at = sc.findIndex((y, i) => !usedCol.has(i) && y.k === x.storey && y.type === x.type && y.b === x.bMm && y.D === x.dMm && y.bars === x.bars)
    const item = `Columns: ${storeyLabel(x.storey, r.inputEcho.stilt)}, ${x.type}, ${x.bMm} x ${x.dMm} mm, ${x.bars}`
    if (at < 0) {
      rows.push({ item, report: `${f(x.count)} pieces`, sheet: 'no such row', ok: false })
      continue
    }
    usedCol.add(at)
    const s = sc[at]
    figs(item, [[x.count, s.count], [x.asPercent, s.pct]], (v) => `${f(v[0])} pieces, ${f(v[1], 2)} %, ties ${x.ties}`, x.ties === s.ties)
  }
  figs('Rows in the beam schedule', [[r.schedules.beams.length, sb.length]], (v) => f(v[0]))
  const usedBeam = new Set<number>()
  for (const x of r.schedules.beams) {
    const at = sb.findIndex((y, i) => !usedBeam.has(i) && y.k === x.floor && y.type === x.type && y.D === x.dMm && y.note === x.note)
    const item = `Beams: ${beamLevelLabel(x.floor, storeys)}, ${x.type}, ${x.bMm} x ${x.dMm} mm`
    if (at < 0) {
      rows.push({ item, report: `${f(x.count)} pieces`, sheet: 'no such row', ok: false })
      continue
    }
    usedBeam.add(at)
    const s = sb[at]
    figs(item, [[x.count, s.count], [x.bMm, s.b]], (v) => `${f(v[0])} pieces, bars ${x.note}`, x.note === s.note)
  }

  // ---- smaller items
  words('Smaller items listed', r.secondary.map((s) => s.label).join('; '), result.secondary.map((s) => s.label).join('; '))
  for (const s of r.secondary) {
    const mine = work.parts.secondary.items.find((i) => i.label === s.label)
    if (!mine || !hasFig(L, `sec.${mine.key}.count`)) {
      rows.push({ item: s.label, report: `${f(s.count)} pieces`, sheet: 'not rebuilt', ok: false })
      continue
    }
    figs(s.label, [[s.count, fig(L, `sec.${mine.key}.count`)], [s.concreteM3, fig(L, `sec.${mine.key}.vol`)], [s.steelKg, fig(L, `sec.${mine.key}.steel`)]], (v) => `${f(v[0])} pieces, ${f(v[1], 2)} m³, ${f(v[2])} kg`)
    sentence(`${s.label}: basis`, s.basis, mine.basis)
  }

  // ---- the frame at a glance (the rest of it is in the design rows above)
  const ff = frameFacts(L)
  figs('Footprint of the frame, one decimal', [[r.layout.lengthM, ff.len], [r.layout.widthM, ff.wid]], (v) => `${f(v[0], 1)} x ${f(v[1], 1)} m`)
  figs('Founding depth, one decimal', [[r.layout.foundingDepthM, ff.depth]], (v) => `${f(v[0], 1)} m`)
  figs('Steel per m² and concrete per m²', [[r.perM2.steelKgPerM2, fig(L, 'rep.steelPerM2')], [r.perM2.concreteM3PerM2, fig(L, 'rep.concPerM2')]], (v) => `${f(v[0], 1)} kg, ${f(v[1], 3)} m³`)
  words('Which lateral force is larger', r.wind.governs.x === 'wind' || r.wind.governs.y === 'wind' ? 'wind' : 'earthquake', ff.windGoverns ? 'wind' : 'earthquake')

  // ---- the checks, the warnings, the assumptions, what is not counted
  const fresh = complianceChecks(result)
  figs('Number of checks', [[r.compliance.length, fresh.length]], (v) => f(v[0]))
  words('Standards named beside the checks', r.compliance.map((k) => k.clause).join('; '), fresh.map((k) => k.clause).join('; '))
  for (const k of r.compliance) {
    const m = fresh.find((x) => x.id === k.id)
    if (!m) {
      rows.push({ item: `Check: ${k.description}`, report: k.status, sheet: 'no such check', ok: false })
      continue
    }
    const fa = figuresOf(k.detail)
    const fb = figuresOf(m.detail)
    const ok = k.status === m.status && squash(k.description) === squash(m.description) && (fa.length > 0 || fb.length > 0 ? fa.length === fb.length && fa.every((x, i) => x === fb[i]) : squash(k.detail) === squash(m.detail))
    const show = (st: string, fs: string[]) => `${st}${fs.length > 0 ? '; figures ' + fs.join(', ') : ''}`
    rows.push({ item: `Check: ${k.description}`, report: show(k.status, fa), sheet: show(m.status, fb), ok })
  }
  figs('Number of warnings', [[r.warnings.length, result.warnings.length]], (v) => f(v[0]))
  r.warnings.forEach((w, i) => sentence(`Warning ${i + 1}`, w, result.warnings[i] ?? ''))
  figs('Number of assumptions', [[r.assumptions.length, result.assumptions.length]], (v) => f(v[0]))
  r.assumptions.forEach((a, i) => sentence(`Assumption: ${assumptionLabel(a)}`, a, result.assumptions[i] ?? ''))
  rows.push({
    item: 'Items not counted',
    report: `${r.notIncluded.length} items`,
    sheet: `${result.notIncluded.length} items`,
    ok: r.notIncluded.length === result.notIncluded.length && r.notIncluded.every((s, i) => squash(s) === squash(result.notIncluded[i])),
  })

  // ---- against built houses
  const p = r.practice
  words('Built houses: class', p.classLabel, figText(L, 'rep.practice.class'))
  words('Built houses: source named in the report', p.source, practiceRange(result).source)
  figs('Built houses: this report per m²', [[p.thisReport.steelKgPerM2, fig(L, 'rep.steelPerM2')], [p.thisReport.concreteM3PerM2, fig(L, 'rep.concPerM2')]], (v) => `${f(v[0], 1)} kg, ${f(v[1], 2)} m³`)
  figs(
    'Built houses: range per m²',
    [
      [p.steelKgPerM2[0], fig(L, 'rep.practice.perM2.steel.lo')],
      [p.steelKgPerM2[1], fig(L, 'rep.practice.perM2.steel.hi')],
      [p.concreteM3PerM2[0], fig(L, 'rep.practice.perM2.conc.lo')],
      [p.concreteM3PerM2[1], fig(L, 'rep.practice.perM2.conc.hi')],
    ],
    (v) => `${f(v[0])} to ${f(v[1])} kg, ${f(v[2], 2)} to ${f(v[3], 2)} m³`
  )
  figs(
    'Built houses: range for your floor area',
    [
      [p.steelKg[0], fig(L, 'rep.practice.steel.lo')],
      [p.steelKg[1], fig(L, 'rep.practice.steel.hi')],
      [p.concreteM3[0], fig(L, 'rep.practice.conc.lo')],
      [p.concreteM3[1], fig(L, 'rep.practice.conc.hi')],
    ],
    (v) => `${f(v[0])} to ${f(v[1])} kg, ${f(v[2], 1)} to ${f(v[3], 1)} m³`
  )
  return rows
}
