// Section 10: the balconies and the small RCC items a frame analysis does not produce (lintels, sunshades, the terrace parapet band, the stair head-room roof).

import type { CalcBlock, CalcSection } from '@/lib/calcsheet'
import type { CalcCtx } from './ctx'
import { BALCONY_RULES as B } from '../balcony'
import { COVER_SLAB, FY, GAMMA_RC, TAU_BD_PLAIN, astSingly, devLength, stirrupCutLength } from '../codes'
import { CEILING_PLASTER, FLOOR_FINISH, wallUDL } from '../frame'
import { BALCONY_BASIC_LD, BALCONY_LL, BALCONY_MF, BALCONY_SLAB } from '../plan'
import { SECONDARY_RULES as R } from '../secondary'
import { PANEL_RULES } from '../slab'
import { STD, barLine, check, d0, d1, d2, d3, ex, levelName, plural, sumOf, table, tableBlock, takeBlock } from './helpers'
import { put } from './figs'
import { choose } from './slabs'

const level = (k: number, F: number, stilt: boolean) => levelName(k, F, stilt).replace(/, top of.*/, '')

function balconyBlocks(c: CalcCtx): CalcBlock[] {
  const { L, work } = c
  const a = work.analysis
  const bal = a.balcony
  const bc = work.ctx.balcony
  if (!bal || !bc) return []
  const det = bal.detail
  const { plan, ctx } = work
  const F = plan.F
  const fck = ctx.fck
  const blocks: CalcBlock[] = []

  // ---- layout
  L.value('Balconies asked per upper floor', work.nBal, '', 0, STD.yours)
  const lc = L.value('Projection of a balcony', work.lcAsked, 'm', 1, STD.yours)
  const nSlots = L.value('Balconies in the building', bc.slots.length, '', 0, STD.rule, `On ${new Set(bc.slots.map((s) => s.k)).size} ${plural(new Set(bc.slots.map((s) => s.k)).size, 'floor', 'floors')}; one balcony is the width of its bay, up to 3.6 m`)
  check(L, 'Balcony slabs', nSlots, bal.result.count, 0)
  blocks.push(
    tableBlock('bal-slots', 'Where the balconies are', table(['Slab at', 'Wall', 'Bay along the length', 'Length (m)'], bc.slots.map((s) => [level(s.k, F, ctx.stilt), s.side === 'front' ? 'Front' : 'Back', d0(s.ix + 1), d2(s.lenM)]), { num: [2, 3] }), {
      intro: 'The balconies are spread over the bays of the floor above, the front wall first and then the back wall (the back only when the floor above is as deep as the slab below). Each is cast with the slab at the level shown.',
    })
  )

  // ---- thickness
  const dReq = L.calc('Effective depth needed, before rounding', 'd = projection ÷ (7 × 1.2)', '{l} × 1000 ÷ ({b} × {m})', { l: lc, b: BALCONY_BASIC_LD, m: BALCONY_MF }, (v) => (v.l * 1000) / (v.b * v.m), {
    unit: 'mm',
    dp: 1,
    ref: `${STD.is456} cl. 23.2.1 (basic ratio 7 for a cantilever); ${STD.assume} (modification factor 1.2)`,
  })
  const D = L.calc('Thickness of the balcony slab', 'D = d + 25, up to the next 25 mm, not under 125 mm', 'max({m}; ceil(({d} + {a}) ÷ {s}) × {s})', { m: BALCONY_SLAB.tMinMm, d: dReq, a: BALCONY_SLAB.allowMm, s: BALCONY_SLAB.stepMm }, (v) => Math.max(v.m, Math.ceil((v.d + v.a) / v.s) * v.s), {
    unit: 'mm',
    dp: 0,
    ref: STD.rule,
    note: 'The 25 mm is cover 20 mm and half of a 10 mm bar',
    ...ex(det.D),
  })
  check(L, 'Balcony thickness on the plan', bc.tMm, D, 0)
  const d = L.calc('Effective depth', 'd = D − cover − half a bar', '{D} − {c} − {h}', { D, c: COVER_SLAB, h: B.halfBarMm }, (v) => v.D - v.c - v.h, { unit: 'mm', dp: 0, ref: `Section 2 (cover); ${STD.rule}`, ...ex(det.d) })
  blocks.push(takeBlock(L, 'bal-size', 'Balcony slab: thickness'))

  // ---- moment
  const gk = L.calc('Dead load of the slab with finish and plaster', 'gk = γ D + floor finish + ceiling plaster', '{g} × {D} ÷ 1000 + {f} + {p}', { g: GAMMA_RC, D, f: FLOOR_FINISH, p: CEILING_PLASTER }, (v) => v.g * (v.D / 1000) + v.f + v.p, {
    unit: 'kN/m²',
    dp: 3,
    ref: `${STD.is875_1}; ${STD.assume} (finish)`,
    ...ex(det.gk),
  })
  const q = L.value('Imposed load on a balcony', BALCONY_LL, 'kN/m²', 1, `${STD.is875_2} Table 1`, 'Table 1 also gives 1.5 kN per metre run concentrated at the outer edge, to be used where it governs. At the root it gives 1.5 × projection against 1.5 × projection² for the uniform load, so for a projection of 1.0 m or more (all the model offers) the uniform load governs')
  const pTip = L.value('Parapet at the free edge', det.pTip, 'kN/m', 3, 'Section 4', 'A 115 mm brick parapet 1 m high, plastered both faces, per metre run')
  check(L, 'Balcony parapet load', wallUDL(ctx, 'parapet'), det.pTip)
  const H = L.value('Horizontal push on the railing', B.railKNperM, 'kN/m', 2, `${STD.is875_2} cl. 5.1 and Table 3`, `Balconies of dwellings; acts ${B.railHeightM} m above the slab`)
  const MuK = L.calc('Moment at the root, unfactored', 'M = (gk + q) lc² ÷ 2 + parapet × lc + H × h', '({g} + {q}) × {l}² ÷ 2 + {p} × {l} + {h} × {z}', { g: gk, q, l: lc, p: pTip, h: H, z: B.railHeightM }, (v) => ((v.g + v.q) * v.l * v.l) / 2 + v.p * v.l + v.h * v.z, {
    unit: 'kN·m/m',
    dp: 3,
    ref: STD.rule,
    note: 'Slab and imposed load over the projection, the parapet at the tip, and the railing push at its height',
    ...ex(det.MuK),
  })
  const Mu = L.calc('Design moment', 'Mu = 1.5 M', '{f} × {m}', { f: B.loadFactor, m: MuK }, (v) => v.f * v.m, { unit: 'kN·m/m', dp: 3, ref: `${STD.is456} Table 18`, ...ex(det.Mu) })
  blocks.push(takeBlock(L, 'bal-moment', 'Balcony slab: load and moment'))

  // ---- steel
  const minAst = L.calc('Minimum steel', 'Ast,min = 0.0012 b D', '{r} × 1000 × {D}', { r: B.minSteelRatio, D }, (v) => v.r * 1000 * v.D, { unit: 'mm²/m', dp: 0, ref: `${STD.is456} cl. 26.5.2.1`, ...ex(det.minAst) })
  const ast = L.calc(
    'Steel for the moment',
    'Ast = (0.5 fck ÷ fy)(1 − √(1 − 4.6 Mu ÷ (fck b d²))) b d',
    '0.5 × {f} ÷ 500 × (1 − √(1 − 4.6 × {M} × 10^6 ÷ ({f} × 1000 × {d}²))) × 1000 × {d}',
    { f: fck, M: Mu, d },
    (v) => astSingly(v.M * 1e6, 1000, v.d, v.f) ?? (v.M * 1e6) / (0.87 * FY * B.fallbackFactor * v.d),
    { unit: 'mm²/m', dp: 0, ref: `${STD.is456} Annex G, cl. G-1.1(b)`, note: det.astFlex === null ? 'The section is over its limit; the model then uses 0.8 d as the lever arm and warns' : undefined, ...ex(det.ast) }
  )
  const main = choose('Top bars', Math.max(ast, minAst), d)
  check(L, 'Balcony main bar size', main.phi, det.main.pick.phi, 0)
  check(L, 'Balcony main bar spacing', main.s, det.main.pick.s, 0)
  L.pick('Main bars (top)', `larger of the steel for the moment and the minimum, ${(Math.max(ast, minAst)).toFixed(0)} mm²/m; sizes ${PANEL_RULES.barPhis.join(', ')} mm tried in turn`, `${main.phi} mm at ${main.s} mm (spacings found: ${main.tried.map((q2) => `${q2.phi} mm: ${q2.s} mm`).join('; ')})`, `${STD.is456} cl. 26.3.3(b)(1) allows the smaller of 3d and 300 mm; ${STD.rule} (150 mm cap)`)
  const tau = L.value('Design bond stress, plain bars in tension', TAU_BD_PLAIN[fck] ?? 1.2, 'N/mm²', 1, `${STD.is456} cl. 26.2.1.1`, 'Raised by 60 % for deformed bars')
  const Ld = L.calc('Development length of a main bar', 'Ld = φ × 0.87 fy ÷ (4 × 1.6 τbd)', '{p} × 0.87 × {fy} ÷ (4 × 1.6 × {t})', { p: main.phi, fy: FY, t: tau }, (v) => (v.p * 0.87 * v.fy) / (4 * 1.6 * v.t), { unit: 'mm', dp: 0, ref: `${STD.is456} cl. 26.2.1`, ...ex(det.devLengthMm) })
  check(L, 'Balcony development length (model function)', devLength(main.phi, fck), det.devLengthMm)
  const back = L.calc('Length of the top bars back into the room slab', 'larger of Ld and the projection', 'max({ld}; {l} × 1000)', { ld: Ld, l: lc }, (v) => Math.max(v.ld, v.l * 1000), { unit: 'mm', dp: 0, ref: `${STD.is456} cl. 26.2.1 for the anchorage; ${STD.assume}: never less than the projection`, ...ex(det.backSpanMm) })
  const bw = L.value('Width of the supporting beam', ctx.bBeam, 'mm', 0, 'Section 3')
  const mainLen = L.calc('Cut length of a main bar', 'projection − 25 + beam width + back-span + (D − 40)', '{l} × 1000 − {c} + {b} + {k} + ({D} − {e})', { l: lc, c: B.tipCoverMm, b: bw, k: back, D, e: B.tipBendLessMm }, (v) => v.l * 1000 - v.c + v.b + v.k + (v.D - v.e), {
    unit: 'mm',
    dp: 0,
    ref: STD.rule,
    note: 'Stops 25 mm short of the tip, runs over the beam and back into the room, and is bent down at the tip',
    ...ex(det.mainLen),
  })
  const astDist = L.calc('Distribution steel', 'Ast = 0.0012 b D', '{r} × 1000 × {D}', { r: B.minSteelRatio, D }, (v) => v.r * 1000 * v.D, { unit: 'mm²/m', dp: 0, ref: `${STD.is456} cl. 26.5.2.1`, ...ex(det.astDist) })
  let dPhi = B.distPhis[B.distPhis.length - 1] as number
  let dS = 0
  const tried: string[] = []
  for (const phi of B.distPhis) {
    const s = Math.floor(((Math.PI * phi * phi) / 4 * 1000) / astDist / B.distSpacingStep) * B.distSpacingStep
    tried.push(`${phi} mm: ${s} mm`)
    if (s >= B.distAcceptMm || phi === B.distPhis[B.distPhis.length - 1]) {
      dPhi = phi
      dS = Math.max(B.distSpacingFloorMm, Math.min(s, B.distSpacingCapMm))
      break
    }
  }
  check(L, 'Balcony distribution bar size', dPhi, det.dPhi, 0)
  check(L, 'Balcony distribution bar spacing', dS, det.dS, 0)
  L.pick('Distribution bars', `sizes ${B.distPhis.join(', ')} mm tried in turn; taken when the spacing is ${B.distAcceptMm} mm or more; spacing held between ${B.distSpacingFloorMm} and ${B.distSpacingCapMm} mm`, `${dPhi} mm at ${dS} mm (spacings found: ${tried.join('; ')})`, `${STD.is456} cl. 26.5.2.1 and 26.3.3(b)(2); ${STD.rule}`)
  blocks.push(takeBlock(L, 'bal-steel', 'Balcony slab: bars'))

  // ---- quantities
  const s0 = bc.slots[0]
  const eachRow = (sl: (typeof bc.slots)[number], i: number, show: boolean) => {
    const nMain = L.calc('Number of main bars', '(length − 100) ÷ s + 1', 'floor(({len} × 1000 − {e}) ÷ {s}) + 1', { len: sl.lenM, e: B.endAllowMm, s: main.s }, (v) => Math.floor((v.len * 1000 - v.e) / v.s) + 1, { dp: 0, ref: STD.rule, expect: det.perSlab[i].nMain, tol: 0 })
    const kgMain = barLine(L, 'Weight of the main bars', main.phi, mainLen, nMain, { expect: det.perSlab[i].kgMain })
    const nDist = L.calc('Number of distribution bars', '(projection + beam + back-span − 100) ÷ s + 1', 'floor(({l} × 1000 + {b} + {k} − {e}) ÷ {s}) + 1', { l: lc, b: bw, k: back, e: B.endAllowMm, s: dS }, (v) => Math.floor((v.l * 1000 + v.b + v.k - v.e) / v.s) + 1, { dp: 0, ref: STD.rule, expect: det.perSlab[i].nDist, tol: 0 })
    const kgDist = barLine(L, 'Weight of the distribution bars', dPhi, sl.lenM * 1000 - B.distEndMm, nDist, { expect: det.perSlab[i].kgDist, note: 'Each is the balcony length less 50 mm' })
    const conc = L.calc('Concrete in the balcony', 'V = length × projection × D', '{len} × {l} × {D} ÷ 1000', { len: sl.lenM, l: lc, D }, (v) => v.len * v.l * (v.D / 1000), { unit: 'm³', dp: 3, ref: STD.rule, ...ex(det.perSlab[i].concreteM3) })
    const form = L.calc('Shuttering of the balcony', 'S = length × projection + (length + 2 × projection) × D', '{len} × {l} + ({len} + 2 × {l}) × {D} ÷ 1000', { len: sl.lenM, l: lc, D }, (v) => v.len * v.l + (v.len + 2 * v.l) * (v.D / 1000), { unit: 'm²', dp: 3, ref: STD.rule, note: 'The soffit and the three free edges', ...ex(det.perSlab[i].formworkM2) })
    const out = { nMain, nDist, kg: kgMain + kgDist, conc, form }
    if (!show) L.take()
    return out
  }
  L.input('Balcony worked', `${level(s0.k, F, ctx.stilt)}, ${s0.side === 'front' ? 'front' : 'back'} wall, bay ${s0.ix + 1}`, 'Table above')
  const first = eachRow(s0, 0, true)
  blocks.push(takeBlock(L, 'bal-qty-worked', 'Balcony: bars, concrete and shuttering of one balcony'))
  const rows = [first, ...bc.slots.slice(1).map((sl, i) => eachRow(sl, i + 1, false))]
  const tot = { steel: sumOf(rows.map((r) => r.kg)), conc: sumOf(rows.map((r) => r.conc)), form: sumOf(rows.map((r) => r.form)) }
  blocks.push(
    tableBlock(
      'bal-qty-table',
      'Balconies: quantities of each',
      table(['Slab at', 'Wall', 'Length (m)', 'Main bars', 'Distribution bars', 'Steel (kg)', 'Concrete (m³)', 'Shuttering (m²)'], bc.slots.map((sl, i) => [level(sl.k, F, ctx.stilt), sl.side === 'front' ? 'Front' : 'Back', d2(sl.lenM), d0(rows[i].nMain), d0(rows[i].nDist), d1(rows[i].kg), d3(rows[i].conc), d2(rows[i].form)]), {
        num: [2, 3, 4, 5, 6, 7],
        foot: ['All balconies', '', '', '', '', d1(tot.steel), d3(tot.conc), d2(tot.form)],
      })
    )
  )
  L.calc('Steel in the balconies', 'sum of the table', '{s}', { s: tot.steel }, (v) => v.s, { unit: 'kg', dp: 1, ref: STD.rule, ...ex(bal.steelKg), result: true })
  L.calc('Concrete in the balconies', 'sum of the table', '{s}', { s: tot.conc }, (v) => v.s, { unit: 'm³', dp: 2, ref: STD.rule, ...ex(bal.concreteM3), result: true })
  L.calc('Shuttering of the balconies', 'sum of the table', '{s}', { s: tot.form }, (v) => v.s, { unit: 'm²', dp: 1, ref: STD.rule, ...ex(bal.formworkM2), result: true })
  put(L, 'bal.steel', tot.steel)
  put(L, 'bal.vol', tot.conc)
  put(L, 'bal.form', tot.form)
  put(L, 'bal.count', bc.slots.length)
  blocks.push(
    takeBlock(L, 'bal-qty-total', 'Balconies: totals', {
      note: 'The balcony is taken as a continuation of the floor slab (the top bars run into the room), so the supporting beam sees it as a load and the twisting is compatibility torsion, which IS 456 cl. 41.1 does not ask to be designed for. A balcony that does not continue into the floor slab needs its supporting beam designed for torsion by an engineer.',
    })
  )
  return blocks
}

function secondaryBlocks(c: CalcCtx): CalcBlock[] {
  const { L, work } = c
  const { plan, ctx } = work
  const sec = work.parts.secondary
  const det = sec.detail
  const wallT = ctx.wallT
  const F = plan.F
  const stilt = ctx.stilt
  const blocks: CalcBlock[] = []
  const item = (key: string) => sec.items.find((i) => i.key === key)
  const mm = (m: number) => m * 1000

  // ---- rules
  const ru = [
    ['Window', `${R.windowWidthM} m wide, one every ${R.windowPitchM} m of outer wall (at least ${R.minWindows} on a storey)`, 'Opening model'],
    ['Main door', `${R.mainDoorWidthM} m wide, one, on the storey of the entrance`, 'Opening model'],
    ['Internal door', `${R.internalDoorWidthM} m wide in a ${mm(R.partitionT)} mm partition, one per ${R.roomAreaM2} m² of floor`, 'Opening model'],
    ['Lintel', `${mm(R.lintelDepthM)} mm deep, ${mm(R.bearingM)} mm bearing each side; ${R.lintelBottomPhi} mm bars at the bottom (3, or 2 in a wall under ${mm(R.wideWallM)} mm) and 2 of ${R.lintelTopPhi} mm at the top; ${R.lintelStirrupPhi} mm stirrups at ${R.lintelStirrupPitchMm} mm`, 'Site practice'],
    ['Sunshade', `${mm(R.sunProjectionM)} mm projection, ${mm(R.sunThicknessM)} mm thick, ${mm(R.sunExtraM)} mm wider than the opening; ${R.sunMainPhi} mm at ${R.sunMainPitchMm} mm main bars with ${R.sunAnchorMm} mm anchorage; ${R.sunDistPhi} mm at ${R.sunDistPitchMm} mm distribution`, 'Site practice'],
    ['Terrace parapet band', `${mm(R.parapetWidthM)} × ${mm(R.parapetThicknessM)} mm along the roof edge, ${R.parapetBars} bars of ${R.parapetBarPhi} mm (${Math.round((R.parapetLapFactor - 1) * 100)} % more for laps and corners), ${R.parapetStirrupPhi} mm stirrups at ${R.parapetStirrupPitchMm} mm`, 'Site practice'],
    ['Stair head-room roof', `${mm(R.mumtySlabT)} mm slab with ${R.mumtySlabPhi} mm at ${R.mumtySlabPitchMm} mm each way, ${mm(R.mumtyOverhangM)} mm overhang; ${mm(R.mumtyRingM)} × ${mm(R.mumtyRingM)} mm ring beam with ${R.mumtyRingBars} bars of ${R.mumtyRingBarPhi} mm and ${R.mumtyRingStirrupPhi} mm stirrups at ${R.mumtyRingStirrupPitchMm} mm`, 'Site practice'],
  ]
  blocks.push(
    tableBlock('sec-rules', 'Small RCC items: sizes the model uses', table(['Item', 'Size and bars', 'Basis'], ru), {
      intro: 'None of these sizes comes from a code; they are the usual sizes of site practice (NirmanShastra assumption). The counts come from the plan.',
    })
  )

  // ---- counts, storey by storey
  const counted = det.floors.filter((f) => f.counted)
  const worked = counted[0]
  const rowsF: string[][] = []
  let nWinTot = 0
  let nMainTot = 0
  let nIntTot = 0
  for (const fd of det.floors) {
    const f = plan.floors[fd.k]
    if (!fd.counted) {
      rowsF.push([level(fd.k, F, stilt), 'none', '', '', ''])
      continue
    }
    const show = fd === worked
    const per = L.calc(`Perimeter (${level(fd.k, F, stilt)})`, 'p = 2 (bays × sx + bays × sy) × √correction', '2 × ({nx} × {sx} + {ny} × {sy}) × √{s}', { nx: f.nx, sx: plan.sx, ny: f.ny, sy: plan.sy, s: f.scale }, (v) => 2 * (v.nx * v.sx + v.ny * v.sy) * Math.sqrt(v.s), { unit: 'm', dp: 2, ref: 'Section 3', ...ex(fd.perimeter) })
    const nWin = L.calc('Windows', 'larger of 2 and p ÷ 3.6, rounded', 'max({m}; round({p} ÷ {pitch}))', { m: R.minWindows, p: per, pitch: R.windowPitchM }, (v) => Math.max(v.m, Math.round(v.p / v.pitch)), { dp: 0, ref: STD.rule, expect: fd.nWin, tol: 0 })
    const door = f.k === (stilt ? 1 : 0)
    check(L, 'Main door on the storey', door ? 1 : 0, fd.mainDoor ? 1 : 0, 0)
    const nInt = L.calc('Internal doors', 'larger of 1 and area ÷ 13, rounded', 'max(1; round({a} ÷ {r}))', { a: f.areaM2, r: R.roomAreaM2 }, (v) => Math.max(1, Math.round(v.a / v.r)), { dp: 0, ref: STD.rule, expect: fd.nInt, tol: 0 })
    nWinTot += nWin
    nMainTot += door ? 1 : 0
    nIntTot += nInt
    rowsF.push([level(fd.k, F, stilt), d2(per), d0(nWin), door ? '1' : '0', d0(nInt)])
    if (show) blocks.push(takeBlock(L, 'sec-count-worked', `Openings counted at ${level(fd.k, F, stilt)}`))
    else L.take()
  }
  blocks.push(tableBlock('sec-count', 'Openings on every storey', table(['Storey', 'Perimeter (m)', 'Windows', 'Main door', 'Internal doors'], rowsF, { num: [1, 2, 3, 4], foot: ['Total', '', d0(nWinTot), d0(nMainTot), d0(nIntTot)] }), { note: stilt ? 'The open parking level has no walls, so no openings are counted there, and the main door is on the first floor.' : undefined }))

  // ---- lintels
  type LinType = { name: string; opening: number; width: number; count: number }
  const lintelTypes: LinType[] = ([
    { name: 'Window', opening: R.windowWidthM, width: wallT, count: nWinTot },
    { name: 'Main door', opening: R.mainDoorWidthM, width: wallT, count: nMainTot },
    { name: 'Internal door', opening: R.internalDoorWidthM, width: R.partitionT, count: nIntTot },
  ] as LinType[]).filter((t) => t.count > 0)
  const lintelOne = (t: LinType, show: boolean) => {
    const Ln = L.calc(`Length of a ${t.name.toLowerCase()} lintel`, 'L = opening + 2 × bearing', '{o} + 2 × {b}', { o: t.opening, b: R.bearingM }, (v) => v.o + 2 * v.b, { unit: 'm', dp: 2, ref: STD.rule })
    const wide = t.width >= R.wideWallM
    const nBot = wide ? 3 : 2
    const kBot = barLine(L, `Bottom bars (${nBot} of ${R.lintelBottomPhi} mm)`, R.lintelBottomPhi, mm(Ln) - R.lintelEndMm, nBot, { note: 'Each is the lintel length less 50 mm' })
    const kTop = barLine(L, `Top bars (2 of ${R.lintelTopPhi} mm)`, R.lintelTopPhi, mm(Ln) - R.lintelEndMm, 2)
    const nSt = L.calc('Number of stirrups', '(L − 100) ÷ 150 + 1', 'floor(({l} × 1000 − {e}) ÷ {p}) + 1', { l: Ln, e: R.lintelEdgeMm, p: R.lintelStirrupPitchMm }, (v) => Math.floor((v.l * 1000 - v.e) / v.p) + 1, { dp: 0, ref: STD.rule })
    const cut = L.calc('Cut length of a stirrup', 'Ls = 2 (A + E) + 12 φ + 2 × tail extra', '2 × ({A} + {E}) + 12 × {p} + 2 × max(0; 75 − 10 × {p})', { A: mm(t.width) - R.lintelCoverMm, E: mm(R.lintelDepthM) - R.lintelCoverMm, p: R.lintelStirrupPhi }, (v) => stirrupCutLength(v.A, v.E, v.p), { unit: 'mm', dp: 0, ref: `${STD.rule}; cover ${R.lintelCoverMm} mm each side` })
    const kSt = barLine(L, `Stirrups (${R.lintelStirrupPhi} mm)`, R.lintelStirrupPhi, cut, nSt)
    const kg = L.calc('Steel in one lintel', 'sum of the bars', '{a} + {b} + {c}', { a: kBot, b: kTop, c: kSt }, (v) => v.a + v.b + v.c, { unit: 'kg', dp: 2, ref: STD.rule })
    const conc = L.calc('Concrete in one lintel', 'V = L × wall thickness × depth', '{l} × {w} × {d}', { l: Ln, w: t.width, d: R.lintelDepthM }, (v) => v.l * v.w * v.d, { unit: 'm³', dp: 4, ref: STD.rule })
    const form = L.calc('Shuttering of one lintel', 'S = L × (wall thickness + 2 × depth)', '{l} × ({w} + 2 × {d})', { l: Ln, w: t.width, d: R.lintelDepthM }, (v) => v.l * (v.w + 2 * v.d), { unit: 'm²', dp: 3, ref: STD.rule })
    if (show) blocks.push(takeBlock(L, 'sec-lintel', `Lintel: the ${t.name.toLowerCase()} lintel worked`))
    else L.take()
    return { Ln, kg, conc, form }
  }
  const lin = lintelTypes.map((t, i) => ({ t, ...lintelOne(t, i === 0) }))
  const lintelTot = { count: sumOf(lin.map((x) => x.t.count)), kg: sumOf(lin.map((x) => x.t.count * x.kg)), conc: sumOf(lin.map((x) => x.t.count * x.conc)), form: sumOf(lin.map((x) => x.t.count * x.form)) }
  blocks.push(tableBlock('sec-lintel-table', 'Lintels', table(['Type', 'Number', 'Length (m)', 'Steel each (kg)', 'Concrete each (m³)', 'Shuttering each (m²)', 'Steel (kg)', 'Concrete (m³)', 'Shuttering (m²)'], lin.map((x) => [x.t.name, d0(x.t.count), d2(x.Ln), d2(x.kg), d4(x.conc), d3(x.form), d1(x.t.count * x.kg), d3(x.t.count * x.conc), d2(x.t.count * x.form)]), { num: [1, 2, 3, 4, 5, 6, 7, 8], foot: ['All lintels', d0(lintelTot.count), '', '', '', '', d1(lintelTot.kg), d3(lintelTot.conc), d2(lintelTot.form)] })))

  // ---- sunshades
  type SunType = { name: string; opening: number; count: number }
  const sunTypes: SunType[] = ([
    { name: 'Window', opening: R.windowWidthM, count: nWinTot },
    { name: 'Main door', opening: R.mainDoorWidthM, count: nMainTot },
  ] as SunType[]).filter((t) => t.count > 0)
  const sunOne = (t: SunType, show: boolean) => {
    const Ls = L.calc(`Length of a ${t.name.toLowerCase()} sunshade`, 'L = opening + 0.3', '{o} + {e}', { o: t.opening, e: R.sunExtraM }, (v) => v.o + v.e, { unit: 'm', dp: 2, ref: STD.rule })
    const nM = L.calc('Number of main bars', '(L − 100) ÷ s + 1', 'floor(({l} × 1000 − {e}) ÷ {s}) + 1', { l: Ls, e: R.lintelEdgeMm, s: R.sunMainPitchMm }, (v) => Math.floor((v.l * 1000 - v.e) / v.s) + 1, { dp: 0, ref: STD.rule })
    const kM = barLine(L, `Main bars (${R.sunMainPhi} mm)`, R.sunMainPhi, mm(R.sunProjectionM) + R.sunAnchorMm, nM, { note: 'Each is the projection plus 350 mm anchorage into the wall' })
    const nD = L.calc('Number of distribution bars', 'projection ÷ s + 1', 'floor({p} × 1000 ÷ {s}) + 1', { p: R.sunProjectionM, s: R.sunDistPitchMm }, (v) => Math.floor((v.p * 1000) / v.s) + 1, { dp: 0, ref: STD.rule })
    const kD = barLine(L, `Distribution bars (${R.sunDistPhi} mm)`, R.sunDistPhi, mm(Ls) - R.lintelEndMm, nD, { note: 'Each is the sunshade length less 50 mm' })
    const kg = L.calc('Steel in one sunshade', 'sum of the bars', '{a} + {b}', { a: kM, b: kD }, (v) => v.a + v.b, { unit: 'kg', dp: 2, ref: STD.rule })
    const conc = L.calc('Concrete in one sunshade', 'V = L × projection × thickness', '{l} × {p} × {t}', { l: Ls, p: R.sunProjectionM, t: R.sunThicknessM }, (v) => v.l * v.p * v.t, { unit: 'm³', dp: 4, ref: STD.rule })
    const form = L.calc('Shuttering of one sunshade', 'S = L × projection + (L + 2 × projection) × thickness', '{l} × {p} + ({l} + 2 × {p}) × {t}', { l: Ls, p: R.sunProjectionM, t: R.sunThicknessM }, (v) => v.l * v.p + (v.l + 2 * v.p) * v.t, { unit: 'm²', dp: 3, ref: STD.rule })
    if (show) blocks.push(takeBlock(L, 'sec-sun', `Sunshade: the ${t.name.toLowerCase()} sunshade worked`))
    else L.take()
    return { Ls, kg, conc, form }
  }
  const sun = sunTypes.map((t, i) => ({ t, ...sunOne(t, i === 0) }))
  const sunTot = { count: sumOf(sun.map((x) => x.t.count)), kg: sumOf(sun.map((x) => x.t.count * x.kg)), conc: sumOf(sun.map((x) => x.t.count * x.conc)), form: sumOf(sun.map((x) => x.t.count * x.form)) }
  blocks.push(tableBlock('sec-sun-table', 'Sunshades', table(['Type', 'Number', 'Length (m)', 'Steel each (kg)', 'Concrete each (m³)', 'Shuttering each (m²)', 'Steel (kg)', 'Concrete (m³)', 'Shuttering (m²)'], sun.map((x) => [x.t.name, d0(x.t.count), d2(x.Ls), d2(x.kg), d4(x.conc), d3(x.form), d1(x.t.count * x.kg), d3(x.t.count * x.conc), d2(x.t.count * x.form)]), { num: [1, 2, 3, 4, 5, 6, 7, 8], foot: ['All sunshades', d0(sunTot.count), '', '', '', '', d1(sunTot.kg), d3(sunTot.conc), d2(sunTot.form)] })))

  // ---- parapet band
  const top = plan.floors[F - 1]
  const pTop = L.calc('Length of the terrace parapet band', 'p = 2 (bays × sx + bays × sy) × √correction, top storey', '2 × ({nx} × {sx} + {ny} × {sy}) × √{s}', { nx: top.nx, sx: plan.sx, ny: top.ny, sy: plan.sy, s: top.scale }, (v) => 2 * (v.nx * v.sx + v.ny * v.sy) * Math.sqrt(v.s), { unit: 'm', dp: 2, ref: 'Section 3', ...ex(det.pTop) })
  const kPb = barLine(L, `Band bars (${R.parapetBars} of ${R.parapetBarPhi} mm)`, R.parapetBarPhi, mm(pTop) * R.parapetLapFactor, R.parapetBars, { note: '5 % added to the length for laps and corners' })
  const nPs = L.calc('Number of stirrups', 'p ÷ 250 + 1', 'floor({p} × 1000 ÷ {s}) + 1', { p: pTop, s: R.parapetStirrupPitchMm }, (v) => Math.floor((v.p * 1000) / v.s) + 1, { dp: 0, ref: STD.rule })
  const cutP = L.calc('Cut length of a stirrup', 'Ls = 2 (A + E) + 12 φ + 2 × tail extra', '2 × ({A} + {E}) + 12 × {p} + 2 × max(0; 75 − 10 × {p})', { A: mm(R.parapetWidthM) - R.parapetCoverMm, E: mm(R.parapetThicknessM) - R.parapetCoverMm, p: R.parapetStirrupPhi }, (v) => stirrupCutLength(v.A, v.E, v.p), { unit: 'mm', dp: 0, ref: `${STD.rule}; cover ${R.parapetCoverMm} mm` })
  const kPs = barLine(L, `Stirrups (${R.parapetStirrupPhi} mm)`, R.parapetStirrupPhi, cutP, nPs)
  const parSteel = L.calc('Steel in the parapet band', 'sum of the bars', '{a} + {b}', { a: kPb, b: kPs }, (v) => v.a + v.b, { unit: 'kg', dp: 1, ref: STD.rule, result: true })
  const parConc = L.calc('Concrete in the parapet band', 'V = p × width × thickness', '{p} × {w} × {t}', { p: pTop, w: R.parapetWidthM, t: R.parapetThicknessM }, (v) => v.p * v.w * v.t, { unit: 'm³', dp: 3, ref: STD.rule, result: true })
  const parForm = L.calc('Shuttering of the parapet band', 'S = p × (width + 2 × thickness)', '{p} × ({w} + 2 × {t})', { p: pTop, w: R.parapetWidthM, t: R.parapetThicknessM }, (v) => v.p * (v.w + 2 * v.t), { unit: 'm²', dp: 2, ref: STD.rule, result: true })
  blocks.push(takeBlock(L, 'sec-parapet', 'Terrace parapet band'))

  // ---- stair head-room (mumty)
  let mum: { steel: number; conc: number; form: number } | null = null
  if (det.mumty) {
    const wallOut = R.mumtyWallOutM
    const lx = L.calc('Length of the head-room roof', 'lx = stair opening length + 2 × wall + overhang', '{w} + 2 × {t} + {o}', { w: work.analysis.stair.wellLengthM, t: wallOut, o: R.mumtyOverhangM }, (v) => v.w + 2 * v.t + v.o, { unit: 'm', dp: 3, ref: STD.rule, ...ex(det.mumty.lx) })
    const ly = L.calc('Width of the head-room roof', 'ly = stair opening width + 2 × wall + overhang', '{w} + 2 × {t} + {o}', { w: work.analysis.stair.wellWidthM, t: wallOut, o: R.mumtyOverhangM }, (v) => v.w + 2 * v.t + v.o, { unit: 'm', dp: 3, ref: STD.rule, ...ex(det.mumty.ly) })
    const per = L.calc('Length of the ring beam', 'p = 2 (opening length + opening width + 4 × wall)', '2 × ({a} + {b} + 4 × {t})', { a: work.analysis.stair.wellLengthM, b: work.analysis.stair.wellWidthM, t: wallOut }, (v) => 2 * (v.a + v.b + 4 * v.t), { unit: 'm', dp: 3, ref: STD.rule, ...ex(det.mumty.per) })
    const n1 = L.calc('Roof bars along the length: number', '(ly − 100) ÷ s + 1', 'floor(({l} × 1000 − {e}) ÷ {s}) + 1', { l: ly, e: R.mumtyEdgeMm, s: R.mumtySlabPitchMm }, (v) => Math.floor((v.l * 1000 - v.e) / v.s) + 1, { dp: 0, ref: STD.rule })
    const k1 = barLine(L, 'Roof bars along the length', R.mumtySlabPhi, mm(lx) - R.mumtyEndMm, n1)
    const n2 = L.calc('Roof bars along the width: number', '(lx − 100) ÷ s + 1', 'floor(({l} × 1000 − {e}) ÷ {s}) + 1', { l: lx, e: R.mumtyEdgeMm, s: R.mumtySlabPitchMm }, (v) => Math.floor((v.l * 1000 - v.e) / v.s) + 1, { dp: 0, ref: STD.rule })
    const k2 = barLine(L, 'Roof bars along the width', R.mumtySlabPhi, mm(ly) - R.mumtyEndMm, n2)
    const k3 = barLine(L, `Ring beam bars (${R.mumtyRingBars} of ${R.mumtyRingBarPhi} mm)`, R.mumtyRingBarPhi, mm(per) * R.mumtyRingLapFactor, R.mumtyRingBars, { note: '5 % added for laps' })
    const n4 = L.calc('Ring beam stirrups: number', 'p ÷ 150 + 1', 'floor({p} × 1000 ÷ {s}) + 1', { p: per, s: R.mumtyRingStirrupPitchMm }, (v) => Math.floor((v.p * 1000) / v.s) + 1, { dp: 0, ref: STD.rule })
    const cutM = L.calc('Cut length of a ring beam stirrup', 'Ls = 2 (A + E) + 12 φ + 2 × tail extra', '2 × ({A} + {E}) + 12 × {p} + 2 × max(0; 75 − 10 × {p})', { A: mm(R.mumtyRingM) - R.mumtyRingCoverMm, E: mm(R.mumtyRingM) - R.mumtyRingCoverMm, p: R.mumtyRingStirrupPhi }, (v) => stirrupCutLength(v.A, v.E, v.p), { unit: 'mm', dp: 0, ref: `${STD.rule}; cover ${R.mumtyRingCoverMm} mm` })
    const k4 = barLine(L, `Ring beam stirrups (${R.mumtyRingStirrupPhi} mm)`, R.mumtyRingStirrupPhi, cutM, n4)
    const steel = L.calc('Steel in the head-room roof', 'sum of the bars', '{a} + {b} + {c} + {d}', { a: k1, b: k2, c: k3, d: k4 }, (v) => v.a + v.b + v.c + v.d, { unit: 'kg', dp: 1, ref: STD.rule, result: true })
    const conc = L.calc('Concrete in the head-room roof', 'V = lx × ly × t + p × 0.23 × 0.23', '{a} × {b} × {t} + {p} × {r} × {r}', { a: lx, b: ly, t: R.mumtySlabT, p: per, r: R.mumtyRingM }, (v) => v.a * v.b * v.t + v.p * v.r * v.r, { unit: 'm³', dp: 3, ref: STD.rule, result: true })
    const form = L.calc('Shuttering of the head-room roof', 'S = lx × ly + 3 × p × 0.23', '{a} × {b} + 2 × {p} × {r} + {p} × {r}', { a: lx, b: ly, p: per, r: R.mumtyRingM }, (v) => v.a * v.b + 2 * v.p * v.r + v.p * v.r, { unit: 'm²', dp: 2, ref: STD.rule, result: true, note: 'The roof soffit, and the sides and bottom of the ring beam' })
    mum = { steel, conc, form }
    blocks.push(takeBlock(L, 'sec-mumty', 'Stair head-room (mumty) roof'))
  }

  // ---- totals
  const rowsT: Array<{ key: string; label: string; count: number; steel: number; conc: number; form: number }> = [
    { key: 'lintels', label: 'Lintels over doors and windows', count: lintelTot.count, steel: lintelTot.kg, conc: lintelTot.conc, form: lintelTot.form },
    { key: 'sunshades', label: 'Sunshades (chajjas)', count: sunTot.count, steel: sunTot.kg, conc: sunTot.conc, form: sunTot.form },
    { key: 'parapet', label: 'Terrace parapet coping band', count: 1, steel: parSteel, conc: parConc, form: parForm },
  ]
  if (mum) rowsT.push({ key: 'mumty', label: 'Stair head-room (mumty) roof', count: 1, steel: mum.steel, conc: mum.conc, form: mum.form })
  check(L, 'Number of small RCC items', rowsT.length, sec.items.length, 0)
  for (const r of rowsT) {
    const e = item(r.key)
    if (!e) {
      check(L, `Small RCC item ${r.key} exists`, 1, 0, 0)
      continue
    }
    check(L, `${r.label}: number`, r.count, e.count, 0)
    check(L, `${r.label}: steel`, r.steel, e.steelKg)
    check(L, `${r.label}: concrete`, r.conc, e.concreteM3)
    check(L, `${r.label}: shuttering`, r.form, e.formworkM2)
    put(L, `sec.${r.key}.count`, r.count)
    put(L, `sec.${r.key}.steel`, r.steel)
    put(L, `sec.${r.key}.vol`, r.conc)
    put(L, `sec.${r.key}.form`, r.form)
  }
  const tot = { count: sumOf(rowsT.map((r) => r.count)), steel: sumOf(rowsT.map((r) => r.steel)), conc: sumOf(rowsT.map((r) => r.conc)), form: sumOf(rowsT.map((r) => r.form)) }
  blocks.push(tableBlock('sec-total-table', 'Small RCC items: totals', table(['Item', 'Number', 'Concrete (m³)', 'Steel (kg)', 'Shuttering (m²)'], rowsT.map((r) => [r.label, d0(r.count), d3(r.conc), d1(r.steel), d2(r.form)]), { num: [1, 2, 3, 4], foot: ['All small items', d0(tot.count), d3(tot.conc), d1(tot.steel), d2(tot.form)] })))
  L.calc('Concrete in the small RCC items', 'sum of the table', '{s}', { s: tot.conc }, (v) => v.s, { unit: 'm³', dp: 2, ref: STD.rule, ...ex(sec.concreteM3), result: true })
  L.calc('Steel in the small RCC items', 'sum of the table', '{s}', { s: tot.steel }, (v) => v.s, { unit: 'kg', dp: 1, ref: STD.rule, ...ex(sec.steelKg), result: true })
  L.calc('Shuttering of the small RCC items', 'sum of the table', '{s}', { s: tot.form }, (v) => v.s, { unit: 'm²', dp: 1, ref: STD.rule, ...ex(sec.formworkM2), result: true })
  put(L, 'sec.vol', tot.conc)
  put(L, 'sec.steel', tot.steel)
  put(L, 'sec.form', tot.form)
  put(L, 'sec.count', tot.count)
  blocks.push(takeBlock(L, 'sec-total', 'Small RCC items: totals carried to the take-off'))
  return blocks
}

const d4 = (v: number) => v.toFixed(4)

export function smallSection(c: CalcCtx): CalcSection {
  const bal = balconyBlocks(c)
  const sec = secondaryBlocks(c)
  return {
    id: 'small',
    title: '10. Balconies and small RCC items',
    intro: c.work.analysis.balcony
      ? 'The balconies are cantilever slabs designed for the moment at the root; the small items (lintels, sunshades, the parapet band and the stair head-room roof) are counted from the plan with the usual site sizes.'
      : 'No balconies were asked for. The small items (lintels, sunshades, the parapet band and the stair head-room roof) are counted from the plan with the usual site sizes.',
    blocks: [...bal, ...sec],
  }
}
