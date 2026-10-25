// Section 12: concrete and shuttering of the columns and beams, then the quantities of every part of the building side by side.

import type { CalcBlock, CalcSection } from '@/lib/calcsheet'
import type { CalcCtx } from './ctx'
import type { ColRec } from '../model'
import type { BeamRec } from '../frame'
import { FOOTING_RULES } from '../footing'
import { STD, check, d0, d1, d2, d3, ex, groupBy, levelName, storeyName, sumOf, table, tableBlock, takeBlock } from './helpers'
import { fig, hasFig, put } from './figs'

const lvl = (k: number, F: number, stilt: boolean) => levelName(k, F, stilt).replace(/, top of.*/, '')

export function quantitiesSection(c: CalcCtx): CalcSection {
  const { L, work, result } = c
  const a = work.analysis
  const { plan, ctx, site } = work
  const F = plan.F
  const stilt = ctx.stilt
  const blocks: CalcBlock[] = []
  const tS = ctx.tSlab

  // ---- columns
  const colOne = (cr: ColRec, show: boolean) => {
    const f = plan.floors[cr.k]
    const b = cr.des.b
    const D = cr.des.D
    let zB: number
    if (cr.k === 0) {
      const tf = a.raft ? a.raft.tMm : a.footings.get(`${cr.ix}:${cr.iy}`)!.depth
      zB = L.calc('Level of the column base', 'z = −founding depth + lean concrete + footing thickness', '−{d} + {p} + {t} ÷ 1000', { d: site.depth, p: FOOTING_RULES.pccThicknessM, t: tf }, (v) => -v.d + v.p + v.t / 1000, { unit: 'm', dp: 3, ref: STD.rule, note: 'Measured from the ground level; the column starts on top of the footing', ...ex(cr.zBottom) })
    } else zB = L.value('Level of the column base', plan.floors[cr.k - 1].zTop, 'm', 3, 'Section 3', 'The top of the slab below')
    check(L, 'Column base level', zB, cr.zBottom)
    const len = L.calc('Concrete length of the column', 'L = top of slab − slab thickness − base', '{z} − {t} ÷ 1000 − {b}', { z: f.zTop, t: tS, b: zB }, (v) => v.z - v.t / 1000 - v.b, { unit: 'm', dp: 3, ref: STD.rule, note: 'The column stops under the beam-and-slab of the storey above', ...ex(cr.lenM) })
    const vol = L.calc('Concrete in the column', 'V = b × D × L', '{b} ÷ 1000 × {D} ÷ 1000 × {l}', { b, D, l: len }, (v) => (v.b / 1000) * (v.D / 1000) * v.l, { unit: 'm³', dp: 4, ref: STD.rule })
    let below = 0
    if (cr.k === 0 && zB < 0) below = L.calc('Part of it below the ground', 'min(L ; −base) × b × D', 'min({l}; −{z}) × {b} ÷ 1000 × {D} ÷ 1000', { l: len, z: zB, b, D }, (v) => Math.min(v.l, -v.z) * (v.b / 1000) * (v.D / 1000), { unit: 'm³', dp: 4, ref: STD.rule, note: 'Concrete below ground level takes the richer mix of the foundation' })
    const form = L.calc('Shuttering of the column', 'S = 2 (b + D) × L', '2 × ({b} + {D}) ÷ 1000 × {l}', { b, D, l: len }, (v) => ((2 * (v.b + v.D)) / 1000) * v.l, { unit: 'm²', dp: 3, ref: STD.rule })
    if (!show) L.take()
    return { len, vol, below, above: vol - below, form }
  }
  const workedCol = [...a.cols.filter((x) => x.k === 0)].sort((p, q) => q.des.b * q.des.D - p.des.b * p.des.D)[0] ?? a.cols[0]
  L.input('Column worked', `${storeyName(workedCol.k, stilt)}, ${workedCol.type}, ${workedCol.des.b} × ${workedCol.des.D} mm`, 'Section 7')
  const colWorked = colOne(workedCol, true)
  blocks.push(takeBlock(L, 'qty-col-worked', 'Column: concrete and shuttering of one column'))
  const colRes = a.cols.map((cr) => (cr === workedCol ? colWorked : colOne(cr, false)))
  const colGroups = groupBy(a.cols.map((cr, i) => ({ cr, q: colRes[i] })), (x) => `${x.cr.k}|${x.cr.type}|${x.cr.des.b}x${x.cr.des.D}|${x.q.len.toFixed(6)}`)
  const colRows = colGroups.map((g) => {
    const f = g.items[0]
    const n = g.items.length
    return [storeyName(f.cr.k, stilt), f.cr.type, d0(n), `${f.cr.des.b} × ${f.cr.des.D}`, d2(f.q.len), d3(f.q.vol), d3(n * f.q.vol), d2(n * f.q.form)]
  })
  const colVolBelow = sumOf(colRes.map((x) => x.below))
  const colVolAbove = sumOf(colRes.map((x) => x.above))
  const colForm = sumOf(colRes.map((x) => x.form))
  blocks.push(
    tableBlock('qty-col-table', 'Columns: concrete and shuttering', table(['Storey', 'Type', 'Pieces', 'b × D (mm)', 'Length (m)', 'Concrete each (m³)', 'Concrete (m³)', 'Shuttering (m²)'], colRows, { num: [2, 4, 5, 6, 7], foot: ['All columns', '', d0(a.cols.length), '', '', '', d3(colVolBelow + colVolAbove), d2(colForm)] }))
  )
  L.calc('Concrete in the columns below the ground', 'sum of the table', '{s}', { s: colVolBelow }, (v) => v.s, { unit: 'm³', dp: 3, ref: STD.rule, ...ex(work.parts.colVolBelow) })
  L.calc('Concrete in the columns above the ground', 'sum of the table', '{s}', { s: colVolAbove }, (v) => v.s, { unit: 'm³', dp: 3, ref: STD.rule, ...ex(work.parts.colVolAbove) })
  L.calc('Shuttering of the columns', 'sum of the table', '{s}', { s: colForm }, (v) => v.s, { unit: 'm²', dp: 2, ref: STD.rule, ...ex(work.parts.colForm) })
  put(L, 'col.volBelow', colVolBelow)
  put(L, 'col.volAbove', colVolAbove)
  put(L, 'col.vol', colVolBelow + colVolAbove)
  put(L, 'col.form', colForm)
  put(L, 'col.count', a.cols.length)
  blocks.push(takeBlock(L, 'qty-col-total', 'Columns: totals'))

  // ---- beams
  const colAt = (k: number, ix: number, iy: number) => a.cols.find((x) => x.k === k && x.ix === ix && x.iy === iy)!.des
  const beamOne = (r: BeamRec, show: boolean) => {
    const f = plan.floors[r.k]
    const ex2 = r.dir === 'x' ? r.ix + 1 : r.ix
    const ey2 = r.dir === 'x' ? r.iy : r.iy + 1
    const c0 = colAt(r.k, r.ix, r.iy)
    const c1 = colAt(r.k, ex2, ey2)
    const along = L.calc('Column width along the beam, mean of the two ends', 'a = (c0 + c1) ÷ 2', '({a} + {b}) ÷ 2', r.dir === 'x' ? { a: c0.b, b: c1.b } : { a: c0.D, b: c1.D }, (v) => (v.a + v.b) / 2, { unit: 'mm', dp: 0, ref: 'Section 7' })
    const clear = L.calc('Clear length of the beam', 'L − a', '{L} − {a} ÷ 1000', { L: r.L, a: along }, (v) => v.L - v.a / 1000, { unit: 'm', dp: 3, ref: STD.rule })
    const dBelow = L.calc('Depth of the beam below the slab', '(D − slab thickness)', '({D} − {t}) ÷ 1000', { D: r.des!.D, t: tS }, (v) => (v.D - v.t) / 1000, { unit: 'm', dp: 3, ref: STD.rule, note: 'The part within the slab is counted with the slab' })
    const vol = L.calc('Concrete in the beam', 'V = b × depth below slab × clear length × correction', '{b} ÷ 1000 × {d} × {c} × {s}', { b: ctx.bBeam, d: dBelow, c: clear, s: f.scale }, (v) => (v.b / 1000) * v.d * v.c * v.s, { unit: 'm³', dp: 4, ref: STD.rule, note: 'The correction is the floor-area correction of Section 3' })
    const form = L.calc('Shuttering of the beam', 'S = (b + 2 × depth below slab) × clear length × correction', '({b} ÷ 1000 + 2 × {d}) × {c} × {s}', { b: ctx.bBeam, d: dBelow, c: clear, s: f.scale }, (v) => (v.b / 1000 + 2 * v.d) * v.c * v.s, { unit: 'm²', dp: 3, ref: STD.rule, note: 'Soffit and two sides' })
    if (!show) L.take()
    return { clear, vol, form }
  }
  const allBeams = a.beams.flatMap((row) => row)
  const workedBeam = allBeams[0]
  L.input('Beam worked', `${lvl(workedBeam.k, F, stilt)}, along the ${workedBeam.dir === 'x' ? 'length' : 'width'}, span ${workedBeam.L.toFixed(2)} m, depth ${workedBeam.des!.D} mm`, 'Section 6')
  const bw0 = beamOne(workedBeam, true)
  blocks.push(takeBlock(L, 'qty-beam-worked', 'Beam: concrete and shuttering of one beam'))
  const beamRes = allBeams.map((r) => (r === workedBeam ? bw0 : beamOne(r, false)))
  const bg = groupBy(allBeams.map((r, i) => ({ r, q: beamRes[i] })), (x) => `${x.r.k}|${x.r.perimeter ? 'edge' : 'inner'}|${x.r.des!.D}`)
  const beamRows = bg.map((g) => {
    const f = g.items[0]
    return [lvl(f.r.k, F, stilt), f.r.perimeter ? 'Edge beam' : 'Inner beam', d0(f.r.des!.D), d0(g.items.length), d2(sumOf(g.items.map((x) => x.q.clear))), d3(sumOf(g.items.map((x) => x.q.vol))), d2(sumOf(g.items.map((x) => x.q.form)))]
  })
  const beamVol = sumOf(beamRes.map((x) => x.vol))
  const beamForm = sumOf(beamRes.map((x) => x.form))
  blocks.push(
    tableBlock('qty-beam-table', 'Floor beams: concrete and shuttering', table(['Slab level', 'Type', 'Depth D (mm)', 'Pieces', 'Clear length (m)', 'Concrete (m³)', 'Shuttering (m²)'], beamRows, { num: [2, 3, 4, 5, 6], foot: ['All beams', '', '', d0(allBeams.length), d2(sumOf(beamRes.map((x) => x.clear))), d3(beamVol), d2(beamForm)] }), {
      note: 'Concrete and shuttering include the correction of each floor to the area you gave. The plinth beams are counted in Section 8.',
    })
  )
  L.calc('Concrete in the floor beams', 'sum of the table', '{s}', { s: beamVol }, (v) => v.s, { unit: 'm³', dp: 3, ref: STD.rule, ...ex(sumOf(work.parts.beamVol)) })
  L.calc('Shuttering of the floor beams', 'sum of the table', '{s}', { s: beamForm }, (v) => v.s, { unit: 'm²', dp: 2, ref: STD.rule, ...ex(sumOf(work.parts.beamForm)) })
  check(L, 'Number of floor beams', allBeams.length, sumOf(work.parts.beamCount), 0)
  put(L, 'beam.vol', beamVol)
  put(L, 'beam.form', beamForm)
  put(L, 'beam.count', allBeams.length)
  blocks.push(takeBlock(L, 'qty-beam-total', 'Floor beams: totals'))

  // ---- the parts table
  const need = (k: string) => (hasFig(L, k) ? fig(L, k) : 0)
  const m = result.members
  const parts: Array<{ key: string; label: string; count: number; conc: number; steel: number; form: number; eng: { concreteM3: number; steelKg: number; formworkM2: number; count: number } }> = [
    { key: 'footings', label: 'Footings (or raft)', count: need('footing.count'), conc: need('footing.concrete'), steel: need('steel.fam.footing'), form: need('footing.form'), eng: m.footings },
    { key: 'plinthBeams', label: 'Plinth beams', count: need('plinth.count'), conc: need('plinth.concrete'), steel: need('steel.fam.plinth'), form: need('plinth.form'), eng: m.plinthBeams },
    { key: 'columns', label: 'Columns', count: a.cols.length, conc: colVolBelow + colVolAbove, steel: need('steel.fam.cols'), form: colForm, eng: m.columns },
    { key: 'beams', label: 'Floor beams', count: allBeams.length, conc: beamVol, steel: need('steel.fam.beams'), form: beamForm, eng: m.beams },
    { key: 'slabs', label: 'Slabs', count: need('slab.count'), conc: need('slab.vol'), steel: need('steel.fam.slabs'), form: need('slab.form'), eng: m.slabs },
    { key: 'stairs', label: 'Staircase', count: need('stair.count'), conc: need('stair.vol'), steel: need('steel.fam.stair'), form: need('stair.form'), eng: m.stairs },
    { key: 'secondary', label: 'Lintels, sunshades, parapet band, stair head-room', count: need('sec.count'), conc: need('sec.vol'), steel: need('sec.steel'), form: need('sec.form'), eng: m.secondary },
  ]
  if (m.balconies) parts.push({ key: 'balconies', label: 'Balcony slabs', count: need('bal.count'), conc: need('bal.vol'), steel: need('steel.fam.balcony'), form: need('bal.form'), eng: m.balconies })
  for (const p of parts) {
    check(L, `${p.label}: pieces`, p.count, p.eng.count, 0)
    check(L, `${p.label}: concrete`, p.conc, p.eng.concreteM3)
    check(L, `${p.label}: steel`, p.steel, p.eng.steelKg)
    check(L, `${p.label}: shuttering`, p.form, p.eng.formworkM2)
    put(L, `part.${p.key}.count`, p.count)
    put(L, `part.${p.key}.conc`, p.conc)
    put(L, `part.${p.key}.steel`, p.steel)
    put(L, `part.${p.key}.form`, p.form)
  }
  const tot = { conc: sumOf(parts.map((p) => p.conc)), steel: sumOf(parts.map((p) => p.steel)), form: sumOf(parts.map((p) => p.form)) }
  blocks.push(
    tableBlock('qty-parts', 'Concrete, steel and shuttering by part', table(['Part', 'Pieces', 'Concrete (m³)', 'Steel (kg)', 'Shuttering (m²)'], parts.map((p) => [p.label, d0(p.count), d2(p.conc), d0(p.steel), d1(p.form)]), { num: [1, 2, 3, 4], foot: ['Reinforced concrete total', '', d2(tot.conc), d0(tot.steel), d1(tot.form)] }), {
      intro: 'Each figure is carried from the section that worked it: Section 8 (footings, plinth beams), Section 9 (slabs, staircase), Section 10 (balconies, small items), Section 11 (steel) and the two tables above.',
      note: `Steel here is the bar weight before the cutting waste. Lean concrete under the footings (M7.5) is ${d2(need('footing.pcc'))} m³ and is not part of the total.`,
    })
  )

  // ---- totals
  const below = L.calc('Concrete below the ground', 'footings + plinth beams + columns below ground', '{a} + {b} + {c}', { a: need('footing.concrete'), b: need('plinth.concrete'), c: colVolBelow }, (v) => v.a + v.b + v.c, { unit: 'm³', dp: 2, ref: STD.rule, ...ex(work.parts.volBelow), note: 'Takes the mix of the foundations (Section 13)' })
  const above = L.calc('Concrete above the ground', 'columns above + beams + slabs + staircase + small items + balconies', '{a} + {b} + {c} + {d} + {e} + {f}', { a: colVolAbove, b: beamVol, c: need('slab.vol'), d: need('stair.vol'), e: need('sec.vol'), f: need('bal.vol') }, (v) => v.a + v.b + v.c + v.d + v.e + v.f, { unit: 'm³', dp: 2, ref: STD.rule, ...ex(work.parts.volAbove), note: 'Takes the mix of the superstructure (Section 13)' })
  const total = L.calc('Concrete in the whole structure', 'below + above', '{a} + {b}', { a: below, b: above }, (v) => v.a + v.b, { unit: 'm³', dp: 2, ref: STD.rule, ...ex(result.totals.concreteM3), result: true })
  check(L, 'Concrete by part adds up', tot.conc, total)
  const formT = L.calc('Shuttering in the whole structure', 'sum of the parts', '{s}', { s: tot.form }, (v) => v.s, { unit: 'm²', dp: 1, ref: STD.rule, ...ex(result.totals.formworkM2), result: true })
  L.calc('Steel in the whole structure, net', 'sum of the parts', '{s}', { s: tot.steel }, (v) => v.s, { unit: 'kg', dp: 0, ref: STD.rule, ...ex(result.totals.steelNetKg), result: true })
  put(L, 'conc.below', below)
  put(L, 'conc.above', above)
  put(L, 'conc.total', total)
  put(L, 'form.total', formT)
  put(L, 'steel.total', tot.steel)
  blocks.push(takeBlock(L, 'qty-totals', 'Totals for the structure', { note: 'The excavation and the lean concrete are in Section 8; the cement, sand and aggregate are in Section 13.' }))

  return { id: 'quantities', title: '12. Concrete and shuttering by member', intro: 'The concrete and shuttering of the columns and beams are worked here; the other members were worked in their own sections. The parts are then set side by side and added.', blocks }
}
