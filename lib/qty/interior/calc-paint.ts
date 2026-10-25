/*
  InteriorPro calculation sheet, part 4: putty, primer and paint; the false ceiling.
*/

import type { CalcBlock, CalcSection, CalcTable } from '@/lib/calcsheet'
import { M2_TO_SQFT, fmt, round } from '../util'
import { IN_SYS, PAINT_WASTE } from './finish'
import { EXT_SYS, FC, WOOD } from './model'
import { REF, T, X, cmpTable, repNum, type Ctx } from './calc-kit'
import type { PlanOut } from './calc-plan'
import type { SurfOut } from './calc-surf'

export function paint(c: Ctx, P: PlanOut, S: SurfOut) {
  const { inp, w, L } = c
  const sys = IN_SYS[inp.paint]
  const ex = inp.exterior === 'none' ? null : EXT_SYS[inp.exterior]

  const paintedTotal = L.calc('Painted area, inside and outside', 'inside + outside', '{a:1} + {b:1}', { a: S.interiorPaint, b: S.extPaint }, (v) => v.a + v.b,
    { unit: 'm²', dp: 1, result: true, note: 'Doors are measured on their own and are not in this total.', ...X(w.paintedTotal) })
  L.pick('Wastage on putty, primer and paint', 'quantity = area × spread × (1 + wastage)', `${round((PAINT_WASTE - 1) * 100)}%`, REF.assume, 'No maker or CPWD sheet gives a wastage figure.')
  const b0: CalcBlock = { id: 'painted', title: 'Painted area', lines: L.take() }

  /* spread and coverage */
  const cov = (s: number) => [fmt(1 / s, 1), fmt((1 / s) * M2_TO_SQFT, 0)]
  const spreadRows: string[][] = []
  const addSp = (name: string, s: number, unit: string, coats: string, src: string) => spreadRows.push([name, `${fmt(s, 3)} ${unit}`, ...cov(s), coats, src])
  if (sys.putty) addSp(sys.putty.label, sys.putty.kg, 'kg', 'about 1 mm, in coats as the maker advises', sys.putty.src)
  addSp('Primer, inside', sys.primer.l, 'L', 'one coat', sys.primer.src)
  addSp(sys.finish.label, sys.finish.l, 'L', sys.coats, sys.finish.src)
  if (ex) {
    if (ex.primer) addSp('Primer, outside', ex.primer, 'L', 'one coat', 'Maker sheet, 100 to 120 sq ft a litre; the DAR figure differs (see the report assumptions)')
    addSp(ex.finish.label, ex.finish.v, ex.finish.unit, ex.label, ex.src)
  }
  addSp('Primer, doors', WOOD.primer, 'L', 'one coat', 'CPWD DAR 2016 item 13.48.2')
  addSp('Enamel or multi-surface paint, doors', WOOD.paint, 'L', 'two coats', 'CPWD DAR 2016 item 13.50.1')
  const spreadTable: CalcTable = {
    head: ['Layer', 'Spread, all coats, a m²', 'Covers (m² per kg or L)', 'Covers (sq ft per kg or L)', 'Coats', 'Source'], num: [1, 2, 3],
    rows: spreadRows,
    note: 'Covers = 1 ÷ spread. The spread is for the coats named, on a plastered surface. It is a maker\'s figure or a CPWD analysis-of-rates coefficient, not an Indian Standard, and it differs from brand to brand.',
  }
  const b1: CalcBlock = { id: 'spread', title: 'How far each layer spreads, and the coats counted', table: spreadTable }

  /* quantities */
  type Row = { label: string; area: number; s: number; unit: string; q: number }
  const rows: Row[] = []
  const qty = (label: string, area: number, s: number, unit: string, expect: number, areaLabel: string) => {
    const q = L.calc(label, 'quantity = area × spread × (1 + wastage)', '{A:1} × {s} × {k}', { A: area, s, k: PAINT_WASTE }, (v) => v.A * v.s * v.k,
      { unit, dp: unit === 'kg' ? 1 : 2, ref: REF.maker + ' / CPWD DAR 2016 (spread table above)', note: areaLabel, ...X(expect) })
    rows.push({ label, area, s, unit, q })
  }
  if (sys.putty) qty(sys.putty.label, S.interiorPaint, sys.putty.kg, 'kg', w.puttyKg, 'Inside walls and ceilings')
  qty('Primer, inside', S.interiorPaint, sys.primer.l, 'L', w.primerL, 'Inside walls and ceilings')
  qty(sys.finish.label, S.interiorPaint, sys.finish.l, 'L', w.finishL, 'Inside walls and ceilings')
  if (ex) {
    if (ex.primer) qty('Primer, outside', S.extPaint, ex.primer, 'L', w.exPrimerL, 'Outside walls')
    qty(ex.finish.label, S.extPaint, ex.finish.v, ex.finish.unit, w.exFinish, 'Outside walls')
  }
  qty('Primer, doors', S.doorSurf, WOOD.primer, 'L', w.woodPrimerL, 'Doors, both faces')
  qty('Enamel or multi-surface paint, doors', S.doorSurf, WOOD.paint, 'L', w.enamelL, 'Doors, both faces')
  const b2: CalcBlock = { id: 'paint-qty', title: 'Putty, primer and paint to order', lines: L.take() }

  cmpTable(c, 'paint', rows.map((r) => [null, r.area, r.s, r.q, null]))
  rows.forEach((r, i) => T(c, `Paint: ${r.label}`, repNum(c, 'paint', i, 3), r.q, r.unit, 0))

  const sections: CalcSection[] = [{
    id: 's7', title: '[[s7]]. Putty, primer and paint',
    intro: `Putty, primer and paint are counted by the area they cover. Paint area × spread × ${PAINT_WASTE} gives what to buy. The number of coats is already inside each spread.`,
    blocks: [b0, b1, b2],
  }]
  let k = 0
  const take = () => rows[k++].q
  const puttyKg = sys.putty ? take() : 0
  const primerL = take()
  const finishL = take()
  const exPrimerL = ex && ex.primer ? take() : 0
  const exFinish = ex ? take() : 0
  const woodPrimerL = take()
  const enamelL = take()
  return { sections, paintedTotal, puttyKg, primerL, finishL, exPrimerL, exFinish, woodPrimerL, enamelL }
}
export type PaintOut = ReturnType<typeof paint>

export function falseCeiling(c: Ctx, P: PlanOut) {
  const { inp, w, L } = c
  const { agg } = P
  const none = { boards: 0, sectionM: 0, channelM: 0, perimM: 0, cleats: 0, fasteners: 0, hangers: 0, screws: 0, wireM: 0 }
  if (inp.falseCeiling === 'none') return { sections: [] as CalcSection[], fcArea: 0, fcv: none }
  const hall = inp.falseCeiling === 'hall'
  const fcArea = L.calc('False ceiling area', hall ? 'living rooms' : 'living rooms + bedrooms', hall ? '{a:1}' : '{a:1} + {b:1}', { a: agg.aLiv, b: agg.aBed },
    (v) => (hall ? v.a : v.a + v.b), { unit: 'm²', dp: 1, ref: REF.rule, note: 'Kitchens and bathrooms are never given a false ceiling here.', result: true, ...X(w.fcArea) })
  const fcPerim = L.calc('Wall length round the ceilings', hall ? 'living rooms' : 'living rooms + bedrooms', hall ? '{a:1}' : '{a:1} + {b:1}', { a: agg.pLiv, b: agg.pBed },
    (v) => (hall ? v.a : v.a + v.b), { unit: 'm', dp: 1, ref: REF.rule, ...X(w.fcPerim) })
  const src = 'A public CPWD-pattern tender specification for a gypsum ceiling (framing at 450 / 1200 / 1200 / 230 mm); not an Indian Standard'
  const f = (label: string, formula: string, working: string, vars: Record<string, number>, fn: (v: Record<string, number>) => number, unit: string, dp: number, expect: number, note?: string) =>
    L.calc(label, formula, working, vars, fn, { unit, dp, ref: src, note, ...X(expect) })
  const boards = f('Gypsum boards, 2400 × 1200 mm', 'boards = next whole number above (area × 1.08 ÷ board area)', 'next whole number above ({A:1} × {k}) ÷ {b}', { A: fcArea, k: FC.boardWaste, b: FC.boardM2 },
    (v) => Math.ceil((v.A * v.k) / v.b - 1e-9), 'sheets', 0, w.fc.boards, '8% extra for cutting (an assumption)')
  const sectionM = f('Ceiling sections, 0.5 mm', 'area × m a m²', '{A:1} × {k}', { A: fcArea, k: FC.sectionM }, (v) => v.A * v.k, 'm', 1, w.fc.sectionM, 'At 450 mm centres')
  const channelM = f('Intermediate channel, GI', 'area × m a m²', '{A:1} × {k}', { A: fcArea, k: FC.channelM }, (v) => v.A * v.k, 'm', 1, w.fc.channelM, 'At 1200 mm centres')
  const perimM = f('Perimeter channel', 'wall length round the ceilings', '{p:1}', { p: fcPerim }, (v) => v.p, 'm', 1, w.fc.perimM, 'All round each room')
  const cleats = f('Cleats', 'next whole number above (area × a m²)', 'next whole number above {A:1} × {k}', { A: fcArea, k: FC.cleats }, (v) => Math.ceil(v.A * v.k - 1e-9), 'nos', 0, w.fc.cleats)
  const fasteners = f('Dash fasteners and bolts', 'next whole number above (area × a m²)', 'next whole number above {A:1} × {k}', { A: fcArea, k: FC.fasteners }, (v) => Math.ceil(v.A * v.k - 1e-9), 'nos', 0, w.fc.fasteners)
  const hangers = f('Hangers', 'next whole number above (area × a m²)', 'next whole number above {A:1} × {k}', { A: fcArea, k: FC.hangers }, (v) => Math.ceil(v.A * v.k - 1e-9), 'nos', 0, w.fc.hangers)
  f('Hanger rod, total length', 'area × hangers a m² × length of one', '{A:1} × {k} × {l}', { A: fcArea, k: FC.hangers, l: FC.hangerM }, (v) => v.A * v.k * v.l, 'm', 1, w.fc.hangerM, 'Each hanger is 0.45 m long (an assumption)')
  const screws = f('Drywall screws, 3.5 × 25 mm', 'screws = next whole number above (area × 9.7 + perimeter ÷ 0.23)', 'next whole number above {A:1} × {k} + {p:1} ÷ {s}', { A: fcArea, k: FC.screws, p: fcPerim, s: FC.screwPitch },
    (v) => Math.ceil(v.A * v.k + v.p / v.s - 1e-9), 'nos', 0, w.fc.screws, 'On the sections, plus one every 230 mm round the edge')
  const wireM = f('Binding wire, 2.64 mm', 'area × m a m²', '{A:1} × {k}', { A: fcArea, k: FC.wireM }, (v) => v.A * v.k, 'm', 1, w.fc.wireM, '230 mm at each junction')
  const vals = [boards, sectionM, channelM, perimM, cleats, fasteners, hangers, screws, wireM]
  const labs = ['Gypsum board', 'Ceiling sections', 'Intermediate channel', 'Perimeter channel', 'Cleats', 'Fasteners and bolts', 'Hangers', 'Drywall screws', 'Binding wire']
  const units = ['sheets', 'm', 'm', 'm', 'nos', 'nos', 'nos', 'nos', 'm']
  const dps = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  cmpTable(c, 'fc', vals.map((v) => [null, v]))
  vals.forEach((v, i) => T(c, `False ceiling: ${labs[i]}`, repNum(c, 'fc', i, 1), v, units[i], dps[i]))
  const sections: CalcSection[] = [{
    id: 's8', title: '[[s8]]. False ceiling',
    intro: 'Gypsum board on a steel frame. The counts for each m² are the spacings of a public CPWD-pattern specification, written down once and multiplied by the area. Jointing tape and compound, cove lights and access panels are not counted.',
    blocks: [{ id: 'fc', title: `False ceiling in ${hall ? 'the living rooms' : 'the living rooms and bedrooms'}`, lines: L.take() }],
  }]
  return { sections, fcArea, fcv: { boards, sectionM, channelM, perimM, cleats, fasteners, hangers, screws, wireM } }
}
