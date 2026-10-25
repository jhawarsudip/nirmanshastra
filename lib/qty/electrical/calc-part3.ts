/* ElectricalPro calculation sheet, sections 9 to 12: wire and conduit lengths, earthing, fittings and the buy list, the uncertainty bands. */

import { num } from '@/lib/calcsheet'
import type { CalcSection, Vars } from '@/lib/calcsheet'
import { SQFT_TO_M2, bump, ceilTo, fmt, pieces, rangeText } from '../util'
import { REF, block, d0, d1, d2, d3, pl, table, type Ctx } from './calc-ctx'
import { ACC_NAMES, PROT_NAMES, accessories, buyLines, cellNumber, sheetTables } from './calc-rows'
import { SRC } from './derive'
import { COIL_M, COLOUR, DAR, ELEC_BANDS, PER_M, RULE, RUN, WASTE } from './rules'

/** Short names for where a metre of wire comes from, for the working. */
const SHORT: Record<string, string> = {
  [SRC.points]: 'points', [SRC.taps]: 'socket taps', [SRC.light]: 'lighting circuits', [SRC.sock]: 'socket circuits', [SRC.ac]: 'air conditioners',
  [SRC.heater]: 'heaters and washers', [SRC.pump]: 'pump', [SRC.ev]: 'EV chargers', [SRC.inverter]: 'inverter', [SRC.mains]: 'mains', [SRC.media]: 'TV and data',
}

export function section9(c: Ctx): CalcSection {
  const { d, L, repB: b0, repName } = c
  const s0 = b0.spec
  const lab = s0.label
  const mult = s0.mult
  const RED = COLOUR.live

  L.say('A point', 'A point is the whole run of wire from the controlling switch to the outlet. The wire, conduit, bends, couplers and clips in one point come from the CPWD analysis of rates, in two groups that depend on the size of the home.', `${REF.gs34}; ${REF.dar11}`)
  L.say('Group A and Group B', `Group A is used up to ${fmt(RULE.groupAFromSqft)} sq ft of built-up area and Group B from ${fmt(RULE.groupBFromSqft)} sq ft, with a straight line between the two. The CPWD documents do not say where one group ends, so these limits are an assumption.`, REF.assume)
  L.say('Routes', `The wire from a board to the first point of a circuit is a route. Its length is a share of the side of the home plus ${RULE.routeBaseM} m, and the share depends on the kind of circuit (table 9.2). Route lengths are not measured from a drawing.`, REF.assume)
  L.say('Conductor and waste', `Every metre of route takes ${RUN} m of conductor. ${Math.round((WASTE - 1) * 100)}% is added for cutting waste. Wire up to ${RULE.coilMaxMm2} mm² is bought in coils of ${COIL_M} m, larger sizes by the metre in steps of ${RULE.byMetreStepM} m, and conduit in lengths of ${RULE.conduitPieceM} m. The ${COIL_M} m coil is the common pack; no standard fixes it.`, `${REF.dar}; the pack sizes: ${REF.assume}`)
  const how = L.take()

  const dar = table(
    ['In one point', 'Group A', 'Group B', 'Source'],
    [
      ['Live wire, 1.5 mm² (m)', num(DAR.A.wire), num(DAR.B.wire), REF.dar11],
      ['Neutral wire, 1.5 mm² (m)', num(DAR.A.wire), num(DAR.B.wire), REF.dar11],
      ['Earth wire, 1.5 mm² (m)', num(DAR.A.earth), num(DAR.B.earth), REF.dar11],
      [`Conduit, ${RULE.pointConduitMm} mm (m)`, num(DAR.A.conduit), num(DAR.B.conduit), REF.dar17],
      ['Couplers', num(DAR.A.couplers), num(DAR.B.couplers), REF.dar15],
      ['Saddles or clips', num(DAR.A.saddles), num(DAR.B.saddles), REF.dar15],
    ],
    { num: [1, 2], note: `Each point also has one bend and one junction or ceiling box. The values for a home between the two groups are in a straight line between these.` },
  )
  const routes = table(
    ['Route', 'Length', 'Used for'],
    [
      ['Board to the first light point', `${num(RULE.routeLight)} × side of the home + ${RULE.routeBaseM} m`, 'Lighting circuits'],
      ['Board to the first socket', `${num(RULE.routeSock)} × side of the home + ${RULE.routeBaseM} m`, '6 A and 6/16 A socket circuits'],
      ['Board to the appliance', `${num(RULE.routeDed)} × side of the home + ${RULE.routeBaseM} m`, 'Air conditioner, heater, washer and dishwasher circuits'],
      ['Ground floor to the charger', `${num(RULE.routeGround)} × side of the largest floor + ${RULE.routeBaseM} m + floor height × floors up`, 'EV charger circuits'],
      ['Socket tap from the nearest point', `${num(RULE.tapBaseM)} m + ${num(RULE.tapRiseM)} m × the Group factor`, 'Sockets in the rooms'],
      ['Board to the media box', `${num(RULE.mediaPerSqrtM)} × side of the home + ${RULE.mediaBaseM} m`, 'TV and data conduit'],
      ['Transfer pump', `${RULE.pumpRouteM} m`, 'Pump circuit'],
      ['Inverter', `${RULE.inverterRouteM} m`, 'Inverter circuit'],
    ],
    { note: 'The side of the home is the square root of its built-up area. All of these lengths are assumptions of the tool, not measured.' },
  )

  /* ── worked example: one board ── */
  L.input('Board worked here', repName, REF.rule, 'The board with the most points.')
  L.calc('Built-up area in sq ft', 'A (sq ft) = A (m²) ÷ 0.09290304', '{a:2} ÷ {k:8}', { a: s0.builtM2, k: SQFT_TO_M2 }, (v) => v.a / v.k, { unit: 'sq ft', dp: 1, ref: '1 ft = 0.3048 m exactly', expect: b0.sqft })
  const f = L.calc('Group factor f', 'f = (A − A of Group A) ÷ (A of Group B − A of Group A), held between 0 and 1', 'max(0, min(1, ({a:1} − {lo}) ÷ ({hi} − {lo})))',
    { a: b0.sqft, lo: RULE.groupAFromSqft, hi: RULE.groupBFromSqft }, (v) => Math.max(0, Math.min(1, (v.a - v.lo) / (v.hi - v.lo))), { dp: 3, ref: REF.assume, expect: b0.f })
  const dw = L.calc('Live wire in one point', 'm = Group A + f × (Group B − Group A)', '{a} + {f:3} × ({b} − {a})', { a: DAR.A.wire, b: DAR.B.wire, f }, (v) => v.a + v.f * (v.b - v.a), { unit: 'm', dp: 3, ref: REF.dar11, expect: b0.dw })
  const de = L.calc('Earth wire in one point', 'm = Group A + f × (Group B − Group A)', '{a} + {f:3} × ({b} − {a})', { a: DAR.A.earth, b: DAR.B.earth, f }, (v) => v.a + v.f * (v.b - v.a), { unit: 'm', dp: 3, ref: REF.dar11, expect: b0.de })
  const dc = L.calc('Conduit in one point', 'm = Group A + f × (Group B − Group A)', '{a} + {f:3} × ({b} − {a})', { a: DAR.A.conduit, b: DAR.B.conduit, f }, (v) => v.a + v.f * (v.b - v.a), { unit: 'm', dp: 3, ref: REF.dar17, expect: b0.dc })
  const pts = L.value('Points on one copy of the board', b0.pts, '', 0, 'Section 5')
  L.value('Copies of the board', mult, '', 0, 'Section 2')
  L.calc('Live wire in the points (the neutral is the same)', 'length = points × m in one point × copies', '{p} × {w:3} × {m}', { p: pts, w: dw, m: mult }, (v) => v.p * v.w * v.m, { unit: 'm', dp: 1, ref: REF.dar11, expect: c.wireOf(lab, SRC.points, RULE.pointMm2, RED) })
  L.calc('Earth wire in the points', 'length = points × m in one point × copies', '{p} × {w:3} × {m}', { p: pts, w: de, m: mult }, (v) => v.p * v.w * v.m, { unit: 'm', dp: 1, ref: REF.dar11, expect: c.wireOf(lab, SRC.points, RULE.pointMm2, COLOUR.earth) })
  L.calc('Conduit in the points', 'length = points × m in one point × copies', '{p} × {w:3} × {m}', { p: pts, w: dc, m: mult }, (v) => v.p * v.w * v.m, { unit: 'm', dp: 1, ref: REF.dar17, expect: c.condOf(lab, SRC.points) })

  if (b0.cnt.S6 + b0.cnt.S16 > 0) {
    const tap = L.calc('Socket tap from the nearest point', 'tap = base + rise × f', '{b} + {r} × {f:3}', { b: RULE.tapBaseM, r: RULE.tapRiseM, f }, (v) => v.b + v.r * v.f, { unit: 'm', dp: 2, ref: REF.assume, expect: b0.tap })
    const rt = L.calc('Route of all the socket taps', 'route = tap × (6 A sockets + 6/16 A sockets) × copies', '{t:2} × ({a} + {b}) × {m}', { t: tap, a: b0.cnt.S6, b: b0.cnt.S16, m: mult }, (v) => v.t * (v.a + v.b) * v.m,
      { unit: 'm', dp: 1, ref: REF.assume, expect: c.condOf(lab, SRC.taps), note: 'This is also the conduit in the taps.' })
    L.calc('Wire in the socket taps, each colour', `length = route × ${RUN}`, '{r:1} × {k}', { r: rt, k: RUN }, (v) => v.r * v.k, { unit: 'm', dp: 1, ref: REF.dar, expect: c.wireOf(lab, SRC.taps, undefined, RED) })
  }

  const side = (name: string, k: number, key: 'rLight' | 'rSock' | 'rDed', parts: [string, number][], src: string, what: string) => {
    const n = parts.reduce((x, [, y]) => x + y, 0)
    if (n <= 0) return
    const r = L.calc(`Route to the first point of ${what}`, 'route = share × √A + base', '{k} × √{a:2} + {b}', { k, a: s0.builtM2, b: RULE.routeBaseM }, (v) => v.k * Math.sqrt(v.a) + v.b, { unit: 'm', dp: 2, ref: REF.assume, expect: b0[key] })
    const v: Vars = { r, m: mult }
    parts.forEach(([, y], i) => { v[`n${i}`] = y })
    const tot = L.calc(`Route of all the ${name}`, `route = route of one × (${parts.map(([x]) => x).join(' + ')}) × copies`, `{r:2} × (${parts.map((_p, i) => `{n${i}}`).join(' + ')}) × {m}`, v,
      (x) => x.r * parts.reduce((s, _p, i) => s + x[`n${i}`], 0) * x.m, { unit: 'm', dp: 1, ref: REF.assume, expect: c.condOf(lab, src), note: 'This is also the conduit in these circuits.' })
    L.calc(`Wire in the ${name}, each colour`, `length = route × ${RUN}`, '{r:1} × {k}', { r: tot, k: RUN }, (x) => x.r * x.k, { unit: 'm', dp: 1, ref: REF.dar, expect: c.wireOf(lab, src, undefined, RED) })
  }
  side('lighting circuits', RULE.routeLight, 'rLight', [['lighting circuits', b0.cL], ['bathroom circuits', b0.cBath]], SRC.light, 'a lighting circuit')
  side('socket circuits', RULE.routeSock, 'rSock', [['6 A circuits', b0.cS6], ['6/16 A circuits', b0.cS16]], SRC.sock, 'a socket circuit')
  side('air conditioner circuits', RULE.routeDed, 'rDed', [['air conditioners', s0.ac]], SRC.ac, 'an air conditioner circuit')
  side('heater, washer and dishwasher circuits', RULE.routeDed, 'rDed', [['heaters', s0.geysers], ['washers', s0.washers], ['dishwashers', s0.dish]], SRC.heater, 'a heater, washer or dishwasher circuit')

  if (b0.cnt.TV + b0.cnt.D > 0) {
    const r = L.calc('Route to the media box', 'route = share × √A + base', '{k} × √{a:2} + {b}', { k: RULE.mediaPerSqrtM, a: s0.builtM2, b: RULE.mediaBaseM }, (v) => v.k * Math.sqrt(v.a) + v.b, { unit: 'm', dp: 2, ref: REF.assume, expect: b0.rMedia })
    L.calc('Conduit for the TV and data points', 'length = (TV + data points) × route × copies', '({t} + {x}) × {r:2} × {m}', { t: b0.cnt.TV, x: b0.cnt.D, r, m: mult }, (v) => (v.t + v.x) * v.r * v.m,
      { unit: 'm', dp: 1, ref: REF.assume, expect: c.condOf(lab, SRC.media) })
  }
  const example = L.take()

  /* ── other circuits: pump, EV, inverter ── */
  const bp = d.boards.find((b) => b.spec.pumps > 0)
  const be = d.boards.find((b) => b.spec.evs > 0)
  const bi = d.boards.find((b) => b.inv > 0)
  if (bp) {
    const m = L.calc('Route of the transfer pump circuits', 'route = metres for each pump × pumps', '{r} × {n}', { r: RULE.pumpRouteM, n: bp.spec.pumps }, (v) => v.r * v.n, { unit: 'm', dp: 1, ref: REF.assume, expect: c.condOf(bp.spec.label, SRC.pump), note: `On the ${bp.spec.label.toLowerCase()}. ${num(RULE.pumpMm2)} mm² wire.` })
    L.calc('Wire in the pump circuits, each colour', `length = route × ${RUN}`, '{r:1} × {k}', { r: m, k: RUN }, (v) => v.r * v.k, { unit: 'm', dp: 1, ref: REF.dar, expect: c.wireOf(bp.spec.label, SRC.pump, undefined, RED) })
  }
  if (be) {
    const r = L.calc('Route to the EV chargers', 'route = share × √(largest floor) + base + floor height × floors up', '{k} × √{a:2} + {b} + {h} × {fl}',
      { k: RULE.routeGround, a: Math.max(...d.builtM2), b: RULE.routeBaseM, h: d.H, fl: be.spec.floor }, (v) => v.k * Math.sqrt(v.a) + v.b + v.h * v.fl, { unit: 'm', dp: 2, ref: REF.assume, expect: be.rGround })
    const m = L.calc('Route of all the EV charger circuits', 'route = route of one × chargers', '{r:2} × {n}', { r, n: be.spec.evs }, (v) => v.r * v.n, { unit: 'm', dp: 1, ref: REF.assume, expect: c.condOf(be.spec.label, SRC.ev), note: `On the ${be.spec.label.toLowerCase()}. ${num(RULE.evMm2)} mm² wire.` })
    L.calc('Wire in the EV charger circuits, each colour', `length = route × ${RUN}`, '{r:1} × {k}', { r: m, k: RUN }, (v) => v.r * v.k, { unit: 'm', dp: 1, ref: REF.dar, expect: c.wireOf(be.spec.label, SRC.ev, undefined, RED) })
  }
  if (bi) {
    const m = L.calc('Route of the inverter circuits', 'route = metres for each × circuits × copies', '{r} × {n} × {m}', { r: RULE.inverterRouteM, n: bi.inv, m: bi.spec.mult }, (v) => v.r * v.n * v.m, { unit: 'm', dp: 1, ref: REF.assume, expect: c.condOf(bi.spec.label, SRC.inverter), note: `${num(RULE.inverterMm2)} mm² wire.` })
    L.calc('Wire in the inverter circuits, each colour', `length = route × ${RUN}`, '{r:1} × {k}', { r: m, k: RUN }, (v) => v.r * v.k, { unit: 'm', dp: 1, ref: REF.dar, expect: c.wireOf(bi.spec.label, SRC.inverter, undefined, RED) })
  }
  const others = L.take()

  const dash = '—'
  const perBoard = table(
    ['Board', 'Copies', 'Group factor', 'Live wire in a point (m)', 'Light route (m)', 'Socket route (m)', 'Appliance route (m)', 'Charger route (m)', 'Media route (m)'],
    d.boards.map((b) => [
      b.spec.label, d0(b.spec.mult), d3(b.f), d2(b.dw),
      b.cL + b.cBath > 0 ? d2(b.rLight) : dash,
      b.cS6 + b.cS16 > 0 ? d2(b.rSock) : dash,
      b.spec.ac + b.spec.geysers + b.spec.washers + b.spec.dish > 0 ? d2(b.rDed) : dash,
      b.spec.evs > 0 ? d2(b.rGround) : dash,
      b.cnt.TV + b.cnt.D > 0 ? d2(b.rMedia) : dash,
    ]),
    { num: [1, 2, 3, 4, 5, 6, 7, 8], note: 'One copy of each board. A dash means the board has no circuit of that kind.' },
  )

  /* ── by source, whole building ── */
  const srcRows = Object.values(SRC)
    .map((src) => ({ src, w: d.wireC.filter((x) => x.src === src).reduce((s, x) => s + x.m, 0), k: d.condC.filter((x) => x.src === src).reduce((s, x) => s + x.m, 0) }))
    .filter((r) => r.w > 0 || r.k > 0)
  const sumW = srcRows.reduce((s, r) => s + r.w, 0)
  const sumK = srcRows.reduce((s, r) => s + r.k, 0)
  const bySource = table(
    ['Where it goes', 'Wire (m)', 'Conduit (m)'],
    srcRows.map((r) => [r.src, d1(r.w), d1(r.k)]),
    { num: [1, 2], foot: ['Whole building, before waste', d1(sumW), d1(sumK)], note: 'Wire is all sizes and colours added together. Each line is the sum over every board and every copy.' },
  )
  const wTab = c.reportTable('wire')
  const cTab = c.reportTable('conduit')
  c.tieNum('Wire needed, all sizes, before waste', cellNumber(wTab?.foot?.[2]), sumW, 'm')
  c.tieNum('Conduit run, all sizes, before waste', cellNumber(cTab?.foot?.[1]), sumK, 'm')

  /* ── wire to buy ── */
  const wireEx = (wr: { size: number; colour: string; m: number }) => {
    const rrow = wTab?.rows.find((r) => String(r[0]) === `${wr.size} mm²` && String(r[1]) === wr.colour)
    const bySrc = new Map<string, number>()
    for (const w of d.wireC) if (w.size === wr.size && w.colour === wr.colour) bump(bySrc, w.src, w.m)
    const parts = [...bySrc.entries()]
    const v: Vars = {}
    parts.forEach(([, m], i) => { v[`p${i}`] = m })
    L.input('Size and colour worked here', `${wr.size} mm², ${wr.colour.toLowerCase()}`, REF.rule, wr === d.wireRows.reduce((a, b) => (b.m > a.m ? b : a), d.wireRows[0]) ? 'The size and colour with the most wire.' : 'The largest size, which is bought by the metre.')
    const need = L.calc('Length needed', 'length = the sum of the lengths from every source', parts.map(([src], i) => `{p${i}:1} (${SHORT[src] ?? src.toLowerCase()})`).join(' + '), v,
      (x) => parts.reduce((s, _p, i) => s + x[`p${i}`], 0), { unit: 'm', dp: 0, ref: 'Sum of sections 8 and 9', expect: cellNumber(rrow?.[2]) })
    const withW = L.calc('With waste', `length = needed × ${WASTE}`, '{n:2} × {w}', { n: need, w: WASTE }, (x) => x.n * x.w, { unit: 'm', dp: 0, ref: `${REF.dar}: ${Math.round((WASTE - 1) * 100)}% for cutting waste`, expect: cellNumber(rrow?.[3]) })
    if (wr.size <= RULE.coilMaxMm2) {
      const n = L.calc(`Coils of ${COIL_M} m`, `coils = up(length with waste ÷ ${COIL_M})`, 'up({w:2} ÷ {c})', { w: withW, c: COIL_M }, (x) => pieces(x.w, x.c), { dp: 0, ref: `Pack size: ${REF.assume}`, expect: cellNumber(rrow?.[4]), note: `Wire up to ${RULE.coilMaxMm2} mm² is bought in whole coils of ${COIL_M} m (the common pack; no standard fixes it), so a size that needs only a little wire still takes one whole coil.` })
      L.calc('Wire to buy', `length = coils × ${COIL_M}`, '{n} × {c}', { n, c: COIL_M }, (x) => x.n * x.c, { unit: 'm', dp: 0, ref: 'Buy list', expect: cellNumber(rrow?.[5]), result: true })
    } else {
      L.calc('Wire to buy', `length = length with waste rounded up to a multiple of ${RULE.byMetreStepM} m`, 'up({w:2} ÷ {s}) × {s}', { w: withW, s: RULE.byMetreStepM }, (x) => ceilTo(x.w, x.s), { unit: 'm', dp: 0, ref: `Sold by the metre: ${REF.assume}`, expect: cellNumber(rrow?.[5]), result: true, note: `Sizes above ${RULE.coilMaxMm2} mm² are bought by the metre in steps of ${RULE.byMetreStepM} m, not in coils, so they are rounded up far less than the smaller sizes.` })
    }
  }
  const wrMax = d.wireRows.reduce((a, b) => (b.m > a.m ? b : a), d.wireRows[0])
  wireEx(wrMax)
  const wireExample = L.take()
  const wrBig = d.wireRows.filter((r) => r.size > RULE.coilMaxMm2).reduce<(typeof d.wireRows)[number] | undefined>((a, b) => (!a || b.m > a.m ? b : a), undefined)
  let wireExample2: ReturnType<typeof L.take> = []
  if (wrBig && wrBig !== wrMax) { wireEx(wrBig); wireExample2 = L.take() }
  const sh = sheetTables(d)
  const wireTab = sh.find((t) => t.id === 'wire')!
  const wireTable = table(['Size', 'Colour', 'Length needed (m)', 'With waste (m)', 'Coils', 'To buy'], wireTab.rows.map((r) => r.map(String)), { num: [2, 3, 4], foot: wireTab.foot?.map(String), note: 'Red is the live wire, black the neutral, green-yellow the earth; a three-phase supply adds yellow and blue to the mains only.' })

  /* ── why more wire is bought than is counted ── */
  const coilRows = d.wireRows.filter((r) => r.size <= RULE.coilMaxMm2)
  const metreRows = d.wireRows.filter((r) => r.size > RULE.coilMaxMm2)
  const counted = L.calc('Wire counted, all sizes and colours, before waste', 'Σ over sizes and colours of the length needed', '{n:1}', { n: d.wireRunTotal }, (v) => v.n, { unit: 'm', dp: 0, ref: 'Section 9.7', expect: sumW })
  const withWasteAll = L.calc('With waste', `length = counted × ${WASTE}`, '{n:1} × {w}', { n: counted, w: WASTE }, (v) => v.n * v.w, { unit: 'm', dp: 0, ref: `${REF.dar}: ${Math.round((WASTE - 1) * 100)}% for cutting waste` })
  const inCoils = L.calc(`Bought in whole coils of ${COIL_M} m (sizes up to ${RULE.coilMaxMm2} mm²)`, 'Σ over those sizes and colours of the coils × the coil length', '{n:1}', { n: coilRows.reduce((a, r) => a + d.buyWire(r.size, r.m), 0) }, (v) => v.n, { unit: 'm', dp: 0, ref: `Pack size: ${REF.assume}` })
  const byMetre = L.calc(`Bought by the metre in steps of ${RULE.byMetreStepM} m (larger sizes)`, 'Σ over those sizes and colours of the length rounded up', '{n:1}', { n: metreRows.reduce((a, r) => a + d.buyWire(r.size, r.m), 0) }, (v) => v.n, { unit: 'm', dp: 0, ref: `Sold by the metre: ${REF.assume}` })
  const bought = L.calc('Wire to buy, all sizes and colours', 'bought = in coils + by the metre', '{a:1} + {b:1}', { a: inCoils, b: byMetre }, (v) => v.a + v.b, { unit: 'm', dp: 0, ref: 'Buy list', expect: d.wireBuyTotal, result: true })
  L.calc('More bought than counted', 'extra = (bought ÷ counted − 1) × 100', '({b:1} ÷ {n:1} − 1) × 100', { b: bought, n: counted }, (v) => (v.b / v.n - 1) * 100, { unit: '%', dp: 0, ref: 'From the two lines above',
    note: `${fmt(withWasteAll - counted, 0)} m of the extra is waste; the other ${fmt(bought - withWasteAll, 0)} m is rounding up.` })
  const small = coilRows.length > 0 ? coilRows.reduce((a, b) => (b.m < a.m ? b : a), coilRows[0]) : undefined
  if (small) L.say('Why a small need still buys a coil', `The smallest need is ${small.size} mm², ${small.colour.toLowerCase()}: ${fmt(small.m, 1)} m (${fmt(small.m * WASTE, 1)} m with waste), and ${fmt(d.buyWire(small.size, small.m), 0)} m is bought, which is ${fmt(d.buyWire(small.size, small.m) / COIL_M, 0)} whole ${pl(d.buyWire(small.size, small.m) / COIL_M, 'coil', 'coils')} of ${COIL_M} m. The ${COIL_M} m coil is the tool's choice of pack, and a shop may sell a part coil or cut a length, which would bring the quantity to buy down.`, REF.assume)
  const whyMore = L.take()

  /* ── conduit to buy ── */
  const cr = d.condRows.reduce((a, b) => (b[1] > a[1] ? b : a), d.condRows[0])
  const crow = cTab?.rows.find((r) => String(r[0]) === `${cr[0]} mm`)
  const cby = new Map<string, number>()
  for (const x of d.condC) if (x.mm === cr[0]) bump(cby, x.src, x.m)
  const cparts = [...cby.entries()]
  const cv: Vars = {}
  cparts.forEach(([, m], i) => { cv[`p${i}`] = m })
  L.input('Size worked here', `${cr[0]} mm`, REF.rule, 'The size with the most conduit.')
  const cneed = L.calc('Run needed', 'length = the sum of the lengths from every source', cparts.map(([src], i) => `{p${i}:1} (${SHORT[src] ?? src.toLowerCase()})`).join(' + '), cv, (x) => cparts.reduce((s, _p, i) => s + x[`p${i}`], 0), { unit: 'm', dp: 0, ref: 'Sum of sections 8 and 9', expect: cellNumber(crow?.[1]) })
  const cw = L.calc('With waste', `length = run × ${WASTE}`, '{n:2} × {w}', { n: cneed, w: WASTE }, (x) => x.n * x.w, { unit: 'm', dp: 0, ref: `${REF.dar}: ${Math.round((WASTE - 1) * 100)}% for cutting waste`, expect: cellNumber(crow?.[2]) })
  const cn = L.calc(`Lengths of ${RULE.conduitPieceM} m`, `lengths = up(length with waste ÷ ${RULE.conduitPieceM})`, 'up({w:2} ÷ {p})', { w: cw, p: RULE.conduitPieceM }, (x) => pieces(x.w, x.p), { dp: 0, ref: 'PVC conduit is sold in 3 m lengths', expect: cellNumber(crow?.[3]) })
  L.calc('Conduit to buy', `length = lengths × ${RULE.conduitPieceM}`, '{n} × {p}', { n: cn, p: RULE.conduitPieceM }, (x) => x.n * x.p, { unit: 'm', dp: 0, ref: 'Buy list', expect: cellNumber(crow?.[4]), result: true })
  const condExample = L.take()
  const condTab = sh.find((t) => t.id === 'conduit')!
  const condTable = table(['Size', 'Run (m)', 'With waste (m)', '3 m lengths', 'To buy'], condTab.rows.map((r) => r.map(String)), { num: [1, 2, 3], foot: condTab.foot?.map(String) })

  /* ── TV and data cable ── */
  const media = (label: string, key: 'TV' | 'D', total: number, rowName: string, buy: number) => {
    if (buy <= 0) return
    const bs = d.boards.filter((b) => b.cnt[key] > 0)
    const v: Vars = {}
    bs.forEach((b, i) => { v[`n${i}`] = b.cnt[key]; v[`r${i}`] = b.rMedia; v[`m${i}`] = b.spec.mult })
    const run = L.calc(`${label}, run`, 'run = Σ over boards (points × route to the media box × copies)', bs.map((_b, i) => `{n${i}} × {r${i}:2} × {m${i}}`).join(' + '), v,
      (x) => bs.reduce((s, _b, i) => s + x[`n${i}`] * x[`r${i}`] * x[`m${i}`], 0), { unit: 'm', dp: 1, ref: REF.assume, expect: total })
    L.calc(`${label}, to buy`, `length = run × ${WASTE}, rounded up to a multiple of ${RULE.byMetreStepM} m`, 'up({r:2} × {w} ÷ {s}) × {s}', { r: run, w: WASTE, s: RULE.byMetreStepM }, (x) => ceilTo(x.r * x.w, x.s),
      { unit: 'm', dp: 0, ref: `Sold by the metre: ${REF.assume}`, expect: c.rowNum('acc', rowName), result: true })
  }
  media('TV cable (coaxial)', 'TV', d.tot.tvM, 'TV cable (coaxial), to buy', d.coaxBuy)
  media('Data cable (Cat 6)', 'D', d.tot.dataM, 'Data cable (Cat 6), to buy', d.catBuy)
  const mediaLines = L.take()

  return {
    id: 's9', title: '9. Wire and conduit: lengths and what to buy',
    intro: 'Wire and conduit are counted from the points and from the routes of the circuits, board by board, then added up by size and colour and rounded up to the packs they are sold in.',
    blocks: [
      block('len-how', '9.1 How a metre is counted', how),
      block('len-dar', '9.2 In one point, and the routes', undefined, dar),
      block('len-routes', '9.3 Routes of the circuits', undefined, routes),
      block('len-ex', `9.4 Worked example: wire and conduit on ${repName}`, example),
      ...(others.length > 0 ? [block('len-other', '9.5 Pump, charger and inverter circuits', others)] : []),
      block('len-boards', '9.6 Route lengths on every board', undefined, perBoard),
      block('len-src', '9.7 Where the wire and conduit go, whole building', undefined, bySource),
      block('wire-ex', '9.8 Worked example: wire to buy', wireExample),
      ...(wireExample2.length > 0 ? [block('wire-ex2', '9.9 Worked example: a size bought by the metre', wireExample2)] : []),
      block('wire-all', '9.10 Wire to buy, every size and colour', whyMore, wireTable),
      block('cond-ex', '9.11 Worked example: conduit to buy', condExample),
      block('cond-all', '9.12 Conduit to buy, every size', undefined, condTable),
      ...(mediaLines.length > 0 ? [block('media', '9.13 TV and data cable', mediaLines)] : []),
    ],
  }
}

/* ───────────────────────────────────────────────────────────────────────────────────────────── */

export function section10(c: Ctx): CalcSection {
  const { d, L } = c
  const n = d.electrodes

  L.say('What is counted', 'Earth electrodes, a strip of earth conductor from each electrode to the board, and an earth pit cover and chamber for each electrode. Every circuit and every run of mains carries its own earth wire, which is counted with the wire in section 9.', `${REF.draftC8}; ${REF.is3043}`)
  L.say('What is not worked', 'The number of electrodes needed depends on the soil and on the earth resistance the installation must reach. The model does not work out the resistance of an electrode or set a target value. Your electrician must measure the earth resistance after installation and add electrodes if it is too high.', REF.is3043)
  const how = L.take()

  if (d.flats) {
    L.calc('Earth electrodes', 'electrodes = base + down(homes ÷ homes for each extra electrode)', '{b} + down({h} ÷ {p})', { b: RULE.electrodesFlatsBase, h: d.homes, p: RULE.electrodesPerHomes },
      (v) => v.b + Math.floor(v.h / v.p), { dp: 0, ref: REF.assume, expect: d.electrodes, result: true })
  } else {
    L.calc('Earth electrodes', `electrodes = ${RULE.electrodesThreePhase} for a three-phase house, ${RULE.electrodesSingle} for a single-phase house`, d.threePhase ? 'three-phase supply: {a}' : 'single-phase supply: {b}',
      { a: RULE.electrodesThreePhase, b: RULE.electrodesSingle, t: d.threePhase ? 1 : 0 }, (v) => (v.t === 1 ? v.a : v.b), { dp: 0, ref: REF.assume, expect: d.electrodes, result: true })
  }
  const strip = L.calc('Earth strip', 'length = electrodes × metres of strip from each', '{n} × {s}', { n, s: RULE.stripPerElectrodeM }, (v) => v.n * v.s, { unit: 'm', dp: 0, ref: REF.assume, expect: c.rowNum('prot', PROT_NAMES.strip), result: true })
  L.calc('Earth pit covers and chambers', 'one for each electrode', '{n}', { n }, (v) => v.n, { dp: 0, ref: REF.assume, expect: c.rowNum('prot', PROT_NAMES.pit), result: true })
  L.calc('Earth electrodes in the report', 'electrodes in the buy list', '{n}', { n }, (v) => v.n, { dp: 0, ref: 'Buy list', expect: c.rowNum('prot', PROT_NAMES.electrode), result: true })
  const calc = L.take()
  c.tieNum('Earth strip', c.rowNum('prot', PROT_NAMES.strip), strip, 'm')
  c.tieText('Earthing shown in the report', c.fact('Earthing')?.v ?? '', `${n} ${n === 1 ? 'electrode' : 'electrodes'}`)

  return {
    id: 's10', title: '10. Earthing',
    intro: 'The model counts the electrodes, the strip and the pit covers. It does not design the earthing.',
    blocks: [
      block('earth-how', '10.1 What is and is not counted', how),
      block('earth-calc', '10.2 Electrodes, strip and pits', calc),
    ],
  }
}

/* ───────────────────────────────────────────────────────────────────────────────────────────── */

export function section11(c: Ctx): CalcSection {
  const { d, L } = c
  const t = d.total
  const x = d.tot

  /* fittings that follow the conduit */
  const srcs = [...d.accBy.entries()]
  const fitTable = table(
    ['Where', 'Bends', 'Couplers', 'Saddles or clips', 'Junction boxes'],
    srcs.map(([src, a]) => [src, d1(a.bends), d1(a.couplers), d1(a.saddles), d1(a.jbox)]),
    { num: [1, 2, 3, 4], foot: ['Whole building, before rounding up', d1(d.acc.bends), d1(d.acc.couplers), d1(d.acc.saddles), d1(d.acc.jbox)], note: `In a point: one bend and one junction or ceiling box, and the couplers and saddles of table 9.2. On a route: ${d2(PER_M.bends)} bends, ${d2(PER_M.couplers)} couplers and ${d2(PER_M.saddles)} saddles a metre, and ${d2(PER_M.jbox)} junction boxes a metre on power circuits (${REF.dar15}: per 50 m of conduit, 4 bends, 15 couplers, 85 saddles, 6 junction boxes).` },
  )
  const fitLine = (label: string, key: 'bends' | 'couplers' | 'saddles' | 'jbox', row: string) => {
    const v: Vars = {}
    srcs.forEach(([, a], i) => { v[`s${i}`] = a[key] })
    L.calc(label, 'number = up(the sum over every source)', `up(${srcs.map((_s, i) => `{s${i}:1}`).join(' + ')})`, v, (y) => Math.ceil(srcs.reduce((s, _a, i) => s + y[`s${i}`], 0)), { dp: 0, ref: REF.dar15, expect: c.rowNum('acc', row), result: true })
  }
  fitLine('Conduit bends, 20 mm', 'bends', 'Conduit bends, 20 mm')
  fitLine('Conduit couplers', 'couplers', 'Conduit couplers')
  fitLine('Conduit saddles or clips', 'saddles', 'Conduit saddles or clips')
  const fit = L.take()

  /* switches, sockets and boxes */
  const mine = accessories(d)
  const A = ACC_NAMES
  const def = (name: string, formula: string, working: string, vars: Vars, fn: (v: Vars) => number, note?: string, ref: string = REF.assume) => {
    if (!mine.has(name)) return
    L.calc(name, formula, working, vars, fn, { dp: 0, ref, note, expect: c.rowNum('acc', name), result: true })
  }
  def(A.switch, 'switches = lights + fans + exhaust fans', '{a} + {b} + {e}', { a: t.L, b: t.F, e: t.X }, (v) => v.a + v.b + v.e, 'In practice lights are grouped on one switch, so the real count may be lower.', 'One switch for each point, as the CPWD point rules count it (CPWD GS 3.4)')
  def(A.regulator, 'regulators = fans', '{a}', { a: t.F }, (v) => v.a)
  def(A.sock6, '6 A sockets', '{a}', { a: t.S6 }, (v) => v.a)
  def(A.sock16, '6/16 A sockets + outlets for the washing machine and dishwasher', '{a} + {w} + {k}', { a: t.S16, w: x.washers, k: x.dish }, (v) => v.a + v.w + v.k)
  def(A.acSocket, 'one for each air conditioner', '{a}', { a: x.ac }, (v) => v.a)
  def(A.isolator, 'air conditioners + water heaters', '{a} + {g}', { a: x.ac, g: x.geysers }, (v) => v.a + v.g)
  def(A.bellPush, 'one for each call bell', '{a}', { a: t.B }, (v) => v.a)
  def(A.bell, 'one for each call bell', '{a}', { a: t.B }, (v) => v.a)
  def(A.tv, 'TV points', '{a}', { a: t.TV }, (v) => v.a)
  def(A.data, 'data points', '{a}', { a: t.D }, (v) => v.a)
  def(A.media, 'one for each board that has a TV or data point, all copies', '{a}', { a: x.mediaBoxes }, (v) => v.a)
  def(A.rose, 'lights + fans + bells', '{a} + {b} + {e}', { a: t.L, b: t.F, e: t.B }, (v) => v.a + v.b + v.e)
  def(A.hook, 'one for each fan', '{a}', { a: t.F }, (v) => v.a)
  def(A.jbox, 'boxes = up(the sum over every source, table above)', 'up({j:1})', { j: d.acc.jbox }, (v) => Math.ceil(v.j), 'Counted in the points and along power circuits.')
  const modv = { l: t.L, f: t.F, x: t.X, s6: t.S6, s16: t.S16, w: x.washers, k: x.dish, tv: t.TV, da: t.D, b: t.B, ac: x.ac }
  const modules = L.calc('Modules in all the switch boxes', 'modules = lights + fans × 2 + exhaust fans + 6 A + 6/16 A + washers + dishwashers + TV + data + bells + air conditioners',
    '{l} + 2 × {f} + {x} + {s6} + {s16} + {w} + {k} + {tv} + {da} + {b} + {ac}', modv, (v) => v.l + 2 * v.f + v.x + v.s6 + v.s16 + v.w + v.k + v.tv + v.da + v.b + v.ac,
    { dp: 0, ref: REF.assume, expect: x.modules, note: 'Each fan point is counted as two modules (its switch and its regulator).' })
  def(A.switchBox, `boxes = up(modules ÷ ${RULE.modulesPerBox})`, 'up({m} ÷ {p})', { m: modules, p: RULE.modulesPerBox }, (v) => Math.ceil(v.m / v.p), `A switch box holds about ${RULE.modulesPerBox} modules.`)
  const acc = L.take()

  /* the buy list */
  const mineLines = buyLines(d)
  const rl = c.report.paid.lines
  if (rl.length !== mineLines.length) c.bad.push(`purchase lines: report has ${rl.length}, sheet ${mineLines.length}`)
  mineLines.forEach((ln, i) => {
    const r = rl[i]
    if (!r) return
    if (r.key !== ln.key || r.item !== ln.item || r.unit !== ln.unit) c.bad.push(`purchase line ${i + 1}: report "${r.key}" / "${r.item}" / ${r.unit} vs sheet "${ln.key}" / "${ln.item}" / ${ln.unit}`)
    c.tieNum(`Buy list: ${ln.item}`, r.qty, ln.qty, ln.unit)
  })
  const sumLine = (label: string, formula: string, working: string, vars: Vars, fn: (v: Vars) => number, key: string) =>
    L.calc(label, formula, working, vars, fn, { dp: 0, ref: REF.gs34, expect: c.report.paid.lines.find((r) => r.key === key)?.qty ?? NaN, result: true })
  sumLine('Light, fan, exhaust and bell points', 'points = lights + fans + exhaust fans + bells', '{a} + {b} + {e} + {g}', { a: t.L, b: t.F, e: t.X, g: t.B }, (v) => v.a + v.b + v.e + v.g, 'light-points')
  sumLine('Socket outlets', 'sockets = 6 A + 6/16 A + washer + dishwasher + air conditioner outlets', '{a} + {b} + {w} + {k} + {ac}', { a: t.S6, b: t.S16, w: x.washers, k: x.dish, ac: x.ac }, (v) => v.a + v.b + v.w + v.k + v.ac, 'sockets')
  const sums = L.take()

  const buyTable = table(
    ['Item', 'Quantity', 'Unit'],
    mineLines.map((ln) => [ln.item, fmt(ln.qty), ln.unit]),
    { num: [1], note: `${mineLines.length} lines. Wire up to ${RULE.coilMaxMm2} mm² is in whole coils of ${COIL_M} m, larger wire by the metre, conduit in whole ${RULE.conduitPieceM} m lengths; each includes ${Math.round((WASTE - 1) * 100)}% for waste. The other items are counts.` },
  )

  return {
    id: 's11', title: '11. Fittings, and everything to buy',
    intro: 'The switches, sockets, boxes and conduit fittings, then every line of the buy list in the report, rebuilt from the sheet.',
    blocks: [
      block('fit-src', '11.1 Conduit fittings by source', undefined, fitTable),
      block('fit-lines', '11.2 Fittings, switches, sockets and boxes', [...fit, ...acc]),
      block('buy-sums', '11.3 Points and sockets', sums),
      block('buy-all', '11.4 The whole buy list', undefined, buyTable),
    ],
  }
}

/* ───────────────────────────────────────────────────────────────────────────────────────────── */

export function section12(c: Ctx): CalcSection {
  const { d, L } = c
  const tiles = c.report.paid.tiles
  const rows: { label: string; tile: string; band: { label: string; low: number; high: number }; value: number; suffix: string; unit: string; dp: number }[] = [
    { label: 'Points and sockets', tile: 'Points and sockets', band: ELEC_BANDS.points, value: d.points + d.sockets, suffix: '', unit: 'points and sockets', dp: 0 },
    { label: 'Copper wire', tile: 'Copper wire', band: ELEC_BANDS.wire, value: d.wireBuyTotal, suffix: ' m', unit: 'm', dp: 0 },
    { label: 'Conduit', tile: 'Conduit', band: ELEC_BANDS.conduit, value: d.condBuy, suffix: ' m', unit: 'm', dp: 0 },
    { label: 'Circuits', tile: 'Circuits', band: ELEC_BANDS.circuits, value: d.tot.circuits, suffix: ' circuits', unit: 'circuits', dp: 0 },
  ]
  L.say('What the range is', 'Each total at the top of the report has a range beside it. The range is the total multiplied by a low and a high factor for that kind of figure. The factors are the tool\'s own judgement of how far a count made from a few answers and no drawing can be from the wiring that is built; no standard or survey gives them.', REF.assume)
  L.say('Where the doubt is', 'The sources disagree on how many 6 A sockets share a circuit (CPWD GS 3.10 allows three; the model allows eight), so the circuit count is the least certain part of the report. The room-wise points follow a draft standard, and a few columns of it were read by position. Route lengths of the wire are assumed, not measured.', `${REF.assume}; ${REF.draft}`)
  const how = L.take()

  for (const r of rows) {
    const tile = tiles.find((t) => t.k === r.tile)
    const [lo, hi] = (tile?.range ?? '').split(' to ')
    L.value(`${r.label}: total in the report`, r.value, r.unit, 0, 'The total at the top of the report (sections 3, 5 and 9)')
    L.calc(`${r.label}: low end`, 'low = total × low factor', '{v:1} × {f}', { v: r.value, f: r.band.low }, (y) => y.v * y.f, { unit: r.unit, dp: r.dp, ref: REF.assume, expect: cellNumber(lo) })
    L.calc(`${r.label}: high end`, 'high = total × high factor', '{v:1} × {f}', { v: r.value, f: r.band.high }, (y) => y.v * y.f, { unit: r.unit, dp: r.dp, ref: REF.assume, expect: cellNumber(hi), result: true })
    c.tieText(`Range shown beside "${r.tile}"`, tile?.range ?? '', `${rangeText(r.value, r.band.low, r.band.high, 0)}${r.suffix}`)
  }
  const worked = L.take()
  c.tieNum('Copper wire to buy, total at the top of the report', cellNumber(tiles.find((t) => t.k === 'Copper wire')?.v), d.wireBuyTotal, 'm')
  c.tieNum('Conduit to buy, total at the top of the report', cellNumber(tiles.find((t) => t.k === 'Conduit')?.v), d.condBuy, 'm')

  const bands = Object.values(ELEC_BANDS)
  const rb = c.report.paid.bands
  if (rb.length !== bands.length) c.bad.push(`bands: report has ${rb.length}, sheet ${bands.length}`)
  bands.forEach((b, i) => c.tieText(`Low and high factors for ${b.label.toLowerCase()}`, rb[i] ? `${rb[i].label}, ${rb[i].low} to ${rb[i].high}` : '', `${b.label}, ${b.low} to ${b.high}`))
  const bandTable = table(
    ['Kind of figure', 'Low factor', 'High factor', 'Applies to'],
    bands.map((b) => [b.label, num(b.low), num(b.high), rows.find((r) => r.band === b) ? `The "${rows.find((r) => r.band === b)!.tile}" total` : 'The counts of switches, boxes and fittings (section 11.2)']),
    { num: [1, 2], note: 'The factors are assumptions of the tool. They widen the figure; they do not say it is more likely to be high than low.' },
  )

  return {
    id: 's12', title: '12. How far the totals can be out',
    intro: 'The report shows a range beside each total. This section shows how the range is made and where the doubt is greatest.',
    blocks: [
      block('band-how', '12.1 What the ranges are', how),
      block('band-ex', '12.2 The ranges, worked', worked),
      block('band-all', '12.3 The factors', undefined, bandTable),
    ],
  }
}

