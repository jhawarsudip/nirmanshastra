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
import { d0, makeCtx } from './calc-ctx'
import { section1, section2, section3, section4 } from './calc-part1'
import { incomerAndCable, section5, section6, section7, section8 } from './calc-part2'
import { section9, section10, section11, section12 } from './calc-part3'
import { compareTable, sheetTables } from './calc-rows'
import type { ElecInput } from './model'
import { CARPET_SHARE, COIL_M, DESIGN, RULE, RUN, WASTE } from './rules'
import { DRAFT_MAINS_LIMIT_KW } from './wire'

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

  /* figures the limits quote, from the same working as the sections */
  const maxOutgoing = Math.max(...d.boards.map((b) => b.outgoing))
  const withinDraft = incomerAndCable(false).filter((r) => r.hi !== null && r.hi <= DRAFT_MAINS_LIMIT_KW)
  const cableEx = withinDraft[withinDraft.length - 1]
  const wireCounted = d.wireRunTotal
  const wireBought = d.wireBuyTotal
  const extraPct = Math.round((wireBought / wireCounted - 1) * 100)

  const limits = [
    'This counts a wiring job. It does not design it. No cable current rating, derating for grouping or temperature, voltage drop, fault level, conduit fill or discrimination between breakers is worked. Wire sizes are the least sizes for each kind of circuit from a table; IS 732:2019 sizes a cable by its current rating, its grouping and its voltage drop, so a long run, a hot place or a heavy load can need a larger size than shown.',
    `The mains cable is sized from the design load, not the connected load. Draft IS 4648 Table 4 gives the mains and sub-mains for the total connected load, up to ${DRAFT_MAINS_LIMIT_KW} kW. The tool applies the steps of that table to the design load, which is smaller because of its own allowance for diversity (section 4); that is the tool's choice. For a connected load of ${DRAFT_MAINS_LIMIT_KW} kW or more the draft asks for a diversity factor, the current worked out, a size taken from the current ratings of IS 732:2019 (Annex T, with derating factors) and one size higher. The tool does not read those tables, so a mains size above the draft's table is an assumption to be confirmed by an electrician or the electricity board.`,
    `The incoming breaker is chosen from the design load alone. It is not compared with the design current or with the current rating of the cable it feeds.${cableEx ? ` For example, for a design load over ${cableEx.lo} up to ${cableEx.hi} kW (single-phase) the tables give a ${cableEx.inc} A incomer and a ${cableEx.mm2} mm² mains cable, and whether that cable can carry ${cableEx.inc} A is not checked.` : ''} Section 7 prints the design current at a stated 230 V (415 V three-phase) and a power factor of 0.9, for information only; the tool uses neither.`,
    `Draft IS 4648 cl 6.2.9 also asks for a residual current device of up to 300 mA at the point of supply. It is not counted. One 30 mA residual current breaker (RCCB) is counted for each board and serves every circuit on it (up to ${d0(maxOutgoing)} on the largest board here), so a fault on any one circuit trips them all; splitting the circuits between RCCBs is not counted. No earth leakage breaker (ELCB) is counted.`,
    'Breakers are counted by rating only. Their class and short-circuit rating are not stated: the draft (cl 6.2.8) asks for B-class breakers of not more than 6 A on lighting circuits and B or C on power circuits, depending on the load, and a short-circuit rating in kA is not given. The tool does not check any breaker against the fault level.',
    `Room sizes are not asked. They are shared out of ${Math.round(CARPET_SHARE * 100)}% of the built-up area by weights that are the tool's own, and floor area beyond the largest size of a room is taken to be rooms you did not list, which are not counted. The count of points is sensitive to these sizes.${std ? ` Lights, fans and sockets rise in proportion to the area of a room, one step for each ${RULE.unitM2} m², and are not rounded up to whole blocks. The draft's tables say "per 10-12 m² or part": ${RULE.unitM2} m² and the proportional count are the tool's choice, and read strictly, "or part" would give a room just over ${RULE.unitM2} m² twice the points (section 3.3 shows the difference).` : ''}`,
    'Each tool of the NirmanShastra suite lays out the same house by its own rule. The rooms and room sizes used here are for counting points and will not match the rooms and sizes in the other tools\' reports, InteriorPro for one: a living room or a bathroom can be a good deal larger or smaller here than there for the same house. The common areas (stair, terrace, gate and parking points) are fixed counts of the tool, and a terrace and stair-room point is added to the ground floor of every house, even one with a single floor.',
    std
      ? 'At the Standard level the points in each room follow the BIS draft of IS 4648 (first revision, ETD 20, September 2024), which is not a published standard, and a few columns of its tables were read by position. The published IS 4648:1968 asks for far fewer sockets; choose Basic for that level. The Standard level also adds a dishwasher outlet and circuit to each home that has a washing machine point, although a dishwasher is not one of the questions; the draft\'s Table 6 gives it 1.5 kW, under the 2 kW at which its cl 6.2.2 asks for a circuit of its own.'
      : 'At the Basic level the sockets follow the schedule of IS 4648:1968 and the lights and fans are chosen to match an 85 m² home with about 12 lights and 5 fans (the NIMI electrician text, a yardstick and not a standard). The 1968 standard is old, and homes now have many more sockets.',
    `The length of the wire from a board to its first point, from the meter to a board, and from a point to a socket are the tool's own assumptions. They are not measured from a drawing, and a different layout changes the wire and conduit by a good deal. The allowance in each point and the ${RUN} m of conductor for each metre of route come from the CPWD analysis of rates; where one group ends and the other starts (${sq(RULE.groupAFromSqft)} and ${sq(RULE.groupBFromSqft)} sq ft) is an assumption.`,
    `Wire up to ${RULE.coilMaxMm2} mm² is bought in whole coils of ${COIL_M} m for each size and colour, and larger sizes by the metre, so the wire to buy is more than the wire counted: here ${sq(wireBought)} m is bought against ${sq(Math.round(wireCounted))} m counted (${extraPct}% more), of which 5% is waste and the rest is rounding up. The ${COIL_M} m coil is the tool's choice of pack; a shop may sell part coils or cut lengths, which would lower the quantity to buy.`,
    `The sources disagree on how many 6 A sockets share a circuit (CPWD GS 3.10 allows three). The model allows ${RULE.s6PerCkt}, so the circuit and breaker counts are the least certain part of the report. Circuits are filled by the number of points, not by watts: the draft's load limits on a circuit (1,000 W on lighting, 3,000 W on a power circuit) are not checked.`,
    'The design load is the tool\'s own: the larger of an area minimum from the draft IS 4648 and a share of the large appliances. No standard read gives a diversity factor for homes. Your electricity board fixes the sanctioned load and decides single-phase or three-phase, and the incoming breaker and cable follow from that.',
    'Earthing is counted, not designed: the number of electrodes is an assumption and the earth resistance is neither calculated nor assumed. It must be measured after installation, and more electrodes added if it is too high (IS 3043 is the code for earthing; it was not read in full).',
    ...(d.flats && d.N >= 7 ? ['Above six floors, separate risers and a fire-rated rising main may be needed (NBC Part 4). The report counts one rising main for each flat and does not design the risers.'] : []),
    'A clause number given here for a standard is a pointer to check, not a quotation. The clauses and tables of the BIS draft of IS 4648 named here (cl 6.2.1, 6.2.2, 6.2.8, 6.2.9, 7.2 and 8, and Tables 2 to 6) were re-read against the draft text. The clause numbers given for IS 4648:1968, IS 3043, CPWD GS and CPWD DAR items, and NBC Part 4 are as given in the tool\'s research notes and were not re-read against the published text.',
    'Lifts, generators, solar panels, battery banks, intercoms, CCTV, home automation, light fittings, fans and appliances themselves, the meter, lightning protection and surge protection are not counted. The ranges beside the totals are the tool\'s judgement, not a statistic.',
  ]

  const notReread = 'Clause numbers as given in the tool\'s research notes; not re-read against the published text.'
  const references: CalcReference[] = [
    { code: 'BIS draft of IS 4648 (first revision), ETD 20, September 2024', title: 'Guide for electrical layout in residential buildings', usedFor: 'Room-wise points (Tables 2 and 3), circuit limits (cl 6.2.1 and 6.2.2), breaker ratings (cl 6.2.8), the 30 mA residual current device (cl 6.2.9), wire sizes (Table 4), loads (Tables 5 and 6), design load (cl 7) and the earth conductor (cl 8). These were re-read against the draft text. It is not yet published; some columns were read by position.' },
    { code: 'IS 4648:1968', title: 'Guide for electrical layout in residential buildings', usedFor: `The Basic level: the socket schedule (cl 9.8) and the limit on points on a lighting circuit (cl 7.2). ${notReread}` },
    { code: 'IS 732:2019', title: 'Code of practice for electrical wiring installations', usedFor: 'Named by the BIS draft (its Annex C lists IS 732:2019) as the code for the current ratings of cables (its Annex T, in the note under Table 4), for the type of residual current device (its cl 6.2.9 points to cl 4.2 of IS 732:2019) and for surge protection (its cl 6.2.10 points to cl 5.3.5). The tool applies none of its rules, and no line of this sheet is worked from it. The text of IS 732:2019 was not read: the clause and annex numbers are the draft\'s and have not been checked against the standard.' },
    { code: 'IS 3043:2018', title: 'Code of practice for earthing', usedFor: `Named as the code for earthing. Not read in full: the number of electrodes is an assumption. ${notReread}` },
    { code: 'CPWD General Specifications for Electrical Works Part I (Internal), 2013', title: 'Sections 2 and 3', usedFor: `What a point is (GS 3.4), the load of a 16 A socket (GS 3.9), circuits (GS 3.10) and wire sizes (GS 3.12). Where CPWD is stricter than the draft IS 4648 (GS 3.12(ii) asks for 4 mm² on power wiring; GS 3.10(i) allows 10 points or 800 W on a lighting circuit), the tool follows the draft. ${notReread}` },
    { code: 'CPWD Delhi Analysis of Rates for Electrical Works (E&M), 2016', title: 'Items 1.1 to 1.17', usedFor: `Wire, conduit, couplers and saddles in a point (items 1.1 and 1.7), fittings per metre of conduit (items 1.5 and 1.7), and the conductor allowed for each metre of route. ${notReread}` },
    ...(d.flats && d.N >= 7 ? [{ code: 'National Building Code of India, Part 4', title: 'Fire and life safety', usedFor: `Named for risers and the rising main in tall buildings. ${notReread}` }] : []),
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
