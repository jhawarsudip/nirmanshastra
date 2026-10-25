// Frame data: beams with their loads, seismic weights and the equivalent static / portal-method lateral analysis.

import { GAMMA_BRICK, GAMMA_PLASTER, GAMMA_RC, Z_FACTOR, Zone } from './codes'
import { BeamDesign } from './beam'
import { BALCONY_LL, BalconySlot, Floor, Plan, eqLoad, nodeExists } from './plan'
import { saOverG } from './zones'
import { TerrainCategory, WindShears, windShears } from './wind'

export type WallKind = 'ext' | 'int' | 'parapet' | 'none'

export interface BeamRec {
  dir: 'x' | 'y'
  k: number // floor level: the beam sits at the top of storey k, under slab k
  ix: number // start node
  iy: number
  L: number // c/c, m
  perimeter: boolean
  i: number // span index in its line
  n: number // spans in its line
  wallKind: WallKind
  wall: number // kN/m
  mDL: number // slab dead load, moment-equivalent kN/m
  mLL: number
  vDL: number // shear-equivalent
  vLL: number
  ME0: number // seismic beam-end moments at the start / end node, kN.m
  ME1: number
  des?: BeamDesign
}

/** Balconies of the whole building: where they are, how far they project and how thick the slab is. */
export interface BalconyCtx {
  slots: BalconySlot[]
  lc: number // projection, m
  tMm: number
}

export interface Ctx {
  plan: Plan
  zone: Zone
  seismic: boolean // Zone III and above: IS 13920 ductile detailing, R = 5
  tSlab: number // mm
  bBeam: number // mm
  wallT: number // m
  wallGamma: number
  terraceLL: number // kN/m2 on roof
  fck: number
  /** open parking level: storey 0 has columns only, no walls (IS 1893 open first storey) */
  stilt: boolean
  /** basic wind speed Vb, m/s, and terrain category: IS 875 (Part 3) */
  windVb: number
  terrain: TerrainCategory
  balcony: BalconyCtx | null
}

/** IS 1893 (Part 1):2002 cl 7.10.3(a): columns and beams of an open first storey are designed for 2.5 times the earthquake storey shear and moment. */
export const STILT_FACTOR = 2.5
/** Share of the imposed load that goes into the seismic weight of a floor (IS 1893:2002 Table 8, imposed load up to 3 kN/m2); none on the roof (cl 7.3.2). */
export const SEISMIC_LL_SHARE = 0.25
/** Response reduction factor R: special moment-resisting frame (Zone III and above) and ordinary moment-resisting frame (Zone II). IS 1893:2002 Table 7. */
export const R_SMRF = 5
export const R_OMRF = 3
/** Approximate period of a moment-resisting frame with brick infill: T = 0.09 h / sqrt(d). IS 1893:2002 cl 7.6.2. */
export const PERIOD_COEFF = 0.09
/** Height of the parapet added to the roof level when the wind force is worked out, m. ASSUMPTION */
export const WIND_PARAPET_M = 1.0

export const FLOOR_FINISH = 1.5 // kN/m2 ASSUMPTION (IS 875 Part 1 finish values unreadable in the open scan)
export const ROOF_FINISH = 2.0 // brick-bat coba waterproofing, ASSUMPTION
export const CEILING_PLASTER = 0.25 // 12 mm cement plaster 0.012 x 20.4
export const FLOOR_LL = 2.0 // IS 875 Part 2 Table 1: residential rooms
export const WINDOW_FACTOR = 0.85 // door and window openings reduce wall weight: ASSUMPTION
export const PARTITION_PRESENCE = 0.5 // share of an internal beam line that carries a partition: ASSUMPTION
export const BEAM_D_EST = 0.4 // m, only to size the wall above a beam before the beam is designed

export function bayLoad(ctx: Ctx, k: number, ix: number, iy: number): { dl: number; ll: number; terrace: boolean } {
  const { plan } = ctx
  const covered = k < plan.F - 1 && ix < plan.floors[k + 1].nx && iy < plan.floors[k + 1].ny
  const t = ctx.tSlab / 1000
  if (covered) return { dl: GAMMA_RC * t + FLOOR_FINISH + CEILING_PLASTER, ll: FLOOR_LL, terrace: false }
  return { dl: GAMMA_RC * t + ROOF_FINISH + CEILING_PLASTER, ll: ctx.terraceLL, terrace: true }
}

/** One balcony, per metre run of its supporting beam over the balcony length: dead (slab, finish, plaster and the parapet on its three edges) and live load, kN/m;
 *  and its weight for the earthquake mass (dead + 25 % of the 3 kN/m2 imposed load, IS 1893 Table 8), kN. */
export function balconyLoads(ctx: Ctx, b: BalconyCtx, lenM: number): { dl: number; ll: number; weight: number } {
  const gk = GAMMA_RC * (b.tMm / 1000) + FLOOR_FINISH + CEILING_PLASTER
  const par = wallUDL(ctx, 'parapet')
  const dl = gk * b.lc + par * (1 + (2 * b.lc) / lenM)
  const ll = BALCONY_LL * b.lc
  return { dl, ll, weight: (dl + SEISMIC_LL_SHARE * ll) * lenM }
}

/** Plaster on the outer walls (total thickness of both faces, m), and on the inner partitions; the thickness of the partition and parapet (m). ASSUMPTIONS (site practice). */
export const PLASTER_EXT = 0.032
export const PLASTER_INT = 0.024
export const PARTITION_T = 0.115
export const PARAPET_T = 0.115
export const PARAPET_PLASTER = 0.032

export function wallUDL(ctx: Ctx, kind: WallKind): number {
  const h = ctx.plan.hs - BEAM_D_EST
  if (kind === 'ext') return (ctx.wallT * ctx.wallGamma + PLASTER_EXT * GAMMA_PLASTER) * h * WINDOW_FACTOR
  if (kind === 'int') return PARTITION_PRESENCE * (PARTITION_T * GAMMA_BRICK + PLASTER_INT * GAMMA_PLASTER) * h * WINDOW_FACTOR
  if (kind === 'parapet') return PARAPET_T * GAMMA_BRICK + PARAPET_PLASTER * GAMMA_PLASTER
  return 0
}

function segExistsAbove(plan: Plan, k: number, dir: 'x' | 'y', ix: number, iy: number): { exists: boolean; perimeter: boolean } {
  if (k >= plan.F - 1) return { exists: false, perimeter: false }
  const f = plan.floors[k + 1]
  if (dir === 'x') {
    const exists = nodeExists(f, ix, iy) && nodeExists(f, ix + 1, iy)
    return { exists, perimeter: exists && (iy === 0 || iy === f.ny) }
  }
  const exists = nodeExists(f, ix, iy) && nodeExists(f, ix, iy + 1)
  return { exists, perimeter: exists && (ix === 0 || ix === f.nx) }
}

/** All beams of all floors with their slab and wall loads (the beam's own weight is added when it is designed). */
export function buildBeams(ctx: Ctx): BeamRec[][] {
  const { plan } = ctx
  const out: BeamRec[][] = []
  for (const f of plan.floors) {
    const list: BeamRec[] = []
    const k = f.k
    // x-beams: between (ix,iy) and (ix+1,iy)
    for (let iy = 0; iy <= f.ny; iy++) {
      for (let ix = 0; ix < f.nx; ix++) {
        const perimeter = iy === 0 || iy === f.ny
        const rec = mkBeam(ctx, f, 'x', ix, iy, perimeter, ix, f.nx)
        list.push(rec)
      }
    }
    for (let ix = 0; ix <= f.nx; ix++) {
      for (let iy = 0; iy < f.ny; iy++) {
        const perimeter = ix === 0 || ix === f.nx
        const rec = mkBeam(ctx, f, 'y', ix, iy, perimeter, iy, f.ny)
        list.push(rec)
      }
    }
    void k
    out.push(list)
  }
  return out
}

function mkBeam(ctx: Ctx, f: Floor, dir: 'x' | 'y', ix: number, iy: number, perimeter: boolean, i: number, n: number): BeamRec {
  const { plan } = ctx
  const L = dir === 'x' ? plan.sx : plan.sy
  const other = dir === 'x' ? plan.sy : plan.sx
  let mDL = 0
  let mLL = 0
  let vDL = 0
  let vLL = 0
  const add = (bx: number, by: number) => {
    if (bx < 0 || by < 0 || bx >= f.nx || by >= f.ny) return
    const bl = bayLoad(ctx, f.k, bx, by)
    const a = eqLoad(bl.dl, L, other)
    const c = eqLoad(bl.ll, L, other)
    mDL += a.m
    vDL += a.v
    mLL += c.m
    vLL += c.v
  }
  if (dir === 'x') {
    add(ix, iy)
    add(ix, iy - 1)
  } else {
    add(ix, iy)
    add(ix - 1, iy)
  }
  // a balcony cantilevering from this beam adds its slab and parapet to the beam as a load spread over the span (equivalent uniform load)
  if (ctx.balcony && dir === 'x') {
    for (const sl of ctx.balcony.slots) {
      if (sl.k !== f.k || sl.ix !== ix || sl.iy !== iy) continue
      const bl = balconyLoads(ctx, ctx.balcony, sl.lenM)
      const share = sl.lenM / L
      mDL += bl.dl * share
      vDL += bl.dl * share
      mLL += bl.ll * share
      vLL += bl.ll * share
    }
  }
  const above = segExistsAbove(plan, f.k, dir, ix, iy)
  let wallKind: WallKind = 'none'
  if (above.exists) wallKind = above.perimeter ? 'ext' : 'int'
  else if (perimeter) wallKind = 'parapet'
  const wall = wallUDL(ctx, wallKind)
  return { dir, k: f.k, ix, iy, L, perimeter, i, n, wallKind, wall, mDL: mDL + wall, mLL, vDL: vDL + wall, vLL, ME0: 0, ME1: 0 }
}

export interface Weights {
  W: number[] // seismic weight at each level, kN
  total: number
  /** what each level's weight is made of, kN: the slabs (balconies included), the beams' own weight, the parapet, the walls of storey k and k+1 (full, before the half is taken), the columns of storey k, and the balconies alone */
  parts?: { slab: number[]; beam: number[]; parapet: number[]; wallStorey: number[]; col: number[]; balcony: number[] }
}

/** Seismic weight at each floor level (IS 1893 cl 7.3): dead load + 25 % of imposed load on floors, none on the roof.
 *  `beamSelf(rec)` gives the beam's own weight in kN/m, `colWeight(k)` the weight of all columns of storey k. */
export function seismicWeights(ctx: Ctx, beams: BeamRec[][], beamSelf: (r: BeamRec) => number, colWeight: (k: number) => number): Weights {
  const { plan } = ctx
  const F = plan.F
  const slab = new Array(F).fill(0)
  const beam = new Array(F).fill(0)
  const wallStorey = new Array(F + 1).fill(0) // walls of storey i, i = 0..F-1 (carried on level i-1 beams)
  const parapet = new Array(F).fill(0)
  for (const f of plan.floors) {
    for (let ix = 0; ix < f.nx; ix++) {
      for (let iy = 0; iy < f.ny; iy++) {
        const bl = bayLoad(ctx, f.k, ix, iy)
        slab[f.k] += plan.sx * plan.sy * (bl.dl + (bl.terrace || f.k === F - 1 ? 0 : SEISMIC_LL_SHARE * bl.ll))
      }
    }
    for (const r of beams[f.k]) {
      beam[f.k] += beamSelf(r) * r.L
      if (r.wallKind === 'parapet') parapet[f.k] += r.wall * r.L
      else if (r.wallKind === 'ext' || r.wallKind === 'int') wallStorey[f.k + 1] += r.wall * r.L
    }
  }
  // walls of the ground storey stand on the plinth beams: same lengths as the ground-floor plan (none when the ground level is left open)
  if (!ctx.stilt) {
    for (const r of beams[0]) {
      const kind: WallKind = r.perimeter ? 'ext' : 'int'
      wallStorey[0] += wallUDL(ctx, kind) * r.L
    }
  }
  const balcony = new Array(F).fill(0)
  if (ctx.balcony) {
    for (const sl of ctx.balcony.slots) {
      const wt = balconyLoads(ctx, ctx.balcony, sl.lenM).weight
      slab[sl.k] += wt
      balcony[sl.k] += wt
    }
  }
  const colW: number[] = Array.from({ length: F }, (_, k) => colWeight(k))
  const W = new Array(F).fill(0)
  for (let k = 0; k < F; k++) {
    W[k] = slab[k] + beam[k] + parapet[k] + 0.5 * wallStorey[k] + (k < F - 1 ? 0.5 * wallStorey[k + 1] : 0) + 0.5 * colW[k] + (k < F - 1 ? 0.5 * colW[k + 1] : 0)
  }
  return { W, total: W.reduce((s, v) => s + v, 0), parts: { slab, beam, parapet, wallStorey, col: colW, balcony } }
}

export interface Lateral {
  Ah: { x: number; y: number }
  T: { x: number; y: number }
  /** earthquake base shear, kN (as before the open-storey factor) */
  baseShear: { x: number; y: number }
  /** the storey shears the frame is designed for: the larger of earthquake (open storey x 2.5) and wind, storey by storey; they are never added (IS 1893 cl 6.2(b)) */
  storeyShear: { x: number[]; y: number[] } // V_k in storey k (between level k-1 and k), kN
  quakeStoreyShear: { x: number[]; y: number[] }
  wind: WindShears
  /** which load sets the base shear in each direction */
  governs: { x: 'earthquake' | 'wind'; y: 'earthquake' | 'wind' }
  /** 2.5 for an open first storey, else 1: applied to the beam moments of level 0 */
  stiltAmp: number
  /** column end moment (kN.m) for a column of storey k at node (ix,iy) in each direction */
  colM: (dir: 'x' | 'y', k: number, ix: number, iy: number) => number
}

/** IS 1893 equivalent static method, shear shared equally between frames, portal method inside each frame. */
export function lateralAnalysis(ctx: Ctx, w: Weights): Lateral {
  const { plan } = ctx
  const F = plan.F
  const H = plan.floors[F - 1].zTop
  const R = ctx.seismic ? R_SMRF : R_OMRF
  const Z = Z_FACTOR[ctx.zone]
  const mk = (d: number) => {
    const T = (PERIOD_COEFF * H) / Math.sqrt(d)
    return { T, Ah: (Z / 2) * (1 / R) * saOverG(T) }
  }
  const tx = mk(plan.L)
  const ty = mk(plan.W)
  const sumWh2 = w.W.reduce((s, v, k) => s + v * Math.pow(plan.floors[k].zTop, 2), 0)
  const storeyShear = (Ah: number) => {
    const Vb = Ah * w.total
    const Q = w.W.map((v, k) => (Vb * v * Math.pow(plan.floors[k].zTop, 2)) / sumWh2)
    const V = new Array(F).fill(0)
    for (let k = F - 1; k >= 0; k--) V[k] = Q[k] + (k < F - 1 ? V[k + 1] : 0)
    return { Vb, V }
  }
  const sx = storeyShear(tx.Ah)
  const sy = storeyShear(ty.Ah)
  // earthquake shear in the open first storey x 2.5 (IS 1893:2002 cl 7.10.3(a))
  const qx = sx.V.slice()
  const qy = sy.V.slice()
  if (ctx.stilt) {
    qx[0] *= STILT_FACTOR
    qy[0] *= STILT_FACTOR
  }
  const wd = windShears(plan, ctx.windVb, ctx.terrain, WIND_PARAPET_M, ctx.stilt)
  const ex = qx.map((v, k) => Math.max(v, wd.x[k]))
  const ey = qy.map((v, k) => Math.max(v, wd.y[k]))
  const colM = (dir: 'x' | 'y', k: number, ix: number, iy: number): number => {
    const f = plan.floors[k]
    if (!nodeExists(f, ix, iy)) return 0
    const V = dir === 'x' ? ex[k] : ey[k]
    const frames = dir === 'x' ? f.ny + 1 : f.nx + 1
    const nb = dir === 'x' ? f.nx : f.ny
    const idx = dir === 'x' ? ix : iy
    const exterior = idx === 0 || idx === nb
    const Vf = V / frames
    const Vc = exterior ? Vf / (2 * nb) : Vf / nb
    return (Vc * plan.hs) / 2
  }
  return {
    Ah: { x: tx.Ah, y: ty.Ah },
    T: { x: tx.T, y: ty.T },
    baseShear: { x: sx.Vb, y: sy.Vb },
    storeyShear: { x: ex, y: ey },
    quakeStoreyShear: { x: sx.V, y: sy.V },
    wind: wd,
    governs: { x: sx.Vb >= wd.x[0] ? 'earthquake' : 'wind', y: sy.Vb >= wd.y[0] ? 'earthquake' : 'wind' },
    stiltAmp: ctx.stilt ? STILT_FACTOR : 1,
    colM,
  }
}

/** Seismic moments at the ends of every beam from the portal method: joint moment (columns above and below) shared by the beams at the joint. */
export function assignBeamSeismic(ctx: Ctx, beams: BeamRec[][], lat: Lateral): void {
  const { plan } = ctx
  for (const f of plan.floors) {
    const k = f.k
    // beams of an open first storey take 2.5 times the earthquake moment: the column below already carries the factor, the column above gets it here
    const above = k === 0 ? lat.stiltAmp : 1
    const jm = (dir: 'x' | 'y', ix: number, iy: number) => lat.colM(dir, k, ix, iy) + (k < plan.F - 1 ? above * lat.colM(dir, k + 1, ix, iy) : 0)
    for (const r of beams[k]) {
      const share = (ix: number, iy: number) => {
        // number of beams of this direction meeting at the node
        const idx = r.dir === 'x' ? ix : iy
        const nb = r.dir === 'x' ? f.nx : f.ny
        return idx === 0 || idx === nb ? 1 : 2
      }
      const ex = r.dir === 'x' ? r.ix + 1 : r.ix
      const ey = r.dir === 'x' ? r.iy : r.iy + 1
      r.ME0 = jm(r.dir, r.ix, r.iy) / share(r.ix, r.iy)
      r.ME1 = jm(r.dir, ex, ey) / share(ex, ey)
    }
  }
}
