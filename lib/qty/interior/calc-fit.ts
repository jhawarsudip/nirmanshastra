/*
  InteriorPro calculation sheet, part 5: doors, frames, windows, hardware, and the wardrobes and kitchen units.
*/

import type { CalcBlock, CalcSection, CalcTable, Vars } from '@/lib/calcsheet'
import { fmt } from '../util'
import {
  CAB, CUT_WASTE, DOOR, FRAME, GLASS_SHARE, GLASS_WASTE, GLAZED, KITCHEN_RUN, PANE_W, SASH_DROP, SHEET_M2, WALL_UNIT, WARDROBE, BASE,
  cabinet, hingesFor, type Cab, type Op,
} from './model'
import { REF, T, X, cmpTable, repFoot, repNum, same, type Ctx } from './calc-kit'
import type { PlanOut } from './calc-plan'
import type { SurfOut } from './calc-surf'

const NAMES = ['a', 'b', 'd', 'e', 'f', 'g']
const REF_DS = 'IS 1003 (Part 1):2003 Table 3 (designations)'

export function doorsAndWindows(c: Ctx, P: PlanOut, S: SurfOut) {
  const { w, L } = c
  const { agg, open } = P
  const area = (o: Op) => o.w * o.h
  const frameVol = (o: Op) => (2 * o.h + o.w + 2 * FRAME.horn) * FRAME.b * FRAME.d

  /* doors and frames */
  const room = DOOR.room
  const rw = w.doorRows.find((r) => r.op === room)
  L.calc('Timber frame of one room door', 'V = (2 × height + width + 2 × horn) × section width × section depth', '(2 × {h} + {w} + 2 × {hn}) × {b} × {d}',
    { h: room.h, w: room.w, hn: FRAME.horn, b: FRAME.b, d: FRAME.d }, (v) => (2 * v.h + v.w + 2 * v.hn) * v.b * v.d,
    { unit: 'm³', dp: 4, ref: REF.assume, note: 'Two sides and the head, with a 100 mm horn at each top corner, in a section of 100 × 65 mm. IS 4021, which fixes frame sections, could not be read, so the section is an assumption.', ...(rw ? X(rw.frame / rw.n) : {}) })
  const hn = L.calc('Hinges on one room door', 'three up to 0.9 m wide, four above', `${room.w} m wide, so ${hingesFor(room.w)}`, {}, () => hingesFor(room.w),
    { dp: 0, ref: 'IS 1003 (Part 1):2003 cl. 8.2', note: 'Applied here to the width of the opening; the standard speaks of the width of the shutter.' })
  void hn
  const kinds = (['main', 'room', 'bath', 'mumty'] as const).map((k) => [k, open[k]] as const).filter(([, n]) => n > 0)
  const doorRows = kinds.map(([k, n]) => ({ op: DOOR[k], n, leaf: n * area(DOOR[k]), frame: n * frameVol(DOOR[k]), hinges: n * hingesFor(DOOR[k].w) }))
  const frameTotal = doorRows.reduce((s, r) => s + r.frame, 0)
  const doorHinges = doorRows.reduce((s, r) => s + r.hinges, 0)
  same(c, 'door shutters', doorRows.reduce((s, r) => s + r.leaf, 0), w.leafArea)
  same(c, 'door frames', frameTotal, w.frameTotal)
  same(c, 'door hinges', doorHinges, w.doorHinges)
  const doorTable: CalcTable = {
    head: ['Door', 'Size (m)', 'Shutter', 'Number', 'Shutters (m²)', 'Frame timber (m³)', 'Hinges on one', 'Hinges'], num: [3, 4, 5, 6, 7],
    rows: doorRows.map((r) => [r.op.name, `${fmt(r.op.w, 2)} × ${fmt(r.op.h, 2)}`, r.op.des ?? '', fmt(r.n), fmt(r.leaf, 1), fmt(r.frame, 3), String(hingesFor(r.op.w)), fmt(r.hinges)]),
    foot: ['All doors', '', '', fmt(S.nDoors), fmt(S.leafArea, 1), fmt(frameTotal, 3), '', fmt(doorHinges)],
    note: 'Shutters = number × width × height of the opening. Frame timber = number × the volume of one frame, worked above. The shutter designation (9 DS 21 and so on) is that of IS 1003 Table 3; InteriorPro uses the size of the modular opening for the shutter.',
  }
  cmpTable(c, 'doors', doorRows.map((r) => [null, null, null, r.n, r.leaf, r.frame, r.hinges]), [null, null, null, S.nDoors, S.leafArea, frameTotal, doorHinges])
  T(c, 'Doors: number', repFoot(c, 'doors', 3), S.nDoors, 'nos')
  T(c, 'Doors: shutter area', repFoot(c, 'doors', 4), S.leafArea, 'm²', 1)
  T(c, 'Doors: frame timber', repFoot(c, 'doors', 5), frameTotal, 'm³', 3)
  T(c, 'Doors: hinges', repFoot(c, 'doors', 6), doorHinges, 'nos')
  const b1: CalcBlock = { id: 'doors', title: 'Doors and their frames', lines: L.take(), table: doorTable }

  /* windows */
  const panes = (o: Op) => (o.w <= PANE_W ? 1 : 2)
  const ids = (Object.keys(GLAZED) as (keyof typeof GLAZED)[]).map((id) => ({ id, n: open[id] })).filter((x) => x.n > 0)
  const glRows = ids.map(({ id, n }) => {
    const o = GLAZED[id]
    const frame = 2 * (o.w + o.h)
    const sash = id === 'vent' ? 0 : panes(o) * 2 * (o.h - SASH_DROP + o.w / panes(o))
    return { id, op: o, n, glass: n * area(o) * GLASS_SHARE * GLASS_WASTE, sections: n * (frame + sash) }
  })
  const glassTotal = glRows.reduce((s, r) => s + r.glass, 0)
  const sectionTotal = glRows.reduce((s, r) => s + r.sections, 0)
  const nGlazed = glRows.reduce((s, r) => s + r.n, 0)
  same(c, 'glass', glassTotal, w.glassTotal)
  same(c, 'window sections', sectionTotal, w.sectionTotal)
  same(c, 'glazed openings', nGlazed, w.nGlazed)
  // worked example: a bedroom window
  const bw = GLAZED.winB
  const eg = w.glRows.find((r) => r.id === 'winB')
  const glass1 = L.calc('Glass in one bedroom window', 'area × glass share × (1 + cutting)', '{w} × {h} × {s} × {k}', { w: bw.w, h: bw.h, s: GLASS_SHARE, k: GLASS_WASTE }, (v) => v.w * v.h * v.s * v.k,
    { unit: 'm²', dp: 3, ref: REF.assume, note: 'Glass is 80% of the opening, in 4 to 5.5 mm, with 5% for cutting.', ...(eg ? X(eg.glass / eg.n) : {}) })
  void glass1
  const fr1 = L.calc('Outer frame of the window', '2 × (width + height)', '2 × ({w} + {h})', { w: bw.w, h: bw.h }, (v) => 2 * (v.w + v.h), { unit: 'm', dp: 2, ref: REF.assume })
  const sash1 = L.calc('Sashes of the window', 'panes × 2 × (height − 0.1 + width ÷ panes)', '{p} × 2 × ({h} − {d} + {w} ÷ {p})', { p: panes(bw), h: bw.h, d: SASH_DROP, w: bw.w }, (v) => v.p * 2 * (v.h - v.d + v.w / v.p),
    { unit: 'm', dp: 2, ref: REF.assume, note: 'One pane up to 0.9 m wide, two above. A ventilator is a fixed louvre with no sash.' })
  L.calc('Aluminium or uPVC sections in one bedroom window', 'frame + sashes', '{a:2} + {b:2}', { a: fr1, b: sash1 }, (v) => v.a + v.b, { unit: 'm', dp: 2, ...(eg ? X(eg.sections / eg.n) : {}) })
  const glTable: CalcTable = {
    head: ['Opening', 'Size (m)', 'Number', 'Glass (m²)', 'Sections (m)'], num: [2, 3, 4],
    rows: glRows.map((r) => [r.op.name, `${fmt(r.op.w, 2)} × ${fmt(r.op.h, 2)}`, fmt(r.n), fmt(r.glass, 1), fmt(r.sections, 1)]),
    foot: ['All windows and glazed doors', '', fmt(nGlazed), fmt(glassTotal, 1), fmt(sectionTotal, 1)],
    note: 'The same steps as the worked window, with that window\'s size and the number of such openings. Grills, nets and sills are not counted.',
  }
  cmpTable(c, 'glazed', glRows.map((r) => [null, null, r.n, r.glass, r.sections]), [null, null, nGlazed, glassTotal, sectionTotal])
  T(c, 'Windows and glazed doors: number', repFoot(c, 'glazed', 2), nGlazed, 'nos')
  T(c, 'Windows and glazed doors: glass', repFoot(c, 'glazed', 3), glassTotal, 'm²', 1)
  T(c, 'Windows and glazed doors: sections', repFoot(c, 'glazed', 4), sectionTotal, 'm', 1)
  const b2: CalcBlock = { id: 'windows', title: 'Windows, ventilators and glazed doors', lines: L.take(), table: glTable }

  /* hardware */
  const locks = L.calc('Lock sets', 'main doors + bedrooms', '{a} + {b}', { a: open.main, b: agg.nBed }, (v) => v.a + v.b, { dp: 0, ref: REF.assume, note: 'One for the main door and one for every bedroom', ...X(w.locks) })
  const bolts = L.calc('Tower bolts', '2 × main doors + bathroom doors', '2 × {a} + {b}', { a: open.main, b: open.bath }, (v) => 2 * v.a + v.b, { dp: 0, ref: REF.assume, ...X(w.bolts) })
  const handles = L.calc('Handle pairs', 'one for every door', '{n}', { n: S.nDoors }, (v) => v.n, { dp: 0, ref: REF.assume, note: 'Glazed balcony doors are not given hardware in this count.' })
  const stoppers = L.calc('Door stoppers', 'one for every door', '{n}', { n: S.nDoors }, (v) => v.n, { dp: 0, ref: REF.assume })
  const hw = [doorHinges, locks, bolts, handles, stoppers]
  cmpTable(c, 'hw', hw.map((v) => [null, v, null]))
  ;['Door hinges', 'Lock sets', 'Tower bolts', 'Handle pairs', 'Door stoppers'].forEach((lab, i) => T(c, `Hardware: ${lab}`, repNum(c, 'hw', i, 1), hw[i], 'nos'))
  const b3: CalcBlock = { id: 'hardware', title: 'Door hardware', intro: 'Hinges are the total of the door table. The rest follow one set to a door.', lines: L.take() }

  const sections: CalcSection[] = [{ id: 's9', title: '9. Doors, windows, frames and hardware', intro: 'Sizes and counts are assumptions; the door designations are those of IS 1003 (Part 1).', blocks: [b1, b2, b3] }]
  return { sections, doorRows, frameTotal, doorHinges, locks, bolts, glassTotal, sectionTotal, nGlazed }
}
export type FitOut = ReturnType<typeof doorsAndWindows>
void REF_DS

export function carpentry(c: Ctx, P: PlanOut) {
  const { inp, w, L } = c
  const { agg, flats, h, N } = P
  const run = KITCHEN_RUN[inp.kitchenShape]
  const dwellings = flats ? h * N : 1
  const masterN = inp.wardrobes === 'none' ? 0 : Math.min(dwellings, agg.nBed)
  const otherN = inp.wardrobes === 'all' ? Math.max(0, agg.nBed - dwellings) : 0
  same(c, 'master wardrobes', masterN, w.masterN)
  same(c, 'other wardrobes', otherN, w.otherN)
  interface Row { item: string; n: number; w: number; cab: Cab; spec: { H: number; D: number; bay: number; fullShelves: number; topBottom: number; hingePerLeaf: number } }
  const cabs: Row[] = []
  const wd = (wid: number) => cabinet(wid, WARDROBE.H, WARDROBE.D, Math.ceil(wid / CAB.wardrobe.bay - 1e-9), CAB.wardrobe.fullShelves, CAB.wardrobe.topBottom, CAB.wardrobe.hingePerLeaf)
  if (masterN > 0) cabs.push({ item: 'Wardrobe, master bedroom', n: masterN, w: WARDROBE.master, cab: wd(WARDROBE.master), spec: { H: WARDROBE.H, D: WARDROBE.D, ...CAB.wardrobe } })
  if (otherN > 0) cabs.push({ item: 'Wardrobe, other bedroom', n: otherN, w: WARDROBE.other, cab: wd(WARDROBE.other), spec: { H: WARDROBE.H, D: WARDROBE.D, ...CAB.wardrobe } })
  if (inp.kitchenCabinets && agg.nKit > 0) {
    const wRun = run * WALL_UNIT.share
    cabs.push({ item: 'Kitchen, units below the counter', n: agg.nKit, w: run, cab: cabinet(run, BASE.H, BASE.D, Math.ceil(run / CAB.base.bay - 1e-9), CAB.base.fullShelves, CAB.base.topBottom, CAB.base.hingePerLeaf), spec: { H: BASE.H, D: BASE.D, ...CAB.base } })
    cabs.push({ item: 'Kitchen, units on the wall', n: agg.nKit, w: wRun, cab: cabinet(wRun, WALL_UNIT.H, WALL_UNIT.D, Math.ceil(wRun / CAB.wall.bay - 1e-9), CAB.wall.fullShelves, CAB.wall.topBottom, CAB.wall.hingePerLeaf), spec: { H: WALL_UNIT.H, D: WALL_UNIT.D, ...CAB.wall } })
  }
  if (cabs.length !== w.cabs.length) c.L.mismatches.push(`cabinet runs: ${cabs.length} in the sheet, ${w.cabs.length} in the engine`)
  if (cabs.length === 0) return { sections: [] as CalcSection[], sheetsPly19: 0, sheetsPly8: 0, sheetsLam: 0, edgeBand: 0, cabHinges: 0, cabHandles: 0, hasCarpentry: false }

  /* one run, worked: the first */
  const r0 = cabs[0]
  const e0 = w.cabs[0].cab
  const s = r0.spec
  const bays = L.calc(`${r0.item}: shutters (bays)`, 'bays = next whole number above (width ÷ bay width)', 'next whole number above {w} ÷ {b}', { w: r0.w, b: s.bay }, (v) => Math.ceil(v.w / v.b - 1e-9),
    { dp: 0, ref: REF.assume, ...X(e0.leaves) })
  const verticals = L.calc('Upright panels', 'bays + 1', '{b} + 1', { b: bays }, (v) => v.b + 1, { dp: 0, ref: REF.derived })
  const carcass = L.calc('Carcass panels (uprights, tops, bottoms, shelves)', 'uprights × H × D + (tops and bottoms + shelves) × width × D',
    '{v} × {H} × {D} + ({tb} + {fs}) × {w} × {D}', { v: verticals, H: s.H, D: s.D, tb: s.topBottom, fs: s.fullShelves, w: r0.w }, (v) => v.v * v.H * v.D + (v.tb + v.fs) * v.w * v.D,
    { unit: 'm²', dp: 2, ref: REF.derived, note: 'Worked from the box geometry. No source gives plywood a running metre.', ...X(e0.carcass) })
  const shut = L.calc('Shutters', 'width × H', '{w} × {H}', { w: r0.w, H: s.H }, (v) => v.w * v.H, { unit: 'm²', dp: 2, ref: REF.derived, ...X(e0.shutters) })
  L.calc('Back panel, 8 mm', 'width × H', '{w} × {H}', { w: r0.w, H: s.H }, (v) => v.w * v.H, { unit: 'm²', dp: 2, ref: REF.derived, ...X(e0.back) })
  L.calc('Edge band', 'uprights × H + (tops and bottoms + shelves) × width + 2 × width + 2 × bays × H', '{v} × {H} + ({tb} + {fs}) × {w} + 2 × {w} + 2 × {b} × {H}',
    { v: verticals, H: s.H, tb: s.topBottom, fs: s.fullShelves, w: r0.w, b: bays }, (v) => v.v * v.H + (v.tb + v.fs) * v.w + 2 * v.w + 2 * v.b * v.H,
    { unit: 'm', dp: 2, ref: REF.derived, note: 'The front edges of the uprights and shelves, and the four edges of every shutter.', ...X(e0.edge) })
  L.calc('Hinges', 'bays × hinges to a shutter', '{b} × {k}', { b: bays, k: s.hingePerLeaf }, (v) => v.b * v.k, { dp: 0, ref: REF.assume, ...X(e0.hinges) })
  void carcass; void shut
  const b1: CalcBlock = { id: 'cab-ex', title: `${r0.item}, worked from its box (one unit)`, lines: L.take() }

  const rows = cabs.map((r) => ({ ...r, p19: r.n * (r.cab.carcass + r.cab.shutters), p8: r.n * r.cab.back, eb: r.n * r.cab.edge, hg: r.n * r.cab.hinges }))
  const cabTable: CalcTable = {
    head: ['Item', 'Number', 'Width (m)', '19 mm panels (m²)', '8 mm back (m²)', 'Edge band (m)', 'Hinges'], num: [1, 2, 3, 4, 5, 6],
    rows: rows.map((r) => [r.item, fmt(r.n), fmt(r.w, 2), fmt(r.p19, 1), fmt(r.p8, 1), fmt(r.eb, 1), fmt(r.hg)]),
    note: 'Every unit is worked the same way as the one above. Wardrobes are 2.1 m high and 0.6 m deep; units below the counter 0.72 m high; units on the wall 0.35 m deep and 70% of the run.',
  }
  cmpTable(c, 'carp', rows.map((r) => [null, r.n, r.w, r.p19, r.p8, r.eb, r.hg]))
  rows.forEach((r, i) => T(c, `Carpentry: ${r.item}, 19 mm panels`, repNum(c, 'carp', i, 3), r.p19, 'm²', 1))
  const b2: CalcBlock = { id: 'cab-all', title: 'Wardrobes and kitchen units', table: cabTable }

  /* sheets */
  const total = (label: string, pick: (r: (typeof rows)[number]) => number, unit: string, expect: number, ref = REF.derived) => {
    const v: Vars = {}
    rows.forEach((r, i) => { v[NAMES[i] + 'n'] = r.n; v[NAMES[i] + 'x'] = pick(r) / r.n })
    return L.calc(label, 'Σ number × figure for one', rows.map((_r, i) => `{${NAMES[i]}n} × {${NAMES[i]}x:2}`).join(' + '), v,
      (x) => rows.reduce((t, _r, i) => t + x[NAMES[i] + 'n'] * x[NAMES[i] + 'x'], 0), { unit, dp: 1, ref, ...X(expect) })
  }
  const ply19 = total('19 mm plywood panels', (r) => r.p19, 'm²', w.ply19)
  const ply8 = total('8 mm plywood backs', (r) => r.p8, 'm²', w.ply8)
  const laminate = L.calc('Laminate, both faces of every 19 mm panel', '2 × 19 mm panels', '2 × {a:1}', { a: ply19 }, (v) => 2 * v.a, { unit: 'm²', dp: 1, ref: REF.rule, note: '1 mm outside and a balancing sheet inside.', ...X(w.laminate) })
  const edgeBand = total('Edge band', (r) => r.eb, 'm', w.edgeBand)
  const cabHinges = total('Cabinet hinges', (r) => r.hg, 'nos', w.cabHinges)
  const cabHandles = total('Cabinet handles', (r) => r.n * r.cab.leaves, 'nos', w.cabHandles, REF.assume)
  const sh = (label: string, m2: number, expect: number) =>
    L.calc(label, 'sheets = next whole number above (area × 1.12 ÷ sheet area)', 'next whole number above ({a:1} × {k}) ÷ {s:3}', { a: m2, k: CUT_WASTE, s: SHEET_M2 }, (v) => Math.ceil((v.a * v.k) / v.s - 1e-9),
      { unit: 'sheets', dp: 0, ref: 'IS 303:2024 cl. 8.1 (sheet 2440 × 1220 mm); cutting allowance is an assumption', result: true, ...X(expect) })
  const sheetsPly19 = sh('Sheets of 19 mm plywood', ply19, w.sheetsPly19)
  const sheetsPly8 = sh('Sheets of 8 mm plywood', ply8, w.sheetsPly8)
  const sheetsLam = sh('Sheets of laminate', laminate, w.sheetsLam)
  cmpTable(c, 'sheets', [[null, ply19, sheetsPly19], [null, ply8, sheetsPly8], [null, laminate, sheetsLam]])
  T(c, 'Sheets: 19 mm plywood', repNum(c, 'sheets', 0, 2), sheetsPly19, 'sheets')
  T(c, 'Sheets: 8 mm plywood', repNum(c, 'sheets', 1, 2), sheetsPly8, 'sheets')
  T(c, 'Sheets: laminate', repNum(c, 'sheets', 2, 2), sheetsLam, 'sheets')
  const b3: CalcBlock = { id: 'sheets', title: 'Plywood and laminate to order', intro: 'A sheet is 2440 × 1220 mm. Plywood is 19 mm for the carcass and shutters and 8 mm for the backs.', lines: L.take() }

  const sections: CalcSection[] = [{ id: 's10', title: '10. Wardrobes and kitchen units', blocks: [b1, b2, b3] }]
  return { sections, sheetsPly19, sheetsPly8, sheetsLam, edgeBand, cabHinges, cabHandles, hasCarpentry: true }
}
export type CarpOut = ReturnType<typeof carpentry>
