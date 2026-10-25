// Section 9, the floor slabs: Table 26 moments, steel and bars of every two-way panel, then the concrete, shuttering and steel of each floor slab.
// One panel of each Table 26 case is worked in full; the same working is run for every other panel without printing, so each of them is checked against the model too.

import type { CalcBlock, Ledger } from '@/lib/calcsheet'
import type { CalcCtx } from './ctx'
import { STAIRWELL_RULES, type PanelRec } from '../model'
import { COVER_SLAB, T26_RATIOS, TABLE26, astSingly, barArea } from '../codes'
import { PANEL_RULES as R, SLAB_RULES } from '../slab'
import { STD, barKg, check, d0, d1, d2, d3, ex, groupBy, levelName, plural, sumOf, table, tableBlock, takeBlock } from './helpers'
import { put } from './figs'

const d4s = (v: number) => v.toFixed(4)

const CASE_NAMES: Record<number, string> = {
  1: 'interior panel, all four edges continuous',
  2: 'one short edge discontinuous',
  3: 'one long edge discontinuous',
  4: 'two adjacent edges discontinuous',
  5: 'two short edges discontinuous',
  6: 'two long edges discontinuous',
  9: 'four edges discontinuous',
}

const caseOf = (dShort: number, dLong: number): number => ({ '00': 1, '10': 2, '01': 3, '11': 4, '20': 5, '02': 6 } as Record<string, number>)[`${dShort}${dLong}`] ?? 9

/** The pair of Table 26 ratios that bracket `ratio` (the table is entered between 1.0 and 2.0). */
function bracket(ratio: number) {
  const r = Math.min(Math.max(ratio, 1), 2)
  let i = 0
  while (i < T26_RATIOS.length - 2 && r > T26_RATIOS[i + 1]) i++
  return { i, r, r1: T26_RATIOS[i], r2: T26_RATIOS[i + 1] }
}

interface Try {
  phi: number
  s: number
  ok: boolean
}
export interface Choice {
  name: string
  ast: number
  d: number
  sMax: number
  tried: Try[]
  phi: number
  s: number
  area: number
}

/** The bar size and spacing for a steel area: sizes are tried in turn and the first whose spacing is wide enough is used. */
export function choose(name: string, ast: number, d: number): Choice {
  const sMax = Math.min(R.spacingCapMultiple * d, R.spacingCapMm)
  const tried: Try[] = []
  const last = R.barPhis[R.barPhis.length - 1]
  for (const phi of R.barPhis) {
    const s = Math.floor((barArea(phi) * 1000) / ast / R.spacingStep) * R.spacingStep
    const ok = s >= R.acceptSpacingMm || phi === last
    tried.push({ phi, s, ok })
    if (ok) {
      const sUse = Math.max(R.spacingFloorMm, Math.min(s, sMax))
      return { name, ast, d, sMax, tried, phi, s: sUse, area: (barArea(phi) * 1000) / sUse }
    }
  }
  throw new Error('calcsheet: no bar size accepted for a slab panel')
}

interface BarRow {
  note: string
  rule: string
  phi: number
  lenMm: number
  count: number
  kg: number
}
interface PanelOut {
  kg: number
  caseNo: number
  choices: Choice[]
  bars: BarRow[]
  maxM: number
}

const ASTF = 'Ast = max(Ast,min ; 0.5 fck/fy (1 − √(1 − 4.6 Mu/(fck b d²))) b d)'

/** The whole working of one panel through the Ledger. Returns what the tables need. The caller either keeps the lines (`takeBlock`) or throws them away (`L.take()`). */
function workPanel(L: Ledger, pr: PanelRec, F: number, stilt: boolean): PanelOut {
  const det = pr.res.detail
  const inp = pr.input
  const t = inp.t
  const fck = inp.fck
  const ref26 = `${STD.is456} Table 26`

  L.input('Panel', `${levelName(pr.k, F, stilt)}, bay ${pr.ix + 1},${pr.iy + 1}`, 'Section 3', 'The slab at the top of that storey')
  const sx = L.value('Span along the length (centre to centre)', inp.sx, 'm', 2, 'Section 3')
  const sy = L.value('Span along the width (centre to centre)', inp.sy, 'm', 2, 'Section 3')
  const lx = L.calc('Shorter span', 'lx = smaller of the two', 'min({a}; {b})', { a: sx, b: sy }, (v) => Math.min(v.a, v.b), { unit: 'm', dp: 2, ref: ref26, ...ex(det.lx) })
  const ly = L.calc('Longer span', 'ly = larger of the two', 'max({a}; {b})', { a: sx, b: sy }, (v) => Math.max(v.a, v.b), { unit: 'm', dp: 2, ref: ref26, ...ex(det.ly) })
  const ratio = L.calc('Ratio of the spans', 'ly ÷ lx', '{b} ÷ {a}', { a: lx, b: ly }, (v) => v.b / v.a, { dp: 3, ref: ref26, ...ex(det.ratio) })
  if (ratio > 2 + 1e-9) L.say('Ratio over 2', 'IS 456 Annex D (cl. D-1.11) treats a slab whose longer side is more than twice the shorter as spanning one way. The model does not: it keeps the Table 26 coefficients of ratio 2.0.', `${STD.is456} Annex D`)

  // edges and case
  const xShort = sx <= sy
  const e = inp.edge
  const longE = xShort ? [e.W, e.E] : [e.S, e.N]
  const shortE = xShort ? [e.S, e.N] : [e.W, e.E]
  const dLong = longE.filter((c) => !c).length
  const dShort = shortE.filter((c) => !c).length
  check(L, 'Slab panel: discontinuous long edges', dLong, det.discLong, 0)
  check(L, 'Slab panel: discontinuous short edges', dShort, det.discShort, 0)
  const caseNo = caseOf(dShort, dLong)
  check(L, 'Slab panel: Table 26 case', caseNo, det.caseNo, 0)
  L.pick('Edges of the panel', 'an edge is continuous when another panel of the same floor lies beyond it', `${dShort} short ${plural(dShort, 'edge', 'edges')} and ${dLong} long ${plural(dLong, 'edge', 'edges')} discontinuous`, STD.rule, 'A balcony beyond an edge is not counted as continuous')
  L.pick('Table 26 case', 'by the edges that are discontinuous', `Case ${caseNo}: ${CASE_NAMES[caseNo]}`, ref26, dShort + dLong >= 3 && dShort + dLong < 4 ? 'Table 26 has separate cases 7 and 8 for three discontinuous edges; the model uses case 9 for them, which gives larger mid-span moments and no moment at the one continuous edge' : undefined)
  const tbl = TABLE26[caseNo]

  // load
  const dl = L.value('Dead load on the panel', pr.load.dl, 'kN/m²', 3, 'Section 4', pr.load.terrace ? 'Roof slab' : 'Floor slab')
  const ll = L.value('Imposed load on the panel', pr.load.ll, 'kN/m²', 2, 'Section 4')
  const wu = L.calc('Factored load', 'wu = 1.5 (g + q)', '1.5 × ({g} + {q})', { g: dl, q: ll }, (v) => 1.5 * (v.g + v.q), { unit: 'kN/m²', dp: 3, ref: `${STD.is456} Table 18`, ...ex(inp.wu) })
  check(L, 'Slab panel: wu lx²', wu * lx * lx, det.w)

  // depths and minimum steel
  const dx = L.calc('Effective depth, bars along the short span', 'dx = t − cover − half a bar', '{t} − {c} − {h}', { t, c: COVER_SLAB, h: SLAB_RULES.halfBar }, (v) => v.t - v.c - v.h, {
    unit: 'mm',
    dp: 0,
    ref: `Section 2 (cover); ${STD.rule}`,
    note: 'A 10 mm bar is assumed for the half-bar allowance whatever bar is chosen',
    ...ex(det.dx),
  })
  const dy = L.calc('Effective depth, bars along the long span', 'dy = dx − one bar', '{d} − {s}', { d: dx, s: R.layerStepMm }, (v) => v.d - v.s, { unit: 'mm', dp: 0, ref: STD.rule, note: 'The long-span bars lie on top of the short-span bars', ...ex(det.dy) })
  const minAst = L.calc('Minimum steel', 'Ast,min = 0.0012 b t', '{r} × 1000 × {t}', { r: R.minSteelRatio, t }, (v) => v.r * 1000 * v.t, { unit: 'mm²/m', dp: 0, ref: `${STD.is456} cl. 26.5.2.1 (0.12 % for high-strength deformed bars)`, ...ex(det.minAst) })

  // coefficients
  const br = bracket(ratio)
  const coefLine = (label: string, arr: number[], expectV: number): number =>
    L.calc(label, 'α = a1 + (a2 − a1)(r − r1) ÷ (r2 − r1)', '{a1} + ({a2} − {a1}) × ({r} − {r1}) ÷ ({r2} − {r1})', { a1: arr[br.i], a2: arr[br.i + 1], r: br.r, r1: br.r1, r2: br.r2 }, (v) => v.a1 + ((v.a2 - v.a1) * (v.r - v.r1)) / (v.r2 - v.r1), {
      dp: 4,
      ref: ref26,
      note: `Between the tabulated values for ly/lx = ${br.r1.toFixed(2)} and ${br.r2.toFixed(2)}`,
      ...ex(expectV),
    })
  const axPos = coefLine('αx at mid-span', tbl.axPos, det.coef.axPos)
  const axNeg = tbl.axNeg ? coefLine('αx at a continuous edge', tbl.axNeg, det.coef.axNeg) : 0
  const ayPos = L.value('αy at mid-span', tbl.ayPos, '', 3, ref26, 'The same for all ratios')
  check(L, 'Slab panel: αy at mid-span', ayPos, det.coef.ayPos)
  const ayNeg = tbl.ayNeg
  if (ayNeg > 0) L.value('αy at a continuous edge', ayNeg, '', 3, ref26, 'The same for all ratios')
  check(L, 'Slab panel: αy at an edge', ayNeg, det.coef.ayNeg)

  // moments
  const mom = (label: string, a: number, expectV: number, sym: string) => L.calc(label, `${sym} = α wu lx²`, '{a} × {w} × {l}²', { a, w: wu, l: lx }, (v) => v.a * v.w * v.l * v.l, { unit: 'kN·m/m', dp: 2, ref: `${ref26}; ${STD.is456} cl. D-1.1`, ...ex(expectV) })
  const mxP = mom('Mid-span moment, short span', axPos, det.mxPos, 'Mx')
  const myP = mom('Mid-span moment, long span', ayPos, det.myPos, 'My')
  const mxN = tbl.axNeg ? mom('Moment at a continuous long edge', axNeg, det.mxNeg, 'Mx') : 0
  const myN = ayNeg > 0 ? mom('Moment at a continuous short edge', ayNeg, det.myNeg, 'My') : 0
  check(L, 'Slab panel: Mx at an edge', mxN, det.mxNeg)
  check(L, 'Slab panel: My at an edge', myN, det.myNeg)

  // steel areas
  const astOf = (label: string, M: number, d: number, expectV: number, first = false) =>
    L.calc(label, first ? ASTF : 'Ast = max(Ast,min ; Annex G steel for Mu)', 'max({m}; 0.5 × {f} ÷ 500 × (1 − √(1 − 4.6 × {M} × 10^6 ÷ ({f} × 1000 × {d}²))) × 1000 × {d})', { m: minAst, f: fck, M, d }, (v) => Math.max(v.m, astSingly(v.M * 1e6, 1000, v.d, v.f) ?? (v.M * 1e6) / (0.87 * 500 * 0.85 * v.d)), {
      unit: 'mm²/m',
      dp: 0,
      ref: `${STD.is456} Annex G, cl. G-1.1(b)`,
      ...ex(expectV),
    })
  const aXP = astOf('Steel at mid-span, short span', mxP, dx, det.astXpos, true)
  const aYP = astOf('Steel at mid-span, long span', myP, dy, det.astYpos)
  const aXN = mxN > 0 ? astOf('Steel at a continuous long edge', mxN, dx, det.astXneg ?? 0) : null
  const aYN = myN > 0 ? astOf('Steel at a continuous short edge', myN, dy, det.astYneg ?? 0) : null
  check(L, 'Slab panel: steel at a long edge present', aXN === null ? 0 : 1, det.astXneg === null ? 0 : 1, 0)
  check(L, 'Slab panel: steel at a short edge present', aYN === null ? 0 : 1, det.astYneg === null ? 0 : 1, 0)

  // bar choices
  const choices: Choice[] = []
  const posX = choose('Bottom, along the short span', aXP, dx)
  const posY = choose('Bottom, along the long span', aYP, dy)
  choices.push(posX, posY)
  const negX = aXN !== null ? choose('Top, over a continuous long edge', aXN, dx) : null
  const negY = aYN !== null ? choose('Top, over a continuous short edge', aYN, dy) : null
  if (negX) choices.push(negX)
  if (negY) choices.push(negY)
  const sameChoice = (c: Choice, d: { pick: { phi: number; s: number } }, name: string) => {
    check(L, `Slab panel: ${name} bar size`, c.phi, d.pick.phi, 0)
    check(L, `Slab panel: ${name} spacing`, c.s, d.pick.s, 0)
  }
  sameChoice(posX, det.posX, 'short-span bottom')
  sameChoice(posY, det.posY, 'long-span bottom')
  if (negX && det.negX) sameChoice(negX, det.negX, 'long-edge top')
  if (negY && det.negY) sameChoice(negY, det.negY, 'short-edge top')

  // corners
  const corners: [boolean, boolean][] = [[e.W, e.S], [e.E, e.S], [e.W, e.N], [e.E, e.N]]
  const anyTorsion = corners.some(([a, b]) => !a || !b)
  let tors: Choice | null = null
  if (anyTorsion) {
    const tAst = L.calc('Steel for the corners (torsion)', 'Ast,t = 0.75 × steel provided at mid-span, short span', '{k} × {a}', { k: R.torsionShare, a: posX.area }, (v) => v.k * v.a, {
      unit: 'mm²/m',
      dp: 0,
      ref: `${STD.is456} cl. D-1.8`,
      note: 'The code takes three-quarters of the area REQUIRED for the mid-span moment; the model takes three-quarters of the area PROVIDED, which is a little more',
      ...ex(det.torsAst),
    })
    tors = choose('Corners (torsion)', tAst, dx)
    choices.push(tors)
    sameChoice(tors, det.tors, 'corner')
  }

  // bar lines
  const bars: BarRow[] = []
  const mm = (m: number) => m * 1000
  const bw = inp.beamB
  const hook = t - 2 * COVER_SLAB
  const add = (note: string, rule: string, phi: number, lenMm: number, count: number) => bars.push({ note, rule, phi, lenMm, count, kg: barKg(phi, lenMm, count) })
  add('Bottom bars along the short span', 'lx − 50 ; (ly − 100) ÷ s + 1', posX.phi, mm(lx) - R.endShortMm, Math.floor((mm(ly) - R.edgeAllowMm) / posX.s) + 1)
  add('Bottom bars along the long span', 'ly − 50 ; (lx − 100) ÷ s + 1', posY.phi, mm(ly) - R.endShortMm, Math.floor((mm(lx) - R.edgeAllowMm) / posY.s) + 1)
  const nLongCont = longE.filter((c) => c).length
  const nShortCont = shortE.filter((c) => c).length
  if (negX && nLongCont > 0) add('Top bars over the continuous long edges', '(2 × 0.3 lx + beam width) ÷ 2 ; edges × ((ly − 100) ÷ s + 1)', negX.phi, (R.negExtent * mm(lx) * 2 + bw) / 2, nLongCont * (Math.floor((mm(ly) - R.edgeAllowMm) / negX.s) + 1))
  if (negY && nShortCont > 0) add('Top bars over the continuous short edges', '(2 × 0.3 ly + beam width) ÷ 2 ; edges × ((lx − 100) ÷ s + 1)', negY.phi, (R.negExtent * mm(ly) * 2 + bw) / 2, nShortCont * (Math.floor((mm(lx) - R.edgeAllowMm) / negY.s) + 1))
  for (const [isLong, cont] of [...longE.map((c) => [true, c] as const), ...shortE.map((c) => [false, c] as const)]) {
    if (cont) continue
    const bar = isLong ? posX : posY
    const edgeLen = isLong ? mm(ly) : mm(lx)
    const span = isLong ? mm(lx) : mm(ly)
    const spacing = Math.min(R.discSpacingCapMm, bar.s * 2)
    add(isLong ? 'Top bars at a discontinuous long edge' : 'Top bars at a discontinuous short edge', '0.15 span + beam width − 20 + (t − 40) ; (edge − 100) ÷ min(300; 2 s) + 1', bar.phi, R.discExtent * span + bw - COVER_SLAB + hook, Math.floor((edgeLen - R.edgeAllowMm) / spacing) + 1)
  }
  if (tors) {
    for (const [a, b] of corners) {
      const nDisc = (a ? 0 : 1) + (b ? 0 : 1)
      if (nDisc === 0) continue
      const f = nDisc === 2 ? 1 : R.torsionHalfCorner
      const side = mm(lx) / R.torsionSideDivisor
      const nBars = Math.floor(side / tors.s) + 1
      add(nDisc === 2 ? 'Torsion bars at a corner with two discontinuous edges' : 'Torsion bars at a corner with one discontinuous edge', 'lx ÷ 5 ; 2 layers × 2 directions × (lx ÷ 5 ÷ s + 1), half at a corner with one discontinuous edge', tors.phi, side, 2 * 2 * nBars * f)
    }
  }
  check(L, 'Slab panel: number of bar lines', bars.length, det.lines.length, 0)
  bars.forEach((b, i) => {
    const q = det.lines[i]
    if (!q) return
    check(L, 'Slab panel bar: diameter', b.phi, q.phi, 0)
    check(L, 'Slab panel bar: length', b.lenMm, q.lengthMm)
    check(L, 'Slab panel bar: number', b.count, q.count)
    check(L, 'Slab panel bar: weight', b.kg, q.kg)
  })

  const maxM = Math.max(mxP, myP, mxN, myN)
  const kg = sumOf(bars.map((b) => b.kg))
  check(L, 'Slab panel: steel', kg, pr.res.kg)
  return { kg, caseNo, choices, bars, maxM }
}

export const choiceTable = (choices: Choice[]) =>
  table(
    ['Steel', 'Needed (mm²/m)', 'd (mm)', 'Widest spacing (mm)', 'Sizes tried: spacing found (mm)', 'Chosen', 'Provided (mm²/m)'],
    choices.map((c) => [c.name, d0(c.ast), d0(c.d), d0(c.sMax), c.tried.map((q) => `${q.phi}: ${q.s}${q.ok ? ' (taken)' : ''}`).join(', '), `${c.phi} mm at ${c.s} mm`, d0(c.area)]),
    { num: [1, 2, 3, 6], note: `A size is taken when its spacing comes to ${R.acceptSpacingMm} mm or more (16 mm is taken whatever the spacing). The spacing used is the one found, held between ${R.spacingFloorMm} mm and the widest spacing. The widest spacing is the smaller of 3d and ${R.spacingCapMm} mm: IS 456 cl. 26.3.3(b)(1) allows the smaller of 3d and 300 mm, so the model is closer than the code needs.` }
  )

const barTable = (bars: BarRow[]) =>
  table(
    ['Bars', 'Size (mm)', 'Cut length (mm)', 'Number', 'Weight (kg)', 'Rule'],
    bars.map((b) => [b.note, d0(b.phi), d0(Math.ceil(b.lenMm / 25) * 25), d0(b.count), d1(b.kg), b.rule]),
    { num: [1, 2, 3, 4], foot: ['Steel in the panel', '', '', '', d1(sumOf(bars.map((b) => b.kg))), ''], note: 'Each cut length is taken up to the next 25 mm and weighed at φ² ÷ 162.2 kg per metre. Bars shown "÷ s" use the spacing chosen above.' }
  )

const ANNEX_D_NOTE =
  'Against IS 456 Annex D: mid-span bars run the full span less 50 mm and none are curtailed (cl. D-1.4 lets some stop short). Over a continuous edge the code (D-1.5) takes the bars 0.15 l from the support with at least half of them to 0.3 l; the model takes all of them to 0.3 l. At a discontinuous edge D-1.6 asks for half the mid-span steel reaching 0.1 l; the model uses the mid-span bar at twice the spacing for 0.15 l. Corner steel follows D-1.8 to D-1.10 (none where both edges are continuous, half where one is).'

/** Section 9, part one: the slab panels. Returns the blocks and the per-storey slab quantities (registered for the reconciliation). */
export function slabBlocks(c: CalcCtx): CalcBlock[] {
  const { L, work } = c
  const a = work.analysis
  const { plan, ctx } = work
  const F = plan.F
  const stilt = ctx.stilt
  const blocks: CalcBlock[] = []
  const panels = a.panels

  // ---- which panels are worked in full: the largest moment of each Table 26 case present, the overall largest first
  const byCase = groupBy(panels, (p) => String(p.res.caseNo))
  const gov = byCase.map((g) => {
    let best = g.items[0]
    let bm = -1
    for (const p of g.items) {
      const d = p.res.detail
      const m = Math.max(d.mxPos, d.myPos, d.mxNeg, d.myNeg)
      if (m > bm + 1e-12) {
        bm = m
        best = p
      }
    }
    return { caseNo: Number(g.key), panel: best, maxM: bm, n: g.items.length }
  })
  gov.sort((p, q) => q.maxM - p.maxM || p.caseNo - q.caseNo)

  // ---- intro: the rules in one place
  L.value('Slab thickness', work.tSlab, 'mm', 0, 'Section 3', 'Fixed by the span to depth rule; the same for every slab')
  L.value('Number of slab panels', panels.length, '', 0, 'Section 3', `${F} ${plural(F, 'storey', 'storeys')}; each bay of each floor is one panel`)
  L.pick('Method', 'IS 456 Annex D (rectangular panels supported on four sides with torsion at the corners)', 'Mx = αx wu lx², My = αy wu lx², coefficients from Table 26', `${STD.is456} cl. 24.4 and Annex D`, 'The slab is designed as two-way in every panel; the load comes from Section 4 and the beams carry the equivalent loads found there')
  L.pick('Bars', `sizes ${R.barPhis.join(', ')} mm tried in turn`, `spacing in steps of ${R.spacingStep} mm, not under ${R.spacingFloorMm} mm and not over ${R.spacingCapMm} mm`, STD.rule, `Minimum steel ${R.minSteelRatio * 100} % of the section (${STD.is456} cl. 26.5.2.1)`)
  blocks.push(takeBlock(L, 'slab-rules', 'Slab panels: method', { note: 'Only the panels of the building are designed here. Deflection is controlled by the thickness rule of Section 3; shear in slabs, crack width and edge beam torsion are not checked.' }))

  // ---- worked panels
  gov.forEach((g, i) => {
    const pr = g.panel
    const out = workPanel(L, pr, F, stilt)
    const title = i === 0 ? `Worked panel: the largest moment, Table 26 case ${g.caseNo}` : `Worked panel: Table 26 case ${g.caseNo}`
    blocks.push(takeBlock(L, `slab-w${i + 1}`, title, { intro: i === 0 ? `${g.n} of the ${panels.length} panels are of this case. The same steps are run for every panel; the schedule below lists the result.` : `${g.n} ${plural(g.n, 'panel is', 'panels are')} of this case; the panel with the largest moment is worked.` }))
    blocks.push(tableBlock(`slab-w${i + 1}-choice`, 'Bar sizes and spacing', choiceTable(out.choices)))
    blocks.push(tableBlock(`slab-w${i + 1}-bars`, 'Bars of the panel', barTable(out.bars), { note: i === 0 ? ANNEX_D_NOTE : undefined }))
    const w = out.bars.map((b, j) => [`w${j}`, b.kg] as const)
    const vars = Object.fromEntries(w)
    L.calc('Steel in the panel', 'sum of the bar weights', w.map(([k]) => `{${k}}`).join(' + '), vars, (v) => Object.values(v).reduce((s, x) => s + x, 0), { unit: 'kg', dp: 1, ref: STD.rule, ...ex(pr.res.kg), result: true })
    blocks.push(takeBlock(L, `slab-w${i + 1}-total`, 'Steel in the panel'))
  })

  // ---- every panel, quietly, and the schedule
  type Row = { rec: PanelRec; out: PanelOut }
  const rows: Row[] = panels.map((p) => {
    const out = workPanel(L, p, F, stilt)
    L.take()
    return { rec: p, out }
  })
  const sig = (r: Row) => {
    const e = r.rec.input.edge
    return `${r.out.caseNo}|${r.rec.input.sx}|${r.rec.input.sy}|${e.W ? 'W' : '-'}${e.E ? 'E' : '-'}${e.S ? 'S' : '-'}${e.N ? 'N' : '-'}|${r.rec.input.wu.toFixed(6)}|${r.out.kg.toFixed(6)}`
  }
  const groups = groupBy(rows, sig)
  const sched = groups.map((g, i) => {
    const f = g.items[0]
    const e = f.rec.input.edge
    const cont = [e.W ? 'W' : '', e.E ? 'E' : '', e.S ? 'S' : '', e.N ? 'N' : ''].filter(Boolean).join(' ') || 'none'
    const levels = [...new Set(g.items.map((x) => x.rec.k))].sort((p, q) => p - q).map((k) => levelName(k, F, stilt).replace(/, top of.*/, ''))
    const px = f.out.choices
    const s0 = px[0]
    const s1 = px[1]
    return [
      `S${i + 1}`,
      levels.join(', '),
      d0(g.items.length),
      d0(f.out.caseNo),
      `${d2(Math.min(f.rec.input.sx, f.rec.input.sy))} × ${d2(Math.max(f.rec.input.sx, f.rec.input.sy))}`,
      d2(f.rec.input.wu),
      cont,
      `${s0.phi}@${s0.s} / ${s1.phi}@${s1.s}`,
      d1(f.out.kg),
      d1(f.out.kg * g.items.length),
    ]
  })
  const totalPanelKg = sumOf(rows.map((r) => r.out.kg))
  L.calc('Steel in all panels, before the corrections of the next table', 'sum of the schedule', '{s}', { s: totalPanelKg }, (v) => v.s, { unit: 'kg', dp: 1, ref: STD.rule, result: true, expect: sumOf(panels.map((p) => p.res.kg)), tol: 1e-6 })
  blocks.push(
    tableBlock(
      'slab-schedule',
      'Schedule of slab panels',
      table(['Mark', 'Slab at', 'Panels', 'Case', 'lx × ly (m)', 'wu (kN/m²)', 'Continuous edges', 'Bottom bars (short / long)', 'Steel each (kg)', 'Steel total (kg)'], sched, { num: [2, 3, 5, 8, 9], foot: ['Total', '', d0(panels.length), '', '', '', '', '', '', d1(totalPanelKg)] }),
      { note: 'W and E are the two ends of the plan along its length, S and N the two sides. Panels with the same case, spans, load and continuous edges have the same steel.' }
    )
  )
  blocks.push(takeBlock(L, 'slab-schedule-total', 'Total of the panel steel'))
  put(L, 'slab.panelKg', totalPanelKg)
  return blocks
}

/** Section 9, part two: the quantities of each floor slab (concrete, shuttering, steel after the corrections). */
export function slabQuantityBlocks(c: CalcCtx): CalcBlock[] {
  const { L, work } = c
  const a = work.analysis
  const { plan, ctx } = work
  const F = plan.F
  const stilt = ctx.stilt
  const t = ctx.tSlab
  const blocks: CalcBlock[] = []
  const panelKg = (k: number) => sumOf(a.panels.filter((p) => p.k === k).map((p) => p.res.kg))

  const one = (k: number): { steel: number; vol: number; soffit: number; plate: number; well: number; trim: number; scale: number; beamFoot: number; colFoot: number; plateForm: number } => {
    const f = plan.floors[k]
    const level = levelName(k, F, stilt)
    L.input('Slab', level, 'Section 3')
    const plate = L.calc(`Floor plate of the modelled bays (${level})`, 'bays × sx × bays × sy', '{nx} × {sx} × {ny} × {sy}', { nx: f.nx, sx: plan.sx, ny: f.ny, sy: plan.sy }, (v) => v.nx * v.sx * v.ny * v.sy, { unit: 'm²', dp: 2, ref: 'Section 3', ...ex(f.nx * plan.sx * f.ny * plan.sy) })
    let well = 0
    if (k < F - 1) {
      well = L.calc('Stair opening taken out of the slab', 'smaller of the opening and 12 % of the plate', 'min({w}; {m} × {p})', { w: a.stair.wellAreaM2, m: STAIRWELL_RULES.maxShareOfPlate, p: plate }, (v) => Math.min(v.w, v.m * v.p), { unit: 'm²', dp: 2, ref: `${STD.rule}; opening from the staircase part of this Section`, ...ex(Math.min(a.stair.wellAreaM2, STAIRWELL_RULES.maxShareOfPlate * plate)) })
    } else L.value('Stair opening taken out of the slab', 0, 'm²', 2, STD.rule, 'The roof slab has no stair opening')
    const scale = L.value('Correction to the entered floor area', f.scale, '', 4, 'Section 3', 'Models the bays as a whole number; the entered area is matched by this factor')
    const trim = L.calc('Trim of the steel round the opening', 'f = 1 − 0.85 × opening ÷ plate', '1 − {k} × {w} ÷ {p}', { k: STAIRWELL_RULES.steelTrimShare, w: well, p: plate }, (v) => 1 - (v.k * v.w) / v.p, { dp: 4, ref: STD.rule, note: 'The steel is cut by 85 % of the opening\'s share of the plate' })
    const kg = L.value('Steel in the panels of this slab (before corrections)', panelKg(k), 'kg', 1, 'Schedule above')
    const steel = L.calc('Steel in the slab', 'panels × trim × floor-area correction', '{k} × {f} × {s}', { k: kg, f: trim, s: scale }, (v) => v.k * v.f * v.s, { unit: 'kg', dp: 1, ref: STD.rule, ...ex(a.book.byGroup[`slab:${k}`] ?? 0), result: true })
    const vol = L.calc('Concrete in the slab', 'V = (plate − opening) × t × correction', '({p} − {w}) × {t} ÷ 1000 × {s}', { p: plate, w: well, t, s: scale }, (v) => (v.p - v.w) * (v.t / 1000) * v.s, { unit: 'm³', dp: 3, ref: STD.rule, ...ex(a.slabVol[k] * f.scale), result: true })
    const edge = k < F - 1 && well > 0 ? 2 * (a.stair.wellLengthM + a.stair.wellWidthM) * (t / 1000) : 0
    const plateForm = L.calc('Plate area for shuttering', 'plate − opening + edge of the opening', '{p} − {w} + {e}', { p: plate, w: well, e: edge }, (v) => v.p - v.w + v.e, { unit: 'm²', dp: 3, ref: STD.rule, note: edge > 0 ? 'The edge of the opening is 2 (length + width) × slab thickness' : undefined, ...ex(a.slabForm[k]) })
    const nB = a.beams[k].length
    const beamFoot = L.calc('Footprint of the beams on the slab', 'width × (sum of spans − 0.3 per beam)', '{b} ÷ 1000 × ({sl} − 0.3 × {n})', { b: ctx.bBeam, sl: sumOf(a.beams[k].map((r) => r.L)), n: nB }, (v) => (v.b / 1000) * (v.sl - 0.3 * v.n), { unit: 'm²', dp: 3, ref: STD.rule, note: `${nB} ${plural(nB, 'beam', 'beams')}; 0.3 m is taken off each span for the columns` })
    const cols = a.cols.filter((q) => q.k === k)
    const colFoot = L.calc('Footprint of the columns on the slab', 'sum of b × D', '{a}', { a: sumOf(cols.map((q) => (q.des.b / 1000) * (q.des.D / 1000))) }, (v) => v.a, { unit: 'm²', dp: 3, ref: `Section 7 (${cols.length} ${plural(cols.length, 'column', 'columns')})` })
    const soffit = L.calc('Shuttering of the slab (soffit)', 'plate × correction − beams × correction − columns', 'max(0; {p} × {s} − {b} × {s} − {c})', { p: plateForm, s: scale, b: beamFoot, c: colFoot }, (v) => Math.max(0, v.p * v.s - v.b * v.s - v.c), { unit: 'm²', dp: 2, ref: STD.rule, note: 'The sides of the beams are counted with the beams (Section 12)', result: true })
    return { steel, vol, soffit, plate, well, trim, scale, beamFoot, colFoot, plateForm }
  }

  // worked: the lowest slab; the rest quietly
  const first = one(0)
  blocks.push(takeBlock(L, 'slab-qty-worked', `Quantities of the slab at ${levelName(0, F, stilt).replace(/, top of.*/, '')}`))
  const res = [first]
  for (let k = 1; k < F; k++) {
    res.push(one(k))
    L.take()
  }
  const rows = res.map((r, k) => [levelName(k, F, stilt).replace(/, top of.*/, ''), d0(a.panels.filter((p) => p.k === k).length), d2(r.plate), d2(r.well), d4s(r.trim), d4s(r.scale), d1(r.steel), d3(r.vol), d2(r.soffit)])
  const totals = { steel: sumOf(res.map((r) => r.steel)), vol: sumOf(res.map((r) => r.vol)), soffit: sumOf(res.map((r) => r.soffit)) }
  blocks.push(
    tableBlock('slab-qty-table', 'Quantities of all floor slabs', table(['Slab at', 'Panels', 'Plate (m²)', 'Opening (m²)', 'Steel trim', 'Area correction', 'Steel (kg)', 'Concrete (m³)', 'Shuttering (m²)'], rows, { num: [1, 2, 3, 4, 5, 6, 7, 8], foot: ['All slabs', d0(a.panels.length), '', '', '', '', d1(totals.steel), d3(totals.vol), d2(totals.soffit)] }))
  )
  L.calc('Steel in all floor slabs', 'sum of the table', '{s}', { s: totals.steel }, (v) => v.s, { unit: 'kg', dp: 1, ref: STD.rule, ...ex(work.parts.steel.slabs), result: true })
  L.calc('Concrete in all floor slabs', 'sum of the table', '{s}', { s: totals.vol }, (v) => v.s, { unit: 'm³', dp: 2, ref: STD.rule, ...ex(work.parts.slabV), result: true })
  L.calc('Shuttering of all floor slabs', 'sum of the table', '{s}', { s: totals.soffit }, (v) => v.s, { unit: 'm²', dp: 1, ref: STD.rule, ...ex(work.parts.slabF), result: true })
  put(L, 'slab.steel', totals.steel)
  put(L, 'slab.vol', totals.vol)
  put(L, 'slab.form', totals.soffit)
  put(L, 'slab.count', a.panels.length)
  blocks.push(takeBlock(L, 'slab-qty-total', 'Totals for the floor slabs'))
  return blocks
}
