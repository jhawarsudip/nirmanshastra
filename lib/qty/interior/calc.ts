/*
  InteriorPro calculation sheet: the last pages of the paid PDF.

  Every figure in the report is worked out again here from the same answers, step by step, through the Ledger (so the working
  printed and the result printed cannot disagree), using the engine's own constants and helpers. Each step is checked against the
  figure the engine produced (interiorWork), and every tile, table figure and buy-list line of the report is compared with the
  sheet's. If anything disagrees the function logs what and returns null, and the report is printed without a sheet.

  The sheet is in parts, in the order the engine works:
    calc-plan.ts   answers, room plan, openings        calc-surf.ts   surfaces (IS 1200)
    calc-tiles.ts  tiles, skirting, fixing, grout, wet areas, stone
    calc-paint.ts  putty, primer, paint; false ceiling   calc-fit.ts   doors, windows, hardware, carpentry
    calc-buy.ts    buy list, checks quoted, ranges and bands
*/

import { sheetIsSound, type CalcReference, type CalcSection, type CalcSheet } from '@/lib/calcsheet'
import type { TradeResult } from '../types'
import { PAINT_WASTE } from './finish'
import { DOOR, hingesFor, interiorWork, type InteriorInput } from './model'
import { makeCtx } from './calc-kit'
import { answersAndPlan } from './calc-plan'
import { surfaces } from './calc-surf'
import { tiles } from './calc-tiles'
import { falseCeiling, paint } from './calc-paint'
import { carpentry, doorsAndWindows } from './calc-fit'
import { bands, buyList, checks } from './calc-buy'

const PURPOSE =
  'This sheet shows how InteriorPro turned your answers into the paint, putty, tile, ceiling, door, window and plywood quantities in the report. Each step is written out: the rule, the numbers put in, the result and where the rule comes from, so that a contractor, an architect or a bank\'s engineer can check the arithmetic. It checks quantities for planning and ordering. It is not a drawing, a bill of quantities or a design.'

function methodFor(hasFc: boolean, hasCarp: boolean): string[] {
  return [
    'Your answers are read and the clear height of a room is found: the floor to floor height less the slab (section [[s1]]).',
    'Each floor is shared out among its rooms in proportion to a weight for each kind of room, and the length of wall round each room follows from its shape. This room plan is an assumption and is the same one MasonryPro uses (section [[s2]]).',
    'Doors, windows, ventilators and balcony doors are counted from the rooms by fixed rules (section [[s3]]).',
    'The surfaces are measured following the rules of IS 1200 as the tool reads them (editions named in the references; the 2024 revisions have not been checked): walls at clear height with openings taken out by the 0.5 m² and 3 m² rules, ceilings, the outside from the plinth to the parapet, and doors on both faces (section [[s4]]).',
    'Tiles are found use by use: net area, an allowance for breakage, pieces from the size of the tile plus its joint, then boxes. Skirting, the mortar bed or the adhesive, and the grout follow (section [[s5]]).',
    'Bathroom waterproofing, door thresholds and the kitchen counter are measured from the same rooms (section [[s6]]).',
    'Putty, primer and paint are each the area to be painted times a spread from a maker or from the CPWD analysis of rates, times the wastage (section [[s7]]).',
    hasFc
      ? 'The false ceiling is the area of the rooms chosen times the counts for each m² of a public CPWD-pattern specification (section [[s8]]).'
      : 'No false ceiling was chosen, so none is counted.',
    hasCarp
      ? 'Door shutters, frames, glass, window sections and hardware follow from the counts (section [[s9]]). Wardrobes and kitchen units are worked from the geometry of a box into plywood and laminate sheets (section [[s10]]).'
      : 'Door shutters, frames, glass, window sections and hardware follow from the counts (section [[s9]]). No wardrobes or kitchen units were chosen, so no plywood or laminate is counted.',
    'Every figure is rounded up to something that can be bought (section [[s11]]). The room and window sizes quoted in the report are shown (section [[s12]]), and the likely range of each total is applied (section [[s13]]).',
    'Every total, table figure and buy-list line of the report is rebuilt here and compared with the report\'s own in the reconciliation. Had one differed, this sheet would have been left out of the report.',
  ]
}

function limitsFor(): string[] {
  const hMain = hingesFor(DOOR.main.w)
  const aRoom = DOOR.room.w * DOOR.room.h
  return [
  'The rooms are not measured. Their sizes come from a room plan that shares each floor out by fixed weights, so the wall, floor and ceiling areas, and the number of doors and windows, will differ from your drawings. The ranges in section [[s13]] say how far.',
  'Each NirmanShastra tool lays out the same house by its own rule, so the area of a room in this report can differ noticeably from the same room in another NirmanShastra report. Only MasonryPro uses the same room plan as this report.',
  'The surfaces follow the rules of IS 1200 Part 11 (1977 edition) and Part 13 (1994 edition) as the tool reads them. BIS lists 2024 revisions of Parts 11 and 13, and the tool has not been checked against them. No clause number of IS 1200 is quoted here. One difference is already suspected: a summary of the BIS draft of the 2024 revision of Part 13 suggests that, where the two faces of a wall have different finishes, an opening between 0.5 and 3 m² is taken out first from the face with the narrower reveal and is halved only where the reveals are equal. This tool halves it for every window and outer door. The total area taken out is the same either way; only the split between inside and outside paint would move. This has not been checked against the full text.',
  'The spreads of paint, putty, adhesive and grout, the tile boxes and the counts for a false ceiling come from makers\' data sheets, the CPWD Delhi Analysis of Rates 2016 and a public tender specification. They are not Indian Standards, they differ from brand to brand and from site to site, and none was tested on a site.',
  `The allowances for wastage are assumptions: paint ${Math.round((PAINT_WASTE - 1) * 100)}%, tiles 5% to 15%, grout 10%, gypsum board 8%, plywood and laminate 12%, granite 10%, glass 5%. No standard or maker gives them. Frame timber has no allowance for converting rough timber (sawing, planing and waste).`,
  'Door and window sizes, counts and frame sections are typical values. The frame section could not be checked against IS 4021.',
  `The shutter area of a door is taken as the area of the whole opening. For ${DOOR.room.des} the shutter of IS 1003 (Part 1) Table 3 is 1.60 m² and the opening is ${aRoom.toFixed(2)} m², so the area used is about ${Math.round((aRoom / 1.6 - 1) * 100)}% more than the shutter, and the door paint in section [[s7]] is worked on that larger area. Hinges are counted from the width of the opening (three up to 0.9 m, four above), but IS 1003 (Part 1) cl. 8.2 speaks of the width of the shutter: a 900 mm shutter takes three hinges, and the main door (${DOOR.main.w.toFixed(2)} m opening, ${DOOR.main.des}) is given ${hMain} here, one more than the standard would give.`,
  'Nothing is designed here. Waterproofing is counted by area only (IS 3067 covers basements and roofs, so the coverage is left to the product\'s data sheet). The screed under tile adhesive, stairs, plaster, polishing and the terrace finish are not counted.',
  'The kitchen and bathroom size checks and the window size check quoted in the report are NBC 2016 figures as summarised in secondary sources. The Part and clause numbers were not read in the code, and no clause number is given. They are advisory and change no quantity.',
  'A clause or item number given here for IS 4021, IS 3067, IS 303 or a CPWD analysis-of-rates item is a pointer to check, not a quotation. Such numbers are as given in the tool\'s research notes and were not re-read against the published text. The clause numbers of IS 1003 (Part 1) Table 3 and cl. 8.2 were read.',
  'Hardware is one set to a door; glazed balcony doors are given none. Drawers, channels, cabinet locks, grills and nets are not counted.',
  'The sheet is quantities only: no rates, no labour, no cost. The state and city do not change any quantity. Figures are carried at full precision and shown rounded, so re-keying the printed numbers can differ in the last digit.',
  ]
}

const CLAUSE_NOTE = 'clause numbers as given in the tool\'s research notes; not re-read against the published text'

const REFERENCES: CalcReference[] = [
  { code: 'IS 1200 (Part 11):1977', title: 'Method of measurement of building and civil engineering works: Paving, floor finishes, dado and skirting', usedFor: 'Floors measured before the skirting and dado go on; skirting in running metres; dado in square metres. The tool follows the rules of this edition as it reads them. BIS lists a 2024 revision of Part 11, which replaces the 2013 edition, and the tool has NOT been checked against it. No clause number is quoted.' },
  { code: 'IS 1200 (Part 13):1994', title: 'Method of measurement of building and civil engineering works: White washing, colour washing, distempering and painting of building surfaces', usedFor: 'Rules for the deduction of openings: up to 0.5 m² not taken out; from 0.5 to 3 m² one face is taken out, or half from each face when the finish differs. The tool follows the rules of this edition as it reads them. BIS lists a 2024 revision of Part 13 (it replaces the 1994 edition), and the tool has NOT been checked against it. No clause number is quoted.' },
  { code: 'IS 2395 (Part 1):1994', title: 'Code of practice for painting concrete, masonry and plaster surfaces: Operations and workmanship', usedFor: 'Cement paint in two coats, set beside the CPWD coefficient. It gives no number of coats for emulsion or distemper, which follow the makers.' },
  { code: 'IS 1003 (Part 1):2003', title: 'Timber panelled and glazed shutters: Door shutters', usedFor: 'Door designations (Table 3) and the hinges to a shutter (cl. 8.2). The tool applies the hinge rule to the width of the opening, not of the shutter, and takes the shutter area as the opening area (see the limits).' },
  { code: 'IS 303:2024', title: 'Plywood for general purposes: Specification', usedFor: `The plywood sheet of 2440 × 1220 mm. The clause number printed with it is one of the ${CLAUSE_NOTE}.` },
  { code: 'IS 4021', title: 'Timber door, window and ventilator frames: Specification', usedFor: `Named only because it fixes frame sections. It was not read, the 100 × 65 mm section is an assumption, and no clause is quoted (${CLAUSE_NOTE}).` },
  { code: 'IS 3067:1988', title: 'Code of practice for general design details and preparatory work for damp-proofing and waterproofing of buildings', usedFor: `Named for the waterproofing area only. Nothing is counted from it. What it covers is as given in the tool's research notes and was not re-read against the published text.` },
  { code: 'CPWD Delhi Analysis of Rates 2016', title: 'Volume 2, sub-head 13 (finishing) and Volume 1 materials', usedFor: `Paint, primer and exterior finish coefficients; the cement and sand in a tile bed. The item numbers printed (13.42, 13.48.2, 13.50.1) are ${CLAUSE_NOTE}.` },
  { code: 'Makers\' data sheets', title: 'Paint, putty, adhesive, grout and tile makers', usedFor: 'Inside paint, putty, primer and adhesive spreads; tile boxes.' },
  { code: 'NBC 2016 (Parts 3 and 8)', title: 'National Building Code of India 2016', usedFor: 'The advisory checks on kitchen, bathroom and window sizes. The figures are as summarised in secondary sources; the Part numbers are from the tool\'s research notes, the code was not read, and no clause number is given.' },
]

/** Every string of a plain data structure, passed through f. */
function mapStrings<T>(o: T, f: (s: string) => string): T {
  if (typeof o === 'string') return f(o) as unknown as T
  if (Array.isArray(o)) return o.map((x) => mapStrings(x, f)) as unknown as T
  if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, mapStrings(v, f)])) as T
  return o
}

export function buildInteriorCalc(inp: InteriorInput, report: TradeResult): CalcSheet | null {
  const { w } = interiorWork(inp)
  const c = makeCtx(inp, w, report.paid, report.free)

  const P = answersAndPlan(c)
  const S = surfaces(c, P)
  const Ti = tiles(c, P, S)
  const Pa = paint(c, P, S)
  const Fc = falseCeiling(c, P)
  const Fi = doorsAndWindows(c, P, S)
  const Cp = carpentry(c, P)
  const Ck = checks(c, P)
  const Bu = buyList(c, { P, S, Ti, Pa, Fc, Fi, Cp })

  const t4kind = Cp.hasCarpentry ? 'ply' : Fc.fcArea > 0 ? 'fc' : 'glass'
  const t4 = Cp.hasCarpentry ? Cp.sheetsPly19 + Cp.sheetsPly8 : Fc.fcArea > 0 ? Fc.fcArea : Fi.glassTotal
  const Ba = bands(c, { painted: Pa.paintedTotal, tiles: Ti.tileBuyTotal, doorsWindows: S.nDoors + Fi.nGlazed, t4 }, t4kind)

  const sections: CalcSection[] = [
    ...P.sections, ...S.sections, ...Ti.sections, ...Pa.sections, ...Fc.sections, ...Fi.sections, ...Cp.sections, ...Bu.sections,
    { id: 's12', title: '[[s12]]. Room and window sizes quoted in the report', intro: 'The report checks the kitchen, the bathroom and the windows against usual minimums. The sizes it quotes are worked out here.', blocks: Ck.blocks },
    ...Ba.sections,
  ]
  /* Sections that do not apply to this house (no false ceiling, no wardrobes or kitchen units) are not printed, and the printed ones
     are numbered in order, so the numbers quoted in the text always match the numbers that print. */
  const number = (id: string) => sections.findIndex((x) => x.id === id) + 1
  const renumber = (text: string) => text.replace(/\[\[(s\d+)\]\]/g, (_m, id: string) => {
    const n = number(id)
    if (n === 0) c.L.mismatches.push(`a reference to section ${id} that is not in the sheet`)
    return String(n)
  })
  const sheet: CalcSheet = mapStrings({
    tool: 'InteriorPro', model: report.paid.engine, purpose: PURPOSE, method: methodFor(Fc.fcArea > 0, Cp.hasCarpentry), limits: limitsFor(), sections, tie: c.ties, references: REFERENCES,
  }, renumber)
  if (!sheetIsSound(sheet, c.L.mismatches)) {
    const bad = [...c.L.mismatches, ...c.ties.filter((t) => !t.ok).map((t) => `tie ${t.item}: report ${t.report} vs sheet ${t.sheet}`)].filter((m, i, a) => a.indexOf(m) === i)
    console.error(`[NS-CALC] InteriorPro calculation sheet does not agree with the report (${bad.length}):\n  ${bad.slice(0, 40).join('\n  ')}`)
    return null
  }
  return sheet
}
