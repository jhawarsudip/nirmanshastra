// Beam design and bar schedule for one span of a beam line.
// Gravity moments: IS 456 Table 12 coefficients. Seismic end moments come from the portal method in design.ts.
// Load combinations: 1.5(DL+LL), 1.2(DL+LL+-EL), 1.5(DL+-EL), 0.9DL+-1.5EL (IS 456 cl 18.2.3, IS 1893 cl 6.3.1).
// Shear design: IS 456 cl 40; ductile detailing for Zone III and above: IS 13920 cl 6.2-6.3.

import { FY, FY_SHEAR, T12, TAU_C_MAX, astSingly, barArea, momentCapacity, stirrupCutLength, tauC, XU_MAX_OVER_D } from './codes'
import { SteelBook, countStirrups, pickBars, splices } from './steel'

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
}

const floorTo = (v: number, step: number) => Math.floor(v / step + 1e-9) * step

function astDoubly(Mu: number, b: number, d: number, fck: number): number {
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
  const kv = n > 1 ? 1.1 : 1.0

  let D = Math.max(300, Math.ceil((spanC * 1000) / 13 / 25) * 25)
  let warn: string | undefined
  let r: {
    d: number
    self: number
    hogL: number
    hogR: number
    sagL: number
    sagR: number
    mid: number
    Vu: number
    VE: number
    astMid: number
    astHogL: number
    astHogR: number
    astSagL: number
    astSagR: number
  } | null = null

  for (; D <= 650; D += 25) {
    const d = D - 45
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
    let sagL = Math.max(0, 1.5 * inp.MEL - 0.9 * rD * MsL)
    let sagR = Math.max(0, 1.5 * inp.MER - 0.9 * rD * MsR)
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
    const allow = n === 1 || i === 0 || i === n - 1 ? 22 : 26 // IS 456 cl 23.2.1 basic L/d 20/26, modification factor ~1.1 ASSUMPTION
    const ok = aMid !== null && aHL !== null && aHR !== null && aSL !== null && aSR !== null && tauV <= (TAU_C_MAX[fck] ?? 3.1) && lOverD <= allow
    if (ok || D === 650) {
      if (!ok) {
        warn = 'Beam section limit reached; deeper section or higher grade will be needed.'
      }
      const dbl = (M: number) => astSingly(M * 1e6, b, d, fck) ?? astDoubly(M * 1e6, b, d, fck)
      r = {
        d,
        self,
        hogL,
        hogR,
        sagL,
        sagR,
        mid,
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
  const astMin = (0.85 * b * d) / FY // IS 456 cl 26.5.1.1

  // ---- longitudinal steel ----
  const bot = pickBars(Math.max(r.astMid, astMin, r.astSagL, r.astSagR), b, 2, 12)
  const hangPhi = spanC > 4.5 || D > 450 ? 16 : 12
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
  kg += book.add(group, bot.phi, lenBottom, bot.n)
  const lenHang = cl + anchor(hangPhi, inp.colL, endL) + anchor(hangPhi, inp.colR, endR)
  kg += book.add(group, hangPhi, lenHang, 2)
  const third = cl / 3
  if (topNeedL > 0) kg += book.add(group, exL.phi, third + anchor(exL.phi, inp.colL, endL), exL.n)
  if (topNeedR > 0) kg += book.add(group, exR.phi, third + anchor(exR.phi, inp.colR, endR), exR.n)
  // splices of through bars when a beam line is longer than a 12 m bar
  const lineLen = n * spanC * 1000
  const sp = splices(lineLen)
  if (sp > 0) {
    // spread the splices over the spans of the line; each splice lap = tension lap length
    const lap = Math.max(60 * hangPhi, 600)
    kg += book.add(group, hangPhi, (lap * sp * 2) / n, 1)
    kg += book.add(group, bot.phi, (lap * sp * Math.min(2, bot.n)) / n, 1)
  }

  // provided resistances for the strong-column weak-beam check
  const topProvL = hangArea + (topNeedL > 0 ? exL.area : 0)
  const topProvR = hangArea + (topNeedR > 0 ? exR.area : 0)
  const botProv = bot.area
  const capHogL = momentCapacity(topProvL, b, d, fck) / 1e6
  const capHogR = momentCapacity(topProvR, b, d, fck) / 1e6
  const capSag = momentCapacity(botProv, b, d, fck) / 1e6

  // ---- shear reinforcement ----
  const tauCv = tauC(fck, (100 * Math.max(topProvL, topProvR)) / (b * d))
  let phiS = 8
  let sEnd = 100
  let sMid = 150
  let zone = 2 * d
  // Zone II (ordinary detailing): 6 mm links are allowed (bought as a coil); ductile detailing keeps 8 mm at least (IS 13920:2016)
  for (const p of inp.seismicDetailing ? [8, 10, 12] : [6, 8, 10, 12]) {
    phiS = p
    const Asv = 2 * barArea(p)
    const sMinSteel = (Asv * 0.87 * FY_SHEAR) / (0.4 * b)
    const sMax = Math.min(0.75 * d, 300)
    const sMid0 = Math.max(75, floorTo(Math.min(sMax, sMinSteel), 25))
    if (inp.seismicDetailing) {
      const Vg = (inp.wDLv + r.self + inp.wLLv) * (clear / 2)
      const Ve = Math.max(r.Vu, 1.2 * Vg + (1.4 * (capHogL + capSag)) / clear) // IS 13920 cl 6.3.3 capacity-based shear
      const sShear = (0.87 * FY_SHEAR * Asv * d) / (Ve * 1000)
      const sRule = Math.max(100, Math.min(d / 4, 8 * Math.min(bot.phi, hangPhi))) // IS 13920 cl 6.3.5
      sEnd = floorTo(Math.min(sShear, sRule), 25)
      sMid = Math.max(100, floorTo(Math.min(d / 2, sMid0), 25))
      zone = 2 * d
      if (sEnd >= 100) break
      sEnd = 100
    } else {
      const Vc = tauCv * b * d
      const Vus = r.Vu * 1000 - Vc
      const sShear = Vus > 0 ? (0.87 * FY_SHEAR * Asv * d) / Vus : 1e9
      sEnd = Math.max(75, floorTo(Math.min(sShear, sMax, sMinSteel), 25))
      sMid = sMid0
      zone = Vus > 0 ? Math.min(cl / 2, Math.max(d, (cl / 2) * (1 - Vc / (r.Vu * 1000)))) : 0
      if (zone === 0) sEnd = sMid
      if (sShear >= 75) break
    }
  }
  const nStir = countStirrups(cl, zone, sEnd, sMid)
  const stirrupLen = stirrupCutLength(b - 50, D - 50, phiS)
  kg += book.add(group, phiS, stirrupLen, nStir)

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
  }
}
