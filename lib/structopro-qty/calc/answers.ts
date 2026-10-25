// Sections 1 to 3 of the StructurePro calculation sheet: your answers, the site and materials, and the frame laid out.

import type { CalcBlock, CalcSection } from '@/lib/calcsheet'
import type { CalcCtx } from './ctx'
import { COVER_BEAM, COVER_COLUMN, COVER_EXPOSURE, COVER_FOOTING, COVER_SLAB, ES, FY, FY_SHEAR, Z_FACTOR } from '../codes'
import { BEAM_RULES } from '../beam'
import { T5_RCC, gradeNumber } from '../materials'
import { HS, PLINTH, maxExposure } from '../model'
import { MAX_SPAN, SQFT_TO_M2, TARGET_SPAN } from '../plan'
import { SLAB_MF, SLAB_RULES } from '../slab'
import { SITE } from '../sites'
import { STD, d0, d1, d2, d3, ex, fixed, table, takeBlock, tableBlock, storeyName } from './helpers'

const ZONE_ORDER = ['II', 'III', 'IV', 'V']

export function answersSection(c: CalcCtx): CalcSection {
  const { L, input, result, work } = c
  const { plan } = work
  const blocks: CalcBlock[] = []
  const sumSqft = work.areasSqft.reduce((s, v) => s + v, 0)

  // ---- 1a. what you told the tool
  L.input('Floors you listed', `${work.areasSqft.length}`, STD.yours, work.ctx.stilt ? 'The open parking level stands under these floors and is not counted here' : undefined)
  L.input('Built-up area of each floor, lowest first', work.areasSqft.map((a) => `${d0(a)}`).join(', ') + ' sq ft', STD.yours)
  L.calc('Total built-up area', 'A = Σ floor areas × 0.09290304', '{s} sq ft × {k}', { s: sumSqft, k: SQFT_TO_M2 }, (v) => v.s * v.k, {
    unit: 'm²',
    dp: 1,
    ref: 'Unit conversion: 1 sq ft = 0.09290304 m²',
    ...ex(result.inputEcho.totalBuiltUpM2),
    result: true,
  })
  L.input('Place', `${input.city ? input.city + ', ' : ''}${input.state}`, STD.yours)
  L.input('Ground', `${SITE[work.siteKey].label}`, STD.yours, 'One of the eight answers on the form')
  L.input('Walls', work.wallType === 'brick' ? 'Brick, 230 mm outside' : 'Concrete block, 200 mm outside', STD.yours)
  L.input('Open parking level (stilt)', work.ctx.stilt ? 'Yes' : 'No', STD.yours)
  L.input('Balconies per upper floor', work.nBal > 0 ? `${work.nBal}, projecting ${fixed(work.lcAsked, 1)} m` : 'None', STD.yours)
  L.input('Roof used as a terrace', input.terraceAccess === false ? 'No (imposed load 0.75 kN/m²)' : 'Yes (imposed load 1.5 kN/m²)', STD.yours)
  L.calc(
    'Storeys of the frame',
    'F = floors listed + 1 if there is an open parking level',
    '{n} + {s}',
    { n: work.areasSqft.length, s: work.ctx.stilt ? 1 : 0 },
    (v) => v.n + v.s,
    { dp: 0, ref: STD.rule, note: 'The parking level is a storey of the frame (it has columns and a roof slab) but not built-up area', ...ex(result.inputEcho.storeys), result: true }
  )
  blocks.push(takeBlock(L, 'answers-given', 'What you told the tool'))

  // ---- 1b. the ground
  const site = work.site
  L.input('Ground condition', site.label, STD.yours)
  L.value('Safe bearing capacity assumed', site.sbc, 'kN/m²', 0, `${STD.assume}: by ground class`, 'A soil test replaces this; every footing size depends on it')
  L.value('Founding depth (ground level to underside of the lean concrete)', site.depth, 'm', 1, `${STD.assume}: by ground class`)
  L.compare('Founding depth against the report', site.depth, result.layout.foundingDepthM, 3)
  L.input('Foundation type forced by the ground class', site.raft ? 'Raft' : 'Isolated footings unless the trial footings overlap', `${STD.assume}: by ground class`, 'Section 8 shows how the foundation type was decided')
  L.input('Exposure condition of the concrete', site.exposure.replace('_', ' '), `${STD.is456} Table 3 (classes), ${STD.assume} (class chosen per ground)`)
  blocks.push(takeBlock(L, 'answers-ground', 'What the ground answer means', { note: 'These values are the model\'s planning assumptions for each ground class. They are not test results.' }))

  // ---- 1c. the plot shape
  if (work.aspect.fromPlot && work.aspect.ratioRaw !== undefined) {
    const lenFt = Math.max(input.plotLengthFt ?? 0, input.plotWidthFt ?? 0)
    const widFt = Math.min(input.plotLengthFt ?? 0, input.plotWidthFt ?? 0)
    L.calc(
      'Shape of the building plan (long side ÷ short side)',
      'r = min(2, max(1, long ÷ short))',
      'min(2, max(1, {l} ÷ {w}))',
      { l: lenFt, w: widFt },
      (v) => Math.min(2, Math.max(1, v.l / v.w)),
      { dp: 2, ref: STD.rule, note: 'Only the shape of the plot is used, never its size', ...ex(work.aspect.ratio) }
    )
  } else {
    L.value('Shape of the building plan (long side ÷ short side)', work.aspect.ratio, '', 1, STD.assume, 'No plot size was given: a plan 1.3 times as long as it is wide')
  }
  blocks.push(takeBlock(L, 'answers-plot', 'Shape of the plan'))

  // ---- 1d. storeys
  const rows = plan.floors.map((f) => [
    storeyName(f.k, work.ctx.stilt),
    d1(f.areaM2 / SQFT_TO_M2),
    d1(f.areaM2),
  ])
  blocks.push(
    tableBlock('answers-storeys', 'Storeys of the frame', table(['Storey', 'Area (sq ft)', 'Area (m²)'], rows, { num: [1, 2], foot: ['Total of the frame', d1(plan.floors.reduce((s, f) => s + f.areaM2 / SQFT_TO_M2, 0)), d1(plan.floors.reduce((s, f) => s + f.areaM2, 0))] }), {
      note: work.ctx.stilt ? 'The open parking level has the footprint of the first listed floor.' : undefined,
    })
  )

  return {
    id: 'answers',
    title: '1. Your answers and what was worked out from them',
    intro: 'The tool asks only for floors, areas, place, ground, walls, parking and balconies. Everything else on this sheet is derived from those answers by the model\'s own rules, which are named on each line.',
    blocks,
  }
}

export function siteSection(c: CalcCtx): CalcSection {
  const { L, input, result, work } = c
  const blocks: CalcBlock[] = []
  const F = work.plan.F

  // ---- 2a. seismic zone
  L.input('Place used for the zone', `${input.city ? input.city + ', ' : ''}${input.state}`, STD.yours)
  const basis =
    input.zoneOverride !== undefined
      ? 'Zone set by the user'
      : work.zr.basis === 'town'
        ? 'The town is in the IS 1893 Annex E list'
        : work.zr.basis === 'state_typical'
          ? 'Town not listed: the typical zone of the state\'s listed towns'
          : 'No listed town in the state: a conservative state value'
  L.pick('Seismic zone', 'Annex E town list, else typical for the state', `Zone ${work.zr.zone}`, `${STD.is1893} Annex E (towns); ${STD.is1893} Fig. 1 (map)`, `${basis}. ${work.zr.note}`)
  L.compare('Zone against the report', ZONE_ORDER.indexOf(work.zr.zone), ZONE_ORDER.indexOf(result.inputEcho.zone), 0)
  L.value('Zone factor Z', Z_FACTOR[work.zr.zone], '', 2, `${STD.is1893} Table 2`, 'Maximum considered earthquake; the design value is Z ÷ 2')
  L.pick(
    'Detailing class',
    'Zone III and above: special moment-resisting frame; Zone II: ordinary',
    work.ctx.seismic ? 'Special moment-resisting frame, IS 13920 ductile detailing, R = 5' : 'Ordinary moment-resisting frame, IS 456 detailing, R = 3',
    `${STD.is1893} Table 7 (R); ${STD.is13920}`,
    `${STD.rule}: Zone II is not detailed to IS 13920`
  )
  blocks.push(takeBlock(L, 'site-zone', 'Earthquake zone'))

  // ---- 2b. wind speed
  L.value('Basic wind speed Vb', work.vb.vb, 'm/s', 0, `${STD.is875_3} Fig. 1 and Appendix A (value from a published city table)`, work.vb.basis === 'city' ? `Table value for ${work.vb.place}: a secondary source, to be confirmed against the wind map` : `${work.vb.place} has no entry in the city table: the highest speed the state commonly sees is used (${STD.assume})`)
  L.compare('Vb against the report', work.vb.vb, result.wind.vbMs, 3)
  L.value('Terrain category', work.ctx.terrain, '', 0, `${STD.is875_3} cl. 5.3.2`, 'Open terrain with scattered obstructions: the basis of Vb and the higher of the two usual choices')
  L.value('Risk coefficient k1', 1.0, '', 1, `${STD.is875_3} cl. 5.3.1 Table 1`, 'Buildings designed for a 50-year life')
  L.value('Topography factor k3', 1.0, '', 1, `${STD.is875_3} cl. 5.3.3`, 'Level ground assumed: no hill or ridge effect')
  blocks.push(takeBlock(L, 'site-wind', 'Wind speed', { note: 'The 1987 edition of IS 875 (Part 3) is used. The later edition adds directionality, area-averaging and cyclonic factors that this model does not apply.' }))

  // ---- 2c. exposure and grade
  const exposure = work.exposure
  const t5 = T5_RCC[exposure]
  L.pick('Exposure condition', 'from the ground class', exposure.replace('_', ' '), `${STD.is456} Table 3`, `${STD.assume}: which condition each ground class implies`)
  L.value('Minimum grade for this exposure', gradeNumber(t5.minGrade), 'N/mm²', 0, `${STD.is456} Table 5 (RCC)`, `${t5.minGrade}; minimum cement ${t5.minCement} kg/m³, maximum free water-cement ratio ${fixed(t5.maxWc, 2)}`)
  const houseMin = F >= 4 ? 25 : 20
  L.value('Grade the model never goes below', houseMin, 'N/mm²', 0, STD.assume, F >= 4 ? 'Four or more storeys: M25 at least' : 'Fewer than four storeys: M20 at least')
  if (input.gradeOverride) {
    L.input('Grade specified by an engineer', input.gradeOverride, STD.yours, 'Used for the whole building')
  } else {
    L.calc('Grade of concrete above ground', 'fck = max(Table 5 minimum, house minimum)', 'max({a}, {b})', { a: gradeNumber(t5.minGrade), b: houseMin }, (v) => Math.max(v.a, v.b), {
      unit: 'N/mm²',
      dp: 0,
      ref: `${STD.is456} Table 5; ${STD.assume}`,
      ...ex(gradeNumber(result.inputEcho.gradeAbove)),
      result: true,
      note: `M${gradeNumber(result.inputEcho.gradeAbove)}`,
    })
  }
  const expBelow = maxExposure(exposure, 'moderate')
  L.pick('Exposure of concrete below ground', 'at least moderate', expBelow.replace('_', ' '), `${STD.is456} Table 3`, 'Buried concrete is never rated milder than "moderate"')
  if (input.gradeOverride) {
    L.input('Grade below ground', input.gradeOverride, STD.yours)
  } else {
    L.calc('Grade of concrete below ground', 'fck = max(grade above, Table 5 minimum for the buried exposure)', 'max({a}, {b})', { a: gradeNumber(result.inputEcho.gradeAbove), b: gradeNumber(T5_RCC[expBelow].minGrade) }, (v) => Math.max(v.a, v.b), {
      unit: 'N/mm²',
      dp: 0,
      ref: `${STD.is456} Table 5`,
      ...ex(gradeNumber(result.inputEcho.gradeBelow)),
      result: true,
      note: `M${gradeNumber(result.inputEcho.gradeBelow)}`,
    })
  }
  L.compare('Grade above, against the design routines', work.fck, gradeNumber(result.inputEcho.gradeAbove), 0)
  L.compare('Grade below, against the foundation design', work.fckBelow, gradeNumber(result.inputEcho.gradeBelow), 0)
  blocks.push(takeBlock(L, 'site-grade', 'Exposure and grade of concrete'))

  // ---- 2d. steel and design strengths
  L.value('Reinforcement', FY, 'N/mm²', 0, `${STD.is456} cl. 5.6 (Fe 500 characteristic strength)`, 'Fe 500D (ductile) is assumed; IS 13920 asks for ductile steel in Zones III and above')
  L.calc('Design strength of the steel', 'fyd = 0.87 fy', '0.87 × {fy}', { fy: FY }, (v) => 0.87 * v.fy, { unit: 'N/mm²', dp: 1, ref: `${STD.is456} cl. 38.1 and Annex G` })
  L.value('Steel strength used for stirrups and ties', FY_SHEAR, 'N/mm²', 0, `${STD.is456} cl. 40.4`, 'The design yield strength of shear reinforcement is not taken above 415 N/mm²')
  L.value('Modulus of elasticity of steel', ES, 'N/mm²', 0, `${STD.is456} cl. 5.6.3`)
  L.value('Unit weight of reinforced concrete', 25, 'kN/m³', 0, `${STD.is456} cl. 19.2.1 and ${STD.is875_1}`)
  blocks.push(takeBlock(L, 'site-steel', 'Reinforcing steel'))

  // ---- 2e. cover
  const usedRows = [
    ['Slab', d0(COVER_SLAB), `${STD.assume}: Table 16 mild exposure`],
    ['Beam (clear cover to the stirrup)', d0(COVER_BEAM), 'SP 34 cl. 4.1(c)'],
    ['Beam, centre of the bars from the face (d = D − 45)', d0(BEAM_RULES.dCover), `${STD.rule}: 25 + stirrup 8 + half a 25 mm bar, rounded`],
    ['Column (to the tie)', d0(COVER_COLUMN), `${STD.is456} cl. 26.4.2.1`],
    ['Footing', d0(COVER_FOOTING), `${STD.is456} cl. 26.4.2.2`],
  ]
  blocks.push(
    tableBlock(
      'site-cover',
      'Concrete cover used by the model',
      table(['Member', 'Cover used (mm)', 'Source'], usedRows, { num: [1] }),
      {
        intro: `Table 16 of IS 456 asks for a nominal cover of ${COVER_EXPOSURE[exposure]} mm for this exposure condition (${exposure.replace('_', ' ')}).`,
        note:
          COVER_EXPOSURE[exposure] > COVER_BEAM
            ? 'The model does not increase the cover with the exposure condition: the covers above are fixed. For this exposure an engineer must specify the larger cover of Table 16 and the bars shown would then sit deeper in the beams and slabs.'
            : 'The covers above are fixed in the model and are not less than Table 16 asks for this exposure.',
      }
    )
  )

  return {
    id: 'site',
    title: '2. Site and materials',
    intro: 'The earthquake zone, the wind speed and the concrete grade follow from the place and the ground class. Each is a planning value to be confirmed by the engineer who signs the drawings.',
    blocks,
  }
}

export function frameSection(c: CalcCtx): CalcSection {
  const { L, result, work } = c
  const { plan, ctx } = work
  const blocks: CalcBlock[] = []
  const F = plan.F
  const A0 = Math.max(...work.planAreasM2)

  // ---- 3a. grid
  L.calc('Footprint of the frame (the largest storey)', 'A0 = largest storey area', 'largest of the storey areas = {a}', { a: A0 }, (v) => v.a, { unit: 'm²', dp: 2, ref: STD.rule, ...ex(result.inputEcho.footprintM2, 1e-9), result: true })
  const Ln = L.calc('Length of the plan', 'L = √(A0 × r)', '√({a} × {r})', { a: A0, r: work.aspect.ratio }, (v) => Math.sqrt(v.a * v.r), { unit: 'm', dp: 2, ref: STD.rule, ...ex(plan.L) })
  const Wn = L.calc('Width of the plan', 'W = A0 ÷ L', '{a} ÷ {l}', { a: A0, l: Ln }, (v) => v.a / v.l, { unit: 'm', dp: 2, ref: STD.rule, ...ex(plan.W) })
  L.compare('Plan length against the report', Ln, result.layout.lengthM, undefined, 1e-9)
  L.compare('Plan width against the report', Wn, result.layout.widthM, undefined, 1e-9)
  L.value('Target bay', TARGET_SPAN, 'm', 2, STD.assume, 'A usual residential bay is 3.0 to 4.5 m')
  L.value('Longest bay before a middle column is added', MAX_SPAN, 'm', 1, STD.assume)
  const nxFirst = L.calc('Bays along the length, first estimate', 'nx = round(L ÷ target bay), at least 1', 'round({l} ÷ {t})', { l: Ln, t: TARGET_SPAN }, (v) => Math.max(1, Math.round(v.l / v.t)), { dp: 0, ref: STD.rule })
  const nyFirst = L.calc('Bays along the width, first estimate', 'ny = round(W ÷ target bay), at least 1', 'round({w} ÷ {t})', { w: Wn, t: TARGET_SPAN }, (v) => Math.max(1, Math.round(v.w / v.t)), { dp: 0, ref: STD.rule })
  const nx = L.calc(
    'Bays along the length',
    'nx increased until L ÷ nx ≤ longest bay',
    'start {n}, longest bay {m} m, L = {l} m',
    { n: nxFirst, m: MAX_SPAN, l: Ln },
    (v) => {
      let n = v.n
      while (v.l / n > v.m) n++
      return n
    },
    { dp: 0, ref: STD.rule, ...ex(result.layout.baysX), result: true }
  )
  const ny = L.calc(
    'Bays along the width',
    'ny increased until W ÷ ny ≤ longest bay',
    'start {n}, longest bay {m} m, W = {w} m',
    { n: nyFirst, m: MAX_SPAN, w: Wn },
    (v) => {
      let n = v.n
      while (v.w / n > v.m) n++
      return n
    },
    { dp: 0, ref: STD.rule, ...ex(result.layout.baysY), result: true }
  )
  const sx = L.calc('Span along the length (centre to centre of columns)', 'sx = L ÷ nx', '{l} ÷ {n}', { l: Ln, n: nx }, (v) => v.l / v.n, { unit: 'm', dp: 2, ref: STD.rule, ...ex(result.layout.spanX), result: true })
  const sy = L.calc('Span along the width (centre to centre of columns)', 'sy = W ÷ ny', '{w} ÷ {n}', { w: Wn, n: ny }, (v) => v.w / v.n, { unit: 'm', dp: 2, ref: STD.rule, ...ex(result.layout.spanY), result: true })
  L.value('Storey height (floor to floor)', HS, 'm', 1, `${STD.assume}: usual residential storey`)
  L.compare('Storey height against the report', HS, result.layout.storeyHeightM, 3)
  L.value('Plinth height above ground', PLINTH, 'm', 2, STD.assume)
  L.compare('Plinth height against the report', PLINTH, result.layout.plinthM, 3)
  blocks.push(takeBlock(L, 'frame-grid', 'Grid of columns', { intro: 'A regular grid of equal bays is laid over the largest storey. Your own drawing will differ; the model uses the grid to size the frame, not to copy your plan.' }))

  // ---- 3b. levels
  const levelRows = plan.floors.map((f) => {
    const z = PLINTH + HS * (f.k + 1)
    L.compare(`Level of the top of slab ${f.k}`, z, f.zTop, undefined, 1e-9)
    return [storeyName(f.k, ctx.stilt), `${d2(PLINTH)} + ${d1(HS)} × ${f.k + 1}`, d2(z)]
  })
  blocks.push(tableBlock('frame-levels', 'Levels', table(['Storey', 'Top of slab = plinth + storey height × storeys', 'Level above ground (m)'], levelRows, { num: [2] }), { note: `The top of the roof slab, ${d2(plan.floors[F - 1].zTop)} m above ground, is the height H used for the earthquake period and the wind.` }))

  // ---- 3c. smaller floors
  const bayM2 = sx * sy
  const baysRows = plan.floors.map((f) => {
    // the same search as the model: the number of bays whose area is nearest the storey's share of the largest storey
    const rho = f.areaM2 / A0
    let best = { a: nx, b: ny, score: Infinity }
    for (let i = 1; i <= nx; i++) {
      for (let j = 1; j <= ny; j++) {
        const score = Math.abs((i * j) / (nx * ny) - rho) + 0.01 * Math.abs(i / nx - j / ny)
        if (score < best.score - 1e-9) best = { a: i, b: j, score }
      }
    }
    L.compare(`Bays along x on storey ${f.k}`, best.a, f.nx, 0)
    L.compare(`Bays along y on storey ${f.k}`, best.b, f.ny, 0)
    const model = best.a * best.b * bayM2
    L.compare(`Area of the bays used on storey ${f.k}`, model, f.modelM2, undefined, 1e-9)
    L.compare(`Floor-area correction on storey ${f.k}`, f.areaM2 / model, f.scale, undefined, 1e-9)
    return [storeyName(f.k, ctx.stilt), d1(f.areaM2), `${best.a} × ${best.b}`, d1(model), d3(f.areaM2 / model)]
  })
  blocks.push(
    tableBlock('frame-floors', 'Bays on each storey', table(['Storey', 'Area entered (m²)', 'Bays used (x × y)', 'Area of those bays (m²)', 'Correction = entered ÷ bays'], baysRows, { num: [1, 3, 4] }), {
      intro: 'A storey smaller than the largest keeps a block of whole bays whose area is nearest to it. The quantities that belong to the floor as a whole (beams, slab) are then multiplied by the correction shown, so that the totals agree with the floor area you entered.',
      note: 'The search takes the (x, y) pair of bays with the smallest |bays ÷ largest-storey bays − area ratio| + 0.01 |x ÷ nx − y ÷ ny|. The floors are not forced to sit inside the floor below.',
    })
  )

  // ---- 3d. slab thickness
  const lx = Math.min(sx, sy)
  const continuous = nx > 1 || ny > 1
  L.calc('Shorter span of the panel', 'lx = min(sx, sy)', 'min({a}, {b})', { a: sx, b: sy }, (v) => Math.min(v.a, v.b), { unit: 'm', dp: 2, ref: `${STD.is456} cl. 23.2.1, note 1 (shorter span of a two-way slab)` })
  L.pick(
    'Basic span ÷ effective depth',
    'continuous: 26; simply supported: 20',
    `${continuous ? SLAB_RULES.basicContinuous : SLAB_RULES.basicSimple}${continuous ? ' (the slab continues over a beam)' : ' (a single bay)'}`,
    `${STD.is456} cl. 23.2.1`,
    'Values for a simply supported and a continuous span; the cantilever value of 7 is used for balconies in Section 10'
  )
  L.value('Modification factor for the tension steel', SLAB_MF, '', 1, `${STD.is456} cl. 23.2.1 (Fig. 4)`, `${STD.assume}: the chart is not read by the model; a typical value for Fe 500 slabs is taken`)
  const basic = continuous ? SLAB_RULES.basicContinuous : SLAB_RULES.basicSimple
  const dReq = L.calc('Effective depth needed', 'd = lx ÷ (basic ratio × modification factor)', '{l} × 1000 ÷ ({b} × {m})', { l: lx, b: basic, m: SLAB_MF }, (v) => (v.l * 1000) / (v.b * v.m), { unit: 'mm', dp: 1, ref: `${STD.is456} cl. 23.2.1` })
  const tRaw = L.calc(
    'Overall thickness before rounding',
    't = d + cover + half a bar',
    '{d} + {c} + {h}',
    { d: dReq, c: COVER_SLAB, h: SLAB_RULES.halfBar },
    (v) => v.d + v.c + v.h,
    { unit: 'mm', dp: 1, ref: `${STD.is456} cl. 26.4`, note: `Cover ${COVER_SLAB} mm and half of a ${SLAB_RULES.halfBar * 2} mm bar` }
  )
  L.calc(
    'Slab thickness used',
    't = round up to 25 mm, kept between 125 and 250 mm',
    'min({hi}, max({lo}, roundup({t} ÷ {s}) × {s}))',
    { t: tRaw, s: SLAB_RULES.step, lo: SLAB_RULES.tMin, hi: SLAB_RULES.tMax },
    (v) => Math.min(v.hi, Math.max(v.lo, Math.ceil(v.t / v.s) * v.s)),
    { unit: 'mm', dp: 0, ref: STD.rule, ...ex(work.tSlab), result: true, note: 'One thickness is used for every slab of the building' }
  )
  blocks.push(takeBlock(L, 'frame-slab', 'Slab thickness from the span to depth rule'))

  return {
    id: 'frame',
    title: '3. The frame laid out',
    intro: 'The model lays a regular grid of beams and columns over the plan, fixes the storey heights, and sets one slab thickness for the whole building from the span to depth rule of IS 456.',
    blocks,
  }
}
