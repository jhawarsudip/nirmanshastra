// Section 8 of the StructurePro calculation sheet: how the foundation type was decided, one footing (or the raft) worked in full,
// the footing schedule, and the plinth beams. Every step goes through the Ledger and is checked against the model's own figure.

import type { CalcBlock, CalcSection } from '@/lib/calcsheet'
import type { CalcCtx } from './ctx'
import { COVER_FOOTING, FY, astSingly, barArea, stirrupCutLength, tauC } from '../codes'
import { FOOTING_RULES, pickMatBars, type FootingResult } from '../footing'
import { PLINTH_RULES } from '../model'
import { STD, barKg, check, d0, d1, d2, d3, ex, groupBy, stepNote, sumOf, table, takeBlock, tableBlock } from './helpers'
import { put } from './figs'

const R = FOOTING_RULES
const REF_SHEAR = `${STD.is456} cl. 34.2.4.1`
const REF_PUNCH = `${STD.is456} cl. 34.2.4.1(b) and cl. 31.6.3.1`
const REF_MOMENT = `${STD.is456} cl. 34.2.3.1 and 34.2.3.2(a)`
const REF_FLEX = `${STD.is456} Annex G, cl. G-1.1(b)`

/** Everything one footing's quantities depend on, rebuilt from its record with the model's own formulas. */
export function footingQty(fr: FootingResult) {
  const det = fr.detail
  const b = det.input.colB
  const D = det.input.colD
  const A1 = fr.Lf * fr.Bf
  const A2 = (b / 1000 + R.pedestalExtraM) * (D / 1000 + R.pedestalExtraM)
  const h = (fr.depth - R.edgeMm) / 1000
  const concrete = A1 * (R.edgeMm / 1000) + (h / 3) * (A1 + A2 + Math.sqrt(A1 * A2))
  const formwork = 2 * (fr.Lf + fr.Bf) * (R.edgeMm / 1000)
  const pcc = (fr.Lf + R.pccProjectionM) * (fr.Bf + R.pccProjectionM) * R.pccThicknessM
  const nX = Math.floor((fr.Bf * 1000 - R.endAllowanceMm) / det.mX.s) + 1
  const nY = Math.floor((fr.Lf * 1000 - R.endAllowanceMm) / det.mY.s) + 1
  const steel = barKg(det.mX.phi, fr.Lf * 1000 - R.endAllowanceMm, nX) + barKg(det.mY.phi, fr.Bf * 1000 - R.endAllowanceMm, nY)
  const pit = (fr.Lf + R.raftPitFringeM) * (fr.Bf + R.raftPitFringeM)
  return { concrete, formwork, pcc, steel, pit, nX, nY }
}

/** The tests of one trial depth, with the model's own formulas, for the trial table. */
function trialAt(det: FootingResult['detail'], fr: FootingResult, d: number) {
  const { input: f, qu } = det
  const Lf = fr.Lf
  const Bf = fr.Bf
  const vx = qu * Bf * ((Lf * 1000 - f.colD) / 2000 - d / 1000)
  const vy = qu * Lf * ((Bf * 1000 - f.colB) / 2000 - d / 1000)
  const tvx = (Math.max(0, vx) * 1000) / (Bf * 1000 * d)
  const tvy = (Math.max(0, vy) * 1000) / (Lf * 1000 * d)
  const bo = 2 * (f.colB + d + f.colD + d)
  const vp = qu * (Lf * Bf - ((f.colB + d) * (f.colD + d)) / 1e6)
  const ks = Math.min(1, 0.5 + Math.min(f.colB, f.colD) / Math.max(f.colB, f.colD))
  const tp = (vp * 1000) / (bo * d)
  return { vx, vy, tvx, tvy, bo, vp, ks, tp }
}

function typeBlock(c: CalcCtx): CalcBlock {
  const { L, work } = c
  const { plan, site } = work
  const a = work.analysis
  const fd = a.foundation
  L.value('Safe bearing capacity assumed', site.sbc, 'kN/m²', 0, `${STD.assume}: by ground class`, 'Taken from Section 2')
  L.pick('Ground class asks for a raft', 'set for steep slopes, black cotton soil and soft or marshy ground', site.raft ? 'Yes' : 'No', `${STD.assume}: by ground class`)
  if (!site.raft) {
    L.value('Columns at the ground storey, each with a trial footing', fd.trial.length, '', 0, STD.rule, 'Every column is first given the isolated footing its load needs (the same design as the footing worked below)')
    const maxL = L.calc('Longest trial footing', 'Lf,max = largest Lf', 'largest Lf of the trial footings = {v}', { v: Math.max(...fd.trial.map((t) => t.Lf)) }, (v) => v.v, { unit: 'm', dp: 2, ref: STD.rule })
    const maxB = L.calc('Widest trial footing', 'Bf,max = largest Bf', 'largest Bf of the trial footings = {v}', { v: Math.max(...fd.trial.map((t) => t.Bf)) }, (v) => v.v, { unit: 'm', dp: 2, ref: STD.rule })
    const limX = L.calc('Longest footing the bay can take', 'sx − 0.3', '{s} − 0.3', { s: plan.sx }, (v) => v.s - 0.3, { unit: 'm', dp: 2, ref: `${STD.rule}: 0.3 m of the bay is kept clear between neighbouring footings` })
    const limY = L.calc('Widest footing the bay can take', 'sy − 0.3', '{s} − 0.3', { s: plan.sy }, (v) => v.s - 0.3, { unit: 'm', dp: 2, ref: STD.rule })
    const over = maxL > limX || maxB > limY
    check(L, 'Trial footing too large for its bay (1 = yes)', over ? 1 : 0, fd.oversize ? 1 : 0, 0)
    L.pick('A trial footing is larger than its bay', 'Lf,max > sx − 0.3 or Bf,max > sy − 0.3', over ? 'Yes: a raft is used' : 'No', STD.rule)
    const cover = L.calc('Plan area covered by the trial footings', 'Σ Lf × Bf', 'sum of Lf × Bf over the {n} trial footings = {s}', { n: fd.trial.length, s: sumOf(fd.trial.map((t) => t.Lf * t.Bf)) }, (v) => v.s, { unit: 'm²', dp: 2, ref: STD.rule, ...ex(fd.coverM2) })
    const lim = L.calc('Half of the plan of the frame', '0.5 × L × W', '0.5 × {l} × {w}', { l: plan.L, w: plan.W }, (v) => 0.5 * v.l * v.w, { unit: 'm²', dp: 2, ref: `${STD.rule}: footings that cover more than half the plan are replaced by a raft`, ...ex(fd.coverLimitM2) })
    check(L, 'Trial footings cover more than half the plan (1 = yes)', cover > lim ? 1 : 0, fd.coverExceeded ? 1 : 0, 0)
    L.pick('The footings cover more than half of the plan', 'Σ Lf × Bf > 0.5 L W', cover > lim ? 'Yes: a raft is used' : 'No', STD.rule)
    const raft = over || cover > lim
    check(L, 'Foundation is a raft (1 = yes)', raft ? 1 : 0, a.raft ? 1 : 0, 0)
    L.pick('Foundation used', 'isolated footings unless one of the two tests above is met', raft ? 'Raft' : 'Isolated footings', STD.rule, 'These tests are the model\'s own planning rules, not a code check. A raft is the usual answer when footings would meet or overlap.')
  } else {
    check(L, 'Foundation is a raft (1 = yes)', 1, a.raft ? 1 : 0, 0)
    L.pick('Foundation used', 'raft where the ground class asks for one', 'Raft', STD.rule, 'No trial footings are worked for these ground classes')
  }
  return takeBlock(L, 'found-type', 'How the foundation type was decided', {
    intro: `The model first gives every ground-storey column the isolated footing it needs on ${d0(site.sbc)} kN/m², unless the ground class asks for a raft outright. The footings are accepted only if they fit their bays and leave room between them.`,
  })
}

function footingBlocks(c: CalcCtx, fr: FootingResult, ld: { Pdl: number; Pll: number }, label: string): CalcBlock[] {
  const { L, work } = c
  const det = fr.detail
  const inp = det.input
  const fck = work.fckBelow
  const blocks: CalcBlock[] = []
  L.input('Footing worked', label, STD.rule, 'The footing under the column with the largest factored load')
  L.input('Column section b × D', `${inp.colB} × ${inp.colD} mm`, STD.rule, 'b is the side along x, D the side along y')
  L.input('Concrete grade of the footing', work.gradeBelow, `${STD.is456} Table 5`, `fck = ${d0(fck)} N/mm²`)
  const Pser = L.calc('Service load on the column (dead + imposed)', 'P = Pdl + Pll', '{d} + {l}', { d: ld.Pdl, l: ld.Pll }, (v) => v.d + v.l, { unit: 'kN', dp: 1, ref: `${STD.is875_2} cl. 3.2.1 for the reduction; Section 7`, note: 'From the load take-down of Section 7', ...ex(inp.PserKN) })
  const Pu = L.calc('Factored load', 'Pu = 1.5 × P', '1.5 × {p}', { p: Pser }, (v) => 1.5 * v.p, { unit: 'kN', dp: 1, ref: `${STD.is456} Table 18`, ...ex(inp.PuKN) })
  blocks.push(takeBlock(L, 'found-load', 'Load on the footing'))

  // ---- plan size
  const area = L.calc('Plan area needed', 'A = 1.1 P ÷ sbc', '{f} × {p} ÷ {s}', { f: R.selfWeightFactor, p: Pser, s: inp.sbc }, (v) => (v.f * v.p) / v.s, {
    unit: 'm²',
    dp: 3,
    ref: `${STD.is456} cl. 34.1; ${STD.is1904}: the soil pressure is kept within the bearing capacity`,
    note: 'The 1.1 adds 10 % for the weight of the footing and the earth above it: a NirmanShastra planning allowance, not a code factor. The bearing capacity is an assumed value for the ground class.',
    ...ex(det.area),
  })
  const side = L.calc('Side of a square footing', 'side = max(1.0 ; √A)', 'max({m}; √{a})', { m: R.minSideM, a: area }, (v) => Math.max(v.m, Math.sqrt(v.a)), { unit: 'm', dp: 3, ref: `${STD.rule}: no footing narrower than 1.0 m`, ...ex(det.side) })
  const diff = L.calc('Difference of the column sides', '(D − b) ÷ 1000', '({D} − {b}) ÷ 1000', { D: inp.colD, b: inp.colB }, (v) => (v.D - v.b) / 1000, { unit: 'm', dp: 3, ref: STD.rule, ...ex(det.diff) })
  const up50 = (x: number) => Math.ceil(x / R.roundM - 1e-9) * R.roundM
  const Bf = L.calc('Footing width Bf', 'Bf = side − (D − b) ÷ 2, rounded up to 50 mm, not under 1.0 m', 'ceil(max({m}; {s} − {d} ÷ 2) ÷ 0.05) × 0.05', { m: R.minSideM, s: side, d: diff }, (v) => up50(Math.max(v.m, v.s - v.d / 2)), { unit: 'm', dp: 2, ref: STD.rule, ...ex(fr.Bf) })
  const Lf = L.calc('Footing length Lf', 'Lf = Bf + (D − b), rounded up to 50 mm', 'ceil(({B} + max(0; {d})) ÷ 0.05) × 0.05', { B: Bf, d: diff }, (v) => up50(v.B + Math.max(0, v.d)), { unit: 'm', dp: 2, ref: STD.rule, note: 'The footing is longer on the side of the longer column face, so that it projects equally on all sides', ...ex(fr.Lf) })
  const qu = L.calc('Upward pressure under the factored load', 'qu = Pu ÷ (Lf × Bf)', '{P} ÷ ({l} × {b})', { P: Pu, l: Lf, b: Bf }, (v) => v.P / (v.l * v.b), { unit: 'kN/m²', dp: 1, ref: REF_MOMENT, ...ex(det.qu) })
  blocks.push(takeBlock(L, 'found-size', 'Plan size'))

  // ---- depth search
  const trials = det.trials
  check(L, 'Number of trial depths', trials.length, trials.length, 0)
  trials.forEach((t) => {
    const s = trialAt(det, fr, t.d)
    check(L, `Footing trial d = ${t.d}: one-way shear x`, s.tvx, t.tvx)
    check(L, `Footing trial d = ${t.d}: one-way shear y`, s.tvy, t.tvy)
    check(L, `Footing trial d = ${t.d}: punching`, s.tp, t.tp)
    check(L, `Footing trial d = ${t.d}: punching bo`, s.bo, t.bo)
    check(L, `Footing trial d = ${t.d}: ks`, s.ks, t.ks)
  })
  const rowOf = (t: (typeof trials)[number]) => [
    d0(t.d),
    `${d3(t.tvx)} / ${d3(t.tvy)} (≤ ${d3(t.tc)})`,
    `${d3(t.tp)} (≤ ${d3(t.tpAllow)})`,
    `${d1(t.mx)} / ${d1(t.my)} (≤ ${d1(t.muLimX)} / ${d1(t.muLimY)})`,
    t.ok ? 'passes' : 'fails',
  ]
  const shown = trials.length <= 5 ? trials : [trials[0], ...trials.slice(-3)]
  blocks.push(
    tableBlock('found-trials', 'Search for the depth', table(['d (mm)', 'One-way shear stress, x / y (N/mm²)', 'Punching shear stress (N/mm²)', 'Moment x / y (kN·m)', 'Result'], shown.map(rowOf), { num: [0] }), {
      intro: `The effective depth d starts at ${R.dStart} mm and goes up in steps of ${R.dStep} mm until one-way shear, punching shear and bending are all within their limits. ${trials.length} depths were tried${trials.length > shown.length ? '; the first and the last three are shown' : ''}.`,
      note: 'The effective depth used in the search takes no cover off; 12 mm is taken off for the bending check only. The 0.3 % tension steel used for τc is a planning value (the actual steel is found later).',
    })
  )
  const dd = det.dSearch
  const last = trials[trials.length - 1]
  const Vx = L.calc('One-way shear force at d from the column face, along Lf', 'V = qu × Bf × ((Lf − D) ÷ 2 − d)', '{q} × {B} × (({L} × 1000 − {D}) ÷ 2000 − {d} ÷ 1000)', { q: qu, B: Bf, L: Lf, D: inp.colD, d: dd }, (v) => v.q * v.B * ((v.L * 1000 - v.D) / 2000 - v.d / 1000), { unit: 'kN', dp: 1, ref: REF_SHEAR, note: 'The footing acting as a wide beam: critical section at the effective depth from the face of the column', ...ex(last.vx) })
  const tvx = L.calc('Shear stress, along Lf', 'τv = V ÷ (Bf × d)', 'max(0; {V}) × 1000 ÷ ({B} × 1000 × {d})', { V: Vx, B: Bf, d: dd }, (v) => (Math.max(0, v.V) * 1000) / (v.B * 1000 * v.d), { unit: 'N/mm²', dp: 3, ref: REF_SHEAR, ...ex(last.tvx) })
  const Vy = L.calc('One-way shear force at d from the column face, along Bf', 'V = qu × Lf × ((Bf − b) ÷ 2 − d)', '{q} × {L} × (({B} × 1000 − {b}) ÷ 2000 − {d} ÷ 1000)', { q: qu, L: Lf, B: Bf, b: inp.colB, d: dd }, (v) => v.q * v.L * ((v.B * 1000 - v.b) / 2000 - v.d / 1000), { unit: 'kN', dp: 1, ref: REF_SHEAR, ...ex(last.vy) })
  const tvy = L.calc('Shear stress, along Bf', 'τv = V ÷ (Lf × d)', 'max(0; {V}) × 1000 ÷ ({L} × 1000 × {d})', { V: Vy, L: Lf, d: dd }, (v) => (Math.max(0, v.V) * 1000) / (v.L * 1000 * v.d), { unit: 'N/mm²', dp: 3, ref: REF_SHEAR, ...ex(last.tvy) })
  const tc = L.calc(
    'Shear strength of the concrete at 0.3 % steel',
    'τc = 0.85 √(0.8 fck) (√(1 + 5β) − 1) ÷ (6β), β = 0.8 fck ÷ (6.89 pt)',
    '0.85 × √(0.8 × {f}) × (√(1 + 5 × β) − 1) ÷ (6 × β), β = max(1; 0.8 × {f} ÷ (6.89 × {p}))',
    { f: fck, p: R.ptShear },
    (v) => tauC(v.f, v.p),
    { unit: 'N/mm²', dp: 3, ref: `${STD.is456} Table 19: the formula of the code commentary (SP 24) which the table is made from`, note: 'pt = 0.3 % is the model\'s planning value for a footing; the actual steel is found only after the depth is fixed', ...ex(last.tc) }
  )
  const bo = L.calc('Length of the punching perimeter at d ÷ 2 from the column', 'bo = 2 (b + d + D + d)', '2 × ({b} + {d} + {D} + {d})', { b: inp.colB, D: inp.colD, d: dd }, (v) => 2 * (v.b + v.d + v.D + v.d), { unit: 'mm', dp: 0, ref: REF_PUNCH, ...ex(last.bo) })
  const vp = L.calc('Punching shear force', 'Vp = qu × (Lf Bf − (b + d)(D + d))', '{q} × ({L} × {B} − ({b} + {d}) × ({D} + {d}) ÷ 10^6)', { q: qu, L: Lf, B: Bf, b: inp.colB, D: inp.colD, d: dd }, (v) => v.q * (v.L * v.B - ((v.b + v.d) * (v.D + v.d)) / 1e6), { unit: 'kN', dp: 1, ref: REF_PUNCH, ...ex(last.vp) })
  const ks = L.calc('Column shape factor', 'ks = min(1 ; 0.5 + βc), βc = shorter side ÷ longer side', 'min(1; 0.5 + min({b}; {D}) ÷ max({b}; {D}))', { b: inp.colB, D: inp.colD }, (v) => Math.min(1, 0.5 + Math.min(v.b, v.D) / Math.max(v.b, v.D)), { dp: 3, ref: `${STD.is456} cl. 31.6.3.1`, ...ex(last.ks) })
  const tp = L.calc('Punching shear stress', 'τp = Vp ÷ (bo × d)', '{V} × 1000 ÷ ({o} × {d})', { V: vp, o: bo, d: dd }, (v) => (v.V * 1000) / (v.o * v.d), { unit: 'N/mm²', dp: 3, ref: REF_PUNCH, ...ex(last.tp) })
  const tpa = L.calc('Punching shear stress allowed', 'ks × 0.25 √fck', '{k} × 0.25 × √{f}', { k: ks, f: fck }, (v) => v.k * 0.25 * Math.sqrt(v.f), { unit: 'N/mm²', dp: 3, ref: `${STD.is456} cl. 31.6.3.1`, ...ex(last.tpAllow) })
  const mx = L.calc('Bending moment at the column face, about the Lf side', 'M = qu × Bf × ((Lf − D) ÷ 2)² ÷ 2', '{q} × {B} × (({L} × 1000 − {D}) ÷ 2000)² ÷ 2', { q: qu, B: Bf, L: Lf, D: inp.colD }, (v) => (v.q * v.B * Math.pow((v.L * 1000 - v.D) / 2000, 2)) / 2, { unit: 'kN·m', dp: 1, ref: REF_MOMENT, ...ex(last.mx) })
  const my = L.calc('Bending moment at the column face, about the Bf side', 'M = qu × Lf × ((Bf − b) ÷ 2)² ÷ 2', '{q} × {L} × (({B} × 1000 − {b}) ÷ 2000)² ÷ 2', { q: qu, L: Lf, B: Bf, b: inp.colB }, (v) => (v.q * v.L * Math.pow((v.B * 1000 - v.b) / 2000, 2)) / 2, { unit: 'kN·m', dp: 1, ref: REF_MOMENT, ...ex(last.my) })
  const lx = L.calc('Moment the section can carry, Lf side', 'Mu,lim = 0.134 fck Bf (d − 12)²', '0.134 × {f} × {B} × 1000 × ({d} − 12)² ÷ 10^6', { f: fck, B: Bf, d: dd }, (v) => 0.134 * v.f * v.B * 1000 * Math.pow(v.d - R.flexureAllowance, 2) * 1e-6, { unit: 'kN·m', dp: 1, ref: `${STD.is456} Annex G, cl. G-1.1(c): 0.36 × 0.46 × (1 − 0.42 × 0.46) = 0.134 for Fe 500`, ...ex(last.muLimX) })
  const ly = L.calc('Moment the section can carry, Bf side', 'Mu,lim = 0.134 fck Lf (d − 12)²', '0.134 × {f} × {L} × 1000 × ({d} − 12)² ÷ 10^6', { f: fck, L: Lf, d: dd }, (v) => 0.134 * v.f * v.L * 1000 * Math.pow(v.d - R.flexureAllowance, 2) * 1e-6, { unit: 'kN·m', dp: 1, ref: `${STD.is456} Annex G, cl. G-1.1(c)`, ...ex(last.muLimY) })
  const pass = tvx <= tc && tvy <= tc && tp <= tpa && mx <= lx && my <= ly
  check(L, 'Footing depth search ends on a passing trial (1 = yes)', pass ? 1 : 0, last.ok ? 1 : 0, 0)
  L.pick('All five tests at this depth', 'τv ≤ τc in both directions, τp ≤ allowed, M ≤ Mu,lim in both directions', pass ? `Pass at d = ${d0(dd)} mm` : `Not met even at the deepest trial, d = ${d0(dd)} mm (the model keeps it and the engineer must revise the footing)`, STD.rule)
  blocks.push(takeBlock(L, 'found-checks', `Tests at the depth found, d = ${d0(dd)} mm`))

  // ---- overall depth and steel
  const D = L.calc('Overall depth of the footing', 'D = max(350 ; d + 50 + 12, up to the next 25 mm)', 'max({m}; ceil(({d} + {c} + {a}) ÷ 25) × 25)', { m: R.minOverall, d: dd, c: COVER_FOOTING, a: R.flexureAllowance }, (v) => Math.max(v.m, Math.ceil((v.d + v.c + v.a) / R.dStep) * R.dStep), { unit: 'mm', dp: 0, ref: `${STD.is456} cl. 26.4.2.2 (cover 50 mm for a footing); ${STD.rule}`, note: 'IS 456 cl. 34.1.2 asks for at least 150 mm at the edge; the model uses 150 mm and slopes the top up to the column', ...ex(fr.depth) })
  const dX = L.calc('Effective depth of the lower layer (bars along Lf)', 'dX = D − 50 − 8', '{D} − {c} − 8', { D, c: COVER_FOOTING }, (v) => v.D - v.c - 8, { unit: 'mm', dp: 0, ref: `${STD.is456} cl. 26.4.2.2; ${STD.rule} (half of a 16 mm bar)`, ...ex(det.dX) })
  const dY = L.calc('Effective depth of the upper layer (bars along Bf)', 'dY = dX − 12', '{d} − 12', { d: dX }, (v) => v.d - 12, { unit: 'mm', dp: 0, ref: STD.rule, ...ex(det.dY) })
  const minAst = L.calc('Minimum steel in each direction, per metre width', 'Ast,min = 0.0012 × 1000 × D', '{r} × 1000 × {D}', { r: R.minSteelRatio, D }, (v) => v.r * 1000 * v.D, { unit: 'mm²', dp: 0, ref: `${STD.is456} cl. 34.5.1 (as for solid slabs) and cl. 26.5.2.1 (0.12 % for high-strength deformed bars)`, ...ex(det.minAst) })
  const astOf = (label: string, M: number, B: number, dEff: number, expectV: number) => {
    const fb = (v: Record<string, number>) => Math.max(v.m, astSingly((v.M / v.B) * 1e6, 1000, v.d, v.f) ?? ((v.M / v.B) * 1e6) / (0.87 * FY * 0.85 * v.d))
    return L.calc(
      label,
      'Ast = max(Ast,min ; (0.5 fck ÷ fy) (1 − √(1 − 4.6 Mu ÷ (fck b d²))) b d)',
      'max({m}; 0.5 × {f} ÷ 500 × (1 − √(1 − 4.6 × {M} ÷ {B} × 10^6 ÷ ({f} × 1000 × {d}²))) × 1000 × {d})',
      { m: minAst, f: fck, M, B, d: dEff },
      fb,
      { unit: 'mm²/m', dp: 0, ref: `${REF_FLEX}; ${REF_MOMENT}`, note: 'Moment per metre width = M ÷ footing width; the whole width carries bars (cl. 34.3.1)', ...ex(expectV) }
    )
  }
  const aX = astOf('Steel per metre, bars along Lf', mx, Bf, dX, det.astX)
  const aY = astOf('Steel per metre, bars along Bf', my, Lf, dY, det.astY)
  const pickTrace = (ast: number, d: number) => {
    const sMax = Math.min(R.spacingCap, 3 * d)
    const tried: string[] = []
    for (const phi of R.barPhis) {
      const s = Math.floor((barArea(phi) * 1000) / ast / R.spacingStep) * R.spacingStep
      tried.push(`${phi} mm: ${s} mm`)
      if (s >= R.spacingMin) return { phi, s: Math.min(s, sMax), tried, sMax }
    }
    return { phi: 20, s: 100, tried, sMax }
  }
  const mX = pickTrace(aX, dX)
  const mY = pickTrace(aY, dY)
  check(L, 'Footing bars along Lf: size', mX.phi, det.mX.phi, 0)
  check(L, 'Footing bars along Lf: spacing', mX.s, det.mX.s, 0)
  check(L, 'Footing bars along Bf: size', mY.phi, det.mY.phi, 0)
  check(L, 'Footing bars along Bf: spacing', mY.s, det.mY.s, 0)
  const pm = pickMatBars(aX, dX)
  check(L, 'Footing mat pick agrees with the model', pm.phi * 1000 + pm.s, det.mX.phi * 1000 + det.mX.s, 0)
  L.pick('Bars along Lf', `sizes tried in turn (${R.barPhis.join(', ')} mm): spacing = largest multiple of 25 mm not over A ÷ Ast, the first of at least ${R.spacingMin} mm, and not over min(${R.spacingCap} ; 3d)`, `${mX.phi} mm at ${mX.s} mm (spacing found: ${mX.tried.join('; ')}; cap ${d0(mX.sMax)} mm)`, `${STD.is456} cl. 26.3.3 allows up to 3d or 300 mm; ${STD.rule} (150 mm cap)`)
  L.pick('Bars along Bf', 'same rule', `${mY.phi} mm at ${mY.s} mm (spacing found: ${mY.tried.join('; ')}; cap ${d0(mY.sMax)} mm)`, `${STD.is456} cl. 26.3.3; ${STD.rule}`)
  blocks.push(takeBlock(L, 'found-steel', 'Overall depth and bars'))

  // ---- bars, concrete, formwork
  const nX = L.calc('Number of bars along Lf', 'n = floor((Bf − 0.1) ÷ s) + 1', 'floor(({B} × 1000 − {e}) ÷ {s}) + 1', { B: Bf, e: R.endAllowanceMm, s: mX.s }, (v) => Math.floor((v.B * 1000 - v.e) / v.s) + 1, { dp: 0, ref: STD.rule, note: '50 mm kept clear at each side', expect: det.nX, tol: 0 })
  const lX = L.calc('Length of each bar along Lf', 'L = Lf − 0.1', '{L} × 1000 − {e}', { L: Lf, e: R.endAllowanceMm }, (v) => v.L * 1000 - v.e, { unit: 'mm', dp: 0, ref: `${STD.rule}; ${STD.is2502} cl. 5.1.1 for the cutting length (up to the next 25 mm)`, ...ex(det.lenX) })
  const kX = L.calc('Weight of the bars along Lf', 'W = n × L (up to 25 mm) × φ² ÷ 162.2', '{n} × ceil({l} ÷ 25) × 25 ÷ 1000 × {p}² ÷ 162.2', { n: nX, l: lX, p: mX.phi }, (v) => barKg(v.p, v.l, v.n), { unit: 'kg', dp: 2, ref: `${STD.is1786} (mass per metre = φ² ÷ 162.2); ${STD.is2502} cl. 5.1.1`, note: stepNote(lX) })
  const nY = L.calc('Number of bars along Bf', 'n = floor((Lf − 0.1) ÷ s) + 1', 'floor(({L} × 1000 − {e}) ÷ {s}) + 1', { L: Lf, e: R.endAllowanceMm, s: mY.s }, (v) => Math.floor((v.L * 1000 - v.e) / v.s) + 1, { dp: 0, ref: STD.rule, expect: det.nY, tol: 0 })
  const lY = L.calc('Length of each bar along Bf', 'L = Bf − 0.1', '{B} × 1000 − {e}', { B: Bf, e: R.endAllowanceMm }, (v) => v.B * 1000 - v.e, { unit: 'mm', dp: 0, ref: STD.rule, ...ex(det.lenY) })
  const kY = L.calc('Weight of the bars along Bf', 'W = n × L (up to 25 mm) × φ² ÷ 162.2', '{n} × ceil({l} ÷ 25) × 25 ÷ 1000 × {p}² ÷ 162.2', { n: nY, l: lY, p: mY.phi }, (v) => barKg(v.p, v.l, v.n), { unit: 'kg', dp: 2, ref: `${STD.is1786}; ${STD.is2502} cl. 5.1.1`, note: stepNote(lY) })
  L.calc('Steel in the footing', 'sum of the two layers', '{a} + {b}', { a: kX, b: kY }, (v) => v.a + v.b, { unit: 'kg', dp: 2, ref: STD.rule, ...ex(fr.steelKg) })
  const A1 = L.calc('Plan area of the base', 'A1 = Lf × Bf', '{L} × {B}', { L: Lf, B: Bf }, (v) => v.L * v.B, { unit: 'm²', dp: 3, ref: STD.rule, ...ex(det.A1) })
  const A2 = L.calc('Plan area of the pedestal on top', 'A2 = (b + 0.2)(D + 0.2)', '({b} ÷ 1000 + {e}) × ({D} ÷ 1000 + {e})', { b: inp.colB, D: inp.colD, e: R.pedestalExtraM }, (v) => (v.b / 1000 + v.e) * (v.D / 1000 + v.e), { unit: 'm²', dp: 3, ref: `${STD.rule}: the column plus 100 mm on each side`, ...ex(det.A2) })
  const h = L.calc('Height of the sloping part', 'h = (D − 150) ÷ 1000', '({D} − {e}) ÷ 1000', { D, e: R.edgeMm }, (v) => (v.D - v.e) / 1000, { unit: 'm', dp: 3, ref: `${STD.is456} cl. 34.1.2 (150 mm edge)`, ...ex(det.h) })
  L.calc('Concrete in the footing', 'V = A1 × 0.15 + (h ÷ 3)(A1 + A2 + √(A1 A2))', '{a} × {e} + ({h} ÷ 3) × ({a} + {b} + √({a} × {b}))', { a: A1, b: A2, h, e: R.edgeMm / 1000 }, (v) => v.a * v.e + (v.h / 3) * (v.a + v.b + Math.sqrt(v.a * v.b)), { unit: 'm³', dp: 3, ref: `${STD.rule}: a 150 mm edge slab with a sloping top rising to the pedestal (volume of a frustum)`, ...ex(fr.concreteM3) })
  L.calc('Shuttering of the footing', 'S = 2 (Lf + Bf) × 0.15', '2 × ({L} + {B}) × {e}', { L: Lf, B: Bf, e: R.edgeMm / 1000 }, (v) => 2 * (v.L + v.B) * v.e, { unit: 'm²', dp: 3, ref: `${STD.rule}: the vertical edge only; the sloping top is cast against a template, not shuttered`, ...ex(fr.formworkM2) })
  L.calc('Lean concrete under the footing (M7.5)', 'V = (Lf + 0.2)(Bf + 0.2) × 0.1', '({L} + {p}) × ({B} + {p}) × {t}', { L: Lf, B: Bf, p: R.pccProjectionM, t: R.pccThicknessM }, (v) => (v.L + v.p) * (v.B + v.p) * v.t, { unit: 'm³', dp: 3, ref: `${STD.rule}: 100 mm thick, 100 mm wider than the footing on each side`, ...ex(fr.pccM3) })
  blocks.push(takeBlock(L, 'found-qty', 'Bars, concrete and shuttering of this footing'))
  return blocks
}

function raftBlocks(c: CalcCtx): CalcBlock[] {
  const { L, work } = c
  const a = work.analysis
  const rf = a.raft!
  const det = rf.detail
  const inp = det.input
  const fck = work.fckBelow
  const blocks: CalcBlock[] = []
  const proj = R.raftProjectionM
  L.value('Concrete grade of the raft', fck, 'N/mm²', 0, `${STD.is456} Table 5`, work.gradeBelow)
  const sumPu = L.calc('Total factored load of the ground-storey columns', 'ΣPu', 'sum of 1.5 × (Pdl + Pll) over the {n} columns = {s}', { n: a.fcDesigns.length, s: a.fcDesigns.reduce((s, x) => s + 1.5 * (x.ld.Pdl + x.ld.Pll), 0) }, (v) => v.s, { unit: 'kN', dp: 0, ref: `${STD.is456} Table 18; Section 7`, ...ex(inp.totalPuKN) })
  const maxPu = L.calc('Largest factored column load', 'Pu,max', 'largest 1.5 × (Pdl + Pll) = {s}', { s: a.fcDesigns.reduce((m, x) => Math.max(m, 1.5 * (x.ld.Pdl + x.ld.Pll)), 0) }, (v) => v.s, { unit: 'kN', dp: 0, ref: STD.rule, ...ex(inp.maxColPuKN) })
  const colMin = L.calc('Smallest column side', 'c', 'smallest side of any ground-storey column = {s}', { s: a.fcDesigns.reduce((m, x) => Math.min(m, x.d.b, x.d.D), 1e9) }, (v) => v.s, { unit: 'mm', dp: 0, ref: STD.rule, note: 'Used as a square column for the punching test', ...ex(inp.colMin) })
  const Lr = L.calc('Length of the raft', 'L = nx × sx + 2 × 0.3', '{n} × {s} + 2 × {p}', { n: work.plan.floors[0].nx, s: work.plan.sx, p: proj }, (v) => v.n * v.s + 2 * v.p, { unit: 'm', dp: 2, ref: `${STD.rule}: the raft projects 0.3 m beyond the outer columns`, ...ex(det.lengthM) })
  const Wr = L.calc('Width of the raft', 'W = ny × sy + 2 × 0.3', '{n} × {s} + 2 × {p}', { n: work.plan.floors[0].ny, s: work.plan.sy, p: proj }, (v) => v.n * v.s + 2 * v.p, { unit: 'm', dp: 2, ref: STD.rule, ...ex(det.widthM) })
  const area = L.calc('Area of the raft', 'A = L × W', '{l} × {w}', { l: Lr, w: Wr }, (v) => v.l * v.w, { unit: 'm²', dp: 2, ref: STD.rule, ...ex(det.area) })
  const qu = L.calc('Upward pressure under the factored load', 'qu = ΣPu ÷ A', '{p} ÷ {a}', { p: sumPu, a: area }, (v) => v.p / v.a, { unit: 'kN/m²', dp: 1, ref: STD.rule, ...ex(det.qu) })
  const bearing = L.calc('Pressure on the ground under the service loads', 'q = 1.1 ΣP ÷ A', '{f} × {s} ÷ {a}', { f: R.selfWeightFactor, s: a.fcDesigns.reduce((s, x) => s + x.ld.Pdl + x.ld.Pll, 0), a: area }, (v) => (v.f * v.s) / v.a, { unit: 'kN/m²', dp: 1, ref: `${STD.is456} cl. 34.1; ${STD.is1904}`, note: `Compared with the assumed bearing capacity of ${d0(work.site.sbc)} kN/m². The model does not size the raft on this pressure; it takes the thickness from punching shear. Read this line as a warning if it is above the capacity.` })
  void bearing
  blocks.push(takeBlock(L, 'raft-load', 'The raft and its load', { intro: 'The raft is a planning figure only. It is worked as an upside-down flat slab on the column grid, which the engineer must replace with a proper analysis on a soil test.' }))

  const trials = det.trials
  trials.forEach((t) => {
    const d = t.t - R.raftCoverMm
    const vp = maxPu - (qu * Math.pow(colMin + d, 2)) / 1e6
    const bo = 4 * (colMin + d)
    check(L, `Raft trial t = ${t.t}: punching stress`, (vp * 1000) / (bo * d), t.tp)
  })
  const shown = trials.length <= 5 ? trials : [trials[0], ...trials.slice(-3)]
  blocks.push(
    tableBlock('raft-trials', 'Search for the thickness', table(['t (mm)', 'd (mm)', 'Punching force (kN)', 'Perimeter (mm)', 'Punching stress (N/mm²)', 'Result'], shown.map((t) => [d0(t.t), d0(t.d), d0(t.vp), d0(t.bo), d3(t.tp), t.ok ? 'passes' : 'fails']), { num: [0, 1, 2, 3, 4] }), {
      intro: `The thickness starts at ${R.raftTStart} mm and goes up in steps of ${R.raftTStep} mm until the punching stress at the heaviest column is within 0.25 √fck = ${d3(det.tpAllow)} N/mm² (the shape factor is taken as 1).${trials.length > shown.length ? ' The first and the last three trials are shown.' : ''}`,
    })
  )
  const tm = det.trials[det.trials.length - 1]
  const tpa = L.calc('Punching stress allowed', '0.25 √fck', '0.25 × √{f}', { f: fck }, (v) => 0.25 * Math.sqrt(v.f), { unit: 'N/mm²', dp: 3, ref: `${STD.is456} cl. 31.6.3.1 with ks = 1`, ...ex(det.tpAllow) })
  const t = tm.t
  const d = L.calc('Effective depth', 'd = t − 75', '{t} − {c}', { t, c: R.raftCoverMm }, (v) => v.t - v.c, { unit: 'mm', dp: 0, ref: `${STD.is456} cl. 26.4.2.2 (cover 50 mm) with the bar allowance; ${STD.rule}`, ...ex(det.d) })
  const vp = L.calc('Punching force at the heaviest column', 'Vp = Pu,max − qu (c + d)²', '{P} − {q} × ({c} + {d})² ÷ 10^6', { P: maxPu, q: qu, c: colMin, d }, (v) => v.P - (v.q * Math.pow(v.c + v.d, 2)) / 1e6, { unit: 'kN', dp: 0, ref: STD.rule, ...ex(tm.vp) })
  const bo = L.calc('Punching perimeter', 'bo = 4 (c + d)', '4 × ({c} + {d})', { c: colMin, d }, (v) => 4 * (v.c + v.d), { unit: 'mm', dp: 0, ref: STD.rule, ...ex(tm.bo) })
  const tp = L.calc('Punching stress', 'τp = Vp ÷ (bo × d)', '{V} × 1000 ÷ ({b} × {d})', { V: vp, b: bo, d }, (v) => (v.V * 1000) / (v.b * v.d), { unit: 'N/mm²', dp: 3, ref: `${STD.is456} cl. 31.6.3.1`, ...ex(tm.tp) })
  L.pick('Punching test', 'τp ≤ allowed', tp <= tpa ? `Pass at t = ${d0(t)} mm` : `Not met at the deepest trial, t = ${d0(t)} mm`, STD.rule)
  const tRes = L.calc('Thickness of the raft', 't = first trial that passes', '{t}', { t }, (v) => v.t, { unit: 'mm', dp: 0, ref: STD.rule, ...ex(rf.tMm) })
  const M = L.calc('Design moment per metre in each direction', 'M = qu × lmax² ÷ 10', '{q} × {l}² ÷ {k}', { q: qu, l: inp.maxSpan, k: R.raftMomentDivisor }, (v) => (v.q * v.l * v.l) / v.k, { unit: 'kN·m/m', dp: 1, ref: `${STD.rule}: the coefficient 1/10 for a continuous slab; no frame or soil-spring analysis is made`, ...ex(det.M) })
  const minAst = L.calc('Minimum steel per metre', 'Ast,min = 0.0012 × 1000 × t', '{r} × 1000 × {t}', { r: R.minSteelRatio, t: tRes }, (v) => v.r * 1000 * v.t, { unit: 'mm²', dp: 0, ref: `${STD.is456} cl. 34.5.1 and cl. 26.5.2.1`, ...ex(det.minAst) })
  const ast = L.calc(
    'Steel per metre',
    'Ast = max(Ast,min ; flexure)',
    'max({m}; 0.5 × {f} ÷ 500 × (1 − √(1 − 4.6 × {M} × 10^6 ÷ ({f} × 1000 × {d}²))) × 1000 × {d})',
    { m: minAst, f: fck, M, d },
    (v) => Math.max(v.m, astSingly(v.M * 1e6, 1000, v.d, v.f) ?? (v.M * 1e6) / (0.87 * FY * 0.85 * v.d)),
    { unit: 'mm²/m', dp: 0, ref: REF_FLEX, ...ex(det.ast) }
  )
  const sMax = Math.min(R.spacingCap, 3 * d)
  const tried: string[] = []
  let mat = { phi: 20, s: 100 }
  for (const phi of R.barPhis) {
    const s = Math.floor((barArea(phi) * 1000) / ast / R.spacingStep) * R.spacingStep
    tried.push(`${phi} mm: ${s} mm`)
    if (s >= R.spacingMin) {
      mat = { phi, s: Math.min(s, sMax) }
      break
    }
  }
  check(L, 'Raft bars: size', mat.phi, det.mat.phi, 0)
  check(L, 'Raft bars: spacing', mat.s, det.mat.s, 0)
  L.pick('Bars in each of the four layers (top and bottom, both ways)', `sizes tried in turn; spacing as for the footings, capped at min(${R.spacingCap} ; 3d)`, `${mat.phi} mm at ${mat.s} mm (spacing found: ${tried.join('; ')})`, `${STD.rule}; ${STD.is456} cl. 26.3.3 allows up to 3d or 300 mm`)
  const nL = L.calc('Bars along the length (two layers)', 'n = 2 (floor((W − 0.1) ÷ s) + 1)', '2 × (floor(({w} × 1000 − {e}) ÷ {s}) + 1)', { w: Wr, e: R.endAllowanceMm, s: mat.s }, (v) => 2 * (Math.floor((v.w * 1000 - v.e) / v.s) + 1), { dp: 0, ref: STD.rule, expect: det.nAlongL, tol: 0 })
  const nW = L.calc('Bars along the width (two layers)', 'n = 2 (floor((L − 0.1) ÷ s) + 1)', '2 × (floor(({l} × 1000 − {e}) ÷ {s}) + 1)', { l: Lr, e: R.endAllowanceMm, s: mat.s }, (v) => 2 * (Math.floor((v.l * 1000 - v.e) / v.s) + 1), { dp: 0, ref: STD.rule, expect: det.nAlongW, tol: 0 })
  const kL = L.calc('Weight of the bars along the length', 'W = n × (L − 0.1) × φ² ÷ 162.2', '{n} × ceil(({l} × 1000 − {e}) ÷ 25) × 25 ÷ 1000 × {p}² ÷ 162.2', { n: nL, l: Lr, e: R.endAllowanceMm, p: mat.phi }, (v) => barKg(v.p, v.l * 1000 - v.e, v.n), { unit: 'kg', dp: 1, ref: `${STD.is1786}; ${STD.is2502} cl. 5.1.1`, note: stepNote(Lr * 1000 - R.endAllowanceMm) })
  const kW = L.calc('Weight of the bars along the width', 'W = n × (W − 0.1) × φ² ÷ 162.2', '{n} × ceil(({w} × 1000 − {e}) ÷ 25) × 25 ÷ 1000 × {p}² ÷ 162.2', { n: nW, w: Wr, e: R.endAllowanceMm, p: mat.phi }, (v) => barKg(v.p, v.w * 1000 - v.e, v.n), { unit: 'kg', dp: 1, ref: `${STD.is1786}; ${STD.is2502} cl. 5.1.1`, note: stepNote(Wr * 1000 - R.endAllowanceMm) })
  const nC = L.calc('Chairs between the layers', 'one per m², rounded up', 'ceil({a})', { a: area }, (v) => Math.ceil(v.a), { dp: 0, ref: `${STD.rule}: 12 mm bars, 2 t long`, expect: det.chairs, tol: 0 })
  const kC = L.calc('Weight of the chairs', 'W = n × 2t × φ² ÷ 162.2', '{n} × ceil(2 × {t} ÷ 25) × 25 ÷ 1000 × {p}² ÷ 162.2', { n: nC, t: tRes, p: R.raftChairPhi }, (v) => barKg(v.p, 2 * v.t, v.n), { unit: 'kg', dp: 1, ref: `${STD.is1786}; ${STD.is2502} cl. 5.1.1` })
  L.calc('Steel in the raft', 'sum', '{a} + {b} + {c}', { a: kL, b: kW, c: kC }, (v) => v.a + v.b + v.c, { unit: 'kg', dp: 1, ref: STD.rule, ...ex(rf.steelKg) })
  L.calc('Concrete in the raft', 'V = A × t', '{a} × {t} ÷ 1000', { a: area, t: tRes }, (v) => (v.a * v.t) / 1000, { unit: 'm³', dp: 2, ref: STD.rule, ...ex(rf.concreteM3) })
  L.calc('Shuttering of the raft', 'S = 2 (L + W) × t', '2 × ({l} + {w}) × {t} ÷ 1000', { l: Lr, w: Wr, t: tRes }, (v) => (2 * (v.l + v.w) * v.t) / 1000, { unit: 'm²', dp: 2, ref: `${STD.rule}: the edge of the raft`, ...ex(rf.formworkM2) })
  L.calc('Lean concrete under the raft (M7.5)', 'V = (L + 0.2)(W + 0.2) × 0.1', '({l} + {p}) × ({w} + {p}) × {t}', { l: Lr, w: Wr, p: R.pccProjectionM, t: R.pccThicknessM }, (v) => (v.l + v.p) * (v.w + v.p) * v.t, { unit: 'm³', dp: 2, ref: STD.rule, ...ex(rf.pccM3) })
  blocks.push(takeBlock(L, 'raft-design', `The raft: thickness, bars and quantities`))
  return blocks
}

function scheduleBlocks(c: CalcCtx): CalcBlock[] {
  const { L, work } = c
  const a = work.analysis
  const parts = work.parts
  const blocks: CalcBlock[] = []
  const rows = [...a.footings.entries()].map(([key, fr]) => {
    const [ix, iy] = key.split(':').map(Number)
    const col = a.fcDesigns.find((f) => f.ix === ix && f.iy === iy)!
    const q = footingQty(fr)
    check(L, `Footing ${key}: concrete`, q.concrete, fr.concreteM3)
    check(L, `Footing ${key}: shuttering`, q.formwork, fr.formworkM2)
    check(L, `Footing ${key}: lean concrete`, q.pcc, fr.pccM3)
    check(L, `Footing ${key}: steel`, q.steel, fr.steelKg)
    return { fr, col, q, Pu: 1.5 * (col.ld.Pdl + col.ld.Pll) }
  })
  const groups = groupBy(rows, (r) => `${r.fr.detail.input.colB}x${r.fr.detail.input.colD}|${r.fr.Lf}|${r.fr.Bf}|${r.fr.depth}|${r.fr.bars}`)
  const tRows: string[][] = []
  groups.forEach((g, i) => {
    const r0 = g.items[0]
    const n = g.items.length
    const pu = g.items.map((x) => x.Pu)
    const puTxt = Math.min(...pu) === Math.max(...pu) ? d0(pu[0]) : `${d0(Math.min(...pu))} to ${d0(Math.max(...pu))}`
    tRows.push([`F${i + 1}`, d0(n), `${r0.fr.detail.input.colB} × ${r0.fr.detail.input.colD}`, puTxt, `${d2(r0.fr.Lf)} × ${d2(r0.fr.Bf)}`, d0(r0.fr.depth), r0.fr.bars, d2(n * r0.q.concrete), d2(n * r0.q.formwork), d1(n * r0.q.steel)])
  })
  const totC = sumOf(rows.map((r) => r.q.concrete))
  const totF = sumOf(rows.map((r) => r.q.formwork))
  const totS = sumOf(rows.map((r) => r.q.steel))
  const totP = sumOf(rows.map((r) => r.q.pcc))
  blocks.push(
    tableBlock(
      'found-schedule',
      'Footing schedule',
      table(['Mark', 'No.', 'Column (mm)', 'Pu (kN)', 'Lf × Bf (m)', 'Depth (mm)', 'Bars (along Lf, along Bf)', 'Concrete (m³)', 'Shuttering (m²)', 'Steel (kg)'], tRows, {
        num: [1, 3, 5, 7, 8, 9],
        foot: ['Total', d0(rows.length), '', '', '', '', '', d2(totC), d2(totF), d1(totS)],
      }),
      { intro: 'Footings with the same column, size, depth and bars are one mark. Each mark is worked the way the footing above is; its concrete, shuttering and steel are the number of footings times the figure of one.' }
    )
  )
  const dep = work.site.depth
  const fr0 = work.plan.floors[0]
  const pitSum = sumOf(rows.map((r) => r.q.pit))
  put(L, 'footing.concrete', totC)
  put(L, 'footing.form', totF)
  put(L, 'footing.steel', totS)
  put(L, 'footing.pcc', totP)
  put(L, 'footing.count', rows.length)
  L.calc('Concrete in the footings', 'Σ concrete of the marks', 'total of the table column = {s}', { s: totC }, (v) => v.s, { unit: 'm³', dp: 2, ref: STD.rule, ...ex(parts.footVol), result: true })
  L.calc('Shuttering of the footings', 'Σ shuttering of the marks', 'total of the table column = {s}', { s: totF }, (v) => v.s, { unit: 'm²', dp: 2, ref: STD.rule, ...ex(parts.footForm), result: true })
  L.calc('Steel in the footings', 'Σ steel of the marks', 'total of the table column = {s}', { s: totS }, (v) => v.s, { unit: 'kg', dp: 1, ref: STD.rule, ...ex(parts.steel.footing), result: true })
  L.calc('Lean concrete under the footings (M7.5)', 'Σ (Lf + 0.2)(Bf + 0.2) × 0.1', 'total over the {n} footings = {s}', { n: rows.length, s: totP }, (v) => v.s, { unit: 'm³', dp: 2, ref: STD.rule, ...ex(parts.pcc), result: true })
  const pitAll = L.calc('Pits, one by one', 'Σ (Lf + 1.4)(Bf + 1.4) × depth', 'sum of (Lf + 1.4) × (Bf + 1.4) over the footings = {s}, times {d} m', { s: pitSum, d: dep }, (v) => v.s * v.d, { unit: 'm³', dp: 1, ref: `${STD.rule}: 0.7 m of working space all round each footing` })
  const mat = L.calc('One pit under the whole plan', '(nx × sx + 1.4)(ny × sy + 1.4) × depth', '({a} × {s} + 1.4) × ({b} × {t} + 1.4) × {d}', { a: fr0.nx, s: work.plan.sx, b: fr0.ny, t: work.plan.sy, d: dep }, (v) => (v.a * v.s + R.raftPitFringeM) * (v.b * v.t + R.raftPitFringeM) * v.d, { unit: 'm³', dp: 1, ref: `${STD.rule}: when the footings are close, the pits merge and the whole plan is dug once` })
  const pits = L.calc('Excavation', 'the smaller of the two', 'min({a}; {b})', { a: pitAll, b: mat }, (v) => Math.min(v.a, v.b), { unit: 'm³', dp: 1, ref: STD.rule, ...ex(parts.pits), result: true })
  put(L, 'footing.pits', pits)
  blocks.push(takeBlock(L, 'found-totals', 'Footing totals and excavation'))
  return blocks
}

function raftTotals(c: CalcCtx): CalcBlock {
  const { L, work } = c
  const rf = work.analysis.raft!
  const parts = work.parts
  const dep = work.site.depth
  put(L, 'footing.concrete', rf.concreteM3)
  put(L, 'footing.form', rf.formworkM2)
  put(L, 'footing.steel', rf.steelKg)
  put(L, 'footing.pcc', rf.pccM3)
  put(L, 'footing.count', 1)
  L.calc('Concrete in the raft', 'from the working above', '{s}', { s: rf.concreteM3 }, (v) => v.s, { unit: 'm³', dp: 2, ref: STD.rule, ...ex(parts.footVol), result: true })
  L.calc('Shuttering of the raft', 'from the working above', '{s}', { s: rf.formworkM2 }, (v) => v.s, { unit: 'm²', dp: 2, ref: STD.rule, ...ex(parts.footForm), result: true })
  L.calc('Steel in the raft', 'from the working above', '{s}', { s: rf.steelKg }, (v) => v.s, { unit: 'kg', dp: 1, ref: STD.rule, ...ex(parts.steel.footing), result: true })
  L.calc('Lean concrete under the raft (M7.5)', 'from the working above', '{s}', { s: rf.pccM3 }, (v) => v.s, { unit: 'm³', dp: 2, ref: STD.rule, ...ex(parts.pcc), result: true })
  const pits = L.calc('Excavation', '(x1 − x0 + 1.4)(y1 − y0 + 1.4) × depth', '({a} − ({b}) + {f}) × ({c} − ({d}) + {f}) × {h}', { a: rf.x1, b: rf.x0, c: rf.y1, d: rf.y0, f: R.raftPitFringeM, h: dep }, (v) => (v.a - v.b + v.f) * (v.c - v.d + v.f) * v.h, { unit: 'm³', dp: 1, ref: `${STD.rule}: 0.7 m of working space all round`, ...ex(parts.pits), result: true })
  put(L, 'footing.pits', pits)
  return takeBlock(L, 'found-totals', 'Raft totals and excavation')
}

function plinthBlocks(c: CalcCtx): CalcBlock[] {
  const { L, work } = c
  const a = work.analysis
  const p = a.plinth
  const blocks: CalcBlock[] = []
  const bw = p.widthMm
  const set = p.sets
  L.value('Plinth beam width', bw, 'mm', 0, `${STD.rule}: the width of the floor beams (Section 3)`)
  L.pick('Depth', `${PLINTH_RULES.deepD} mm if the span is over ${PLINTH_RULES.deepSpanM} m, else ${PLINTH_RULES.shallowD} mm`, `${PLINTH_RULES.shallowD} or ${PLINTH_RULES.deepD} mm`, `${STD.assume}: site practice`)
  L.pick('Bars', `${PLINTH_RULES.barsPerSet} bars of ${p.barPhi} mm per set, links of ${p.linkPhi} mm at ${PLINTH_RULES.linkPitchMm} mm`, `${PLINTH_RULES.barsPerSet}-${p.barPhi} with ${p.linkPhi} mm links at ${PLINTH_RULES.linkPitchMm} mm`, `${STD.assume}: site practice`, work.ctx.seismic ? `${p.linkPhi} mm links in Zones III and above, 6 mm in Zone II` : '6 mm links in Zone II')
  L.pick('Sets of beams', work.ctx.zone === 'IV' || work.ctx.zone === 'V' ? 'Zones IV and V: a second set as footing ties' : 'one set', `${set}`, `${STD.is1893} cl. 7.12.1: in Zones IV and V individual spread footings are tied together`, set === 2 ? 'The model adds a second set of plinth-size beams for the ties and counts it in full. The code also asks the ties to carry an axial force of Ah ÷ 4 times the larger column load; the model does not check that force.' : undefined)
  blocks.push(takeBlock(L, 'plinth-rules', 'Plinth beams: the rules used'))

  const per = p.lines.map((ln) => {
    const conc = (bw / 1000) * (ln.D / 1000) * ln.clear
    const form = (bw / 1000 + (2 * ln.D) / 1000) * ln.clear
    const n = Math.ceil((ln.clear * 1000) / PLINTH_RULES.linkPitchMm) + 1
    const links = barKg(p.linkPhi, stirrupCutLength(bw - 50, ln.D - 50, p.linkPhi), n)
    const bars = barKg(p.barPhi, ln.L * 1000, PLINTH_RULES.barsPerSet)
    return { ln, conc, form, n, links, bars, kg: bars + links }
  })
  const gov = per.reduce((best, x) => (x.ln.D > best.ln.D || (x.ln.D === best.ln.D && x.ln.L > best.ln.L) ? x : best), per[0])
  const g = gov.ln
  const clear = L.calc('Clear length of the beam (worked beam: the longest)', 'Lc = L − column side ÷ 1000', '{L} − {c} ÷ 1000', { L: g.L, c: g.along }, (v) => v.L - v.c / 1000, { unit: 'm', dp: 3, ref: STD.rule, note: `Span ${d2(g.L)} m between column centres, column ${g.along} mm along the beam`, ...ex(g.clear) })
  const conc = L.calc('Concrete in the beam', 'V = b × D × Lc', '{b} ÷ 1000 × {D} ÷ 1000 × {l}', { b: bw, D: g.D, l: clear }, (v) => (v.b / 1000) * (v.D / 1000) * v.l, { unit: 'm³', dp: 4, ref: STD.rule, expect: gov.conc, tol: 1e-9 })
  const form = L.calc('Shuttering of the beam', 'S = (b + 2D) × Lc', '({b} ÷ 1000 + 2 × {D} ÷ 1000) × {l}', { b: bw, D: g.D, l: clear }, (v) => (v.b / 1000 + (2 * v.D) / 1000) * v.l, { unit: 'm²', dp: 3, ref: `${STD.rule}: two sides and the soffit`, expect: gov.form, tol: 1e-9 })
  const kgBars = L.calc('Weight of the bars', `W = ${PLINTH_RULES.barsPerSet} × L × φ² ÷ 162.2`, '{n} × ceil({L} ÷ 25) × 25 ÷ 1000 × {p}² ÷ 162.2', { n: PLINTH_RULES.barsPerSet, L: g.L * 1000, p: p.barPhi }, (v) => barKg(v.p, v.L, v.n), { unit: 'kg', dp: 2, ref: `${STD.is1786}; ${STD.is2502} cl. 5.1.1`, note: 'Bars run the full span between column centres' })
  const stir = L.calc('Cut length of one link', 'Ls = 2 (A + E) + 12φ (+ tails of a small bar)', '2 × (({b} − 50) + ({D} − 50)) + 12 × {p} + 2 × max(0; 75 − 10 × {p})', { b: bw, D: g.D, p: p.linkPhi }, (v) => stirrupCutLength(v.b - 50, v.D - 50, v.p), { unit: 'mm', dp: 0, ref: `${STD.rule}: the cut length of a closed link with 135° hooks, 25 mm cover, derived from the bar's geometry (see Section 11)` })
  const nL = L.calc('Number of links', 'n = ceil(Lc ÷ 150) + 1', 'ceil({l} × 1000 ÷ {s}) + 1', { l: clear, s: PLINTH_RULES.linkPitchMm }, (v) => Math.ceil((v.l * 1000) / v.s) + 1, { dp: 0, ref: STD.rule, expect: gov.n, tol: 0 })
  const kgLinks = L.calc('Weight of the links', 'W = n × Ls × φ² ÷ 162.2', '{n} × ceil({s} ÷ 25) × 25 ÷ 1000 × {p}² ÷ 162.2', { n: nL, s: stir, p: p.linkPhi }, (v) => barKg(v.p, v.s, v.n), { unit: 'kg', dp: 2, ref: `${STD.is1786}; ${STD.is2502} cl. 5.1.1` })
  L.calc('Steel in the beam', 'bars + links', '{a} + {b}', { a: kgBars, b: kgLinks }, (v) => v.a + v.b, { unit: 'kg', dp: 2, ref: STD.rule, expect: gov.kg, tol: 1e-9 })
  void conc
  void form
  blocks.push(takeBlock(L, 'plinth-worked', `Plinth beam worked: ${g.dir === 'x' ? 'along the length' : 'along the width'}, span ${d2(g.L)} m, ${g.D} mm deep`))

  const groups = groupBy(per, (x) => `${x.ln.L}|${x.ln.D}|${x.ln.along}`)
  const rows = groups.map((gr) => {
    const x = gr.items[0]
    const n = gr.items.length * set
    return [d0(n), d2(x.ln.L), d3(x.ln.clear), d0(x.ln.D), d3(x.conc), d3(x.form), d1(x.kg), d2(n * x.conc), d2(n * x.form), d1(n * x.kg)]
  })
  const totC = sumOf(per.map((x) => x.conc)) * set
  const totF = sumOf(per.map((x) => x.form)) * set
  const totS = sumOf(per.map((x) => x.kg)) * set
  const totN = per.length * set
  blocks.push(
    tableBlock('plinth-table', 'Plinth beams: schedule', table(['No.', 'Span (m)', 'Clear (m)', 'Depth (mm)', 'Concrete each (m³)', 'Shuttering each (m²)', 'Steel each (kg)', 'Concrete (m³)', 'Shuttering (m²)', 'Steel (kg)'], rows, { num: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], foot: [d0(totN), '', '', '', '', '', '', d2(totC), d2(totF), d1(totS)] }), {
      intro: `Beams along the length and the width are listed together when span, depth and column size agree. ${set === 2 ? 'The number includes the second set of beams (the footing ties).' : ''}`,
    })
  )
  put(L, 'plinth.concrete', totC)
  put(L, 'plinth.form', totF)
  put(L, 'plinth.steel', totS)
  put(L, 'plinth.count', totN)
  L.calc('Concrete in the plinth beams', 'Σ over the beams', 'total of the table column = {s}', { s: totC }, (v) => v.s, { unit: 'm³', dp: 2, ref: STD.rule, ...ex(p.concrete), result: true })
  L.calc('Shuttering of the plinth beams', 'Σ over the beams', 'total of the table column = {s}', { s: totF }, (v) => v.s, { unit: 'm²', dp: 2, ref: STD.rule, ...ex(p.formwork), result: true })
  L.calc('Steel in the plinth beams', 'Σ over the beams', 'total of the table column = {s}', { s: totS }, (v) => v.s, { unit: 'kg', dp: 1, ref: STD.rule, ...ex(work.parts.steel.plinth), result: true })
  L.calc('Number of plinth beams', 'lines × sets', '{n} × {s}', { n: per.length, s: set }, (v) => v.n * v.s, { dp: 0, ref: STD.rule, expect: p.count, tol: 0, result: true })
  blocks.push(takeBlock(L, 'plinth-totals', 'Plinth beam totals'))
  return blocks
}

export function foundationSection(c: CalcCtx): CalcSection {
  const { work } = c
  const a = work.analysis
  const blocks: CalcBlock[] = [typeBlock(c)]
  if (a.raft) {
    blocks.push(...raftBlocks(c))
    blocks.push(raftTotals(c))
  } else {
    const worked = [...a.footings.entries()]
      .map(([key, fr]) => {
        const [ix, iy] = key.split(':').map(Number)
        const col = a.fcDesigns.find((f) => f.ix === ix && f.iy === iy)!
        return { key, fr, col, Pu: 1.5 * (col.ld.Pdl + col.ld.Pll) }
      })
      .reduce((best, x) => (x.Pu > best.Pu + 1e-9 || (Math.abs(x.Pu - best.Pu) <= 1e-9 && x.fr.Lf * x.fr.Bf > best.fr.Lf * best.fr.Bf) ? x : best))
    const label = `${worked.col.ld.type} column at grid position (${worked.col.ix + 1}, ${worked.col.iy + 1}); factored load ${d0(worked.Pu)} kN`
    blocks.push(...footingBlocks(c, worked.fr, worked.col.ld, label))
    blocks.push(...scheduleBlocks(c))
  }
  blocks.push(...plinthBlocks(c))
  return {
    id: 'foundation',
    title: '8. Foundations and plinth beams',
    intro: `The foundation is ${a.raft ? 'a raft' : 'a set of isolated footings, one under each ground-storey column'}, on the bearing capacity assumed for your ground class. ${a.raft ? 'The raft' : 'One footing'} is worked in full below; the others follow the same steps and are listed in a schedule. Plinth beams tie the columns at the plinth.`,
    blocks,
  }
}
