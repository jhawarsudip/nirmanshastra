/* ElectricalPro calculation sheet, sections 5 to 8: circuits, wire sizes, breakers and boards, mains. */

import { num } from '@/lib/calcsheet'
import type { CalcSection, Vars } from '@/lib/calcsheet'
import { REF, block, d0, d1, d2, pl, table, type Ctx } from './calc-ctx'
import { PROT_NAMES, cellNumber } from './calc-rows'
import { SRC } from './derive'
import {
  COLOUR, MAINS_COLOURS, NAME, PHASE_KIND, RULE, RUN, SPN_WAYS, TPN_WAYS, rccbA, waysFor,
} from './rules'
import {
  CIRCUIT_ORDER, CIRCUIT_RULES, CONDUIT_STEPS, DRAFT_MAINS_LIMIT_KW, INCOMER_STEPS, MAINS_STEPS, conduitFor, earthMm2, incomerA, mainsMm2, mainsStatus, type Steps,
} from './wire'

export function section5(c: Ctx): CalcSection {
  const { d, L, repB: b0, repName } = c
  const { std } = d
  const s0 = b0.spec

  /* the model keeps the breaker and wire sizes of some circuits in two places; the sheet insists they agree */
  const agree = (what: string, a: string, b: string) => { if (a !== b) c.bad.push(`${what}: ${a} against ${b}`) }
  agree('lighting breaker', `${RULE.mcb.light} A`, CIRCUIT_RULES.lights.mcb)
  agree('6 A socket breaker', `${RULE.mcb.sockets6} A`, CIRCUIT_RULES.sockets6.mcb)
  agree('16 A breaker (sockets)', `${RULE.mcb.power} A`, CIRCUIT_RULES.sockets16.mcb)
  agree('16 A breaker (heaters)', `${RULE.mcb.power} A`, CIRCUIT_RULES.heater.mcb)
  agree('air conditioner breaker', `${RULE.mcb.ac} A`, CIRCUIT_RULES.ac.mcb)
  agree('socket tap size, Standard', `${RULE.tapMm2.std} mm2`, `${CIRCUIT_RULES.sockets6.mm2} mm2`)
  agree('socket tap size, Basic', `${RULE.tapMm2.basic} mm2`, `${CIRCUIT_RULES.lights.mm2} mm2`)
  agree('6/16 A socket tap size', `${RULE.tapMm2.s16} mm2`, `${CIRCUIT_RULES.sockets16.mm2} mm2`)

  const rules = table(
    ['Circuit', 'Copper (mm²)', 'Breaker', 'What goes on one circuit', 'Source'],
    [
      ['Lights and fans', num(CIRCUIT_RULES.lights.mm2), CIRCUIT_RULES.lights.mcb,
        std ? `Up to ${RULE.ptsPerLightCkt} points, and at least ${RULE.minLightCkts} lighting circuits in a home (the bathroom circuits count)` : `Up to ${RULE.ptsPerLightCktBasic} points including the 5 A sockets, and at least ${RULE.minLightCkts} circuits`,
        std ? REF.draftC621 : REF.old1968c72],
      ['Bathroom lights and exhaust fans', std ? num(CIRCUIT_RULES.lights.mm2) : '—', std ? CIRCUIT_RULES.lights.mcb : '—', std ? `Bathrooms on a circuit of their own, up to ${RULE.ptsPerBathCkt} points` : 'Not separate at the Basic level', std ? REF.draftC621 : '—'],
      ['6 A sockets', std ? num(CIRCUIT_RULES.sockets6.mm2) : '—', std ? CIRCUIT_RULES.sockets6.mcb : 'none', std ? `Up to ${RULE.s6PerCkt} sockets. The sources disagree on this limit (CPWD GS 3.10 allows three), so it is an assumption` : 'None: the 5 A sockets are on the lighting circuits', std ? `${REF.draftT4}; ${REF.draftC628}; ${REF.assume}` : REF.old1968c72],
      ['6/16 A sockets', num(CIRCUIT_RULES.sockets16.mm2), CIRCUIT_RULES.sockets16.mcb, `Up to ${RULE.s16PerCkt} outlets`, REF.draftC622],
      ['Air conditioner', num(CIRCUIT_RULES.ac.mm2), CIRCUIT_RULES.ac.mcb, 'One circuit for each air conditioner', REF.draftC622],
      ['Water heater', num(CIRCUIT_RULES.heater.mm2), CIRCUIT_RULES.heater.mcb, 'One circuit for each water heater', REF.draftC622],
      ['Washing machine and dishwasher', num(CIRCUIT_RULES.heater.mm2), CIRCUIT_RULES.heater.mcb, 'One circuit for each appliance of 2 kW or more', REF.draftC622],
      ['Transfer pump', num(RULE.pumpMm2), `${RULE.mcb.power} A`, 'One circuit for each pump', REF.assume],
      ['EV charger', num(RULE.evMm2), `${RULE.mcb.ev} A`, 'One circuit for each charging point', REF.assume],
      ['Inverter', num(RULE.inverterMm2), `${RULE.mcb.power} A`, 'One circuit for each home that has an inverter', REF.assume],
    ],
    { num: [1], note: 'Copper sizes and breakers are looked up, not calculated. How the wire size is chosen is set out in section 6.' },
  )

  /* worked example */
  L.input('Board worked here', repName, REF.rule, 'The board with the most points.')
  const pts = L.calc('Points on the board', 'points = lights + fans + exhaust fans + bells', '{L} + {F} + {X} + {B}', { ...b0.cnt }, (v) => v.L + v.F + v.X + v.B, { dp: 0, ref: REF.gs34, expect: b0.pts })
  let lightPts = pts
  let cBath = 0
  if (std) {
    const bath = b0.rooms.find((r) => r.label === NAME.bath)
    const bp = L.calc('Points in the bathrooms', 'bathroom points = bathroom lights + bathroom exhaust fans', '{bl} + {bx}', { bl: bath?.c.L ?? 0, bx: bath?.c.X ?? 0 }, (v) => v.bl + v.bx, { dp: 0, ref: REF.draftC621, expect: b0.bathPts })
    lightPts = L.calc('Lighting points outside the bathrooms', 'points − bathroom points', '{p} − {b}', { p: pts, b: bp }, (v) => v.p - v.b, { dp: 0, ref: REF.rule, expect: b0.lightPts })
    cBath = L.calc('Bathroom circuits', `up(bathroom points ÷ ${RULE.ptsPerBathCkt})`, 'up({b} ÷ {m})', { b: bp, m: RULE.ptsPerBathCkt }, (v) => (v.b > 0 ? Math.ceil(v.b / v.m) : 0), { dp: 0, ref: REF.draftC621, expect: b0.cBath })
    L.calc('Lighting circuits', `the largest of: 1 if there are lighting points, ${RULE.minLightCkts} less the bathroom circuits, and up(lighting points ÷ ${RULE.ptsPerLightCkt})`,
      'max({one}, {min} − {cb}, up({lp} ÷ {m}))', { one: lightPts > 0 ? 1 : 0, min: RULE.minLightCkts, cb: cBath, lp: lightPts, m: RULE.ptsPerLightCkt },
      (v) => Math.max(v.one, v.min - v.cb, Math.ceil(v.lp / v.m)), { dp: 0, ref: REF.draftC621, expect: b0.cL, result: true })
  } else {
    L.calc('Lighting circuits', `the larger of ${RULE.minLightCkts} and up((points + 5 A sockets) ÷ ${RULE.ptsPerLightCktBasic})`, 'max({min}, up(({p} + {s}) ÷ {m}))', { min: RULE.minLightCkts, p: pts, s: b0.cnt.S6, m: RULE.ptsPerLightCktBasic },
      (v) => Math.max(v.min, Math.ceil((v.p + v.s) / v.m)), { dp: 0, ref: REF.old1968c72, expect: b0.cL, result: true })
  }
  if (std) L.calc('6 A socket circuits', `up(6 A sockets ÷ ${RULE.s6PerCkt})`, 'up({s} ÷ {m})', { s: b0.cnt.S6, m: RULE.s6PerCkt }, (v) => Math.ceil(v.s / v.m), { dp: 0, ref: `${REF.assume}: the sources disagree on the limit`, expect: b0.cS6, result: true })
  else L.pick('6 A socket circuits', 'none at the Basic level', '0', REF.old1968c72, 'The 5 A sockets are counted on the lighting circuits above.')
  L.calc('6/16 A socket circuits', `up(6/16 A sockets ÷ ${RULE.s16PerCkt})`, 'up({s} ÷ {m})', { s: b0.cnt.S16, m: RULE.s16PerCkt }, (v) => Math.ceil(v.s / v.m), { dp: 0, ref: REF.draftC622, expect: b0.cS16, result: true })
  L.calc('Air conditioner, water heater, washer and dishwasher circuits', 'one circuit for each', '{ac} + {g} + {w} + {di}', { ac: s0.ac, g: s0.geysers, w: s0.washers, di: s0.dish }, (v) => v.ac + v.g + v.w + v.di, { dp: 0, ref: REF.draftC622, expect: s0.ac + s0.geysers + s0.washers + s0.dish, result: true })
  L.calc('Inverter circuit', 'one for each home with an inverter, on the board that takes the supply', '{i}', { i: b0.inv }, (v) => v.i, { dp: 0, ref: REF.assume, expect: b0.inv })
  const example = L.take()

  let commonLines: ReturnType<typeof L.take> = []
  const cb = c.common
  if (cb) {
    const cp = cb.pts
    L.input('Board worked here', cb.spec.label, REF.rule, 'The common areas: stairs, lift lobby, terrace, gate, parking, the transfer pumps and the EV chargers.')
    L.calc('Points on the board', 'points = lights + fans + exhaust fans + bells', '{L} + {F} + {X} + {B}', { ...cb.cnt }, (v) => v.L + v.F + v.X + v.B, { dp: 0, ref: REF.gs34, expect: cp })
    L.calc('Lighting circuits', `the largest of the rule above, up(points ÷ ${RULE.ptsPerLightCkt}) and 1 if there are points`, 'max({rule}, up({p} ÷ {m}), {one})',
      { rule: std ? Math.max(cb.lightPts > 0 ? 1 : 0, RULE.minLightCkts - cb.cBath, Math.ceil(cb.lightPts / RULE.ptsPerLightCkt)) : Math.max(RULE.minLightCkts, Math.ceil((cp + cb.cnt.S6) / RULE.ptsPerLightCktBasic)), p: cp, m: RULE.ptsPerLightCkt, one: cp > 0 ? 1 : 0 },
      (v) => Math.max(v.rule, Math.ceil(v.p / v.m), v.one), { dp: 0, ref: REF.rule, expect: cb.cL, result: true })
    L.calc('6/16 A socket circuits', `up(6/16 A sockets ÷ ${RULE.s16PerCkt})`, 'up({s} ÷ {m})', { s: cb.cnt.S16, m: RULE.s16PerCkt }, (v) => Math.ceil(v.s / v.m), { dp: 0, ref: REF.draftC622, expect: cb.cS16 })
    L.calc('Transfer pump and EV charger circuits', 'one circuit for each', '{p} + {e}', { p: cb.spec.pumps, e: cb.spec.evs }, (v) => v.p + v.e, { dp: 0, ref: REF.assume, expect: cb.spec.pumps + cb.spec.evs })
    commonLines = L.take()
  }

  const byBoard = table(
    ['Board', 'Copies', 'Lights', 'Bath', '6 A', '6/16 A', 'Air con', 'Heater', 'Washer, dishwasher', 'Pump', 'EV', 'Inverter', 'One copy'],
    d.boards.map((b) => [b.spec.label, d0(b.spec.mult), d0(b.cL), d0(b.cBath), d0(b.cS6), d0(b.cS16), d0(b.spec.ac), d0(b.spec.geysers), d0(b.spec.washers + b.spec.dish), d0(b.spec.pumps), d0(b.spec.evs), d0(b.inv), d0(b.cL + b.cBath + b.cS6 + b.cS16 + b.spec.ac + b.spec.geysers + b.spec.washers + b.spec.dish + b.spec.pumps + b.spec.evs + b.inv)]),
    {
      num: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      foot: ['Whole building (× copies)', '', d0(c.sumM((b) => b.cL)), d0(c.sumM((b) => b.cBath)), d0(c.sumM((b) => b.cS6)), d0(c.sumM((b) => b.cS16)), d0(d.tot.ac), d0(d.tot.geysers), d0(d.tot.washers + d.tot.dish), d0(d.tot.pumps), d0(d.tot.evs), d0(d.tot.inverters), d0(d.tot.circuits)],
      note: 'Circuits. Each row is for one copy of the board; the foot multiplies by the copies and adds up.',
    },
  )
  const circuitRows = [...d.circuits.entries()].map(([name, ck]) => [name, d0(Math.round(ck.n)), ck.rating, ck.cable])
  const circuitsTable = table(['Circuit', 'Number', 'Breaker', 'Cable'], circuitRows, { num: [1], foot: ['All circuits', d0(Math.round(d.tot.circuits)), '', ''] })
  const ctFoot = c.reportTable('circuits')?.foot
  c.tieNum('Circuits, all boards', cellNumber(ctFoot?.[1]), Math.round(d.tot.circuits), 'circuits')
  c.tieNum('Circuits (total under "What to order")', cellNumber(c.report.paid.tiles.find((t) => t.k === 'Circuits')?.v), d.tot.circuits, 'circuits')

  return {
    id: 's5', title: '5. Circuits',
    intro: 'Each circuit is one breaker, one run of cable and a limited number of points. The model counts how many circuits each board needs from the points it carries and the large appliances it serves.',
    blocks: [
      block('ckt-rules', '5.1 What the model puts on one circuit', undefined, rules),
      block('ckt-ex', `5.2 Worked example: ${repName}`, example),
      ...(cb ? [block('ckt-common', '5.3 The common board', commonLines)] : []),
      block('ckt-boards', `5.${cb ? 4 : 3} Circuits on every board`, undefined, byBoard),
      block('ckt-total', `5.${cb ? 5 : 4} Circuits in the whole building`, undefined, circuitsTable),
    ],
  }
}

/* ───────────────────────────────────────────────────────────────────────────────────────────── */

const stepRows = (st: Steps, unit: string, valueUnit: string, status: (hi: number) => string): string[][] => {
  const out: string[][] = []
  st.upTo.forEach(([hi, v], i) => {
    const lo = i === 0 ? null : st.upTo[i - 1][0]
    out.push([lo === null ? `Up to ${hi} ${unit}` : `Over ${lo} up to ${hi} ${unit}`, `${v} ${valueUnit}`, status(hi)])
  })
  const last = st.upTo[st.upTo.length - 1][0]
  out.push([`Over ${last} ${unit}`, `${st.above} ${valueUnit}`, REF.assume])
  return out
}

export function section6(c: Ctx): CalcSection {
  const { d, L } = c

  L.say('What the model does', 'Each circuit gets the least copper size for its kind (table 6.2). The size does not change with the length of the run, the number of circuits sharing a conduit or the temperature.', REF.rule)
  L.say('What the model does not do', 'It does not work out the current a cable can carry, derate it for grouping or temperature, calculate the voltage drop, or check fault current. IS 732 sizes a cable by those things, so a long run needs more than the sizes shown here.', 'Not worked in this model')
  L.say('Copper', 'All wire is copper. Every circuit carries an earth wire of the same size as its live wire.', REF.draftT4)
  const how = L.take()

  const kinds = CIRCUIT_ORDER.map((k) => CIRCUIT_RULES[k])
  const sizes = table(
    ['Circuit', 'Copper (mm²)', 'Earth wire (mm²)', 'Conduit (mm)', 'Breaker', 'Source of the size'],
    [
      ...kinds.map((r) => [r.label, num(r.mm2), num(earthMm2(r.mm2)), d0(conduitFor(r.mm2, false)), r.mcb, r.status === 'assumed' ? `${r.source} (assumed)` : r.source]),
      ['Transfer pump', num(RULE.pumpMm2), num(earthMm2(RULE.pumpMm2)), d0(conduitFor(RULE.pumpMm2, false)), `${RULE.mcb.power} A`, REF.assume],
      ['Inverter', num(RULE.inverterMm2), num(earthMm2(RULE.inverterMm2)), d0(conduitFor(RULE.inverterMm2, false)), `${RULE.mcb.power} A`, REF.assume],
      ['EV charger', num(RULE.evMm2), num(earthMm2(RULE.evMm2)), d0(conduitFor(RULE.evMm2, false)), `${RULE.mcb.ev} A`, REF.assume],
    ],
    {
      num: [1, 2, 3],
      note: `CPWD GS 3.12(ii) asks for 4 mm² on power wiring in its own works; the draft IS 4648 allows ${num(CIRCUIT_RULES.sockets16.mm2)} mm² on a circuit of up to two sockets or one appliance of up to 3 kW, and the model follows the draft. Earth wire: equal to the line wire up to 16 mm², half of it above, taken to the next size sold (draft IS 4648 cl 8). Conduit: ${REF.dar17}, extended for the larger sizes.`,
    },
  )

  /* the supply cable */
  const runs = d.boards.map((b) => b)
  const gov = runs.reduce((a, b) => (b.mains.size > a.mains.size ? b : a), runs[0])
  const m = gov.mains
  L.input('Run worked here', m.run, REF.rule, 'The run with the largest cable.')
  L.value('Design load this run is sized for', gov.boardPd, 'kW', 2, REF.draftC7)
  L.input('Supply', m.three ? 'Three-phase' : 'Single-phase', REF.rule)
  const code = mainsStatus(gov.boardPd, m.three) === 'code'
  const raw = L.calc('Copper size from the table below', 'size = the step of the table that the design load falls in', `design load {kw:2} kW, ${m.three ? 'three' : 'single'}-phase`, { kw: gov.boardPd, three: m.three ? 1 : 0 },
    (v) => mainsMm2(v.kw, v.three === 1), { unit: 'mm²', dp: 1, ref: code ? 'Draft IS 4648 Table 4' : `${REF.assume}: the draft gives no size for this load or for three-phase`, expect: gov.spec.sub ? mainsMm2(gov.boardPd, false) : m.size })
  if (gov.spec.sub) L.calc('Sub-main size', `the larger of ${RULE.subMainMinMm2} mm² and the size above`, 'max({min}, {s})', { min: RULE.subMainMinMm2, s: raw }, (v) => Math.max(v.min, v.s), { unit: 'mm²', dp: 1, ref: REF.assume, expect: m.size })
  L.calc('Earth wire', 'equal to the line wire up to 16 mm², half of it above, to the next size sold', '{s} mm² line wire', { s: m.size }, (v) => earthMm2(v.s), { unit: 'mm²', dp: 1, ref: REF.draftC8, expect: earthMm2(m.size) })
  L.calc('Conduit', 'conduit for this cable set from the conduit table below', '{s} mm² cable, {ph}-phase', { s: m.size, ph: m.three ? 3 : 1, t: m.three ? 1 : 0 }, (v) => conduitFor(v.s, v.t === 1), { unit: 'mm', dp: 0, ref: REF.dar17, expect: conduitFor(m.size, m.three) })
  const supply = L.take()

  const phases: boolean[] = d.threePhase ? [false, true] : [false]
  const bandBlocks = phases.map((three) =>
    block(`mains-band-${three ? 3 : 1}`, `6.${3 + (three ? 2 : 1)} Supply cable by design load, ${three ? 'three' : 'single'}-phase`, undefined,
      table(['Design load', 'Copper (mm²)', 'Source'], stepRows(three ? MAINS_STEPS.three : MAINS_STEPS.single, 'kW', 'mm²', (hi) => (mainsStatus(hi, three) === 'code' ? 'Draft IS 4648 Table 4' : REF.assume)), {
        note: three
          ? 'The draft IS 4648 only hints at three phase (4 or 6 mm² with the load balanced to within 10%), so every three-phase size is an assumption. Your electricity board fixes the supply and the cable.'
          : `Draft IS 4648 Table 4 gives sizes up to ${DRAFT_MAINS_LIMIT_KW} kW. It leaves exactly 7 kW out of its two bands (over 5 and under 7, over 7 and under 10); the model puts 7 kW with the 6 mm² band. Above ${DRAFT_MAINS_LIMIT_KW} kW the draft asks for diversity and a size worked from the IS 732 current ratings, so the larger sizes are assumptions.`,
      })),
  )
  const conduitTable = table(['Copper (mm²)', 'Conduit, single-phase (mm)', 'Conduit, three-phase (mm)'],
    [...new Set([...CONDUIT_STEPS.single.upTo.map((x) => x[0]), ...CONDUIT_STEPS.three.upTo.map((x) => x[0])])].sort((a, b) => a - b).map((mm, i, arr) => [i === 0 ? `Up to ${mm}` : `Over ${arr[i - 1]} up to ${mm}`, d0(conduitFor(mm, false)), d0(conduitFor(mm, true))])
      .concat([[`Over ${Math.max(...CONDUIT_STEPS.single.upTo.map((x) => x[0]), ...CONDUIT_STEPS.three.upTo.map((x) => x[0]))}`, d0(CONDUIT_STEPS.single.above), d0(CONDUIT_STEPS.three.above)]]),
    { num: [1, 2], note: `${REF.dar17}, extended for the larger sizes. The conduit for the small circuits is in table 6.2.` })

  return {
    id: 's6', title: '6. Wire size for each circuit',
    intro: 'The report gives the least copper size for each kind of circuit and for the supply cable. They are taken from tables, not worked out from current, derating or voltage drop; this section shows the tables and says plainly what is not checked.',
    blocks: [
      block('wire-how', '6.1 How the size is chosen', how),
      block('wire-sizes', '6.2 Least size for each circuit', undefined, sizes),
      block('wire-supply', `6.3 Worked example: the largest supply cable (${m.run.toLowerCase()})`, supply),
      ...bandBlocks,
      block('wire-conduit', `6.${3 + phases.length + 1} Conduit for a cable set`, undefined, conduitTable),
    ],
  }
}

/* ───────────────────────────────────────────────────────────────────────────────────────────── */

export function section7(c: Ctx): CalcSection {
  const { d, L } = c
  const { std } = d

  /* outgoing breakers by rating */
  const comp: { r: number; text: string; n: number }[] = [
    { r: RULE.mcb.light, text: 'lighting and bathroom circuits', n: c.sumM((b) => b.cL + b.cBath) },
    { r: std ? RULE.mcb.sockets6 : RULE.mcb.sockets6Basic, text: '6 A socket circuits', n: c.sumM((b) => b.cS6) },
    { r: RULE.mcb.power, text: '6/16 A socket circuits', n: c.sumM((b) => b.cS16) },
    { r: RULE.mcb.power, text: 'water heater circuits', n: c.sumM((b) => b.spec.geysers) },
    { r: RULE.mcb.power, text: 'washing machine and dishwasher circuits', n: c.sumM((b) => b.spec.washers + b.spec.dish) },
    { r: RULE.mcb.power, text: 'inverter circuits', n: c.sumM((b) => b.inv) },
    { r: RULE.mcb.power, text: 'transfer pump circuits', n: d.tot.pumps },
    { r: RULE.mcb.ac, text: 'air conditioner circuits', n: c.sumM((b) => b.spec.ac) },
    { r: RULE.mcb.ev, text: 'EV charger circuits', n: d.tot.evs },
  ]
  const ratings = [...new Set(comp.filter((x) => x.n > 0).map((x) => x.r))].sort((a, b) => a - b)
  for (const r of ratings) {
    const parts = comp.filter((x) => x.r === r && x.n > 0)
    const v: Vars = {}
    parts.forEach((p, i) => { v[`n${i}`] = p.n })
    L.calc(`One-pole MCB, ${r} A`, 'breakers = the circuits that use this rating', parts.map((p, i) => `{n${i}} (${p.text})`).join(' + '), v,
      (x) => parts.reduce((s, _p, i) => s + x[`n${i}`], 0), { dp: 0, ref: REF.draftC628, expect: c.rowNum('prot', `MCB, ${r} A, one-pole, outgoing`), result: true })
  }
  const mcbLines = L.take()

  /* board sizing worked example */
  const gov = d.boards.reduce((a, b) => (b.ways > a.ways || (b.ways === a.ways && b.boardPd > a.boardPd) ? b : a), d.boards[0])
  const s = gov.spec
  L.input('Board worked here', `${s.label}${s.mult > 1 ? ` (one of ${s.mult} like it)` : ''}`, REF.rule, 'The board with the most ways.')
  const out = L.calc('Outgoing circuits', 'outgoing = lighting + bathroom + 6 A + 6/16 A + A/C + heaters + washer + dishwasher + inverter + pumps + EV',
    '{a} + {b} + {c6} + {c16} + {ac} + {g} + {w} + {di} + {iv} + {p} + {e}',
    { a: gov.cL, b: gov.cBath, c6: gov.cS6, c16: gov.cS16, ac: s.ac, g: s.geysers, w: s.washers, di: s.dish, iv: gov.inv, p: s.pumps, e: s.evs },
    (v) => v.a + v.b + v.c6 + v.c16 + v.ac + v.g + v.w + v.di + v.iv + v.p + v.e, { dp: 0, ref: REF.rule, expect: gov.outgoing })
  const need = L.calc('Ways needed', `ways needed = outgoing circuits + ${RULE.spareWays} spare way`, '{o} + {s}', { o: out, s: RULE.spareWays }, (v) => v.o + v.s, { dp: 0, ref: REF.assume })
  const list = gov.three ? TPN_WAYS : SPN_WAYS
  L.calc('Board size', `the smallest size sold with at least that many ways (${list.join(', ')}; above the list, the next multiple of 8)`, 'smallest size ≥ {n}, {ph}-phase', { n: need, t: gov.three ? 1 : 0, ph: gov.three ? 3 : 1 },
    (v) => waysFor(v.n, v.t === 1), { unit: 'ways', dp: 0, ref: REF.tender, expect: gov.ways, result: true })
  if (s.sub) {
    L.calc('Design load for this board', `the larger of ${RULE.subBoardMinKw} kW and the house design load × this board's share of the carpet area`, 'max({min}, {pd:2} × {c:2} ÷ max(1, {hc:2}))',
      { min: RULE.subBoardMinKw, pd: d.housePd, c: s.carpetM2, hc: d.houseCarpet }, (v) => Math.max(v.min, v.pd * (v.c / Math.max(1, v.hc))), { unit: 'kW', dp: 2, ref: REF.assume, expect: gov.boardPd })
  } else L.value('Design load for this board', gov.boardPd, 'kW', 2, 'Section 4')
  const inc = L.calc('Incoming breaker', 'main breaker for the design load, from the table below', 'design load {kw:2} kW, {ph}-phase', { kw: gov.boardPd, t: gov.three ? 1 : 0, ph: gov.three ? 3 : 1 },
    (v) => incomerA(v.kw, v.t === 1), { unit: 'A', dp: 0, ref: `${REF.tender}; the steps above 32 A are assumptions`, expect: gov.inc, result: true })
  L.calc('Residual current breaker (RCCB) rating', 'rating = 40 A up to a 40 A incomer, 63 A up to 63 A, else 100 A; sensitivity 30 mA', 'incomer {i} A', { i: inc }, (v) => rccbA(v.i),
    { unit: 'A', dp: 0, ref: `${REF.draftC629} (30 mA); the rating steps are ${REF.assume}`, expect: gov.rc, result: true })
  const sizing = L.take()

  const boardsTable = table(
    ['Board', 'Copies', 'Outgoing', 'Ways', 'Supply', 'Design load used (kW)', 'Incomer', 'RCCB, 30 mA'],
    d.boards.map((b) => [b.spec.label, d0(b.spec.mult), d0(b.outgoing), d0(b.ways), b.three ? PHASE_KIND.three : PHASE_KIND.single, d2(b.boardPd), `${b.inc} A, ${b.three ? '4' : '2'}-pole`, `${b.rc} A, ${b.three ? '4' : '2'}-pole`]),
    { num: [1, 2, 3, 5], note: 'A board that is not the one taking the supply is always single-phase. Each board has one RCCB and one spare way.' },
  )

  const phases: boolean[] = [...new Set(d.boards.map((b) => b.three))].sort()
  const incomerTables = phases.map((three, i) => block(`incomer-${three ? 3 : 1}`, `7.${4 + i} Incoming breaker by design load, ${three ? 'three' : 'single'}-phase`, undefined,
    table(['Design load', 'Incomer', 'Source'], stepRows(three ? INCOMER_STEPS.three : INCOMER_STEPS.single, 'kW', 'A', () => REF.tender), {
      note: `The model takes the rating from the design load alone and does not compare it with a current rating of the cable. Tender board items show 32 A double-pole incomers for homes and 63 A four-pole for three phase (a secondary source); the other steps are assumptions. RCCB rating for these incomers: ${[...new Set((three ? INCOMER_STEPS.three : INCOMER_STEPS.single).upTo.map((x) => x[1]).concat([(three ? INCOMER_STEPS.three : INCOMER_STEPS.single).above]))].map((a) => `${a} A incomer, ${rccbA(a)} A RCCB`).join('; ')}.`,
    })))

  /* counts that are in the report */
  const incomerRows = [...d.incomers.entries()].sort()
  for (const [k, n] of incomerRows) {
    const [poles, amps] = k.split('|')
    L.calc(`Incomer MCB, ${poles}-pole, ${amps} A`, 'boards with this incomer, all copies', '{n}', { n }, (v) => v.n, { dp: 0, ref: REF.rule, expect: c.rowNum('prot', `Incomer MCB, ${poles}-pole, ${amps} A`), result: true })
  }
  L.calc('RCCB, 30 mA', 'one on every board, all copies', '{n}', { n: c.sumM(() => 1) }, (v) => v.n, { dp: 0, ref: REF.draftC629, expect: c.rowNum('prot', PROT_NAMES.rccb), result: true })
  L.calc('Meter boards', 'one for each board that takes the supply, all copies', '{n}', { n: c.sumM((b) => (b.spec.main ? 1 : 0)) }, (v) => v.n, { dp: 0, ref: REF.rule, expect: c.rowNum('prot', PROT_NAMES.meter), result: true })
  const countLines = L.take()
  c.tieNum('RCCBs (one on every board)', c.rowNum('prot', PROT_NAMES.rccb), d.tot.boards, 'nos')
  c.tieNum('Meter boards', c.rowNum('prot', PROT_NAMES.meter), d.tot.meterBoards, 'nos')

  return {
    id: 's7', title: '7. Breakers, RCCBs and distribution boards',
    intro: 'One breaker for each circuit, an incoming breaker and an RCCB on every board, and a board with enough ways for its circuits and one spare. The model counts RCCBs; it does not count a separate ELCB.',
    blocks: [
      block('mcb', '7.1 Outgoing breakers by rating', mcbLines),
      block('db-ex', `7.2 Worked example: sizing ${s.label.toLowerCase()}`, sizing),
      block('db-all', '7.3 Every board', undefined, boardsTable),
      ...incomerTables,
      block('db-counts', `7.${4 + phases.length} Incomers, RCCBs and meter boards to buy`, countLines),
    ],
  }
}

/* ───────────────────────────────────────────────────────────────────────────────────────────── */

export function section8(c: Ctx): CalcSection {
  const { d, L } = c
  const gov = d.boards.reduce((a, b) => (b.mains.each * b.mains.n > a.mains.each * a.mains.n ? b : a), d.boards[0])
  const m = gov.mains
  const s = gov.spec
  L.input('Run worked here', m.run, REF.rule, 'The run with the most cable.')
  if (d.flats) {
    L.calc('Length of one run', `length = ${s.common ? 'run to the common board' : 'run from the meter room'} + floor × floor height`, '{base} + {fl} × {h}', { base: s.common ? RULE.mainsCommonM : RULE.mainsFlatM, fl: s.floor, h: d.H },
      (v) => v.base + v.fl * v.h, { unit: 'm', dp: 1, ref: `${REF.assume}: meter-room runs of ${RULE.mainsFlatM} m (flats) and ${RULE.mainsCommonM} m (common board) on the ground floor, plus the height of the floors climbed`, expect: m.each })
  } else if (s.main) {
    L.value('Length of the main run', RULE.mainsHouseM, 'm', 1, `${REF.assume}: meter to the main board`)
  } else {
    L.calc('Length of one run', 'length = floor × floor height + extra for the board and the bends', '{fl} × {h} + {x}', { fl: s.floor, h: d.H, x: RULE.subMainExtraM }, (v) => v.fl * v.h + v.x, { unit: 'm', dp: 1, ref: REF.assume, expect: m.each })
  }
  L.value('Runs of this kind (copies)', m.n, '', 0, REF.rule)
  const colours = (m.three ? MAINS_COLOURS.three : MAINS_COLOURS.single).length
  L.calc('Wire of each line colour', `length of wire = run length × runs × ${RUN} (the wire is a little longer than its route)`, '{l:1} × {n} × {r}', { l: m.each, n: m.n, r: RUN },
    (v) => v.l * v.n * v.r, { unit: 'm', dp: 1, ref: `${REF.dar11}: ${RUN} m of conductor for each metre of route`, expect: c.wireOf(s.label, SRC.mains, m.size, COLOUR.live) })
  L.calc('Earth wire', 'same length, in the earth size for this cable', '{l:1} × {n} × {r}', { l: m.each, n: m.n, r: RUN }, (v) => v.l * v.n * v.r, { unit: 'm', dp: 1, ref: REF.draftC8, expect: c.wireOf(s.label, SRC.mains, earthMm2(m.size), COLOUR.earth) })
  L.say('Colours', `${colours} line ${pl(colours, 'colour', 'colours')} plus the green earth: ${(m.three ? MAINS_COLOURS.three : MAINS_COLOURS.single).join(', ').toLowerCase()}.`, REF.gs35)
  const ex = L.take()

  const tbl = table(
    ['Run', 'Cable', 'Copies', 'Each (m)', 'Conduit', 'All copies (m)'],
    d.boards.map((b) => [b.mains.run, `${b.mains.three ? '4' : '2'} × ${b.mains.size} mm² + ${earthMm2(b.mains.size)} mm² earth`, d0(b.mains.n), d1(b.mains.each), `${conduitFor(b.mains.size, b.mains.three)} mm`, d1(b.mains.each * b.mains.n)]),
    { num: [2, 3, 5], foot: ['All runs', '', '', '', '', d1(d.boards.reduce((x, b) => x + b.mains.each * b.mains.n, 0))], note: `Cable size by design load: section 6. Lengths are the tool's own assumptions: they are not measured from a drawing.` },
  )

  return {
    id: 's8', title: '8. Mains, rising mains and sub-mains',
    intro: 'The cable from the meter to each board. Its size comes from the design load of the board (section 6), its length from the number of floors climbed.',
    blocks: [
      block('mains-ex', `8.1 Worked example: ${m.run.toLowerCase()}`, ex),
      block('mains-all', '8.2 Every run', undefined, tbl),
    ],
  }
}

