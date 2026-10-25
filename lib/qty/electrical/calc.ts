/*
  ElectricalPro: the calculation sheet at the end of the paid report.

  Every figure in the report is rebuilt here from the answers, step by step, with the model's own tables and rules
  (./rules, ./wire), through the Ledger, which carries out each sum itself. The totals are then compared with the report:
  every tile, every table cell, every purchase line, every range. If anything disagrees, console.error lists it and no
  sheet is returned, so a report is never printed with working that does not agree with its quantities.

  The sheet is built in two layers that do not share arithmetic: the engine (model.ts), which made the report, and
  derive.ts, which re-works the same steps from the answers and keeps the intermediate figures the report does not print.
  The sections (calc-part1/2/3.ts) print derive.ts's working through the Ledger and check it against the report.

  What the model does not do is said on the sheet and not worked around: it does not size a cable by its current rating,
  its grouping or the voltage drop, and it does not design the earthing.

  Layout: calc-ctx.ts (shared helpers and reference strings), calc-rows.ts (the report's tables rebuilt for comparison),
  derive.ts (the re-working), calc-part1.ts (sections 1 to 4), calc-part2.ts (5 to 8), calc-part3.ts (9 to 12).
*/

import { sheetIsSound } from '@/lib/calcsheet'
import type { CalcReference, CalcSheet } from '@/lib/calcsheet'
import type { TradeResult } from '../types'
import { makeCtx } from './calc-ctx'
import { section1, section2, section3, section4 } from './calc-part1'
import { section5, section6, section7, section8 } from './calc-part2'
import { section9, section10, section11, section12 } from './calc-part3'
import { compareTable, sheetTables } from './calc-rows'
import type { ElecInput } from './model'
import { CARPET_SHARE, COIL_M, DESIGN, RULE, RUN, WASTE } from './rules'

export function buildElectricalCalc(inp: ElecInput, report: TradeResult): CalcSheet | null {
  try {
    return build(inp, report)
  } catch (e) {
    console.error('[ElectricalPro calc] the calculation sheet could not be built:', e instanceof Error ? e.stack ?? e.message : e)
    return null
  }
}

const pct = (v: number) => Math.round((v - 1) * 100)
const sq = (v: number) => v.toLocaleString('en-IN')

function build(inp: ElecInput, report: TradeResult): CalcSheet | null {
  const c = makeCtx(inp, report)
  const { d } = c

  const sections = [
    section1(c), section2(c), section3(c), section4(c),
    section5(c), section6(c), section7(c), section8(c),
    section9(c), section10(c), section11(c), section12(c),
  ]

  /* every table of the report, cell by cell as printed */
  const mine = sheetTables(d)
  const ids = new Set(mine.map((t) => t.id))
  for (const t of report.paid.tables) if (!ids.has(t.id)) c.bad.push(`the report has a table "${t.id}" that the sheet does not rebuild`)
  if (report.paid.tables.length !== mine.length) c.bad.push(`tables: report has ${report.paid.tables.length}, sheet ${mine.length}`)
  for (const t of mine) {
    const rep = c.reportTable(t.id)
    const diffs = compareTable(rep, t)
    c.ties.push({
      item: `Table "${rep?.title ?? t.id}": every row${t.foot ? ' and the foot' : ''}`,
      report: rep ? `${rep.rows.length} ${rep.rows.length === 1 ? 'row' : 'rows'}` : 'missing',
      sheet: `${t.rows.length} ${t.rows.length === 1 ? 'row' : 'rows'}`,
      ok: diffs.length === 0,
    })
    for (const m of diffs) c.bad.push(m)
  }

  /* the four totals at the top of the report are the four the sections tie */
  const tileNames = report.paid.tiles.map((t) => t.k).join('|')
  if (tileNames !== 'Points and sockets|Copper wire|Conduit|Circuits') c.bad.push(`tiles: the report has "${tileNames}"`)
  c.tieText('Wiring level shown in the report', c.fact('Wiring level')?.v ?? '', d.std ? 'Standard' : 'Basic')

  const std = d.std
  const homes = d.homes
  const purpose = `This sheet shows how each quantity in your ElectricalPro report is worked out from your answers: the lights, fans and sockets in each room, the circuits and breakers they need, the boards, the wire and conduit to buy, and the earthing. It is written so that an electrician, a contractor or a bank's engineer can check the counting without the tool. It counts a wiring job for ${homes} ${homes === 1 ? 'home' : 'homes'}; it does not design one.`

  const method = [
    'Your answers give the number of floors, homes, bedrooms, bathrooms and kitchens and the large appliances. From them the model decides how many distribution boards there are and what each one serves: one for each home in flats, plus a common board; one on each floor in a house (sections 1 and 2).',
    `Room sizes are not asked. The carpet area of a board (${Math.round(CARPET_SHARE * 100)}% of its built-up area) is shared among its rooms in proportion to a weight for each kind of room, held between a smallest and a largest size. Each room gets its lights, fans and sockets for its size from ${std ? 'the room-wise tables of the BIS draft of IS 4648' : 'the socket schedule of IS 4648:1968'}, and the common areas are added (section 3).`,
    `Connected load is the watts of every point and large appliance added up. The design load is the larger of ${DESIGN.wPerM2Carpet * 1000} W for each m² of carpet area and ${DESIGN.applianceShare} × the large appliances + ${DESIGN.baseKw} kW. The supply is single-phase up to ${RULE.threePhaseAboveKw} kW and three-phase above it, unless you chose (section 4).`,
    `Points are grouped into circuits with fixed limits: ${std ? `up to ${RULE.ptsPerLightCkt} points on a lighting circuit, bathrooms on circuits of their own, up to ${RULE.s6PerCkt} six-amp sockets and up to ${RULE.s16PerCkt} sixteen-amp outlets on a socket circuit` : `up to ${RULE.ptsPerLightCktBasic} points, with the 5 A sockets, on a lighting circuit and up to ${RULE.s16PerCkt} sixteen-amp outlets on a socket circuit`}, and one circuit for each air conditioner, water heater, washing machine, dishwasher, pump, charger and inverter (section 5).`,
    'Each circuit gets the least copper size for its kind, taken from a table. The model does not work out the current a cable can carry, derate it for grouping or temperature, or calculate the voltage drop, and the sheet says so rather than show a calculation that was not done (section 6).',
    'Breakers follow the circuits. Each board gets an incoming breaker chosen from its design load, a 30 mA residual current breaker (RCCB), and a size with one spare way (section 7). The cable from the meter to each board is sized from the design load of that board, and its length comes from the floors it climbs (section 8).',
    `Wire and conduit are counted from the points, using the CPWD analysis-of-rates allowance for each point (in two groups that depend on the size of the home), and from the routes of the circuits, using route lengths that are the tool's own. Each metre of route takes ${RUN} m of conductor, ${pct(WASTE)}% is added for waste, and the result is rounded up to whole coils of ${COIL_M} m (wire up to ${RULE.coilMaxMm2} mm²), to the next ${RULE.byMetreStepM} m (larger wire) and to whole ${RULE.conduitPieceM} m lengths (conduit) (section 9).`,
    'Earthing is counted as electrodes, earth strip and pit covers. The number of electrodes is an assumption and the earth resistance is not worked out (section 10).',
    'Switches, sockets, boxes and conduit fittings are counted from the points and from the lengths of conduit, and every line of the buy list is rebuilt (section 11).',
    'The range printed beside each total is the total multiplied by a low and a high factor of the tool\'s own (section 12).',
    'Every total, table and buy-list line printed here is compared with the same figure in the report. If any one disagrees, this sheet is left out of the report. In the working, up(x) means x rounded up to the next whole number, down(x) means rounded down, and Σ means add up. Figures are carried at full precision and shown rounded, so re-keying the printed numbers can differ in the last digit.',
  ]

  const limits = [
    'This counts a wiring job. It does not design it. No cable current rating, derating for grouping or temperature, voltage drop, fault level, conduit fill or discrimination between breakers is worked. Wire sizes are the least sizes for each kind of circuit from a table; IS 732 sizes a cable by its current rating, its grouping and its voltage drop, so a long run, a hot place or a heavy load can need a larger size than shown.',
    `Room sizes are not asked. They are shared out of ${Math.round(CARPET_SHARE * 100)}% of the built-up area by weights that are the tool's own, and floor area beyond the largest size of a room is taken to be rooms you did not list, which are not counted. The count of points is sensitive to these sizes.`,
    std
      ? 'At the Standard level the points in each room follow the BIS draft of IS 4648 (first revision, ETD 20, September 2024), which is not a published standard, and a few columns of its tables were read by position. The published IS 4648:1968 asks for far fewer sockets; choose Basic for that level.'
      : 'At the Basic level the sockets follow the schedule of IS 4648:1968 and the lights and fans are chosen to match an 85 m² home with about 12 lights and 5 fans (the NIMI electrician text, a yardstick and not a standard). The 1968 standard is old, and homes now have many more sockets.',
    `The length of the wire from a board to its first point, from the meter to a board, and from a point to a socket are the tool's own assumptions. They are not measured from a drawing, and a different layout changes the wire and conduit by a good deal. The allowance in each point and the ${RUN} m of conductor for each metre of route come from the CPWD analysis of rates; where one group ends and the other starts (${sq(RULE.groupAFromSqft)} and ${sq(RULE.groupBFromSqft)} sq ft) is an assumption.`,
    `The sources disagree on how many 6 A sockets share a circuit (CPWD GS 3.10 allows three). The model allows ${RULE.s6PerCkt}, so the circuit and breaker counts are the least certain part of the report.`,
    'The design load is the tool\'s own: the larger of an area minimum from the draft IS 4648 and a share of the large appliances. No standard read gives a diversity factor for homes. Your electricity board fixes the sanctioned load and decides single-phase or three-phase, and the incoming breaker and cable follow from that.',
    'The incoming breaker is chosen from the design load alone and is not compared with a current rating of the cable. Only a residual current breaker (RCCB, 30 mA) is counted for shock protection; no earth leakage breaker (ELCB) is counted.',
    'Earthing is counted, not designed: the number of electrodes is an assumption and the earth resistance is neither calculated nor assumed. It must be measured after installation, and more electrodes added if it is too high (IS 3043 is the code for earthing; it was not read in full).',
    ...(d.flats && d.N >= 7 ? ['Above six floors, separate risers and a fire-rated rising main may be needed (NBC Part 4). The report counts one rising main for each flat and does not design the risers.'] : []),
    'Lifts, generators, solar panels, battery banks, intercoms, CCTV, home automation, light fittings, fans and appliances themselves, the meter, lightning protection and surge protection are not counted. The ranges beside the totals are the tool\'s judgement, not a statistic.',
  ]

  const references: CalcReference[] = [
    { code: 'BIS draft of IS 4648 (first revision), ETD 20, September 2024', title: 'Guide for electrical layout in residential buildings', usedFor: 'Room-wise points, circuit limits, breaker ratings, wire sizes, design load and the earth conductor. Not yet published; some columns were read by position.' },
    { code: 'IS 4648:1968', title: 'Guide for electrical layout in residential buildings', usedFor: 'The Basic level: the socket schedule and the limit on points on a lighting circuit.' },
    { code: 'IS 732:1989', title: 'Code of practice for electrical wiring installations', usedFor: 'The 30 mA residual current breaker (the clause the model cites). Its rules for sizing a cable by current, grouping and voltage drop are not applied by the model.' },
    { code: 'IS 3043:2018', title: 'Code of practice for earthing', usedFor: 'Named as the code for earthing. Not read in full: the number of electrodes is an assumption.' },
    { code: 'CPWD General Specifications for Electrical Works Part I (Internal), 2013', title: 'Sections 2 and 3', usedFor: 'What a point is (GS 3.4), the load of a 16 A socket (GS 3.9), circuits (GS 3.10) and wire sizes (GS 3.12).' },
    { code: 'CPWD Delhi Analysis of Rates for Electrical Works (E&M), 2016', title: 'Items 1.1 to 1.17', usedFor: 'Wire, conduit, couplers and saddles in a point (items 1.1 and 1.7), fittings per metre of conduit (items 1.5 and 1.7), and the conductor allowed for each metre of route.' },
    { code: 'NIMI Electrician trade theory', title: 'Wiring of a dwelling', usedFor: 'The area yardstick for lights and fans at the Basic level (Table 1). A yardstick, not a standard.' },
    { code: 'Tender distribution-board schedules', title: 'A secondary source, not a standard', usedFor: 'The ratings of the incoming breakers for homes and for three-phase supply.' },
  ]

  const sheet: CalcSheet = { tool: 'ElectricalPro', model: 'trade-v1', purpose, method, limits, sections, tie: c.ties, references }
  if (!sheetIsSound(sheet, c.bad)) {
    const failed = sheet.tie.filter((t) => !t.ok).map((t) => `tie ${t.item}: report ${t.report} vs sheet ${t.sheet}`)
    console.error(`[ElectricalPro calc] the sheet does not agree with the report, so it is left out:\n${[...new Set([...c.bad, ...failed])].join('\n')}`)
    return null
  }
  return sheet
}
