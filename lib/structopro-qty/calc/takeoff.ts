// Section 11: the steel take-off. Every bar line the model recorded is weighed again, added up by member family and by diameter, and turned into the steel to buy.

import type { CalcBlock, CalcSection } from '@/lib/calcsheet'
import type { CalcCtx } from './ctx'
import { BINDING_WIRE_PER_TONNE, STEEL_BUY } from '../model'
import { roundUp25 } from '../codes'
import { barKgPerM, bars12m, isCoil } from '../labels'
import { STD, barKg, check, d0, d1, d3, ex, groupBy, levelName, plural, sumOf, table, tableBlock, takeBlock } from './helpers'
import { fig, hasFig, put, putText } from './figs'

interface Family {
  key: string
  label: string
  match: (g: string) => boolean
  section: string
  /** the figure an earlier section of this sheet rebuilt for the same family, if there is one */
  earlier?: string
}

const FAMILIES: Family[] = [
  { key: 'footing', label: 'Footings (or raft)', match: (g) => g === 'footing', section: 'Section 8', earlier: 'footing.steel' },
  { key: 'plinth', label: 'Plinth beams', match: (g) => g === 'plinth', section: 'Section 8', earlier: 'plinth.steel' },
  { key: 'cols', label: 'Columns', match: (g) => g.startsWith('col:'), section: 'Section 7' },
  { key: 'beams', label: 'Floor beams', match: (g) => g.startsWith('beam:'), section: 'Section 6' },
  { key: 'slabs', label: 'Floor slabs', match: (g) => g.startsWith('slab:'), section: 'Section 9', earlier: 'slab.steel' },
  { key: 'stair', label: 'Staircase', match: (g) => g === 'stair', section: 'Section 9', earlier: 'stair.steel' },
  { key: 'balcony', label: 'Balcony slabs', match: (g) => g === 'balcony', section: 'Section 10', earlier: 'bal.steel' },
  { key: 'lintel', label: 'Lintels', match: (g) => g === 'lintel', section: 'Section 10', earlier: 'sec.lintels.steel' },
  { key: 'sunshade', label: 'Sunshades', match: (g) => g === 'sunshade', section: 'Section 10', earlier: 'sec.sunshades.steel' },
  { key: 'parapet', label: 'Terrace parapet band', match: (g) => g === 'parapet', section: 'Section 10', earlier: 'sec.parapet.steel' },
  { key: 'mumty', label: 'Stair head-room roof', match: (g) => g === 'mumty', section: 'Section 10', earlier: 'sec.mumty.steel' },
]

export function takeoffSection(c: CalcCtx): CalcSection {
  const { L, work } = c
  const a = work.analysis
  const book = a.book
  const { plan, ctx } = work
  const F = plan.F
  const blocks: CalcBlock[] = []

  // ---- rules
  L.pick('Mass of a bar', 'mass per metre = φ² ÷ 162.2 (φ in mm)', `for example 12 mm: ${d3(barKgPerM(12))} kg/m, 16 mm: ${d3(barKgPerM(16))} kg/m`, STD.is1786, 'The weights in every section of this sheet use this mass')
  L.pick('Cut lengths', 'every bar length is taken up to the next 25 mm', `a 3,310 mm bar is weighed as ${d0(roundUp25(3310))} mm`, `${STD.is2502} cl. 5.1.1`)
  L.pick('Hooks, laps and cover', 'allowed for in the length of each bar where it is worked', 'beams: Section 6; columns: Section 7; footings and plinth: Section 8; slabs: Section 9', STD.rule, 'Hooks of stirrups and ties follow the tail rule of Section 6')
  L.pick('Stock length', 'bars over 6 mm are bought in 12 m lengths', '6 mm bar comes as a coil, cut and bent on site', `${STD.cpwd}, as quoted in the tool's research notes (item number not re-read)`)
  L.value('Allowance for cutting waste', (STEEL_BUY - 1) * 100, '%', 0, `${STD.cpwd}, as quoted in the tool's research notes (item number not re-read)`, 'Added to the net weight to give the steel to buy')
  L.value('Binding wire', BINDING_WIRE_PER_TONNE, 'kg per tonne of steel', 0, STD.assume, 'An upper estimate from the usual rate of about 0.9 kg per 100 kg')
  blocks.push(takeBlock(L, 'take-rules', 'Steel: how it is counted'))

  // ---- every bar line, weighed again, grouped
  const lineKg = book.log.map((e) => barKg(e.phi, e.lengthMm, e.count))
  book.log.forEach((e, i) => check(L, 'Steel record: weight of one bar line', lineKg[i], e.kg))
  const groups = groupBy(
    book.log.map((e, i) => ({ e, kg: lineKg[i] })),
    (x) => x.e.group
  )
  const scaleOf = (g: string) => book.scales[g] ?? 1
  const recorded = new Map<string, number>()
  const counted = new Map<string, number>()
  const byPhi = new Map<number, number>()
  for (const g of groups) {
    const rec = sumOf(g.items.map((x) => x.kg))
    recorded.set(g.key, rec)
    counted.set(g.key, rec * scaleOf(g.key))
    for (const x of g.items) byPhi.set(x.e.phi, (byPhi.get(x.e.phi) ?? 0) + x.kg * scaleOf(g.key))
  }

  // corrections table (levels)
  const corr: string[][] = []
  for (let k = 0; k < F; k++) {
    const b = scaleOf(`beam:${k}`)
    const s = scaleOf(`slab:${k}`)
    check(L, 'Beam steel correction equals the floor-area correction', b, plan.floors[k].scale)
    corr.push([levelName(k, F, ctx.stilt).replace(/, top of.*/, ''), b.toFixed(4), s.toFixed(4)])
  }
  blocks.push(
    tableBlock('take-corr', 'Corrections applied to the recorded bars', table(['Level', 'Beams', 'Slabs'], corr, { num: [1, 2], note: 'The beams are corrected for the floor-area difference (Section 3). The slabs are corrected for the floor-area difference and for the stair opening (Section 9). Columns, footings and the other members are not corrected.' }))
  )

  const fam = FAMILIES.map((f) => {
    const gs = groups.filter((g) => f.match(g.key))
    const lines = sumOf(gs.map((g) => g.items.length))
    const rec = sumOf(gs.map((g) => recorded.get(g.key) ?? 0))
    const net = sumOf(gs.map((g) => counted.get(g.key) ?? 0))
    return { f, lines, rec, net }
  })
  const unmatched = groups.filter((g) => !FAMILIES.some((f) => f.match(g.key)))
  check(L, 'Bar groups outside the member families', unmatched.length, 0, 0)
  const engineFam: Record<string, number> = {
    footing: work.parts.steel.footing,
    plinth: work.parts.steel.plinth,
    cols: work.parts.steel.cols,
    beams: work.parts.steel.beams,
    slabs: work.parts.steel.slabs,
    stair: work.parts.steel.stair,
    balcony: a.balcony?.steelKg ?? 0,
    lintel: work.parts.secondary.items.find((i) => i.key === 'lintels')?.steelKg ?? 0,
    sunshade: work.parts.secondary.items.find((i) => i.key === 'sunshades')?.steelKg ?? 0,
    parapet: work.parts.secondary.items.find((i) => i.key === 'parapet')?.steelKg ?? 0,
    mumty: work.parts.secondary.items.find((i) => i.key === 'mumty')?.steelKg ?? 0,
  }
  for (const x of fam) {
    check(L, `Steel of ${x.f.label.toLowerCase()}`, x.net, engineFam[x.f.key])
    if (x.f.earlier && hasFig(L, x.f.earlier)) check(L, `Steel of ${x.f.label.toLowerCase()} against ${x.f.section}`, fig(L, x.f.earlier), x.net)
    put(L, `steel.fam.${x.f.key}`, x.net)
  }
  const famRows = fam.filter((x) => x.lines > 0).map((x) => [x.f.label, d0(x.lines), d1(x.rec), d1(x.net), x.f.section])
  const used = fam.filter((x) => x.lines > 0)
  const net = L.calc('Steel in the building, net', 'sum of the families', used.map((_, i) => `{f${i}}`).join(' + '), Object.fromEntries(used.map((x, i) => [`f${i}`, x.net])), (v) => Object.values(v).reduce((s, x) => s + x, 0), { unit: 'kg', dp: 1, ref: STD.rule, ...ex(work.parts.steelNet), result: true })
  blocks.push(
    tableBlock('take-families', 'Steel by member family', table(['Member', 'Bar lines', 'As recorded (kg)', 'After corrections (kg)', 'Worked in'], famRows, { num: [1, 2, 3], foot: ['All members', d0(sumOf(fam.map((x) => x.lines))), d1(sumOf(fam.map((x) => x.rec))), d1(net), ''] }), {
      intro: 'Each bar line the model recorded (diameter, cut length, number) is weighed again here and the lines are added by family. Sections 6 to 10 show how the bars of the governing members were chosen; this table adds every member.',
    })
  )
  blocks.push(takeBlock(L, 'take-net', 'Net steel'))
  put(L, 'steel.net', net)

  // ---- by diameter
  const phis = [...byPhi.keys()].sort((p, q) => p - q)
  const worked = phis.reduce((best, p) => ((byPhi.get(p) ?? 0) > (byPhi.get(best) ?? 0) ? p : best), phis[0])
  const eng = work.parts.byPhi
  phis.forEach((p) => check(L, `Net steel of ${p} mm bars`, byPhi.get(p) ?? 0, eng[p] ?? 0))
  check(L, 'Number of bar diameters', phis.length, Object.keys(eng).length, 0)
  const buyOf = (p: number, show: boolean) => {
    const kgNet = L.value(`Net weight of ${p} mm bars`, byPhi.get(p) ?? 0, 'kg', 1, 'Section 11, steel by member family')
    const buy = L.calc(`Steel to buy, ${p} mm`, 'net × 1.05', '{k} × {w}', { k: kgNet, w: STEEL_BUY }, (v) => v.k * v.w, { unit: 'kg', dp: 1, ref: STD.rule, ...ex((eng[p] ?? 0) * STEEL_BUY) })
    const m = L.calc(`Mass per metre of ${p} mm bar`, 'φ² ÷ 162.2', '{p}² ÷ 162.2', { p }, (v) => (v.p * v.p) / 162.2, { unit: 'kg/m', dp: 3, ref: STD.is1786, ...ex(barKgPerM(p)) })
    let n = 0
    if (isCoil(p)) L.say('Supply', `${p} mm bar comes as a coil, cut and bent on site, so no lengths are counted.`, `${STD.cpwd}, as quoted in the tool's research notes`)
    else n = L.calc(`12 m lengths of ${p} mm`, 'ceil(steel to buy ÷ (mass per metre × 12))', 'ceil({b} ÷ ({m} × 12))', { b: buy, m }, (v) => Math.ceil(v.b / (v.m * 12)), { dp: 0, ref: STD.rule, expect: bars12m(p, buy), tol: 0 })
    if (show) blocks.push(takeBlock(L, 'take-dia-worked', `Steel to buy: the ${p} mm bars worked`))
    else L.take()
    return { buy, n }
  }
  const dia = phis.map((p) => ({ p, ...buyOf(p, p === worked) }))
  const buy = L.calc('Steel to buy, all sizes', 'net × 1.05', '{k} × {w}', { k: net, w: STEEL_BUY }, (v) => v.k * v.w, { unit: 'kg', dp: 0, ref: STD.rule, ...ex(work.parts.steelBuy), result: true })
  check(L, 'Steel to buy by diameter adds up', sumOf(dia.map((x) => x.buy)), buy)
  const lengths = sumOf(dia.map((x) => x.n))
  const wire = L.calc('Binding wire', 'steel ÷ 1000 × 9', '{k} ÷ 1000 × {w}', { k: net, w: BINDING_WIRE_PER_TONNE }, (v) => (v.k / 1000) * v.w, { unit: 'kg', dp: 1, ref: STD.assume, ...ex(work.parts.binding), result: true })
  blocks.push(
    tableBlock('take-dia', 'Steel by diameter', table(['Diameter', 'Net (kg)', 'To buy, +5 % (kg)', '12 m lengths'], dia.map((x) => [`${x.p} mm`, d1(byPhi.get(x.p) ?? 0), d0(x.buy), isCoil(x.p) ? 'coil' : d0(x.n)]), { num: [1, 2, 3], foot: ['All sizes', d1(net), d0(buy), d0(lengths)] }))
  )
  blocks.push(takeBlock(L, 'take-buy', 'Steel to buy and binding wire', { note: `${phis.length} ${plural(phis.length, 'size', 'sizes')} of bar in all. Bars are counted in whole 12 m lengths for each size separately.` }))
  put(L, 'steel.buy', buy)
  put(L, 'steel.binding', wire)
  put(L, 'steel.lengths', lengths)
  putText(L, 'steel.dia.list', phis.join(','))
  for (const x of dia) {
    put(L, `steel.dia.${x.p}.buy`, x.buy)
    put(L, `steel.dia.${x.p}.n`, x.n)
  }
  return { id: 'takeoff', title: '11. Steel take-off', intro: 'All the reinforcement of the building is added up here: by member family, then by bar diameter, then turned into the steel to buy and the binding wire.', blocks }
}
