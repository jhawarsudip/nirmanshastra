// Section 7 of the StructurePro calculation sheet: column design.
// One full worked example for the heaviest column of the lowest storey (loads, moments, the load cases, the strain-compatibility check and the ties),
// then a table for every storey and column type.

import type { CalcBlock, CalcSection } from '@/lib/calcsheet'
import type { CalcCtx, ColRec, NodeLoad } from './ctx'
import type { BeamRec } from '../frame'
import { COVER_COLUMN, ES, FY, FY_SHEAR, GAMMA_RC, barArea, stirrupCutLength } from '../codes'
import { beamCoeffs } from '../beam'
import { COLUMN_COVER_TIE_PHI, MAX_BARS, SIZES, caseRatio, eMin } from '../column'
import { COUNTS as COLUMN_COUNTS, PHIS as COLUMN_PHIS, COLUMN_STEEL_PCT, STRIPS, alphaN, sectionBreakdown, uniaxialSolve } from '../section'
import { COLUMN_DEAD_MOMENT_SHARE, SCWB_COLUMN_SHARE, minSideFor } from '../model'
import { llReduction, nodeExists, reactionShare } from '../plan'
import { STD, TYPE_ORDER, check, d0, d1, d2, d3, ex, fixed, governingColumns, storeyName, table, takeBlock, tableBlock } from './helpers'
import { portalColumnMoment } from './lateral'
import { putText } from './figs'

const REF_T12 = `${STD.is456} cl. 22.5.1, Table 12 (dead load with fixed imposed load)`
const REF_ECC = `${STD.is456} cl. 25.4`
const REF_SCWB = `${STD.rule}: a strong-column weak-beam check with a factor of 1.1, which is the model's own value. IS 13920:1993 has no clause for it. A software help page gives 1.4 for IS 13920:2016 (cl. 7.2; the 2016 text was not read), so a column meant for the 2016 rule may need more moment capacity than this`
const TYPE_LABEL = { corner: 'Corner', edge: 'Edge', interior: 'Interior' } as const

const CASE_BASE = [
  '1.5 (DL + LL)',
  '1.2 (DL + LL ± EL), EL along y + 30 % along x',
  '1.2 (DL + LL ± EL), EL along x + 30 % along y',
  '1.5 (DL ± EL), EL along y + 30 % along x',
  '1.5 (DL ± EL), EL along x + 30 % along y',
  '0.9 DL ± 1.5 EL, EL along y + 30 % along x',
  '0.9 DL ± 1.5 EL, EL along x + 30 % along y',
]

function caseNames(node: NodeLoad): string[] {
  const n = [...CASE_BASE]
  const s = node.detail.scwb
  if (s) {
    if (s.reqX > 0) n.push('Strong column - weak beam, about x')
    if (s.reqY > 0) n.push('Strong column - weak beam, about y')
  }
  return n
}

/** The case with the highest interaction ratio for a column, using the model's own check. */
function worstCase(col: ColRec, node: NodeLoad, fck: number): { idx: number; ratio: number } {
  let idx = 0
  let ratio = -1
  node.cases.forEach((cs, i) => {
    const r = caseRatio(col.des.b, col.des.D, col.des.cfg, fck, cs, col.unsupported)
    if (r > ratio) {
      ratio = r
      idx = i
    }
  })
  return { idx, ratio }
}

type Joint = { xa?: BeamRec; xb?: BeamRec; ya?: BeamRec; yb?: BeamRec }

function jointBeams(c: CalcCtx, k: number, ix: number, iy: number): Joint {
  const { xb, yb } = c.work.analysis.fns
  const f = c.work.plan.floors[k]
  return {
    xa: ix >= 1 ? xb[k][iy]?.[ix - 1] : undefined,
    xb: ix < f.nx ? xb[k][iy]?.[ix] : undefined,
    ya: iy >= 1 ? yb[k][ix]?.[iy - 1] : undefined,
    yb: iy < f.ny ? yb[k][ix]?.[iy] : undefined,
  }
}

/** Unbalanced service moment of the beams at a joint, as the model takes it, written out. */
function unbalancedLines(c: CalcCtx, k: number, ix: number, iy: number, where: string): { mx: number; my: number } {
  const { L, work } = c
  const jb = jointBeams(c, k, ix, iy)
  const M = (r: BeamRec | undefined, end: 'L' | 'R', name: string): number | undefined => {
    if (!r) return undefined
    const co = beamCoeffs(r.n, r.i)
    const coef = end === 'L' ? co.cL : co.cR
    const w = r.mDL + (r.des?.selfWeight ?? 0) + r.mLL
    return L.calc(`Service end moment of ${name} (${where})`, 'M = c × w × L²', '{c} × {w} × {L}²', { c: coef, w, L: r.L }, (v) => v.c * v.w * v.L * v.L, { unit: 'kN·m', dp: 2, ref: REF_T12, note: 'w = dead + imposed load of the beam including its own weight, unfactored' })
  }
  const diff = (p: number | undefined, q: number | undefined, label: string, expected: number): number => {
    if (p !== undefined && q !== undefined) return L.calc(label, 'Mu = |M1 − M2|', '|{p} − {q}|', { p, q }, (v) => Math.abs(v.p - v.q), { unit: 'kN·m', dp: 2, ref: `${STD.rule}: the difference of the beam end moments is passed to the columns`, ...ex(expected) })
    const only = p ?? q
    if (only !== undefined) return L.calc(label, 'Mu = M (one beam at the joint)', '{m}', { m: only }, (v) => v.m, { unit: 'kN·m', dp: 2, ref: `${STD.rule}: the whole end moment is passed to the column`, ...ex(expected) })
    return 0
  }
  const exp = work.analysis.fns.unbalanced(k, ix, iy)
  const a = M(jb.xa, 'R', 'the x-beam before the joint')
  const b = M(jb.xb, 'L', 'the x-beam after the joint')
  const my = diff(a, b, `Unbalanced moment about the y axis (${where})`, exp.my)
  const cc = M(jb.ya, 'R', 'the y-beam before the joint')
  const d = M(jb.yb, 'L', 'the y-beam after the joint')
  const mx = diff(cc, d, `Unbalanced moment about the x axis (${where})`, exp.mx)
  return { mx, my }
}

/** Sum of the moments of resistance of the beams at a joint, as the model takes it for the strong-column weak-beam check, written out. */
function capSumLines(c: CalcCtx, k: number, ix: number, iy: number, where: string): { aboutY: number; aboutX: number } {
  const { L, work } = c
  const jb = jointBeams(c, k, ix, iy)
  const cap = (r: BeamRec | undefined, end: 'L' | 'R') => (r?.des ? (end === 'L' ? { hog: r.des.capHogL, sag: r.des.capSagL } : { hog: r.des.capHogR, sag: r.des.capSagR }) : { hog: 0, sag: 0 })
  const exp = work.analysis.fns.capSum(k, ix, iy)
  const one = (p: { hog: number; sag: number } | null, q: { hog: number; sag: number } | null, label: string, expected: number): number => {
    if (p && q) return L.calc(label, 'ΣMb = max(Mhog,1 + Msag,2 ; Msag,1 + Mhog,2)', 'max({ah} + {bs}; {as} + {bh})', { ah: p.hog, as: p.sag, bh: q.hog, bs: q.sag }, (v) => Math.max(v.ah + v.bs, v.as + v.bh), { unit: 'kN·m', dp: 2, ref: `${STD.rule}: the beam moments of resistance on opposite faces of the joint, of opposite sign, are added as IS 13920:1993 cl. 7.3.4 adds them for the column shear`, ...ex(expected) })
    const o = p ?? q
    if (o) return L.calc(label, 'ΣMb = larger of the hogging and sagging resistance (one beam)', 'max({h}; {s})', { h: o.hog, s: o.sag }, (v) => Math.max(v.h, v.s), { unit: 'kN·m', dp: 2, ref: STD.rule, ...ex(expected) })
    return 0
  }
  const fl = work.plan.floors[k]
  const xa = ix >= 1 ? cap(jb.xa, 'R') : null
  const xbn = ix < fl.nx ? cap(jb.xb, 'L') : null
  const ya = iy >= 1 ? cap(jb.ya, 'R') : null
  const ybn = iy < fl.ny ? cap(jb.yb, 'L') : null
  const aboutY = one(xa, xbn, `Beam moments of resistance about the y axis (${where})`, exp.aboutY)
  const aboutX = one(ya, ybn, `Beam moments of resistance about the x axis (${where})`, exp.aboutX)
  return { aboutY, aboutX }
}

/** The check of one load case, in the model's own arithmetic, with every intermediate kept. */
function caseDetail(col: ColRec, cs: NodeLoad['cases'][number], fck: number) {
  const { b, D, cfg } = col.des
  const exY = eMin(col.unsupported, D)
  const exX = eMin(col.unsupported, b)
  const Mx = Math.max(Math.abs(cs.Mx), cs.Pu * exY)
  const My = Math.max(Math.abs(cs.My), cs.Pu * exX)
  const Asc = cfg.positions.reduce((s, x) => s + x.area, 0)
  const Ac = b * D - Asc
  const Puz = 0.45 * fck * Ac + 0.75 * FY * Asc
  const r = cs.Pu / Puz
  const alpha = alphaN(r)
  const sx = uniaxialSolve(D, b, cfg.positions.map((x) => ({ y: x.y, area: x.area })), cs.Pu, fck)
  const sy = uniaxialSolve(b, D, cfg.positions.map((x) => ({ y: x.x, area: x.area })), cs.Pu, fck)
  const ax = Mx <= 0 ? 0 : sx.M <= 0 ? 9 : Math.pow(Mx / sx.M, alpha)
  const ay = My <= 0 ? 0 : sy.M <= 0 ? 9 : Math.pow(My / sy.M, alpha)
  const ratio = cs.Pu >= Puz ? 9 : ax + ay
  return { Mx, My, Puz, r, alpha, sx, sy, ax, ay, ratio, Asc, Ac }
}

/** The confining steel of IS 13920 cl. 7.4.8 for one column, beside the tie steel the model counts, under the two readings of the clause. */
function confinement(col: ColRec, fck: number): { s: number; h: number; need: number; one: number; all: number } {
  const { b, D, cfg } = col.des
  const h = Math.min(300, Math.max(b - 80, D - 80))
  const Ag = b * D
  const Ak = (b - 80) * (D - 80)
  const s = col.tie.sConf ?? 100
  const need = 0.18 * s * h * (fck / FY_SHEAR) * (Ag / Ak - 1)
  const one = barArea(col.tie.tiePhi)
  return { s, h, need, one, all: one * (2 + Math.max(cfg.crossB, cfg.crossD)) }
}

function columnExample(c: CalcCtx, col: ColRec): CalcBlock[] {
  const { L, work } = c
  const { ctx, plan } = work
  const a = work.analysis
  const F = plan.F
  const fck = ctx.fck
  const { b, D, cfg } = col.des
  const k = col.k
  const node = a.loads.get(`${k}:${col.ix}:${col.iy}`)!
  const q = node.detail
  const blocks: CalcBlock[] = []
  const lat = a.lat
  const posName = `grid position ${col.ix + 1}, ${col.iy + 1}`

  // ---- 7b. which column and the load that comes down to it
  L.input('Column', `${storeyName(k, ctx.stilt)}, ${posName}, ${TYPE_LABEL[col.type].toLowerCase()} column`, STD.rule, 'The column of the lowest storey that sets the largest section. All columns are in the schedule at the end of this section')
  L.value('Storey height', plan.hs, 'm', 2, 'Section 3')
  L.value('Unsupported length used for the minimum eccentricity', col.unsupported, 'mm', 0, `${STD.is456} cl. 25.4 (unsupported length)`, `Storey height less ${d0(plan.hs * 1000 - col.unsupported)} mm for the beam. The beam depth is not known when the column loads are made, so 400 mm is assumed`)
  const wc = L.calc('Own weight of the column in this storey, at the estimated size', 'Wc = 25 × s² × hs', '{g} × ({s} ÷ 1000)² × {h}', { g: GAMMA_RC, s: a.fns.colEst(k), h: plan.hs }, (v) => v.g * (v.s / 1000) * (v.s / 1000) * v.h, {
    unit: 'kN',
    dp: 2,
    ref: `${STD.is456} cl. 19.2.1; ${STD.rule}`,
    note: `The loads are made before the columns are designed, so every column is weighed as a square of ${d0(a.fns.colEst(k))} mm (the size by floors carried)`,
    ...ex(q.wc),
  })
  void wc
  blocks.push(takeBlock(L, 'col-ex-id', 'Worked column: which column'))

  // reactions of the beams at the node
  const jb = jointBeams(c, k, col.ix, col.iy)
  const rrows: string[][] = []
  let sumDL = 0
  let sumLL = 0
  const addR = (r: BeamRec | undefined, side: 'left' | 'right', name: string) => {
    if (!r) return
    const share = reactionShare(r.n, r.i)[side]
    const tdl = (r.vDL + (r.des?.selfWeight ?? 0)) * r.L
    const tll = r.vLL * r.L
    sumDL += share * tdl
    sumLL += share * tll
    rrows.push([name, d2(r.L), d2(share), d1(tdl), d1(tll), d1(share * tdl), d1(share * tll)])
  }
  addR(jb.xa, 'right', 'x-beam before the column')
  addR(jb.xb, 'left', 'x-beam after the column')
  addR(jb.ya, 'right', 'y-beam before the column')
  addR(jb.yb, 'left', 'y-beam after the column')
  check(L, 'Beam reactions on the example column: dead', sumDL, q.reDL)
  check(L, 'Beam reactions on the example column: imposed', sumLL, q.reLL)
  blocks.push(
    tableBlock(
      'col-ex-reactions',
      'Worked column: load from the beams of its own storey',
      table(['Beam', 'Span (m)', 'Share to this column', 'Beam dead load incl. own weight (kN)', 'Beam imposed load (kN)', 'Dead to column (kN)', 'Imposed to column (kN)'], rrows, { num: [1, 2, 3, 4, 5, 6], foot: ['Total', '', '', '', '', d1(sumDL), d1(sumLL)] }),
      {
        intro: 'A beam passes its load to its two ends in the shares of IS 456 Table 13: 0.4 at an outer support, 0.6 at the first interior support on the outer side, 0.55 on its inner side and 0.5 elsewhere. A single span shares 0.5 and 0.5.',
        note: `Shares: ${STD.is456} cl. 22.5.1, Table 13. The beam loads are the shear-equivalent loads of Section 4 times the span, with the beam's own weight added to the dead load.`,
      }
    )
  )

  // take-down down the stack
  const stack: NodeLoad[] = []
  for (let kk = F - 1; kk >= k; kk--) {
    const nl = a.loads.get(`${kk}:${col.ix}:${col.iy}`)
    if (nl) stack.push(nl)
  }
  const trows: string[][] = []
  let rdl = 0
  let rll = 0
  stack.forEach((nl, i) => {
    const wcK = GAMMA_RC * Math.pow(a.fns.colEst(nl.k) / 1000, 2) * plan.hs
    check(L, `Column own weight, storey ${nl.k}`, wcK, nl.detail.wc)
    rdl += nl.detail.reDL + wcK
    rll += nl.detail.reLL
    check(L, `Running dead load, storey ${nl.k}`, rdl, nl.detail.runDL)
    check(L, `Running imposed load, storey ${nl.k}`, rll, nl.detail.runLL)
    const red = llReduction(i + 1)
    check(L, `Imposed load reduction, storey ${nl.k}`, red, nl.detail.red)
    trows.push([storeyName(nl.k, ctx.stilt), d1(nl.detail.reDL), d1(nl.detail.reLL), d1(wcK), d1(rdl), d1(rll), String(i + 1), `${d0(red * 100)} %`, d1(rll * (1 - red))])
  })
  blocks.push(
    tableBlock('col-ex-takedown', 'Worked column: load down the stack of storeys', table(['Storey', 'Dead from beams (kN)', 'Imposed from beams (kN)', 'Own weight (kN)', 'Dead load carried (kN)', 'Imposed carried, before reduction (kN)', 'Floors carried', 'Reduction of imposed', 'Imposed carried (kN)'], trows, { num: [1, 2, 3, 4, 5, 6, 7, 8] }), {
      intro: 'The loads are added from the roof down. The imposed load on a column is reduced by the number of floors it carries (Section 4).',
      note: 'The beam reactions of the other storeys are the same working as the table above, taken from the model.',
    })
  )
  L.value('Dead load at the foot of the column, Pdl', node.Pdl, 'kN', 1, 'Total of the dead column above')
  const Pll = L.calc('Imposed load at the foot of the column, Pll', 'Pll = imposed carried × (1 − reduction)', '{r} × (1 − {x})', { r: q.runLL, x: q.red }, (v) => v.r * (1 - v.x), { unit: 'kN', dp: 1, ref: `${STD.is875_2} cl. 3.2.1`, ...ex(node.Pll) })
  const Pser = L.calc('Service load on the column', 'P = Pdl + Pll', '{a} + {b}', { a: node.Pdl, b: Pll }, (v) => v.a + v.b, { unit: 'kN', dp: 1, ref: STD.rule, ...ex(col.Pser) })
  L.calc('Factored axial load', 'Pu = 1.5 (Pdl + Pll)', '1.5 × {p}', { p: Pser }, (v) => 1.5 * v.p, { unit: 'kN', dp: 1, ref: `${STD.is456} Table 18`, ...ex(col.Pu) })
  blocks.push(takeBlock(L, 'col-ex-axial', 'Worked column: axial load'))

  // ---- gravity moments
  const top = unbalancedLines(c, k, col.ix, col.iy, 'joint above')
  const bot = k >= 1 ? unbalancedLines(c, k - 1, col.ix, col.iy, 'joint below') : { mx: 0, my: 0 }
  check(L, 'Unbalanced moment above x', top.mx, q.top.mx)
  check(L, 'Unbalanced moment above y', top.my, q.top.my)
  check(L, 'Unbalanced moment below x', bot.mx, q.bot.mx)
  check(L, 'Unbalanced moment below y', bot.my, q.bot.my)
  const topShare = q.topShare
  L.value('Share of the unbalanced moment taken by this column at the joint above', topShare, '', 2, `${STD.rule}: half where a column continues above the joint, all of it at the roof`)
  L.value('Share at the joint below', 0.5, '', 2, `${STD.rule}: half goes to the column below`)
  const Mgx = L.calc('Service moment from the gravity loads about x', 'Mgx = max(share above × Mx,above ; 0.5 × Mx,below)', 'max({s} × {t}; 0.5 × {b})', { s: topShare, t: top.mx, b: bot.mx }, (v) => Math.max(v.s * v.t, 0.5 * v.b), { unit: 'kN·m', dp: 2, ref: STD.rule, ...ex(q.Mgx) })
  const Mgy = L.calc('Service moment from the gravity loads about y', 'Mgy = max(share above × My,above ; 0.5 × My,below)', 'max({s} × {t}; 0.5 × {b})', { s: topShare, t: top.my, b: bot.my }, (v) => Math.max(v.s * v.t, 0.5 * v.b), { unit: 'kN·m', dp: 2, ref: STD.rule, ...ex(q.Mgy) })
  blocks.push(takeBlock(L, 'col-ex-gravity', 'Worked column: moments from the gravity loads', { intro: 'The beams pass the difference of their end moments to the columns at a joint. The model takes the larger of what the joint above and the joint below pass to this column.' }))

  // ---- lateral moments
  const MEx = portalColumnMoment(c, 'y', k, col.ix, col.iy, 'this column', true)
  const MEy = portalColumnMoment(c, 'x', k, col.ix, col.iy, 'this column', true)
  check(L, 'Column lateral moment about x', MEx, q.MEx)
  check(L, 'Column lateral moment about y', MEy, q.MEy)
  void lat
  blocks.push(takeBlock(L, 'col-ex-lateral', 'Worked column: moments from the earthquake or wind', { intro: 'The lateral load along y bends the column about its x axis, and the load along x about its y axis (Section 5 gives the storey shears).' }))

  // ---- the load cases
  const rD = COLUMN_DEAD_MOMENT_SHARE
  L.value('Dead share of the gravity moment', rD, '', 2, `${STD.assume}: the dead load is taken as 75 % of the gravity moment where the imposed load is left out`)
  const Dl = node.Pdl
  const Ll = node.Pll
  const cs: Array<[string, number, number, number]> = [
    ['1.5 (DL + LL): Mx = 1.5 Mgx ; My = 1.5 Mgy', 1.5 * (Dl + Ll), 1.5 * Mgx, 1.5 * Mgy],
    ['1.2 (DL + LL + EL along y, 30 % along x): Mx = 1.2 (Mgx + MEx) ; My = 1.2 (Mgy + 0.3 MEy)', 1.2 * (Dl + Ll), 1.2 * (Mgx + MEx), 1.2 * (Mgy + 0.3 * MEy)],
    ['1.2 (DL + LL + EL along x, 30 % along y): Mx = 1.2 (Mgx + 0.3 MEx) ; My = 1.2 (Mgy + MEy)', 1.2 * (Dl + Ll), 1.2 * (Mgx + 0.3 * MEx), 1.2 * (Mgy + MEy)],
    ['1.5 (DL + EL along y, 30 % along x): Mx = 1.5 (rD Mgx + MEx) ; My = 1.5 (rD Mgy + 0.3 MEy)', 1.5 * Dl, 1.5 * (rD * Mgx + MEx), 1.5 * (rD * Mgy + 0.3 * MEy)],
    ['1.5 (DL + EL along x, 30 % along y): Mx = 1.5 (rD Mgx + 0.3 MEx) ; My = 1.5 (rD Mgy + MEy)', 1.5 * Dl, 1.5 * (rD * Mgx + 0.3 * MEx), 1.5 * (rD * Mgy + MEy)],
    ['0.9 DL + 1.5 EL along y, 30 % along x: Mx = 1.5 MEx + 0.9 rD Mgx ; My = 0.45 MEy + 0.9 rD Mgy', 0.9 * Dl, 1.5 * MEx + 0.9 * rD * Mgx, 1.5 * 0.3 * MEy + 0.9 * rD * Mgy],
    ['0.9 DL + 1.5 EL along x, 30 % along y: Mx = 0.45 MEx + 0.9 rD Mgx ; My = 1.5 MEy + 0.9 rD Mgy', 0.9 * Dl, 1.5 * 0.3 * MEx + 0.9 * rD * Mgx, 1.5 * MEy + 0.9 * rD * Mgy],
  ]
  const sc = q.scwb
  const names = caseNames(node)
  let reqX = 0
  let reqY = 0
  if (sc) {
    // strong-column weak-beam: written out
    L.value('Share of the beam moments the column must carry', SCWB_COLUMN_SHARE, '', 2, REF_SCWB, 'The model asks the columns above and below a joint to carry 1.1 times the beam moments of resistance between them, half each: 1.1 ÷ 2 = 0.55')
    const hasAbove = k < F - 1 && nodeExists(plan.floors[k + 1], col.ix, col.iy)
    const tc = hasAbove ? capSumLines(c, k, col.ix, col.iy, 'joint above') : { aboutX: 0, aboutY: 0 }
    const bc = k >= 1 ? capSumLines(c, k - 1, col.ix, col.iy, 'joint below') : { aboutX: 0, aboutY: 0 }
    reqX = L.calc('Column moment required about x', 'Mreq = 0.55 × larger of the sums above and below', '{s} × max({a}; {b})', { s: SCWB_COLUMN_SHARE, a: tc.aboutX, b: bc.aboutX }, (v) => v.s * Math.max(v.a, v.b), { unit: 'kN·m', dp: 2, ref: REF_SCWB, ...ex(sc.reqX) })
    reqY = L.calc('Column moment required about y', 'Mreq = 0.55 × larger of the sums above and below', '{s} × max({a}; {b})', { s: SCWB_COLUMN_SHARE, a: tc.aboutY, b: bc.aboutY }, (v) => v.s * Math.max(v.a, v.b), { unit: 'kN·m', dp: 2, ref: REF_SCWB, ...ex(sc.reqY) })
    if (reqX > 0) cs.push(['Strong column - weak beam, about x: Mx = Mreq', 1.2 * (Dl + Ll), reqX, 0])
    if (reqY > 0) cs.push(['Strong column - weak beam, about y: My = Mreq', 1.2 * (Dl + Ll), 0, reqY])
    blocks.push(takeBlock(L, 'col-ex-scwb', 'Worked column: strong column - weak beam', { intro: 'In Zone III and above the columns at a joint must be stronger than the beams that meet in it, so that a hinge forms in the beams first. The model does this by adding the moment the column must carry as an extra load case. The comparison uses the beam moments of resistance worked in Section 6.' }))
  }
  check(L, 'Number of column load cases', cs.length, node.cases.length)
  const crow: string[][] = []
  cs.forEach((x, i) => {
    const e = node.cases[i]
    if (e) {
      check(L, `Column case ${i + 1}: Pu`, x[1], e.Pu / 1e3)
      check(L, `Column case ${i + 1}: Mx`, x[2], e.Mx / 1e6)
      check(L, `Column case ${i + 1}: My`, x[3], e.My / 1e6)
    }
    crow.push([String(i + 1), x[0], d1(x[1]), d2(x[2]), d2(x[3])])
  })
  blocks.push(
    tableBlock('col-ex-cases', 'Worked column: the load cases', table(['Case', 'Combination and moments', 'Pu (kN)', 'Mx (kN·m)', 'My (kN·m)'], crow, { num: [2, 3, 4] }), {
      intro: 'Each case is a column load that must be carried by the section. EL is the earthquake or wind. 100 % of the lateral force acts one way and 30 % the other (IS 1893 cl. 6.3.2; the model applies this to every column, which is on the safe side for a frame with its elements along two perpendicular axes). Moments are taken positive: the section is symmetrical, so the sign of the lateral load does not matter.',
      note: 'The axial load does not change with the lateral load. The extra column load and relief from the overturning of the building are not added (see the limits at the start of the sheet).',
    })
  )

  // ---- the section and the check
  L.value('Concrete grade', fck, 'N/mm²', 0, `M${fck}: Section 2`)
  L.value('Width b (along x)', b, 'mm', 0, STD.rule, `Chosen by the search: the sections of the model's list from the smallest up, the first that passes every load case (with the least weighted concrete, formwork and steel of those that do)`)
  L.value('Depth D (along y)', D, 'mm', 0, STD.rule)
  L.input('Bars', `${cfg.n} bars of ${cfg.phi} mm: ${cfg.nb} along each face of width b and ${cfg.nd} along each face of depth D (corners counted in both)`, `${STD.is456} cl. 26.5.3`, 'Bars are spread round the perimeter at even spacing')
  const Asc = L.calc('Area of longitudinal steel', 'Asc = n × π φ² ÷ 4', '{n} × π × {p}² ÷ 4', { n: cfg.n, p: cfg.phi }, (v) => v.n * barArea(v.p), { unit: 'mm²', dp: 0, ref: STD.rule, ...ex(cfg.ast) })
  L.calc('Steel percentage', 'p = 100 Asc ÷ (b D)', '100 × {a} ÷ ({b} × {d})', { a: Asc, b, d: D }, (v) => (100 * v.a) / (v.b * v.d), { unit: '%', dp: 2, ref: `${STD.is456} cl. 26.5.3.1(a): not under ${COLUMN_STEEL_PCT.min} %; the model keeps it under ${COLUMN_STEEL_PCT.max} %`, ...ex(col.des.asPercent) })
  const cdist = L.calc('Distance from the face to the centre of a corner bar', 'c = cover + tie + φ ÷ 2', '{c} + {t} + {p} ÷ 2', { c: COVER_COLUMN, t: COLUMN_COVER_TIE_PHI, p: cfg.phi }, (v) => v.c + v.t + v.p / 2, { unit: 'mm', dp: 1, ref: `${STD.is456} cl. 26.4.2.1 (cover to columns 40 mm); ${STD.rule}`, note: `A ${COLUMN_COVER_TIE_PHI} mm tie is assumed for placing the bars, even where a 10 mm tie is used with 25 mm bars`, ...ex(cfg.positions[0].y) })
  const spB = (b - 2 * cdist) / (cfg.nb - 1)
  const spD = (D - 2 * cdist) / (cfg.nd - 1)
  L.calc('Spacing of bars along a face of width b', 's = (b − 2c) ÷ (nb − 1)', '({b} − 2 × {c}) ÷ ({n} − 1)', { b, c: cdist, n: cfg.nb }, (v) => (v.b - 2 * v.c) / (v.n - 1), { unit: 'mm', dp: 1, ref: `${STD.is456} cl. 26.5.3.1(g): not over ${COLUMN_STEEL_PCT.maxSpacing} mm along the face; clear gap not under the larger of the bar size and 25 mm (cl. 26.3.1)`, note: `Clear gap ${fixed(spB - cfg.phi, 1)} mm` })
  L.calc('Spacing of bars along a face of depth D', 's = (D − 2c) ÷ (nd − 1)', '({d} − 2 × {c}) ÷ ({n} − 1)', { d: D, c: cdist, n: cfg.nd }, (v) => (v.d - 2 * v.c) / (v.n - 1), { unit: 'mm', dp: 1, ref: `${STD.is456} cl. 26.5.3.1(g)`, note: `Clear gap ${fixed(spD - cfg.phi, 1)} mm` })
  const exY = L.calc('Minimum eccentricity over the depth D', 'emin = max(lu ÷ 500 + D ÷ 30 ; 20 mm)', 'max({l} ÷ 500 + {d} ÷ 30; 20)', { l: col.unsupported, d: D }, (v) => eMin(v.l, v.d), { unit: 'mm', dp: 1, ref: REF_ECC, ...ex(eMin(col.unsupported, D)) })
  const exX = L.calc('Minimum eccentricity over the width b', 'emin = max(lu ÷ 500 + b ÷ 30 ; 20 mm)', 'max({l} ÷ 500 + {d} ÷ 30; 20)', { l: col.unsupported, d: b }, (v) => eMin(v.l, v.d), { unit: 'mm', dp: 1, ref: REF_ECC, ...ex(eMin(col.unsupported, b)) })
  void exY
  void exX
  L.say('Slenderness', `lu ÷ D = ${d1(col.unsupported / D)} and lu ÷ b = ${d1(col.unsupported / b)}. IS 456 cl. 25.1.2 treats a column as short when both effective length ratios are under 12. The model uses the unsupported length as the effective length and adds no extra moment for slenderness.`, `${STD.is456} cl. 25.1.2`)
  blocks.push(takeBlock(L, 'col-ex-section', 'Worked column: the section'))

  // biaxial check of every case
  const crows: string[][] = []
  let worst = { idx: 0, ratio: -1 }
  node.cases.forEach((cse, i) => {
    const dt = caseDetail(col, cse, fck)
    check(L, `Column case ${i + 1}: biaxial ratio`, dt.ratio, caseRatio(b, D, cfg, fck, cse, col.unsupported))
    if (dt.ratio > worst.ratio) worst = { idx: i, ratio: dt.ratio }
    crows.push([String(i + 1), d1(cse.Pu / 1e3), d2(dt.Mx / 1e6), d2(dt.My / 1e6), d1(dt.Puz / 1e3), d3(dt.r), d3(dt.alpha), d2(dt.sx.M / 1e6), d2(dt.sy.M / 1e6), d3(dt.ratio)])
  })
  check(L, 'Worst column case', worst.ratio, worstCase(col, node, fck).ratio)
  blocks.push(
    tableBlock(
      'col-ex-check',
      'Worked column: the biaxial check of every case',
      table(['Case', 'Pu (kN)', 'Mx used (kN·m)', 'My used (kN·m)', 'Puz (kN)', 'Pu ÷ Puz', 'Exponent n', 'Mux1 (kN·m)', 'Muy1 (kN·m)', 'Ratio'], crows, { num: [1, 2, 3, 4, 5, 6, 7, 8, 9] }),
      {
        intro: 'For each case: the moment used is the larger of the case moment and Pu × emin. Puz = 0.45 fck Ac + 0.75 fy Asc (cl. 39.6). Mux1 and Muy1 are the moments the section can carry about each axis alone at that axial load (strain compatibility, below). The check is (Mux ÷ Mux1)^n + (Muy ÷ Muy1)^n ≤ 1, with the exponent n = αn = 1 for Pu ÷ Puz up to 0.2, 2 from 0.8 and a straight line between (cl. 39.6).',
        note: `A ratio of 1 or under passes. The section was chosen so that every case passes; the largest ratio is ${d3(worst.ratio)} (case ${worst.idx + 1}: ${names[worst.idx] ?? ''}).`,
      }
    )
  )

  // strain compatibility for the worst case
  const wc2 = node.cases[worst.idx]
  const dt = caseDetail(col, wc2, fck)
  const FYD = 0.87 * FY
  L.value('Worst case', worst.idx + 1, '', 0, STD.rule, `${names[worst.idx] ?? ''}: Pu = ${d1(wc2.Pu / 1e3)} kN`)
  L.say('Stress-strain curves', `Concrete: parabola to a strain of 0.002 and flat to 0.0035, peak stress 0.446 fck = ${fixed(0.446 * fck, 2)} N/mm². Steel: ES = ${d0(ES)} N/mm², stress limited to 0.87 fy = ${d0(FYD)} N/mm² in tension and in compression (a flat top). The curve for cold-worked bars in IS 456 Fig. 23A rises more gently near yield, so the flat top gives a slightly higher bar stress than the code curve between about 0.0017 and 0.004 strain; the model does not use the sloping branch. The compression zone is divided into ${STRIPS} strips, and a bar in the compression zone has the concrete it displaces taken off its stress.`, `${STD.is456} cl. 38.1, Fig. 21 (concrete) and Fig. 23 (steel); ${STD.assume} for the flat top`)
  const axisBlock = (axis: 'x' | 'y') => {
    const depth = axis === 'x' ? D : b
    const width = axis === 'x' ? b : D
    const bars = cfg.positions.map((p) => ({ y: axis === 'x' ? p.y : p.x, area: p.area }))
    const sol = axis === 'x' ? dt.sx : dt.sy
    if (sol.xu === null || sol.status !== 'solved') {
      L.say(`Bending about ${axis}`, 'The axial load is outside the range the neutral-axis search covers for this axis; the moment capacity is taken as the model gives it.', STD.rule)
      return
    }
    const bd = sectionBreakdown(depth, width, bars, sol.xu, fck)
    const byY = new Map<number, { n: number; area: number; strain: number; stress: number; force: number }>()
    for (const x of bd.bars) {
      const key = Math.round(x.y * 1000) / 1000
      const cur = byY.get(key)
      if (cur) {
        cur.n++
        cur.force += x.force
      } else byY.set(key, { n: 1, area: x.area, strain: x.strain, stress: x.stress, force: x.force })
    }
    const rows = [...byY.entries()].sort((p, q) => p[0] - q[0]).map(([y, v]) => [d1(y), String(v.n), fixed(v.strain * 1000, 3), d1(v.stress), d1(v.force / 1e3)])
    const steelP = bd.bars.reduce((s, x) => s + x.force, 0)
    check(L, `Strain-compatibility force balance about ${axis}`, bd.P, wc2.Pu, 1e-6)
    check(L, `Strain-compatibility moment about ${axis}`, bd.M, sol.M)
    L.calc(`Neutral-axis depth found for bending about ${axis}`, 'xu such that the axial force of concrete and steel equals Pu', '{x} found by halving the interval 40 times', { x: sol.xu }, (v) => v.x, { unit: 'mm', dp: 1, ref: `${STD.is456} cl. 39.1 and 38.1 (sections stay plane; the strain limits of 39.1); ${STD.rule} (solved by halving)`, note: `Measured from the compression face over the ${axis === 'x' ? 'depth D' : 'width b'} = ${d0(depth)} mm` })
    L.calc(`Force in the concrete (bending about ${axis})`, 'Cc = Σ stress × width × strip depth', '{c} ÷ 1000', { c: bd.concreteP }, (v) => v.c / 1000, { unit: 'kN', dp: 1, ref: `${STD.is456} cl. 38.1` })
    L.calc(`Net force in the steel (bending about ${axis})`, 'Cs = Σ bar stress × bar area', '{c} ÷ 1000', { c: steelP }, (v) => v.c / 1000, { unit: 'kN', dp: 1, ref: `${STD.is456} cl. 38.1` })
    L.calc(`Axial force of the section (bending about ${axis})`, 'P = Cc + Cs, equal to Pu', '{a} + {b}', { a: bd.concreteP / 1000, b: steelP / 1000 }, (v) => v.a + v.b, { unit: 'kN', dp: 1, ref: `${STD.is456} cl. 39.5`, expect: wc2.Pu / 1e3, tol: Math.max(1e-6, (wc2.Pu / 1e3) * 1e-6) })
    L.calc(`Moment capacity about ${axis}`, `Mu${axis}1 = Σ force × lever arm about the centroid`, '{m} ÷ 10^6', { m: bd.M }, (v) => v.m / 1e6, { unit: 'kN·m', dp: 2, ref: `${STD.is456} cl. 39.5`, ...ex(sol.M / 1e6) })
    blocks.push(
      takeBlock(L, `col-ex-strain-${axis}`, `Worked column: strain compatibility, bending about ${axis} (worst case)`, {
        table: table(['Bar level, from the compression face (mm)', 'Bars at this level', 'Strain (per mille)', 'Stress (N/mm²)', 'Force (kN)'], rows, { num: [0, 1, 2, 3, 4] }),
        note: `Strain is positive in compression. The bars at one level share the same strain. The forces add to the axial load Pu = ${d1(wc2.Pu / 1e3)} kN.`,
      })
    )
  }
  axisBlock('x')
  axisBlock('y')

  // ---- ties
  const tr = col.tie
  L.value('Clear height of the column concrete in this storey, Lc', tr.Lc, 'mm', 0, `${STD.rule}: storey height less the slab; the lowest storey also includes the part down to the footing`)
  L.pick('Tie diameter', ctx.seismic ? 'the size designed with the column: 8 mm, or 10 mm with 25 mm bars' : '6 mm for bars up to 24 mm, otherwise the designed size', `${tr.tiePhi} mm`, ctx.seismic ? `${STD.is13920} cl. 7.3.1 for the rectangular hoop with 135° hooks; ${STD.rule} for the size` : `${STD.is456} cl. 26.5.3.2(c)(2): not under a quarter of the largest bar and never under 6 mm`, `Main bars ${cfg.phi} mm`)
  const s456 = L.calc('Pitch limit of ties', 's = min(least side ; 16 × smallest main bar ; 48 × tie ; 300)', 'min({m}; 16 × {p}; 48 × {t}; 300)', { m: tr.minDim, p: cfg.phi, t: tr.tiePhi }, (v) => Math.min(v.m, 16 * v.p, 48 * v.t, 300), { unit: 'mm', dp: 0, ref: `${STD.is456} cl. 26.5.3.2(c)(1) for the least side, 16 × the smallest bar and 300 mm; SP 34:1987 section 7.2.6.1 for the 48 × tie diameter`, note: 'IS 456:2000 gives the least side, 16 × the smallest bar and 300 mm. The 48 × tie diameter limit is from the earlier edition (1978), as SP 34 repeats it; the model keeps it', ...ex(tr.s456) })
  const f25 = (v: number) => Math.max(75, Math.floor(v / 25) * 25)
  if (ctx.seismic) {
    const lo = L.calc('Length of the closely tied zone at each end', 'lo = max(larger side ; Lc ÷ 6 ; 450 mm)', 'max({m}; {c} ÷ 6; 450)', { m: tr.maxDim, c: tr.Lc }, (v) => Math.max(v.m, v.c / 6, 450), { unit: 'mm', dp: 0, ref: `${STD.is13920} cl. 7.4.1`, ...ex(tr.lo!) })
    const sConf = L.calc('Tie spacing in the closely tied zone', 's = min(100 ; max(75 ; one quarter of the least side, in whole 5 mm))', 'min(100; max(75; floor({m} ÷ 4 ÷ 5) × 5))', { m: tr.minDim }, (v) => Math.min(100, Math.max(75, Math.floor(v.m / 4 / 5) * 5)), { unit: 'mm', dp: 0, ref: `${STD.is13920} cl. 7.4.6`, ...ex(tr.sConf!) })
    if (tr.fullHeight) {
      L.say('Full-height confinement', 'The lowest storey is open (no walls), so its stiffness differs from the storeys above. The ties are closely spaced over the full height of the column.', `${STD.is13920} cl. 7.4.5; ${STD.rule}`)
      L.calc('Number of ties in the storey', 'n = ceil(Lc ÷ s) + 1', 'ceil({c} ÷ {s}) + 1', { c: tr.Lc, s: sConf }, (v) => Math.ceil(v.c / v.s) + 1, { dp: 0, ref: STD.rule, ...ex(tr.nTies) })
    } else {
      const sOut = L.calc('Tie spacing outside the closely tied zones', 's = max(75 ; multiple of 25 mm not over min(half the least side ; pitch limit))', 'max(75; floor(min({m} ÷ 2; {p}) ÷ 25) × 25)', { m: tr.minDim, p: s456 }, (v) => f25(Math.min(v.m / 2, v.p)), { unit: 'mm', dp: 0, ref: `${STD.is13920} cl. 7.3.3 (half the least side); ${STD.rule}`, ...ex(tr.sOut!) })
      L.calc('Ties in the two closely tied zones', 'n = 2 × ceil(lo ÷ s)', '2 × ceil({l} ÷ {s})', { l: lo, s: sConf }, (v) => 2 * Math.ceil(v.l / v.s), { dp: 0, ref: STD.rule, ...ex(tr.nConf!) })
      L.calc('Ties between the zones', 'n = max(0 ; ceil((Lc − 2 lo) ÷ s) − 1)', 'max(0; ceil(({c} − 2 × {l}) ÷ {s}) − 1)', { c: tr.Lc, l: lo, s: sOut }, (v) => Math.max(0, Math.ceil((v.c - 2 * v.l) / v.s) - 1), { dp: 0, ref: STD.rule, ...ex(tr.nOut!) })
    }
  } else {
    const s = L.calc('Tie spacing', 's = multiple of 25 mm not over the pitch limit, not under 75 mm', 'max(75; floor({p} ÷ 25) × 25)', { p: s456 }, (v) => f25(v.p), { unit: 'mm', dp: 0, ref: `${STD.is456} cl. 26.5.3.2(c)(1); ${STD.rule} (rounded down to 25 mm)`, ...ex(tr.sOrd!) })
    L.calc('Number of ties in the storey', 'n = ceil(Lc ÷ s) + 1', 'ceil({c} ÷ {s}) + 1', { c: tr.Lc, s }, (v) => Math.ceil(v.c / v.s) + 1, { dp: 0, ref: STD.rule, ...ex(tr.nTies) })
  }
  const tieLen = L.calc('Cut length of one tie', 'Lt = 2 (A + E) + 12 φ + 2 × tail extra', '2 × ({A} + {E}) + 12 × {p} + 2 × max(0; 75 − 10 × {p})', { A: b - 80, E: D - 80, p: tr.tiePhi }, (v) => stirrupCutLength(v.A, v.E, v.p), { unit: 'mm', dp: 0, ref: `${STD.rule}: A and E are the outside size of the tie (cover ${COVER_COLUMN} mm each side), 135° hooks with 10 φ tails of at least 75 mm`, note: 'A rectangular tie with its cut length is how the bars are bought and bent' })
  void tieLen
  L.value('Cross-ties across the depth, at each tie level', cfg.crossB, '', 0, `${STD.is456} cl. 26.5.3.2(b)(1)`, 'The code lets a bar go without its own tie when bars are not spaced more than 75 mm on either side of a tied bar. The model reads this as 75 mm clear and gives a cross-tie to any bar beyond. Counted from the bar spacing above')
  L.value('Cross-ties across the width, at each tie level', cfg.crossD, '', 0, `${STD.is456} cl. 26.5.3.2(b)(1)`)
  // matching entries in the bar book
  const log = a.book.log.filter((e) => e.group === `col:${k}`)
  const mainOk = log.some((e) => e.note === 'column main bars' && e.phi === cfg.phi && Math.abs(e.lengthMm - col.barLenMm) < 1e-6 && e.count === cfg.n)
  check(L, 'Column main bars appear in the bar book', mainOk ? 1 : 0, 1)
  const tieOk = log.some((e) => e.note === 'column ties' && e.phi === tr.tiePhi && Math.abs(e.lengthMm - stirrupCutLength(b - 80, D - 80, tr.tiePhi)) < 1e-6 && e.count === tr.nTies)
  check(L, 'Column ties appear in the bar book', tieOk ? 1 : 0, 1)
  blocks.push(takeBlock(L, 'col-ex-ties', 'Worked column: ties', { intro: 'The ties hold the main bars against buckling and, in a ductile column, confine the concrete near the joints.' }))

  // ---- confining steel check (IS 13920 cl 7.4.8): shown, not part of the model
  if (ctx.seismic) {
    const hh = Math.min(300, Math.max(b - 80, D - 80))
    const Ag = b * D
    const Ak = (b - 80) * (D - 80)
    const sUse = tr.sConf ?? 100
    const need = L.calc('Area of the tie bar needed for confinement', 'Ash = 0.18 s h (fck ÷ fy) (Ag ÷ Ak − 1)', '0.18 × {s} × {h} × ({f} ÷ {y}) × ({g} ÷ {k} − 1)', { s: sUse, h: hh, f: fck, y: FY_SHEAR, g: Ag, k: Ak }, (v) => 0.18 * v.s * v.h * (v.f / v.y) * (v.g / v.k - 1), {
      unit: 'mm²',
      dp: 1,
      ref: `${STD.is13920} cl. 7.4.8`,
      note: `h = longer side of the hoop, measured to its outside (${d0(Math.max(b - 80, D - 80))} mm; the code caps it at 300 mm, cross-ties shorten it); Ak = area inside the hoop; fy of the hoop taken as ${d0(FY_SHEAR)} N/mm², the value the model uses for every stirrup and tie (IS 456 cl. 40.4). Amendment No. 2 of IS 13920:1993 admits Fe 500 and Fe 550 thermo-mechanically treated bars, and with fy = 500 the area needed would be about 17 % smaller`,
    })
    const one = L.calc('Area of one tie bar', 'A = π φ² ÷ 4', 'π × {p}² ÷ 4', { p: tr.tiePhi }, (v) => barArea(v.p), { unit: 'mm²', dp: 1, ref: STD.rule })
    const legs = 2 + Math.max(cfg.crossB, cfg.crossD)
    const have = L.calc('Area of all the legs of the hoop and cross-ties in one direction', 'A × (2 + cross-ties)', '{a} × (2 + {x})', { a: one, x: legs - 2 }, (v) => v.a * (2 + v.x), {
      unit: 'mm²',
      dp: 1,
      ref: `${STD.is13920} cl. 7.4.8`,
      note: 'The 1993 text defines Ash as the area of the bar forming the hoop, one bar. Designers commonly count every leg of the hoop and its cross-ties in the direction considered, which is the more favourable reading. Both readings are shown below. The side with more cross-ties is taken',
    })
    const cn = confinement(col, fck)
    check(L, 'Confining steel needed, as the table of every column row works it', need, cn.need)
    check(L, 'Area of all the legs, as the table of every column row works it', have, cn.all)
    L.pick('Confinement, reading 1: the one bar forming the hoop (the wording of the 1993 text)', 'one bar ≥ needed', one >= need ? 'Met' : 'Not met', `${STD.is13920} cl. 7.4.8`, `One bar gives ${d2(one / need)} of the area asked for`)
    L.pick('Confinement, reading 2: every leg of the hoop and its cross-ties counted', 'all legs ≥ needed', have >= need ? 'Met' : 'Not met', `${STD.is13920} cl. 7.4.8`, `Every leg counted gives ${d2(have / need)} of the area asked for. The model chooses the tie size from its spacing rules and does not make this check. A structural engineer must give the confining ties of the drawings; the tie steel quantity here is for the tie size shown`)
    blocks.push(takeBlock(L, 'col-ex-ash', 'Worked column: confining steel check (not made by the model)', { intro: 'IS 13920 asks for a minimum area of the bar forming the hoop in the closely tied zone. The quantity model does not make this check, so it is worked here beside the model\'s tie size for the engineer who reads the sheet.' }))
  }
  return blocks
}


export function columnsSection(c: CalcCtx): CalcSection {
  const { L, work, result } = c
  const { ctx, plan } = work
  const a = work.analysis
  const F = plan.F
  const blocks: CalcBlock[] = []

  // ---- 7a. the rules
  L.value('Concrete grade of the columns', ctx.fck, 'N/mm²', 0, `M${ctx.fck}: Section 2`)
  L.value('Cover to the main bars', COVER_COLUMN, 'mm', 0, `${STD.is456} cl. 26.4.2.1: not under 40 mm`)
  L.input('Bar sizes tried', `${COLUMN_PHIS.join(', ')} mm in counts of ${COLUMN_COUNTS.join(', ')}`, STD.rule, `Not more than ${Object.entries(MAX_BARS).map(([p, n]) => `${n} bars of ${p} mm`).join(', ')}: few, larger bars for compaction`)
  L.input('Steel percentage', `${COLUMN_STEEL_PCT.min} % to ${COLUMN_STEEL_PCT.max} % of the gross section`, `${STD.is456} cl. 26.5.3.1`, 'The code allows up to 6 %; 4 % is the practical limit where bars are lapped')
  L.input('Sections tried', `${SIZES.length} sizes from ${SIZES[0][0]} × ${SIZES[0][1]} mm up to ${SIZES[SIZES.length - 1][0]} × ${SIZES[SIZES.length - 1][1]} mm, in order of area`, STD.rule, 'Square sections and a list of rectangles (the longer side along either axis)')
  L.input('Smallest side by floors carried', `1 floor ${minSideFor(1)} mm; 2 floors ${minSideFor(2)} mm; 3 floors ${minSideFor(3)} mm; 4 or more ${minSideFor(4)} mm`, `${STD.rule} (Build Reference lower bounds); IS 13920 cl. 7.1.2 asks for 200 mm at least`, `Never under 230 mm${ctx.stilt ? '; 300 mm in the open parking storey' : ''}`)
  L.input('Column size over the storeys', F <= 3 ? 'The same section in every storey' : 'The same section in each pair of storeys (0-1, 2-3, ...)', STD.rule, 'The size found for the lower storey of the pair is carried up when it also passes there')
  L.input('Check of the section', 'Biaxial interaction (cl. 39.6) for seven load cases, with the minimum eccentricity, by strain compatibility', `${STD.is456} cl. 39.5 and 39.6`)
  L.input('Choice among the sections that pass', 'The least combination of concrete volume, formwork area and steel weight', STD.rule, 'The model weights these three by fixed ratios internal to it; no price is used or shown')
  blocks.push(takeBlock(L, 'col-basis', 'What the column design rests on'))

  // ---- 7b. the worked example
  const gc = governingColumns(a)
  let pick: ColRec | undefined
  for (const [, v] of gc) {
    if (v.col.k !== 0) continue
    if (!pick || v.col.des.b * v.col.des.D > pick.des.b * pick.des.D || (v.col.des.b * v.col.des.D === pick.des.b * pick.des.D && v.col.Pu > pick.Pu)) pick = v.col
  }
  if (!pick) pick = [...gc.values()][0]?.col
  if (pick) blocks.push(...columnExample(c, pick))

  // ---- 7c. the schedule
  type G = { k: number; type: 'corner' | 'edge' | 'interior'; count: number; first: ColRec; rep: ColRec }
  const groups = new Map<string, G>()
  for (const col of a.cols) {
    const key = `${col.k}|${col.type}|${col.des.b}x${col.des.D}|${col.des.cfg.n}-${col.des.cfg.phi}`
    const g = groups.get(key)
    if (g) {
      g.count++
      if (col.Pu > g.rep.Pu) g.rep = col
    } else groups.set(key, { k: col.k, type: col.type, count: 1, first: col, rep: col })
  }
  const rows: string[][] = []
  const rc = result.schedules.columns
  const ord = (t: string) => TYPE_ORDER.indexOf(t as 'corner')
  for (const g of [...groups.values()].sort((p, q) => p.k - q.k || ord(p.type) - ord(q.type) || q.rep.des.b * q.rep.des.D - p.rep.des.b * p.rep.des.D)) {
    const d = g.rep.des
    const node = a.loads.get(`${g.rep.k}:${g.rep.ix}:${g.rep.iy}`)!
    const w = worstCase(g.rep, node, ctx.fck)
    const rep = rc.find((s) => s.storey === g.k && s.type === g.type && s.bMm === d.b && s.dMm === d.D && s.bars === `${d.cfg.n}-${d.cfg.phi}`)
    check(L, `Column schedule row, storey ${g.k} ${g.type} ${d.b}x${d.D}: count`, g.count, rep ? rep.count : -1)
    if (rep) {
      check(L, `Column schedule row, storey ${g.k} ${g.type}: steel percentage`, Math.round(g.first.des.asPercent * 100) / 100, rep.asPercent)
      check(L, `Column schedule row, storey ${g.k} ${g.type}: ties`, g.first.ties === rep.ties ? 1 : 0, 1)
    }
    rows.push([storeyName(g.k, ctx.stilt), TYPE_LABEL[g.type], String(g.count), `${d.b} × ${d.D}`, `${d.cfg.n}-${d.cfg.phi}`, d2(d.asPercent), g.first.ties, d1(g.rep.Pu), d3(w.ratio), caseNames(node)[w.idx], d1(g.rep.unsupported / Math.min(d.b, d.D))])
  }
  check(L, 'Number of columns', a.cols.length, rc.reduce((s, x) => s + x.count, 0))
  check(L, 'Number of columns against the report', a.cols.length, result.members.columns.count)
  putText(
    L,
    'sched.columns',
    JSON.stringify([...groups.values()].map((g) => ({ k: g.k, type: g.type, count: g.count, b: g.rep.des.b, D: g.rep.des.D, bars: `${g.rep.des.cfg.n}-${g.rep.des.cfg.phi}`, pct: Math.round(g.first.des.asPercent * 100) / 100, ties: g.first.ties })))
  )
  blocks.push(
    tableBlock('col-schedule', 'Column schedule: every storey and column type', table(['Storey', 'Type', 'Number', 'Size b × D (mm)', 'Bars', 'Steel %', 'Ties dia @ end/mid (mm)', 'Largest Pu (kN)', 'Largest ratio', 'Case that governs', 'lu ÷ least side'], rows, { num: [2, 5, 7, 8, 10], foot: ['Total', '', String(a.cols.length), '', '', '', '', '', '', '', ''] }), {
      intro: 'Columns of the same storey, type, section and bars are one row. The loads and the ratio are those of the column with the largest axial load in the row. A ratio of 1 or under passes the biaxial check.',
      note: `Storey 0 is the lowest storey of the frame. A ratio above 1 would mean the search reached the largest section on its list; the model then warns that a larger section or higher grade will be needed. lu ÷ least side is the slenderness measure of IS 456 cl. 25.1.2 (short when under 12).`,
    })
  )

  if (ctx.seismic) {
    const crow: string[][] = []
    let metOne = 0
    let metAll = 0
    const grp = [...groups.values()].sort((p, q) => p.k - q.k || ord(p.type) - ord(q.type) || q.rep.des.b * q.rep.des.D - p.rep.des.b * p.rep.des.D)
    for (const g of grp) {
      const cn = confinement(g.rep, ctx.fck)
      const o = cn.one >= cn.need
      const al = cn.all >= cn.need
      if (o) metOne++
      if (al) metAll++
      crow.push([storeyName(g.k, ctx.stilt), TYPE_LABEL[g.type], `${g.rep.des.b} × ${g.rep.des.D}`, `${g.rep.tie.tiePhi} @ ${d0(cn.s)}`, d1(cn.need), d1(cn.one), d1(cn.all), o ? 'Met' : 'Not met', al ? 'Met' : 'Not met'])
    }
    blocks.push(
      tableBlock('col-confinement', 'Confining steel of IS 13920 cl. 7.4.8 for every column row (worked here, not made by the model)', table(['Storey', 'Type', 'Size (mm)', 'Tie dia @ spacing (mm)', 'Ash needed (mm²)', 'One bar (mm²)', 'All legs (mm²)', 'One bar', 'All legs'], crow, { num: [4, 5, 6] }), {
        intro: 'The area of the hoop bar asked for in the closely tied zone, Ash = 0.18 s h (fck ÷ fy) (Ag ÷ Ak − 1), is worked for the representative column of each row of the schedule above, beside the area of the tie the model counts. Reading 1 compares it with the one bar that forms the hoop, as the 1993 text words it. Reading 2 counts every leg of the hoop and its cross-ties in the direction considered, as designers commonly do.',
        note: `${metOne} of ${grp.length} rows meet it by reading 1 and ${metAll} of ${grp.length} by reading 2. The model does not make this check: it chooses the tie size from its spacing rules, and the tie steel quantity of the report is for that size. Where a row is not met, the signed drawings are likely to carry heavier ties than the model counts.`,
      })
    )
  }

  return {
    id: 'columns',
    title: '7. Column design',
    intro: 'Each column carries the loads of the floors above it and the moments of the beams and of the lateral force. The search tries the sections of the model\'s list from the smallest up and keeps the first that passes every load case. The heaviest column of the lowest storey is worked in full; the table at the end lists every storey and column type.',
    blocks,
  }
}

