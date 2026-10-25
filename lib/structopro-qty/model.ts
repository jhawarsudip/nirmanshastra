// StructurePro quantity model: from a handful of layman answers to a code-based structural take-off.
// Pipeline: grid layout -> loads -> equivalent static seismic forces -> beams -> columns -> footings -> slabs -> stairs -> bar schedules -> materials.
// Every constant is tagged in codes.ts / materials.ts. Anything not read from a code is listed in `assumptions` in the result.

import { COVER_COLUMN, FY, GAMMA_RC, Zone } from './codes'
import { beamCoeffs, designBeam } from './beam'
import { ColumnCase, ColumnDesign, addColumnSteel, chooseColumn, columnLap } from './column'
import { designIsolatedFooting, designRaft, FootingResult, RaftResult } from './footing'
import {
  BeamRec,
  Ctx,
  Lateral,
  STILT_FACTOR,
  Weights,
  assignBeamSeismic,
  bayLoad,
  buildBeams,
  lateralAnalysis,
  seismicWeights,
} from './frame'
import { Grade, Exposure, T5_RCC, gradeNumber, mixFor } from './materials'
import { SQFT_TO_M2, balconySlots, balconyThicknessMm, buildPlan, llReduction, nodeExists, reactionShare } from './plan'
import { designBalconies, type BalconyOut } from './balcony'
import { basicWindSpeed, type WindSpeed } from './wind'
import { designPanel, slabThickness } from './slab'
import { designStair } from './stair'
import { secondaryItems } from './secondary'
import { SteelBook } from './steel'
import { stirrupCutLength } from './codes'
import { seismicZoneFor } from './zones'
import { SITE, type SiteParams } from './sites'
import type {
  BeamSchedule,
  ColumnSchedule,
  GeoBeam,
  GeoColumn,
  GeoFooting,
  GeoSlab,
  Geometry,
  MemberTotals,
  QtyError,
  QtyInput,
  QtyResult,
  SiteCondition,
  StiltResult,
  WindResult,
} from './types'

const HS = 3.0 // m, floor to floor. ASSUMPTION: usual residential storey height
const PLINTH = 0.45 // m above ground. ASSUMPTION
const STEEL_BUY = 1.05 // CPWD DAR 5.22.1: 5 % wastage on reinforcement
const BINDING_WIRE_PER_TONNE = 9 // kg per tonne of steel: derived upper bound from the CPWD cost lines (about 0.9 kg per 100 kg)
const SITE_WASTAGE = 1.03 // concrete materials: spillage and over-break. ASSUMPTION

const EXPOSURE_ORDER: Exposure[] = ['mild', 'moderate', 'severe', 'very_severe', 'extreme']
const maxExposure = (a: Exposure, b: Exposure): Exposure => (EXPOSURE_ORDER.indexOf(a) >= EXPOSURE_ORDER.indexOf(b) ? a : b)
const maxGrade = (a: Grade, b: Grade): Grade => (gradeNumber(a) >= gradeNumber(b) ? a : b)

/** Smallest column side by floors carried: the Build Reference lower bounds (230 / 300 / 350 / 400). */
const minSideFor = (floorsCarried: number): number => (floorsCarried <= 1 ? 230 : floorsCarried === 2 ? 300 : floorsCarried === 3 ? 350 : 400)

interface ColRec {
  k: number
  ix: number
  iy: number
  type: 'corner' | 'edge' | 'interior'
  des: ColumnDesign
  Pser: number // kN
  Pu: number // kN
  lenM: number // concrete length, m
  zBottom: number
  barLenMm: number
  ties: string
}

const mk = (c = 0, s = 0, f = 0, n = 0): MemberTotals => ({ concreteM3: c, steelKg: s, formworkM2: f, count: n })

export function runQuantityModel(input: QtyInput): QtyResult | QtyError {
  try {
    return run(input)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'The quantity model could not complete this input.' }
  }
}

function run(input: QtyInput): QtyResult {
  const areasSqft = (input.floorAreasSqft ?? []).map(Number)
  if (areasSqft.length < 1 || areasSqft.length > 10) throw new Error('Floors must be between 1 and 10.')
  if (areasSqft.some((a) => !Number.isFinite(a) || a < 100 || a > 30000)) throw new Error('Each floor area must be between 100 and 30,000 sq ft.')
  const stilt = input.stilt === true
  const areas = areasSqft.map((a) => a * SQFT_TO_M2)
  // an open parking level stands under the first listed floor and has that floor's footprint; it is not counted as built-up area
  const planAreas = stilt ? [areas[0], ...areas] : areas
  const F = planAreas.length
  const nBal = Math.round(Number(input.balconies ?? 0))
  if (!Number.isFinite(nBal) || nBal < 0 || nBal > 4) throw new Error('Balconies per floor must be between 0 and 4.')
  const lcAsked = Number(input.balconyDepthM ?? 1.2)
  if (![1.0, 1.2, 1.5].includes(lcAsked)) throw new Error('A balcony may project 1.0, 1.2 or 1.5 m.')

  const siteKey: SiteCondition = input.site ?? 'flat'
  const site = SITE[siteKey] ?? SITE.flat
  const zr = input.zoneOverride
    ? { zone: input.zoneOverride as Zone, basis: 'town' as const, note: `Zone ${input.zoneOverride} set by the user.` }
    : seismicZoneFor(input.state, input.city)
  const seismic = zr.zone !== 'II'
  const wallType = input.wall ?? 'brick'
  const exposure = site.exposure
  const exposureBelow = maxExposure(exposure, 'moderate') // IS 456 Table 3: buried concrete is at least "moderate"
  const gradeAbove: Grade = input.gradeOverride ?? maxGrade(T5_RCC[exposure].minGrade, F >= 4 ? 'M25' : 'M20')
  const gradeBelow: Grade = input.gradeOverride ?? maxGrade(gradeAbove, T5_RCC[exposureBelow].minGrade)
  const fck = gradeNumber(gradeAbove)
  const fckBelow = gradeNumber(gradeBelow)

  let aspect = 1.3
  if (input.plotLengthFt && input.plotWidthFt && input.plotLengthFt > 0 && input.plotWidthFt > 0) {
    aspect = Math.min(2, Math.max(1, Math.max(input.plotLengthFt, input.plotWidthFt) / Math.min(input.plotLengthFt, input.plotWidthFt)))
  }
  const plan = buildPlan(planAreas, aspect, HS, PLINTH)
  const tSlab = slabThickness(Math.min(plan.sx, plan.sy), plan.nx > 1 || plan.ny > 1)
  const slots = nBal > 0 ? balconySlots(plan, nBal) : []
  const vb = basicWindSpeed(input.state, input.city)
  const ctx: Ctx = {
    plan,
    zone: zr.zone,
    seismic,
    tSlab,
    bBeam: wallType === 'brick' ? 230 : 200,
    wallT: wallType === 'brick' ? 0.23 : 0.2,
    wallGamma: wallType === 'brick' ? 18.85 : 14.0,
    terraceLL: input.terraceAccess === false ? 0.75 : 1.5,
    fck,
    stilt,
    windVb: vb.vb,
    terrain: 2,
    balcony: slots.length ? { slots, lc: lcAsked, tMm: balconyThicknessMm(lcAsked) } : null,
  }

  let hint: Weights | null = null
  let out = analyse(ctx, siteKey, site, fck, fckBelow, hint)
  hint = out.weightsActual
  out = analyse(ctx, siteKey, site, fck, fckBelow, hint)

  return assemble(input, ctx, site, siteKey, zr, exposure, exposureBelow, gradeAbove, gradeBelow, out, areasSqft, wallType, { vb, nBal })
}

// ---------------------------------------------------------------------------------------------------------------------------

interface Analysis {
  beams: BeamRec[][]
  book: SteelBook
  cols: ColRec[]
  footings: Map<string, FootingResult>
  raft: RaftResult | null
  lat: Lateral
  weightsActual: Weights
  warnings: string[]
  plinth: { concrete: number; formwork: number; count: number }
  stair: ReturnType<typeof designStair>
  panelNotes: string[]
  slabVol: number[]
  slabForm: number[]
  balcony: BalconyOut | null
}

function analyse(ctx: Ctx, siteKey: SiteCondition, site: SiteParams, fck: number, fckBelow: number, hint: Weights | null): Analysis {
  const { plan } = ctx
  const F = plan.F
  const warnings: string[] = []
  const book = new SteelBook()
  const beams = buildBeams(ctx)

  // ---- estimates for the first pass of weights ----
  const colEst = (k: number) => Math.max(300, minSideFor(F - k))
  const dEst = (r: BeamRec) => Math.max(300, Math.ceil((r.L * 1000) / 13 / 25) * 25)
  const selfEst = (r: BeamRec) => (GAMMA_RC * (ctx.bBeam / 1000) * Math.max(0, dEst(r) - ctx.tSlab)) / 1000
  const nodesAt = (k: number) => (plan.floors[k].nx + 1) * (plan.floors[k].ny + 1)
  const colWEst = (k: number) => nodesAt(k) * GAMMA_RC * Math.pow(colEst(k) / 1000, 2) * plan.hs
  const w = hint ?? seismicWeights(ctx, beams, selfEst, colWEst)
  const lat = lateralAnalysis(ctx, w)
  assignBeamSeismic(ctx, beams, lat)

  // ---- beams ----
  for (const f of plan.floors) {
    const col = colEst(f.k)
    for (const r of beams[f.k]) {
      r.des = designBeam(
        {
          spanC: r.L,
          colL: col,
          colR: col,
          b: ctx.bBeam,
          tSlab: ctx.tSlab,
          wDL: r.mDL,
          wLL: r.mLL,
          wDLv: r.vDL,
          wLLv: r.vLL,
          nSpans: r.n,
          spanIndex: r.i,
          MEL: r.ME0,
          MER: r.ME1,
          fck: ctx.fck,
          seismicDetailing: ctx.seismic,
        },
        book,
        `beam:${f.k}`
      )
      if (r.des.warn && !warnings.includes(r.des.warn)) warnings.push(r.des.warn)
    }
  }
  // index beams: x[k][iy][i], y[k][ix][i]
  const xb: BeamRec[][][] = []
  const yb: BeamRec[][][] = []
  for (const f of plan.floors) {
    xb[f.k] = Array.from({ length: f.ny + 1 }, () => [] as BeamRec[])
    yb[f.k] = Array.from({ length: f.nx + 1 }, () => [] as BeamRec[])
    for (const r of beams[f.k]) {
      if (r.dir === 'x') xb[f.k][r.iy][r.i] = r
      else yb[f.k][r.ix][r.i] = r
    }
  }
  const totalLoad = (r: BeamRec) => ({ dl: (r.vDL + (r.des?.selfWeight ?? 0)) * r.L, ll: r.vLL * r.L })
  const reactions = (k: number, ix: number, iy: number) => {
    let dl = 0
    let ll = 0
    const f = plan.floors[k]
    if (ix >= 1) {
      const r = xb[k][iy][ix - 1]
      if (r) {
        const s = reactionShare(r.n, r.i).right
        const t = totalLoad(r)
        dl += s * t.dl
        ll += s * t.ll
      }
    }
    if (ix < f.nx) {
      const r = xb[k][iy][ix]
      if (r) {
        const s = reactionShare(r.n, r.i).left
        const t = totalLoad(r)
        dl += s * t.dl
        ll += s * t.ll
      }
    }
    if (iy >= 1) {
      const r = yb[k][ix][iy - 1]
      if (r) {
        const s = reactionShare(r.n, r.i).right
        const t = totalLoad(r)
        dl += s * t.dl
        ll += s * t.ll
      }
    }
    if (iy < f.ny) {
      const r = yb[k][ix][iy]
      if (r) {
        const s = reactionShare(r.n, r.i).left
        const t = totalLoad(r)
        dl += s * t.dl
        ll += s * t.ll
      }
    }
    return { dl, ll }
  }
  // service-level unbalanced beam moment at a joint (kN.m): about the y axis from x-beams, about the x axis from y-beams
  const unbalanced = (k: number, ix: number, iy: number) => {
    const f = plan.floors[k]
    const m = (r: BeamRec, end: 'L' | 'R') => {
      const c = beamCoeffs(r.n, r.i)
      const wTot = r.mDL + (r.des?.selfWeight ?? 0) + r.mLL
      return (end === 'L' ? c.cL : c.cR) * wTot * r.L * r.L
    }
    let my = 0
    const a = ix >= 1 ? xb[k][iy][ix - 1] : undefined
    const b = ix < f.nx ? xb[k][iy][ix] : undefined
    if (a && b) my = Math.abs(m(a, 'R') - m(b, 'L'))
    else if (a) my = m(a, 'R')
    else if (b) my = m(b, 'L')
    let mx = 0
    const c = iy >= 1 ? yb[k][ix][iy - 1] : undefined
    const d = iy < f.ny ? yb[k][ix][iy] : undefined
    if (c && d) mx = Math.abs(m(c, 'R') - m(d, 'L'))
    else if (c) mx = m(c, 'R')
    else if (d) mx = m(d, 'L')
    return { mx, my }
  }
  const capSum = (k: number, ix: number, iy: number) => {
    // sum of beam moments of resistance at a joint, per column axis (kN.m)
    const f = plan.floors[k]
    const cap = (r: BeamRec | undefined, end: 'L' | 'R') => {
      if (!r?.des) return { hog: 0, sag: 0 }
      return end === 'L' ? { hog: r.des.capHogL, sag: r.des.capSagL } : { hog: r.des.capHogR, sag: r.des.capSagR }
    }
    const pair = (a: { hog: number; sag: number }, b: { hog: number; sag: number } | null) =>
      b ? Math.max(a.hog + b.sag, a.sag + b.hog) : Math.max(a.hog, a.sag)
    const xa = ix >= 1 ? cap(xb[k][iy][ix - 1], 'R') : null
    const xbn = ix < f.nx ? cap(xb[k][iy][ix], 'L') : null
    const ya = iy >= 1 ? cap(yb[k][ix][iy - 1], 'R') : null
    const ybn = iy < f.ny ? cap(yb[k][ix][iy], 'L') : null
    const sumX = xa && xbn ? pair(xa, xbn) : xa ? pair(xa, null) : xbn ? pair(xbn, null) : 0
    const sumY = ya && ybn ? pair(ya, ybn) : ya ? pair(ya, null) : ybn ? pair(ybn, null) : 0
    return { aboutY: sumX, aboutX: sumY }
  }

  // ---- column load take-down (top storey first) ----
  interface NodeLoad {
    Pdl: number
    Pll: number
    cases: ColumnCase[]
    type: 'corner' | 'edge' | 'interior'
  }
  const loads = new Map<string, NodeLoad>()
  const run = new Map<string, { dl: number; ll: number; n: number }>()
  const unsupported = plan.hs * 1000 - 400
  for (let k = F - 1; k >= 0; k--) {
    const f = plan.floors[k]
    for (let ix = 0; ix <= f.nx; ix++) {
      for (let iy = 0; iy <= f.ny; iy++) {
        const key = `${k}:${ix}:${iy}`
        const nk = `${ix}:${iy}`
        const prev = run.get(nk) ?? { dl: 0, ll: 0, n: 0 }
        const re = reactions(k, ix, iy)
        const wc = GAMMA_RC * Math.pow(colEst(k) / 1000, 2) * plan.hs
        const dl = prev.dl + re.dl + wc
        const ll = prev.ll + re.ll
        const n = prev.n + 1
        run.set(nk, { dl, ll, n })
        const Pdl = dl
        const Pll = ll * (1 - llReduction(n))
        // gravity moments at the joints above and below (service), kN.m
        const top = unbalanced(k, ix, iy)
        const topShare = k < F - 1 && nodeExists(plan.floors[k + 1], ix, iy) ? 0.5 : 1
        const bot = k >= 1 ? unbalanced(k - 1, ix, iy) : { mx: 0, my: 0 }
        const Mgx = Math.max(topShare * top.mx, 0.5 * bot.mx)
        const Mgy = Math.max(topShare * top.my, 0.5 * bot.my)
        const MEx = lat.colM('y', k, ix, iy) // lateral load along y bends the column about the x axis
        const MEy = lat.colM('x', k, ix, iy)
        const rD = 0.75 // dead share of the gravity moment
        const kN = 1e3
        const kNm = 1e6
        const D = Pdl
        const L = Pll
        const cases: ColumnCase[] = [
          { Pu: 1.5 * (D + L) * kN, Mx: 1.5 * Mgx * kNm, My: 1.5 * Mgy * kNm },
          { Pu: 1.2 * (D + L) * kN, Mx: 1.2 * (Mgx + MEx) * kNm, My: 1.2 * (Mgy + 0.3 * MEy) * kNm },
          { Pu: 1.2 * (D + L) * kN, Mx: 1.2 * (Mgx + 0.3 * MEx) * kNm, My: 1.2 * (Mgy + MEy) * kNm },
          { Pu: 1.5 * D * kN, Mx: 1.5 * (rD * Mgx + MEx) * kNm, My: 1.5 * (rD * Mgy + 0.3 * MEy) * kNm },
          { Pu: 1.5 * D * kN, Mx: 1.5 * (rD * Mgx + 0.3 * MEx) * kNm, My: 1.5 * (rD * Mgy + MEy) * kNm },
          { Pu: 0.9 * D * kN, Mx: (1.5 * MEx + 0.9 * rD * Mgx) * kNm, My: (1.5 * 0.3 * MEy + 0.9 * rD * Mgy) * kNm },
          { Pu: 0.9 * D * kN, Mx: (1.5 * 0.3 * MEx + 0.9 * rD * Mgx) * kNm, My: (1.5 * MEy + 0.9 * rD * Mgy) * kNm },
        ]
        if (ctx.seismic) {
          // IS 13920 strong-column weak-beam: sum of column moments of resistance >= 1.1 x sum of beam moments of resistance (joints below the roof)
          const topCap = k < F - 1 && nodeExists(plan.floors[k + 1], ix, iy) ? capSum(k, ix, iy) : { aboutX: 0, aboutY: 0 }
          const botCap = k >= 1 ? capSum(k - 1, ix, iy) : { aboutX: 0, aboutY: 0 }
          const reqX = 0.55 * Math.max(topCap.aboutX, botCap.aboutX)
          const reqY = 0.55 * Math.max(topCap.aboutY, botCap.aboutY)
          if (reqX > 0) cases.push({ Pu: 1.2 * (D + L) * kN, Mx: reqX * kNm, My: 0 })
          if (reqY > 0) cases.push({ Pu: 1.2 * (D + L) * kN, Mx: 0, My: reqY * kNm })
        }
        const onX = ix === 0 || ix === f.nx
        const onY = iy === 0 || iy === f.ny
        loads.set(key, { Pdl, Pll, cases, type: onX && onY ? 'corner' : onX || onY ? 'edge' : 'interior' })
      }
    }
  }

  // ---- column design (ground storey first, so a constant size can be carried upward) ----
  const cache = new Map<string, ColumnDesign>()
  const groupStart = (k: number) => (F <= 3 ? 0 : k - (k % 2))
  const desByKey = new Map<string, ColumnDesign>()
  for (let k = 0; k < F; k++) {
    const f = plan.floors[k]
    for (let ix = 0; ix <= f.nx; ix++) {
      for (let iy = 0; iy <= f.ny; iy++) {
        const ld = loads.get(`${k}:${ix}:${iy}`)!
        const gs = groupStart(k)
        const fixed = k > gs ? desByKey.get(`${gs}:${ix}:${iy}`) : undefined
        const below = k > 0 ? desByKey.get(`${k - 1}:${ix}:${iy}`) : undefined
        const minSide = Math.max(minSideFor(F - k), 230, ctx.stilt && k === 0 ? 300 : 0) // an open parking storey: 300 mm at least
        const ck =
          [k, ld.type, minSide, fixed ? `${fixed.b}x${fixed.D}` : '-']
            .concat(ld.cases.map((c) => `${Math.round(c.Pu / 5000)},${Math.round(c.Mx / 5e5)},${Math.round(c.My / 5e5)}`))
            .join('|')
        let d = cache.get(ck)
        if (!d) {
          d = chooseColumn({
            minSide,
            fck: ctx.fck,
            cases: ld.cases,
            unsupported,
            fixed: fixed ? { b: fixed.b, D: fixed.D } : undefined,
            atLeast: below && k > gs ? undefined : undefined,
          })
          cache.set(ck, d)
        }
        desByKey.set(`${k}:${ix}:${iy}`, d)
      }
    }
  }

  // ---- foundation ----
  const g0 = plan.floors[0]
  const footings = new Map<string, FootingResult>()
  let raft: RaftResult | null = null
  const fcDesigns: { ix: number; iy: number; ld: NodeLoad; d: ColumnDesign }[] = []
  for (let ix = 0; ix <= g0.nx; ix++) {
    for (let iy = 0; iy <= g0.ny; iy++) {
      fcDesigns.push({ ix, iy, ld: loads.get(`0:${ix}:${iy}`)!, d: desByKey.get(`0:${ix}:${iy}`)! })
    }
  }
  let useRaft = site.raft
  const trialBook = new SteelBook()
  if (!useRaft) {
    let cover = 0
    for (const c of fcDesigns) {
      const fr = designIsolatedFooting(
        { PuKN: 1.5 * (c.ld.Pdl + c.ld.Pll), PserKN: c.ld.Pdl + c.ld.Pll, colB: c.d.b, colD: c.d.D, sbc: site.sbc, fck: fckBelow },
        trialBook,
        'trial'
      )
      cover += fr.Lf * fr.Bf
      if (fr.Lf > plan.sx - 0.3 || fr.Bf > plan.sy - 0.3) useRaft = true
    }
    if (cover > 0.5 * plan.L * plan.W) useRaft = true
  }
  if (useRaft) {
    const totalPu = fcDesigns.reduce((s, c) => s + 1.5 * (c.ld.Pdl + c.ld.Pll), 0)
    const maxPu = fcDesigns.reduce((m, c) => Math.max(m, 1.5 * (c.ld.Pdl + c.ld.Pll)), 0)
    const colMin = fcDesigns.reduce((m, c) => Math.min(m, c.d.b, c.d.D), 1e9)
    raft = designRaft(
      { lengthM: plan.floors[0].nx * plan.sx, widthM: plan.floors[0].ny * plan.sy, totalPuKN: totalPu, maxColPuKN: maxPu, colMin, maxSpan: Math.max(plan.sx, plan.sy), fck: fckBelow },
      book,
      'footing'
    )
    warnings.push('The soil or load calls for a raft foundation. The raft figures are indicative; a soil test and a structural engineer must confirm the foundation.')
  } else {
    for (const c of fcDesigns) {
      const fr = designIsolatedFooting(
        { PuKN: 1.5 * (c.ld.Pdl + c.ld.Pll), PserKN: c.ld.Pdl + c.ld.Pll, colB: c.d.b, colD: c.d.D, sbc: site.sbc, fck: fckBelow },
        book,
        'footing'
      )
      footings.set(`${c.ix}:${c.iy}`, fr)
    }
  }
  if (siteKey === 'bcs') warnings.push('Black cotton soil: an under-reamed pile or a deeper raft is normally specified. The foundation quantities here are indicative only.')

  // ---- columns: concrete lengths, bars, ties ----
  const cols: ColRec[] = []
  const z0 = plan.floors[0].zTop
  for (let k = 0; k < F; k++) {
    const f = plan.floors[k]
    for (let ix = 0; ix <= f.nx; ix++) {
      for (let iy = 0; iy <= f.ny; iy++) {
        const ld = loads.get(`${k}:${ix}:${iy}`)!
        const d = desByKey.get(`${k}:${ix}:${iy}`)!
        let zBottom: number
        let embed = 0
        if (k === 0) {
          const fr = footings.get(`${ix}:${iy}`)
          const tf = raft ? raft.tMm : fr!.depth
          zBottom = -site.depth + 0.1 + tf / 1000
          embed = tf - 75 + 300 - 3 * d.cfg.phi
        } else {
          zBottom = plan.floors[k - 1].zTop
        }
        const topSlab = f.zTop
        const lenM = topSlab - ctx.tSlab / 1000 - zBottom
        const lap = columnLap(d.cfg.phi, ctx.fck, ctx.seismic)
        const straight = (topSlab - zBottom) * 1000
        const tail = k < F - 1 ? lap : 9 * d.cfg.phi - COVER_COLUMN
        const barLenMm = straight + (k === 0 ? embed : 0) + tail
        const ties = addColumnSteel(book, `col:${k}`, d, ctx.fck, { seismic: ctx.seismic, clearHeight: lenM * 1000, beamDepth: 400, fullHeight: ctx.stilt && ctx.seismic && k === 0 }, barLenMm, 1)
        cols.push({ k, ix, iy, type: ld.type, des: d, Pser: ld.Pdl + ld.Pll, Pu: 1.5 * (ld.Pdl + ld.Pll), lenM, zBottom, barLenMm, ties })
        if (d.asPercent > 3.9) {
          const msg = 'A heavily loaded column reached the 4 % steel limit: a larger section or higher grade of concrete would normally be chosen by the engineer.'
          if (!warnings.includes(msg)) warnings.push(msg)
        }
      }
    }
  }

  // ---- plinth beams (and footing ties in Zones IV and V) ----
  const plinthB = ctx.bBeam
  let plinthConcrete = 0
  let plinthForm = 0
  let plinthCount = 0
  {
    const f = plan.floors[0]
    const ties = ctx.zone === 'IV' || ctx.zone === 'V' ? 2 : 1 // second set = footing ties, IS 1893
    const phi = ctx.zone === 'IV' || ctx.zone === 'V' ? 16 : 12
    const linkPhi = ctx.seismic ? 8 : 6 // Zone II: 6 mm links (a coil), IS 456
    const addLine = (L: number, colAlong: number) => {
      const D = L > 4.2 ? 375 : 300
      const clear = L - colAlong / 1000
      for (let t = 0; t < ties; t++) {
        book.add('plinth', phi, L * 1000, 4)
        const n = Math.ceil((clear * 1000) / 150) + 1
        book.add('plinth', linkPhi, stirrupCutLength(plinthB - 50, D - 50, linkPhi), n)
        plinthConcrete += (plinthB / 1000) * (D / 1000) * clear
        plinthForm += (plinthB / 1000 + (2 * D) / 1000) * clear
        plinthCount++
      }
    }
    for (let iy = 0; iy <= f.ny; iy++) for (let ix = 0; ix < f.nx; ix++) addLine(plan.sx, desByKey.get(`0:${ix}:${iy}`)!.b)
    for (let ix = 0; ix <= f.nx; ix++) for (let iy = 0; iy < f.ny; iy++) addLine(plan.sy, desByKey.get(`0:${ix}:${iy}`)!.D)
  }

  // ---- slabs ----
  const stair = designStair(F, plan.hs, ctx.fck, book, 'stair')
  const slabVol: number[] = []
  const slabForm: number[] = []
  const panelNotes: string[] = []
  for (const f of plan.floors) {
    for (let ix = 0; ix < f.nx; ix++) {
      for (let iy = 0; iy < f.ny; iy++) {
        const bl = bayLoad(ctx, f.k, ix, iy)
        const res = designPanel(
          {
            sx: plan.sx,
            sy: plan.sy,
            edge: { W: ix > 0, E: ix < f.nx - 1, S: iy > 0, N: iy < f.ny - 1 },
            t: ctx.tSlab,
            wu: 1.5 * (bl.dl + bl.ll),
            fck: ctx.fck,
            beamB: ctx.bBeam,
          },
          book,
          `slab:${f.k}`
        )
        if (f.k === 0 && ix === 0 && iy === 0) panelNotes.push(res.note)
      }
    }
    const well = f.k < F - 1 ? Math.min(stair.wellAreaM2, 0.12 * f.nx * f.ny * plan.sx * plan.sy) : 0
    slabVol[f.k] = (f.nx * plan.sx * f.ny * plan.sy - well) * (ctx.tSlab / 1000)
    // steel around the stairwell is trimmed by the same share
    if (well > 0) book.scale(`slab:${f.k}`, 1 - (0.85 * well) / (f.nx * plan.sx * f.ny * plan.sy))
    slabForm[f.k] = f.nx * plan.sx * f.ny * plan.sy - well + (well > 0 ? 2 * (stair.wellLengthM + stair.wellWidthM) * (ctx.tSlab / 1000) : 0)
  }

  const balcony = designBalconies(ctx, book)

  // actual weights for the second pass
  const colWActual = (k: number) => {
    let s = 0
    for (const c of cols) if (c.k === k) s += GAMMA_RC * (c.des.b / 1000) * (c.des.D / 1000) * plan.hs
    return s
  }
  const weightsActual = seismicWeights(ctx, beams, (r) => r.des?.selfWeight ?? selfEst(r), colWActual)

  return { beams, book, cols, footings, raft, lat, weightsActual, warnings, plinth: { concrete: plinthConcrete, formwork: plinthForm, count: plinthCount }, stair, panelNotes, slabVol, slabForm, balcony }
}

// ---------------------------------------------------------------------------------------------------------------------------

function assemble(
  input: QtyInput,
  ctx: Ctx,
  site: SiteParams,
  siteKey: SiteCondition,
  zr: { zone: Zone; basis: 'town' | 'state_typical' | 'state_default'; note: string },
  exposure: Exposure,
  exposureBelow: Exposure,
  gradeAbove: Grade,
  gradeBelow: Grade,
  a: Analysis,
  areasSqft: number[],
  wallType: string,
  meta: { vb: WindSpeed; nBal: number }
): QtyResult {
  const { plan } = ctx
  const F = plan.F
  const { book } = a
  const warnings = [...a.warnings]
  const tS = ctx.tSlab / 1000

  // floor-level corrections for floors whose bays do not add up to the entered area
  for (const f of plan.floors) {
    book.scale(`beam:${f.k}`, f.scale)
  }
  const slabScale = (k: number) => plan.floors[k].scale
  for (const f of plan.floors) book.scale(`slab:${f.k}`, slabScale(f.k))

  // beam concrete and formwork
  const beamVol: number[] = new Array(F).fill(0)
  const beamForm: number[] = new Array(F).fill(0)
  const beamCount: number[] = new Array(F).fill(0)
  const colAt = (k: number, ix: number, iy: number) => a.cols.find((c) => c.k === k && c.ix === ix && c.iy === iy)!.des
  for (const f of plan.floors) {
    for (const r of a.beams[f.k]) {
      const d = r.des!
      const ex = r.dir === 'x' ? r.ix + 1 : r.ix
      const ey = r.dir === 'x' ? r.iy : r.iy + 1
      const c0 = colAt(f.k, r.ix, r.iy)
      const c1 = colAt(f.k, ex, ey)
      const along = r.dir === 'x' ? (c0.b + c1.b) / 2 : (c0.D + c1.D) / 2
      const clear = r.L - along / 1000
      const depthBelow = (d.D - ctx.tSlab) / 1000
      beamVol[f.k] += (ctx.bBeam / 1000) * depthBelow * clear * f.scale
      beamForm[f.k] += (ctx.bBeam / 1000 + 2 * depthBelow) * clear * f.scale
      beamCount[f.k] += 1
    }
  }

  // columns
  let colVolAbove = 0
  let colVolBelow = 0
  let colForm = 0
  for (const c of a.cols) {
    const v = (c.des.b / 1000) * (c.des.D / 1000) * c.lenM
    colForm += (2 * (c.des.b + c.des.D) / 1000) * c.lenM
    if (c.k === 0 && c.zBottom < 0) {
      const bg = Math.min(c.lenM, -c.zBottom)
      colVolBelow += (c.des.b / 1000) * (c.des.D / 1000) * bg
      colVolAbove += v - (c.des.b / 1000) * (c.des.D / 1000) * bg
    } else colVolAbove += v
  }

  // footings / raft, PCC, excavation
  let footVol = 0
  let footForm = 0
  let pcc = 0
  let pits = 0
  const gFoot: GeoFooting[] = []
  const dep = site.depth
  if (a.raft) {
    footVol = a.raft.concreteM3
    footForm = a.raft.formworkM2
    pcc = a.raft.pccM3
    pits = (a.raft.x1 - a.raft.x0 + 1.4) * (a.raft.y1 - a.raft.y0 + 1.4) * dep
  } else {
    for (const [key, fr] of a.footings) {
      const [ix, iy] = key.split(':').map(Number)
      footVol += fr.concreteM3
      footForm += fr.formworkM2
      pcc += fr.pccM3
      pits += (fr.Lf + 1.4) * (fr.Bf + 1.4) * dep
      const c = colAt(0, ix, iy)
      gFoot.push({
        x: ix * plan.sx,
        y: iy * plan.sy,
        size: Math.max(fr.Lf, fr.Bf),
        depth: fr.depth / 1000,
        colB: c.b / 1000,
        colD: c.D / 1000,
        top: -dep + 0.1 + fr.depth / 1000,
        bottom: -dep + 0.1,
      })
    }
    const mat = (plan.floors[0].nx * plan.sx + 1.4) * (plan.floors[0].ny * plan.sy + 1.4) * dep
    pits = Math.min(pits, mat)
  }

  const slabV = a.slabVol.reduce((s, v, k) => s + v * slabScale(k), 0)
  // slab soffit: plate area less the beam and column footprints
  let slabF = 0
  for (const f of plan.floors) {
    const k = f.k
    const plate = a.slabForm[k]
    const beamFoot = a.beams[k].reduce((s, r) => s + (ctx.bBeam / 1000) * (r.L - 0.3), 0)
    const colFoot = a.cols.filter((c) => c.k === k).reduce((s, c) => s + (c.des.b / 1000) * (c.des.D / 1000), 0)
    slabF += Math.max(0, plate * f.scale - beamFoot * f.scale - colFoot)
  }
  const beamV = beamVol.reduce((s, v) => s + v, 0)
  const beamF = beamForm.reduce((s, v) => s + v, 0)

  // lintels, sunshades, parapet band and stair head-room: counted, not allowed for as a percentage
  const sec = secondaryItems({
    plan,
    wallT: ctx.wallT,
    terraceAccess: input.terraceAccess !== false,
    wellLengthM: a.stair.wellLengthM,
    wellWidthM: a.stair.wellWidthM,
    book,
    stilt: ctx.stilt,
  })
  const allowConcrete = sec.concreteM3
  const allowSteel = sec.steelKg
  const allowForm = sec.formworkM2
  const bal = a.balcony
  const balConc = bal?.concreteM3 ?? 0
  const balForm = bal?.formworkM2 ?? 0

  // steel by member family
  const sFooting = book.group('footing')
  const sPlinth = book.group('plinth')
  const sCols = book.group('col:')
  const sBeams = book.group('beam:')
  const sSlabs = book.group('slab:')
  const sStair = book.group('stair')

  const stairForm = a.stair.formworkM2
  const stairVol = a.stair.concreteM3

  // concrete by grade
  const volBelow = footVol + a.plinth.concrete + colVolBelow
  const volAbove = colVolAbove + beamV + slabV + stairVol + allowConcrete + balConc
  const totalConcrete = volBelow + volAbove
  const steelNet = book.total()
  const steelBuy = steelNet * STEEL_BUY
  const binding = (steelNet / 1000) * BINDING_WIRE_PER_TONNE
  const formwork = colForm + beamF + slabF + footForm + a.plinth.formwork + stairForm + allowForm + balForm

  const mixA = mixFor(gradeAbove, exposure)
  const mixB = mixFor(gradeBelow, exposureBelow)
  const mixP = mixFor('M7.5', 'mild')
  const kgToBags = (kg: number) => kg / 50
  const cementBags = (volAbove * mixA.cementKg + volBelow * mixB.cementKg + pcc * mixP.cementKg) / 50
  const sandM3 = volAbove * mixA.sandM3 + volBelow * mixB.sandM3 + pcc * mixP.sandM3
  const aggM3 = volAbove * mixA.aggregateM3 + volBelow * mixB.aggregateM3 + pcc * mixP.aggregateM3
  void kgToBags
  const W = SITE_WASTAGE
  const M3_TO_CFT = 35.3147

  const byPhiOut: Record<number, number> = { ...book.byPhi() }
  const steelByDiameter = Object.entries(byPhiOut)
    .map(([phi, kg]) => ({ phi: Number(phi), kg: kg * STEEL_BUY }))
    .sort((p, q) => p.phi - q.phi)

  // ---- geometry for the 3D view ----
  const gCols: GeoColumn[] = a.cols.map((c) => ({
    x: c.ix * plan.sx,
    y: c.iy * plan.sy,
    storey: c.k,
    z0: c.zBottom,
    z1: plan.floors[c.k].zTop - tS,
    b: c.des.b / 1000,
    d: c.des.D / 1000,
  }))
  const gBeams: GeoBeam[] = []
  for (const f of plan.floors) {
    for (const r of a.beams[f.k]) {
      const ex = r.dir === 'x' ? r.ix + 1 : r.ix
      const ey = r.dir === 'x' ? r.iy : r.iy + 1
      gBeams.push({ x0: r.ix * plan.sx, y0: r.iy * plan.sy, x1: ex * plan.sx, y1: ey * plan.sy, floor: f.k, zTop: f.zTop, b: ctx.bBeam / 1000, depth: r.des!.D / 1000 })
    }
  }
  {
    const f = plan.floors[0]
    for (let iy = 0; iy <= f.ny; iy++) for (let ix = 0; ix < f.nx; ix++) gBeams.push({ x0: ix * plan.sx, y0: iy * plan.sy, x1: (ix + 1) * plan.sx, y1: iy * plan.sy, floor: -1, zTop: plan.plinth, b: ctx.bBeam / 1000, depth: 0.3 })
    for (let ix = 0; ix <= f.nx; ix++) for (let iy = 0; iy < f.ny; iy++) gBeams.push({ x0: ix * plan.sx, y0: iy * plan.sy, x1: ix * plan.sx, y1: (iy + 1) * plan.sy, floor: -1, zTop: plan.plinth, b: ctx.bBeam / 1000, depth: 0.3 })
  }
  const gSlabs: GeoSlab[] = []
  const wl = Math.min(a.stair.wellLengthM, plan.sx - 0.25)
  const ww = Math.min(a.stair.wellWidthM, plan.sy - 0.25)
  for (const f of plan.floors) {
    for (let ix = 0; ix < f.nx; ix++) {
      for (let iy = 0; iy < f.ny; iy++) {
        const x0 = ix * plan.sx
        const y0 = iy * plan.sy
        const x1 = x0 + plan.sx
        const y1 = y0 + plan.sy
        if (ix === 0 && iy === 0 && f.k < F - 1) {
          gSlabs.push({ x0: x0 + wl, y0, x1, y1, floor: f.k, zTop: f.zTop, t: tS })
          gSlabs.push({ x0, y0: y0 + ww, x1: x0 + wl, y1, floor: f.k, zTop: f.zTop, t: tS })
        } else gSlabs.push({ x0, y0, x1, y1, floor: f.k, zTop: f.zTop, t: tS })
      }
    }
  }
  if (bal) gSlabs.push(...bal.slabs)
  const geometry: Geometry = {
    lengthM: plan.L,
    widthM: plan.W,
    xs: plan.xs,
    ys: plan.ys,
    groundLevelZ: 0,
    plinthZ: plan.plinth,
    storeyHeight: plan.hs,
    footings: gFoot,
    raft: a.raft ? { x0: a.raft.x0, y0: a.raft.y0, x1: a.raft.x1, y1: a.raft.y1, t: a.raft.tMm / 1000, z: -dep + 0.1 + a.raft.tMm / 1000 } : null,
    columns: gCols,
    beams: gBeams,
    slabs: gSlabs,
    stair: { x0: 0, y0: 0, widthM: ww, lengthM: wl, floors: F, floorHeight: plan.hs, baseZ: plan.plinth },
    mumty: input.terraceAccess === false ? null : { x0: 0, y0: 0, x1: wl + 0.23, y1: ww + 0.23, zBase: plan.floors[F - 1].zTop, height: 2.4 },
  }

  // ---- schedules ----
  const colSched = new Map<string, ColumnSchedule>()
  for (const c of a.cols) {
    const key = `${c.k}|${c.type}|${c.des.b}x${c.des.D}|${c.des.cfg.n}-${c.des.cfg.phi}`
    const cur = colSched.get(key)
    if (cur) cur.count++
    else
      colSched.set(key, {
        storey: c.k,
        type: c.type,
        count: 1,
        bMm: c.des.b,
        dMm: c.des.D,
        bars: `${c.des.cfg.n}-${c.des.cfg.phi}`,
        asPercent: Math.round(c.des.asPercent * 100) / 100,
        ties: c.ties,
      })
  }
  const beamSched = new Map<string, BeamSchedule>()
  for (const f of plan.floors) {
    for (const r of a.beams[f.k]) {
      const d = r.des!
      const key = `${f.k}|${r.perimeter ? 'ext' : 'int'}|${d.D}|${d.longitudinal}|${d.stirrup}`
      const cur = beamSched.get(key)
      if (cur) cur.count++
      else beamSched.set(key, { floor: f.k, type: r.perimeter ? 'edge beam' : 'inner beam', count: 1, bMm: ctx.bBeam, dMm: d.D, note: `${d.longitudinal}; stirrups ${d.stirrup}` })
    }
  }

  // ---- results ----
  const totalBuiltUp = areasSqft.reduce((s, v) => s + v, 0) * SQFT_TO_M2
  // an open parking level is roofed by the first-floor slab but is not built-up area: per-m2 figures use every roofed floor of the frame
  const roofedM2 = totalBuiltUp + (ctx.stilt ? plan.floors[0].areaM2 : 0)
  const perM2 = {
    steelKgPerM2: steelNet / roofedM2,
    concreteM3PerM2: totalConcrete / roofedM2,
    cementBagsPerM2: cementBags / roofedM2,
  }
  const lat = a.lat
  const wr = (v: number) => Math.round(v)
  const quakeX = lat.baseShear.x
  const quakeY = lat.baseShear.y
  const windX = lat.wind.x[0]
  const windY = lat.wind.y[0]
  const ratio = Math.max(windX / quakeX, windY / quakeY)
  const windNote =
    `Wind to IS 875 (Part 3): basic speed ${meta.vb.vb} m/s for ${meta.vb.place}${meta.vb.basis === 'state' ? ' (your town is not in the speed table, so the highest speed this state commonly sees is used)' : ''}, ` +
    `open terrain, roof-level pressure ${lat.wind.pzRoof.toFixed(2)} kN/m2. Base shear ${wr(windX)} / ${wr(windY)} kN (along x / y) against ${wr(quakeX)} / ${wr(quakeY)} kN for the earthquake: ` +
    `${lat.governs.x === 'earthquake' && lat.governs.y === 'earthquake' ? 'the earthquake governs in both directions' : lat.governs.x === 'wind' && lat.governs.y === 'wind' ? 'the wind governs in both directions' : 'the wind governs in one direction'}. ` +
    'The larger force sets the design, storey by storey; wind and earthquake are never added (IS 1893 cl 6.2).'
  const windRes: WindResult = {
    vbMs: meta.vb.vb,
    basis: meta.vb.basis,
    place: meta.vb.place,
    terrain: lat.wind.terrain,
    pzRoofKnM2: lat.wind.pzRoof,
    ct: lat.wind.ct,
    roofHeightM: lat.wind.roofHeightM,
    windBaseKN: { x: windX, y: windY },
    quakeBaseKN: { x: quakeX, y: quakeY },
    usedBaseKN: { x: lat.storeyShear.x[0], y: lat.storeyShear.y[0] },
    governs: lat.governs,
    ratio,
    note: windNote,
  }
  const stiltRes: StiltResult | undefined = ctx.stilt
    ? {
        amplification: STILT_FACTOR,
        minColumnMm: 300,
        note:
          'The ground level is open for parking: columns only, no walls. Its earthquake shear and moment are multiplied by 2.5 (IS 1893:2002 cl 7.10.3), its columns are at least 300 mm, ' +
          (ctx.seismic ? 'and the ties are the closely spaced confining ties over the full height (IS 13920). ' : 'with the ties of IS 456. ') +
          'A structural engineer must analyse such a building: shear walls or bracing at the open level are often added.',
      }
    : undefined
  if (ctx.stilt) {
    warnings.push(
      'Open parking level (stilt): IS 1893:2002 asks for 2.5 times the earthquake force in the open storey, and the later IS 1893:2016 treats such a storey as an irregularity that needs a dynamic analysis by an engineer. ' +
        'This report adds the 2.5 factor, 300 mm minimum columns and full-height confinement; it is a planning figure and not a design of the open level.'
    )
  }
  if (lat.wind.slender) warnings.push('The building is tall and narrow (height at least five times its width): wind sway and dynamic effects are not covered here and need an engineer.')
  if (lat.wind.tall) warnings.push('Over 30 m high: the wind gust factor and dynamic response (IS 875 Part 3 cl 7) are not covered here and need an engineer.')
  if (bal?.warning && !warnings.includes(bal.warning)) warnings.push(bal.warning)
  if (meta.nBal > 0 && !bal) warnings.push('Balconies were asked for but this building has no upper floor for them: none are included.')
  if (bal && bal.result.count < meta.nBal * bal.result.floorsWith) warnings.push('Some floors have fewer bays than the balconies asked for: only the balconies that fit are included.')
  if (F >= 5) warnings.push('Five or more floors (about 15 m and above): lifts, shear walls and a soil test change the structure a lot. Use this as a planning figure only; a structural engineer must design the building.')
  if (perM2.steelKgPerM2 > 55 || perM2.steelKgPerM2 < 22) warnings.push('Steel per square metre is outside the usual range for this type of building: the result needs an engineer\'s review.')

  const assumptions: string[] = [
    `Layout: regular grid of ${plan.nx} x ${plan.ny} bays of about ${plan.sx.toFixed(2)} x ${plan.sy.toFixed(2)} m, storey height ${plan.hs} m, plinth ${plan.plinth} m. Your own drawing will differ.`,
    `Seismic zone ${zr.zone}. ${zr.note}`,
    ctx.seismic ? 'Zone III and above: special moment-resisting frame, ductile detailing to IS 13920 (closer stirrups, confining ties, strong-column weak-beam).' : 'Zone II: ordinary moment-resisting frame, detailing to IS 456.',
    `Concrete: ${gradeAbove} above ground and ${gradeBelow} for foundations, chosen from the exposure condition (IS 456 Table 5). Steel: Fe500D.`,
    `Foundation: ${a.raft ? 'raft' : 'isolated footings'} on ${site.label}, safe bearing capacity ${site.sbc} kN/m2 assumed, founding depth ${site.depth} m. Replace with a soil test.`,
    `Loads: floor finish ${1.5} kN/m2, imposed 2.0 kN/m2 on floors and ${ctx.terraceLL} kN/m2 on the roof (IS 875), ${wallType} walls ${ctx.wallT * 1000} mm outside, 115 mm brick partitions on half the inner beams, 15 % off for openings.`,
    `Slab ${ctx.tSlab} mm thick (span/depth, IS 456 cl 23.2); beams ${ctx.bBeam} mm wide with depth from bending, shear and deflection; columns sized by the biaxial check of IS 456 cl 39.6.`,
    `Reinforcement is bought in 12 m bars (6 mm comes as a coil, cut and bent on site) with 5 % wastage (CPWD DAR 5.22.1). Binding wire is ${BINDING_WIRE_PER_TONNE} kg per tonne.`,
    `Lintels, sunshades, the terrace parapet band and the stair head-room roof are counted from the plan perimeter and floor area (${sec.items.map((i) => `${i.count} ${i.label.toLowerCase()}`).join(', ')}); their sizes are site practice, not code values.`,
    `Cement, sand and aggregate: CPWD Delhi Analysis of Rates 2014 for M20 and below, IS 10262 mix design above that, plus ${Math.round((SITE_WASTAGE - 1) * 100)} % site wastage.`,
    windNote,
    'Soil-structure interaction and torsion are not analysed; the earthquake forces are IS 1893 equivalent static forces shared equally between frames. Wind pressures use the 1987 basis with no directionality factor and no hill or shielding effect. The wind speed for a town comes from a published city table: the engineer should confirm it against the wind map of IS 875 (Part 3).',
    ...(ctx.stilt && stiltRes ? [stiltRes.note] : []),
    ...(bal ? [bal.result.note] : []),
    ...(ctx.seismic ? [] : ['Zone II: 6 mm links and ties, which IS 456 allows (cl 26.5.3.2); the ductile detailing of Zones III and above keeps 8 mm at least.']),
  ]
  const notIncluded = [
    'Brick or block masonry, plaster, flooring, doors, windows, painting, waterproofing',
    'Lift shaft, basement, water tank, sump, septic tank, compound wall, boundary gate',
    bal ? 'Balconies beyond the number you gave, porticos, canopies and other cantilevers; balcony railings and the brick parapet (brickwork is in MasonryPro)' : 'Balconies, porticos, canopies and other cantilevers beyond the main grid',
    'Backfilling, plinth filling, anti-termite treatment, curing water, scaffolding hire',
    'Plumbing, electrical and finishing works',
  ]

  const totals = {
    concreteM3: totalConcrete,
    steelNetKg: steelNet,
    steelBuyKg: steelBuy,
    bindingWireKg: binding,
    formworkM2: formwork,
    excavationM3: pits,
    pccM3: pcc,
  }

  const mixes = [
    { where: 'above ground', grade: gradeAbove, basis: mixA.basis, cementKgPerM3: mixA.cementKg, sandM3PerM3: mixA.sandM3, aggM3PerM3: mixA.aggregateM3 },
    { where: 'foundations and below ground', grade: gradeBelow, basis: mixB.basis, cementKgPerM3: mixB.cementKg, sandM3PerM3: mixB.sandM3, aggM3PerM3: mixB.aggregateM3 },
    { where: 'lean concrete under footings', grade: 'M7.5', basis: mixP.basis, cementKgPerM3: mixP.cementKg, sandM3PerM3: mixP.sandM3, aggM3PerM3: mixP.aggregateM3 },
  ]

  void siteKey
  return {
    ok: true,
    inputEcho: {
      floors: areasSqft.length,
      storeys: F,
      stilt: ctx.stilt,
      footprintM2: plan.L * plan.W,
      totalBuiltUpM2: totalBuiltUp,
      roofedAreaM2: roofedM2,
      zone: zr.zone,
      zoneBasis: zr.basis,
      zoneNote: zr.note,
      exposure,
      gradeAbove,
      gradeBelow,
      foundation: a.raft ? 'raft' : 'isolated',
    },
    layout: {
      lengthM: plan.L,
      widthM: plan.W,
      baysX: plan.nx,
      baysY: plan.ny,
      spanX: plan.sx,
      spanY: plan.sy,
      bayCountByFloor: plan.floors.map((f) => ({ floor: f.k, bx: f.nx, by: f.ny })),
      storeyHeightM: plan.hs,
      plinthM: plan.plinth,
      foundingDepthM: site.depth,
    },
    members: {
      footings: mk(footVol, sFooting, footForm, a.raft ? 1 : a.footings.size),
      pcc: mk(pcc, 0, 0, 0),
      plinthBeams: mk(a.plinth.concrete, sPlinth, a.plinth.formwork, a.plinth.count),
      columns: mk(colVolAbove + colVolBelow, sCols, colForm, a.cols.length),
      beams: mk(beamV, sBeams, beamF, beamCount.reduce((s, v) => s + v, 0)),
      slabs: mk(slabV, sSlabs, slabF, plan.floors.reduce((s, f) => s + f.nx * f.ny, 0)),
      stairs: mk(stairVol, sStair, stairForm, F),
      secondary: mk(allowConcrete, allowSteel, allowForm, sec.items.reduce((n, i) => n + i.count, 0)),
      ...(bal ? { balconies: mk(balConc, bal.steelKg, balForm, bal.result.count) } : {}),
    },
    totals,
    materials: {
      cementBags: cementBags * W,
      sandM3: sandM3 * W,
      aggregateM3: aggM3 * W,
      sandCft: sandM3 * W * M3_TO_CFT,
      aggregateCft: aggM3 * W * M3_TO_CFT,
      steelBuyKg: steelBuy,
      bindingWireKg: binding,
      formworkSqft: formwork * 10.7639,
      excavationCft: pits * M3_TO_CFT,
    },
    steelByDiameter,
    mixes,
    perM2,
    // Lower edge: the code-minimum design (what the frame needs). Upper edge: what published real buildings used above that. The evidence is thin (calibrate.cjs):
    // the one real Bengaluru G+3 Bill of Quantities in the open record sits at about 1.7 times this model for steel and 1.5 times for concrete, the 26-building GKSPL range
    // (31-62 kg/m2 steel, 0.36-0.44 m3/m2 concrete) at 1.1 to 2 times and 1.1 to 1.4 times, so the upper edges reach 1.6 and 1.4.
    // Real houses add heavier standard sections, extra bars at junctions, chairs and spacers, tanks, porches and other items the model does not count.
    band: { concrete: [0.92, 1.4], steel: [0.9, ctx.stilt || bal ? 1.65 : 1.6], cement: [0.92, 1.4], formwork: [0.85, 1.25] },
    wind: windRes,
    ...(stiltRes ? { stilt: stiltRes } : {}),
    ...(bal ? { balcony: bal.result } : {}),
    geometry,
    schedules: { columns: [...colSched.values()], beams: [...beamSched.values()] },
    secondary: sec.items,
    diagnostics: {
      baseServiceLoadKN: a.cols.filter((c) => c.k === 0).reduce((t, c) => t + c.Pser, 0),
      footingBearingKN: a.raft
        ? ((a.raft.x1 - a.raft.x0) * (a.raft.y1 - a.raft.y0) * site.sbc) / 1.1
        : [...a.footings.values()].reduce((t, fr) => t + (fr.Lf * fr.Bf * site.sbc) / 1.1, 0),
      stiffnessNote: 'Equivalent static analysis with the portal method; no frame stiffness matrix.',
    },
    assumptions,
    notIncluded,
    warnings,
  }
}

export { FY }
