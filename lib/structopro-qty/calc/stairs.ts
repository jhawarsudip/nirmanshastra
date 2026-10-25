// The staircase part of Section 9: geometry, load, bending, bars, concrete, shuttering and the opening it leaves in each floor slab.

import type { CalcBlock } from '@/lib/calcsheet'
import type { CalcCtx } from './ctx'
import { COVER_SLAB, FY, GAMMA_RC, astSingly, barArea } from '../codes'
import { STAIR_RULES } from '../stair'
import { STD, barKg, check, d0, d1, ex, table, takeBlock, tableBlock } from './helpers'
import { put } from './figs'

const S = STAIR_RULES

export function stairBlocks(c: CalcCtx): CalcBlock[] {
  const { L, work } = c
  const { plan } = work
  const a = work.analysis
  const st = a.stair
  const det = st.detail
  const fck = work.ctx.fck
  const F = plan.F
  const blocks: CalcBlock[] = []

  // ---- geometry
  L.value('Storey height', plan.hs, 'm', 1, 'Section 3')
  L.value('Riser', S.riser, 'm', 2, `${STD.assume}: a usual residential riser (150 mm)`)
  L.value('Tread', S.tread, 'm', 2, `${STD.assume}: a usual residential tread (250 mm)`)
  L.value('Width of a flight', S.width, 'm', 1, `${STD.assume}`)
  const risersRaw = L.calc('Risers needed in one flight, before rounding', 'n = H ÷ R ÷ 2', '{h} ÷ {r} ÷ 2', { h: plan.hs, r: S.riser }, (v) => v.h / v.r / 2, { dp: 2, ref: STD.rule, note: 'A dog-legged stair: two equal flights and a landing in each storey', ...ex(det.risersRaw) })
  const n = L.calc('Risers in one flight', 'n = round(n)', 'round({n})', { n: risersRaw }, (v) => Math.round(v.n), { dp: 0, ref: STD.rule, expect: det.risersPerFlight, tol: 0 })
  const treads = L.calc('Treads in one flight', 'n − 1', '{n} − 1', { n }, (v) => v.n - 1, { dp: 0, ref: STD.rule, expect: det.treads, tol: 0 })
  const run = L.calc('Horizontal length of one flight', 'run = treads × T', '{t} × {T}', { t: treads, T: S.tread }, (v) => v.t * v.T, { unit: 'm', dp: 2, ref: STD.rule, ...ex(det.run) })
  const rise = L.calc('Height climbed in one flight', 'rise = n × R', '{n} × {R}', { n, R: S.riser }, (v) => v.n * v.R, { unit: 'm', dp: 2, ref: STD.rule, ...ex(det.rise) })
  const sloped = L.calc('Length of the flight along the slope', '√(run² + rise²)', '√({a}² + {b}²)', { a: run, b: rise }, (v) => Math.hypot(v.a, v.b), { unit: 'm', dp: 3, ref: STD.rule, ...ex(det.sloped) })
  const span = L.calc('Effective span of the flight', 'span = run + 0.25', '{r} + {a}', { r: run, a: S.supportAllowM }, (v) => v.r + v.a, {
    unit: 'm',
    dp: 2,
    ref: `${STD.is456} cl. 33.1 sets the effective span by how the flight is supported; ${STD.rule}`,
    note: 'The model takes the run plus 0.25 m, half of a landing support, as a planning figure',
    ...ex(det.span),
  })
  blocks.push(takeBlock(L, 'stair-geometry', 'Staircase: geometry'))

  // ---- thickness and load
  const waistRaw = L.calc('Waist thickness needed, before rounding', 'd = span ÷ (20 × 1.2)', '{s} × 1000 ÷ ({b} × {m})', { s: span, b: S.basicSpanDepth, m: S.modificationFactor }, (v) => (v.s * 1000) / (v.b * v.m), {
    unit: 'mm',
    dp: 1,
    ref: `${STD.is456} cl. 23.2.1 (basic ratio 20 for a simply supported span); ${STD.assume} (modification factor 1.2)`,
    ...ex(det.waistRaw),
  })
  const waist = L.calc('Waist thickness', 't = d + 20 + 6, up to the next 25 mm, not under 125 mm', 'max({m}; ceil(({d} + {c} + {h}) ÷ 25) × 25)', { m: S.waistMinMm, d: waistRaw, c: COVER_SLAB, h: S.halfBarMm }, (v) => Math.max(v.m, Math.ceil((v.d + v.c + v.h) / S.roundStepMm) * S.roundStepMm), { unit: 'mm', dp: 0, ref: `${STD.is456} cl. 33.3 for the depth of the section; ${STD.rule}`, ...ex(det.waist), note: 'Cover 20 mm and half of a 12 mm bar' })
  const cosF = L.calc('Slope factor', 'sloped length ÷ run', '{s} ÷ {r}', { s: sloped, r: run }, (v) => v.s / v.r, { dp: 3, ref: STD.rule, note: 'The waist weighs more per metre of plan than per metre along the slope', ...ex(det.cosFactor) })
  const dw = L.calc('Weight of the waist slab per m² of plan', 'γ × t × slope factor', '{g} × {t} ÷ 1000 × {k}', { g: GAMMA_RC, t: waist, k: cosF }, (v) => v.g * (v.t / 1000) * v.k, { unit: 'kN/m²', dp: 3, ref: `${STD.is456} cl. 19.2.1 (25 kN/m³)`, ...ex(det.deadWaist) })
  const ds = L.calc('Weight of the steps per m² of plan', 'γ × R ÷ 2', '{g} × 0.5 × {R}', { g: GAMMA_RC, R: S.riser }, (v) => v.g * 0.5 * v.R, { unit: 'kN/m²', dp: 3, ref: `${STD.rule}: the triangular steps have an average height of half the riser`, ...ex(det.deadSteps) })
  const dead = L.calc('Dead load', 'g = waist + steps + finish', '{a} + {b} + {f}', { a: dw, b: ds, f: S.finishKN }, (v) => v.a + v.b + v.f, { unit: 'kN/m²', dp: 3, ref: `${STD.assume}: finish 1.0 kN/m²`, ...ex(det.dead) })
  L.value('Imposed load on the stair', S.imposedKN, 'kN/m²', 1, `${STD.is875_2} Table 1`, 'Dwelling houses: staircases 3.0 kN/m²')
  const wu = L.calc('Factored load', 'wu = 1.5 (g + q)', '1.5 × ({g} + {q})', { g: dead, q: S.imposedKN }, (v) => 1.5 * (v.g + v.q), { unit: 'kN/m²', dp: 3, ref: `${STD.is456} Table 18`, ...ex(det.wu) })
  blocks.push(takeBlock(L, 'stair-load', 'Staircase: thickness and load'))

  // ---- bending and bars
  const M = L.calc('Bending moment per metre width', 'M = wu × span² ÷ 8', '{w} × {s}² ÷ 8', { w: wu, s: span }, (v) => (v.w * v.s * v.s) / 8, { unit: 'kN·m', dp: 2, ref: `${STD.rule}: the waist is designed as simply supported`, ...ex(det.M) })
  const d = L.calc('Effective depth', 'd = t − 20 − 6', '{t} − {c} − {h}', { t: waist, c: COVER_SLAB, h: S.halfBarMm }, (v) => v.t - v.c - v.h, { unit: 'mm', dp: 0, ref: STD.rule, ...ex(det.d) })
  const minAst = L.calc('Minimum steel per metre', 'Ast,min = 0.0012 × 1000 × t', '{r} × 1000 × {t}', { r: S.minSteelRatio, t: waist }, (v) => v.r * 1000 * v.t, { unit: 'mm²', dp: 0, ref: `${STD.is456} cl. 26.5.2.1 (0.12 % of the section for high-strength deformed bars)`, ...ex(det.minAst) })
  const ast = L.calc(
    'Steel per metre',
    'Ast = max(Ast,min ; (0.5 fck ÷ fy) (1 − √(1 − 4.6 Mu ÷ (fck b d²))) b d)',
    'max({m}; 0.5 × {f} ÷ 500 × (1 − √(1 − 4.6 × {M} × 10^6 ÷ ({f} × 1000 × {d}²))) × 1000 × {d})',
    { m: minAst, f: fck, M, d },
    (v) => Math.max(v.m, astSingly(v.M * 1e6, 1000, v.d, v.f) ?? (v.M * 1e6) / (0.87 * FY * 0.85 * v.d)),
    { unit: 'mm²/m', dp: 0, ref: `${STD.is456} Annex G, cl. G-1.1(b)`, ...ex(det.ast) }
  )
  const tried: string[] = []
  let main = { phi: 16, s: 100 }
  for (const phi of S.barPhis) {
    const s = Math.floor((barArea(phi) * 1000) / ast / S.spacingStep) * S.spacingStep
    tried.push(`${phi} mm at ${s} mm`)
    if (s >= S.spacingMin) {
      main = { phi, s: Math.min(s, S.spacingCap) }
      break
    }
  }
  check(L, 'Stair main bars: size', main.phi, det.main.phi, 0)
  check(L, 'Stair main bars: spacing', main.s, det.main.s, 0)
  L.pick('Main bars', `sizes ${S.barPhis.join(', ')} mm tried in turn: the first whose spacing (largest multiple of 25 mm not over A ÷ Ast) is at least ${S.spacingMin} mm; spacing capped at ${S.spacingCap} mm`, `${main.phi} mm at ${main.s} mm (spacings that fit: ${tried.join('; ')})`, `${STD.is456} cl. 26.3.3 allows up to 3d or 300 mm; ${STD.rule} (150 mm cap)`)
  L.pick('Distribution bars', `${S.distPhi} mm at ${S.distSpacingMm} mm`, `${S.distPhi} mm at ${S.distSpacingMm} mm (0.12 % of the waist is ${d0(S.minSteelRatio * 1000 * waist)} mm²/m; provided ${d0((barArea(S.distPhi) * 1000) / S.distSpacingMm)} mm²/m)`, `${STD.is456} cl. 26.5.2.1 and 26.3.3(b)(2) (not over 5d or 450 mm)`)
  L.pick('Landing', `${S.landingPhi} mm at ${S.landingSpacingMm} mm each way, ${S.landingThicknessM * 1000} mm thick`, `${S.landingPhi} mm at ${S.landingSpacingMm} mm each way`, `${STD.assume}: site practice`)
  blocks.push(takeBlock(L, 'stair-steel', 'Staircase: bending and bars'))

  // ---- bar lines
  const flights = L.calc('Flights in the building', '2 per storey', '2 × {n}', { n: F }, (v) => 2 * v.n, { dp: 0, ref: `${STD.rule}: every storey has a stair up to the next level, the top one to the roof`, expect: det.flights, tol: 0 })
  const lw = (S.width * 2 + S.gap) * 1000
  const ll = S.landing * 1000
  const lines = [
    { note: 'Main bars along the flights', phi: main.phi, len: sloped * 1000 + S.anchorMm, cnt: flights * (Math.floor((det.widthMm - S.edgeAllowMm) / main.s) + 1), rule: 'sloped length + 600; number = flights × ((width − 100) ÷ s + 1)' },
    { note: 'Distribution bars across the flights', phi: S.distPhi, len: det.widthMm - S.endAllowMm, cnt: flights * (Math.floor((sloped * 1000) / S.distSpacingMm) + 1), rule: 'width − 50; number = flights × (sloped length ÷ 200 + 1)' },
    { note: 'Landing bars along the landing length', phi: S.landingPhi, len: ll - S.endAllowMm, cnt: F * (Math.floor((lw - S.edgeAllowMm) / S.landingSpacingMm) + 1), rule: 'landing length − 50; number = storeys × ((landing width − 100) ÷ 150 + 1)' },
    { note: 'Landing bars along the landing width', phi: S.landingPhi, len: lw - S.endAllowMm, cnt: F * (Math.floor((ll - S.edgeAllowMm) / S.landingSpacingMm) + 1), rule: 'landing width − 50; number = storeys × ((landing length − 100) ÷ 150 + 1)' },
  ]
  let steel = 0
  lines.forEach((ln, i) => {
    const e = det.lines[i]
    const kg = barKg(ln.phi, ln.len, ln.cnt)
    check(L, `Stair bar line ${i + 1}: length`, ln.len, e.lengthMm)
    check(L, `Stair bar line ${i + 1}: number`, ln.cnt, e.count, 0)
    check(L, `Stair bar line ${i + 1}: weight`, kg, e.kg)
    steel += kg
  })
  put(L, 'stair.steel', steel)
  blocks.push(
    tableBlock('stair-bars', 'Staircase: bars', table(['Bars', 'Size (mm)', 'Cut length (mm)', 'Number', 'Rule', 'Weight (kg)'], lines.map((ln) => [ln.note, d0(ln.phi), d0(ln.len), d0(ln.cnt), ln.rule, d1(barKg(ln.phi, ln.len, ln.cnt))]), { num: [1, 2, 3, 5], foot: ['Steel in the staircase', '', '', '', '', d1(steel)] }), {
      note: `Each length is taken up to the next 25 mm and weighed at φ² ÷ 162.2 kg per metre (${STD.is2502} cl. 5.1.1; ${STD.is1786}). Landing: ${d0(ll)} × ${d0(lw)} mm.`,
    })
  )

  // ---- concrete and shuttering
  const fVolW = L.calc('Concrete in the waist of one flight', 'V = sloped length × width × t', '{s} × {w} × {t} ÷ 1000', { s: sloped, w: S.width, t: waist }, (v) => v.s * v.w * (v.t / 1000), { unit: 'm³', dp: 3, ref: STD.rule, ...ex(det.flightVolWaist) })
  const fVolS = L.calc('Concrete in the steps of one flight', 'V = n × (R ÷ 2) × T × width', '{n} × 0.5 × {R} × {T} × {w}', { n, R: S.riser, T: S.tread, w: S.width }, (v) => v.n * 0.5 * v.R * v.T * v.w, { unit: 'm³', dp: 3, ref: `${STD.rule}: each step is a triangle of riser R and tread T`, ...ex(det.flightVolSteps) })
  const lVol = L.calc('Concrete in one landing', 'V = landing × (2 × width + gap) × 0.15', '{l} × (2 × {w} + {g}) × {t}', { l: S.landing, w: S.width, g: S.gap, t: S.landingThicknessM }, (v) => v.l * (2 * v.w + v.g) * v.t, { unit: 'm³', dp: 3, ref: STD.rule, ...ex(det.landingVol) })
  const vol = L.calc('Concrete in the staircase', 'V = storeys × (2 × flight + landing)', '{n} × (2 × ({a} + {b}) + {c})', { n: F, a: fVolW, b: fVolS, c: lVol }, (v) => v.n * (2 * (v.a + v.b) + v.c), { unit: 'm³', dp: 2, ref: STD.rule, ...ex(st.concreteM3), result: true })
  const soffit = L.calc('Shuttering: soffit of the two flights', '2 × sloped length × width', '2 × {s} × {w}', { s: sloped, w: S.width }, (v) => 2 * v.s * v.w, { unit: 'm²', dp: 3, ref: STD.rule, ...ex(det.formParts.soffit) })
  const risers = L.calc('Shuttering: risers of the two flights', '2 × n × R × width', '2 × {n} × {R} × {w}', { n, R: S.riser, w: S.width }, (v) => 2 * v.n * v.R * v.w, { unit: 'm²', dp: 3, ref: STD.rule, ...ex(det.formParts.risers) })
  const sides = L.calc('Shuttering: sides of the two flights', '4 × sloped length × (t + 0.12)', '4 × {s} × ({t} ÷ 1000 + {e})', { s: sloped, t: waist, e: S.sideExtraM }, (v) => 4 * v.s * (v.t / 1000 + v.e), { unit: 'm²', dp: 3, ref: `${STD.rule}: the waist plus 0.12 m for the step profile`, ...ex(det.formParts.sides) })
  const lSoff = L.calc('Shuttering: soffit of the landing', 'landing × (2 × width + gap)', '{l} × (2 × {w} + {g})', { l: S.landing, w: S.width, g: S.gap }, (v) => v.l * (2 * v.w + v.g), { unit: 'm²', dp: 3, ref: STD.rule, ...ex(det.formParts.landingSoffit) })
  const lEdge = L.calc('Shuttering: edges of the landing', '2 (landing + 2 × width + gap) × 0.15', '2 × ({l} + 2 × {w} + {g}) × {t}', { l: S.landing, w: S.width, g: S.gap, t: S.landingThicknessM }, (v) => 2 * (v.l + 2 * v.w + v.g) * v.t, { unit: 'm²', dp: 3, ref: STD.rule, ...ex(det.formParts.landingEdges) })
  const form = L.calc('Shuttering of the staircase', 'S = storeys × (sum of the parts)', '{n} × ({a} + {b} + {c} + {d} + {e})', { n: F, a: soffit, b: risers, c: sides, d: lSoff, e: lEdge }, (v) => v.n * (v.a + v.b + v.c + v.d + v.e), { unit: 'm²', dp: 2, ref: STD.rule, ...ex(st.formworkM2), result: true })
  L.calc('Steel in the staircase', 'sum of the bar table', '{s}', { s: steel }, (v) => v.s, { unit: 'kg', dp: 1, ref: STD.rule, ...ex(work.parts.steel.stair), result: true })
  put(L, 'stair.vol', vol)
  put(L, 'stair.form', form)
  put(L, 'stair.count', F)
  blocks.push(takeBlock(L, 'stair-qty', 'Staircase: concrete and shuttering'))

  // ---- the opening
  const wl = L.calc('Length of the stair opening in each floor slab', 'run + landing', '{r} + {l}', { r: run, l: S.landing }, (v) => v.r + v.l, { unit: 'm', dp: 2, ref: STD.rule, ...ex(st.wellLengthM) })
  const ww = L.calc('Width of the stair opening', '2 × width + gap', '2 × {w} + {g}', { w: S.width, g: S.gap }, (v) => 2 * v.w + v.g, { unit: 'm', dp: 2, ref: STD.rule, ...ex(st.wellWidthM) })
  const wa = L.calc('Area of the stair opening', 'length × width', '{l} × {w}', { l: wl, w: ww }, (v) => v.l * v.w, { unit: 'm²', dp: 2, ref: STD.rule, note: 'Taken out of every floor slab below the roof; the slab concrete, shuttering and steel are reduced for it in the next part', ...ex(st.wellAreaM2) })
  put(L, 'stair.wellLength', wl)
  put(L, 'stair.wellWidth', ww)
  put(L, 'stair.wellArea', wa)
  blocks.push(takeBlock(L, 'stair-well', 'Staircase: the opening in the slabs'))
  return blocks
}
