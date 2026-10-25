/*
  InteriorPro calculation sheet, part 6: the buy list, the checks printed in the report, and the uncertainty bands.
*/

import type { CalcBlock, CalcSection, CalcTable } from '@/lib/calcsheet'
import { ceilTo, fmt, rangeText, round } from '../util'
import { ADHESIVE_BAG_KG, CEMENT_BAG_KG } from './finish'
import { BANDS, DOOR, GLAZED, MIN_ROOM, PUTTY_STEP_KG, RANGE, GRANITE_WASTE } from './model'
import { REF, T, X, cellNum, miss, type Ctx } from './calc-kit'
import type { PlanOut } from './calc-plan'
import type { SurfOut } from './calc-surf'
import type { TileOut } from './calc-tiles'
import type { PaintOut, falseCeiling } from './calc-paint'
import type { FitOut, CarpOut } from './calc-fit'

export interface Parts {
  P: PlanOut; S: SurfOut; Ti: TileOut; Pa: PaintOut
  Fc: ReturnType<typeof falseCeiling>; Fi: FitOut; Cp: CarpOut
}

export function buyList(c: Ctx, o: Parts) {
  const { inp, paid } = c
  const { P, S, Ti, Pa, Fc, Fi, Cp } = o
  interface Buy { key: string; qty: number; dp: number; from: string; rule: string }
  const buy: Buy[] = []
  const B = (key: string, qty: number, dp: number, from: string, rule: string) => { if (qty > 0) buy.push({ key, qty, dp, from, rule }) }
  const up = 'Next whole number above'
  const ex = inp.exterior
  if (inp.paint !== 'economy') B('wall-putty-kg', ceilTo(Pa.puttyKg, PUTTY_STEP_KG), 0, `${fmt(Pa.puttyKg, 1)} kg`, `Up to the next multiple of ${PUTTY_STEP_KG} kg`)
  B('primer-interior-l', Math.ceil(Pa.primerL - 1e-9), 0, `${fmt(Pa.primerL, 2)} L`, up)
  B(inp.paint === 'economy' ? 'distemper-interior-l' : 'emulsion-interior-l', Math.ceil(Pa.finishL - 1e-9), 0, `${fmt(Pa.finishL, 2)} L`, up)
  if (ex !== 'none') {
    B('primer-exterior-l', Math.ceil(Pa.exPrimerL - 1e-9), 0, `${fmt(Pa.exPrimerL, 2)} L`, up)
    B(ex === 'cement' ? 'cement-paint-kg' : 'paint-exterior-l', Math.ceil(Pa.exFinish - 1e-9), 0, `${fmt(Pa.exFinish, 2)} ${ex === 'cement' ? 'kg' : 'L'}`, up)
  }
  B('primer-wood-l', Math.ceil(Pa.woodPrimerL - 1e-9), 0, `${fmt(Pa.woodPrimerL, 2)} L`, up)
  B('enamel-wood-l', Math.ceil(Pa.enamelL - 1e-9), 0, `${fmt(Pa.enamelL, 2)} L`, up)
  for (const r of Ti.sizeRows) B(`tile-${r.t.key}-nos`, r.pcs, 0, `${fmt(r.buy, 1)} m²`, 'Pieces worked out in section [[s5]]')
  if (inp.tileFix === 'mortar') {
    B('cement-bag-50kg', Ti.bedCementBags, 0, 'see section [[s5]]', `Whole bags of ${CEMENT_BAG_KG} kg`)
    B('sand-m3', round(Ti.bedSandM3, 1), 1, `${fmt(Ti.bedSandM3, 2)} m³`, 'Rounded to 0.1 m³')
  } else B('tile-adhesive-kg', Ti.adhesiveBags * ADHESIVE_BAG_KG, 0, `${fmt(Ti.adhesiveBags)} bags`, `Whole bags of ${ADHESIVE_BAG_KG} kg`)
  B('tile-grout-kg', Math.ceil(Ti.groutKg - 1e-9), 0, `${fmt(Ti.groutKg, 1)} kg`, up)
  B('waterproofing-sqm', round(Ti.wpArea, 1), 1, `${fmt(Ti.wpArea, 2)} m²`, 'Rounded to 0.1 m²')
  if (P.agg.nKit > 0) {
    B('granite-slab-sqm', round(Ti.counterArea * GRANITE_WASTE, 1), 1, `${fmt(Ti.granite, 2)} m²`, 'Rounded to 0.1 m²')
    B('granite-edge-m', round(Ti.counterEdge, 1), 1, `${fmt(Ti.counterEdge, 2)} m`, 'Rounded to 0.1 m')
  }
  B('threshold-m', round(Ti.thresholdRM, 1), 1, `${fmt(Ti.thresholdRM, 2)} m`, 'Rounded to 0.1 m')
  if (Fc.fcArea > 0) {
    const f = Fc.fcv
    B('gypsum-board-2400x1200-nos', f.boards, 0, 'see section [[s8]]', 'Whole sheets')
    B('fc-section-m', Math.ceil(f.sectionM - 1e-9), 0, `${fmt(f.sectionM, 2)} m`, up)
    B('fc-channel-m', Math.ceil(f.channelM - 1e-9), 0, `${fmt(f.channelM, 2)} m`, up)
    B('fc-perimeter-m', Math.ceil(f.perimM - 1e-9), 0, `${fmt(f.perimM, 2)} m`, up)
    B('fc-cleat-nos', f.cleats, 0, 'see section [[s8]]', 'Whole numbers')
    B('fc-fastener-nos', f.fasteners, 0, 'see section [[s8]]', 'Whole numbers')
    B('fc-hanger-nos', f.hangers, 0, 'see section [[s8]]', 'Whole numbers')
    B('fc-screw-nos', f.screws, 0, 'see section [[s8]]', 'Whole numbers')
    B('fc-wire-m', Math.ceil(f.wireM - 1e-9), 0, `${fmt(f.wireM, 2)} m`, up)
  }
  for (const r of Fi.doorRows) B(`door-${r.op === DOOR.main ? 'main' : r.op === DOOR.room ? 'room' : r.op === DOOR.bath ? 'bath' : 'stair'}-nos`, r.n, 0, 'counted in section [[s3]]', 'Whole doors')
  B('door-frame-timber-m3', round(Fi.frameTotal, 2), 2, `${fmt(Fi.frameTotal, 3)} m³`, 'Rounded to 0.01 m³')
  B('door-hinge-nos', Fi.doorHinges, 0, 'see section [[s9]]', 'Whole numbers')
  B('door-lock-nos', Fi.locks, 0, 'see section [[s9]]', 'Whole numbers')
  B('door-bolt-nos', Fi.bolts, 0, 'see section [[s9]]', 'Whole numbers')
  B('door-handle-nos', S.nDoors, 0, 'see section [[s9]]', 'One pair to a door')
  B('door-stopper-nos', S.nDoors, 0, 'see section [[s9]]', 'One to a door')
  B('glass-5mm-sqm', round(Fi.glassTotal, 1), 1, `${fmt(Fi.glassTotal, 2)} m²`, 'Rounded to 0.1 m²')
  B('window-section-m', Math.ceil(Fi.sectionTotal - 1e-9), 0, `${fmt(Fi.sectionTotal, 2)} m`, up)
  if (Cp.hasCarpentry) {
    B('ply-19mm-sheet', Cp.sheetsPly19, 0, 'see section [[s10]]', 'Whole sheets')
    B('ply-8mm-sheet', Cp.sheetsPly8, 0, 'see section [[s10]]', 'Whole sheets')
    B('laminate-sheet', Cp.sheetsLam, 0, 'see section [[s10]]', 'Whole sheets')
    B('edge-band-m', Math.ceil(Cp.edgeBand - 1e-9), 0, `${fmt(Cp.edgeBand, 2)} m`, up)
    B('cabinet-hinge-nos', Cp.cabHinges, 0, 'see section [[s10]]', 'Whole numbers')
    B('cabinet-handle-nos', Cp.cabHandles, 0, 'see section [[s10]]', 'One to a shutter')
  }

  if (paid.lines.length !== buy.length) miss(c, `buy list: ${paid.lines.length} lines in the report, ${buy.length} in the sheet`)
  const rows: string[][] = []
  buy.forEach((b, i) => {
    const l = paid.lines[i]
    if (!l || l.key !== b.key) { miss(c, `buy list line ${i + 1}: report "${l?.key}" vs sheet "${b.key}"`); return }
    T(c, `Buy list: ${l.item}`, l.qty, b.qty, l.unit, b.dp)
    rows.push([l.item, b.from, b.rule, fmt(b.qty, b.dp), l.unit])
  })
  const table: CalcTable = {
    head: ['Item', 'Worked out as', 'Rounded', 'To order', 'Unit'], num: [3],
    rows, note: 'Each quantity above is the figure worked out in the sections above, rounded up to something that can be bought. The list is the same as the one the Grand Total adds across the trades.',
  }
  const sections: CalcSection[] = [{ id: 's11', title: '[[s11]]. The buy list', blocks: [{ id: 'buy', title: 'What to order, and how each figure was rounded', table }] }]
  return { sections }
}

/** The numbers printed in the checks of the report (kitchen and bathroom sizes, window size). */
export function checks(c: Ctx, P: PlanOut) {
  const { w, L, free } = c
  const { agg, open } = P
  const avgKit = L.calc('Average kitchen', 'kitchen floor area ÷ number of kitchens', '{a:2} ÷ {n}', { a: agg.aKit, n: agg.nKit }, (v) => v.a / v.n, { unit: 'm²', dp: 1, ref: REF.derived, ...X(w.avgKit) })
  const avgBath = L.calc('Average bathroom', 'bathroom floor area ÷ number of bathrooms', '{a:2} ÷ {n}', { a: agg.aBath, n: agg.nBath }, (v) => v.a / v.n, { unit: 'm²', dp: 1, ref: REF.derived, ...X(w.avgBath) })
  const avgBed = L.calc('Average bedroom', 'bedroom floor area ÷ number of bedrooms', '{a:2} ÷ {n}', { a: agg.aBed, n: agg.nBed }, (v) => v.a / v.n, { unit: 'm²', dp: 1, ref: REF.derived, ...X(w.avgBed) })
  const avgLiv = L.calc('Average living room', 'living room floor area ÷ number of living rooms', '{a:2} ÷ {n}', { a: agg.aLiv, n: agg.nLiv }, (v) => v.a / v.n, { unit: 'm²', dp: 1, ref: REF.derived, ...X(w.avgLiv) })
  const winPer = L.calc('Windows in a living room', 'living room windows ÷ living rooms', '{a} ÷ {n}', { a: open.winL, n: agg.nLiv }, (v) => v.a / v.n, { dp: 2, ref: REF.rule, ...X(w.livWinPer) })
  const aB = GLAZED.winB.w * GLAZED.winB.h
  const aL = GLAZED.winL.w * GLAZED.winL.h
  const bedRatio = L.calc('Bedroom window against the room', 'window area ÷ room area', '{a:2} ÷ {r:2}', { a: aB, r: avgBed }, (v) => v.a / v.r, { dp: 3, ref: REF.derived, ...X(w.bedRatio) })
  const livRatio = L.calc('Living room windows against the room', 'windows per room × window area ÷ room area', '{n:2} × {a:2} ÷ {r:2}', { n: winPer, a: aL, r: avgLiv }, (v) => (v.n * v.a) / v.r, { dp: 3, ref: REF.derived, ...X(w.livRatio) })
  const kOk = avgKit >= MIN_ROOM.kitchen - 1e-9
  const bOk = avgBath >= MIN_ROOM.bath - 1e-9
  const lOk = bedRatio >= MIN_ROOM.light - 1e-9 && livRatio >= MIN_ROOM.light - 1e-9
  L.pick('Kitchen and bathroom against the usual minimum', `kitchen ≥ ${MIN_ROOM.kitchen} m², bathroom with WC ≥ ${MIN_ROOM.bath} m²`, kOk && bOk ? 'Both reach the minimum' : 'One is under the minimum',
    'NBC 2016 Part 3, as summarised in secondary sources; clause numbers not given', 'Advisory only; it does not change a quantity.')
  L.pick('Windows against the floor area', `window area ≥ ${fmt(MIN_ROOM.light * 100)}% of the floor area`, lOk ? 'Both reach a tenth' : 'One falls short',
    'NBC 2016 Part 8, as summarised in secondary sources; clause numbers not given', 'Advisory only; it does not change a quantity.')
  const chk = (id: string) => free.checks.find((x) => x.id === id)
  const rm = chk('rooms-min')
  const lt = chk('light')
  if (!rm || rm.status !== (kOk && bOk ? 'pass' : 'advisory')) miss(c, `check "rooms-min": report ${rm?.status} vs sheet ${kOk && bOk ? 'pass' : 'advisory'}`)
  if (!lt || lt.status !== (lOk ? 'pass' : 'advisory')) miss(c, `check "light": report ${lt?.status} vs sheet ${lOk ? 'pass' : 'advisory'}`)
  for (const [id, text] of [['rooms-min', `${fmt(avgKit, 1)} m²`], ['rooms-min', `${fmt(avgBath, 1)} m²`], ['light', `${fmt(avgBed, 1)} m²`], ['light', `${fmt(avgLiv, 1)} m²`], ['light', `${fmt(bedRatio * 100)}%`], ['light', `${fmt(livRatio * 100)}%`]] as const) {
    if (!chk(id)?.detail.includes(text)) miss(c, `check "${id}": the figure ${text} is not in the report text`)
  }
  const rooms = agg.nBed + agg.nLiv + agg.nKit + agg.nBath
  const fact = free.facts.find((f) => f.k === 'Rooms counted')
  T(c, 'Rooms counted in the report', cellNum(fact?.v), rooms, 'rooms')
  const blocks: CalcBlock[] = [{ id: 'checks', title: 'Room sizes and window sizes quoted in the report', lines: L.take() }]
  return { blocks, rooms }
}

/** The ranges under the four big totals, and the bands. */
export function bands(c: Ctx, vals: { painted: number; tiles: number; doorsWindows: number; t4: number }, t4kind: 'ply' | 'fc' | 'glass') {
  const { paid } = c
  const rg: [string, number, readonly [number, number], string][] = [
    ['Painted area', vals.painted, RANGE.painted, 'm²'],
    ['Tiles', vals.tiles, RANGE.tiles, 'm²'],
    ['Doors and windows', vals.doorsWindows, RANGE.doorsWindows, 'nos'],
    [t4kind === 'ply' ? 'Plywood' : t4kind === 'fc' ? 'False ceiling' : 'Window glass', vals.t4, t4kind === 'ply' ? RANGE.plywood : t4kind === 'fc' ? RANGE.falseCeiling : RANGE.glass, t4kind === 'ply' ? 'sheets' : 'm²'],
  ]
  const rows: string[][] = []
  rg.forEach(([k, v, [lo, hi], unit], i) => {
    const t = paid.tiles[i]
    if (!t || t.k !== k) { miss(c, `headline total ${i + 1}: report "${t?.k}" vs sheet "${k}"`); return }
    T(c, `Total in the report: ${k}`, cellNum(t.v), v, unit, 0)
    const m = String(t.range ?? '').match(/^([\d,.]+) to ([\d,.]+)/)
    if (!m) { miss(c, `headline total "${k}": no range in the report`); return }
    T(c, `Likely range, low end: ${k}`, cellNum(m[1]), v * lo, unit, 0)
    T(c, `Likely range, high end: ${k}`, cellNum(m[2]), v * hi, unit, 0)
    rows.push([k, `${fmt(v)} ${unit}`, String(lo), String(hi), `${rangeText(v, lo, hi)} ${unit}`])
  })
  if (paid.tiles.length !== 4) miss(c, `report has ${paid.tiles.length} totals, the sheet has 4`)
  const rangeTable: CalcTable = {
    head: ['Total in the report', 'Figure', 'Low ×', 'High ×', 'Likely range'], num: [1, 2, 3, 4], rows,
    note: 'Likely range = the figure × low and × high, each rounded to a whole number. The multipliers are the tool\'s own judgement; no standard gives a tolerance for a quantity worked out without drawings.',
  }
  const why: Record<string, string> = {
    'Painted area': 'Wall lengths come from the room plan, not from your drawings.',
    'Putty, primer and paint': 'Spread varies with brand, wall roughness and how it is applied; an emulsion alone is 0.063 to 0.138 L a m² for two coats in the makers\' sheets.',
    Tiles: 'Room sizes from the plan, the layout and breakage on site.',
    'Mortar, adhesive and grout': 'Bed thickness and joint width vary on site.',
    'False ceiling': 'Rooms and ceiling heights follow the room plan.',
    'Doors and windows': 'Counts and sizes are the tool\'s typical ones.',
    'Plywood and laminate': 'Layout of the units differs from the geometry assumed.',
  }
  if (paid.bands.length !== BANDS.length) miss(c, `bands: ${paid.bands.length} in the report, ${BANDS.length} in the sheet`)
  const bRows: string[][] = []
  BANDS.forEach((b, i) => {
    const r = paid.bands[i]
    if (!r || r.label !== b.label || Math.abs(r.low - b.low) > 1e-9 || Math.abs(r.high - b.high) > 1e-9) miss(c, `band "${b.label}": report ${r?.label} ${r?.low}-${r?.high} vs sheet ${b.low}-${b.high}`)
    else {
      c.ties.push({ item: `Band: ${b.label}`, report: `${r.low} to ${r.high}`, sheet: `${b.low} to ${b.high}`, ok: true })
      bRows.push([b.label, String(b.low), String(b.high), String(Math.round((1 - b.low) * 100)), String(Math.round((b.high - 1) * 100)), why[b.label] ?? ''])
    }
  })
  const bandTable: CalcTable = {
    head: ['Class of figure', 'Low ×', 'High ×', 'Below (%)', 'Above (%)', 'What it allows for'], num: [1, 2, 3, 4], rows: bRows,
    note: 'Printed in the report as "from X% below to Y% above the figure shown": below = (1 − low) × 100 and above = (high − 1) × 100.',
  }
  const sections: CalcSection[] = [{
    id: 's13', title: '[[s13]]. How far off the figures can be',
    intro: 'The ranges and bands are planning judgement. They are not statistics from measured buildings.',
    blocks: [{ id: 'ranges', title: 'Likely range under each total', table: rangeTable }, { id: 'bands', title: 'Bands for each class of figure', table: bandTable }],
  }]
  return { sections }
}
