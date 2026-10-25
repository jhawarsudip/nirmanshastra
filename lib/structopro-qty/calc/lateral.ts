// Section 5 of the StructurePro calculation sheet: the earthquake and the wind, and which one governs.

import type { CalcBlock, CalcSection } from '@/lib/calcsheet'
import type { CalcCtx } from './ctx'
import { GAMMA_RC, Z_FACTOR } from '../codes'
import { PERIOD_COEFF, R_OMRF, R_SMRF, SEISMIC_LL_SHARE, STILT_FACTOR, WIND_PARAPET_M, balconyLoads, bayLoad, wallUDL } from '../frame'
import { nodeExists } from '../plan'
import { K2_CLASS_A, K2_HEIGHTS, k2At, netPressureDetail, windPressure } from '../wind'
import { saOverG } from '../zones'
import { STD, check, d1, d2, d3, ex, fixed, levelName, storeyName, table, takeBlock, tableBlock } from './helpers'

/** The weights of the first pass, rebuilt from its beams and columns: what the earthquake analysis of the final pass was run with. */
export function rebuildWeights(c: CalcCtx) {
  const { work } = c
  const { ctx, plan } = work
  const p1 = work.pass1
  const F = plan.F
  const zero = (n: number) => new Array<number>(n).fill(0)
  const slab = zero(F)
  const beam = zero(F)
  const parapet = zero(F)
  const wallStorey = zero(F + 1)
  const colW = zero(F)
  const balcony = zero(F)
  for (const f of plan.floors) {
    for (let ix = 0; ix < f.nx; ix++) {
      for (let iy = 0; iy < f.ny; iy++) {
        const bl = bayLoad(ctx, f.k, ix, iy)
        slab[f.k] += plan.sx * plan.sy * (bl.dl + (bl.terrace || f.k === F - 1 ? 0 : SEISMIC_LL_SHARE * bl.ll))
      }
    }
    for (const r of p1.beams[f.k]) {
      beam[f.k] += (r.des?.selfWeight ?? 0) * r.L
      if (r.wallKind === 'parapet') parapet[f.k] += r.wall * r.L
      else if (r.wallKind === 'ext' || r.wallKind === 'int') wallStorey[f.k + 1] += r.wall * r.L
    }
  }
  if (!ctx.stilt) for (const r of p1.beams[0]) wallStorey[0] += wallUDL(ctx, r.perimeter ? 'ext' : 'int') * r.L
  if (ctx.balcony) {
    for (const sl of ctx.balcony.slots) {
      const wt = balconyLoads(ctx, ctx.balcony, sl.lenM).weight
      slab[sl.k] += wt
      balcony[sl.k] += wt
    }
  }
  for (const col of p1.cols) colW[col.k] += GAMMA_RC * (col.des.b / 1000) * (col.des.D / 1000) * plan.hs
  const W = zero(F)
  for (let k = 0; k < F; k++) {
    W[k] = slab[k] + beam[k] + parapet[k] + 0.5 * wallStorey[k] + (k < F - 1 ? 0.5 * wallStorey[k + 1] : 0) + 0.5 * colW[k] + (k < F - 1 ? 0.5 * colW[k + 1] : 0)
  }
  return { slab, beam, parapet, wallStorey, colW, balcony, W, total: W.reduce((s, v) => s + v, 0) }
}

/**
 * Column end moment by the portal method (kN.m). `dir` is the direction of the lateral load. With `show` the three steps are written to the ledger;
 * without it the number is rebuilt silently and only compared with the engine's.
 */
export function portalColumnMoment(c: CalcCtx, dir: 'x' | 'y', k: number, ix: number, iy: number, tag: string, show = true): number {
  const { L, work } = c
  const { plan } = work
  const lat = work.analysis.lat
  const f = plan.floors[k]
  if (!nodeExists(f, ix, iy)) return 0
  const V = dir === 'x' ? lat.storeyShear.x[k] : lat.storeyShear.y[k]
  const frames = dir === 'x' ? f.ny + 1 : f.nx + 1
  const nb = dir === 'x' ? f.nx : f.ny
  const idx = dir === 'x' ? ix : iy
  const exterior = idx === 0 || idx === nb
  if (!show) {
    const m = (V / frames / (exterior ? 2 * nb : nb)) * plan.hs / 2
    check(L, `Portal-method column moment, ${tag}`, m, lat.colM(dir, k, ix, iy))
    return m
  }
  const Vf = L.calc(`Shear of one frame, lateral load along ${dir} (${tag})`, 'Vf = V ÷ number of frames', '{V} ÷ {n}', { V, n: frames }, (v) => v.V / v.n, { unit: 'kN', dp: 2, ref: `${STD.rule}: the storey shear is shared equally between the frames`, note: `${frames} frames in this direction on this storey` })
  const Vc = L.calc(
    `Shear in the column (${tag})`,
    exterior ? 'Vc = Vf ÷ (2 nb)' : 'Vc = Vf ÷ nb',
    exterior ? '{Vf} ÷ (2 × {nb})' : '{Vf} ÷ {nb}',
    { Vf, nb },
    (v) => (exterior ? v.Vf / (2 * v.nb) : v.Vf / v.nb),
    { unit: 'kN', dp: 3, ref: 'Portal method (standard approximate analysis)', note: `${exterior ? 'An outer column carries half the shear of an inner column' : 'An inner column'}; ${nb} bays in the frame` }
  )
  return L.calc(`Column end moment from the lateral load along ${dir} (${tag})`, 'M = Vc × h ÷ 2', '{Vc} × {h} ÷ 2', { Vc, h: plan.hs }, (v) => (v.Vc * v.h) / 2, {
    unit: 'kN·m',
    dp: 3,
    ref: 'Portal method: contraflexure at mid-height',
    ...ex(lat.colM(dir, k, ix, iy)),
  })
}

export function lateralSection(c: CalcCtx): CalcSection {
  const { L, result, work } = c
  const { ctx, plan } = work
  const lat = work.analysis.lat
  const F = plan.F
  const blocks: CalcBlock[] = []
  const H = plan.floors[F - 1].zTop

  // ---- 5a. seismic weight
  const wt = rebuildWeights(c)
  const used = work.weightsUsed
  const rows: string[][] = []
  for (let k = 0; k < F; k++) {
    check(L, `Slab weight at level ${k}`, wt.slab[k], used.parts!.slab[k])
    check(L, `Beam weight at level ${k}`, wt.beam[k], used.parts!.beam[k])
    check(L, `Parapet weight at level ${k}`, wt.parapet[k], used.parts!.parapet[k])
    check(L, `Column weight at level ${k}`, wt.colW[k], used.parts!.col[k])
    check(L, `Wall weight of storey ${k}`, wt.wallStorey[k], used.parts!.wallStorey[k])
    check(L, `Seismic weight at level ${k}`, wt.W[k], used.W[k])
    const walls = 0.5 * wt.wallStorey[k] + (k < F - 1 ? 0.5 * wt.wallStorey[k + 1] : 0)
    const cols = 0.5 * wt.colW[k] + (k < F - 1 ? 0.5 * wt.colW[k + 1] : 0)
    rows.push([levelName(k, F, ctx.stilt), d1(wt.slab[k]), d1(wt.beam[k]), d1(wt.parapet[k]), d1(walls), d1(cols), d1(wt.W[k])])
  }
  check(L, 'Total seismic weight', wt.total, used.total)
  // worked example for the lowest level
  {
    const k = 0
    const f = plan.floors[k]
    let covered = 0
    let open = 0
    let gCov = 0
    let qCov = 0
    let gOpen = 0
    for (let ix = 0; ix < f.nx; ix++) {
      for (let iy = 0; iy < f.ny; iy++) {
        const bl = bayLoad(ctx, k, ix, iy)
        if (bl.terrace || k === F - 1) {
          open++
          gOpen = bl.dl
        } else {
          covered++
          gCov = bl.dl
          qCov = bl.ll
        }
      }
    }
    L.say('Worked example', `Level 0 is the top of ${storeyName(0, ctx.stilt).toLowerCase()}. It has ${f.nx * f.ny} bays of ${d2(plan.sx)} × ${d2(plan.sy)} m.`, STD.rule)
    L.calc(
      'Slab: dead load plus 25 % of the imposed load',
      'Ws = bays × sx × sy × (g + 0.25 q)',
      '{n1} × {a} × ({g1} + {s} × {q1}) + {n2} × {a} × {g2}',
      { n1: covered, a: plan.sx * plan.sy, g1: gCov, s: SEISMIC_LL_SHARE, q1: qCov, n2: open, g2: gOpen },
      (v) => v.n1 * v.a * (v.g1 + v.s * v.q1) + v.n2 * v.a * v.g2,
      { unit: 'kN', dp: 1, ref: `${STD.is1893} cl. 7.3.1, 7.3.2, 7.4 and Table 8`, note: 'Bays under a floor above carry 25 % of the imposed load; bays under the open sky (the roof) carry none', ...ex(wt.slab[k] - wt.balcony[k]) }
    )
    if (wt.balcony[k] > 0) L.value('Balconies on this level (dead + 25 % of imposed)', wt.balcony[k], 'kN', 1, `${STD.is1893} cl. 7.3.1`)
    const sumBeam = p1Beams(c, k)
    L.calc('Beams: own weight', 'Wb = Σ (25 b (D − t) × L)', '{n} beams of the first pass, total length {len} m, weighted mean {m} kN/m', { n: sumBeam.n, len: sumBeam.len, m: sumBeam.mean }, (v) => v.len * v.m, { unit: 'kN', dp: 1, ref: `${STD.is875_1}; ${STD.rule}`, note: 'The beam sizes are those of the first design pass', ...ex(wt.beam[k]) })
    L.calc(
      'Columns: own weight, half of each storey',
      'Wc = ½ Σ (25 b D hs) of the storey below + ½ of the storey above',
      '½ × {a} + ½ × {b}',
      { a: wt.colW[k], b: k < F - 1 ? wt.colW[k + 1] : 0 },
      (v) => 0.5 * v.a + 0.5 * v.b,
      { unit: 'kN', dp: 1, ref: `${STD.is1893} cl. 7.4.1 (half the weight of columns and walls above and below the level)`, note: 'The column sizes are those of the first design pass' }
    )
    L.calc(
      'Walls: half of the storey below and half of the storey above',
      'Ww = ½ (walls of storey 0) + ½ (walls of storey 1)',
      '½ × {a} + ½ × {b}',
      { a: wt.wallStorey[0], b: F > 1 ? wt.wallStorey[1] : 0 },
      (v) => 0.5 * v.a + 0.5 * v.b,
      { unit: 'kN', dp: 1, ref: `${STD.is1893} cl. 7.4.1`, note: ctx.stilt ? 'No walls on the open parking level' : 'The ground-storey walls are counted on the plinth beams' }
    )
    L.calc(
      'Seismic weight of level 0',
      'W0 = slabs + beams + parapet + walls + columns',
      '{s} + {b} + {p} + {w} + {c}',
      { s: wt.slab[k], b: wt.beam[k], p: wt.parapet[k], w: 0.5 * wt.wallStorey[k] + (k < F - 1 ? 0.5 * wt.wallStorey[k + 1] : 0), c: 0.5 * wt.colW[k] + (k < F - 1 ? 0.5 * wt.colW[k + 1] : 0) },
      (v) => v.s + v.b + v.p + v.w + v.c,
      { unit: 'kN', dp: 1, ref: `${STD.is1893} cl. 7.4`, ...ex(used.W[k]), result: true }
    )
  }
  blocks.push(
    takeBlock(L, 'lat-weight-example', 'Seismic weight: worked example for the lowest level', {
      intro: 'The seismic weight of a level is its dead load plus a share of the imposed load, with half of the walls and columns above and below it (IS 1893 cl. 7.4). The weights used for the final earthquake forces come from the member sizes of the model\'s first design pass; the second pass then designs the members for those forces and its own weights are not fed back again.',
    })
  )
  blocks.push(
    tableBlock('lat-weight-table', 'Seismic weight of every level (kN)', table(['Level', 'Slabs', 'Beams', 'Parapet', 'Walls', 'Columns', 'Weight W'], rows, { num: [1, 2, 3, 4, 5, 6], foot: ['Total', '', '', '', '', '', d1(wt.total)] }), {
      note: 'Each figure was rebuilt from the loads of Section 4 and the first-pass member sizes and agrees with the model\'s own. Imposed load is 25 % on floors and nil on the roof.',
    })
  )

  // ---- 5b. earthquake coefficient
  const Z = Z_FACTOR[ctx.zone]
  L.value('Zone factor Z', Z, '', 2, `${STD.is1893} Table 2`)
  L.value('Response reduction factor R', ctx.seismic ? R_SMRF : R_OMRF, '', 0, `${STD.is1893} Table 7`, ctx.seismic ? 'Special moment-resisting frame: Zone III and above, ductile detailing to IS 13920' : 'Ordinary moment-resisting frame: Zone II')
  L.value('Importance factor I', 1.0, '', 1, `${STD.is1893} Table 6`, 'Residential building. The model has no importance factor in its formula; for I = 1.0 that is the same. A building of more than ordinary importance (hospital, school, assembly hall) needs I = 1.5')
  L.value('Height of the building H (top of roof slab above ground)', H, 'm', 2, `${STD.is1893} cl. 7.6.2`, 'The parapet and head-room are not counted')
  const dirs: Array<['x' | 'y', number]> = [['x', plan.L], ['y', plan.W]]
  for (const [dir, dd] of dirs) {
    const T = L.calc(`Natural period along ${dir}`, 'T = 0.09 H ÷ √d', '0.09 × {H} ÷ √{d}', { H, d: dd }, (v) => (PERIOD_COEFF * v.H) / Math.sqrt(v.d), {
      unit: 's',
      dp: 3,
      ref: `${STD.is1893} cl. 7.6.2`,
      note: `d = ${d2(dd)} m, the base dimension of the building along ${dir}. The formula is for a frame with brick infill`,
      ...ex(lat.T[dir]),
    })
    const sa = L.calc(
      `Spectral acceleration coefficient along ${dir}`,
      'Sa/g = 1 + 15T (T < 0.10); 2.5 (0.10 ≤ T ≤ 0.55); 1.36 ÷ T (T > 0.55)',
      `T = {T} s`,
      { T },
      (v) => saOverG(v.T),
      { dp: 3, ref: `${STD.is1893} cl. 6.4.2 and Fig. 2 (medium soil)`, note: 'The medium-soil curve is used for every ground class' }
    )
    const Ah = L.calc(`Design horizontal coefficient along ${dir}`, 'Ah = (Z ÷ 2) × (I ÷ R) × (Sa/g)', '({Z} ÷ 2) × (1 ÷ {R}) × {sa}', { Z, R: ctx.seismic ? R_SMRF : R_OMRF, sa }, (v) => (v.Z / 2) * (1 / v.R) * v.sa, {
      dp: 4,
      ref: `${STD.is1893} cl. 6.4.2`,
      ...ex(lat.Ah[dir]),
      result: true,
    })
    if (T < 0.1) {
      L.say(
        `Departure from the code (${dir})`,
        `T is under 0.10 s. IS 1893 cl. 6.4.2 then says Ah is not to be taken below Z ÷ 2 = ${fixed(Z / 2, 3)}; the model\'s Ah is ${fixed(Ah, 4)}. The model does not apply this floor.`,
        `${STD.is1893} cl. 6.4.2`
      )
    }
  }
  blocks.push(takeBlock(L, 'lat-eq-coeff', 'Earthquake: design coefficient', { intro: 'Equivalent static method: the earthquake is replaced by a set of horizontal forces found from the weight of the building and a coefficient that depends on the zone, the type of frame and the natural period.' }))

  // ---- 5c. base shear and distribution
  const sumWh2 = wt.W.reduce((s, v, k) => s + v * Math.pow(plan.floors[k].zTop, 2), 0)
  L.calc('Σ W h² over all levels', 'Σ Wi hi²', '{s}', { s: sumWh2 }, (v) => v.s, { unit: 'kN·m²', dp: 0, ref: `${STD.is1893} cl. 7.7.1` })
  const vbx = L.calc('Design base shear along x', 'VB = Ah × W', '{a} × {w}', { a: lat.Ah.x, w: wt.total }, (v) => v.a * v.w, { unit: 'kN', dp: 1, ref: `${STD.is1893} cl. 7.5.3`, ...ex(lat.baseShear.x), result: true })
  const vby = L.calc('Design base shear along y', 'VB = Ah × W', '{a} × {w}', { a: lat.Ah.y, w: wt.total }, (v) => v.a * v.w, { unit: 'kN', dp: 1, ref: `${STD.is1893} cl. 7.5.3`, ...ex(lat.baseShear.y), result: true })
  L.compare('Base shear along x against the report', vbx, result.wind.quakeBaseKN.x, undefined, 1e-9)
  L.compare('Base shear along y against the report', vby, result.wind.quakeBaseKN.y, undefined, 1e-9)
  blocks.push(takeBlock(L, 'lat-eq-base', 'Earthquake: base shear'))

  const qRows: string[][] = []
  const Vx = new Array<number>(F).fill(0)
  const Vy = new Array<number>(F).fill(0)
  const Qx = wt.W.map((w, k) => (vbx * w * Math.pow(plan.floors[k].zTop, 2)) / sumWh2)
  const Qy = wt.W.map((w, k) => (vby * w * Math.pow(plan.floors[k].zTop, 2)) / sumWh2)
  for (let k = F - 1; k >= 0; k--) {
    Vx[k] = Qx[k] + (k < F - 1 ? Vx[k + 1] : 0)
    Vy[k] = Qy[k] + (k < F - 1 ? Vy[k + 1] : 0)
  }
  for (let k = 0; k < F; k++) {
    check(L, `Earthquake storey shear x, storey ${k}`, Vx[k], lat.quakeStoreyShear.x[k])
    check(L, `Earthquake storey shear y, storey ${k}`, Vy[k], lat.quakeStoreyShear.y[k])
    const ampX = k === 0 && ctx.stilt ? Vx[k] * STILT_FACTOR : Vx[k]
    const ampY = k === 0 && ctx.stilt ? Vy[k] * STILT_FACTOR : Vy[k]
    const wx = lat.wind.x[k]
    const wy = lat.wind.y[k]
    check(L, `Design storey shear x, storey ${k}`, Math.max(ampX, wx), lat.storeyShear.x[k])
    check(L, `Design storey shear y, storey ${k}`, Math.max(ampY, wy), lat.storeyShear.y[k])
    qRows.push([levelName(k, F, ctx.stilt), d2(plan.floors[k].zTop), d1(wt.W[k]), d1(Qx[k]), d1(Qy[k]), d1(Vx[k]), d1(Vy[k])])
  }
  blocks.push(
    tableBlock('lat-eq-distribution', 'Earthquake: force at each level and shear in each storey (kN)', table(['Level', 'Height h (m)', 'Weight W', 'Force Qx', 'Force Qy', 'Storey shear Vx', 'Storey shear Vy'], qRows, { num: [1, 2, 3, 4, 5, 6] }), {
      intro: 'The base shear is shared between the levels in proportion to W h²: force at a level = VB × W h² ÷ Σ W h² (IS 1893 cl. 7.7.1). The shear in a storey is the sum of the forces above it.',
      note: ctx.stilt
        ? `Open parking level: the shear in the parking storey is multiplied by ${STILT_FACTOR} (IS 1893 cl. 7.10.3(a)) before it is compared with the wind. The same code clause also asks for the stiffness of the infill in the other storeys to be ignored; the model does not do that, IS 1893:2002 cl. 7.8.1 asks for a dynamic analysis of an irregular framed building taller than 12 m in Zone IV or V, which a soft storey makes it; the model makes none. The 2016 edition of IS 1893, now in force, treats an open storey differently (its rules were not read for this sheet). The sum of the storey shears shown here is therefore before the factor.`
        : undefined,
    })
  )

  // ---- 5d. wind
  const vb = work.vb.vb
  const roof = F - 1
  const w = Math.min(plan.L, plan.W)
  const l = Math.max(plan.L, plan.W)
  const np = netPressureDetail(H, l, w)
  L.value('Basic wind speed Vb', vb, 'm/s', 0, `${STD.is875_3} cl. 5.2`)
  L.say('Method', 'The wind pressure at each level is found from the design wind speed at that height, multiplied by the net pressure coefficient of the whole building, the height each level looks after and the width of the wall it faces.', STD.is875_3)
  const hRoof = plan.floors[roof].zTop
  const k2 = L.calc(
    'Height factor k2 at the roof',
    'k2 from Table 2 (the Class A column of the terrain category), interpolated between the table heights',
    `z = {z} m between table heights`,
    { z: hRoof },
    (v) => {
      const t = K2_CLASS_A[ctx.terrain]
      if (v.z <= K2_HEIGHTS[0]) return t[0]
      for (let i = 0; i < K2_HEIGHTS.length - 1; i++) if (v.z <= K2_HEIGHTS[i + 1]) return t[i] + ((t[i + 1] - t[i]) * (v.z - K2_HEIGHTS[i])) / (K2_HEIGHTS[i + 1] - K2_HEIGHTS[i])
      return t[t.length - 1]
    },
    { dp: 4, ref: `${STD.is875_3} Table 2; cl. 5.3.2`, note: `The model reads the Class A column at every height. Table 2 heights ${K2_HEIGHTS.join(', ')} m give ${K2_CLASS_A[ctx.terrain].join(', ')}. IS 875 (Part 3) cl. 5.3.2.2 gives Class A to a building whose greatest dimension is under 20 m and Class B to one of 20 to 50 m${hRoof > K2_HEIGHTS[K2_HEIGHTS.length - 1] ? `; here the height is ${d1(hRoof)} m, so the code would use Class B, and the model holds k2 at its ${K2_HEIGHTS[K2_HEIGHTS.length - 1]} m value above ${K2_HEIGHTS[K2_HEIGHTS.length - 1]} m where the code continues the table to 50 m. The effect on the pressure is about 2 %` : ''}.`, ...ex(k2At(hRoof, ctx.terrain)) }
  )
  const vz = L.calc('Design wind speed at the roof', 'Vz = Vb × k1 × k2 × k3', '{vb} × 1.0 × {k2} × 1.0', { vb, k2 }, (v) => v.vb * v.k2, { unit: 'm/s', dp: 2, ref: `${STD.is875_3} cl. 5.3` })
  L.calc('Design wind pressure at the roof', 'pz = 0.6 Vz²', '0.6 × {vz}² ÷ 1000', { vz }, (v) => (0.6 * v.vz * v.vz) / 1000, { unit: 'kN/m²', dp: 3, ref: `${STD.is875_3} cl. 5.4`, ...ex(lat.wind.pzRoof), result: true })
  L.compare('Pressure at the roof against the report', lat.wind.pzRoof, result.wind.pzRoofKnM2, undefined, 1e-9)
  L.say('Shape of the building', `Height ÷ shorter side h/w = ${d2(np.hw)} and longer ÷ shorter side l/w = ${d2(np.lw)} select row ${np.row + 1}, column ${np.col + 1} of the wall pressure table.`, `${STD.is875_3} Table 4`)
  L.value('Windward wall coefficient', np.windward, '', 2, `${STD.is875_3} Table 4 (values rebuilt from a damaged scan)`)
  L.value('Leeward wall suction (the larger of the two wind angles)', np.leeward, '', 2, `${STD.is875_3} Table 4 (values rebuilt from a damaged scan)`)
  L.calc('Net coefficient on the walls', 'ct = windward + leeward', '{a} + {b}', { a: np.windward, b: np.leeward }, (v) => v.a + v.b, { dp: 2, ref: `${STD.is875_3} Table 4`, ...ex(lat.wind.ct), note: 'Pressure and suction act together on the two faces of the building' })
  L.compare('Net coefficient against the report', lat.wind.ct, result.wind.ct, 3)
  // level forces
  const wRows: string[][] = []
  const fxs: number[] = []
  const fys: number[] = []
  const hs = plan.floors.map((f) => f.zTop)
  for (let k = 0; k < F; k++) {
    const below = k === 0 ? 0 : hs[k - 1]
    const above = k === F - 1 ? hs[k] + 2 * WIND_PARAPET_M : hs[k + 1]
    const trib = (k === 0 && ctx.stilt ? 0 : (hs[k] - below) / 2) + (above - hs[k]) / 2
    const kk = (() => {
      const t = K2_CLASS_A[ctx.terrain]
      const z = hs[k]
      if (z <= K2_HEIGHTS[0]) return t[0]
      for (let i = 0; i < K2_HEIGHTS.length - 1; i++) if (z <= K2_HEIGHTS[i + 1]) return t[i] + ((t[i + 1] - t[i]) * (z - K2_HEIGHTS[i])) / (K2_HEIGHTS[i + 1] - K2_HEIGHTS[i])
      return t[t.length - 1]
    })()
    const Vzk = vb * kk
    const pz = (0.6 * Vzk * Vzk) / 1000
    check(L, `Wind pressure at level ${k}`, pz, windPressure(vb, hs[k], ctx.terrain))
    const f = plan.floors[k]
    const fx = pz * lat.wind.ct * trib * f.ny * plan.sy
    const fy = pz * lat.wind.ct * trib * f.nx * plan.sx
    fxs.push(fx)
    fys.push(fy)
    wRows.push([levelName(k, F, ctx.stilt), d2(hs[k]), d3(kk), d2(Vzk), d3(pz), d2(trib), d2(f.ny * plan.sy), d1(fx), d1(f.nx * plan.sx), d1(fy)])
  }
  const cum = (a: number[]) => {
    const V = new Array<number>(F).fill(0)
    for (let k = F - 1; k >= 0; k--) V[k] = a[k] + (k < F - 1 ? V[k + 1] : 0)
    return V
  }
  const wVx = cum(fxs)
  const wVy = cum(fys)
  for (let k = 0; k < F; k++) {
    check(L, `Wind storey shear x, storey ${k}`, wVx[k], lat.wind.x[k])
    check(L, `Wind storey shear y, storey ${k}`, wVy[k], lat.wind.y[k])
  }
  const wBx = L.calc('Wind base shear along x', 'Vw = Σ forces on all levels', '{a}', { a: wVx[0] }, (v) => v.a, { unit: 'kN', dp: 1, ref: `${STD.is875_3} cl. 6.3`, ...ex(lat.wind.x[0]), result: true })
  const wBy = L.calc('Wind base shear along y', 'Vw = Σ forces on all levels', '{a}', { a: wVy[0] }, (v) => v.a, { unit: 'kN', dp: 1, ref: `${STD.is875_3} cl. 6.3`, ...ex(lat.wind.y[0]), result: true })
  L.compare('Wind base shear along x against the report', wBx, result.wind.windBaseKN.x, undefined, 1e-9)
  L.compare('Wind base shear along y against the report', wBy, result.wind.windBaseKN.y, undefined, 1e-9)
  blocks.push(takeBlock(L, 'lat-wind', 'Wind: pressure and base shear', { intro: 'The wind pressure is worked from IS 875 (Part 3), 1987 edition, as a check beside the earthquake force.' }))
  blocks.push(
    tableBlock(
      'lat-wind-levels',
      'Wind force at each level',
      table(['Level', 'Height z (m)', 'k2', 'Vz (m/s)', 'pz (kN/m²)', 'Height looked after (m)', 'Wall width, wind along x (m)', 'Force Fx (kN)', 'Wall width, wind along y (m)', 'Force Fy (kN)'], wRows, { num: [1, 2, 3, 4, 5, 6, 7, 8, 9] }),
      {
        intro: 'Force at a level = pz × ct × (height the level looks after) × (width of the wall facing the wind). The height a level looks after runs from half-way down to the level below to half-way up to the level above; the roof level also takes a 1 m parapet.',
        note: ctx.stilt ? 'Open parking level: the half storey below level 0 has no wall to catch the wind and is left out.' : undefined,
      }
    )
  )
  if (lat.wind.slender) L.say('Slender building', 'The height is at least five times the width. Wind sway and dynamic effects are not covered by this model.', STD.is875_3)

  // ---- 5e. which governs
  const gRows: string[][] = []
  for (const dir of ['x', 'y'] as const) {
    const q = lat.baseShear[dir]
    const wv = lat.wind[dir][0]
    const gov = q >= wv ? 'earthquake' : 'wind'
    L.compare(`Which governs along ${dir}`, gov === 'earthquake' ? 0 : 1, lat.governs[dir] === 'earthquake' ? 0 : 1, 0)
    L.compare(`Which governs along ${dir}, against the report`, gov === 'earthquake' ? 0 : 1, result.wind.governs[dir] === 'earthquake' ? 0 : 1, 0)
    gRows.push([`Along ${dir}`, d1(q), d1(wv), gov === 'earthquake' ? 'Earthquake' : 'Wind'])
  }
  const ratio = L.calc(
    'Wind base shear ÷ earthquake base shear (the worse direction)',
    'max(Vw,x ÷ VB,x ; Vw,y ÷ VB,y)',
    'max({a} ÷ {b}; {c} ÷ {d})',
    { a: wBx, b: vbx, c: wBy, d: vby },
    (v) => Math.max(v.a / v.b, v.c / v.d),
    { dp: 3, ref: STD.rule, ...ex(result.wind.ratio), result: true }
  )
  void ratio
  blocks.push(
    takeBlock(L, 'lat-governs', 'Which load governs', {
      intro: 'Storey by storey the design takes the larger of the earthquake shear and the wind shear and never adds them (IS 1893 cl. 6.2(b): an earthquake is not taken to occur together with the design wind).',
      table: table(['Direction', 'Earthquake base shear (kN)', 'Wind base shear (kN)', 'Governs at the base'], gRows, { num: [1, 2] }),
    })
  )

  return {
    id: 'lateral',
    title: '5. Lateral loads: earthquake and wind',
    intro: 'The frame is designed for the larger of the earthquake and the wind in each direction. The earthquake is worked by the equivalent static method of IS 1893 (Part 1):2002 and the wind by IS 875 (Part 3):1987. The forces on the frame come from the portal method, a hand method for regular frames: they are not a computer analysis of the frame.',
    blocks,
  }
}

/** Number, total length and length-weighted mean self weight (kN/m) of the first-pass beams of one level. */
function p1Beams(c: CalcCtx, k: number): { n: number; len: number; mean: number } {
  const list = c.work.pass1.beams[k]
  const len = list.reduce((s, r) => s + r.L, 0)
  const sum = list.reduce((s, r) => s + (r.des?.selfWeight ?? 0) * r.L, 0)
  return { n: list.length, len, mean: len > 0 ? sum / len : 0 }
}
