/*
  MasonryPro calculation sheet: the last pages of the paid report.

  Every figure in the report is worked out again here from the answers, one step at a time, through the Ledger
  (lib/calcsheet/ledger.ts): the working printed is the working carried out. The constants are the engine's own
  (lib/qty/masonry/model.ts); the plan and the unit helpers are the engine's own helpers, used only as the figure each
  step is checked against ("expect"). Every tile, table, total and order line of the report is then tied to the sheet.
  If anything disagrees the builder returns null, after writing the mismatches to the console, and the report is
  printed without a sheet.

  Order of the sheet = the order the engine works: answers, room plan, openings, walls, units and joint mortar,
  plaster, lintels, cement and sand, order sizes, bands, code checks.

  Nothing here knows a price. The site is quantity-only.
*/

import type { CalcBlock, CalcReference, CalcSection, CalcSheet, CalcTable, CalcTieRow } from '@/lib/calcsheet'
import { Ledger, fixed, num, sheetIsSound, tie } from '@/lib/calcsheet'
import type { TradeResult } from '../types'
import { SQFT_TO_M2, ceilTo, round } from '../util'
import { CORE_M2, floorName, perim, planFloors } from '../plan'
import * as M from './model'
import * as U from './units'
import type { MasonInput, MasonTrace, MatRow, UnitRow } from './model'

/* ───────────────────────── sources (clauses read in the standards themselves are marked ✓ in the report to the lead, not here) ───────────────────────── */

/** The 1976 editions of IS 1200 Parts 3 and 12 are the ones the tool follows. BIS lists 2026 editions that supersede them; those were not available to the tool. */
const ED76 = '1976 edition; a 2026 edition exists and was not checked'

const R = {
  jointThin: 'Makers of AAC block adhesive (3 mm bed): not a BIS figure',
  breakage: 'NirmanShastra assumption: no standard gives it',
  mortarAllow: 'NirmanShastra assumption: no standard gives it',
  nominal: 'Engine rule: the nominal size includes the joint',
  area: `IS 1200 (Part 3):1976 cl 4.1.4 and its note (${ED76})`,
  plaster: `IS 1200 (Part 12):1976 cl 3.8 and 3.12 (${ED76}); the sums are the tool’s`,
  dar: 'CPWD Delhi Analysis of Rates 2014 (DAR)',
  assumed: 'NirmanShastra assumption',
  engine: 'Engine rule',
  plan: 'NirmanShastra assumption: the room plan',
}

/** Where the 10 mm joint comes from, for each kind of masonry. */
const jointRef = (key: M.MasonSystem) => key === 'aac'
  ? 'IS 6041:1985 cl 7.1: joint of 10 mm'
  : key === 'block'
    ? 'IS 2572:2005 cl 11.1.4: joint of 10 mm'
    : 'IS 2212:1991 cl 6.4.1: joints up to 12 mm (clause number not re-read against the published text); the tool takes 10 mm'

/* ───────────────────────── reading the report ───────────────────────── */

type Cell = string | number | undefined

/** A figure printed in the report ("30,400", "175.0", 230) as a number, with the decimals it was printed to. */
function cellNum(c: Cell): { v: number; dp: number } | null {
  if (typeof c === 'number') return Number.isFinite(c) ? { v: c, dp: 0 } : null
  if (c === undefined) return null
  const t = String(c).replace(/,/g, '').trim()
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null
  const dot = t.indexOf('.')
  return { v: parseFloat(t), dp: dot < 0 ? 0 : t.length - dot - 1 }
}

const tolOf = (v: number) => 1e-9 * Math.max(1, Math.abs(v))
/** The engine's own figure for a step, to full precision. */
const X = (v: number) => ({ expect: v, tol: tolOf(v) })

const sum = (a: number[]) => a.reduce((s, x) => s + x, 0)
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const yn = (b: boolean) => (b ? 'Yes' : 'No')
const mm = (m: number) => round(m * 1000)

/* ───────────────────────── mirror of the room plan (lib/qty/plan.ts does not export these numbers) ───────────────────────── */
// Every figure the sheet derives from them is checked against planFloors() itself, so a change in plan.ts makes the sheet fall away.
const PLAN = {
  perimK: 4.082, shareStart: 0.88, minNet: 0.6, minInner: 0.15, aspectRoom: 1.3, aspectPass: 4, aspectCore: 1.5, aspectBlock: 1.5,
  wBed: 1.0, wLivG: 1.3, wLivGBed: 0.3, wLivU: 0.9, wLivUBed: 0.2, wKit: 0.75, wBath: 0.33, wPass0: 0.45, wPassEach: 0.08, coreShare: 0.1, passes: 4,
}

/** CPWD DAR 2014 Vol 2 item 13.21: cement and mortar for 10 m² of 12 mm plaster in 1:3. Reproduced here; the 513 kg per m³ the engine carries is 73.89 ÷ 0.144. */
const DAR_13_21 = { cementKg: 73.89, mortarM3: 0.144 }

const WHERE: Record<M.Where, string> = { ext: 'Outer wall', int: 'Inner wall', mumty: 'Stair room wall' }

const COUNT_RULE: Record<M.OpenId, string> = {
  room: 'One for every bedroom and every kitchen.',
  bath: 'One for every bathroom.',
  vent: 'One for every bathroom.',
  winB: 'One for every bedroom.',
  winK: 'One for every kitchen.',
  winL: 'Two for each living room on the ground floor of a house and in flats; one on the upper floors of a house.',
  main: 'Flats: one for each home. House: one, on the ground floor.',
  winS: 'One stair window on every floor, when the building has two or more floors.',
  balc: 'One for every balcony.',
  balcL: 'One for every balcony (the large sliding door replaces the usual balcony door).',
  mumty: 'One, when the terrace stair room is counted.',
}

/* ───────────────────────── the builder ───────────────────────── */

export interface MasonSheetResult { sheet: CalcSheet; mismatches: string[]; checked: number }

/** Builds the sheet and says how well it agrees. Throws on a programming error. buildMasonCalc is the safe wrapper. */
export function makeMasonSheet(inp: MasonInput, rpt: TradeResult): MasonSheetResult {
  const tr = {} as MasonTrace
  const ran = M.runMason(inp, tr)
  if (!ran.ok) throw new Error(`the model refused these answers: ${ran.error}`)

  const L = new Ledger()
  const ties: CalcTieRow[] = []
  const paid = rpt.paid
  const free = rpt.free

  const miss = (msg: string) => { L.mismatches.push(msg) }
  const cmp = (label: string, sheetV: number, engineV: number) => { L.compare(label, sheetV, engineV, undefined, tolOf(engineV)) }
  const same = (label: string, a: string, b: string) => { if (a !== b) miss(`${label}: sheet "${a}" vs engine "${b}"`) }
  const sameArr = (label: string, a: number[], b: number[]) => {
    if (a.length !== b.length) { miss(`${label}: sheet has ${a.length} values, engine ${b.length}`); return }
    a.forEach((x, i) => cmp(`${label} [${i + 1}]`, x, b[i]))
  }

  /** A report row against the numbers or text the sheet found. null = not compared. */
  const matchRow = (what: string, repRow: (string | number)[] | undefined, cells: (number | string | null)[]) => {
    if (!repRow) { miss(`${what}: the row is not in the report`); return }
    cells.forEach((sv, j) => {
      if (sv === null) return
      const rv = repRow[j]
      if (typeof sv === 'string') { if (String(rv) !== sv) miss(`${what}, column ${j + 1}: sheet "${sv}" vs report "${rv}"`); return }
      const c = cellNum(rv)
      if (!c) { miss(`${what}, column ${j + 1}: the report shows "${rv}", not a number`); return }
      L.compare(`${what}, column ${j + 1}`, sv, c.v, c.dp)
    })
  }

  const tieNum = (item: string, repCell: Cell, sheetV: number, unit: string, dp?: number) => {
    const c = cellNum(repCell)
    if (!c) { miss(`${item}: the report shows "${repCell}", not a number`); ties.push({ item, report: String(repCell ?? ''), sheet: num(sheetV), ok: false }); return }
    ties.push(tie(item, c.v, sheetV, unit, dp ?? c.dp))
  }
  const tieText = (item: string, repText: string, sheetText: string) => { ties.push({ item, report: repText, sheet: sheetText, ok: repText === sheetText }) }
  const tieRows = (item: string, repN: number, sheetN: number) => { ties.push({ item: `Rows in the table: ${item}`, report: String(repN), sheet: String(sheetN), ok: repN === sheetN }) }

  /** A long sum is written term by term when short, and as "the N rows above" when long; either way the Ledger does the adding. */
  const sumLine = (label: string, formula: string, vals: number[], unit: string, dp: number, o: { ref?: string; note?: string; expect?: number; result?: boolean; what?: string }) => {
    const vars: Record<string, number> = {}
    vals.forEach((v, i) => { vars[`t${i}`] = v })
    const short = vals.length > 0 && vals.length <= 6
    const working = short ? vals.map((_, i) => `{t${i}:${dp}}`).join(' + ') : `sum of the ${vals.length} ${o.what ?? 'rows'} above`
    return L.calc(label, formula, working, short ? vars : {}, () => sum(vals), { unit, dp, ref: o.ref, note: o.note, result: o.result, ...(o.expect !== undefined ? X(o.expect) : {}) })
  }

  const sections: CalcSection[] = []
  const blk = (id: string, title: string, o: { intro?: string; table?: CalcTable; note?: string } = {}): CalcBlock => ({ id, title, lines: L.take(), ...o })

  // the tables the report must hold, in order
  const S = U.SYSTEMS[inp.system]
  const thin = inp.system === 'aac' && inp.aacJoint === 'thin'
  const panelRef = () => inp.system === 'aac'
    ? 'IS 6041:1985 cl 4.2.1: external panel walls in a frame not less than 20 cm nominal; 15 cm if braced and reinforced'
    : 'IS 2572:2005 cl 7.2.1.3: external panel walls in a frame preferably not less than 200 mm nominal; 150 mm if braced and reinforced'
  const srcOf = (sy: M.Sys) => sy.key === 'aac'
    ? 'IS 2185 (Part 3):1984 and makers’ data: 600 × 200 mm face, thickness 100 to 300 mm'
    : sy.key === 'block' ? 'IS 2185 (Part 1):2005 cl 4.2.1: 400 × 200 mm nominal face' : sy.source
  const wantIds = ['walls', 'floors', 'open', 'units', ...(thin ? ['adh'] : []), 'plaster', 'lintels', 'mat']
  same('Tables in the report', paid.tables.map((t) => t.id).join(', '), wantIds.join(', '))
  const rt = (id: string) => paid.tables.find((t) => t.id === id)

  /* ═════════════ 1. Your answers and what was worked out from them ═════════════ */

  const N = inp.floorAreasSqft.length
  const flats = inp.dwelling === 'flats'
  const h = flats ? inp.homesPerFloor : 1
  const homes = flats ? h * N : 1
  const tExt = S.kind === 'brick' ? S.ext : inp.thickOuter ? S.ext : (S.extThin as number)
  const tInt = S.int
  const tPar = S.kind === 'brick' ? S.int : M.PARAPET_BLOCK_T
  const P_S = inp.system === 'aac' ? U.SYSTEMS.block : S
  const tPlinth = P_S.kind === 'brick' ? P_S.ext : inp.thickOuter ? P_S.ext : (P_S.extThin as number)
  cmp('Outer wall thickness', tExt, tr.tExt); cmp('Inner wall thickness', tInt, tr.tInt); cmp('Parapet thickness', tPar, tr.tPar); cmp('Plinth wall thickness', tPlinth, tr.tPlinth)
  same('Thin-bed joint', String(thin), String(tr.thin)); same('Plinth material', P_S.key, tr.P_S.key)

  L.input('Floors', String(N), undefined, N === 1 ? 'Ground floor only' : `Ground floor and ${N - 1} upper ${N === 2 ? 'floor' : 'floors'}`)
  L.input('Building type', flats ? 'Flats' : 'A house')
  if (flats) L.value('Homes on each floor', h, '', 0)
  L.value(flats ? 'Bedrooms in each home' : 'Bedrooms in the house', inp.bedrooms, '', 0)
  L.value(flats ? 'Bathrooms in each home' : 'Bathrooms in the house', inp.bathrooms, '', 0)
  L.value(flats ? 'Kitchens in each home' : 'Kitchens in the house', inp.kitchens, '', 0)
  L.value(flats ? 'Balconies in each home' : 'Balconies in the house', inp.balconies, '', 0)
  L.input('Wall material', S.label, srcOf(S), S.size)
  if (S.kind === 'block') L.input('Outer wall thickness chosen', `${mm(tExt)} mm`, undefined, 'Block walls only: the thicker or the thinner block')
  if (inp.system === 'aac') L.input('Block jointing', thin ? 'Thin adhesive' : 'Cement mortar')
  L.input('Outside plaster', inp.plasterExt === 'none' ? 'Not plastered' : M.SPEC[inp.plasterExt].label)
  L.input('Plaster the ceilings', yn(inp.plasterCeil))
  L.input('Stair room on the terrace', yn(inp.mumty), undefined, inp.mumty && N < 2 ? 'Ignored: a single-storey building has no stair to the terrace' : undefined)
  L.input('Masonry parapet round the terrace', yn(inp.parapet))
  L.input('Balcony edges are masonry walls', yn(inp.balconyWall))
  L.input('Large sliding doors to the balcony', yn(inp.bigDoor))
  L.value('Floor to floor height', inp.storeyM, 'm', 2)
  L.input('Place', inp.city ? `${inp.city}, ${inp.state}` : inp.state, undefined, 'Written on the report. No quantity in this tool depends on the place')
  const answersBlock = blk('answers', '1.1 The answers this sheet starts from')

  // ── derived choices
  L.value('Joint between units', thin ? U.J_THIN * 1000 : U.J * 1000, 'mm', 0, thin ? R.jointThin : jointRef(S.key), thin ? 'Thin-bed adhesive' : 'Cement mortar bed and perpend joints')
  L.value('Breakage and cutting allowance', S.loss * 100, '%', 0, R.breakage, `Added to the count of ${S.unitsLabel}`)
  L.value('Outer wall thickness', mm(tExt), 'mm', 0, S.kind === 'brick' ? R.engine : panelRef(), S.kind === 'brick' ? `One brick: the length of the ${S.unit}` : 'Block laid flat, as chosen above. The block standards ask for 200 mm in a frame, or 150 mm if braced and reinforced')
  L.value('Inner wall thickness', mm(tInt), 'mm', 0, S.kind === 'brick' ? R.engine : inp.system === 'aac' ? 'IS 6041:1985 cl 4.2.1: non-load-bearing internal walls not less than 10 cm' : 'IS 2572:2005 cl 7.2.1.2: non-load-bearing internal partitions not less than 100 mm', S.kind === 'brick' ? `Half brick: the width of the ${S.unit}` : 'A block partition')
  L.value('Parapet and balcony edge wall thickness', mm(tPar), 'mm', 0, R.engine, S.kind === 'brick' ? 'Half brick' : 'Block 150 mm thick (assumed)')
  L.value('Plinth wall thickness', mm(tPlinth), 'mm', 0, R.engine, inp.system === 'aac' ? 'Concrete block: AAC takes up water, so it does not stand in damp ground' : 'Same as the outer wall')
  L.value('Depth of the outer beam under each floor', M.BEAM_D, 'm', 2, R.assumed)
  L.value('Slab thickness', M.SLAB_T, 'm', 2, R.assumed)
  L.value('Inner walls: height lost where they meet a slab or a beam', M.WALL_UNDER_BEAMS, 'm', 2, R.assumed, 'An inner wall meets a slab (0.15 m) or a beam (0.45 m): the average is taken off the height')
  const H = inp.storeyM
  const He = L.calc('Outer wall height', 'He = H − depth of beam', '{H:2} − {Db:2}', { H, Db: M.BEAM_D }, (v) => v.H - v.Db, { unit: 'm', dp: 2, ref: R.engine, note: 'Plinth beam or floor up to the beam above', ...X(tr.He) })
  const Hi = L.calc('Inner wall height', 'Hi = H − 0.30', '{H:2} − {d:2}', { H, d: M.WALL_UNDER_BEAMS }, (v) => v.H - v.d, { unit: 'm', dp: 2, ref: R.engine, ...X(tr.Hi) })
  const Hc = L.calc('Clear height for plaster', 'Hc = H − slab thickness', '{H:2} − {ts:2}', { H, ts: M.SLAB_T }, (v) => v.H - v.ts, { unit: 'm', dp: 2, ref: `IS 1200 (Part 12):1976 cl 3.12 (${ED76}): floor to ceiling`, note: 'Floor up to the underside of the slab', ...X(tr.Hc) })
  const mixInt = S.kind === 'brick' && tInt <= 0.115 ? 4 : 6
  if (thin) {
    L.pick('Joints of the AAC walls', 'thin-bed AAC', 'adhesive, no mortar', R.jointThin, 'The mortar mixes below apply to the concrete-block plinth and to plaster only')
    L.pick('Mortar mix, plinth wall', 'always', '1:6', 'IS 4326:1993 cl 8.1.2 and Table 3, then the tool’s own choice', 'The 1:6 mix of Table 3 (categories B and C). For an ordinary building in zones IV and V the table asks for 1:4 or richer; ask your engineer')
  } else {
    L.pick('Mortar mix, inner walls', 'half-brick wall → 1:4, other → 1:6', `1:${mixInt}`, 'IS 4326:1993 cl 8.1.2 and Table 3, then the tool’s own choice', 'Table 3 gives cement-sand 1:6 for building categories B and C and 1:4 for D and E. The tool does not ask for your seismic zone, so it takes 1:6 and uses 1:4 for half-brick walls')
    L.pick('Mortar mix, outer walls, plinth and stair room', 'always', '1:6', 'IS 4326:1993 cl 8.1.2 and Table 3, then the tool’s own choice', 'The 1:6 mix of Table 3 (categories B and C). For an ordinary building in zones IV and V the table asks for 1:4 or richer; ask your engineer')
    L.pick('Mortar mix, parapet and balcony edge walls', 'always', '1:4', 'IS 2250:1981 cl 7.1.5, then the tool’s own reading', 'Where a parapet is higher than three times its thickness the mortar is not to be weaker than grade MM 3. The table that gives the cement-sand ratio of that grade was not read. A secondary source gives MM 3 as 1:5, so the tool’s 1:4 is on the safe side')
  }
  same('Inner wall mix', String(mixInt), String(tr.mixInt))
  const derivedBlock = blk('derived', '1.2 What the tool works out from the answers')

  // ── floor by floor: area and rooms
  const footM2 = inp.floorAreasSqft.map((a) => a * SQFT_TO_M2)
  sameArr('Floor area in m²', footM2, tr.footM2)
  const bed: number[] = flats ? Array(N).fill(inp.bedrooms) : M.spread(inp.bedrooms, N)
  const bath: number[] = flats ? Array(N).fill(inp.bathrooms) : M.spread(inp.bathrooms, N)
  const kit: number[] = flats ? Array(N).fill(inp.kitchens) : M.spread(inp.kitchens, N)
  const balc: number[] = flats ? Array(N).fill(h * inp.balconies) : N === 1 ? [inp.balconies] : [0, ...M.spread(inp.balconies, N - 1)]
  sameArr('Bedrooms by floor', bed, tr.bed); sameArr('Bathrooms by floor', bath, tr.bath); sameArr('Kitchens by floor', kit, tr.kit); sameArr('Balconies by floor', balc, tr.balc)
  const balcTotal = sum(balc)
  cmp('Balconies in all', balcTotal, tr.balcTotal)
  const nHome = flats ? h : 1
  L.calc('Floor area in m², ground floor', 'A = sq ft × 0.09290304', '{a:0} × {k:8}', { a: inp.floorAreasSqft[0], k: SQFT_TO_M2 }, (v) => v.a * v.k, { unit: 'm²', dp: 2, ref: 'Unit conversion: 1 sq ft = 0.09290304 m²', ...X(tr.footM2[0]) })
  const floorRows: string[][] = footM2.map((a, i) => [floorName(i), fixed(inp.floorAreasSqft[i], 0), fixed(a, 1), String(nHome * bed[i]), String(nHome * bath[i]), String(nHome * kit[i]), String(balc[i])])
  const floorsTable: CalcTable = {
    head: ['Floor', 'Built-up (sq ft)', 'Built-up (m²)', 'Bedrooms', 'Bathrooms', 'Kitchens', 'Balconies'],
    rows: floorRows,
    foot: ['All floors', fixed(sum(inp.floorAreasSqft), 0), fixed(sum(footM2), 1), String(sum(bed) * nHome), String(sum(bath) * nHome), String(sum(kit) * nHome), String(balcTotal)],
    num: [1, 2, 3, 4, 5, 6],
    note: flats
      ? 'Flats: every floor has the same homes, so the rooms of one home are repeated on each floor.'
      : 'A house: the rooms are shared out floor by floor. Each floor gets the total ÷ the number of floors, rounded down; the first floors take the remainder one each. Balconies go to the upper floors; the ground floor has none when there is more than one floor.',
  }
  const floorsBlock = blk('floors', '1.3 Floor areas and rooms on each floor', { table: floorsTable })
  sections.push({ id: 'answers', title: '1. Your answers and what the tool worked out from them', intro: 'The answers you gave, the wall thicknesses and heights that follow from them, and the rooms placed on each floor.', blocks: [answersBlock, derivedBlock, floorsBlock] })

  /* ═════════════ 2. Wall lengths from the room plan ═════════════ */

  const plans = planFloors({ footM2, flats, h, bed, bath, kit, tExt, tInt })
  interface Pass { netIn: number; u: number; sumP: number; Lall: number; Lint: number; net: number }
  const replica = (A: number, i: number) => {
    const bI = bed[i], baI = bath[i], kI = kit[i]
    const groundLiving = flats || i === 0
    const core = flats ? Math.min(CORE_M2, PLAN.coreShare * A) : 0
    const P = PLAN.perimK * Math.sqrt(A)
    const D = Math.sqrt(A / PLAN.aspectBlock)
    const Lparty = flats ? (h - 1) * D : 0
    let net = PLAN.shareStart * A
    let Lint = 0
    const wLiv = groundLiving ? PLAN.wLivG + PLAN.wLivGBed * bI : PLAN.wLivU + PLAN.wLivUBed * bI
    const wPass = PLAN.wPass0 + PLAN.wPassEach * (bI + baI + kI)
    const wSum = bI * PLAN.wBed + wLiv + kI * PLAN.wKit + baI * PLAN.wBath + wPass
    const passes: Pass[] = []
    for (let k = 0; k < PLAN.passes; k++) {
      const netIn = net
      const homeNet = (net - core) / nHome
      const u = homeNet / wSum
      const sumP =
        nHome * (bI * perim(u * PLAN.wBed, PLAN.aspectRoom) + perim(u * wLiv, PLAN.aspectRoom) + kI * perim(u * PLAN.wKit, PLAN.aspectRoom) + baI * perim(u * PLAN.wBath, PLAN.aspectRoom) + perim(u * wPass, PLAN.aspectPass)) +
        (core > 0 ? perim(core, PLAN.aspectCore) : 0)
      const Lall = Math.max(0, (sumP - P) / 2)
      Lint = Math.max(PLAN.minInner * P, Lall - Lparty)
      net = Math.max(PLAN.minNet * A, A - P * tExt - Lint * tInt - Lparty * tExt)
      passes.push({ netIn, u, sumP, Lall, Lint, net })
    }
    const u = (net - core) / nHome / wSum
    return { P, D, Lparty, core, wLiv, wPass, wSum, passes, Lint, net, u }
  }
  const reps = footM2.map((a, i) => replica(a, i))
  reps.forEach((r, i) => {
    cmp(`Outer wall, ${floorName(i)}`, r.P, plans[i].P); cmp(`Inner walls, ${floorName(i)}`, r.Lint, plans[i].Lint); cmp(`Walls between flats, ${floorName(i)}`, r.Lparty, plans[i].Lparty)
    cmp(`Floor inside the walls, ${floorName(i)}`, r.net, plans[i].net); cmp(`Common core, ${floorName(i)}`, r.core, plans[i].core)
    cmp(`Bedroom area, ${floorName(i)}`, r.u * PLAN.wBed, plans[i].areas.bed); cmp(`Living room area, ${floorName(i)}`, r.u * r.wLiv, plans[i].areas.living)
    cmp(`Kitchen area, ${floorName(i)}`, r.u * PLAN.wKit, plans[i].areas.kit); cmp(`Bathroom area, ${floorName(i)}`, r.u * PLAN.wBath, plans[i].areas.bath); cmp(`Passage area, ${floorName(i)}`, r.u * r.wPass, plans[i].areas.pass)
  })
  const sumP = sum(reps.map((r) => r.P)), sumInt = sum(reps.map((r) => r.Lint)), sumParty = sum(reps.map((r) => r.Lparty)), sumNet = sum(reps.map((r) => r.net))
  cmp('Outer wall, all floors', sumP, tr.sumP); cmp('Inner walls, all floors', sumInt, tr.sumInt); cmp('Walls between flats, all floors', sumParty, tr.sumParty); cmp('Floor inside the walls, all floors', sumNet, tr.sumNet)
  const topP = reps[N - 1].P
  cmp('Outer wall, top floor', topP, tr.topP)

  // the worked floor: the ground floor
  const g = reps[0]
  const A0 = footM2[0]
  L.say('Where these numbers come from', 'The room plan is the tool’s own planning model, built to find wall lengths and the floor area inside the walls. No Indian Standard fixes room sizes or the length of inner walls. It is worked out for each floor in three steps: the outer wall, the share of the floor each room takes, and the inner walls that are left when every wall between two rooms is counted once.', R.plan)
  L.calc(`Outer wall length, ${floorName(0)}`, 'P = k × √A', '{k:3} × √{A:2}', { k: PLAN.perimK, A: A0 }, (v) => v.k * Math.sqrt(v.A), { unit: 'm', dp: 2, ref: R.plan, note: `The perimeter of a plan 1 to ${PLAN.aspectBlock} (2 (1 + ${PLAN.aspectBlock}) ÷ √${PLAN.aspectBlock} = ${num(perim(1, PLAN.aspectBlock), 4)}), taken as ${PLAN.perimK}`, ...X(plans[0].P) })
  if (flats) {
    L.calc(`Walls between flats, ${floorName(0)}`, 'Lp = (homes − 1) × √(A ÷ 1.5)', '({h:0} − 1) × √({A:2} ÷ {a:1})', { h, A: A0, a: PLAN.aspectBlock }, (v) => (v.h - 1) * Math.sqrt(v.A / v.a), { unit: 'm', dp: 2, ref: R.plan, note: 'One wall across the depth of the plan between each pair of neighbouring flats', ...X(plans[0].Lparty) })
    L.calc('Common stair and lift lobby, per floor', 'core = smaller of 15 m² and 10% of A', 'min({c:0}, {s:2} × {A:2})', { c: CORE_M2, s: PLAN.coreShare, A: A0 }, (v) => Math.min(v.c, v.s * v.A), { unit: 'm²', dp: 2, ref: R.plan, ...X(plans[0].core) })
  }
  L.calc('Room weight of a living room', 'wLiv = 1.3 + 0.3 × bedrooms (ground floor and flats)', '{a:2} + {b:2} × {nb:0}', { a: PLAN.wLivG, b: PLAN.wLivGBed, nb: bed[0] }, (v) => v.a + v.b * v.nb, { dp: 2, ref: R.plan, note: `A bedroom weighs ${PLAN.wBed}, a kitchen ${PLAN.wKit}, a bathroom ${PLAN.wBath}. On the upper floors of a house a living room weighs ${PLAN.wLivU} + ${PLAN.wLivUBed} × bedrooms` })
  L.calc('Room weight of the passages', 'wPass = 0.45 + 0.08 × (bedrooms + bathrooms + kitchens)', '{a:2} + {b:2} × ({nb:0} + {nba:0} + {nk:0})', { a: PLAN.wPass0, b: PLAN.wPassEach, nb: bed[0], nba: bath[0], nk: kit[0] }, (v) => v.a + v.b * (v.nb + v.nba + v.nk), { dp: 2, ref: R.plan })
  const wSum0 = L.calc('Total room weight of one home', 'W = Σ (number × weight)', '{nb:0} × {wb:2} + {wl:2} + {nk:0} × {wk:2} + {nba:0} × {wba:2} + {wp:2}', { nb: bed[0], wb: PLAN.wBed, wl: g.wLiv, nk: kit[0], wk: PLAN.wKit, nba: bath[0], wba: PLAN.wBath, wp: g.wPass }, (v) => v.nb * v.wb + v.wl + v.nk * v.wk + v.nba * v.wba + v.wp, { dp: 2, ref: R.plan })
  const planLines1 = blk('plan-1', '2.1 Outer wall, and the weights that share out the floor: ground floor as the worked example')

  // the passes
  const passRows = g.passes.map((p, k) => [String(k + 1), fixed(p.netIn, 2), fixed(p.u, 3), fixed(p.sumP, 2), fixed(p.Lall, 2), fixed(p.Lint, 2), fixed(p.net, 2)])
  const passTable: CalcTable = {
    head: ['Pass', 'Floor inside the walls, taken (m²)', 'Share per unit weight, u (m²)', 'All room perimeters (m)', 'Inner wall found (m)', 'Inner wall kept (m)', 'Floor inside the walls, found (m²)'],
    rows: passRows, num: [0, 1, 2, 3, 4, 5, 6],
    note: `The first pass starts from ${PLAN.shareStart} × A. Each pass: u = (floor inside the walls − core) ÷ homes ÷ W; every room has the perimeter p = 2 (1 + k) ÷ √k × √(area), with k = ${PLAN.aspectRoom} for rooms and ${PLAN.aspectPass} for passages; inner wall found = (all perimeters − P) ÷ 2, because each inner wall is the side of two rooms; inner wall kept = that less the walls between flats, and not less than ${PLAN.minInner} × P; floor inside the walls = A − P × outer thickness − inner wall × inner thickness − walls between flats × outer thickness, and not less than ${PLAN.minNet} × A. ${PLAN.passes} passes are run; the last pass is the answer.`,
  }
  const lastPass = g.passes[g.passes.length - 1]
  const roomDefs = [
    { name: 'Bedroom', n: bed[0], w: PLAN.wBed, k: PLAN.aspectRoom },
    { name: 'Living room', n: 1, w: g.wLiv, k: PLAN.aspectRoom },
    { name: 'Kitchen', n: kit[0], w: PLAN.wKit, k: PLAN.aspectRoom },
    { name: 'Bathroom', n: bath[0], w: PLAN.wBath, k: PLAN.aspectRoom },
    { name: 'Passages', n: 1, w: g.wPass, k: PLAN.aspectPass },
  ]
  const roomRows = roomDefs.map((r) => {
    const a = lastPass.u * r.w
    return [r.name, String(r.n), fixed(r.w, 2), fixed(a, 2), fixed(r.k, 1), fixed(perim(a, r.k), 2), fixed(r.n * perim(a, r.k), 2)]
  })
  const perHome = sum(roomDefs.map((r) => r.n * perim(lastPass.u * r.w, r.k)))
  const roomTable: CalcTable = {
    head: ['Room (one home)', 'Number', 'Weight', 'Area each (m²)', 'Long side ÷ short', 'Perimeter each (m)', 'Perimeter, all (m)'],
    rows: roomRows,
    foot: ['One home', '', '', '', '', '', fixed(perHome, 2)],
    num: [1, 2, 3, 4, 5, 6],
    note: `${floorName(0)}, last pass, with u = ${fixed(lastPass.u, 3)} m² per unit weight. ${flats ? `This is repeated for ${h} homes${g.core > 0 ? ' and the common lobby is added' : ''}.` : ''}`,
  }
  cmp('All room perimeters, last pass', nHome * perHome + (g.core > 0 ? perim(g.core, PLAN.aspectCore) : 0), lastPass.sumP)
  void wSum0
  L.say('Result of the plan, ground floor', `Inner walls ${fixed(g.Lint, 2)} m; floor inside the walls ${fixed(g.net, 2)} m².${g.Lparty > 0 ? ` Walls between flats ${fixed(g.Lparty, 2)} m.` : ''}`, R.plan)
  const planLines2 = blk('plan-2', '2.2 The four passes for the ground floor', { table: passTable })
  const planRooms = blk('plan-3', '2.3 Room perimeters in the last pass', { table: roomTable })

  // the floor table (tied to the report)
  const roomsText = (i: number) => `${bed[i] * nHome} bed, ${nHome} living, ${kit[i] * nHome} kitchen, ${bath[i] * nHome} bath`
  const planRows = reps.map((r, i) => [floorName(i), fixed(footM2[i], 1), fixed(r.P, 1), fixed(r.Lint, 1), flats ? fixed(r.Lparty, 1) : '—', fixed(r.net, 1), roomsText(i)])
  const rtFloors = rt('floors')
  tieRows('How the walls were measured, floor by floor', rtFloors?.rows.length ?? 0, reps.length)
  reps.forEach((r, i) => matchRow(`Floors table, ${floorName(i)}`, rtFloors?.rows[i], [floorName(i), r.P, r.Lint, flats ? r.Lparty : '—', r.net, roomsText(i)]))
  const planTable: CalcTable = {
    head: ['Floor', 'Built-up (m²)', 'Outer wall (m)', 'Inner walls (m)', 'Walls between flats (m)', 'Floor inside the walls (m²)', 'Rooms counted'],
    rows: planRows,
    foot: ['All floors', fixed(sum(footM2), 1), fixed(sumP, 1), fixed(sumInt, 1), flats ? fixed(sumParty, 1) : '—', fixed(sumNet, 1), ''],
    num: [1, 2, 3, 4, 5],
    note: 'Each row is the same working as the ground floor above, with that floor’s area and rooms. The room plan is a planning model, not a drawing: if the plot is long and thin, or the rooms are laid out very differently, the real walls will be longer.',
  }
  const planAll = blk('plan-4', '2.4 Wall lengths on every floor', { table: planTable })
  sections.push({ id: 'plan', title: '2. Wall lengths from the room plan', intro: 'Outer wall, inner walls and walls between flats on each floor. These are planning figures from the tool’s room plan; they are not taken off a drawing.', blocks: [planLines1, planLines2, planRooms, planAll] })

  /* ═════════════ 3. Doors, windows and ventilators ═════════════ */

  const openN = new Map<M.OpenId, { n: number; where: M.Where }>()
  const addO = (id: M.OpenId, n: number, where: M.Where) => {
    if (n <= 0) return
    const cur = openN.get(id)
    if (cur) cur.n += n
    else openN.set(id, { n, where })
  }
  for (let i = 0; i < N; i++) {
    const bT = nHome * bed[i], baT = nHome * bath[i], kT = nHome * kit[i], livT = nHome
    addO('room', bT + kT, 'int')
    addO('bath', baT, 'int')
    addO('vent', baT, 'ext')
    addO('winB', bT, 'ext')
    addO('winK', kT, 'ext')
    addO('winL', livT * (flats || i === 0 ? 2 : 1), 'ext')
    if (flats) addO('main', h, 'int')
    else if (i === 0) addO('main', 1, 'ext')
    if (N >= 2) addO('winS', 1, 'ext')
    addO(inp.bigDoor ? 'balcL' : 'balc', balc[i], 'ext')
  }
  const hasMumty = inp.mumty && N >= 2
  if (hasMumty) addO('mumty', 1, 'mumty')
  same('Openings listed', [...openN.keys()].join(','), [...tr.open.keys()].join(','))
  for (const [id, o] of tr.open) {
    const mine = openN.get(id)
    cmp(`Number of ${M.OPEN[id].name.toLowerCase()}`, mine?.n ?? -1, o.n)
    same(`Wall of ${M.OPEN[id].name.toLowerCase()}`, mine?.where ?? '', o.where)
  }
  cmp('Stair room counted', hasMumty ? 1 : 0, tr.hasMumty ? 1 : 0)
  const ids = [...openN.keys()]
  const outEach = (id: M.OpenId) => { const d = M.OPEN[id]; return d.w * (d.h + M.lintelDepth(d.w) + (d.win ? M.WINDOW_SILL : 0)) }
  const outTot = (id: M.OpenId) => openN.get(id)!.n * outEach(id)
  const dedFor = (where: M.Where) => sum(ids.filter((id) => openN.get(id)!.where === where).map(outTot))
  const nDoors = sum(ids.filter((id) => !M.OPEN[id].win).map((id) => openN.get(id)!.n))
  const nWindows = sum(ids.filter((id) => M.OPEN[id].win).map((id) => openN.get(id)!.n))
  cmp('Doors', nDoors, tr.nDoors); cmp('Windows and ventilators', nWindows, tr.nWindows)

  // worked openings: the door and the window that take most out of the walls
  const workOpen = (id: M.OpenId, why: string) => {
    const d = M.OPEN[id]
    const o = openN.get(id)!
    const ld = M.lintelDepth(d.w)
    L.say('Worked example', `${d.name}: ${why}`, R.area)
    L.value('Width of the opening', d.w, 'm', 2, R.assumed, 'Usual size; no standard fixes it')
    L.value('Height of the opening', d.h, 'm', 2, R.assumed)
    L.calc('Area of the opening', 'a = w × h', '{w:2} × {h:2}', { w: d.w, h: d.h }, (v) => v.w * v.h, { unit: 'm²', dp: 2, ref: 'Arithmetic', ...X(M.oArea(id)) })
    L.pick('Depth of the lintel over it', 'd = 0.15 m if w ≤ 1.5 m, otherwise 0.20 m', `${fixed(ld, 2)} m`, R.assumed + ': no standard fixes the depth of a small lintel')
    if (d.win) L.value('Sill under a window', M.WINDOW_SILL, 'm', 3, R.area, 'IS 1200 (Part 3):1976 counts a separate sill with the size of the opening; the 75 mm depth is the tool’s assumption')
    const each = L.calc('Taken out of the wall, each', d.win ? 'w × (h + d + sill)' : 'w × (h + d)', d.win ? '{w:2} × ({h:2} + {d:2} + {s:3})' : '{w:2} × ({h:2} + {d:2})', { w: d.w, h: d.h, d: ld, s: M.WINDOW_SILL }, (v) => v.w * (v.h + v.d + (d.win ? v.s : 0)), { unit: 'm²', dp: 3, ref: R.area, note: `${d.win ? 'The opening with its lintel and sill' : 'The opening with its lintel'}: IS 1200 (Part 3):1976 counts a separate lintel or sill with the size of the opening, but not the ends of the lintel`, ...X(outEach(id)) })
    L.calc('Taken out of the walls, all of them', 'n × each', '{n:0} × {e:3}', { n: o.n, e: each }, (v) => v.n * v.e, { unit: 'm²', dp: 2, ref: R.area, result: true, ...X(o.n * outEach(id)) })
  }
  const doorIds = ids.filter((id) => !M.OPEN[id].win)
  const winIds = ids.filter((id) => M.OPEN[id].win)
  const bigOf = (a: M.OpenId[]) => a.reduce((x, y) => (outTot(y) > outTot(x) ? y : x), a[0])
  if (doorIds.length) workOpen(bigOf(doorIds), 'the door that takes most out of the walls.')
  if (winIds.length) workOpen(bigOf(winIds), 'the window that takes most out of the walls.')
  const openWorked = blk('open-1', '3.1 Openings taken out of the walls: worked examples, a door and a window')

  const rtOpen = rt('open')
  tieRows('Doors, windows and ventilators', rtOpen?.rows.length ?? 0, ids.length)
  const planRule = (a: number) => (a <= M.PLASTER_RULE.noDeductM2 ? 'Not deducted from plaster' : a <= M.PLASTER_RULE.bothFacesM2 ? 'Deducted once from plaster' : 'Both faces deducted, reveals added')
  const openRows: string[][] = []
  ids.forEach((id, k) => {
    const d = M.OPEN[id]
    const o = openN.get(id)!
    openRows.push([d.name, `${fixed(d.w, 2)} × ${fixed(d.h, 2)}`, WHERE[o.where], String(o.n), fixed(M.oArea(id), 2), fixed(M.lintelDepth(d.w), 2), fixed(outEach(id), 3), fixed(outTot(id), 1)])
    matchRow(`Openings table, ${d.name}`, rtOpen?.rows[k], [d.name, `${fixed(d.w, 2)} × ${fixed(d.h, 2)}`, o.n, M.oArea(id), outTot(id), planRule(M.oArea(id))])
  })
  const openTable: CalcTable = {
    head: ['Opening', 'Size (m)', 'In', 'Number', 'Area each (m²)', 'Lintel depth (m)', 'Out of masonry each (m²)', 'Out of masonry, all (m²)'],
    rows: openRows,
    foot: ['All openings', '', '', String(sum(ids.map((id) => openN.get(id)!.n))), '', '', '', fixed(sum(ids.map(outTot)), 1)],
    num: [3, 4, 5, 6, 7],
    note: 'Out of masonry = width × (height + lintel depth + 75 mm sill for a window). Sizes are the usual ones; no standard fixes them.',
  }
  const openAll = blk('open-2', '3.2 Every opening in the building', { table: openTable })
  const countTable: CalcTable = { head: ['Opening', 'How the number is found'], rows: ids.map((id) => [M.OPEN[id].name, COUNT_RULE[id]]) }
  const openCount = blk('open-3', '3.3 How each number is counted', { table: countTable, note: 'The sheet counts each opening again from the rooms of every floor, by these rules, and the count must equal the one in the report.' })
  sections.push({ id: 'openings', title: '3. Doors, windows and ventilators', intro: 'Counted from the rooms, then taken out of the walls with their lintels and sills as IS 1200 (Part 3):1976 measures openings: no deduction for an opening of 0.1 m² or less, which none of these is. BIS lists a 2026 edition of Part 3 that supersedes the 1976 one. The tool follows the 1976 rules and has not been checked against the 2026 edition.', blocks: [openWorked, openAll, openCount] })

  /* ═════════════ 4. Walls measured ═════════════ */

  interface WallC { id: string; name: string; sys: M.Sys; t: number; thin: boolean; mix: number; len: number; h: number; gross: number; ded: number; net: number; rule: string; lenRule: string }
  const wall: WallC[] = []
  const addW = (id: string, name: string, sys: M.Sys, t: number, th: boolean, mix: number, len: number, ht: number, ded: number, rule: string, lenRule: string) => {
    wall.push({ id, name, sys, t, thin: th, mix, len, h: ht, gross: len * ht, ded, net: Math.max(0, len * ht - ded), rule, lenRule })
  }
  addW('ext', 'Outer walls', S, tExt, thin, 6, sumP, He, dedFor('ext'), 'Plinth beam or floor to the beam above', 'The outer wall of every floor, added up')
  addW('int', 'Inner walls', S, tInt, thin, mixInt, sumInt, Hi, dedFor('int'), 'Floor to the slab or beam above, taken as the average', 'The inner walls of every floor, added up')
  if (flats && sumParty > 0) addW('party', 'Walls between flats', S, tExt, thin, 6, sumParty, Hi, 0, 'As inner walls, at the outer wall thickness', 'The walls between flats of every floor, added up')
  addW('plinth', 'Plinth wall', P_S, tPlinth, false, 6, reps[0].P, M.PLINTH_H, 0, 'Plinth beam to the ground floor level' + (inp.system === 'aac' ? '; concrete block, because AAC must not stand in damp ground' : ''), 'The outer wall of the ground floor')
  if (inp.parapet) addW('parapet', 'Terrace parapet', S, tPar, thin, 4, topP, M.PARAPET_H, 0, 'All round the terrace', 'The outer wall of the top floor')
  if (inp.balconyWall && balcTotal > 0) addW('balcwall', 'Balcony edge walls', S, tPar, thin, 4, balcTotal * M.BALCONY.edge, M.PARAPET_H, 0, `${M.BALCONY.edge} m round each balcony (3.0 m wide, 1.5 m deep)`, `Balconies × ${M.BALCONY.edge} m`)
  if (hasMumty) addW('mumty', 'Terrace stair room', S, tExt, thin, 6, M.MUMTY.perimeter, M.MUMTY.height, dedFor('mumty'), 'A 3 × 3 m room, 2.4 m high', `Perimeter of the ${M.MUMTY.area} m² stair room`)
  same('Wall kinds', wall.map((w) => w.id).join(','), tr.classes.map((c) => c.id).join(','))
  wall.forEach((w, i) => {
    const c = tr.classes[i]
    if (!c) return
    cmp(`${w.name}: length`, w.len, c.len); cmp(`${w.name}: height`, w.h, c.h); cmp(`${w.name}: thickness`, w.t, c.t); cmp(`${w.name}: gross`, w.gross, c.gross); cmp(`${w.name}: openings out`, w.ded, c.ded)
    cmp(`${w.name}: net`, w.net, tr.unitRows[i].net); same(`${w.name}: mix`, String(w.mix), String(c.mix)); same(`${w.name}: thin`, String(w.thin), String(c.thin)); same(`${w.name}: material`, w.sys.key, c.sys.key); same(`${w.name}: rule`, w.rule, c.rule)
  })

  // worked wall: the outer walls
  const w0 = wall[0]
  L.value('Length of outer walls, all floors', w0.len, 'm', 2, R.plan, 'The total of the outer wall column in table 2.4')
  L.value('Height of outer walls', w0.h, 'm', 2, R.engine, 'From 1.2')
  const gross0 = L.calc('Gross area of outer walls', 'A = length × height', '{l:2} × {h:2}', { l: w0.len, h: w0.h }, (v) => v.l * v.h, { unit: 'm²', dp: 2, ref: R.area, ...X(tr.classes[0].gross) })
  const extOpen = ids.filter((id) => openN.get(id)!.where === 'ext')
  const ded0 = sumLine('Openings in outer walls, with lintels and sills', 'Σ n × w × (h + d + sill)', extOpen.map(outTot), 'm²', 2, { ref: R.area, note: 'From table 3.2, rows marked Outer wall', expect: tr.classes[0].ded, what: 'openings' })
  L.calc('Net area of outer walls', 'net = gross − openings, not below 0', '{g:2} − {d:2}, not below 0', { g: gross0, d: ded0 }, (v) => Math.max(0, v.g - v.d), { unit: 'm²', dp: 2, ref: R.area, result: true, ...X(tr.unitRows[0].net) })
  const wallWorked = blk('wall-1', '4.1 Worked example: the outer walls')

  const rtWalls = rt('walls')
  tieRows('Walls, measured', rtWalls?.rows.length ?? 0, wall.length)
  const wallRows: string[][] = []
  wall.forEach((w, i) => {
    wallRows.push([w.name, fixed(w.len, 1), fixed(w.h, 2), String(mm(w.t)), fixed(w.gross, 1), fixed(w.ded, 1), fixed(w.net, 1)])
    matchRow(`Walls table, ${w.name}`, rtWalls?.rows[i], [w.name, w.len, w.h, mm(w.t), w.gross, w.ded, w.net])
  })
  const totLen = sum(wall.map((w) => w.len)), totGross = sum(wall.map((w) => w.gross)), totDed = sum(wall.map((w) => w.ded)), totNet = sum(wall.map((w) => w.net))
  const wf = rtWalls?.foot
  tieNum('Walls: all walls, length', wf?.[1], totLen, 'm'); tieNum('Walls: all walls, gross area', wf?.[4], totGross, 'm²'); tieNum('Walls: openings out', wf?.[5], totDed, 'm²'); tieNum('Walls: all walls, net area', wf?.[6], totNet, 'm²')
  const wallTable: CalcTable = {
    head: ['Wall', 'Length (m)', 'Height (m)', 'Thickness (mm)', 'Gross (m²)', 'Openings out (m²)', 'Net (m²)'],
    rows: wallRows, foot: ['All walls', fixed(totLen, 1), '', '', fixed(totGross, 1), fixed(totDed, 1), fixed(totNet, 1)], num: [1, 2, 3, 4, 5, 6],
    note: 'Gross = length × height. Net = gross − openings (with their lintels and sills), and never below zero: if the openings are larger than the wall the tool counts no masonry in it. Parapet and balcony edge walls have no openings.',
  }
  const wallAll = blk('wall-2', '4.2 Every kind of wall', { table: wallTable })
  const wallRule: CalcTable = { head: ['Wall', 'Length is', 'Height is'], rows: wall.map((w) => [w.name, w.lenRule, w.rule]) }
  const wallRules = blk('wall-3', '4.3 Where each length and height comes from', { table: wallRule })
  sections.push({ id: 'walls', title: '4. Walls measured', intro: 'Each kind of wall is length × height, less the openings in it, measured as IS 1200 (Part 3):1976 does (the 1976 edition, since superseded by a 2026 edition: see the limits). The plinth, parapet, balcony edge walls and stair room use the fixed sizes shown, which are planning assumptions.', blocks: [wallWorked, wallAll, wallRules] })

  /* ═════════════ 5. Bricks or blocks and joint mortar ═════════════ */

  interface UnitW { w: WallC; n: number; units: number; withLoss: number; mortarM2: number; mortar: number; adhesive: number }
  const uw: UnitW[] = []

  /** The working for one wall kind; returns the figures. */
  const unitSteps = (w: WallC, expectRow: UnitRow, label: string): UnitW => {
    const s = w.sys, t = w.t
    let n: number
    let mortarM2 = 0
    L.say('Worked example', `${label}: ${s.label}, ${s.size}, wall ${mm(t)} mm thick.`)
    if (s.kind === 'brick') {
      L.input('Length × width × height of the brick', `${mm(s.L)} × ${mm(s.W)} × ${mm(s.H)} mm`, srcOf(s))
      const Ln = L.calc('Length with a joint', 'L + J', '{L:3} + {J:3}', { L: s.L, J: U.J }, (v) => v.L + v.J, { unit: 'm', dp: 3, ref: jointRef(s.key) })
      const Wn = L.calc('Width with a joint', 'W + J', '{W:3} + {J:3}', { W: s.W, J: U.J }, (v) => v.W + v.J, { unit: 'm', dp: 3, ref: jointRef(s.key) })
      const Hn = L.calc('Height with a joint', 'H + J', '{H:3} + {J:3}', { H: s.H, J: U.J }, (v) => v.H + v.J, { unit: 'm', dp: 3, ref: jointRef(s.key) })
      const Vn = L.calc('Volume of one brick with its joints', 'Vn = (L + J)(W + J)(H + J)', '{a:3} × {b:3} × {c:3}', { a: Ln, b: Wn, c: Hn }, (v) => v.a * v.b * v.c, { unit: 'm³', dp: 6, ref: 'Arithmetic: the brick and the mortar around it' })
      n = L.calc(`${cap(s.unitsLabel)} in 1 m² of wall`, 'n = (t + J) ÷ Vn', '({t:3} + {J:3}) ÷ {Vn:6}', { t, J: U.J, Vn }, (v) => (v.t + v.J) / v.Vn, { unit: `${s.unitsLabel} per m²`, dp: 2, ref: 'Derived from the unit size and joint (module method: nominal thickness ÷ nominal volume)', note: 'The nominal thickness is the wall plus one joint, so the count is one over the pitch of the brick in the two directions across the wall face', ...X(expectRow.upm2) })
      const Vb = L.calc(`Volume of the ${s.unitsLabel} in 1 m² of wall`, 'Vb = n × L × W × H', '{n:2} × {L:3} × {W:3} × {H:3}', { n, L: s.L, W: s.W, H: s.H }, (v) => v.n * v.L * v.W * v.H, { unit: 'm³', dp: 4, ref: 'Arithmetic' })
      mortarM2 = L.calc('Joint mortar in 1 m² of wall, exact joints', 'm = t − Vb', '{t:3} − {Vb:4}', { t, Vb }, (v) => Math.max(0, v.t - v.Vb), { unit: 'm³ per m²', dp: 4, ref: 'Derived: the true volume of the joints, not the nominal one (which would run about a quarter high)', note: 'The wall is taken at its actual thickness, t; the count above used the nominal thickness, t + J', ...X(U.jointMortarPerM2(s, t, false)) })
    } else if (w.thin) {
      L.input('Face of the block', `${mm(s.L)} × ${mm(s.H)} mm`, srcOf(s))
      const Ln = L.calc('Length with the adhesive bed', 'L + Jt', '{L:3} + {J:3}', { L: s.L, J: U.J_THIN }, (v) => v.L + v.J, { unit: 'm', dp: 3, ref: R.jointThin })
      const Hn = L.calc('Height with the adhesive bed', 'H + Jt', '{H:3} + {J:3}', { H: s.H, J: U.J_THIN }, (v) => v.H + v.J, { unit: 'm', dp: 3, ref: R.jointThin })
      n = L.calc(`${cap(s.unitsLabel)} in 1 m² of wall`, 'n = 1 ÷ ((L + Jt)(H + Jt))', '1 ÷ ({a:3} × {b:3})', { a: Ln, b: Hn }, (v) => 1 / (v.a * v.b), { unit: `${s.unitsLabel} per m²`, dp: 2, ref: 'Derived from the block face and the adhesive bed', ...X(expectRow.upm2) })
      L.pick('Joint mortar in 1 m² of wall', 'thin bed', 'none: the adhesive is counted by weight', R.jointThin)
    } else {
      L.input('Face of the block, nominal', `${mm(s.L)} × ${mm(s.H)} mm`, srcOf(s), s.short ? 'The nominal size includes the mortar joint' : undefined)
      n = L.calc(`${cap(s.unitsLabel)} in 1 m² of wall`, 'n = 1 ÷ (L × H)', '1 ÷ ({L:3} × {H:3})', { L: s.L, H: s.H }, (v) => 1 / (v.L * v.H), { unit: `${s.unitsLabel} per m²`, dp: 2, ref: R.nominal, note: inp.system === 'aac' ? 'AAC with a mortar joint is treated the same way as concrete block: the 600 × 200 face is the nominal size, the joint included' : 'Actual length and height are 10 mm short of the nominal size (IS 2185 (Part 1):2005 cl 4.2)', ...X(expectRow.upm2) })
      const ta = s.short ? L.calc('Actual thickness of the block', 'ta = t − J', '{t:3} − {J:3}', { t, J: U.J }, (v) => v.t - v.J, { unit: 'm', dp: 3, ref: 'IS 2185 (Part 1):2005 cl 4.2: a concrete block is 10 mm short of nominal in thickness too' }) : t
      const f = L.calc('Share of the wall that is block', 'f = n × (L − J)(H − J)', '{n:2} × ({L:3} − {J:3}) × ({H:3} − {J:3})', { n, L: s.L, H: s.H, J: U.J }, (v) => v.n * (v.L - v.J) * (v.H - v.J), { dp: 4, ref: 'Arithmetic: block face as a share of the nominal face' })
      mortarM2 = L.calc('Joint mortar in 1 m² of wall, exact joints', s.short ? 'm = ta × (1 − f)' : 'm = t × (1 − f)', '{ta:3} × (1 − {f:4})', { ta, f }, (v) => Math.max(0, v.ta * (1 - v.f)), { unit: 'm³ per m²', dp: 4, ref: 'Derived: the true volume of the joints', ...X(U.jointMortarPerM2(s, t, false)) })
    }
    const mortarIn = w.thin ? 0 : L.calc('Joint mortar with the allowance for waste', 'm′ = m × 1.25', '{m:4} × {a:2}', { m: mortarM2, a: U.MORTAR_ALLOW }, (v) => v.m * v.a, { unit: 'm³ per m²', dp: 4, ref: R.mortarAllow, note: 'For uneven units, frogs, droppings and mortar left on the board' })
    if (s.kind === 'brick' && !w.thin) {
      const perM3 = L.calc('Joint mortar in 1 m³ of wall, with the allowance', 'm′ ÷ t', '{m:4} ÷ {t:3}', { m: mortarIn, t }, (v) => v.m / v.t, { unit: 'm³ per m³', dp: 3, ref: 'Arithmetic', note: 'The mortar as a share of the volume of the wall' })
      const half = mortarOf(s, s.int) * U.MORTAR_ALLOW / s.int
      const exactNominal = (t + U.J) - n * s.L * s.W * s.H
      L.say('Joint mortar: a check against a published table', `The count uses the nominal thickness (${fixed(t + U.J, 3)} m) but the exact joint volume uses the actual thickness (${fixed(t, 3)} m): ${fixed(mortarM2, 4)} m³ per m² against ${fixed(exactNominal, 4)} m³ per m² on the nominal thickness. The ${round((U.MORTAR_ALLOW - 1) * 100)}% allowance then brings the figure up to about the nominal one. The result is ${fixed(perM3, 3)} m³ of mortar for each m³ of ${mm(t)} mm wall and ${fixed(half, 3)} for each m³ of ${mm(s.int)} mm wall. A published table based on the CPWD rates implies about 0.25 to 0.27 for standard 230 mm brickwork. If that table is right, the joint mortar here is low, by up to about a quarter in half-brick walls. The method is unchanged; check the mortar against what your mason uses.`, `${R.dar}, Vol 1 brickwork items, as reported by a published table; not read in full by the tool`)
    }
    const net = w.net
    const units = L.calc(`${cap(s.unitsLabel)} needed`, 'N = net area × n', '{A:2} × {n:2}', { A: net, n }, (v) => v.A * v.n, { unit: s.unitsLabel, dp: 1, ref: 'Arithmetic', ...X(expectRow.units) })
    const withLoss = L.calc(`With ${round(s.loss * 100)}% for breakage and cutting`, 'N × (1 + b)', '{N:1} × (1 + {b:2})', { N: units, b: s.loss }, (v) => v.N * (1 + v.b), { unit: s.unitsLabel, dp: 1, ref: R.breakage, result: true, ...X(expectRow.withLoss) })
    const mortar = w.thin ? 0 : L.calc('Joint mortar needed', 'M = net area × m′', '{A:2} × {m:4}', { A: net, m: mortarIn }, (v) => v.A * v.m, { unit: 'm³', dp: 2, ref: R.mortarAllow, result: true, note: 'm′ is the mortar per m² with the allowance, from the line above (it already includes the 25%)', ...X(expectRow.mortar) })
    let adhesive = 0
    if (w.thin) {
      adhesive = L.calc('Thin-bed adhesive needed', 'kg = net area × t × 33 kg per m³ of wall', '{A:2} × {t:3} × {k:0}', { A: net, t, k: U.ADHESIVE_KG_PER_M3 }, (v) => v.A * v.t * v.k, { unit: 'kg', dp: 1, ref: 'About 33 kg for every m³ of wall (a 3 mm joint with some waste); makers’ coverage works out between 24 and 40 kg per m³', result: true, ...X(expectRow.adhesive) })
    }
    return { w, n, units, withLoss, mortarM2: mortarIn, mortar, adhesive }
  }

  // unit and joint block
  L.input('Unit', `${S.label}, ${S.size}`, srcOf(S))
  L.value('Joint', thin ? U.J_THIN * 1000 : U.J * 1000, 'mm', 0, thin ? R.jointThin : jointRef(S.key), thin ? 'A thin bed of block adhesive' : 'Bed and perpend joints alike')
  L.value('Allowance on the exact joint mortar', (U.MORTAR_ALLOW - 1) * 100, '%', 0, R.mortarAllow)
  L.value('Breakage and cutting', S.loss * 100, '%', 0, R.breakage)
  let sn = 0
  const sTitle = (t: string) => `5.${++sn} ${t}`
  const unitIntro = blk('unit-0', sTitle('The unit, the joint and the allowances'))

  const wUnit0 = unitSteps(w0, tr.unitRows[0], 'Outer walls')
  uw.push(wUnit0)
  const unitWorked = blk('unit-1', sTitle('Worked example: the outer walls'))
  let plinthWorked: CalcBlock | null = null
  const wPlinth = wall.find((w) => w.id === 'plinth')!
  if (wPlinth.sys.key !== w0.sys.key) {
    const wu = unitSteps(wPlinth, tr.unitRows[wall.indexOf(wPlinth)], 'Plinth wall')
    plinthWorked = blk('unit-2', sTitle('Worked example: the plinth wall, which is a different material'))
    void wu
  }

  // all walls
  wall.forEach((w, i) => {
    if (i === 0) return
    // silent: compute with plain arithmetic by the same formulas
    const row = tr.unitRows[i]
    const s = w.sys
    const n = unitsOf(s, w.t, w.thin)
    const mortarM2 = w.thin ? 0 : mortarOf(s, w.t)
    const units = w.net * n
    uw.push({ w, n, units, withLoss: units * (1 + s.loss), mortarM2: mortarM2 * U.MORTAR_ALLOW, mortar: w.net * mortarM2 * U.MORTAR_ALLOW, adhesive: w.thin ? w.net * w.t * U.ADHESIVE_KG_PER_M3 : 0 })
    cmp(`${w.name}: units per m²`, n, row.upm2); cmp(`${w.name}: units`, units, row.units); cmp(`${w.name}: with breakage`, units * (1 + s.loss), row.withLoss)
    cmp(`${w.name}: joint mortar`, w.net * mortarM2 * U.MORTAR_ALLOW, row.mortar); cmp(`${w.name}: adhesive`, w.thin ? w.net * w.t * U.ADHESIVE_KG_PER_M3 : 0, row.adhesive)
  })
  function unitsOf(s: M.Sys, t: number, th: boolean): number {
    if (s.kind === 'brick') return (t + U.J) / ((s.L + U.J) * (s.W + U.J) * (s.H + U.J))
    return th ? 1 / ((s.L + U.J_THIN) * (s.H + U.J_THIN)) : 1 / (s.L * s.H)
  }
  function mortarOf(s: M.Sys, t: number): number {
    const n = unitsOf(s, t, false)
    if (s.kind === 'brick') return Math.max(0, t - n * s.L * s.W * s.H)
    const ta = s.short ? t - U.J : t
    return Math.max(0, ta * (1 - n * (s.L - U.J) * (s.H - U.J)))
  }
  // the worked rows must be the same as what the plain arithmetic gives
  cmp(`${w0.name}: units per m² (plain arithmetic)`, unitsOf(w0.sys, w0.t, w0.thin), wUnit0.n)
  cmp(`${w0.name}: mortar per m² (plain arithmetic)`, w0.thin ? 0 : mortarOf(w0.sys, w0.t) * U.MORTAR_ALLOW, wUnit0.mortarM2)

  // per m² table
  const perM2Rows = uw.map((u) => [u.w.name, String(mm(u.w.t)), u.w.sys.label, fixed(u.n, 2), u.w.thin ? '—' : fixed(u.mortarM2 / U.MORTAR_ALLOW, 4), u.w.thin ? '—' : fixed(u.mortarM2, 4), u.w.thin ? 'Adhesive' : `1:${u.w.mix}`])
  const perM2Table: CalcTable = {
    head: ['Wall', 'Thickness (mm)', 'Unit', `${cap(S.unitsLabel)} per m²`, 'Joint mortar per m², exact (m³)', `Joint mortar per m², with ${round((U.MORTAR_ALLOW - 1) * 100)}% (m³)`, 'Mix'],
    rows: perM2Rows, num: [1, 3, 4, 5],
    note: 'Per square metre of wall face, before breakage. The count does not change with the mortar allowance; the allowance is added to the mortar only.',
  }
  const perM2Block = blk('unit-3', sTitle('Units and joint mortar per m², for each kind of wall'), { table: perM2Table })

  // totals table (tied)
  const rtUnits = rt('units')
  tieRows(`${S.kind === 'brick' ? 'Bricks' : 'Blocks'} and joint mortar`, rtUnits?.rows.length ?? 0, uw.length)
  const unitRowsOut: string[][] = []
  uw.forEach((u, i) => {
    unitRowsOut.push([u.w.name, fixed(u.w.net, 1), fixed(u.n, 1), fixed(u.units, 0), fixed(u.withLoss, 0), u.w.thin ? '—' : fixed(u.mortar, 2), u.w.thin ? 'Adhesive' : `1:${u.w.mix}`])
    matchRow(`Units table, ${u.w.name}`, rtUnits?.rows[i], [u.w.name, u.w.net, u.n, u.units, u.withLoss, u.w.thin ? '—' : u.mortar, u.w.thin ? 'Adhesive' : `1:${u.w.mix}`])
  })
  const tNet = sum(uw.map((u) => u.w.net)), tUnits = sum(uw.map((u) => u.units)), tLoss = sum(uw.map((u) => u.withLoss)), tMortar = sum(uw.map((u) => u.mortar)), tAdh = sum(uw.map((u) => u.adhesive))
  const uf = rtUnits?.foot
  tieNum('Units table: net area', uf?.[1], tNet, 'm²'); tieNum('Units table: number', uf?.[3], tUnits, S.unitsLabel); tieNum(`Units table: with ${round(S.loss * 100)}% breakage`, uf?.[4], tLoss, S.unitsLabel); tieNum('Units table: joint mortar', uf?.[5], tMortar, 'm³')
  cmp('Joint mortar, all walls', tMortar, sum(tr.unitRows.map((u) => u.mortar))); cmp('Adhesive, all walls', tAdh, tr.adhesiveKg)
  const unitTable: CalcTable = {
    head: ['Wall', 'Net area (m²)', `${cap(S.unitsLabel)} per m²`, 'Number', `With ${round(S.loss * 100)}% breakage`, 'Joint mortar (m³)', 'Mix'],
    rows: unitRowsOut, foot: ['All walls', fixed(tNet, 1), '', fixed(tUnits, 0), fixed(tLoss, 0), fixed(tMortar, 2), ''], num: [1, 2, 3, 4, 5],
    note: 'Number = net area × per m². The breakage allowance is added wall by wall. These totals are rounded up to the order size in section 9.',
  }
  const unitAll = blk('unit-4', sTitle('Units and joint mortar for every wall'), { table: unitTable })

  // adhesive
  const unitBlocks: CalcBlock[] = [unitIntro, unitWorked]
  if (plinthWorked) unitBlocks.push(plinthWorked)
  unitBlocks.push(perM2Block, unitAll)
  if (thin) {
    const rtAdh = rt('adh')
    const adhKg = tAdh
    const adhBags = Math.ceil(adhKg / U.ADHESIVE_BAG_KG)
    L.calc('Adhesive in all the AAC walls', 'Σ net area × t × 33', 'sum of the thin-bed walls in the section 5 table of every wall', {}, () => adhKg, { unit: 'kg', dp: 1, ref: 'About 33 kg for every m³ of wall; follow your product sheet when you order', ...X(tr.adhesiveKg) })
    const bags = L.calc('Bags of adhesive', 'bags = kg ÷ 40, rounded up', '{k:1} ÷ {b:0}, rounded up', { k: adhKg, b: U.ADHESIVE_BAG_KG }, (v) => Math.ceil(v.k / v.b), { unit: 'bags', dp: 0, ref: R.engine, result: true, ...X(tr.adhesiveBags) })
    matchRow('Adhesive table', rtAdh?.rows[0], ['Thin-bed adhesive for AAC', adhKg, adhBags])
    tieNum('Adhesive: weight', rtAdh?.rows[0]?.[1], adhKg, 'kg'); tieNum('Adhesive: bags of 40 kg', rtAdh?.rows[0]?.[2], bags, 'bags')
    unitBlocks.push(blk('unit-5', sTitle('Thin-bed adhesive (AAC)')))
  }
  sections.push({ id: 'units', title: `5. ${S.kind === 'brick' ? 'Bricks' : 'Blocks'} and joint mortar`, intro: `${S.label} (${S.size}). The count per square metre follows from the size of the unit and the joint; the joint mortar is the true volume of the joints, plus an allowance.`, blocks: unitBlocks })

  /* ═════════════ 6. Plaster ═════════════ */

  L.say('Rule 1', `An opening of ${M.PLASTER_RULE.noDeductM2} m² or less is not deducted from plaster, and no reveals are added.`, `IS 1200 (Part 12):1976 cl 3.8.1(a) (${ED76})`)
  L.say('Rule 2', `An opening over ${M.PLASTER_RULE.noDeductM2} m² and up to ${M.PLASTER_RULE.bothFacesM2} m² comes off once, no reveals added. In an inner wall (plastered alike on both faces) it comes off one face. In an outer wall, where the two faces are plastered differently and the reveals are taken as equal, half comes off each face.`, `IS 1200 (Part 12):1976 cl 3.8.1(b)(1) and (2) (${ED76})`)
  L.say('Rule 3', `An opening over ${M.PLASTER_RULE.bothFacesM2} m² comes off each face and its jambs and soffit are measured and added. The tool adds one set of reveals, as width + 2 × height, deep by the wall thickness less a ${mm(M.PLASTER_RULE.frameM)} mm frame (assumed).`, `IS 1200 (Part 12):1976 cl 3.8.2 (${ED76})`)
  L.say('Rule 4', 'Wall plaster is measured between walls for length, and from the floor to the ceiling for height.', `IS 1200 (Part 12):1976 cl 3.12 (${ED76})`)
  L.say('Rule 5', 'The tool takes the plaster of columns, beams and slab edges as part of the wall at full height and adds nothing for them. The inside half of an outer-wall opening is deducted even where the outside is left bare; cl 3.8.1(b)(3) of the 1976 edition would deduct nothing there if the reveals are equal, so the plaster is slightly under-counted in that case.', R.engine)
  const plRulesBlock = blk('pl-0', '6.1 How plaster is measured')

  // deductions by opening
  interface Ded { id: M.OpenId; inner: number; inSide: number; outSide: number; reveals: number }
  const deds: Ded[] = ids.map((id) => {
    const o = openN.get(id)!
    const d = M.OPEN[id]
    const a = M.oArea(id)
    const x: Ded = { id, inner: 0, inSide: 0, outSide: 0, reveals: 0 }
    if (o.where === 'int') {
      if (a > M.PLASTER_RULE.bothFacesM2) x.inner = 2 * o.n * a
      else if (a > M.PLASTER_RULE.noDeductM2) x.inner = o.n * a
    } else if (a > M.PLASTER_RULE.bothFacesM2) {
      x.inSide = o.n * a; x.outSide = o.n * a; x.reveals = o.n * (d.w + 2 * d.h) * Math.max(0, tExt - M.PLASTER_RULE.frameM)
    } else if (a > M.PLASTER_RULE.noDeductM2) {
      x.inSide = o.n * a * M.PLASTER_RULE.halfFace; x.outSide = o.n * a * M.PLASTER_RULE.halfFace
    }
    return x
  })
  const dedInt = sum(deds.map((x) => x.inner)), dedInSide = sum(deds.map((x) => x.inSide)), dedOutSide = sum(deds.map((x) => x.outSide)), reveals = sum(deds.map((x) => x.reveals))
  cmp('Plaster taken off inner walls', dedInt, tr.dedInt); cmp('Plaster taken off the inside of outer walls', dedInSide, tr.dedInSide); cmp('Plaster taken off the outside', dedOutSide, tr.dedOutSide); cmp('Reveals added', reveals, tr.reveals)
  const dedTable: CalcTable = {
    head: ['Opening', 'Number', 'Area each (m²)', 'Rule', 'Off inner walls (m²)', 'Off inside of outer walls (m²)', 'Off outside (m²)', 'Reveals added (m²)'],
    rows: deds.map((x) => [M.OPEN[x.id].name, String(openN.get(x.id)!.n), fixed(M.oArea(x.id), 2), planRule(M.oArea(x.id)), fixed(x.inner, 2), fixed(x.inSide, 2), fixed(x.outSide, 2), fixed(x.reveals, 2)]),
    foot: ['All openings', '', '', '', fixed(dedInt, 2), fixed(dedInSide, 2), fixed(dedOutSide, 2), fixed(reveals, 2)],
    num: [1, 2, 4, 5, 6, 7],
    note: 'The inside deduction of an outer-wall opening is taken even when the outside is left unplastered.',
  }
  const dedBlock = blk('pl-1', '6.2 What the openings take off the plaster', { table: dedTable })

  // surfaces
  const intFaces = L.calc('Both faces of inner walls and of walls between flats', 'Σ 2 × length × Hc', '2 × {i:2} × {h:2} + 2 × {p:2} × {h:2}', { i: sumInt, p: sumParty, h: Hc }, (v) => 2 * v.i * v.h + 2 * v.p * v.h, { unit: 'm²', dp: 2, ref: R.plaster, ...X(tr.intFaces) })
  const inInner = L.calc('Inside face of the outer walls and the stair room', 'Σ P × Hc + stair room', '{P:2} × {h:2} + {m:2} × {mh:2}', { P: sumP, h: Hc, m: hasMumty ? M.MUMTY.perimeter : 0, mh: M.MUMTY.height }, (v) => v.P * v.h + v.m * v.mh, { unit: 'm²', dp: 2, ref: R.plaster, ...X(tr.inInner) })
  const inGross = L.calc('Inside plaster, measured', 'both faces + inside of outer walls + reveals', '{a:2} + {b:2} + {c:2}', { a: intFaces, b: inInner, c: reveals }, (v) => v.a + v.b + v.c, { unit: 'm²', dp: 2, ref: R.plaster })
  const inDed = L.calc('Inside plaster, taken off', 'inner walls + inside of outer walls', '{a:2} + {b:2}', { a: dedInt, b: dedInSide }, (v) => v.a + v.b, { unit: 'm²', dp: 2, ref: R.plaster })
  const inNet = L.calc('Inside plaster', 'measured − taken off, not below 0', '{a:2} − {b:2}, not below 0', { a: inGross, b: inDed }, (v) => Math.max(0, v.a - v.b), { unit: 'm²', dp: 2, ref: R.plaster, result: true, ...X(tr.plRows[0].net) })

  const plSpecs: { surface: string; gross: number; ded: number; net: number; spec: M.Spec }[] = []
  plSpecs.push({ surface: 'Inner walls, both faces, and the inside of the outer walls', gross: inGross, ded: inDed, net: inNet, spec: M.SPEC.inside })
  const ceilArea = inp.plasterCeil ? sumNet + balcTotal * M.BALCONY.area + (hasMumty ? M.MUMTY.area : 0) : 0
  cmp('Ceiling area', ceilArea, tr.ceilArea)
  if (inp.plasterCeil && ceilArea > 0) {
    const ca = L.calc('Ceilings, with the balcony undersides and the stair room', 'floor inside the walls + balconies × area + stair room', '{n:2} + {b:0} × {ba:1} + {m:1}', { n: sumNet, b: balcTotal, ba: M.BALCONY.area, m: hasMumty ? M.MUMTY.area : 0 }, (v) => v.n + v.b * v.ba + v.m, { unit: 'm²', dp: 2, ref: R.plaster, result: true, note: 'The ceiling is the floor area inside the walls; a balcony underside is 3.0 × 1.5 m', ...X(tr.ceilArea) })
    plSpecs.push({ surface: 'Ceilings, with the balcony undersides', gross: ca, ded: 0, net: ca, spec: M.SPEC.ceiling })
  }
  const outFace = plans.reduce((s, p) => s + p.P * H, 0) + plans[0].P * M.PLINTH_ABOVE + (hasMumty ? M.MUMTY.perimeter * (M.MUMTY.height + M.SLAB_T) : 0)
  cmp('Outside face', outFace, tr.outFace)
  const parapetFaces = inp.parapet ? topP * (2 * M.PARAPET_H + tPar) : 0
  const balcFaces = inp.balconyWall && balcTotal > 0 ? balcTotal * M.BALCONY.edge * (2 * M.PARAPET_H + tPar) : 0
  cmp('Parapet faces', parapetFaces, tr.parapetFaces); cmp('Balcony edge faces', balcFaces, tr.balcFaces)
  if (inp.plasterExt !== 'none') {
    const extSpec = inp.plasterExt === 'single' ? M.SPEC.single : M.SPEC.twocoat
    const of = L.calc('Outside of the building, ground to terrace', 'Σ P × H + plinth above ground + stair room', '{P:2} × {H:2} + {p0:2} × {pa:2} + {m:2} × ({mh:2} + {st:2})', { P: sumP, H, p0: reps[0].P, pa: M.PLINTH_ABOVE, m: hasMumty ? M.MUMTY.perimeter : 0, mh: M.MUMTY.height, st: M.SLAB_T }, (v) => v.P * v.H + v.p0 * v.pa + v.m * (v.mh + v.st), { unit: 'm²', dp: 2, ref: R.plaster, note: 'Every floor is taken at the full floor-to-floor height, so beams and slab edges are plastered in the same measure', ...X(tr.outFace) })
    const on = L.calc('Outside plaster', 'measured − taken off, not below 0', '{a:2} − {b:2}, not below 0', { a: of, b: dedOutSide }, (v) => Math.max(0, v.a - v.b), { unit: 'm²', dp: 2, ref: R.plaster, result: true, ...X(tr.plRows[plSpecs.length].net) })
    plSpecs.push({ surface: 'Outside of the building, from ground to terrace', gross: of, ded: dedOutSide, net: on, spec: extSpec })
    if (parapetFaces > 0) {
      const pf = L.calc('Terrace parapet, both faces and the top', 'P × (2 × height + thickness)', '{P:2} × (2 × {h:2} + {t:3})', { P: topP, h: M.PARAPET_H, t: tPar }, (v) => v.P * (2 * v.h + v.t), { unit: 'm²', dp: 2, ref: R.plaster, result: true, ...X(tr.parapetFaces) })
      plSpecs.push({ surface: 'Terrace parapet, both faces and the top', gross: pf, ded: 0, net: pf, spec: extSpec })
    }
    if (balcFaces > 0) {
      const bf = L.calc('Balcony edge walls, both faces and the top', 'edge length × (2 × height + thickness)', '{e:2} × (2 × {h:2} + {t:3})', { e: balcTotal * M.BALCONY.edge, h: M.PARAPET_H, t: tPar }, (v) => v.e * (2 * v.h + v.t), { unit: 'm²', dp: 2, ref: R.plaster, result: true, ...X(tr.balcFaces) })
      plSpecs.push({ surface: 'Balcony edge walls, both faces and the top', gross: bf, ded: 0, net: bf, spec: extSpec })
    }
  }
  const plasterTotal = sum(plSpecs.map((r) => r.net))
  cmp('Plaster, all surfaces', plasterTotal, tr.plasterTotal)
  const plSurf = blk('pl-2', '6.3 The surfaces plastered')

  // the DAR items
  const specsUsed = [...new Set(plSpecs.map((r) => r.spec))]
  const darRows: string[][] = []
  for (const sp of specsUsed) {
    for (const l of sp.layers) {
      const yieldF = L.calc(`${sp.label}: yield on volume`, 'mortar per m² ÷ thickness', '{m:4} ÷ {t:3}', { m: l.mortar, t: l.t / 1000 }, (v) => v.m / v.t, { dp: 3, ref: `${R.dar}, Vol 2, ${sp.ref}` })
      darRows.push([`${sp.ref}`, `${l.t} mm`, `1:${l.mix}`, fixed(l.mortar * 10, 3), fixed(l.mortar, 4), fixed(yieldF, 2)])
    }
  }
  L.take()
  const darTable: CalcTable = {
    head: ['CPWD DAR item', 'Coat', 'Mix', 'Mortar per 10 m² (m³)', 'Mortar per m² (m³)', 'Mortar ÷ nominal volume'],
    rows: darRows, num: [3, 4, 5],
    note: 'The CPWD Delhi Analysis of Rates 2014 (Vol 2, sub-head 13) gives the mortar for 10 m² of each plaster item; the tool divides it by 10. The last column is the allowance inside that figure for uneven surfaces and waste (the nominal volume is area × thickness). The item numbers are as the engine cites them.',
  }
  const darBlock = blk('pl-3', '6.4 Mortar per m² of plaster (CPWD analysis-of-rates basis)', { table: darTable })

  const rtPl = rt('plaster')
  tieRows('Plaster', rtPl?.rows.length ?? 0, plSpecs.length)
  const plRowsOut: string[][] = []
  plSpecs.forEach((r, i) => {
    const mpm = sum(r.spec.layers.map((l) => l.mortar))
    plRowsOut.push([r.surface, fixed(r.gross, 1), fixed(r.ded, 1), fixed(r.net, 1), r.spec.label, fixed(mpm, 4), fixed(r.net * mpm, 2)])
    matchRow(`Plaster table, ${r.surface}`, rtPl?.rows[i], [r.surface, r.gross, r.ded, r.net, r.spec.label, r.net * mpm])
  })
  const pGross = sum(plSpecs.map((r) => r.gross)), pDed = sum(plSpecs.map((r) => r.ded)), pMortar = sum(plSpecs.map((r) => r.net * sum(r.spec.layers.map((l) => l.mortar))))
  const pf = rtPl?.foot
  tieNum('Plaster: measured', pf?.[1], pGross, 'm²'); tieNum('Plaster: taken off', pf?.[2], pDed, 'm²'); tieNum('Plaster: area to plaster', pf?.[3], plasterTotal, 'm²'); tieNum('Plaster: mortar', pf?.[5], pMortar, 'm³')
  const plTable: CalcTable = {
    head: ['Surface', 'Measured (m²)', 'Out (m²)', 'Plaster (m²)', 'Coat and mix', 'Mortar per m² (m³)', 'Mortar (m³)'],
    rows: plRowsOut, foot: ['All plaster', fixed(pGross, 1), fixed(pDed, 1), fixed(plasterTotal, 1), '', '', fixed(pMortar, 2)], num: [1, 2, 3, 5, 6],
    note: 'Mortar = plaster area × mortar per m² (table 6.4).',
  }
  const plAll = blk('pl-4', '6.5 Plaster and its mortar', { table: plTable })
  plSpecs.forEach((r, i) => { const e = tr.plRows[i]; if (e) { cmp(`${r.surface}: gross`, r.gross, e.gross); cmp(`${r.surface}: out`, r.ded, e.ded); cmp(`${r.surface}: plaster`, r.net, e.net) } })
  same('Plaster surfaces', String(plSpecs.length), String(tr.plRows.length))
  sections.push({ id: 'plaster', title: '6. Plaster', intro: 'Measured to IS 1200 (Part 12):1976: the plaster area is the area of the surfaces less what the openings take off. BIS lists a 2026 edition of Part 12 that supersedes the 1976 one; the rules in 6.1 and their limits of 0.5 m² and 3 m² are the 1976 ones and have not been checked against the 2026 edition. The mortar in the plaster comes from the CPWD analysis-of-rates yield for each plaster item.', blocks: [plRulesBlock, dedBlock, plSurf, darBlock, plAll] })

  /* ═════════════ 7. Lintels and sills ═════════════ */

  const kgPerM = (d: number) => (Math.PI / 4) * d * d * 0.00785
  const LS = M.LINTEL_STEEL
  const bars: [string, number, number][] = [['two bottom bars', M.LINTEL_BAR_MM.bottom, LS.bottomKgPerM], ['two top bars', M.LINTEL_BAR_MM.top, LS.topKgPerM], ['stirrups', M.LINTEL_BAR_MM.stirrup, LS.stirrupKgPerM]]
  for (const [nm, d, eng] of bars) {
    L.calc(`Mass of the ${nm}, ${d} mm, per metre`, 'π/4 × d² × 0.00785', 'π ÷ 4 × {d:0}² × {r:5}', { d, r: 0.00785 }, (v) => (Math.PI / 4) * v.d * v.d * v.r, { unit: 'kg/m', dp: 3, ref: 'IS 1786:2008 cl 3.6 (nominal mass, density 0.00785 kg/mm²/m) and Table 1', note: `The tool uses the tabulated ${fixed(eng, 3)} kg/m`, expect: eng, tol: 0.0005 + 1e-9 })
  }
  void kgPerM
  const steelBlock = blk('lin-0', '7.1 Steel in a lintel: mass per metre of bar')

  interface LintelW { id: M.OpenId; n: number; t: number; d: number; L: number; vol: number; steel: number; sills: number; b: number; nStir: number; stirLen: number }
  const lin: LintelW[] = ids.map((id) => {
    const o = openN.get(id)!
    const def = M.OPEN[id]
    const t = o.where === 'int' ? tInt : tExt
    const d = M.lintelDepth(def.w)
    const b = M.lintelBearing(def.w)
    const Lm = def.w + 2 * b
    const vol = Lm * t * d
    const nStir = Math.ceil(Lm / LS.stirrupSpacing) + 1
    const stirLen = 2 * (Math.max(LS.stirrupMinWidth, t - LS.stirrupCover) + (d - LS.stirrupCover)) + LS.stirrupHook
    const steel = LS.bottomBars * Lm * LS.bottomKgPerM + LS.topBars * (Lm - LS.topShort) * LS.topKgPerM + nStir * stirLen * LS.stirrupKgPerM
    return { id, n: o.n, t, d, L: Lm, vol, steel, sills: def.win ? o.n : 0, b, nStir, stirLen }
  })
  same('Lintel openings', lin.map((x) => x.id).join(','), tr.lintelRows.map((x) => x.id).join(','))
  lin.forEach((x, i) => { const e = tr.lintelRows[i]; if (!e) return; cmp(`${M.OPEN[x.id].name}: lintel length`, x.L, e.L); cmp(`${M.OPEN[x.id].name}: lintel volume`, x.vol, e.vol); cmp(`${M.OPEN[x.id].name}: lintel steel`, x.steel, e.steel); cmp(`${M.OPEN[x.id].name}: lintel thickness`, x.t, e.t); cmp(`${M.OPEN[x.id].name}: lintel depth`, x.d, e.d) })

  // worked lintel: the one with the most concrete
  const rep = lin.reduce((a, b) => (b.n * b.vol > a.n * a.vol ? b : a), lin[0])
  {
    const def = M.OPEN[rep.id]
    const er = tr.lintelRows[lin.indexOf(rep)]
    L.say('Worked example', `${def.name}: the lintel that takes most concrete, ${rep.n} of them.`)
    L.value('Width of the opening', def.w, 'm', 2, R.assumed)
    L.value('Thickness of the wall', rep.t * 1000, 'mm', 0, R.engine, openN.get(rep.id)!.where === 'int' ? 'An inner wall' : 'An outer wall')
    L.pick('Depth of the lintel', 'd = 0.15 m if w ≤ 1.5 m, otherwise 0.20 m', `${fixed(rep.d, 2)} m`, R.assumed)
    const b = L.calc('Bearing on the wall at each end', 'b = larger of 0.15 m and w ÷ 10', 'max({a:2}, {w:2} ÷ 10)', { a: 0.15, w: def.w }, (v) => Math.max(v.a, v.w / 10), { unit: 'm', dp: 3, ref: 'IS 1905:1987 cl 5.3.3 asks for 90 mm or a tenth of the span, whichever is more; the tool uses 150 mm as its minimum', ...X(M.lintelBearing(def.w)) })
    const Lm = L.calc('Length of the lintel', 'L = w + 2 b', '{w:2} + 2 × {b:3}', { w: def.w, b }, (v) => v.w + 2 * v.b, { unit: 'm', dp: 3, ref: R.engine, ...X(er.L) })
    const vol = L.calc('Concrete in one lintel', 'V = L × t × d', '{L:3} × {t:3} × {d:2}', { L: Lm, t: rep.t, d: rep.d }, (v) => v.L * v.t * v.d, { unit: 'm³', dp: 4, ref: 'Arithmetic', note: 'M20 concrete (section 8)', ...X(er.vol) })
    const nS = L.calc('Number of stirrups', 'ns = L ÷ 0.15, rounded up, + 1', '{L:3} ÷ {s:2}, rounded up, + 1', { L: Lm, s: LS.stirrupSpacing }, (v) => Math.ceil(v.L / v.s) + 1, { dp: 0, ref: R.assumed + ': 6 mm stirrups at 150 mm', note: 'Rounded up to a whole stirrup' })
    const sl = L.calc('Length of one stirrup', 'ls = 2 (b′ + d′) + hooks', '2 × (max({mw:2}, {t:3} − {c:2}) + ({d:2} − {c:2})) + {hk:2}', { mw: LS.stirrupMinWidth, t: rep.t, c: LS.stirrupCover, d: rep.d, hk: LS.stirrupHook }, (v) => 2 * (Math.max(v.mw, v.t - v.c) + (v.d - v.c)) + v.hk, { unit: 'm', dp: 3, ref: R.assumed, note: '25 mm cover on each side, and 100 mm for the hooks' })
    const s1 = L.calc('Two 10 mm bars at the bottom', '2 × L × 0.617', '{n:0} × {L:3} × {m:3}', { n: LS.bottomBars, L: Lm, m: LS.bottomKgPerM }, (v) => v.n * v.L * v.m, { unit: 'kg', dp: 3, ref: R.assumed + ': not a design of any lintel' })
    const s2 = L.calc('Two 8 mm bars at the top', '2 × (L − 0.05) × 0.395', '{n:0} × ({L:3} − {s:2}) × {m:3}', { n: LS.topBars, L: Lm, s: LS.topShort, m: LS.topKgPerM }, (v) => v.n * (v.L - v.s) * v.m, { unit: 'kg', dp: 3, ref: R.assumed, note: 'Stopped 25 mm short of each end' })
    const s3 = L.calc('Stirrups', 'ns × ls × 0.222', '{n:0} × {l:3} × {m:3}', { n: nS, l: sl, m: LS.stirrupKgPerM }, (v) => v.n * v.l * v.m, { unit: 'kg', dp: 3, ref: R.assumed })
    const st = L.calc('Steel in one lintel', 'sum of the three', '{a:3} + {b:3} + {c:3}', { a: s1, b: s2, c: s3 }, (v) => v.a + v.b + v.c, { unit: 'kg', dp: 3, ref: 'Arithmetic', ...X(er.steel) })
    L.calc(`Concrete in all ${rep.n} lintels`, 'n × V', '{n:0} × {v:4}', { n: rep.n, v: vol }, (v) => v.n * v.v, { unit: 'm³', dp: 3, ref: 'Arithmetic', result: true, ...X(rep.n * er.vol) })
    L.calc(`Steel in all ${rep.n} lintels`, 'n × steel', '{n:0} × {s:3}', { n: rep.n, s: st }, (v) => v.n * v.s, { unit: 'kg', dp: 1, ref: 'Arithmetic', result: true, ...X(rep.n * er.steel) })
  }
  const linWorked = blk('lin-1', '7.2 Worked example: one lintel')

  const rtLin = rt('lintels')
  tieRows('Lintels and sills', rtLin?.rows.length ?? 0, lin.length)
  const linRows: string[][] = []
  lin.forEach((x, i) => {
    linRows.push([M.OPEN[x.id].name, String(x.n), fixed(x.L, 2), `${mm(x.t)} × ${mm(x.d)}`, fixed(x.n * x.vol, 3), fixed(x.n * x.steel, 1)])
    matchRow(`Lintels table, ${M.OPEN[x.id].name}`, rtLin?.rows[i], [M.OPEN[x.id].name, x.n, x.L, `${mm(x.t)} × ${mm(x.d)}`, x.n * x.vol, x.n * x.steel])
  })
  const lintelN = sum(lin.map((x) => x.n)), lintelLen = sum(lin.map((x) => x.n * x.L)), lintelVol = sum(lin.map((x) => x.n * x.vol)), lintelSteel = sum(lin.map((x) => x.n * x.steel))
  cmp('Lintels: number', lintelN, tr.lintelN); cmp('Lintels: length', lintelLen, tr.lintelLen); cmp('Lintels: concrete', lintelVol, tr.lintelVol); cmp('Lintels: steel', lintelSteel, tr.lintelSteel)
  const lf = rtLin?.foot
  tieNum('Lintels: number', lf?.[1], lintelN, 'nos'); tieNum('Lintels: length', lf?.[2], lintelLen, 'm'); tieNum('Lintels: concrete', lf?.[4], lintelVol, 'm³'); tieNum('Lintels: steel', lf?.[5], lintelSteel, 'kg')
  const sillLen = sum(lin.map((x) => x.sills * (M.OPEN[x.id].w + 2 * M.WINDOW_SILL))), sillN = sum(lin.map((x) => x.sills))
  cmp('Sills: number', sillN, tr.sillN); cmp('Sills: length', sillLen, tr.sillLen)
  const lintelNote = rtLin?.note ?? ''
  const sm = /Sills: (\d+) under the windows and ventilators, ([\d.,]+) m in all/.exec(lintelNote)
  if (sm) { tieNum('Sills: number', sm[1], sillN, 'nos'); tieNum('Sills: length', sm[2], sillLen, 'm') } else miss('The sill figures are not in the lintels note of the report')
  const linTable: CalcTable = {
    head: ['Opening', 'Number', 'Length each (m)', 'Section (mm)', 'Concrete (m³)', 'Steel (kg)'],
    rows: linRows, foot: ['All lintels', String(lintelN), fixed(lintelLen, 1), '', fixed(lintelVol, 2), fixed(lintelSteel, 1)], num: [1, 2, 4, 5],
    note: 'Section = wall thickness × lintel depth. Concrete = number × L × t × d. Steel = number × the steel in one lintel, with the stirrups rounded up to whole stirrups.',
  }
  const sillDef = M.OPEN[winIds.length ? bigOf(winIds) : 'winB']
  const linAll = blk('lin-2', '7.3 Every lintel', { table: linTable })
  L.calc(`Length of one sill, ${sillDef.name.toLowerCase()}`, 'w + 2 × 75 mm', '{w:2} + 2 × {s:3}', { w: sillDef.w, s: M.WINDOW_SILL }, (v) => v.w + 2 * v.s, { unit: 'm', dp: 3, ref: R.engine, note: 'The tool takes a sill 75 mm longer than the opening on each side' })
  sumLine('Sills in the building: number', 'Σ windows and ventilators', lin.map((x) => x.sills), 'nos', 0, { ref: R.engine, expect: tr.sillN, what: 'opening kinds' })
  sumLine('Sills in the building: length', 'Σ n × (w + 0.15)', lin.map((x) => x.sills * (M.OPEN[x.id].w + 2 * M.WINDOW_SILL)), 'm', 1, { ref: R.engine, note: 'The sill material (stone, tile or concrete) is your choice and is not counted', expect: tr.sillLen, what: 'opening kinds' })
  const sillBlock = blk('lin-3', '7.4 Sills')
  sections.push({ id: 'lintels', title: '7. Lintels and sills', intro: 'One lintel over every opening, in M20 concrete. The steel is the tool’s standard arrangement for a small lintel; it is not a design.', blocks: [steelBlock, linWorked, linAll, sillBlock] })

  /* ═════════════ 8. Mortar mixes, cement and sand ═════════════ */

  L.value('Bulk density of cement', U.CEMENT_BULK_KG_M3, 'kg/m³', 0, 'Assumed: the usual figure in rate analyses (a 50 kg bag is about 0.035 m³)')
  L.value('CPWD cement for 10 m² of 12 mm plaster in 1:3', DAR_13_21.cementKg, 'kg', 2, `${R.dar}, Vol 2 item 13.21`, 'The one CPWD figure the tool is calibrated to')
  L.value('CPWD mortar for the same 10 m² of plaster', DAR_13_21.mortarM3, 'm³', 3, `${R.dar}, Vol 2 item 13.21`)
  L.calc('Cement in 1 m³ of 1:3 mortar, as CPWD counts it', 'cement ÷ mortar', '{c:2} ÷ {m:3}', { c: DAR_13_21.cementKg, m: DAR_13_21.mortarM3 }, (v) => v.c / v.m, { unit: 'kg', dp: 1, ref: `${R.dar}, Vol 2 item 13.21`, note: `The tool carries ${U.DAR_1_3_CEMENT_KG} kg, rounded`, expect: U.DAR_1_3_CEMENT_KG, tol: 0.5 + 1e-9 })
  const plain13 = L.calc('Cement in 1 m³ by the simple count, 1:3', '1440 ÷ 3', '{d:0} ÷ {m:0}', { d: U.CEMENT_BULK_KG_M3, m: 3 }, (v) => v.d / v.m, { unit: 'kg', dp: 0, ref: 'Arithmetic: the cement is a third of the volume of the sand' })
  L.calc('CPWD factor', 'f = CPWD cement ÷ simple count', '{c:0} ÷ {p:0}', { c: U.DAR_1_3_CEMENT_KG, p: plain13 }, (v) => v.c / v.p, { dp: 4, ref: `${R.dar}, Vol 2 item 13.21`, note: `The tool uses ${U.DAR_FACTOR}, rounded`, expect: U.DAR_FACTOR, tol: 0.0005 + 1e-9 })
  L.value('Factor used', U.DAR_FACTOR, '', 3, `${R.engine}: one factor for every mix`, 'The same factor is applied to every mix: cement 1,440 ÷ X × f, sand f')
  L.say('Sand in 1 m³ of mortar', 'Sand is the factor, in m³, for every mix: 1 m³ of mortar takes 1.069 m³ of loose sand. The cement is the part of that sand volume that the mix calls for, by the bulk density above. The same factor is used for the sand as for the cement; that is the tool’s choice and was not read from a CPWD table.', `${R.engine}: scaled from the 1:3 figure`)
  const mixes = [...new Set(tr.mat.filter((m) => /^1:\d+$/.test(m.mix)).map((m) => Number(m.mix.slice(2))))].sort((a, b) => a - b)
  for (const x of mixes) {
    L.calc(`Cement in 1 m³ of 1:${x} mortar`, 'C = 1440 ÷ X × f', '{d:0} ÷ {x:0} × {f:3}', { d: U.CEMENT_BULK_KG_M3, x, f: U.DAR_FACTOR }, (v) => (v.d / v.x) * v.f, { unit: 'kg', dp: 1, ref: x === 3 ? `${R.dar}, Vol 2 item 13.21` : `Scaled from the 1:3 figure by the tool (1,440 ÷ ${x} × ${U.DAR_FACTOR}); not read from a CPWD table`, note: `${fixed(U.CEMENT_KG_PER_M3(x) / U.CEMENT_BAG_KG, 2)} bags of 50 kg; sand ${fixed(U.SAND_M3_PER_M3, 3)} m³`, ...X(U.CEMENT_KG_PER_M3(x)) })
  }
  const mixBlock = blk('mat-0', '8.1 Cement and sand in a cubic metre of mortar: the CPWD analysis-of-rates basis', { note: `Only the mixes used in this report are listed. The one CPWD figure the tool was calibrated to is for 1:3 plaster (item 13.21). The tool scales it to the other mixes in the same ratio, so the figures for 1:4, 1:5 and 1:6 (${fixed(U.CEMENT_KG_PER_M3(4), 0)}, ${fixed(U.CEMENT_KG_PER_M3(5), 0)} and ${fixed(U.CEMENT_KG_PER_M3(6), 0)} kg) are scaled, not read from the CPWD table. A third-party table based on the 2023 Delhi Schedule of Rates gives about 380, 310 and 250 kg for those three mixes, so the scaled figures differ slightly from published tables (by up to about 3%).` })

  // concrete for lintels
  L.value('Cement in 1 m³ of M20 concrete', M.M20.cementKg, 'kg', 0, `${R.dar} Vol 1 item 4.1.2 (not re-read); IS 456:2000 cl 9.3: nominal mix concrete may be used for M 20 or lower`, 'Mix 1:1.5:3 by volume')
  L.value('Sand in 1 m³ of M20 concrete', M.M20.sandM3, 'm³', 3, `${R.dar} Vol 1 item 4.1.2`)
  L.value('Stone (20 mm) in 1 m³ of M20 concrete', M.M20.stoneM3, 'm³', 3, `${R.dar} Vol 1 item 4.1.2`)
  const concBlock = blk('mat-1', '8.2 Cement, sand and stone in a cubic metre of lintel concrete', { note: 'The quantities for M20 are CPWD DAR 2014 Vol 1 item 4.1.2. That item number is as given in the tool’s research notes and was not re-read against the published volume; treat it as a pointer to check.' })

  // the mat rows, independent
  const matM: MatRow[] = []
  const addMat = (use: string, mixLabel: string, vol: number, cementKg: number, sandM3v: number, stoneM3v = 0) => { if (vol > 0) matM.push({ use, mix: mixLabel, vol, cement: cementKg, sand: sandM3v, stone: stoneM3v }) }
  const cementPerM3 = (mix: number) => (U.CEMENT_BULK_KG_M3 / mix) * U.DAR_FACTOR
  for (const u of uw) if (u.mortar > 0) addMat(`Joints: ${u.w.name.toLowerCase()}`, `1:${u.w.mix}`, u.mortar, u.mortar * cementPerM3(u.w.mix), u.mortar * U.DAR_FACTOR)
  for (const r of plSpecs) {
    for (const l of r.spec.layers) {
      const m = r.net * l.mortar
      addMat(`Plaster: ${r.surface.split(',')[0].toLowerCase()}${r.spec.layers.length > 1 ? ` (${l.t} mm coat)` : ''}`, `1:${l.mix}`, m, m * cementPerM3(l.mix), m * U.DAR_FACTOR)
    }
  }
  addMat('Lintels (M20 concrete)', '1:1.5:3', lintelVol, lintelVol * M.M20.cementKg, lintelVol * M.M20.sandM3, lintelVol * M.M20.stoneM3)
  same('Mortar and concrete uses', matM.map((m) => m.use).join('|'), tr.mat.map((m) => m.use).join('|'))
  matM.forEach((m, i) => { const e = tr.mat[i]; if (!e) return; cmp(`${m.use}: volume`, m.vol, e.vol); cmp(`${m.use}: cement`, m.cement, e.cement); cmp(`${m.use}: sand`, m.sand, e.sand); cmp(`${m.use}: stone`, m.stone, e.stone) })
  const cementKg = sum(matM.map((m) => m.cement)), sandM3 = sum(matM.map((m) => m.sand)), stoneM3 = sum(matM.map((m) => m.stone)), matVol = sum(matM.map((m) => m.vol))
  cmp('Cement, all uses', cementKg, tr.cementKg); cmp('Sand, all uses', sandM3, tr.sandM3); cmp('Stone, all uses', stoneM3, tr.stoneM3)

  // worked rows: first joint row, first plaster row, lintel row
  const firstJoint = matM.find((m) => m.use.startsWith('Joints'))
  const firstPlaster = matM.find((m) => m.use.startsWith('Plaster'))
  const workedMat = (m: MatRow, from: string, mixN: number | null) => {
    L.say('Worked example', `${m.use}, mix ${m.mix}.`)
    L.value(mixN !== null ? 'Volume of mortar' : 'Volume of concrete', m.vol, 'm³', 3, `Carried forward: ${from}`)
    if (mixN !== null) {
      L.calc('Cement', 'volume × 1440 ÷ X × f', '{v:3} × {d:0} ÷ {x:0} × {f:3}', { v: m.vol, d: U.CEMENT_BULK_KG_M3, x: mixN, f: U.DAR_FACTOR }, (v) => v.v * (v.d / v.x) * v.f, { unit: 'kg', dp: 1, ref: R.dar, ...X(m.cement) })
      L.calc('Sand', 'volume × f', '{v:3} × {f:3}', { v: m.vol, f: U.DAR_FACTOR }, (v) => v.v * v.f, { unit: 'm³', dp: 3, ref: R.dar, ...X(m.sand) })
    } else {
      L.calc('Cement', 'volume × 400', '{v:3} × {c:0}', { v: m.vol, c: M.M20.cementKg }, (v) => v.v * v.c, { unit: 'kg', dp: 1, ref: `${R.dar} Vol 1 item 4.1.2`, ...X(m.cement) })
      L.calc('Sand', 'volume × 0.425', '{v:3} × {c:3}', { v: m.vol, c: M.M20.sandM3 }, (v) => v.v * v.c, { unit: 'm³', dp: 3, ref: `${R.dar} Vol 1 item 4.1.2`, ...X(m.sand) })
      L.calc('Stone, 20 mm', 'volume × 0.85', '{v:3} × {c:3}', { v: m.vol, c: M.M20.stoneM3 }, (v) => v.v * v.c, { unit: 'm³', dp: 3, ref: `${R.dar} Vol 1 item 4.1.2`, ...X(m.stone) })
    }
  }
  const lintelMat = matM.find((m) => m.use.startsWith('Lintels'))
  if (firstJoint) workedMat(firstJoint, 'Joint mortar of that wall, from the section 5 table of every wall', Number(firstJoint.mix.slice(2)))
  if (firstPlaster) workedMat(firstPlaster, 'Mortar of that coat, from table 6.5', Number(firstPlaster.mix.slice(2)))
  if (lintelMat) workedMat(lintelMat, 'Concrete in all lintels, from table 7.3', null)
  const matWorked = blk('mat-2', '8.3 Worked examples: a joint, a coat of plaster, and the lintel concrete')

  const rtMat = rt('mat')
  tieRows('Cement and sand, use by use', rtMat?.rows.length ?? 0, matM.length)
  const matRowsOut: string[][] = []
  matM.forEach((m, i) => {
    matRowsOut.push([m.use, m.mix, fixed(m.vol, 2), fixed(m.cement, 0), fixed(m.sand, 2), m.stone > 0 ? fixed(m.stone, 2) : '—'])
    matchRow(`Cement and sand table, ${m.use}`, rtMat?.rows[i], [m.use, m.mix, m.vol, m.cement, m.sand, m.stone > 0 ? m.stone : '—'])
  })
  const mf = rtMat?.foot
  tieNum('Cement and sand: volume', mf?.[2], matVol, 'm³'); tieNum('Cement and sand: cement', mf?.[3], cementKg, 'kg'); tieNum('Cement and sand: sand', mf?.[4], sandM3, 'm³'); tieNum('Cement and sand: stone', mf?.[5], stoneM3, 'm³')
  const matTable: CalcTable = {
    head: ['Use', 'Mix', 'Volume (m³)', 'Cement (kg)', 'Sand (m³)', 'Stone (m³)'],
    rows: matRowsOut, foot: ['Everything', '', fixed(matVol, 2), fixed(cementKg, 0), fixed(sandM3, 2), fixed(stoneM3, 2)], num: [2, 3, 4, 5],
    note: 'Cement = volume × cement per m³ (8.1, or 8.2 for concrete); sand and stone likewise. Joints come from the section 5 table of every wall, plaster from table 6.5, lintels from table 7.3.',
  }
  const matAll = blk('mat-3', '8.4 Cement and sand, use by use', { table: matTable })
  sections.push({ id: 'materials', title: '8. Mortar mixes, cement and sand', intro: 'Every mortar and the lintel concrete, converted to cement and sand. The 1:3 figure is the CPWD Delhi Analysis of Rates 2014 figure; the tool scales it to the other mixes, as 8.1 shows.', blocks: [mixBlock, concBlock, matWorked, matAll] })

  /* ═════════════ 9. What to buy ═════════════ */

  const cementBags = Math.ceil(cementKg / U.CEMENT_BAG_KG)
  cmp('Cement bags', cementBags, tr.cementBags)
  const unitTotals = new Map<M.MasonSystem, number>()
  for (const u of uw) unitTotals.set(u.w.sys.key, (unitTotals.get(u.w.sys.key) ?? 0) + u.withLoss)
  const sysUnits = [...unitTotals.entries()]
  sameArr('Units by material', sysUnits.map(([, n]) => n), [...tr.unitTotals.values()])
  const mainRaw = unitTotals.get(S.key) ?? 0
  const mainUnits = ceilTo(mainRaw, M.unitPack(S.kind))
  cmp('Main units ordered', mainUnits, tr.mainUnits)
  const adhKg = tAdh, adhBags = Math.ceil(adhKg / U.ADHESIVE_BAG_KG)

  if (sysUnits.length > 1) L.say('More than one material', `The ${S.label.toLowerCase()} total is the one shown in the first tile. The ${sysUnits.filter(([k]) => k !== S.key).map(([k]) => U.SYSTEMS[k].label.toLowerCase()).join(' and ')} for the plinth is a separate order line, rounded to its own order size.`, R.engine)
  interface Buy { key: string; item: string; exact: number; exactUnit: string; rule: string; qty: number; unit: string; dp: number }
  const buys: Buy[] = []
  const buyLines: string[] = []
  for (const [k, n] of sysUnits) {
    const sd = U.SYSTEMS[k]
    const pack = M.unitPack(sd.kind)
    const q = L.calc(`${cap(sd.unitsLabel)}: ${sd.label}`, `round up to ${pack}`, `{n:1} → next ${pack}`, { n }, (v) => ceilTo(v.n, pack), { unit: 'nos', dp: 0, ref: R.engine + `: ${sd.kind === 'brick' ? 'bricks are sold by the hundred' : 'blocks are ordered in tens'}`, result: true, note: 'The count including breakage, rounded up to the order size' })
    buys.push({ key: `masonry-unit-${k}`, item: `${sd.label} ${sd.size}`, exact: n, exactUnit: 'nos', rule: `up to the next ${pack}`, qty: q, unit: 'nos', dp: 0 })
    buyLines.push(`masonry-unit-${k}`)
  }
  if (thin) {
    const q = L.calc('AAC thin-bed adhesive', 'round up to a whole 40 kg bag', `{k:1} kg → next {b:0} kg`, { k: adhKg, b: U.ADHESIVE_BAG_KG }, (v) => ceilTo(v.k, v.b), { unit: 'kg', dp: 0, ref: R.engine, result: true, note: `${fixed(adhBags, 0)} bags of ${U.ADHESIVE_BAG_KG} kg` })
    buys.push({ key: 'aac-adhesive-kg', item: 'AAC thin-bed adhesive', exact: adhKg, exactUnit: 'kg', rule: `up to the next ${U.ADHESIVE_BAG_KG} kg`, qty: q, unit: 'kg', dp: 0 })
  }
  const cb = L.calc('Cement', 'bags = kg ÷ 50, rounded up', '{k:0} ÷ {b:0}, rounded up', { k: cementKg, b: U.CEMENT_BAG_KG }, (v) => Math.ceil(v.k / v.b), { unit: 'bags of 50 kg', dp: 0, ref: R.engine, result: true, note: 'Joints, plaster and lintels', ...X(tr.cementBags) })
  buys.push({ key: 'cement-bag-50kg', item: 'Cement', exact: cementKg, exactUnit: 'kg', rule: 'bags of 50 kg, up to the next whole bag', qty: cb, unit: 'bags of 50 kg', dp: 0 })
  const sandQ = L.calc('Sand', 'rounded to 0.1 m³', 'round({s:3}, 1 place)', { s: sandM3 }, (v) => round(v.s, 1), { unit: 'm³', dp: 1, ref: R.engine, result: true, note: 'Joints, plaster and lintels' })
  buys.push({ key: 'sand-m3', item: 'Sand', exact: sandM3, exactUnit: 'm³', rule: 'to the nearest 0.1 m³', qty: sandQ, unit: 'm³', dp: 1 })
  if (stoneM3 > 0) {
    const sq = L.calc('Stone aggregate 20 mm', 'rounded to 0.01 m³', 'round({s:3}, 2 places)', { s: stoneM3 }, (v) => round(v.s, 2), { unit: 'm³', dp: 2, ref: R.engine, result: true, note: 'Lintel concrete' })
    buys.push({ key: 'aggregate-20mm-m3', item: 'Stone aggregate 20 mm', exact: stoneM3, exactUnit: 'm³', rule: 'to the nearest 0.01 m³', qty: sq, unit: 'm³', dp: 2 })
  }
  if (lintelSteel > 0) {
    const stq = L.calc('Steel for lintels (10, 8 and 6 mm)', 'round up to 5 kg', '{s:1} → next {p:0} kg', { s: lintelSteel, p: M.STEEL_PACK_KG }, (v) => ceilTo(v.s, v.p), { unit: 'kg', dp: 0, ref: R.engine, result: true, note: 'Bars and stirrups' })
    buys.push({ key: 'steel-lintel-kg', item: 'Steel for lintels (10, 8 and 6 mm)', exact: lintelSteel, exactUnit: 'kg', rule: `up to the next ${M.STEEL_PACK_KG} kg`, qty: stq, unit: 'kg', dp: 0 })
  }
  const buyWorked = blk('buy-1', '9.1 Rounding to order sizes')
  same('Order lines', buys.map((b) => b.key).join(','), paid.lines.map((l) => l.key).join(','))
  tieRows('The order lines', paid.lines.length, buys.length)
  buys.forEach((b) => {
    const rl = paid.lines.find((l) => l.key === b.key)
    if (!rl) { miss(`Order line ${b.key} is not in the report`); return }
    same(`Order line ${b.key}: unit`, b.unit, rl.unit)
    tieNum(`Order line: ${rl.item}`, rl.qty, b.qty, rl.unit, b.dp)
  })
  const buyTable: CalcTable = {
    head: ['Item', 'Exact quantity', 'Rounded how', 'Order quantity'],
    rows: buys.map((b) => [b.item, `${fixed(b.exact, b.dp === 0 ? 1 : 2)} ${b.exactUnit}`, b.rule, `${fixed(b.qty, b.dp)} ${b.unit}`]),
    num: [1, 3],
    note: 'These are the order lines of the report. Bricks and blocks are the count including breakage; cement, sand and stone are the totals of table 8.4; steel is the total of table 7.3. Final quantities for ordering come from the signed drawings.',
  }
  const buyAll = blk('buy-2', '9.2 The order list', { table: buyTable })

  // tiles
  const tiles = paid.tiles
  tieRows('What to order: the main totals', tiles.length, 4)
  const tileWant: { k: string; v: number; unit: string; dp: number; low: number; high: number; base: number }[] = [
    { k: S.kind === 'brick' ? 'Bricks' : 'Blocks', v: mainUnits, unit: 'nos', dp: 0, low: M.BANDS.units.low, high: M.BANDS.units.high, base: mainUnits },
    { k: 'Cement', v: cementBags, unit: 'bags of 50 kg', dp: 0, low: M.BANDS.cement.low, high: M.BANDS.cement.high, base: cementBags },
    { k: 'Sand', v: sandM3, unit: 'm³', dp: 1, low: M.BANDS.sand.low, high: M.BANDS.sand.high, base: sandM3 },
    thin
      ? { k: 'Block adhesive', v: adhBags, unit: 'bags of 40 kg', dp: 0, low: M.BANDS.adhesive.low, high: M.BANDS.adhesive.high, base: adhBags }
      : { k: 'Plaster', v: plasterTotal, unit: 'm²', dp: 0, low: M.BANDS.plaster.low, high: M.BANDS.plaster.high, base: plasterTotal },
  ]
  const parseRange = (r: string | undefined) => { const m = /^([\d.,]+) to ([\d.,]+)/.exec(r ?? ''); return m ? [m[1], m[2]] as const : null }
  tileWant.forEach((tw, i) => {
    const t = tiles[i]
    if (!t) { miss(`Tile ${tw.k} is not in the report`); return }
    same(`Tile ${i + 1} name`, tw.k, t.k); same(`Tile ${tw.k}: unit`, tw.unit, t.unit)
    tieNum(`Total: ${tw.k}`, t.v, tw.v, tw.unit, tw.dp)
    const rg = parseRange(t.range)
    if (!rg) { miss(`Tile ${tw.k}: the range "${t.range}" could not be read`); return }
    tieNum(`Range, low end: ${tw.k}`, rg[0], tw.base * tw.low, tw.unit, tw.dp)
    tieNum(`Range, high end: ${tw.k}`, rg[1], tw.base * tw.high, tw.unit, tw.dp)
  })
  // tile figures from the exact quantities
  cmp('Tile: sand', sandM3, tr.sandM3)
  // the tile and the main line are the same number
  const tiedUnitsLine = buys.find((b) => b.key === `masonry-unit-${S.key}`)
  if (tiedUnitsLine) cmp('Tile bricks or blocks = order line', tiedUnitsLine.qty, mainUnits)

  // overlap
  const ov = paid.overlap
  const ovBlocks: CalcBlock[] = []
  if (lintelVol > 0) {
    const ovLines: { key: string; unit: string; qty: number }[] = [
      { key: 'cement-bag-50kg', unit: 'bags of 50 kg', qty: (lintelVol * M.M20.cementKg) / U.CEMENT_BAG_KG },
      { key: 'sand-m3', unit: 'm³', qty: lintelVol * M.M20.sandM3 },
      ...(stoneM3 > 0 ? [{ key: 'aggregate-20mm-m3', unit: 'm³', qty: lintelVol * M.M20.stoneM3 }] : []),
      ...(lintelSteel > 0 ? [{ key: 'steel-lintel-kg', unit: 'kg', qty: ceilTo(lintelSteel, M.STEEL_PACK_KG) }] : []),
    ]
    L.say('Why', 'The StructurePro report also counts the lintels over doors and windows. If you hold both reports, the Grand Total takes the lintel concrete and steel below out once, so they are not ordered twice. On its own each report is complete.', R.engine)
    if (!ov) miss('The report has no overlap entry for the lintels')
    else {
      same('Overlap with', 'structure', ov.with)
      tieRows('Lintels counted in both reports', ov.lines.length, ovLines.length)
      const ovName: Record<string, string> = { 'cement-bag-50kg': 'Cement in the lintels', 'sand-m3': 'Sand in the lintels', 'aggregate-20mm-m3': 'Stone aggregate in the lintels', 'steel-lintel-kg': 'Steel in the lintels' }
      ovLines.forEach((o) => {
        const r = ov.lines.find((x) => x.key === o.key)
        if (!r) { miss(`Overlap line ${o.key} is not in the report`); return }
        L.calc(ovName[o.key] ?? o.key, o.key === 'steel-lintel-kg' ? 'lintel steel, rounded up to 5 kg' : o.key === 'cement-bag-50kg' ? 'lintel concrete × 400 kg ÷ 50 kg' : o.key === 'sand-m3' ? 'lintel concrete × 0.425' : 'lintel concrete × 0.85', o.key === 'steel-lintel-kg' ? 'from table 7.3' : 'from tables 7.3 and 8.2', {}, () => o.qty, { unit: o.unit, dp: 2, ref: R.engine, ...X(r.qty) })
        same(`Overlap ${o.key}: unit`, o.unit, r.unit)
        ties.push(tie(`Counted in both reports: ${(ovName[o.key] ?? o.key).toLowerCase()}`, r.qty, o.qty, o.unit, 2))
      })
    }
    ovBlocks.push(blk('buy-3', '9.3 Lintels counted in the StructurePro report as well'))
  } else if (ov) miss('The report has an overlap entry but the sheet finds no lintels')
  sections.push({ id: 'buy', title: '9. What to buy: the order sizes', intro: 'The exact quantities are rounded to the sizes in which the material is ordered. This rounding moves the figures in the report, so it is shown here.', blocks: [buyWorked, buyAll, ...ovBlocks] })

  /* ═════════════ 10. How far off the figures can be ═════════════ */

  const bandsWant: { label: string; low: number; high: number }[] = [
    { label: S.kind === 'brick' ? 'Bricks' : 'Blocks', low: M.BANDS.units.low, high: M.BANDS.units.high },
    { label: 'Cement', low: M.BANDS.cement.low, high: M.BANDS.cement.high },
    { label: 'Sand', low: M.BANDS.sand.low, high: M.BANDS.sand.high },
    { label: 'Plaster area', low: M.BANDS.plaster.low, high: M.BANDS.plaster.high },
    { label: 'Lintel concrete and steel', low: M.BANDS.lintel.low, high: M.BANDS.lintel.high },
  ]
  same('Bands', bandsWant.map((b) => `${b.label} ${b.low}-${b.high}`).join('; '), paid.bands.map((b) => `${b.label} ${b.low}-${b.high}`).join('; '))
  const pct = (low: number, high: number) => ({ below: Math.round((1 - low) * 100), above: Math.round((high - 1) * 100) })
  const bandRows = bandsWant.map((b) => {
    const p = pct(b.low, b.high)
    const rp = paid.bands.find((x) => x.label === b.label)
    if (rp) { const q = pct(rp.low, rp.high); tieText(`Band: ${b.label}`, `${q.below}% below to ${q.above}% above`, `${p.below}% below to ${p.above}% above`) }
    return [b.label, fixed(b.low, 2), fixed(b.high, 2), `${p.below}% below to ${p.above}% above`]
  })
  const bandTable: CalcTable = {
    head: ['Figure', 'Low factor', 'High factor', 'As printed in the report'], rows: bandRows, num: [1, 2],
    note: 'The factors are the tool’s own judgement of how far the real figure may fall from the one shown. They are a judgement band, not a statistical interval: nothing was measured to set them and they carry no confidence level. The range under each total in the report is the total × the low factor and × the high factor.',
  }
  const bandBlock = blk('band-1', '10.1 The bands', { table: bandTable })
  tileWant.forEach((tw) => {
    L.calc(`Range for ${tw.k}: low end`, 'total × low factor', '{b:' + tw.dp + '} × {f:2}', { b: tw.base, f: tw.low }, (v) => v.b * v.f, { unit: tw.unit, dp: tw.dp, ref: R.assumed })
    L.calc(`Range for ${tw.k}: high end`, 'total × high factor', '{b:' + tw.dp + '} × {f:2}', { b: tw.base, f: tw.high }, (v) => v.b * v.f, { unit: tw.unit, dp: tw.dp, ref: R.assumed })
  })
  const bandRange = blk('band-2', '10.2 The range under each total')
  sections.push({ id: 'bands', title: '10. How far off the figures can be', intro: 'The report gives, under each total, a range that the tool’s own judgement puts the real figure in. It is a judgement band, not a statistical interval. These are the factors behind it.', blocks: [bandBlock, bandRange] })

  /* ═════════════ 11. Code checks that use a number ═════════════ */

  const CL = M.CHECK_LIMITS
  const nomExt = S.kind === 'brick' ? tExt + U.J : tExt
  const panelRefLine = S.kind === 'brick'
    ? 'IS 4326:1993 cl 8.2.3 Note; cl 8.2.6 sends bonded filler walls to cl 8.2.3'
    : `${panelRef()}; the storey limit and the support at the top are from IS 4326:1993 cl 8.2.3 Note, which the tool applies to block walls as well`
  const panelNote = `The Note to IS 4326:1993 cl 8.2.3 reads: For panel walls of 200 mm or larger thickness having a storey height not more than 3.5 metres and laterally supported at the top, this check need not be exercised. The tool does not check the support at the top: it assumes the wall is held there. ${S.kind === 'brick' ? 'It tests the nominal thickness (the wall plus one 10 mm joint), so a 190 mm modular-brick wall counts as 200 mm and passes.' : 'It tests the thickness of the block wall as chosen.'}`
  L.calc('Outer wall, nominal thickness', S.kind === 'brick' ? 'tn = t + J' : 'tn = t', S.kind === 'brick' ? '{t:3} + {J:3}' : '{t:3}', { t: tExt, J: S.kind === 'brick' ? U.J : 0 }, (v) => v.t + v.J, { unit: 'm', dp: 3, ref: R.engine, note: 'A brick wall’s nominal thickness includes one joint' })
  const panelPass = nomExt >= CL.panelNominalM - 1e-9 && H <= CL.panelStoreyM
  L.pick('Panel wall in a frame: need no separate panel check', 'tn ≥ 0.20 m and storey ≤ 3.5 m', `${fixed(nomExt, 3)} m against ${fixed(CL.panelNominalM, 2)} m, and ${fixed(H, 2)} m against ${fixed(CL.panelStoreyM, 1)} m: ${panelPass ? 'pass' : 'advisory'}`, panelRefLine, panelNote)
  const partLimit = L.calc('Inner wall: greatest height', 'H ≤ 30 × thickness', '{k:0} × {t:3}', { k: CL.partitionSlenderness, t: tInt }, (v) => v.k * v.t, { unit: 'm', dp: 2, ref: 'IS 1905:1987 App. D-3.1(b): a panel held at its ends and at the top, of any length, may be 30 times its thickness high' })
  const partPass = Hi <= partLimit + 1e-9
  L.pick('Inner wall: result', 'inner wall height ≤ limit', `${fixed(Hi, 2)} m against ${fixed(partLimit, 2)} m: ${partPass ? 'pass' : 'advisory (needs a stiffening band at mid-height, not counted)'}`, 'IS 1905:1987 App. D-3.1(b)')
  const parOn = inp.parapet || (inp.balconyWall && balcTotal > 0)
  let parPass = true
  if (parOn) {
    const parLimit = L.calc('Parapet: greatest height unbraced', 'H ≤ 5 × thickness', '{k:0} × {t:3}', { k: CL.parapetSlenderness, t: tPar }, (v) => v.k * v.t, { unit: 'm', dp: 2, ref: 'IS 6041:1985 cl 4.3; IS 2572:2005 cl 7.2.2: unless braced at 3 m or less, five times the thickness', note: S.kind === 'brick' ? 'These two standards are for block masonry; the tool applies the limit to brick by analogy' : undefined })
    parPass = M.PARAPET_H <= parLimit + 1e-9
    L.pick('Parapet: result', 'parapet height ≤ limit', `${fixed(M.PARAPET_H, 2)} m against ${fixed(parLimit, 2)} m: ${parPass ? 'pass' : 'advisory (needs stiffening columns, not counted)'}`, 'IS 6041:1985 cl 4.3; IS 2572:2005 cl 7.2.2')
  }
  const chkBlock = blk('chk-1', `11.1 The ${parOn ? 'three' : 'two'} checks that depend on a number`)
  const chkWant: [string, boolean][] = [['panel', panelPass], ['partition', partPass], ...(parOn ? ([['parapet', parPass]] as [string, boolean][]) : [])]
  chkWant.forEach(([id, pass]) => {
    const c = free.checks.find((x) => x.id === id)
    if (!c) { miss(`The check "${id}" is not in the report`); return }
    tieText(`Check: ${c.description}`, c.status === 'pass' ? 'Pass' : 'Advisory', pass ? 'Pass' : 'Advisory')
  })
  if (!parOn && free.checks.some((c) => c.id === 'parapet')) miss('The report has a parapet check but the sheet finds no parapet')
  sections.push({ id: 'checks', title: '11. Code checks that depend on a number', intro: `The report’s checks against the Indian Standards. ${parOn ? 'Three' : 'Two'} of them compare a size with a limit; they are worked here. The others (mortar mix, plaster thickness, ties to the frame) are statements of practice and carry no sum. The editions followed are IS 4326:1993, IS 6041:1985, IS 2572:2005 and IS 1905:1987; newer editions of some of them exist and were not checked.`, blocks: [chkBlock] })

  /* ═════════════ the facts and the tiles of the first page ═════════════ */

  const fact = (k: string) => free.facts.find((f2) => f2.k === k)?.v
  tieNum('Floors', fact('Floors'), N, '')
  tieNum('Homes', fact('Homes'), homes, '')
  const roomsAll = sum(bed.map((b, i) => nHome * (b + 1 + kit[i] + bath[i])))
  tieNum('Rooms counted', fact('Rooms counted'), roomsAll, '')
  cmp('Rooms counted', roomsAll, tr.rooms.bed + tr.rooms.living + tr.rooms.kit + tr.rooms.bath)
  tieNum('Doors', fact('Doors'), nDoors, ''); tieNum('Windows and ventilators', fact('Windows'), nWindows, '')
  tieNum('Outer wall thickness', (fact('Outer wall') ?? '').replace(/ mm$/, ''), mm(tExt), 'mm'); tieNum('Inner wall thickness', (fact('Inner walls') ?? '').replace(/ mm$/, ''), mm(tInt), 'mm')

  /* ═════════════ the words ═════════════ */

  const refs: CalcReference[] = [
    { code: 'IS 1200 (Part 3):1976', title: 'Method of measurement of building and civil engineering works, Part III: Brickwork', usedFor: 'Taking openings, with their lintels and sills, out of the walls (cl 4.1.4 and its note). This is the 1976 edition. BIS lists IS 1200 (Part 3):2026, which supersedes it; the tool follows the 1976 rules and has not been checked against the 2026 edition.' },
    { code: 'IS 1200 (Part 12):1976', title: 'Method of measurement of building and civil engineering works, Part XII: Plastering and pointing', usedFor: 'Measuring plaster and deducting openings from it (cl 3.8, 3.12). This is the 1976 edition. BIS lists IS 1200 (Part 12):2026, which supersedes it; the tool follows the 1976 rules and has not been checked against the 2026 edition.' },
    { code: 'IS 1077:1992', title: 'Common burnt clay building bricks: Specification', usedFor: 'The modular brick, 190 × 90 × 90 mm.' },
    { code: 'IS 12894:2002', title: 'Pulverized fuel ash-lime bricks: Specification', usedFor: 'The fly-ash brick, 230 × 110 × 70 mm (cl 5.1.2).' },
    { code: 'IS 2185 (Part 1):2005', title: 'Concrete masonry units, Part 1: Hollow and solid concrete blocks', usedFor: 'The 400 × 200 mm concrete block; the nominal size includes the mortar joint (cl 4.2, 4.2.1).' },
    { code: 'IS 2185 (Part 3):1984', title: 'Concrete masonry units, Part 3: Autoclaved cellular (aerated) concrete blocks', usedFor: 'The 600 × 200 mm AAC block face (with the makers’ data).' },
    { code: 'IS 6041:1985', title: 'Construction of autoclaved cellular concrete block masonry: Code of practice', usedFor: 'The 10 mm joint (cl 7.1); minimum thickness of internal and external panel walls (cl 4.2.1); parapet height (cl 4.3). This sheet follows the 1985 edition; a newer edition exists and was not checked.' },
    { code: 'IS 2572:2005', title: 'Construction of hollow and solid concrete block masonry: Code of practice', usedFor: 'The 10 mm joint (cl 11.1.4); minimum thickness of internal partitions (cl 7.2.1.2) and external panel walls (cl 7.2.1.3); parapet height (cl 7.2.2). This sheet follows the 2005 edition; a newer edition exists and was not checked.' },
    { code: 'IS 2212:1991', title: 'Brickwork: Code of practice', usedFor: 'The code of practice for brickwork. Its joint limit of 12 mm (cl 6.4.1) is as given in the tool’s research notes and was not re-read against the published text; the tool takes 10 mm.' },
    { code: 'IS 2250:1981', title: 'Preparation and use of masonry mortars: Code of practice', usedFor: 'Richer mortar for parapets higher than three times their thickness (cl 7.1.5). The grade named there (MM 3) and its cement-sand ratio were not read; a secondary source gives MM 3 as 1:5, so the tool’s 1:4 is on the safe side.' },
    { code: 'IS 1905:1987', title: 'Structural use of unreinforced masonry: Code of practice', usedFor: 'Bearing of a lintel on the wall (cl 5.3.3) and the height of a held panel against its thickness (App. D-3.1(b)).' },
    { code: 'IS 4326:1993', title: 'Earthquake resistant design and construction of buildings: Code of practice', usedFor: 'Recommended mortar mixes (cl 8.1.2, Table 3); panel walls in a frame (cl 8.2.3 and its Note for walls of 200 mm or more in storeys of 3.5 m or less, held at the top; cl 8.2.6 sends bonded filler walls to cl 8.2.3). This sheet follows the 1993 edition; IS 4326:2013 is a newer edition and was not checked.' },
    { code: 'IS 1786:2008', title: 'High strength deformed steel bars and wires for concrete reinforcement: Specification', usedFor: 'Mass per metre of the 6, 8 and 10 mm bars in the lintels (Table 1).' },
    { code: 'IS 456:2000', title: 'Plain and reinforced concrete: Code of practice', usedFor: 'Nominal mix concrete may be used for M 20 or lower (cl 9.3): the lintels.' },
    { code: 'CPWD DAR 2014', title: 'Delhi Analysis of Rates 2014, Volumes 1 and 2 (Central Public Works Department)', usedFor: 'Mortar in each plaster item (Vol 2 items 13.3, 13.4, 13.11, 13.16); cement in 1:3 plaster mortar (Vol 2 item 13.21); the M20 concrete quantities (Vol 1 item 4.1.2, as given in the tool’s research notes and not re-read against the published volume). These are the CPWD analysis-of-rates basis the tool uses; they are not Indian Standard clauses. The cement for the other mixes is scaled by the tool from the 1:3 figure.' },
  ]

  // joint mortar for each m³ of brick wall, as the report carries it (for the limits)
  const mPerM3 = (u: UnitW) => u.mortarM2 / u.w.t
  const uOut = uw[0]
  const uIn = uw.find((u) => u.w.id === 'int')
  const jointMortarLimit = S.kind === 'brick' && uOut && uIn
    ? `For brickwork the tool counts the bricks on the nominal thickness (the wall plus one joint) but takes the exact joint volume on the actual thickness, and then adds ${round((U.MORTAR_ALLOW - 1) * 100)}%. The joint mortar comes out at ${fixed(mPerM3(uOut), 3)} m³ for each m³ of ${mm(uOut.w.t)} mm wall and ${fixed(mPerM3(uIn), 3)} for each m³ of ${mm(uIn.w.t)} mm wall. A published table based on the CPWD rates (Vol 1 brickwork items) implies about 0.25 to 0.27 for standard 230 mm brickwork. If that table is right, the joint mortar here is low, by up to about a quarter in half-brick walls. The method has not been changed to match; check the joint mortar against what your mason uses.`
    : null

  const purpose = `This sheet shows how MasonryPro worked out the ${S.unitsLabel}, mortar, cement, sand, plaster and lintels in your report. Each step gives the formula, the numbers put in, the answer and where the rule comes from, so that the working can be checked. The wall lengths come from the tool’s room plan, which is an assumption and not a drawing, so checking the working checks the arithmetic and the rules named, not your building. Where the sheet says Assumed the figure is the tool’s own planning value and not a code requirement.`
  const method: string[] = [
    'Your answers fix the wall material, the thickness of each kind of wall and the floor-to-floor height. The wall heights follow by taking off the depth of the beams and slab.',
    'A room plan is worked out for each floor from its area and the number of bedrooms, bathrooms and kitchens. It gives the length of the outer walls, the inner walls and any walls between flats.',
    'Doors, windows and ventilators are counted from the rooms. Each is taken out of its wall together with its lintel and its sill, the way IS 1200 (Part 3):1976 measures an opening (the 1976 edition, which a 2026 edition supersedes: see the limits).',
    'Each kind of wall is measured: length times height is the gross area, and the openings come off to give the net area.',
    `The ${S.unitsLabel} in a square metre of wall come from the size of the ${S.unit} and the joint. The joint mortar in a square metre is the true volume of the joints, with an allowance added. Breakage is added to the count.`,
    'Plaster is measured to IS 1200 (Part 12):1976 (the 1976 edition, which a 2026 edition supersedes: see the limits): the surfaces of the walls, ceilings, parapet and balcony edges, less what the openings take off. The mortar in it comes from the CPWD analysis-of-rates figure for each plaster item.',
    'Every lintel is sized from its opening: length, concrete, and steel in a fixed arrangement of bars and stirrups. Every mortar is turned into cement and sand on the CPWD analysis-of-rates basis, scaled by the tool from one CPWD figure, and the lintel concrete into cement, sand and stone with the M20 quantities.',
    'The exact quantities are rounded to the sizes in which each material is ordered (hundreds of bricks, 50 kg bags, 5 kg of steel). The range under each total is the total times a low and a high factor, which the tool sets by its own judgement.',
    'Finally every total, table row and order line of the report is compared with the figure this sheet worked out. The comparison is at the end of the sheet, and the sheet is printed only if every figure agrees. That shows the sheet and the report agree with each other, because the same sums were done twice. It is not a check against the standards or against what a site will use.',
  ]
  const limits: string[] = [
    'The walls are not measured from your drawing. The length of outer and inner walls comes from a room plan the tool builds from your floor areas and room counts. If your plot is long and thin, or the rooms are laid out very differently, the real walls will be longer than the sheet shows.',
    'The room plan is built only to find wall lengths and the floor inside the walls. Another NirmanShastra tool may lay out the same rooms by its own rule, so a room’s area here can differ from the same room in another NirmanShastra report.',
    'Door and window sizes and numbers, and the sizes of the plinth, parapet, balcony and stair room, are planning values. No standard fixes them. Change them on your drawing and the quantities change.',
    `IS 1200 (Part 3) and (Part 12) are cited here in their 1976 editions. BIS lists IS 1200 (Part 3):2026 and IS 1200 (Part 12):2026, which supersede them. The tool follows the 1976 rules (no deduction for an opening up to 0.1 m² in masonry; for plaster none up to 0.5 m², one face up to 3 m², both faces and the reveals above) and has not been checked against the 2026 text. A 2025 draft of the revision, read only in summary and not the published text, appears to keep these limits and the between-walls rule but numbers its clauses differently, so the clause numbers on this sheet are the 1976 numbers. Check them, and the limits, against the 2026 edition before relying on them.`,
    `The outer wall length is the perimeter of the built-up area (${fixed(reps[0].P, 1)} m on the ground floor here). Measured between the walls, which is how IS 1200 (Part 12):1976 cl 3.12 measures plaster, the inside perimeter is shorter by 8 times the wall thickness (${fixed(8 * tExt, 2)} m here). The tool uses the built-up length for the brickwork and for the inside plaster of the outer walls, so both are a little high.`,
    'No deduction is made for concrete columns standing inside a framed wall, while the Grand Total adds the columns of the frame separately. The masonry may be high by a few per cent for that reason.',
    `The count of ${S.unitsLabel} follows from the nominal size of the unit and a 10 mm joint.${inp.system === 'brick' ? ' The 230 × 115 × 75 mm red brick is the common field size, not a BIS size; if your kiln’s brick differs, the count changes in the ratio of the volumes. Measure a few.' : ''} The ${round(S.loss * 100)}% for breakage and the ${round((U.MORTAR_ALLOW - 1) * 100)}% extra joint mortar are assumptions; no standard gives either.`,
    ...(jointMortarLimit ? [jointMortarLimit] : []),
    `Cement per cubic metre of mortar is calibrated to one CPWD figure (73.89 kg of cement for 10 m² of 12 mm plaster in 1:3, which is ${U.DAR_1_3_CEMENT_KG} kg in 1 m³; DAR 2014 Vol 2 item 13.21) and scaled by the tool to the other mixes. The scaled figures are not read from a CPWD table and differ slightly from published tables (up to about 3% from a third-party table based on the 2023 Delhi Schedule of Rates). The CPWD Volume 1 brickwork items were not used to check the joint mortar.`,
    'Sand is the CPWD volume of loose sand for each cubic metre of mortar. The bulking of damp sand and the moisture in it are not allowed for, so the sand as delivered may measure differently.',
    'Inside plaster is taken as one coat of 12 mm for every wall and ceiling. Many sites use 15 to 20 mm; the plaster mortar rises in proportion to the thickness.',
    'Mortar mixes follow the tool’s choice, not your seismic zone. IS 4326 Table 3 asks for a richer mortar (1:4 or better) in the higher zones and the tool does not ask for the zone. Your engineer decides the mortar grade; richer mortar raises the cement.',
    'The steel in the lintels is a standard arrangement for a small lintel (two 10 mm bars, two 8 mm bars, 6 mm stirrups at 150 mm). It is not the design of any lintel; the engineer who signs your drawings decides lintel sizes and steel. No allowance is made for cutting the bars to length or for laps; the rounding up to 5 kg is the only margin.',
    'Not counted: dowels, ties and horizontal bands in tall walls, stiffening columns and copings on parapets, damp-proof course and waterproofing, door and window frames, scaffolding and curing water. The report lists them. A 150 mm wall in a frame needs bracing and reinforcement that the engineer decides.',
    'The code checks compare a wall’s thickness and height with limits taken from the standards. They are screening checks for estimating, not a seismic or structural design of the walls. The panel-wall check follows the Note to IS 4326:1993 cl 8.2.3 (200 mm or more thick, storey not more than 3.5 m, held at the top). The tool does not know whether the wall is held at the top and assumes it is. It tests the nominal thickness, the wall plus one 10 mm joint for brick, so a 190 mm modular-brick wall counts as 200 mm and passes.',
    ...(S.kind === 'brick' ? ['The limit of five times the thickness for a parapet comes from the block-masonry standards IS 6041 and IS 2572. The tool applies it to brick by analogy.'] : []),
    'The ranges under the totals are a judgement band set by the tool, not a statistical interval.',
    'The sheet follows IS 4326:1993, IS 6041:1985 and IS 2572:2005. Newer editions exist (IS 4326:2013, and newer editions of IS 6041 and IS 2572), and their clause numbers and limits may differ.',
    'The clause number given for IS 2212 (cl 6.4.1), the item number given for CPWD DAR Vol 1 (item 4.1.2) and the mapping of grade MM 3 of IS 2250 to a mix are as found in the tool’s research notes and were not re-read against the published text. Treat such a number as a pointer to check, not a quotation.',
    'The ok marks in the reconciliation at the end show that this sheet and the report agree with each other, because the same sums were done twice. They do not show that the figures agree with the standards or with what a site will use.',
    'State and city do not change any figure. Brick sizes and mixes vary from place to place, and the tool has no local factor, so confirm the brick size and the mortar mix with your mason before you order.',
    'Quantities are carried at full precision and rounded only for the order list in section 9. Re-keying the rounded figures printed here can differ in the last digit.',
  ]

  const sheet: CalcSheet = { tool: 'MasonryPro', model: 'trade-v1', purpose, method, limits, sections, tie: ties, references: refs }
  return { sheet, mismatches: L.mismatches, checked: L.checked.length }
}

/** The sheet for the report, or null (after writing why to the console) if it cannot be made to agree with the report. */
export function buildMasonCalc(input: MasonInput, report: TradeResult): CalcSheet | null {
  try {
    const { sheet, mismatches } = makeMasonSheet(input, report)
    if (!sheetIsSound(sheet, mismatches)) {
      const bad = [...mismatches, ...sheet.tie.filter((t) => !t.ok).map((t) => `${t.item}: report ${t.report} vs sheet ${t.sheet}`)]
      console.error(`MasonryPro calculation sheet left out: ${bad.length} figure(s) disagree with the report.\n  ${bad.slice(0, 40).join('\n  ')}`)
      return null
    }
    return sheet
  } catch (e) {
    console.error('MasonryPro calculation sheet left out:', e)
    return null
  }
}

