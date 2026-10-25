/*
  InteriorPro calculation sheet, part 3: tiles, skirting, the bed or adhesive, grout, wet areas and stone.
*/

import type { CalcBlock, CalcSection, CalcTable, Vars } from '@/lib/calcsheet'
import { fmt, round } from '../util'
import {
  ADHESIVE_BAG_KG, BED, CEMENT_BAG_KG, GROUT_KG_L, GROUT_WASTE, TILES, adhesivePerM2, groutPerM2, tileWaste, tilesPerM2, type TileDef,
} from './finish'
import { COUNTER_D, DOOR, GLAZED, GRANITE_WASTE, SKIRT_H, SKIRT_LOSS, WP_UPSTAND } from './model'
import { REF, T, X, cmpTable, repNum, same, sameArr, type Ctx } from './calc-kit'
import type { PlanOut } from './calc-plan'
import type { SurfOut } from './calc-surf'

const NAMES = ['a', 'b', 'd', 'e', 'f', 'g']

export function tiles(c: Ctx, P: PlanOut, S: SurfOut) {
  const { inp, w, L } = c
  const { agg, open } = P
  const mainT = TILES[inp.tileSize]
  const T300 = TILES['300x300']
  const T3060 = TILES['300x600']

  /* the tiles: size, joint, pieces to the square metre */
  const perM2 = (t: TileDef) => tilesPerM2(t)
  const pieces = L.calc('Tiles in one square metre (floor tile)', 'n = 1 ÷ ((L + J) × (W + J))', '1 ÷ (({L} + {J}) × ({W} + {J}))', { L: mainT.L, J: mainT.J, W: mainT.W },
    (v) => 1 / ((v.L + v.J) * (v.W + v.J)), { unit: 'tiles', dp: 3, ref: REF.derived, note: 'Lengths in metres. Each tile takes its own size plus one joint in each direction.', ...X(perM2(mainT)) })
  void pieces
  const b0: CalcBlock = { id: 'tile-ex', title: 'Pieces to the square metre', lines: L.take() }

  /* skirting */
  const skirtRM = L.calc('Skirting, running metres', 'wall round bedrooms, living rooms, passages and lobby − door widths',
    'larger of 0 and ({pb:1} + {pl:1} + {pp:1} + {pc:1} − (2 × {nb} × {wr} + {nk} × {wr} + {ob} × {wb} + {om} × {wm} + {oc} × {wc}))',
    { pb: agg.pBed, pl: agg.pLiv, pp: agg.pPass, pc: agg.pCore, nb: agg.nBed, nk: agg.nKit, wr: DOOR.room.w, ob: open.bath, wb: DOOR.bath.w, om: open.main, wm: DOOR.main.w, oc: open.balc, wc: GLAZED.balc.w },
    (v) => Math.max(0, v.pb + v.pl + v.pp + v.pc - (2 * v.nb * v.wr + v.nk * v.wr + v.ob * v.wb + v.om * v.wm + v.oc * v.wc)),
    { unit: 'm', dp: 1, ref: REF.p11, note: 'Skirting is measured in running metres. Each bedroom door is taken out twice (the skirting is broken on both sides of it), each kitchen, bathroom, main and balcony door once. Kitchen and bathroom walls are tiled to a height, so they carry no skirting.', ...X(w.skirtRM) })
  const skirtArea = L.calc('Tile for the skirting', 'length × height × (1 + cutting)', '{l:1} × {h} × {k}', { l: skirtRM, h: SKIRT_H, k: SKIRT_LOSS }, (v) => v.l * v.h * v.k,
    { unit: 'm²', dp: 2, ref: REF.assume, note: 'Skirting is 100 mm high and cut from the floor tile; 10% is allowed for cutting.', ...X(w.skirtArea) })
  const b1: CalcBlock = { id: 'skirting', title: 'Skirting', lines: L.take() }

  /* tile uses */
  interface Use { label: string; t: TileDef; net: number; waste: number; buy: number; pcs: number }
  const mk = (label: string, t: TileDef, net: number, small: boolean): Use => {
    const waste = tileWaste(t, inp.lay, small)
    const buy = net * (1 + waste)
    return { label, t, net, waste, buy, pcs: Math.ceil(buy * tilesPerM2(t) - 1e-9) }
  }
  const uses: Use[] = [
    mk('Floors of rooms, with skirting', mainT, S.floorMain + skirtArea, false),
    mk('Bathroom floors', T300, agg.aBath, true),
    ...(S.balcFloor > 0 ? [mk('Balcony floors', T300, S.balcFloor, true)] : []),
    mk('Bathroom walls', T3060, S.bathWallTile, true),
    mk('Kitchen wall above the counter', T3060, S.kitSplash, true),
  ].filter((u) => u.net > 1e-9)
  sameArr(c, 'tile use net', uses.map((u) => u.net), w.tileUses.map((u) => u.net))
  sameArr(c, 'tile use buy', uses.map((u) => u.buy), w.tileUses.map((u) => u.buy))
  sameArr(c, 'tile use pieces', uses.map((u) => u.pcs), w.tileUses.map((u) => u.pcs))

  const u0 = uses[0]
  const net0 = L.calc('Floor tile, net area', 'floors of rooms + skirting', '{f:1} + {s:2}', { f: S.floorMain, s: skirtArea }, (v) => v.f + v.s, { unit: 'm²', dp: 1, ...X(u0.net) })
  L.pick('Allowance for breakage and cutting', 'by layout, tile size and room size', `${round(u0.waste * 100)}%`, REF.assume,
    'No standard fixes it. Straight laying 5%, diagonal 10%; large tiles (800 × 800, 600 × 1200) 5 points more; 10% in bathrooms, on balconies and for the kitchen wall.')
  const buy0 = L.calc('Floor tile to buy', 'net × (1 + allowance)', '{n:1} × (1 + {x})', { n: net0, x: u0.waste }, (v) => v.n * (1 + v.x), { unit: 'm²', dp: 1, ...X(u0.buy) })
  L.calc('Floor tile, pieces', 'pieces = whole number above (area to buy × tiles in 1 m²)', 'next whole number above {b:1} × {p:3}', { b: buy0, p: perM2(u0.t) }, (v) => Math.ceil(v.b * v.p - 1e-9),
    { unit: 'tiles', dp: 0, ref: REF.derived, ...X(u0.pcs) })
  const useTable: CalcTable = {
    head: ['Use', 'Tile', 'Net area (m²)', 'Extra', 'To buy (m²)', 'Pieces'], num: [2, 3, 4, 5],
    rows: uses.map((u) => [u.label, u.t.label, fmt(u.net, 1), `${round(u.waste * 100)}%`, fmt(u.buy, 1), fmt(u.pcs)]),
    note: 'Pieces are worked out from each use on its own, so they can add up to a little more than the pieces to order below, which are worked out from the total area of each size.',
  }
  cmpTable(c, 'tile-use', uses.map((u) => [null, null, u.net, round(u.waste * 100), u.buy, u.pcs]))
  uses.forEach((u, i) => {
    T(c, `Tiles to buy, ${u.label}`, repNum(c, 'tile-use', i, 4), u.buy, 'm²', 1)
    T(c, `Tile pieces, ${u.label}`, repNum(c, 'tile-use', i, 5), u.pcs, 'nos')
  })
  const b2: CalcBlock = { id: 'tile-use', title: 'Tile area and pieces, use by use', intro: 'The first use is worked in full; the rest follow the same steps and are in the table.', lines: L.take(), table: useTable }

  /* tiles to order, by size */
  const by = new Map<string, { t: TileDef; net: number; buy: number }>()
  for (const u of uses) {
    const e = by.get(u.t.key) ?? { t: u.t, net: 0, buy: 0 }
    e.net += u.net
    e.buy += u.buy
    by.set(u.t.key, e)
  }
  const sizeRows = [...by.values()].map((e) => {
    const pcs = Math.ceil(e.buy * tilesPerM2(e.t) - 1e-9)
    const boxes = e.t.pcsBox ? Math.ceil(pcs / e.t.pcsBox - 1e-9) : null
    return { ...e, pcs, boxes }
  })
  sameArr(c, 'tile size pieces', sizeRows.map((r) => r.pcs), w.sizeRows.map((r) => r.pcs))
  sameArr(c, 'tile size boxes', sizeRows.map((r) => r.boxes ?? -1), w.sizeRows.map((r) => r.boxes ?? -1))
  const vars: Vars = {}
  sizeRows.forEach((r, i) => { vars[NAMES[i]] = r.buy })
  const tileBuyTotal = L.calc('Tiles to buy, all sizes', 'sum of the area to buy of each size', sizeRows.map((_, i) => `{${NAMES[i]}:1}`).join(' + '), vars,
    (v) => sizeRows.reduce((s, _r, i) => s + v[NAMES[i]], 0), { unit: 'm²', dp: 1, result: true, ...X(w.tileBuyTotal) })
  const orderTable: CalcTable = {
    head: ['Tile', 'Net (m²)', 'To buy (m²)', 'Pieces', 'In a box', 'Boxes'], num: [1, 2, 3, 5],
    rows: sizeRows.map((r) => [r.t.label, fmt(r.net, 1), fmt(r.buy, 1), fmt(r.pcs), r.t.pcsBox ? `${r.t.pcsBox} pieces, ${fmt(r.t.m2Box ?? 0, 2)} m²` : 'Not in the data read', r.boxes === null ? '–' : fmt(r.boxes)]),
    note: 'Pieces = the next whole number above (area to buy × tiles in 1 m²). Boxes = the next whole number above (pieces ÷ pieces in a box). Box sizes are one maker\'s and differ with the maker.',
  }
  cmpTable(c, 'tile-buy', sizeRows.map((r) => [null, r.buy, r.pcs, null, r.boxes === null ? null : r.boxes]))
  sizeRows.forEach((r, i) => {
    T(c, `Tiles to order, ${r.t.label}: pieces`, repNum(c, 'tile-buy', i, 2), r.pcs, 'nos')
    if (r.boxes !== null) T(c, `Tiles to order, ${r.t.label}: boxes`, repNum(c, 'tile-buy', i, 4), r.boxes, 'boxes')
  })
  const sizeTable: CalcTable = {
    head: ['Tile', 'Length (mm)', 'Width (mm)', 'Joint (mm)', 'Thickness (mm)', 'Tiles in 1 m²'], num: [1, 2, 3, 4, 5],
    rows: sizeRows.map((r) => [r.t.label, fmt(r.t.L * 1000), fmt(r.t.W * 1000), fmt(r.t.J * 1000, 1), fmt(r.t.T * 1000, 1), fmt(perM2(r.t), 2)]),
    note: 'Joint widths and thicknesses are the tool\'s assumption (typical values); box contents are from one maker\'s data sheet.',
  }
  const b3: CalcBlock = { id: 'tile-order', title: 'Tiles to order, by size', lines: L.take(), table: orderTable }
  const b3b: CalcBlock = { id: 'tile-sizes', title: 'Sizes of the tiles used', table: sizeTable }

  /* fixing */
  let bedCementKg = 0, bedSandM3 = 0, bedCementBags = 0, adhesiveKg = 0, adhesiveBags = 0
  const floorFix = S.floorMain + agg.aBath + S.balcFloor
  const wallFix = S.bathWallTile + S.kitSplash + skirtArea
  let adhTable: CalcTable | undefined
  if (inp.tileFix === 'mortar') {
    const fl = L.calc('Area fixed on the floor bed', 'rooms + bathrooms + balconies', '{a:1} + {b:1} + {d:1}', { a: S.floorMain, b: agg.aBath, d: S.balcFloor }, (v) => v.a + v.b + v.d, { unit: 'm²', dp: 1, ...X(w.floorFix) })
    const wl = L.calc('Area fixed on the wall bed', 'bathroom walls + kitchen wall + skirting', '{a:1} + {b:1} + {d:2}', { a: S.bathWallTile, b: S.kitSplash, d: skirtArea }, (v) => v.a + v.b + v.d, { unit: 'm²', dp: 1, ...X(w.wallFix) })
    bedCementKg = L.calc('Cement for the bed and slurry', 'floor × 11.0 + wall × 9.2', '{f:1} × {cf} + {w:1} × {cw}', { f: fl, cf: BED.floor.cementKg, w: wl, cw: BED.wall.cementKg }, (v) => v.f * v.cf + v.w * v.cw,
      { unit: 'kg', dp: 0, ref: 'CPWD item text as quoted in public tenders (20 mm bed of 1:4 mortar on floors, 12 mm of 1:3 on walls, with a cement slurry); cement worked from the DAR yield', note: 'The kilograms of cement in the bed and slurry for one m².', ...X(w.bedCementKg) })
    bedSandM3 = L.calc('Sand for the bed', 'floor × 0.022 + wall × 0.0125', '{f:1} × {sf} + {w:1} × {sw}', { f: fl, sf: BED.floor.sandM3, w: wl, sw: BED.wall.sandM3 }, (v) => v.f * v.sf + v.w * v.sw,
      { unit: 'm³', dp: 2, ref: 'CPWD item text as quoted in public tenders', ...X(w.bedSandM3) })
    bedCementBags = L.calc('Bags of cement', 'whole bags of 50 kg', 'next whole number above {k:0} ÷ {b}', { k: bedCementKg, b: CEMENT_BAG_KG }, (v) => Math.ceil(v.k / v.b - 1e-9), { unit: 'bags', dp: 0, ...X(w.bedCementBags) })
  } else {
    const rows: string[][] = []
    const av: Vars = {}
    uses.forEach((u, i) => { av[NAMES[i] + 'n'] = u.net; av[NAMES[i] + 'r'] = adhesivePerM2(u.t); rows.push([u.label, fmt(u.net, 1), fmt(adhesivePerM2(u.t), 2), fmt(u.net * adhesivePerM2(u.t), 1)]) })
    adhTable = {
      head: ['Use', 'Net area (m²)', 'Adhesive (kg a m²)', 'Adhesive (kg)'], num: [1, 2, 3], rows,
      note: 'Maker\'s sheet: 5.25 kg a m² for tiles up to 900 cm² (6 mm notch), 10.5 kg a m² up to 3,600 cm² (12 mm notch). For a tile larger than that InteriorPro uses 12.0 kg a m², which is an assumption.',
    }
    adhesiveKg = L.calc('Tile adhesive', 'Σ net area × kg a m²', uses.map((_u, i) => `{${NAMES[i]}n:1} × {${NAMES[i]}r}`).join(' + '), av,
      (v) => uses.reduce((s, _u, i) => s + v[NAMES[i] + 'n'] * v[NAMES[i] + 'r'], 0), { unit: 'kg', dp: 0, ref: REF.maker, ...X(w.adhesiveKg) })
    adhesiveBags = L.calc('Bags of adhesive', 'whole bags of 20 kg', 'next whole number above {k:0} ÷ {b}', { k: adhesiveKg, b: ADHESIVE_BAG_KG }, (v) => Math.ceil(v.k / v.b - 1e-9), { unit: 'bags', dp: 0, ...X(w.adhesiveBags) })
  }
  same(c, 'floor bed area', floorFix, w.floorFix)
  same(c, 'wall bed area', wallFix, w.wallFix)
  const b4: CalcBlock = { id: 'fixing', title: inp.tileFix === 'mortar' ? 'Fixing: mortar bed and slurry' : 'Fixing: tile adhesive', lines: L.take(), table: adhTable }

  /* grout */
  const gt = sizeRows[0].t
  const g1 = L.calc(`Grout in 1 m² of ${gt.label} tiling`, 'g = 1.6 × 1000 × (1 ÷ L + 1 ÷ W) × J × T', '{d} × 1000 × (1 ÷ {L} + 1 ÷ {W}) × {J} × {T}', { d: GROUT_KG_L, L: gt.L, W: gt.W, J: gt.J, T: gt.T },
    (v) => v.d * 1000 * (1 / v.L + 1 / v.W) * v.J * v.T, { unit: 'kg', dp: 3, ref: REF.derived, note: 'Joint length in 1 m² × joint width × tile thickness gives the volume of grout; 1.6 kg a litre is the density InteriorPro assumes (1.4 to 1.6).', ...X(groutPerM2(gt)) })
  const gv: Vars = {}
  const gRows: string[][] = []
  sizeRows.forEach((r, i) => { const kg = r.net * groutPerM2(r.t) * GROUT_WASTE; gv[NAMES[i]] = kg; gRows.push([r.t.label, fmt(r.net, 1), fmt(groutPerM2(r.t), 3), fmt(kg, 1)]) })
  void g1
  const groutKg = L.calc('Grout, all sizes', 'Σ net area × kg a m² × 1.10', sizeRows.map((_r, i) => `{${NAMES[i]}:1}`).join(' + '), gv, (v) => sizeRows.reduce((s, _r, i) => s + v[NAMES[i]], 0),
    { unit: 'kg', dp: 0, ref: REF.derived, note: 'Net area of every tile (no breakage), with 10% extra for wastage. The 10% is an assumption.', result: true, ...X(w.groutKg) })
  const b5: CalcBlock = {
    id: 'grout', title: 'Grout', lines: L.take(),
    table: { head: ['Tile', 'Net area (m²)', 'Grout (kg a m²)', 'Grout with 10% extra (kg)'], num: [1, 2, 3], rows: gRows },
  }

  /* wet areas and stone */
  const wpArea = L.calc('Waterproofing coat in the bathrooms', 'bathroom floors + wall length × 0.30', '{a:1} + {p:1} × {u}', { a: agg.aBath, p: agg.pBath, u: WP_UPSTAND }, (v) => v.a + v.p * v.u,
    { unit: 'm²', dp: 1, ref: 'IS 3067:1988 (area only; its scope is basements and roofs, so the coverage is left to the product\'s data sheet)', note: 'The floor and 0.30 m up the walls. Test by ponding water for 24 hours before tiling.', ...X(w.wpArea) })
  const fillet = L.calc('Corner fillet and mesh', 'wall length of the bathrooms', '{p:1}', { p: agg.pBath }, (v) => v.p, { unit: 'm', dp: 1, ref: REF.assume })
  const thresholdRM = L.calc('Door thresholds, length', 'bathroom + main + balcony door widths', '{ob} × {wb} + {om} × {wm} + {oc} × {wc}', { ob: open.bath, wb: DOOR.bath.w, om: open.main, wm: DOOR.main.w, oc: open.balc, wc: GLAZED.balc.w },
    (v) => v.ob * v.wb + v.om * v.wm + v.oc * v.wc, { unit: 'm', dp: 1, ref: REF.assume, ...X(w.thresholdRM) })
  const thresholdN = L.calc('Door thresholds, number', 'bathroom + main + balcony doors', '{ob} + {om} + {oc}', { ob: open.bath, om: open.main, oc: open.balc }, (v) => v.ob + v.om + v.oc, { dp: 0, ...X(w.thresholdN) })
  const counterArea = L.calc('Kitchen counter, granite', 'kitchens × run × depth', '{n} × {r} × {d}', { n: agg.nKit, r: S.run, d: COUNTER_D }, (v) => v.n * v.r * v.d, { unit: 'm²', dp: 2, ref: REF.assume, note: 'Counter 0.60 m deep along the kitchen run you chose.', ...X(w.counterArea) })
  const granite = L.calc('Granite to buy', 'counter × (1 + cutting)', '{a:2} × {k}', { a: counterArea, k: GRANITE_WASTE }, (v) => v.a * v.k, { unit: 'm²', dp: 1, ref: REF.assume, note: '10% for cutting and the sink.' })
  const counterEdge = L.calc('Counter edge, moulded', 'kitchens × run', '{n} × {r}', { n: agg.nKit, r: S.run }, (v) => v.n * v.r, { unit: 'm', dp: 1, ref: REF.assume, ...X(w.counterEdge) })
  const b6: CalcBlock = { id: 'wet', title: 'Bathroom waterproofing, thresholds and the kitchen counter', lines: L.take() }

  // the report's two tables
  const fixRows: (string | number | null)[][] = inp.tileFix === 'mortar'
    ? [[null, bedCementKg], [null, bedSandM3]]
    : [[null, adhesiveKg]]
  fixRows.push([null, groutKg], [null, skirtRM], [null, wpArea], [null, fillet])
  cmpTable(c, 'fix', fixRows)
  const fixLab = inp.tileFix === 'mortar' ? ['Cement for the bed', 'Sand for the bed'] : ['Tile adhesive']
  const fixUnit = inp.tileFix === 'mortar' ? ['kg', 'm³'] : ['kg']
  const fixDp = inp.tileFix === 'mortar' ? [0, 2] : [0]
  ;[...fixLab, 'Grout', 'Skirting', 'Waterproofing coat', 'Corner fillet and mesh'].forEach((lab, i) => {
    const val = fixRows[i][1] as number
    const unit = [...fixUnit, 'kg', 'm', 'm²', 'm'][i]
    const dp = [...fixDp, 0, 1, 1, 1][i]
    T(c, `Fixing and wet areas: ${lab}`, repNum(c, 'fix', i, 1), val, unit, dp)
  })
  const stoneRows: (string | number | null)[][] = [[null, thresholdN]]
  if (agg.nKit > 0) stoneRows.push([null, granite], [null, counterEdge])
  cmpTable(c, 'stone', stoneRows)
  ;['Door thresholds', 'Kitchen counter, granite', 'Counter edge'].slice(0, stoneRows.length).forEach((lab, i) => {
    T(c, `Stone: ${lab}`, repNum(c, 'stone', i, 1), stoneRows[i][1] as number, ['nos', 'm²', 'm'][i], [0, 1, 1][i])
  })

  const sections: CalcSection[] = [
    { id: 's5', title: '5. Floor and wall tiles, skirting, fixing and grout', intro: 'Floors are measured before the skirting and dado go on (IS 1200 Part 11). Pieces are counted from the size of the tile plus its joint.', blocks: [b0, b3b, b1, b2, b3, b4, b5] },
    { id: 's6', title: '6. Wet areas and stone', blocks: [b6] },
  ]
  return { sections, tileBuyTotal, sizeRows, bedCementBags, bedSandM3, adhesiveBags, groutKg, wpArea, thresholdRM, thresholdN, counterArea, granite, counterEdge, skirtRM }
}
export type TileOut = ReturnType<typeof tiles>
