// Section 13: the mix of each grade of concrete, and the cement, sand, aggregate, shuttering and excavation to order.

import type { CalcBlock, CalcSection, Ledger } from '@/lib/calcsheet'
import type { CalcCtx } from './ctx'
import { M2_TO_SQFT, M3_TO_CFT, SITE_WASTAGE } from '../model'
import { CPWD_NOMINAL, MIX_RULES, T5_RCC, designMixTrace, mixFor, type Exposure, type Grade } from '../materials'
import { STD, check, d0, d1, d2, d3, ex, sumOf, table, tableBlock, takeBlock } from './helpers'
import { fig, put, putText } from './figs'

const CPWD_REF = `${STD.cpwd}, as quoted in the tool's research notes (item number not re-read)`

/** Most dry aggregate (kg) per 50 kg of cement that IS 456 Table 9 allows in a nominal mix. */
const TABLE9_MAX_AGGREGATE: Partial<Record<Grade, number>> = { 'M7.5': 625, M10: 480, M15: 330, M20: 250 }

interface MixOut {
  cementKg: number
  sandM3: number
  aggM3: number
  basis: string
}

const expName = (e: Exposure) => e.replace('_', ' ')

/** Compare the mix the sheet rebuilt with the engine's mix for the same grade and exposure. */
function compareMix(L: Ledger, label: string, out: MixOut, grade: Grade, exposure: Exposure): void {
  const eng = mixFor(grade, exposure)
  check(L, `${label}: cement per m³`, out.cementKg, eng.cementKg)
  check(L, `${label}: sand per m³`, out.sandM3, eng.sandM3)
  check(L, `${label}: aggregate per m³`, out.aggM3, eng.aggregateM3)
  const same = out.basis === eng.basis
  L.checked.push({ label: `${label}: basis sentence`, sheet: same ? 1 : 0, engine: 1 })
  if (!same) L.mismatches.push(`${label}: basis "${out.basis}" vs engine "${eng.basis}"`)
}

/** The design mix of IS 10262, step by step. Every step is checked against the engine's own trace of the same mix. */
function designMixSheet(L: Ledger, grade: Grade, exposure: Exposure): MixOut {
  const tr = designMixTrace(grade, exposure)
  const R = MIX_RULES
  L.pick('Exposure condition of this concrete', 'from Section 2', expName(exposure), `${STD.is456} Table 3`)
  L.value('Largest free water-cement ratio allowed', tr.maxWc, '', 2, `${STD.is456} Table 5`, `Reinforced concrete, ${expName(exposure)} exposure`)
  L.value('Smallest cement content allowed', tr.minCement, 'kg/m³', 0, `${STD.is456} Table 5`)
  if (tr.gradeWc !== undefined) L.value(`Water-cement ratio assumed for ${grade}`, tr.gradeWc, '', 2, STD.assume, 'A typical figure for the grade. The strength curves of the standard are not used, and no target mean strength is worked out')
  const wc = L.calc('Water-cement ratio used', 'the lower of the two', 'min({a}, {b})', { a: tr.maxWc, b: tr.gradeWc ?? tr.maxWc }, (v) => Math.min(v.a, v.b), {
    dp: 2,
    ref: `${STD.is10262} cl. 4.1`,
    note: 'The lower ratio is the stricter one',
    ...ex(tr.wc),
  })
  const water = L.calc('Water per m³ of concrete', 'Table 2 water × (1 + 3 % for each 25 mm of slump above 50 mm)', '{w0} × (1 + {r} × ({s} − {s0}) ÷ {st})', { w0: R.waterBase, r: R.slumpRisePerStep, s: R.slumpMm, s0: R.baseSlumpMm, st: R.slumpStepMm }, (v) => v.w0 * (1 + (v.r * (v.s - v.s0)) / v.st), {
    unit: 'kg',
    dp: 1,
    ref: `${STD.is10262} cl. 4.2 and Table 2`,
    note: '186 kg is the Table 2 value for 20 mm aggregate. The 100 mm slump and 20 mm aggregate are NirmanShastra assumptions',
    ...ex(tr.water),
  })
  const byWc = L.calc('Cement from the water-cement ratio', 'water ÷ w/c', '{w} ÷ {c}', { w: water, c: wc }, (v) => v.w / v.c, { unit: 'kg/m³', dp: 1, ref: `${STD.is10262} cl. 4.3`, ...ex(tr.cementByWc) })
  const cement = L.calc('Cement used', 'the larger of this and the minimum, but not over the upper limit', 'min({u}, max({a}, {b}))', { u: R.maxCementKg, a: byWc, b: tr.minCement }, (v) => Math.min(v.u, Math.max(v.a, v.b)), {
    unit: 'kg/m³',
    dp: 1,
    ref: `${STD.is10262} cl. 4.3; ${STD.is456} cl. 8.2.4.2 and Table 5`,
    note: 'The tool stops at 450 kg/m³. IS 456 cl. 8.2.4.2 allows more only with special consideration of cracking',
    ...ex(tr.cement),
  })
  const aggVol = L.calc('Volume of all the aggregate in 1 m³ of concrete', '1 − (cement ÷ (3.15 × 1000) + water ÷ 1000)', '1 − ({c} ÷ ({g} × 1000) + {w} ÷ 1000)', { c: cement, g: R.specificGravityCement, w: water }, (v) => 1 - (v.c / (v.g * 1000) + v.w / 1000), {
    unit: 'm³',
    dp: 3,
    ref: `${STD.is10262} cl. 4.6`,
    note: 'Absolute volumes. The specific gravity of cement, 3.15, is the figure of the worked example in the standard',
    ...ex(tr.aggVol),
  })
  const frac = L.calc('Share of the aggregate that is coarse', '0.62 + 0.01 for each 0.05 the ratio is below 0.50', '{b} + {r} × ({w0} − {wc}) ÷ {st}', { b: R.coarseBase, r: R.coarseStepRise, w0: R.coarseBaseWc, wc, st: R.coarseWcStep }, (v) => v.b + (v.r * (v.w0 - v.wc)) / v.st, {
    dp: 3,
    ref: `${STD.is10262} cl. 4.4 and Table 3`,
    note: '0.62 is the Table 3 value for 20 mm aggregate and zone II sand at a ratio of 0.50. Zone II sand is a NirmanShastra assumption',
    ...ex(tr.coarseFrac),
  })
  const coarse = L.calc('Coarse aggregate by mass', 'volume × share × specific gravity × 1000', '{v} × {f} × {g} × 1000', { v: aggVol, f: frac, g: R.specificGravityCoarse }, (v) => v.v * v.f * v.g * 1000, { unit: 'kg', dp: 0, ref: `${STD.is10262} cl. 4.6`, note: 'Specific gravity 2.70 is a NirmanShastra assumption', ...ex(tr.coarseKg) })
  const fine = L.calc('Sand by mass', 'volume × (1 − share) × specific gravity × 1000', '{v} × (1 − {f}) × {g} × 1000', { v: aggVol, f: frac, g: R.specificGravityFine }, (v) => v.v * (1 - v.f) * v.g * 1000, { unit: 'kg', dp: 0, ref: `${STD.is10262} cl. 4.6`, note: 'Specific gravity 2.65 is a NirmanShastra assumption', ...ex(tr.fineKg) })
  const sand = L.calc('Sand as bought (loose volume)', 'mass ÷ bulk density', '{k} ÷ {d}', { k: fine, d: R.bulkDensitySand }, (v) => v.k / v.d, { unit: 'm³', dp: 3, ref: STD.assume, note: 'Loose dry sand at 1,600 kg/m³ is a NirmanShastra assumption', ...ex(tr.fineKg / R.bulkDensitySand) })
  const agg = L.calc('Aggregate as bought (loose volume)', 'mass ÷ bulk density', '{k} ÷ {d}', { k: coarse, d: R.bulkDensityCoarse }, (v) => v.k / v.d, { unit: 'm³', dp: 3, ref: STD.assume, note: 'Loose 20 mm aggregate at 1,500 kg/m³ is a NirmanShastra assumption', ...ex(tr.coarseKg / R.bulkDensityCoarse) })
  const out: MixOut = {
    cementKg: Math.round(cement),
    sandM3: Math.round(sand * 1000) / 1000,
    aggM3: Math.round(agg * 1000) / 1000,
    basis: `IS 10262:2009 design mix, w/c ${wc.toFixed(2)}, water ${water.toFixed(0)} L, 20 mm aggregate`,
  }
  L.pick('Mix per m³ of concrete', 'cement to the whole kg, sand and aggregate to 0.001 m³', `${d0(out.cementKg)} kg cement, ${d3(out.sandM3)} m³ sand, ${d3(out.aggM3)} m³ aggregate`, STD.rule)
  compareMix(L, `${grade} design mix`, out, grade, exposure)
  return out
}

/** A nominal mix: three figures read from a table. */
function nominalMixSheet(L: Ledger, grade: Grade): MixOut {
  const m = CPWD_NOMINAL[grade]
  if (!m) throw new Error(`calcsheet: no nominal mix for ${grade}`)
  L.value('Cement per m³ of concrete', m.cementKg, 'kg', 0, CPWD_REF, m.basis)
  L.value('Sand per m³ of concrete', m.sandM3, 'm³', 3, CPWD_REF)
  L.value('Coarse aggregate per m³ of concrete', m.aggregateM3, 'm³', 3, CPWD_REF, 'The sum of the single sizes')
  L.calc('Cement bags per m³ of concrete', 'cement ÷ 50', '{c} ÷ 50', { c: m.cementKg }, (v) => v.c / 50, { unit: 'bags', dp: 1, ref: STD.rule })
  const out: MixOut = { cementKg: m.cementKg, sandM3: m.sandM3, aggM3: m.aggregateM3, basis: m.basis }
  compareMix(L, `${grade} nominal mix`, out, grade, 'mild')
  return out
}

interface Want {
  key: 'above' | 'below' | 'pcc'
  where: string
  grade: Grade
  exposure: Exposure
  /** the concrete (m3) this mix is used for, from the sections that worked it */
  volume: number
}

export function materialsSection(c: CalcCtx): CalcSection {
  const { L, work, result } = c
  const blocks: CalcBlock[] = []
  const isDesign = (g: Grade) => !CPWD_NOMINAL[g]

  const wants: Want[] = [
    { key: 'above', where: 'above ground', grade: work.gradeAbove, exposure: work.exposure, volume: fig(L, 'conc.above') },
    { key: 'below', where: 'foundations and below ground', grade: work.gradeBelow, exposure: work.exposureBelow, volume: fig(L, 'conc.below') },
    { key: 'pcc', where: 'lean concrete under footings', grade: 'M7.5', exposure: 'mild', volume: fig(L, 'footing.pcc') },
  ]

  // ---- how the mixes are taken
  L.pick('Concrete of M20 or lower', 'nominal mix: cement, sand and aggregate per m³ read from the CPWD tables', 'used for the grades M7.5 to M20', `${STD.is456} cl. 9.3; ${CPWD_REF}`, 'IS 456 allows a nominal mix up to M20. The quantities per m³ are the CPWD figures, not the proportions of IS 456 Table 9')
  L.pick('Concrete of M25 or higher', 'design mix by the absolute-volume method', 'worked step by step below', `${STD.is10262} cl. 4.1 to 4.6`, 'IS 10262 itself asks for trial batches with the local materials; the figures here are for ordering, not a mix design')
  L.value('Cement bag', 50, 'kg', 0, 'Trade practice')
  L.value('Site wastage on cement, sand and aggregate', (SITE_WASTAGE - 1) * 100, '%', 0, STD.assume, 'Spillage and over-break')
  L.value('Cubic metre to cubic feet', M3_TO_CFT, 'cft', 4, 'Unit conversion')
  L.value('Square metre to square feet', M2_TO_SQFT, 'sq ft', 4, 'Unit conversion')
  blocks.push(takeBlock(L, 'mat-rules', 'How the mixes are taken'))

  // ---- the three mixes; the first design mix (or, if there is none, the mix above ground) is shown in full
  const worked = wants.find((w) => w.key !== 'pcc' && isDesign(w.grade)) ?? wants[0]
  const outs = new Map<string, MixOut>()
  for (const w of wants) {
    const o = isDesign(w.grade) ? designMixSheet(L, w.grade, w.exposure) : nominalMixSheet(L, w.grade)
    if (w === worked) blocks.push(takeBlock(L, 'mat-mix-worked', `Mix per cubic metre of ${w.grade} concrete, ${w.where}`, { intro: isDesign(w.grade) ? 'Worked in full for the first design mix. The other design mixes use the same steps with their own grade and exposure.' : 'The mix is read from the table. The cement is also given in bags.' }))
    else L.take()
    outs.set(w.key, o)
    put(L, `mat.mix.${w.key}.cement`, o.cementKg)
    put(L, `mat.mix.${w.key}.sand`, o.sandM3)
    put(L, `mat.mix.${w.key}.agg`, o.aggM3)
    putText(L, `mat.mix.${w.key}.where`, w.where)
    putText(L, `mat.mix.${w.key}.grade`, w.grade)
    putText(L, `mat.mix.${w.key}.basis`, o.basis)
  }
  const out = (w: Want) => outs.get(w.key) as MixOut
  // the engine's own mixes, set against the three
  check(L, 'Mix above ground', out(wants[0]).cementKg, work.parts.mixA.cementKg)
  check(L, 'Mix below ground', out(wants[1]).cementKg, work.parts.mixB.cementKg)
  check(L, 'Mix under footings', out(wants[2]).cementKg, work.parts.mixP.cementKg)

  blocks.push(
    tableBlock(
      'mat-mixes',
      'The three mixes',
      table(
        ['Where', 'Grade', 'Cement (kg/m³)', 'Sand (m³/m³)', 'Aggregate (m³/m³)', 'Minimum cement, Table 5 (kg/m³)'],
        wants.map((w) => [w.where, w.grade, d0(out(w).cementKg), d3(out(w).sandM3), d3(out(w).aggM3), w.key === 'pcc' ? 'not applied' : d0(T5_RCC[w.exposure].minCement)]),
        { num: [2, 3, 4, 5] }
      ),
      { note: 'The lean concrete under the footings is plain concrete, so the Table 5 minimum for reinforced concrete is not applied to it. ' + wants.map((w) => `${w.grade} ${w.where}: ${out(w).basis}.`).join(' ') }
    )
  )

  // ---- nominal mixes against IS 456 Table 9 (a plausibility check; the tool's own bulk densities are used)
  const nominal = wants.filter((w, i) => !isDesign(w.grade) && wants.findIndex((x) => x.grade === w.grade) === i)
  if (nominal.length > 0) {
    for (const w of nominal) {
      const o = out(w)
      const limit = TABLE9_MAX_AGGREGATE[w.grade]
      const dry = L.calc(`Dry aggregate per 50 kg of cement, ${w.grade}`, '(sand × bulk density + aggregate × bulk density) ÷ (cement ÷ 50)', '({s} × {ds} + {a} × {da}) ÷ ({c} ÷ 50)', { s: o.sandM3, ds: MIX_RULES.bulkDensitySand, a: o.aggM3, da: MIX_RULES.bulkDensityCoarse, c: o.cementKg }, (v) => (v.s * v.ds + v.a * v.da) / (v.c / 50), {
        unit: 'kg',
        dp: 0,
        ref: STD.assume,
        note: 'Uses the bulk densities assumed above, so this is a plausibility check',
      })
      if (limit !== undefined) {
        L.value(`Most dry aggregate per 50 kg of cement, ${w.grade}`, limit, 'kg', 0, `${STD.is456} Table 9`)
        L.pick(`${w.grade} mix against Table 9`, 'dry aggregate ≤ most allowed', dry <= limit ? 'within the limit' : `above the limit by ${d1(((dry - limit) / limit) * 100)} %`, `${STD.is456} Table 9`, dry <= limit ? undefined : 'The CPWD quantities and the assumed bulk densities do not agree exactly with Table 9; the ordering quantities follow CPWD')
      }
    }
    blocks.push(takeBlock(L, 'mat-nominal-check', 'Nominal mixes against IS 456 Table 9', { intro: 'Table 9 limits the dry aggregate for each 50 kg bag of cement. The check turns the sand and aggregate of each nominal mix back into kilograms.' }))
  }

  // ---- the building
  const rows = wants.map((w) => ({ w, o: out(w), cement: w.volume * out(w).cementKg, sand: w.volume * out(w).sandM3, agg: w.volume * out(w).aggM3 }))
  for (const r of rows) L.value(`Concrete of ${r.w.grade}, ${r.w.where}`, r.w.volume, 'm³', 2, r.w.key === 'pcc' ? 'Section 8' : 'Section 12')
  const vars = { va: wants[0].volume, vb: wants[1].volume, vp: wants[2].volume }
  const mixVars = (pick: (o: MixOut) => number) => ({ ...vars, ma: pick(out(wants[0])), mb: pick(out(wants[1])), mp: pick(out(wants[2])) })
  const bags0 = L.calc('Cement before wastage', '(Σ concrete × cement per m³) ÷ 50', '({va} × {ma} + {vb} × {mb} + {vp} × {mp}) ÷ 50', mixVars((o) => o.cementKg), (v) => (v.va * v.ma + v.vb * v.mb + v.vp * v.mp) / 50, { unit: 'bags', dp: 1, ref: STD.rule, ...ex(work.parts.cementBags) })
  const bags = L.calc('Cement to order', 'bags × (1 + wastage)', '{b} × {w}', { b: bags0, w: SITE_WASTAGE }, (v) => v.b * v.w, { unit: 'bags', dp: 0, ref: STD.assume, ...ex(result.materials.cementBags), result: true })
  const sand0 = L.calc('Sand before wastage', 'Σ concrete × sand per m³', '{va} × {ma} + {vb} × {mb} + {vp} × {mp}', mixVars((o) => o.sandM3), (v) => v.va * v.ma + v.vb * v.mb + v.vp * v.mp, { unit: 'm³', dp: 2, ref: STD.rule, ...ex(work.parts.sandM3) })
  const sand = L.calc('Sand to order', 'm³ × (1 + wastage)', '{b} × {w}', { b: sand0, w: SITE_WASTAGE }, (v) => v.b * v.w, { unit: 'm³', dp: 2, ref: STD.assume, ...ex(result.materials.sandM3), result: true })
  const sandCft = L.calc('Sand to order, in cubic feet', 'm³ × 35.3147', '{m} × {c}', { m: sand, c: M3_TO_CFT }, (v) => v.m * v.c, { unit: 'cft', dp: 0, ref: 'Unit conversion', ...ex(result.materials.sandCft), result: true })
  const agg0 = L.calc('Aggregate before wastage', 'Σ concrete × aggregate per m³', '{va} × {ma} + {vb} × {mb} + {vp} × {mp}', mixVars((o) => o.aggM3), (v) => v.va * v.ma + v.vb * v.mb + v.vp * v.mp, { unit: 'm³', dp: 2, ref: STD.rule, ...ex(work.parts.aggM3) })
  const agg = L.calc('Aggregate to order', 'm³ × (1 + wastage)', '{b} × {w}', { b: agg0, w: SITE_WASTAGE }, (v) => v.b * v.w, { unit: 'm³', dp: 2, ref: STD.assume, ...ex(result.materials.aggregateM3), result: true })
  const aggCft = L.calc('Aggregate to order, in cubic feet', 'm³ × 35.3147', '{m} × {c}', { m: agg, c: M3_TO_CFT }, (v) => v.m * v.c, { unit: 'cft', dp: 0, ref: 'Unit conversion', ...ex(result.materials.aggregateCft), result: true })
  check(L, 'Cement by mix adds up', sumOf(rows.map((r) => r.cement)) / 50, bags0)
  check(L, 'Sand by mix adds up', sumOf(rows.map((r) => r.sand)), sand0)
  check(L, 'Aggregate by mix adds up', sumOf(rows.map((r) => r.agg)), agg0)
  put(L, 'mat.cement.bags', bags)
  put(L, 'mat.sand.m3', sand)
  put(L, 'mat.sand.cft', sandCft)
  put(L, 'mat.agg.m3', agg)
  put(L, 'mat.agg.cft', aggCft)
  blocks.push(
    tableBlock(
      'mat-by-mix',
      'Cement, sand and aggregate before wastage, by mix',
      table(
        ['Where', 'Concrete (m³)', 'Cement (kg)', 'Sand (m³)', 'Aggregate (m³)'],
        rows.map((r) => [`${r.w.grade} ${r.w.where}`, d2(r.w.volume), d0(r.cement), d2(r.sand), d2(r.agg)]),
        { num: [1, 2, 3, 4], foot: ['All concrete', d2(sumOf(rows.map((r) => r.w.volume))), d0(sumOf(rows.map((r) => r.cement))), d2(sand0), d2(agg0)] }
      )
    )
  )
  blocks.push(takeBlock(L, 'mat-order', 'Cement, sand and aggregate to order'))

  // ---- the rest of the buy list
  const formM2 = fig(L, 'form.total')
  const formSqft = L.calc('Shuttering to order', 'area × 10.7639', '{a} × {c}', { a: formM2, c: M2_TO_SQFT }, (v) => v.a * v.c, { unit: 'sq ft', dp: 0, ref: 'Unit conversion', ...ex(result.materials.formworkSqft), result: true })
  const pits = fig(L, 'footing.pits')
  const excCft = L.calc('Excavation for the foundation pits', 'volume × 35.3147', '{a} × {c}', { a: pits, c: M3_TO_CFT }, (v) => v.a * v.c, { unit: 'cft', dp: 0, ref: 'Unit conversion', note: 'Volume from Section 8', ...ex(result.materials.excavationCft), result: true })
  const steelBuy = fig(L, 'steel.buy')
  const wire = fig(L, 'steel.binding')
  L.value('Reinforcement steel to buy', steelBuy, 'kg', 0, 'Section 11')
  L.value('Binding wire', wire, 'kg', 1, 'Section 11')
  put(L, 'mat.form.sqft', formSqft)
  put(L, 'mat.exc.cft', excCft)
  put(L, 'mat.exc.m3', pits)
  blocks.push(takeBlock(L, 'mat-rest', 'Shuttering, excavation, steel and binding wire'))
  blocks.push(
    tableBlock(
      'mat-buy',
      'The buy list',
      table(
        ['Material', 'Quantity', 'Unit', 'Worked in'],
        [
          ['Cement (50 kg bags)', d0(bags), 'bags', 'this section'],
          ['Sand', d0(sandCft), 'cft', 'this section'],
          ['Coarse aggregate', d0(aggCft), 'cft', 'this section'],
          ['Reinforcement steel Fe500D', d0(steelBuy), 'kg', 'Section 11'],
          ['Binding wire', d1(wire), 'kg', 'Section 11'],
          ['Shuttering (contact area)', d0(formSqft), 'sq ft', 'Sections 8 to 12'],
          ['Excavation', d0(excCft), 'cft', 'Section 8'],
        ],
        { num: [1] }
      ),
      { note: 'The buy list of the report, rebuilt from the sections named.' }
    )
  )

  return { id: 'materials', title: '13. Mixes and materials', intro: 'The cement, sand and aggregate in a cubic metre of each grade are found first; the concrete of each mix, from the sections before, then gives the quantities to order.', blocks }
}
