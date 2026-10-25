// Section 6 of the StructurePro calculation sheet: beam design.
// One full worked example for the beam that sets the size of each type (outer-wall beam, inner beam), then a table for every beam of the building.

import type { CalcBlock, CalcSection } from '@/lib/calcsheet'
import type { CalcCtx } from './ctx'
import { COVER_BEAM, FY, FY_SHEAR, T12, TAU_C_MAX, XU_MAX_OVER_D, astSingly, barArea, barMass, momentCapacity, roundUp25, stirrupCutLength, tauC } from '../codes'
import { BEAM_RULES, beamCoeffs } from '../beam'
import { barsPerLayer, countStirrups, pickBars, splices } from '../steel'
import { STD, check, d0, d1, d2, d3, ex, fixed, governingBeams, levelName, table, takeBlock, tableBlock, type BeamPick } from './helpers'
import { portalColumnMoment } from './lateral'
import { putText } from './figs'

const floorTo = (v: number, step: number) => Math.floor(v / step + 1e-9) * step

const REF_T12 = `${STD.is456} cl. 22.5.1, Table 12 (dead load with fixed imposed load)`
const REF_AST = `${STD.is456} Annex G, cl. G-1.1(b)`
const REF_13920_SAG = `${STD.is13920} cl. 6.2.3`
const REF_13920_SHEAR = `${STD.is13920} cl. 6.3.3`
const REF_13920_HOOP = `${STD.is13920} cl. 6.3.5`

/** One beam designed on the page: geometry, depth search, loads and moments, steel, shear, and the bars with their weight. */
function beamExample(c: CalcCtx, pk: BeamPick, tag: string, title: string): CalcBlock[] {
  const { L, work } = c
  const { ctx, plan } = work
  const F = plan.F
  const r = pk.rec
  const des = r.des!
  const q = des.detail
  const inp = q.input
  const fck = inp.fck
  const b = inp.b
  const d = q.d
  const D = des.D
  const blocks: CalcBlock[] = []
  const lat = work.analysis.lat
  const last = q.trials[q.trials.length - 1]

  // ---- geometry and the depth search
  L.input('Beam', `${r.dir === 'x' ? 'along the length' : 'along the width'}, ${levelName(r.k, F, ctx.stilt).toLowerCase()}, span ${r.i + 1} of ${r.n} in its line`, STD.rule, `${r.perimeter ? 'On the outer wall line' : 'An inner beam'}. This is the beam that sets the size for its type. All beams of the type are in the table at the end of this section`)
  L.value('Span, centre to centre', r.L, 'm', 2, 'Section 3: the grid')
  L.value('Width of beam b', b, 'mm', 0, `${STD.assume}: the wall thickness, so that the beam does not show beyond the wall`, work.wallType === 'brick' ? 'Brick wall: 230 mm' : 'Block wall: 200 mm')
  L.value('Column size assumed at each end of the beam', inp.colL, 'mm', 0, `${STD.rule}: estimated size`, 'The beams are designed before the columns, so the model assumes a column size by the number of floors it carries. The columns are then designed in Section 7')
  const clear = L.calc('Clear span', 'Lclear = L − (cl + cr) ÷ 2', '{L} − ({a} + {b}) ÷ 2000', { L: r.L, a: inp.colL, b: inp.colR }, (v) => v.L - (v.a + v.b) / 2000, { unit: 'm', dp: 3, ref: STD.rule, ...ex(des.clear) })
  L.value('Slab thickness', inp.tSlab, 'mm', 0, 'Section 3')
  L.value('Concrete grade', fck, 'N/mm²', 0, `M${fck}: Section 2`)
  L.value('Steel strength fy (main bars)', FY, 'N/mm²', 0, `${STD.is456} cl. 5.6`)
  L.value('Steel strength fy for stirrups', FY_SHEAR, 'N/mm²', 0, `${STD.is456} cl. 40.4`, 'For stirrups fy is not taken above 415 N/mm²')
  const dMin = BEAM_RULES.dMin
  const D0 = L.calc(
    'First trial depth',
    'D = span ÷ 13, up to the next 25 mm, not under 300 mm',
    'max({m}; ceil({L} × 1000 ÷ {k} ÷ {s}) × {s})',
    { m: dMin, L: r.L, k: BEAM_RULES.startDivisor, s: BEAM_RULES.dStep },
    (v) => Math.max(v.m, Math.ceil((v.L * 1000) / v.k / v.s) * v.s),
    { unit: 'mm', dp: 0, ref: `${STD.rule} (starting point of the search; IS 456 cl. 23.2.1 span/depth ratios are checked below)`, expect: q.trials[0].D, tol: 1e-9 }
  )
  void D0
  L.say(
    'Depth search',
    `The depth goes up in steps of ${BEAM_RULES.dStep} mm, from the first trial to at most ${BEAM_RULES.dMax} mm, until three checks pass together: the bending steel fits as a beam (not over-reinforced), the shear stress is under the Table 20 maximum, and the span to depth ratio is within the limit. Effective depth d = D − ${BEAM_RULES.dCover} mm (cover ${COVER_BEAM} mm, stirrup 8 mm, half a 25 mm bar, rounded).`,
    `${STD.is456} cl. 23.2.1, cl. 40.2.3 and Table 20; ${STD.rule}`
  )
  blocks.push(takeBlock(L, `beam-${tag}-geometry`, `${title}: the beam and its size`))
  // trial table
  const trialRows = q.trials.map((t, i) => {
    const dd = t.D - BEAM_RULES.dCover
    const self = (25 * (b / 1000) * Math.max(0, t.D - inp.tSlab)) / 1000
    const ld = (r.L * 1000) / dd
    check(L, `Beam depth trial ${i + 1}: effective depth`, dd, t.d)
    check(L, `Beam depth trial ${i + 1}: own weight`, self, t.self)
    check(L, `Beam depth trial ${i + 1}: span to depth`, ld, t.lOverD)
    return [String(t.D), String(dd), d3(self), d2(t.tauV), d2(t.tauMax), d1(ld), d0(t.allowLD), t.flexOK ? 'Yes' : 'No', t.shearOK ? 'Yes' : 'No', t.deflOK ? 'Yes' : 'No']
  })
  blocks.push(
    tableBlock(`beam-${tag}-trials`, `${title}: depth search`, table(['D (mm)', 'd (mm)', 'Own weight (kN/m)', 'Shear stress (N/mm²)', 'Largest shear stress allowed (N/mm²)', 'Span ÷ d', 'Allowed', 'Bending OK', 'Shear OK', 'Deflection OK'], trialRows, { num: [0, 1, 2, 3, 4, 5, 6] }), {
      intro: 'Each row is one trial depth. The full moments and shears for the last row are worked below.',
      note: `${q.limitReached ? 'The deepest trial did not pass every check. The model keeps it and warns that a deeper section or higher grade will be needed. ' : ''}Span ÷ d allowed: ${BEAM_RULES.ldEnd} for an end or single span and ${BEAM_RULES.ldInterior} for an interior span. These are the basic ratios of IS 456 cl. 23.2.1 (20 for a simply supported beam, 26 for a continuous one) with an assumed modification factor of about 1.1 for the steel stress; the factor is not computed from the steel provided, which is an assumption.`,
    })
  )

  // ---- loads and moments
  L.value('Dead load for the moment: slab + wall (+ balcony)', inp.wDL, 'kN/m', 3, 'Section 4: equivalent uniform load')
  L.value('Imposed load for the moment', inp.wLL, 'kN/m', 3, 'Section 4')
  L.value('Dead load for the shear: slab + wall (+ balcony)', inp.wDLv, 'kN/m', 3, 'Section 4')
  L.value('Imposed load for the shear', inp.wLLv, 'kN/m', 3, 'Section 4')
  const self = L.calc('Own weight of the beam below the slab', 'ws = 25 × b × (D − t)', '25 × {b} ÷ 1000 × ({D} − {t}) ÷ 1000', { b, D, t: inp.tSlab }, (v) => (25 * (v.b / 1000) * Math.max(0, v.D - v.t)) / 1000, { unit: 'kN/m', dp: 3, ref: `${STD.is456} cl. 19.2.1 (25 kN/m³)`, ...ex(des.selfWeight) })
  const wD = L.calc('Total dead load', 'wd = dead load + own weight', '{a} + {s}', { a: inp.wDL, s: self }, (v) => v.a + v.s, { unit: 'kN/m', dp: 3, ref: STD.rule, ...ex(q.wD) })
  const w = L.calc('Total service load', 'w = wd + wl', '{a} + {l}', { a: wD, l: inp.wLL }, (v) => v.a + v.l, { unit: 'kN/m', dp: 3, ref: STD.rule, ...ex(q.w) })
  const rD = L.calc('Dead share of the load', 'rD = wd ÷ w', '{a} ÷ {w}', { a: wD, w }, (v) => v.a / v.w, { dp: 4, ref: STD.rule, note: 'Used to take only the dead part of the gravity moment in the load cases where the imposed load is left out', ...ex(q.rD) })
  void rD
  L.value('Moment coefficient at mid-span', q.coeffs.cMid, '', 4, n1Note(inp.nSpans, inp.spanIndex).mid)
  L.value('Moment coefficient at the left support', q.coeffs.cL, '', 4, n1Note(inp.nSpans, inp.spanIndex).left)
  L.value('Moment coefficient at the right support', q.coeffs.cR, '', 4, n1Note(inp.nSpans, inp.spanIndex).right)
  const coeffCheck = beamCoeffs(inp.nSpans, inp.spanIndex)
  check(L, 'Beam moment coefficients', coeffCheck.cMid + coeffCheck.cL + coeffCheck.cR, q.coeffs.cMid + q.coeffs.cL + q.coeffs.cR)
  const msMid = L.calc('Gravity moment at mid-span', 'Ms = c × w × L²', '{c} × {w} × {L}²', { c: q.coeffs.cMid, w, L: r.L }, (v) => v.c * v.w * v.L * v.L, { unit: 'kN·m', dp: 2, ref: REF_T12, ...ex(q.MsMid) })
  const msL = L.calc('Gravity moment at the left support', 'Ms = c × w × L²', '{c} × {w} × {L}²', { c: q.coeffs.cL, w, L: r.L }, (v) => v.c * v.w * v.L * v.L, { unit: 'kN·m', dp: 2, ref: REF_T12, ...ex(q.MsL) })
  const msR = L.calc('Gravity moment at the right support', 'Ms = c × w × L²', '{c} × {w} × {L}²', { c: q.coeffs.cR, w, L: r.L }, (v) => v.c * v.w * v.L * v.L, { unit: 'kN·m', dp: 2, ref: REF_T12, ...ex(q.MsR) })
  blocks.push(takeBlock(L, `beam-${tag}-loads`, `${title}: loads and gravity moments`, { note: 'The coefficients assume a continuous beam with equal spans. Each support of a real frame is only partly fixed, so the coefficients are an approximation (see the limits at the start of the sheet).' }))

  // ---- earthquake moments at the ends, from the portal method
  const above = r.k === 0 ? lat.stiltAmp : 1
  const f = plan.floors[r.k]
  const endInfo = (ix: number, iy: number, end: string, show: boolean) => {
    const mBelow = portalColumnMoment(c, r.dir, r.k, ix, iy, `${end} joint, column below`, show)
    const hasAbove = r.k < F - 1
    const mAbove = hasAbove ? portalColumnMoment(c, r.dir, r.k + 1, ix, iy, `${end} joint, column above`, false) : 0
    const jm = L.calc(
      `Joint moment at the ${end} end`,
      hasAbove ? 'Mj = Mcol,below + a × Mcol,above' : 'Mj = Mcol,below (roof beam: no column above)',
      hasAbove ? '{b} + {a} × {c}' : '{b}',
      { b: mBelow, a: above, c: mAbove },
      (v) => v.b + (hasAbove ? v.a * v.c : 0),
      { unit: 'kN·m', dp: 3, ref: `${STD.rule}: the beam takes the sum of the column moments above and below the joint`, note: r.k === 0 && ctx.stilt ? 'Open parking level: the column above gets the same 2.5 factor as the one below' : undefined }
    )
    const idx = r.dir === 'x' ? ix : iy
    const nb = r.dir === 'x' ? f.nx : f.ny
    const share = idx === 0 || idx === nb ? 1 : 2
    return { jm, share }
  }
  const ex1 = r.dir === 'x' ? r.ix + 1 : r.ix
  const ey1 = r.dir === 'x' ? r.iy : r.iy + 1
  const eL = endInfo(r.ix, r.iy, 'left', true)
  const MEL = L.calc('Earthquake (or wind) moment at the left end of the beam', 'ME = Mj ÷ number of beams meeting at the joint', '{j} ÷ {s}', { j: eL.jm, s: eL.share }, (v) => v.j / v.s, { unit: 'kN·m', dp: 3, ref: `${STD.rule}: portal method, joint moment shared equally`, note: eL.share === 1 ? 'The joint is on the outside of the frame: one beam' : 'Two beams meet at the joint', ...ex(inp.MEL) })
  const eR = endInfo(ex1, ey1, 'right', false)
  const MER = L.calc('Earthquake (or wind) moment at the right end of the beam', 'ME = Mj ÷ number of beams meeting at the joint', '{j} ÷ {s}', { j: eR.jm, s: eR.share }, (v) => v.j / v.s, { unit: 'kN·m', dp: 3, ref: `${STD.rule}: portal method, joint moment shared equally`, ...ex(inp.MER) })
  blocks.push(takeBlock(L, `beam-${tag}-lateral`, `${title}: lateral moments at the ends`, { intro: 'The lateral force (the larger of earthquake and wind, Section 5) bends the beams as well as the columns. The column moments below come from the portal method; the working is shown for the left end and the right end is the same method.' }))

  // ---- design moments
  const hogL = L.calc('Design hogging moment at the left support', 'Mu = max(1.5 Ms ; 1.2 (Ms + ME) ; 1.5 (rD Ms + ME))', 'max(1.5 × {m}; 1.2 × ({m} + {e}); 1.5 × ({r} × {m} + {e}))', { m: msL, e: MEL, r: q.rD }, (v) => Math.max(1.5 * v.m, 1.2 * (v.m + v.e), 1.5 * (v.r * v.m + v.e)), { unit: 'kN·m', dp: 2, ref: `${STD.is456} Table 18; ${STD.is1893} cl. 6.3.1.2`, ...ex(q.hogL) })
  const hogR = L.calc('Design hogging moment at the right support', 'Mu = max(1.5 Ms ; 1.2 (Ms + ME) ; 1.5 (rD Ms + ME))', 'max(1.5 × {m}; 1.2 × ({m} + {e}); 1.5 × ({r} × {m} + {e}))', { m: msR, e: MER, r: q.rD }, (v) => Math.max(1.5 * v.m, 1.2 * (v.m + v.e), 1.5 * (v.r * v.m + v.e)), { unit: 'kN·m', dp: 2, ref: `${STD.is456} Table 18; ${STD.is1893} cl. 6.3.1.2`, ...ex(q.hogR) })
  const sagLb = L.calc('Sagging moment at the left support (reversal)', 'Mu = max(0 ; 1.5 ME − 0.9 rD Ms)', 'max(0; 1.5 × {e} − 0.9 × {r} × {m})', { e: MEL, r: q.rD, m: msL }, (v) => Math.max(0, 1.5 * v.e - 0.9 * v.r * v.m), { unit: 'kN·m', dp: 2, ref: `${STD.is456} Table 18; ${STD.is1893} cl. 6.3.1.2 (0.9 DL + 1.5 EL)`, ...ex(q.sagLBase) })
  const sagRb = L.calc('Sagging moment at the right support (reversal)', 'Mu = max(0 ; 1.5 ME − 0.9 rD Ms)', 'max(0; 1.5 × {e} − 0.9 × {r} × {m})', { e: MER, r: q.rD, m: msR }, (v) => Math.max(0, 1.5 * v.e - 0.9 * v.r * v.m), { unit: 'kN·m', dp: 2, ref: `${STD.is456} Table 18; ${STD.is1893} cl. 6.3.1.2 (0.9 DL + 1.5 EL)`, ...ex(q.sagRBase) })
  let sagL = sagLb
  let sagR = sagRb
  if (inp.seismicDetailing) {
    sagL = L.calc('Sagging moment at the left support, ductile rule', 'Mu = max(above ; 0.5 × hogging)', 'max({a}; 0.5 × {h})', { a: sagLb, h: hogL }, (v) => Math.max(v.a, 0.5 * v.h), { unit: 'kN·m', dp: 2, ref: REF_13920_SAG, note: 'At the face of a joint the bottom steel must be at least half the top steel', ...ex(q.sagL) })
    sagR = L.calc('Sagging moment at the right support, ductile rule', 'Mu = max(above ; 0.5 × hogging)', 'max({a}; 0.5 × {h})', { a: sagRb, h: hogR }, (v) => Math.max(v.a, 0.5 * v.h), { unit: 'kN·m', dp: 2, ref: REF_13920_SAG, ...ex(q.sagR) })
  }
  const mid = L.calc('Design sagging moment at mid-span', 'Mu = 1.5 Ms', '1.5 × {m}', { m: msMid }, (v) => 1.5 * v.m, { unit: 'kN·m', dp: 2, ref: `${STD.is456} Table 18 (1.5 (DL + LL))`, ...ex(q.mid) })
  blocks.push(takeBlock(L, `beam-${tag}-moments`, `${title}: design moments`, { intro: 'Hogging is tension on top (at the supports), sagging is tension at the bottom. Each figure is the largest from the load combinations of Section 4.' }))

  // ---- steel for bending
  const muLimN = 0.36 * fck * b * XU_MAX_OVER_D * d * d * (1 - 0.42 * XU_MAX_OVER_D)
  const muLim = L.calc('Limiting moment of resistance of the section', 'Mu,lim = 0.36 fck b (xu,max/d) d² (1 − 0.42 xu,max/d)', '0.36 × {f} × {b} × {k} × {d}² × (1 − 0.42 × {k}) ÷ 10^6', { f: fck, b, k: XU_MAX_OVER_D, d }, (v) => (0.36 * v.f * v.b * v.k * v.d * v.d * (1 - 0.42 * v.k)) / 1e6, { unit: 'kN·m', dp: 2, ref: `${STD.is456} Annex G, cl. G-1.1(c)`, note: `xu,max/d = ${fixed(XU_MAX_OVER_D, 2)} for Fe 500 (IS 456 cl. 38.1); a larger moment needs compression steel` })
  let astLimShown = false
  const astLine = (label: string, Mu: number, expected: number) => {
    if (Mu <= 0) return 0
    const lim = muLim
    if (astSingly(Mu * 1e6, b, d, fck) !== null) {
      return L.calc(label, 'Ast = (0.5 fck ÷ fy) (1 − √(1 − 4.6 Mu ÷ (fck b d²))) b d', '(0.5 × {f} ÷ {y}) × (1 − √(1 − 4.6 × {M} × 10^6 ÷ ({f} × {b} × {d}²))) × {b} × {d}', { f: fck, y: FY, M: Mu, b, d }, (v) => {
        const k = (4.6 * v.M * 1e6) / (v.f * v.b * v.d * v.d)
        return ((0.5 * v.f) / v.y) * (1 - Math.sqrt(Math.max(0, 1 - k))) * v.b * v.d
      }, { unit: 'mm²', dp: 0, ref: REF_AST, ...ex(expected) })
    }
    let astLim = astSingly(muLimN, b, d, fck) ?? 0
    if (!astLimShown) {
      astLimShown = true
      astLim = L.calc('Steel of the limiting section', 'Ast,lim = (0.5 fck ÷ fy) (1 − √(1 − 4.6 Mu,lim ÷ (fck b d²))) b d', '(0.5 × {f} ÷ {y}) × (1 − √(1 − 4.6 × {M} × 10^6 ÷ ({f} × {b} × {d}²))) × {b} × {d}', { f: fck, y: FY, M: lim, b, d }, (v) => {
        const k = (4.6 * v.M * 1e6) / (v.f * v.b * v.d * v.d)
        return ((0.5 * v.f) / v.y) * (1 - Math.sqrt(Math.max(0, 1 - k))) * v.b * v.d
      }, { unit: 'mm²', dp: 0, ref: REF_AST, expect: astLim, tol: Math.max(1e-6, astLim * 1e-9) })
    }
    return L.calc(label, 'Ast = Ast,lim + 1.15 (Mu − Mu,lim) ÷ (0.87 fy (d − 50))', '{a} + 1.15 × ({M} − {l}) × 10^6 ÷ (0.87 × {y} × ({d} − 50))', { a: astLim, M: Mu, l: lim, y: FY, d }, (v) => v.a + 1.15 * (((v.M - v.l) * 1e6) / (0.87 * v.y * (v.d - 50))), { unit: 'mm²', dp: 0, ref: `${STD.is456} Annex G, cl. G-1.2; ${STD.rule} (15 % extra, d' = 50 mm; the compression steel is not designed separately)`, note: 'The moment is over the limit of the section: the tension steel is raised and the extra is counted in the quantities', ...ex(expected) })
  }
  const aMid = astLine('Steel for mid-span sagging', mid, q.astMid)
  const aHL = astLine('Steel for hogging at the left support', hogL, q.astHogL)
  const aHR = astLine('Steel for hogging at the right support', hogR, q.astHogR)
  const aSL = astLine('Steel for sagging at the left support', sagL, q.astSagL)
  const aSR = astLine('Steel for sagging at the right support', sagR, q.astSagR)
  const astMin = L.calc('Minimum tension steel', 'Ast,min = 0.85 b d ÷ fy', '{k} × {b} × {d} ÷ {y}', { k: BEAM_RULES.astMinCoeff, b, d, y: FY }, (v) => (v.k * v.b * v.d) / v.y, { unit: 'mm²', dp: 0, ref: `${STD.is456} cl. 26.5.1.1(a)`, ...ex(q.astMin) })
  blocks.push(takeBlock(L, `beam-${tag}-steel`, `${title}: steel required for bending`, { note: 'These are areas of steel in mm²; the bars chosen to provide them follow.' }))

  // ---- bars chosen
  const reqBot = L.calc('Bottom steel required', 'max(mid-span ; sagging at supports ; minimum)', 'max({a}; {b}; {c}; {d})', { a: aMid, b: astMin, c: aSL, d: aSR }, (v) => Math.max(v.a, v.b, v.c, v.d), { unit: 'mm²', dp: 0, ref: STD.rule })
  const bot = pickBars(reqBot, b, BEAM_RULES.bottomMinBars, BEAM_RULES.bottomMinPhi)
  check(L, 'Beam bottom bars area', bot.area, q.bot.area)
  L.pick('Bottom bars chosen', `smallest size from 12, 16, 20, 25, 32 mm that fits in one layer; at least ${BEAM_RULES.bottomMinBars} bars`, `${bot.n} bars of ${bot.phi} mm = ${d0(bot.area)} mm²`, `${STD.is456} cl. 26.3.1(a) (least distance between bars: the bar size, or 5 mm more than the aggregate size, 25 mm for 20 mm aggregate); ${STD.rule}`, `A layer of a ${b} mm beam holds at most ${Math.min(barsPerLayer(b, bot.phi), b <= 230 ? 4 : 5)} bars of ${bot.phi} mm (clear spacing not under the larger of the bar size and 25 mm, cover 25 mm, stirrup 8 mm; site practice limits it to ${b <= 230 ? 4 : 5} bars)`)
  const hangCond = inp.spanC > BEAM_RULES.hangLongSpanM || D > BEAM_RULES.hangDeepMm
  L.pick('Two hanging (top) bars', `${BEAM_RULES.hangBigPhi} mm if the span is over ${BEAM_RULES.hangLongSpanM} m or the beam deeper than ${BEAM_RULES.hangDeepMm} mm, else ${BEAM_RULES.hangSmallPhi} mm`, `2 bars of ${q.hangPhi} mm = ${d0(q.hangArea)} mm²`, `${STD.rule}: the bars that carry the stirrups through the span and run over both supports`, hangCond ? 'Span over 4.5 m or beam deeper than 450 mm' : 'Short, shallow beam')
  check(L, 'Beam hanging bar size', q.hangPhi, hangCond ? BEAM_RULES.hangBigPhi : BEAM_RULES.hangSmallPhi)
  const hangArea = L.calc('Area of the two hanging bars', 'A = 2 × π φ² ÷ 4', '2 × π × {p}² ÷ 4', { p: q.hangPhi }, (v) => 2 * barArea(v.p), { unit: 'mm²', dp: 0, ref: STD.rule, ...ex(q.hangArea) })
  const needL = L.calc('Extra top steel needed at the left support', 'max(hogging steel ; minimum) − hanging bars, not below 0', 'max(max({h}; {m}) − {a}; 0)', { h: aHL, m: astMin, a: hangArea }, (v) => Math.max(0, Math.max(v.h, v.m) - v.a), { unit: 'mm²', dp: 0, ref: STD.rule, ...ex(q.topNeedL) })
  const needR = L.calc('Extra top steel needed at the right support', 'max(hogging steel ; minimum) − hanging bars, not below 0', 'max(max({h}; {m}) − {a}; 0)', { h: aHR, m: astMin, a: hangArea }, (v) => Math.max(0, Math.max(v.h, v.m) - v.a), { unit: 'mm²', dp: 0, ref: STD.rule, ...ex(q.topNeedR) })
  if (needL > 0) L.pick('Extra top bars at the left support', 'in one layer, at least 1 bar, not smaller than the hanging bar', `${q.exL.n} bars of ${q.exL.phi} mm = ${d0(q.exL.area)} mm²`, STD.rule, 'Cut off one third of the clear span from the face of the support')
  if (needR > 0) L.pick('Extra top bars at the right support', 'in one layer, at least 1 bar, not smaller than the hanging bar', `${q.exR.n} bars of ${q.exR.phi} mm = ${d0(q.exR.area)} mm²`, STD.rule, 'Cut off one third of the clear span from the face of the support')
  const provL = L.calc('Top steel provided at the left support', 'A = hanging bars + extra bars', '{a} + {e}', { a: hangArea, e: needL > 0 ? q.exL.area : 0 }, (v) => v.a + v.e, { unit: 'mm²', dp: 0, ref: STD.rule, ...ex(q.topProvL) })
  const provR = L.calc('Top steel provided at the right support', 'A = hanging bars + extra bars', '{a} + {e}', { a: hangArea, e: needR > 0 ? q.exR.area : 0 }, (v) => v.a + v.e, { unit: 'mm²', dp: 0, ref: STD.rule, ...ex(q.topProvR) })
  const mrf = (label: string, Ast: number, expected: number) =>
    L.calc(label, 'Mu = 0.87 fy Ast (d − 0.42 xu), xu = 0.87 fy Ast ÷ (0.36 fck b), xu not over 0.46 d', '0.87 × {y} × {A} × ({d} − 0.42 × min(0.87 × {y} × {A} ÷ (0.36 × {f} × {b}); {k} × {d})) ÷ 10^6', { y: FY, A: Ast, d, f: fck, b, k: XU_MAX_OVER_D }, (v) => momentCapacity(v.A, v.b, v.d, v.f) / 1e6, { unit: 'kN·m', dp: 2, ref: `${STD.is456} Annex G, cl. G-1.1`, ...ex(expected) })
  mrf('Moment of resistance of the top steel, left support', provL, des.capHogL)
  mrf('Moment of resistance of the top steel, right support', provR, des.capHogR)
  mrf('Moment of resistance of the bottom steel', bot.area, des.capSagL)
  blocks.push(takeBlock(L, `beam-${tag}-bars`, `${title}: bars chosen`, { note: 'The moments of resistance of the steel provided are used for the capacity-based shear below and for the strong-column weak-beam check of the columns (Section 7).' }))

  // ---- shear
  const Vg = L.calc('Shear from the gravity loads', 'Vg = (wdv + ws + wlv) × Lclear ÷ 2 × kv', '({a} + {s} + {l}) × {c} ÷ 2 × {k}', { a: inp.wDLv, s: self, l: inp.wLLv, c: clear, k: q.kv }, (v) => (v.a + v.s + v.l) * (v.c / 2) * v.k, { unit: 'kN', dp: 2, ref: `${STD.rule}; ${STD.is456} Table 13 for the support shear coefficients`, note: q.kv > 1 ? 'Continuous beam: 10 % above wL/2 (0.55 wL at an interior support). Table 13 gives 0.6 wL on the outer side of the first interior support; the model uses 0.55' : undefined, ...ex(q.Vg) })
  const VE = L.calc('Shear from the lateral moments', 'VE = (MEL + MER) ÷ Lclear', '({a} + {b}) ÷ {c}', { a: MEL, b: MER, c: clear }, (v) => (v.a + v.b) / v.c, { unit: 'kN', dp: 2, ref: STD.rule, ...ex(q.VE) })
  const Vu = L.calc('Design shear force', 'Vu = max(1.5 Vg ; 1.2 (Vg + VE))', 'max(1.5 × {g}; 1.2 × ({g} + {e}))', { g: Vg, e: VE }, (v) => Math.max(1.5 * v.g, 1.2 * (v.g + v.e)), { unit: 'kN', dp: 2, ref: `${STD.is456} Table 18; ${STD.is1893} cl. 6.3.1.2`, ...ex(q.Vu) })
  const tauV = L.calc('Nominal shear stress', 'τv = Vu ÷ (b d)', '{V} × 1000 ÷ ({b} × {d})', { V: Vu, b, d }, (v) => (v.V * 1000) / (v.b * v.d), { unit: 'N/mm²', dp: 3, ref: `${STD.is456} cl. 40.1`, ...ex(last.tauV) })
  L.value('Maximum shear stress allowed for the grade', TAU_C_MAX[fck] ?? 3.1, 'N/mm²', 1, `${STD.is456} Table 20`, tauV <= (TAU_C_MAX[fck] ?? 3.1) ? 'The section is large enough in shear' : 'The section is too small in shear: a deeper beam is needed')
  const pt = L.calc('Tension steel percentage at the support', 'pt = 100 × larger top steel ÷ (b d)', '100 × max({a}; {b}) ÷ ({w} × {d})', { a: provL, b: provR, w: b, d }, (v) => (100 * Math.max(v.a, v.b)) / (v.w * v.d), { dp: 3, ref: `${STD.is456} cl. 40.2.1, Table 19`, note: 'The larger of the two support steels is used at both ends', ...ex(q.pt) })
  const tauCv = L.calc(
    'Shear strength of the concrete',
    'τc = 0.85 √(0.8 fck) (√(1 + 5β) − 1) ÷ (6β), β = 0.8 fck ÷ (6.89 pt), not below 1',
    '0.85 × √(0.8 × {f}) × (√(1 + 5 × β) − 1) ÷ (6 × β), β = max(1; 0.8 × {f} ÷ (6.89 × {p}))',
    { f: fck, p: pt },
    (v) => tauC(v.f, v.p),
    { unit: 'N/mm²', dp: 3, ref: `${STD.is456} Table 19: the formula of the code commentary (SP 24) which the table is made from`, note: 'pt is kept between 0.15 % and 3 %', ...ex(q.tauCv) }
  )
  L.pick('Stirrup size', `${inp.seismicDetailing ? '8, 10, 12' : '6, 8, 10, 12'} mm tried in turn, the first whose end spacing is not under ${inp.seismicDetailing ? BEAM_RULES.sFloorSeismic : BEAM_RULES.sFloorOrdinary} mm`, `${q.phiS} mm, 2-legged (sizes tried: ${q.stirrupTried.join(', ')})`, `${STD.rule}; ${inp.seismicDetailing ? `${STD.is13920} cl. 6.3.2 asks for 6 mm, or 8 mm where the clear span is over 5 m; 8 mm at least is the model's rule` : `${STD.is456} cl. 26.5.1.6`}`)
  const Asv = L.calc('Area of the two legs of a stirrup', 'Asv = 2 × π φ² ÷ 4', '2 × π × {p}² ÷ 4', { p: q.phiS }, (v) => 2 * barArea(v.p), { unit: 'mm²', dp: 1, ref: STD.rule, ...ex(q.Asv) })
  const sMinSteel = L.calc('Spacing for the minimum shear steel', 's = Asv × 0.87 fy ÷ (0.4 b)', '{A} × 0.87 × {y} ÷ (0.4 × {b})', { A: Asv, y: FY_SHEAR, b }, (v) => (v.A * 0.87 * v.y) / (0.4 * v.b), { unit: 'mm', dp: 0, ref: `${STD.is456} cl. 26.5.1.6`, ...ex(q.sMinSteel) })
  const sMax = L.calc('Largest spacing allowed', 's = min(0.75 d ; 300 mm)', 'min({k} × {d}; {m})', { k: BEAM_RULES.sMaxFactor, d, m: BEAM_RULES.sMaxAbs }, (v) => Math.min(v.k * v.d, v.m), { unit: 'mm', dp: 0, ref: `${STD.is456} cl. 26.5.1.5`, ...ex(q.sMax) })
  const sMid0 = L.calc('Spacing in the middle of the span, before the ductile rule', 's = largest multiple of 25 mm not over min(smax ; smin steel), not under 75 mm', 'max({f}; floor(min({a}; {b}) ÷ {s}) × {s})', { f: BEAM_RULES.sFloorOrdinary, a: sMax, b: sMinSteel, s: BEAM_RULES.sStep }, (v) => Math.max(v.f, floorTo(Math.min(v.a, v.b), v.s)), { unit: 'mm', dp: 0, ref: `${STD.rule}: spacings are rounded down to 25 mm`, ...ex(q.sMid0) })
  let sEnd: number
  let sMid: number
  let zone: number
  const cl = clear * 1000
  if (inp.seismicDetailing) {
    const Vgs = L.calc('Shear from the gravity loads, without the 10 % allowance', 'Vg = (wdv + ws + wlv) × Lclear ÷ 2', '({a} + {s} + {l}) × {c} ÷ 2', { a: inp.wDLv, s: self, l: inp.wLLv, c: clear }, (v) => (v.a + v.s + v.l) * (v.c / 2), { unit: 'kN', dp: 2, ref: REF_13920_SHEAR, ...ex(q.VgSeismic) })
    const Ve = L.calc('Design shear from the moments of resistance', 'Ve = max(Vu ; 1.2 Vg + 1.4 (Mhog,left + Msag) ÷ Lclear)', 'max({u}; 1.2 × {g} + 1.4 × ({a} + {b}) ÷ {c})', { u: Vu, g: Vgs, a: des.capHogL, b: des.capSagL, c: clear }, (v) => Math.max(v.u, 1.2 * v.g + (1.4 * (v.a + v.b)) / v.c), { unit: 'kN', dp: 2, ref: REF_13920_SHEAR, note: 'The beam is made strong enough in shear to yield in bending first. The model takes the left top steel with the bottom steel for the one sway direction', ...ex(q.Ve) })
    const sShear = L.calc('Spacing needed for the shear', 's = 0.87 fy Asv d ÷ Ve', '0.87 × {y} × {A} × {d} ÷ ({V} × 1000)', { y: FY_SHEAR, A: Asv, d, V: Ve }, (v) => (0.87 * v.y * v.A * v.d) / (v.V * 1000), { unit: 'mm', dp: 0, ref: `${STD.is456} cl. 40.4(a)`, ...ex(q.sShear) })
    const sRule = L.calc('Spacing limit in the closely spaced zone', 's = max(100 ; min(d ÷ 4 ; 8 × smallest main bar))', 'max({f}; min({d} ÷ 4; 8 × {p}))', { f: BEAM_RULES.sFloorSeismic, d, p: Math.min(bot.phi, q.hangPhi) }, (v) => Math.max(v.f, Math.min(v.d / 4, 8 * v.p)), { unit: 'mm', dp: 1, ref: REF_13920_HOOP, ...ex(q.sRule) })
    sEnd = L.calc('Stirrup spacing at the ends', 's = largest multiple of 25 mm not over min(shear ; rule), not under 100 mm', q.sEndForced ? '100 (the shear spacing is under 100 mm for every stirrup size: the 100 mm floor is applied)' : 'floor(min({a}; {b}) ÷ {s}) × {s}', { a: sShear, b: sRule, s: BEAM_RULES.sStep }, (v) => (q.sEndForced ? BEAM_RULES.sFloorSeismic : floorTo(Math.min(v.a, v.b), v.s)), { unit: 'mm', dp: 0, ref: `${REF_13920_HOOP}; ${STD.rule}`, note: q.sEndForced ? 'No stirrup size reached the spacing the shear needs; the model keeps 100 mm. A structural engineer should check this beam' : undefined, ...ex(q.sEnd) })
    sMid = L.calc('Stirrup spacing elsewhere', 's = max(100 ; multiple of 25 mm not over min(d ÷ 2 ; mid-span spacing))', 'max({f}; floor(min({d} ÷ 2; {m}) ÷ {s}) × {s})', { f: BEAM_RULES.sFloorSeismic, d, m: sMid0, s: BEAM_RULES.sStep }, (v) => Math.max(v.f, floorTo(Math.min(v.d / 2, v.m), v.s)), { unit: 'mm', dp: 0, ref: `${STD.is13920} cl. 6.3.5 (d ÷ 2 outside the closely spaced zone); ${STD.rule}`, ...ex(q.sMid) })
    zone = L.calc('Length of the closely spaced zone at each end', 'z = 2 d', '{k} × {d}', { k: BEAM_RULES.endZoneFactor, d }, (v) => v.k * v.d, { unit: 'mm', dp: 0, ref: REF_13920_HOOP, note: 'The first stirrup is 50 mm from the face of the support', ...ex(q.zone) })
  } else {
    const Vc = L.calc('Shear taken by the concrete', 'Vc = τc × b × d', '{t} × {b} × {d} ÷ 1000', { t: tauCv, b, d }, (v) => (v.t * v.b * v.d) / 1000, { unit: 'kN', dp: 2, ref: `${STD.is456} cl. 40.2`, note: 'Shown in kN here; the model carries it in N', expect: q.Vc / 1000, tol: 1e-9 })
    const Vus = L.calc('Shear left for the stirrups', 'Vus = Vu − Vc', '{u} − {c}', { u: Vu, c: Vc }, (v) => v.u - v.c, { unit: 'kN', dp: 2, ref: `${STD.is456} cl. 40.4`, expect: q.Vus / 1000, tol: 1e-9 })
    const sShear = Vus > 0 ? L.calc('Spacing needed for the shear', 's = 0.87 fy Asv d ÷ Vus', '0.87 × {y} × {A} × {d} ÷ ({V} × 1000)', { y: FY_SHEAR, A: Asv, d, V: Vus }, (v) => (0.87 * v.y * v.A * v.d) / (v.V * 1000), { unit: 'mm', dp: 0, ref: `${STD.is456} cl. 40.4(a)`, ...ex(q.sShear) }) : 1e9
    if (Vus <= 0) L.say('Stirrups for shear', 'The concrete carries all the shear. Only the minimum stirrups are needed, at the spacing of the middle of the span.', `${STD.is456} cl. 40.3`)
    sEnd = L.calc('Stirrup spacing at the ends', 's = largest multiple of 25 mm not over min(shear ; smax ; smin steel), not under 75 mm', Vus > 0 ? 'max({f}; floor(min({a}; {m}; {n}) ÷ {s}) × {s})' : '{o} (no shear steel needed: the middle spacing)', { f: BEAM_RULES.sFloorOrdinary, a: sShear, m: sMax, n: sMinSteel, s: BEAM_RULES.sStep, o: sMid0 }, (v) => (Vus > 0 ? Math.max(v.f, floorTo(Math.min(v.a, v.m, v.n), v.s)) : v.o), { unit: 'mm', dp: 0, ref: `${STD.is456} cl. 26.5.1.5 and 26.5.1.6; ${STD.rule}`, ...ex(q.sEnd) })
    sMid = sMid0
    zone = L.calc('Length of the closer-spaced zone at each end', 'z = min(Lclear ÷ 2 ; max(d ; (Lclear ÷ 2) (1 − Vc ÷ Vu)))', Vus > 0 ? 'min({h}; max({d}; {h} × (1 − {c} ÷ {u})))' : '0 (no shear steel needed)', { h: cl / 2, d, c: Vc, u: Vu }, (v) => (Vus > 0 ? Math.min(v.h, Math.max(v.d, v.h * (1 - v.c / v.u))) : 0), { unit: 'mm', dp: 0, ref: `${STD.rule}: the part of the span where the shear is more than the concrete can carry, not under d`, ...ex(q.zone) })
  }
  const nStir = L.calc(
    'Number of stirrups in the span',
    'n = 2 × (floor((z − 50) ÷ send) + 1) + (ceil((Lclear − 2 z) ÷ smid) − 1)',
    '2 × (floor((min({z}; {h}) − 50) ÷ {e}) + 1) + max(0; ceil(({c} − 2 × min({z}; {h})) ÷ {m}) − 1)',
    { z: zone, h: cl / 2, e: sEnd, c: cl, m: sMid },
    (v) => countStirrups(v.c, v.z, v.e, v.m),
    { dp: 0, ref: STD.rule, ...ex(q.nStir) }
  )
  const A = b - 50
  const E = D - 50
  const stirLen = L.calc('Cut length of one stirrup', 'Ls = 2 (A + E) + 12 φ + 2 × tail extra', '2 × ({A} + {E}) + 12 × {p} + 2 × max(0; 75 − 10 × {p})', { A, E, p: q.phiS }, (v) => stirrupCutLength(v.A, v.E, v.p), { unit: 'mm', dp: 0, ref: `${STD.rule}: 135° hooks with 10 φ tails, 75 mm at least (${STD.is13920} cl. 6.3.1 for ductile hooks); A and E are the outside size of the stirrup (cover 25 mm each side)`, ...ex(q.stirrupLen) })
  blocks.push(takeBlock(L, `beam-${tag}-shear`, `${title}: shear and stirrups`))

  // ---- bar lengths and weight
  const endL = r.i === 0 ? 'ext' : 'int'
  const endR = r.i === r.n - 1 ? 'ext' : 'int'
  const anchor = (phi: number, col: number, kind: string) => (kind === 'ext' ? col - 40 + 9 * phi : col / 2)
  const mass = (phi: number) => barMass(phi)
  const kgOf = (phi: number, lenMm: number, count: number) => mass(phi) * (roundUp25(lenMm) / 1000) * count
  const lenBottom = L.calc('Cut length of a bottom bar', 'L = Lclear + anchorage at each end', '{c} + {a} + {b}', { c: cl, a: anchor(bot.phi, inp.colL, endL), b: anchor(bot.phi, inp.colR, endR) }, (v) => v.c + v.a + v.b, {
    unit: 'mm',
    dp: 0,
    ref: `${STD.rule}; ${STD.is456} cl. 26.2`,
    note: `Anchorage: at an outer column the bar goes to the far face less 40 mm cover and bends down 9 φ; at an inner column it runs to the middle of the column. Outer column at the ${[endL === 'ext' ? 'left' : '', endR === 'ext' ? 'right' : ''].filter(Boolean).join(' and ') || 'neither end'}`,
  })
  const lenHang = L.calc('Cut length of a hanging bar', 'L = Lclear + anchorage at each end', '{c} + {a} + {b}', { c: cl, a: anchor(q.hangPhi, inp.colL, endL), b: anchor(q.hangPhi, inp.colR, endR) }, (v) => v.c + v.a + v.b, { unit: 'mm', dp: 0, ref: STD.rule })
  let kg = kgOf(bot.phi, lenBottom, bot.n) + kgOf(q.hangPhi, lenHang, 2)
  L.calc('Weight of the bottom bars', 'W = n × L (rounded up to 25 mm) × φ² ÷ 162.2', '{n} × {l} ÷ 1000 × {p}² ÷ 162.2', { n: bot.n, l: roundUp25(lenBottom), p: bot.phi }, (v) => v.n * (v.l / 1000) * barMass(v.p), { unit: 'kg', dp: 2, ref: 'IS 1786:2008: mass per metre = φ² ÷ 162.2; IS 2502 cl. 5.1.1: lengths up to the next 25 mm' })
  L.calc('Weight of the hanging bars', 'W = 2 × L × φ² ÷ 162.2', '2 × {l} ÷ 1000 × {p}² ÷ 162.2', { l: roundUp25(lenHang), p: q.hangPhi }, (v) => 2 * (v.l / 1000) * barMass(v.p), { unit: 'kg', dp: 2, ref: 'IS 1786:2008; IS 2502 cl. 5.1.1' })
  const thirdL = cl / 3
  if (needL > 0) {
    const lenL = L.calc('Cut length of an extra top bar, left support', 'L = Lclear ÷ 3 + anchorage', '{t} + {a}', { t: thirdL, a: anchor(q.exL.phi, inp.colL, endL) }, (v) => v.t + v.a, { unit: 'mm', dp: 0, ref: STD.rule, note: 'The extra top steel is carried one third of the clear span into the span: a planning rule of the model, not a curtailment drawing' })
    kg += kgOf(q.exL.phi, lenL, q.exL.n)
    L.calc('Weight of the extra top bars, left support', 'W = n × L × φ² ÷ 162.2', '{n} × {l} ÷ 1000 × {p}² ÷ 162.2', { n: q.exL.n, l: roundUp25(lenL), p: q.exL.phi }, (v) => v.n * (v.l / 1000) * barMass(v.p), { unit: 'kg', dp: 2, ref: 'IS 1786:2008; IS 2502 cl. 5.1.1' })
  }
  if (needR > 0) {
    const lenR = L.calc('Cut length of an extra top bar, right support', 'L = Lclear ÷ 3 + anchorage', '{t} + {a}', { t: thirdL, a: anchor(q.exR.phi, inp.colR, endR) }, (v) => v.t + v.a, { unit: 'mm', dp: 0, ref: STD.rule })
    kg += kgOf(q.exR.phi, lenR, q.exR.n)
    L.calc('Weight of the extra top bars, right support', 'W = n × L × φ² ÷ 162.2', '{n} × {l} ÷ 1000 × {p}² ÷ 162.2', { n: q.exR.n, l: roundUp25(lenR), p: q.exR.phi }, (v) => v.n * (v.l / 1000) * barMass(v.p), { unit: 'kg', dp: 2, ref: 'IS 1786:2008; IS 2502 cl. 5.1.1' })
  }
  const lineLen = inp.nSpans * r.L * 1000
  const sp = splices(lineLen)
  if (sp > 0) {
    const lap = Math.max(60 * q.hangPhi, 600)
    L.calc('Laps in the through bars (line longer than a 12 m bar)', 'splices = ceil(line length ÷ 12 000) − 1', 'ceil({l} ÷ 12000) − 1', { l: lineLen }, (v) => Math.max(0, Math.ceil(v.l / 12000) - 1), { dp: 0, ref: `Bars are bought in 12 m lengths (${STD.cpwd}, as quoted in the tool's research notes; item number not re-read)`, note: 'Each splice adds a lap of 60 φ (600 mm at least), shared out over the spans of the line' })
    kg += kgOf(q.hangPhi, (lap * sp * 2) / inp.nSpans, 1) + kgOf(bot.phi, (lap * sp * Math.min(2, bot.n)) / inp.nSpans, 1)
  }
  kg += kgOf(q.phiS, stirLen, nStir)
  L.calc('Weight of the stirrups', 'W = n × Ls (rounded up to 25 mm) × φ² ÷ 162.2', '{n} × {l} ÷ 1000 × {p}² ÷ 162.2', { n: nStir, l: roundUp25(stirLen), p: q.phiS }, (v) => v.n * (v.l / 1000) * barMass(v.p), { unit: 'kg', dp: 2, ref: 'IS 1786:2008; IS 2502 cl. 5.1.1' })
  L.calc('Steel in this beam', 'sum of the weights above', '{k}', { k: kg }, (v) => v.k, { unit: 'kg', dp: 2, ref: STD.rule, note: 'Before the correction of the modelled bays to the floor area you entered (Section 11, steel take-off)', ...ex(des.steelKg), result: false })
  blocks.push(takeBlock(L, `beam-${tag}-weight`, `${title}: bar lengths and steel weight`, { intro: 'Bars are measured to the next 25 mm, weighed by diameter (IS 1786), and this is the weight the quantities of the report are built from.' }))

  void sagL
  void sagR
  void aHL
  void aHR
  return blocks
}

function n1Note(n: number, i: number): { mid: string; left: string; right: string } {
  const m = (v: string) => `${REF_T12}${v}`
  const left = n === 1 || i === 0 ? `${STD.assume}: 1/16 at an outer support of a monolithic frame (IS 456 cl. 22.5.2 gives wL²/24 only where the end is built into masonry)` : i === 1 ? m(': support next to the end support, 1/10') : m(': interior support, 1/12')
  const right = n === 1 || i === n - 1 ? `${STD.assume}: 1/16 at an outer support of a monolithic frame (IS 456 cl. 22.5.2 gives wL²/24 only where the end is built into masonry)` : i === n - 2 ? m(': support next to the end support, 1/10') : m(': interior support, 1/12')
  const mid = n === 1 ? `${STD.assume}: 1/10 for a single span in a monolithic frame (simple support would be 1/8)` : i === 0 || i === n - 1 ? m(': near the middle of an end span, 1/12') : m(': middle of an interior span, 1/16')
  return { mid, left, right }
}

export function beamsSection(c: CalcCtx): CalcSection {
  const { L, work, result } = c
  const { plan, ctx } = work
  const a = work.analysis
  const F = plan.F
  const blocks: CalcBlock[] = []
  const gb = governingBeams(a)

  // ---- 6a. the rules
  L.value('Concrete grade of the frame', ctx.fck, 'N/mm²', 0, `M${ctx.fck}: Section 2`)
  L.value('Steel', FY, 'N/mm²', 0, `${STD.is456} cl. 5.6: Fe 500D assumed`)
  L.value('Cover to the stirrups', COVER_BEAM, 'mm', 0, 'SP 34:1987 cl. 4.1(c): beam cover not under 25 mm', 'The cover for beams in the model is a fixed 25 mm; the exposure class of Section 2 is used for the grade only')
  L.value('Effective depth below the overall depth', BEAM_RULES.dCover, 'mm', 0, `${STD.rule}: d = D − 45 (cover 25 + stirrup 8 + half a 25 mm bar, rounded)`)
  L.value('Largest depth tried', BEAM_RULES.dMax, 'mm', 0, STD.rule, 'If a beam still fails at this depth the model warns that a deeper section or a higher grade will be needed')
  L.input('Moment coefficients, continuous beam', `mid-span: end span 1/${Math.round(1 / T12.midEnd)}, interior span 1/${Math.round(1 / T12.midInterior)}; supports: outer 1/${Math.round(1 / T12.supportEnd)}, next to the outer 1/${Math.round(1 / T12.supportNextToEnd)}, others 1/${Math.round(1 / T12.supportOther)}`, REF_T12, `Single span: mid-span 1/10, supports 1/${Math.round(1 / T12.supportEnd)} (${STD.assume})`)
  L.input('Load combinations', '1.5 (DL + LL); 1.2 (DL + LL ± EL); 1.5 (DL ± EL); 0.9 DL ± 1.5 EL', `${STD.is456} Table 18; ${STD.is1893} cl. 6.3.1.2`)
  L.input('Ductile detailing', ctx.seismic ? 'Yes: Zone III and above' : 'No: Zone II, ordinary detailing', STD.is13920, ctx.seismic ? 'Bottom steel at a support at least half the top steel; stirrups closely spaced over 2 d at each end; shear from the beam\'s own capacity' : 'Stirrups to IS 456 only')
  blocks.push(takeBlock(L, 'beam-basis', 'What the beam design rests on'))

  // ---- 6b. worked examples
  if (gb.edge) blocks.push(...beamExample(c, gb.edge, 'edge', 'Beam on the outer wall line'))
  if (gb.inner) blocks.push(...beamExample(c, gb.inner, 'inner', 'Inner beam'))

  // ---- 6c. the schedule
  type Row = { k: number; edge: boolean; count: number; rep: BeamPick['rec']; key: string; maxM: number }
  const groups = new Map<string, Row>()
  let nBeams = 0
  for (const f of plan.floors) {
    a.beams[f.k].forEach((rec) => {
      const dd = rec.des!
      nBeams++
      const key = `${f.k}|${rec.perimeter ? 'ext' : 'int'}|${dd.D}|${dd.longitudinal}|${dd.stirrup}`
      const m = Math.max(dd.detail.hogL, dd.detail.hogR, dd.detail.mid)
      const cur = groups.get(key)
      if (cur) {
        cur.count++
        if (m > cur.maxM) {
          cur.maxM = m
          cur.rep = rec
        }
      } else groups.set(key, { k: f.k, edge: rec.perimeter, count: 1, rep: rec, key, maxM: m })
    })
  }
  const rows: string[][] = []
  const reportBeams = result.schedules.beams
  for (const g of [...groups.values()].sort((p, q) => p.k - q.k || Number(q.edge) - Number(p.edge) || q.rep.des!.D - p.rep.des!.D)) {
    const dd = g.rep.des!
    const qq = dd.detail
    const type = g.edge ? 'edge beam' : 'inner beam'
    const rep = reportBeams.find((s) => s.floor === g.k && s.type === type && s.dMm === dd.D && s.note === `${dd.longitudinal}; stirrups ${dd.stirrup}`)
    check(L, `Beam schedule row, level ${g.k} ${type} ${dd.D}: count`, g.count, rep ? rep.count : -1)
    rows.push([levelName(g.k, F, ctx.stilt), g.edge ? 'Outer wall line' : 'Inner', String(g.count), `${ctx.bBeam} × ${dd.D}`, d2(g.rep.L), d1(qq.hogL), d1(qq.mid), d1(qq.Vu), dd.longitudinal, dd.stirrup])
  }
  check(L, 'Number of beams', nBeams, reportBeams.reduce((s, x) => s + x.count, 0))
  check(L, 'Number of beams against the report', nBeams, result.members.beams.count)
  putText(
    L,
    'sched.beams',
    JSON.stringify([...groups.values()].map((g) => ({ k: g.k, type: g.edge ? 'edge beam' : 'inner beam', count: g.count, b: ctx.bBeam, D: g.rep.des!.D, note: `${g.rep.des!.longitudinal}; stirrups ${g.rep.des!.stirrup}` })))
  )
  blocks.push(
    tableBlock('beam-schedule', 'Beam schedule: every distinct beam', table(['Level', 'Position', 'Number', 'Size b × D (mm)', 'Span (m)', 'Largest hogging Mu (kN·m)', 'Mid-span Mu (kN·m)', 'Shear Vu (kN)', 'Bars', 'Stirrups dia @ end/mid (mm)'], rows, { num: [2, 4, 5, 6, 7], foot: ['Total', '', String(nBeams), '', '', '', '', '', '', ''] }), {
      intro: 'Beams with the same level, position, depth, bars and stirrups are one row. The span and the moments are those of the beam in the row with the largest moment. The rows agree with the beam schedule of the report.',
      note: 'Level 0 sits at the top of the lowest storey. The plinth beams at foundation level are not part of this table.',
    })
  )

  return {
    id: 'beams',
    title: '6. Beam design',
    intro: 'Each beam is designed for bending and shear on the loads of Section 4 and the lateral moments of Section 5. The search starts at a depth of span ÷ 13 and goes deeper until the beam passes. The two beams that set the size of their type are worked in full; the table at the end lists every beam.',
    blocks,
  }
}
