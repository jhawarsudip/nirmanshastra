// Beam design and bar schedule for one span of a beam line.
// Gravity moments: IS 456 Table 12 coefficients. Seismic end moments come from the portal method in design.ts.
// Load combinations: 1.5(DL+LL), 1.2(DL+LL+-EL), 1.5(DL+-EL), 0.9DL+-1.5EL (IS 456 cl 18.2.3, IS 1893 cl 6.3.1).
// Shear design: IS 456 cl 40; ductile detailing for Zone III and above: IS 13920 cl 6.2-6.3.

import { FY, FY_SHEAR, T12, TAU_C_MAX, astSingly, barArea, momentCapacity, stirrupCutLength, tauC, XU_MAX_OVER_D } from './codes'
import { SteelBook, countStirrups, pickBars, splices } from './steel'

/** The beam routine's own rules (house rules and sizes) in one place, so that the calculation sheet reads them from here and does not retype them. */
export const BEAM_RULES = {
  /** the first trial depth is the span / 13 rounded up to `dStep` (and not under `dMin`) */
  startDivisor: 13,
  dMin: 300,
  dMax: 650,
  dStep: 25,
  /** effective depth d = D - 45 (cover 25 + stirrup 8 + half a 25 bar, rounded) */
  dCover: 45,
  /** shear at the supports of a continuous line is taken 10 % above wL/2: the model's own factor */
  kvContinuous: 1.1,
  /** span / effective depth allowed: end spans and single spans, interior spans (IS 456 cl 23.2.1 basic 20 / 26 with an assumed modification factor of about 1.1) */
  ldEnd: 22,
  ldInterior: 26,
  /** minimum tension steel 0.85 b d / fy (IS 456 cl 26.5.1.1) */
  astMinCoeff: 0.85,
  /** two hanging (top) bars: 16 mm when the span is over 4.5 m or the beam deeper than 450 mm, else 12 mm */
  hangLongSpanM: 4.5,
  hangDeepMm: 450,
  hangBigPhi: 16,
  hangSmallPhi: 12,
  bottomMinBars: 2,
  bottomMinPhi: 12,
  stirrupSizesOrdinary: [6, 8, 10, 12],
  stirrupSizesSeismic: [8, 10, 12],
  /** closest stirrup spacing accepted before a bigger bar is tried: ordinary 75 mm, ductile 100 mm */
  sFloorOrdinary: 75,
  sFloorSeismic: 100,
  /** spacings are rounded down to a multiple of this */
  sStep: 25,
  /** maximum spacing: 0.75 d and 300 mm (IS 456 cl 26.5.1.5) */
  sMaxFactor: 0.75,
  sMaxAbs: 300,
  /** the closely spaced zone at each end of a ductile beam is 2 d (IS 13920 cl 6.3.5) */
  endZoneFactor: 2,
} as const

export interface BeamInput {
  spanC: number // c/c span, m
  colL: number // column size along the beam at the left end, mm
  colR: number
  b: number // mm
  tSlab: number // mm
  wDL: number // kN/m, moment-equivalent, excluding beam self weight
  wLL: number
  wDLv: number // kN/m, shear-equivalent
  wLLv: number
  nSpans: number // spans in this beam line at this level
  spanIndex: number
  MEL: number // unfactored seismic beam-end moment, kN.m
  MER: number
  fck: number
  seismicDetailing: boolean // Zone III and above
}

/** One trial depth of the search: what was checked and whether it passed. */
export interface BeamTrial {
  D: number
  d: number
  self: number
  tauV: number
  tauMax: number
  lOverD: number
  allowLD: number
  flexOK: boolean
  shearOK: boolean
  deflOK: boolean
}

/** Intermediate values of one beam design, kept so that a calculation sheet can show the working. Nothing here feeds back into the design. */
export interface BeamDetail {
  input: BeamInput
  coeffs: { cMid: number; cL: number; cR: number }
  kv: number
  trials: BeamTrial[]
  /** the depth search ended without passing every check (D reached the maximum) */
  limitReached: boolean
  d: number
  wD: number
  w: number
  rD: number
  MsMid: number
  MsL: number
  MsR: number
  hogL: number
  hogR: number
  /** sagging at the supports before the IS 13920 cl 6.2.3 rule (50 % of the hogging) */
  sagLBase: number
  sagRBase: number
  sagL: number
  sagR: number
  mid: number
  Vg: number
  VE: number
  Vu: number
  astMid: number
  astHogL: number
  astHogR: number
  astSagL: number
  astSagR: number
  astMin: number
  bot: { phi: number; n: number; area: number }
  hangPhi: number
  hangArea: number
  topReqL: number
  topReqR: number
  topNeedL: number
  topNeedR: number
  exL: { phi: number; n: number; area: number }
  exR: { phi: number; n: number; area: number }
  topProvL: number
  topProvR: number
  botProv: number
  pt: number
  tauCv: number
  stirrupTried: number[]
  phiS: number
  Asv: number
  sMinSteel: number
  sMax: number
  sMid0: number
  /** ordinary detailing: the concrete's share of the shear, and the rest taken by stirrups */
  Vc: number
  Vus: number
  /** ductile detailing: shear from the end moments of resistance (IS 13920 cl 6.3.3), and the spacing rules */
  VgSeismic: number
  Ve: number
  sShear: number
  sRule: number
  /** ductile detailing: the 100 mm floor had to be applied because no bar size reached it */
  sEndForced: boolean
  sEnd: number
  sMid: number
  zone: number
  nStir: number
  stirrupLen: number
}

export interface BeamDesign {
  D: number
  b: number
  selfWeight: number
  clear: number // m
  capHogL: number // kN.m moment of resistance of the top steel at the left face
  capHogR: number
  capSagL: number
  capSagR: number
  stirrup: string
  longitudinal: string
  steelKg: number
  warn?: string
  detail: BeamDetail
}

const floorTo = (v: number, step: number) => Math.floor(v / step + 1e-9) * step

/** Tension steel of a section beyond the limiting moment: the limiting section's steel plus the excess moment over the lever arm (d - 50), with a 15 % allowance. The model's own rule (compression steel is not designed). */
export function astDoubly(Mu: number, b: number, d: number, fck: number): number {
  const MuLim = 0.36 * fck * b * XU_MAX_OVER_D * d * d * (1 - 0.42 * XU_MAX_OVER_D)
  const a1 = astSingly(MuLim, b, d, fck) ?? 0
  const a2 = (Mu - MuLim) / (0.87 * FY * (d - 50))
  return a1 + a2 * 1.15
}

/** IS 456 Table 12 coefficients for span i of a line of n spans: mid-span sagging and the two support moments. */
export function beamCoeffs(n: number, i: number): { cMid: number; cL: number; cR: number } {
  const cMid = n === 1 ? 1 / 10 : i === 0 || i === n - 1 ? T12.midEnd : T12.midInterior
  const cL = n === 1 || i === 0 ? T12.supportEnd : i === 1 ? T12.supportNextToEnd : T12.supportOther
  const cR = n === 1 || i === n - 1 ? T12.supportEnd : i === n - 2 ? T12.supportNextToEnd : T12.supportOther
  return { cMid, cL, cR }
}

export function designBeam(inp: BeamInput, book: SteelBook, group: string): BeamDesign {
  const { b, spanC, fck, nSpans: n, spanIndex: i } = inp
  const clear = spanC - (inp.colL + inp.colR) / 2000
  const { cMid, cL, cR } = beamCoeffs(n, i)
  const kv = n > 1 ? BEAM_RULES.kvContinuous : 1.0

  let D = Math.max(BEAM_RULES.dMin, Math.ceil((spanC * 1000) / BEAM_RULES.startDivisor / BEAM_RULES.dStep) * BEAM_RULES.dStep)
  let warn: string | undefined
  const trials: BeamTrial[] = []
  let r: {
    d: number
    self: number
    wD: number
    w: number
    rD: number
    MsMid: number
    MsL: number
    MsR: number
    hogL: number
    hogR: number
    sagLBase: number
    sagRBase: number
    sagL: number
    sagR: number
    mid: number
    Vg: number
    Vu: number
    VE: number
    astMid: number
    astHogL: number
    astHogR: number
    astSagL: number
    astSagR: number
  } | null = null

  let limitReached = false
  for (; D <= BEAM_RULES.dMax; D += BEAM_RULES.dStep) {
    const d = D - BEAM_RULES.dCover
    const self = (25 * (b / 1000) * Math.max(0, D - inp.tSlab)) / 1000
    const wD = inp.wDL + self
    const w = wD + inp.wLL
    const rD = wD / w
    const L2 = spanC * spanC
    const MsMid = cMid * w * L2
    const MsL = cL * w * L2
    const MsR = cR * w * L2
    const hog = (Ms: number, ME: number) => Math.max(1.5 * Ms, 1.2 * (Ms + ME), 1.5 * (rD * Ms + ME))
    const hogL = hog(MsL, inp.MEL)
    const hogR = hog(MsR, inp.MER)
    const sagLBase = Math.max(0, 1.5 * inp.MEL - 0.9 * rD * MsL)
    const sagRBase = Math.max(0, 1.5 * inp.MER - 0.9 * rD * MsR)
    let sagL = sagLBase
    let sagR = sagRBase
    if (inp.seismicDetailing) {
      sagL = Math.max(sagL, 0.5 * hogL) // IS 13920 cl 6.2.3
      sagR = Math.max(sagR, 0.5 * hogR)
    }
    const mid = 1.5 * MsMid
    const Vg = (inp.wDLv + self + inp.wLLv) * (clear / 2) * kv
    const VE = (inp.MEL + inp.MER) / clear
    const Vu = Math.max(1.5 * Vg, 1.2 * (Vg + VE))
    const ast = (M: number) => (M <= 0 ? 0 : astSingly(M * 1e6, b, d, fck))
    const aMid = ast(mid)
    const aHL = ast(hogL)
    const aHR = ast(hogR)
    const aSL = ast(sagL)
    const aSR = ast(sagR)
    const tauV = (Vu * 1000) / (b * d)
    const lOverD = (spanC * 1000) / d
    const allow = n === 1 || i === 0 || i === n - 1 ? BEAM_RULES.ldEnd : BEAM_RULES.ldInterior // IS 456 cl 23.2.1 basic L/d 20/26, modification factor ~1.1 ASSUMPTION
    const tauMax = TAU_C_MAX[fck] ?? 3.1
    const flexOK = aMid !== null && aHL !== null && aHR !== null && aSL !== null && aSR !== null
    const shearOK = tauV <= tauMax
    const deflOK = lOverD <= allow
    const ok = flexOK && shearOK && deflOK
    trials.push({ D, d, self, tauV, tauMax, lOverD, allowLD: allow, flexOK, shearOK, deflOK })
    if (ok || D === BEAM_RULES.dMax) {
      if (!ok) {
        warn = 'Beam section limit reached; deeper section or higher grade will be needed.'
        limitReached = true
      }
      const dbl = (M: number) => astSingly(M * 1e6, b, d, fck) ?? astDoubly(M * 1e6, b, d, fck)
      r = {
        d,
        self,
        wD,
        w,
        rD,
        MsMid,
        MsL,
        MsR,
        hogL,
        hogR,
        sagLBase,
        sagRBase,
        sagL,
        sagR,
        mid,
        Vg,
        Vu,
        VE,
        astMid: dbl(mid),
        astHogL: dbl(hogL),
        astHogR: dbl(hogR),
        astSagL: sagL > 0 ? dbl(sagL) : 0,
        astSagR: sagR > 0 ? dbl(sagR) : 0,
      }
      break
    }
  }
  if (!r) throw new Error('beam design did not converge')
  const d = r.d
  const astMin = (BEAM_RULES.astMinCoeff * b * d) / FY // IS 456 cl 26.5.1.1

  // ---- longitudinal steel ----
  const bot = pickBars(Math.max(r.astMid, astMin, r.astSagL, r.astSagR), b, BEAM_RULES.bottomMinBars, BEAM_RULES.bottomMinPhi)
  const hangPhi = spanC > BEAM_RULES.hangLongSpanM || D > BEAM_RULES.hangDeepMm ? BEAM_RULES.hangBigPhi : BEAM_RULES.hangSmallPhi
  const hangArea = 2 * barArea(hangPhi)
  const topReqL = Math.max(r.astHogL, astMin)
  const topReqR = Math.max(r.astHogR, astMin)
  const topNeedL = Math.max(0, topReqL - hangArea)
  const topNeedR = Math.max(0, topReqR - hangArea)
  const exL = pickBars(topNeedL, b, 1, hangPhi)
  const exR = pickBars(topNeedR, b, 1, hangPhi)

  const endL = i === 0 ? 'ext' : 'int'
  const endR = i === n - 1 ? 'ext' : 'int'
  const anchor = (phi: number, col: number, kind: string) => (kind === 'ext' ? col - 40 + 9 * phi : col / 2)

  const cl = clear * 1000
  const lenBottom = cl + anchor(bot.phi, inp.colL, endL) + anchor(bot.phi, inp.colR, endR)
  let kg = 0
  kg += book.add(group, bot.phi, lenBottom, bot.n, 'beam bottom bars')
  const lenHang = cl + anchor(hangPhi, inp.colL, endL) + anchor(hangPhi, inp.colR, endR)
  kg += book.add(group, hangPhi, lenHang, 2, 'beam hanging (top) bars')
  const third = cl / 3
  if (topNeedL > 0) kg += book.add(group, exL.phi, third + anchor(exL.phi, inp.colL, endL), exL.n, 'beam extra top bars, left support')
  if (topNeedR > 0) kg += book.add(group, exR.phi, third + anchor(exR.phi, inp.colR, endR), exR.n, 'beam extra top bars, right support')
  // splices of through bars when a beam line is longer than a 12 m bar
  const lineLen = n * spanC * 1000
  const sp = splices(lineLen)
  if (sp > 0) {
    // spread the splices over the spans of the line; each splice lap = tension lap length
    const lap = Math.max(60 * hangPhi, 600)
    kg += book.add(group, hangPhi, (lap * sp * 2) / n, 1, 'beam splice laps, top')
    kg += book.add(group, bot.phi, (lap * sp * Math.min(2, bot.n)) / n, 1, 'beam splice laps, bottom')
  }

  // provided resistances for the strong-column weak-beam check
  const topProvL = hangArea + (topNeedL > 0 ? exL.area : 0)
  const topProvR = hangArea + (topNeedR > 0 ? exR.area : 0)
  const botProv = bot.area
  const capHogL = momentCapacity(topProvL, b, d, fck) / 1e6
  const capHogR = momentCapacity(topProvR, b, d, fck) / 1e6
  const capSag = momentCapacity(botProv, b, d, fck) / 1e6

  // ---- shear reinforcement ----
  const pt = (100 * Math.max(topProvL, topProvR)) / (b * d)
  const tauCv = tauC(fck, pt)
  let phiS = 8
  let sEnd = 100
  let sMid = 150
  let zone = BEAM_RULES.endZoneFactor * d
  let sEndForced = false
  const stirrupTried: number[] = []
  let sd = { Asv: 0, sMinSteel: 0, sMax: 0, sMid0: 0, Vc: 0, Vus: 0, VgSeismic: 0, Ve: 0, sShear: 0, sRule: 0 }
  // Zone II (ordinary detailing): 6 mm links are allowed (bought as a coil); ductile detailing keeps 8 mm at least (IS 13920:2016)
  for (const p of inp.seismicDetailing ? BEAM_RULES.stirrupSizesSeismic : BEAM_RULES.stirrupSizesOrdinary) {
    phiS = p
    stirrupTried.push(p)
    const Asv = 2 * barArea(p)
    const sMinSteel = (Asv * 0.87 * FY_SHEAR) / (0.4 * b)
    const sMax = Math.min(BEAM_RULES.sMaxFactor * d, BEAM_RULES.sMaxAbs)
    const sMid0 = Math.max(BEAM_RULES.sFloorOrdinary, floorTo(Math.min(sMax, sMinSteel), BEAM_RULES.sStep))
    if (inp.seismicDetailing) {
      const Vg = (inp.wDLv + r.self + inp.wLLv) * (clear / 2)
      const Ve = Math.max(r.Vu, 1.2 * Vg + (1.4 * (capHogL + capSag)) / clear) // IS 13920 cl 6.3.3 capacity-based shear
      const sShear = (0.87 * FY_SHEAR * Asv * d) / (Ve * 1000)
      const sRule = Math.max(BEAM_RULES.sFloorSeismic, Math.min(d / 4, 8 * Math.min(bot.phi, hangPhi))) // IS 13920 cl 6.3.5
      sd = { Asv, sMinSteel, sMax, sMid0, Vc: 0, Vus: 0, VgSeismic: Vg, Ve, sShear, sRule }
      sEnd = floorTo(Math.min(sShear, sRule), BEAM_RULES.sStep)
      sEndForced = false
      sMid = Math.max(BEAM_RULES.sFloorSeismic, floorTo(Math.min(d / 2, sMid0), BEAM_RULES.sStep))
      zone = BEAM_RULES.endZoneFactor * d
      if (sEnd >= BEAM_RULES.sFloorSeismic) break
      sEnd = BEAM_RULES.sFloorSeismic
      sEndForced = true
    } else {
      const Vc = tauCv * b * d
      const Vus = r.Vu * 1000 - Vc
      const sShear = Vus > 0 ? (0.87 * FY_SHEAR * Asv * d) / Vus : 1e9
      sd = { Asv, sMinSteel, sMax, sMid0, Vc, Vus, VgSeismic: 0, Ve: 0, sShear, sRule: 0 }
      sEnd = Math.max(BEAM_RULES.sFloorOrdinary, floorTo(Math.min(sShear, sMax, sMinSteel), BEAM_RULES.sStep))
      sMid = sMid0
      zone = Vus > 0 ? Math.min(cl / 2, Math.max(d, (cl / 2) * (1 - Vc / (r.Vu * 1000)))) : 0
      if (zone === 0) sEnd = sMid
      if (sShear >= BEAM_RULES.sFloorOrdinary) break
    }
  }
  const nStir = countStirrups(cl, zone, sEnd, sMid)
  const stirrupLen = stirrupCutLength(b - 50, D - 50, phiS)
  kg += book.add(group, phiS, stirrupLen, nStir, 'beam stirrups')

  return {
    D,
    b,
    selfWeight: r.self,
    clear,
    capHogL,
    capHogR,
    capSagL: capSag,
    capSagR: capSag,
    stirrup: `${phiS} @ ${sEnd}/${sMid}`,
    longitudinal: `bottom ${bot.n}-${bot.phi}, top 2-${hangPhi}${topNeedL > 0 || topNeedR > 0 ? ' + ' + Math.max(topNeedL > 0 ? exL.n : 0, topNeedR > 0 ? exR.n : 0) + '-' + (topNeedL > 0 ? exL.phi : exR.phi) : ''}`,
    steelKg: kg,
    warn,
    detail: {
      input: inp,
      coeffs: { cMid, cL, cR },
      kv,
      trials,
      limitReached,
      d,
      wD: r.wD,
      w: r.w,
      rD: r.rD,
      MsMid: r.MsMid,
      MsL: r.MsL,
      MsR: r.MsR,
      hogL: r.hogL,
      hogR: r.hogR,
      sagLBase: r.sagLBase,
      sagRBase: r.sagRBase,
      sagL: r.sagL,
      sagR: r.sagR,
      mid: r.mid,
      Vg: r.Vg,
      VE: r.VE,
      Vu: r.Vu,
      astMid: r.astMid,
      astHogL: r.astHogL,
      astHogR: r.astHogR,
      astSagL: r.astSagL,
      astSagR: r.astSagR,
      astMin,
      bot,
      hangPhi,
      hangArea,
      topReqL,
      topReqR,
      topNeedL,
      topNeedR,
      exL,
      exR,
      topProvL,
      topProvR,
      botProv,
      pt,
      tauCv,
      stirrupTried,
      phiS,
      ...sd,
      sEndForced,
      sEnd,
      sMid,
      zone,
      nStir,
      stirrupLen,
    },
  }
}
