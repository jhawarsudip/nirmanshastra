// Section 4 of the StructurePro calculation sheet: dead, imposed and factored loads.

import type { CalcBlock, CalcSection } from '@/lib/calcsheet'
import type { CalcCtx } from './ctx'
import { GAMMA_BRICK, GAMMA_PLASTER, GAMMA_RC } from '../codes'
import {
  BEAM_D_EST,
  CEILING_PLASTER,
  FLOOR_FINISH,
  FLOOR_LL,
  PARAPET_PLASTER,
  PARAPET_T,
  PARTITION_PRESENCE,
  PARTITION_T,
  PLASTER_EXT,
  PLASTER_INT,
  ROOF_FINISH,
  SEISMIC_LL_SHARE,
  WINDOW_FACTOR,
  balconyLoads,
  bayLoad,
  wallUDL,
} from '../frame'
import { BALCONY_LL, eqLoad, llReduction } from '../plan'
import { STD, d0, d2, d3, ex, fixed, governingBeams, levelName, table, takeBlock, tableBlock, type BeamPick } from './helpers'

const REF_EQ = 'IS 456:2000 cl. 24.5, Fig. 7; equivalent uniform load: standard formula'

export function loadsSection(c: CalcCtx): CalcSection {
  const { L, work } = c
  const { ctx, plan } = work
  const F = plan.F
  const blocks: CalcBlock[] = []
  const t = ctx.tSlab / 1000

  // ---- 4a. unit weights and imposed loads
  L.value('Reinforced concrete', GAMMA_RC, 'kN/m³', 0, `${STD.is456} cl. 19.2.1; ${STD.is875_1} Table 1`)
  L.value('Brick masonry', GAMMA_BRICK, 'kN/m³', 2, `${STD.is875_1} Table 1 (1920 kg/m³)`)
  if (work.wallType === 'block') L.value('Concrete block masonry', ctx.wallGamma, 'kN/m³', 1, STD.assume, 'The unit weight of hollow or solid block depends on the make; confirm with the block supplier')
  L.value('Cement plaster', GAMMA_PLASTER, 'kN/m³', 1, `${STD.is875_1} Table 1`)
  L.value('Floor finish on the floors', FLOOR_FINISH, 'kN/m²', 1, STD.assume, 'Flooring and its bedding; the finish values of IS 875 (Part 1) are not read by the model')
  L.value('Roof finish (waterproofing and brick-bat coba)', ROOF_FINISH, 'kN/m²', 1, STD.assume)
  L.value('Ceiling plaster under every slab', CEILING_PLASTER, 'kN/m²', 2, STD.assume, '12 mm of cement plaster, 0.012 × 20.4 = 0.245, taken as 0.25')
  L.value('Imposed load on the floors', FLOOR_LL, 'kN/m²', 1, `${STD.is875_2} Table 1`, 'Residential rooms')
  L.value('Imposed load on the roof', ctx.terraceLL, 'kN/m²', 2, `${STD.is875_2} Table 2`, ctx.terraceLL === 1.5 ? 'Roof used as a terrace (access provided)' : 'Roof without access')
  if (ctx.balcony) L.value('Imposed load on balconies', BALCONY_LL, 'kN/m²', 1, `${STD.is875_2} Table 1`)
  L.value('Share of the imposed load that counts as mass in an earthquake', SEISMIC_LL_SHARE, '', 2, `${STD.is1893} Table 8 and cl. 7.3.1`, 'For imposed loads up to 3 kN/m²; none on the roof (cl. 7.3.2)')
  blocks.push(takeBlock(L, 'loads-basis', 'Unit weights and imposed loads used'))

  // ---- 4b. slab load per m2
  if (F > 1) {
    const bl = bayLoad(ctx, 0, 0, 0)
    L.calc('Dead load of a floor slab (a floor above it)', 'g = γ t + floor finish + ceiling plaster', '{g} × {t} + {f} + {p}', { g: GAMMA_RC, t, f: FLOOR_FINISH, p: CEILING_PLASTER }, (v) => v.g * v.t + v.f + v.p, {
      unit: 'kN/m²',
      dp: 3,
      ref: `${STD.is875_1}; ${STD.assume} (finish)`,
      ...ex(bl.dl),
    })
    L.value('Imposed load of a floor slab', bl.ll, 'kN/m²', 2, `${STD.is875_2} Table 1`)
  }
  const blRoof = bayLoad(ctx, F - 1, 0, 0)
  L.calc('Dead load of the roof slab', 'g = γ t + roof finish + ceiling plaster', '{g} × {t} + {f} + {p}', { g: GAMMA_RC, t, f: ROOF_FINISH, p: CEILING_PLASTER }, (v) => v.g * v.t + v.f + v.p, {
    unit: 'kN/m²',
    dp: 3,
    ref: `${STD.is875_1}; ${STD.assume} (finish)`,
    ...ex(blRoof.dl),
  })
  L.value('Imposed load of the roof slab', blRoof.ll, 'kN/m²', 2, `${STD.is875_2} Table 2`)
  blocks.push(takeBlock(L, 'loads-slab', 'Slab loads per square metre', { note: 'A bay with a floor above it is loaded as a floor; the top storey, and any bay not covered by the storey above it, is loaded as a roof.' }))

  // ---- 4c. walls
  const h = plan.hs - BEAM_D_EST
  L.value('Clear wall height on a beam', h, 'm', 2, `${STD.assume}: storey height less 0.4 m for the beam depth, before the beam is designed`)
  L.value('Allowance for doors and windows', WINDOW_FACTOR, '', 2, STD.assume, 'The wall is counted at 85 % of its full weight')
  L.calc('Outer wall per metre run of beam', 'w = (t γ + plaster γp) × h × 0.85', '({t} × {g} + {p} × {gp}) × {h} × {o}', { t: ctx.wallT, g: ctx.wallGamma, p: PLASTER_EXT, gp: GAMMA_PLASTER, h, o: WINDOW_FACTOR }, (v) => (v.t * v.g + v.p * v.gp) * v.h * v.o, {
    unit: 'kN/m',
    dp: 3,
    ref: `${STD.is875_1} Table 1; ${STD.assume}`,
    note: `Wall ${d0(ctx.wallT * 1000)} mm thick, plaster ${d0(PLASTER_EXT * 1000)} mm in all on the two faces`,
    ...ex(wallUDL(ctx, 'ext')),
  })
  L.calc(
    'Inner partition per metre run of beam',
    'w = presence × (t γ + plaster γp) × h × 0.85',
    '{q} × ({t} × {g} + {p} × {gp}) × {h} × {o}',
    { q: PARTITION_PRESENCE, t: PARTITION_T, g: GAMMA_BRICK, p: PLASTER_INT, gp: GAMMA_PLASTER, h, o: WINDOW_FACTOR },
    (v) => v.q * (v.t * v.g + v.p * v.gp) * v.h * v.o,
    { unit: 'kN/m', dp: 3, ref: `${STD.is875_1} Table 1; ${STD.assume}`, note: `A ${d0(PARTITION_T * 1000)} mm brick partition on half of the inner beam lines`, ...ex(wallUDL(ctx, 'int')) }
  )
  L.calc('Parapet on the roof edge, per metre', 'w = t γ + plaster γp', '{t} × {g} + {p} × {gp}', { t: PARAPET_T, g: GAMMA_BRICK, p: PARAPET_PLASTER, gp: GAMMA_PLASTER }, (v) => v.t * v.g + v.p * v.gp, {
    unit: 'kN/m',
    dp: 3,
    ref: `${STD.is875_1} Table 1; ${STD.assume}`,
    note: 'A 115 mm brick parapet, plastered both faces',
    ...ex(wallUDL(ctx, 'parapet')),
  })
  blocks.push(takeBlock(L, 'loads-walls', 'Wall loads on beams', { note: 'A wall is loaded on the beam of the storey below it. The ground-storey walls stand on the plinth beams, not on the frame, and enter only the seismic weight. With an open parking level there is no wall on the parking level.' }))

  // ---- 4d. equivalent loads on the governing beams
  const gb = governingBeams(work.analysis)
  const pickBlock = (pk: BeamPick | undefined, id: string, title: string) => {
    if (!pk) return
    const r = pk.rec
    const f = plan.floors[r.k]
    const other = r.dir === 'x' ? plan.sy : plan.sx
    L.input('Beam', `${r.dir === 'x' ? 'along the length' : 'along the width'}, ${levelName(r.k, F, ctx.stilt).toLowerCase()}, span ${r.i + 1} of ${r.n} in its line, ${fixed(r.L, 2)} m`, STD.rule, `${r.perimeter ? 'On the outer wall line' : 'An inner beam'}; the beam that sets the size for its type`)
    const bays = r.dir === 'x' ? [[r.ix, r.iy], [r.ix, r.iy - 1]] : [[r.ix, r.iy], [r.ix - 1, r.iy]]
    let mDL = 0
    let mLL = 0
    let vDL = 0
    let vLL = 0
    for (const [bx, by] of bays) {
      if (bx < 0 || by < 0 || bx >= f.nx || by >= f.ny) continue
      const bl = bayLoad(ctx, r.k, bx, by)
      const lx = Math.min(r.L, other)
      const ly = Math.max(r.L, other)
      const tri = r.L <= other
      const aRatio = ly / lx
      const eqDL = eqLoad(bl.dl, r.L, other)
      const eqLL = eqLoad(bl.ll, r.L, other)
      const tag = `bay ${bx + 1},${by + 1}`
      L.say(`Bay beside the beam (${tag})`, `${bl.terrace ? 'Roof' : 'Floor'} slab: dead ${d3(bl.dl)} kN/m², imposed ${d2(bl.ll)} kN/m². Short side ${d2(lx)} m, long side ${d2(ly)} m. The beam is on the ${tri ? 'short' : 'long'} side, so the slab load comes to it as a ${tri ? 'triangle' : 'trapezoid'}.`, `${STD.is456} cl. 24.5, Fig. 7 (loads on supporting beams)`)
      const mf = (v: { w: number; lx: number; a: number }) => (tri ? (v.w * v.lx) / 3 : ((v.w * v.lx) / 6) * (3 - 1 / (v.a * v.a)))
      const vf = (v: { w: number; lx: number; a: number }) => (tri ? (v.w * v.lx) / 4 : ((v.w * v.lx) / 2) * (1 - 1 / (2 * v.a)))
      const fm = tri ? 'w lx ÷ 3' : '(w lx ÷ 6)(3 − 1/α²)'
      const fv = tri ? 'w lx ÷ 4' : '(w lx ÷ 2)(1 − 1/(2α))'
      const wk = tri ? '{w} × {lx} ÷ 3' : '({w} × {lx} ÷ 6) × (3 − 1 ÷ {a}²)'
      const wv = tri ? '{w} × {lx} ÷ 4' : '({w} × {lx} ÷ 2) × (1 − 1 ÷ (2 × {a}))'
      mDL += L.calc(`Equivalent uniform dead load, for the moment (${tag})`, `weq = ${fm}`, wk, { w: bl.dl, lx, a: aRatio }, (v) => mf({ w: v.w, lx: v.lx, a: v.a }), { unit: 'kN/m', dp: 3, ref: REF_EQ, ...ex(eqDL.m) })
      vDL += L.calc(`Equivalent uniform dead load, for the shear (${tag})`, `weq = ${fv}`, wv, { w: bl.dl, lx, a: aRatio }, (v) => vf({ w: v.w, lx: v.lx, a: v.a }), { unit: 'kN/m', dp: 3, ref: REF_EQ, ...ex(eqDL.v) })
      mLL += L.calc(`Equivalent uniform imposed load, for the moment (${tag})`, `weq = ${fm}`, wk, { w: bl.ll, lx, a: aRatio }, (v) => mf({ w: v.w, lx: v.lx, a: v.a }), { unit: 'kN/m', dp: 3, ref: REF_EQ, ...ex(eqLL.m) })
      vLL += L.calc(`Equivalent uniform imposed load, for the shear (${tag})`, `weq = ${fv}`, wv, { w: bl.ll, lx, a: aRatio }, (v) => vf({ w: v.w, lx: v.lx, a: v.a }), { unit: 'kN/m', dp: 3, ref: REF_EQ, ...ex(eqLL.v) })
    }
    // a balcony cantilevering from this beam
    let balDL = 0
    let balLL = 0
    if (ctx.balcony && r.dir === 'x') {
      for (const sl of ctx.balcony.slots) {
        if (sl.k !== r.k || sl.ix !== r.ix || sl.iy !== r.iy) continue
        const bl = balconyLoads(ctx, ctx.balcony, sl.lenM)
        const share = sl.lenM / r.L
        L.say('Balcony on this beam', `A balcony ${d2(sl.lenM)} m long cantilevers from the beam; its dead load ${d2(bl.dl)} kN/m and imposed load ${d2(bl.ll)} kN/m (each over the balcony length) are spread over the beam span.`, `${STD.assume}: equivalent uniform load`)
        balDL += bl.dl * share
        balLL += bl.ll * share
      }
      if (balDL > 0) {
        L.value('Balcony dead load spread over the span', balDL, 'kN/m', 3, STD.assume)
        L.value('Balcony imposed load spread over the span', balLL, 'kN/m', 3, STD.assume)
      }
    }
    mDL += balDL
    vDL += balDL
    mLL += balLL
    vLL += balLL
    const wall = L.pick('Wall on this beam', 'by what stands above it', r.wallKind === 'none' ? 'none' : r.wallKind === 'ext' ? 'outer wall of the storey above' : r.wallKind === 'int' ? 'inner partition of the storey above' : 'roof parapet', STD.rule, `Loaded value ${d3(r.wall)} kN/m (from the wall loads above)`)
    void wall
    const mDLt = L.calc('Dead load for the moment (slab + balcony + wall)', 'wd = Σ weq + wall', '{a} + {w}', { a: mDL, w: r.wall }, (v) => v.a + v.w, { unit: 'kN/m', dp: 3, ref: STD.rule, ...ex(r.mDL), result: false })
    L.calc('Dead load for the shear (slab + balcony + wall)', 'wdv = Σ weq + wall', '{a} + {w}', { a: vDL, w: r.wall }, (v) => v.a + v.w, { unit: 'kN/m', dp: 3, ref: STD.rule, ...ex(r.vDL) })
    L.calc('Imposed load for the moment', 'wl = Σ weq', '{a}', { a: mLL }, (v) => v.a, { unit: 'kN/m', dp: 3, ref: STD.rule, ...ex(r.mLL) })
    L.calc('Imposed load for the shear', 'wlv = Σ weq', '{a}', { a: vLL }, (v) => v.a, { unit: 'kN/m', dp: 3, ref: STD.rule, ...ex(r.vLL) })
    void mDLt
    blocks.push(takeBlock(L, id, title, { intro: 'The slab load reaches a beam as a triangle on the short side of a panel and a trapezoid on the long side. The model replaces each by an equal uniform load, one value that gives the same bending moment and one that gives the same shear. The beam\'s own weight is added when its depth is known (Section 6).' }))
  }
  pickBlock(gb.edge, 'loads-edge', 'Loads on the governing edge beam')
  pickBlock(gb.inner, 'loads-inner', 'Loads on the governing inner beam')

  // ---- 4e. imposed-load reduction on columns
  blocks.push(
    tableBlock(
      'loads-reduction',
      'Reduction of imposed load on columns',
      table(
        ['Floors carried by the column (roof included)', 'Reduction of the imposed load'],
        [1, 2, 3, 4, 5].map((n) => [n === 5 ? '5 or more' : String(n), `${d0(llReduction(n) * 100)} %`]),
        { num: [1] }
      ),
      { intro: 'The imposed load on a column is reduced by the number of floors it carries.', note: `${STD.is875_2} cl. 3.2.1 lets a designer reduce the imposed load on columns in this way. The model applies it to columns only. Beams and slabs take the full imposed load (cl. 3.2.2 would allow a small reduction on large beam areas: not taken, which is on the safe side).` }
    )
  )

  // ---- 4f. combinations
  const comb = [
    ['1', '1.5 (DL + LL)', 'Gravity only', `${STD.is456} Table 18; ${STD.is1893} cl. 6.3.1.2`],
    ['2', '1.2 (DL + LL ± EL)', 'Gravity with the earthquake', `${STD.is456} Table 18; ${STD.is1893} cl. 6.3.1.2`],
    ['3', '1.5 (DL ± EL)', 'Dead load with the earthquake', `${STD.is456} Table 18; ${STD.is1893} cl. 6.3.1.2`],
    ['4', '0.9 DL ± 1.5 EL', 'Overturning and moment reversal', `${STD.is456} Table 18; ${STD.is1893} cl. 6.3.1.2`],
  ]
  blocks.push(
    tableBlock('loads-combinations', 'Factored combinations of loads', table(['Case', 'Combination', 'Meaning', 'Source'], comb), {
      intro: 'Limit state design takes the least favourable of these four combinations for every member. EL is the earthquake or the wind, whichever is the larger lateral force storey by storey: they are never added together.',
      note:
        'Beams (Section 6): hogging moment = the largest of 1.5 Ms, 1.2 (Ms + ME) and 1.5 (rD Ms + ME); sagging at a support = 1.5 ME − 0.9 rD Ms, never less than half the hogging moment in Zones III and above; mid-span sagging = 1.5 Ms. Ms is the gravity moment from IS 456 Table 12, ME the earthquake moment from the portal method and rD the dead share of the load. Shear = the larger of 1.5 Vg and 1.2 (Vg + VE). Columns (Section 7): the seven cases listed there, with 100 % of the lateral force one way and 30 % the other (IS 1893 cl. 6.3.2.2).',
    })
  )

  return {
    id: 'loads',
    title: '4. Loads',
    intro: 'Dead loads come from the slab thickness, finishes, walls and the members\' own weight; imposed loads from IS 875 (Part 2); the factored combinations are those of IS 456 Table 18 with the earthquake terms of IS 1893.',
    blocks,
  }
}
