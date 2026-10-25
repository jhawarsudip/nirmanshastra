/*
  InteriorPro calculation sheet, part 2: the surfaces, measured the way IS 1200 measures them.
*/

import type { CalcBlock, CalcSection, CalcTable } from '@/lib/calcsheet'
import { fmt } from '../util'
import {
  BALCONY, DADO, DOOR, DOOR_H, GLAZED, KITCHEN_RUN, MUMTY, PARAPET_H, PARAPET_T, PLINTH_ABOVE, SLAB_T, SPLASH_H,
} from './model'
import { REF, T, X, cmpTable, repNum, type Ctx } from './calc-kit'
import type { PlanOut } from './calc-plan'

export function surfaces(c: Ctx, P: PlanOut) {
  const { inp, w, L } = c
  const { flats, Hc, H, plans, agg, open, balcTotal, hasMumty, N } = P
  const area = (o: { w: number; h: number }) => o.w * o.h
  const dado = inp.bathTile === 'full' ? DADO.full : DADO.half
  const run = KITCHEN_RUN[inp.kitchenShape]

  /* walls of the rooms and passages */
  const wallsGross = L.calc('Walls, before openings', 'Walls = (bedrooms + living rooms + kitchens + passages + lobby wall) × Hc',
    '({a:1} + {b:1} + {d:1} + {e:1} + {f:1}) × {Hc:2}', { a: agg.pBed, b: agg.pLiv, d: agg.pKit, e: agg.pPass, f: agg.pCore, Hc },
    (v) => (v.a + v.b + v.d + v.e + v.f) * v.Hc, { unit: 'm²', dp: 1, ref: REF.p13m, note: 'Every room is measured round its own walls, so a wall between two rooms is counted once for each face, as it is painted on both. Bathrooms are done separately.', ...X(w.wallsGross) })
  const dedRoom = L.calc('Room doors taken out', 'doors × width × height', '{n} × ({w} × {h})', { n: open.room, w: DOOR.room.w, h: DOOR.room.h }, (v) => v.n * (v.w * v.h),
    { unit: 'm²', dp: 2, ref: REF.p13, note: 'Each is 0.5 to 3 m² and has the same finish on both faces, so one face is taken out.', ...X(w.dedRoomDoors) })
  const dedMain = L.calc('Main doors taken out', 'doors × width × height × share', '{n} × ({w} × {h}) × {f}', { n: open.main, w: DOOR.main.w, h: DOOR.main.h, f: flats ? 1 : 0.5 }, (v) => v.n * (v.w * v.h) * v.f,
    { unit: 'm²', dp: 2, ref: REF.p13, note: flats ? 'A flat door opens to the common lobby, so all of it comes off the inside.' : 'The finish differs inside and outside, so half comes off each face.', ...X(w.dedMain) })
  const g = GLAZED
  const dedWin = L.calc('Windows and balcony doors taken out (inside half)', '0.5 × Σ number × area',
    '0.5 × ({nb} × {ab:2} + {nl} × {al:2} + {nk} × {ak:2} + {ns} × {as:2} + {nc} × {ac:2})',
    { nb: open.winB, ab: area(g.winB), nl: open.winL, al: area(g.winL), nk: open.winK, ak: area(g.winK), ns: open.winS, as: area(g.winS), nc: open.balc, ac: area(g.balc) },
    (v) => 0.5 * (v.nb * v.ab + v.nl * v.al + v.nk * v.ak + v.ns * v.as + v.nc * v.ac),
    { unit: 'm²', dp: 2, ref: REF.p13, note: 'Different finishes inside and outside, equal reveals: half of the opening comes off each face.', ...X(w.dedWin) })
  const kitSplash = L.calc('Tiled wall above the kitchen counter', 'kitchens × run × height', '{n} × {r} × {s}', { n: agg.nKit, r: run, s: SPLASH_H }, (v) => v.n * v.r * v.s,
    { unit: 'm²', dp: 2, ref: REF.assume, note: 'Counter run and 0.6 m of tile above it; this wall is tiled, not painted.', ...X(w.kitSplash) })
  const wallsDed = L.calc('Total taken out of the walls', 'doors + windows + tiled wall', '{a:2} + {b:2} + {d:2} + {e:2}', { a: dedRoom, b: dedMain, d: dedWin, e: kitSplash }, (v) => v.a + v.b + v.d + v.e,
    { unit: 'm²', dp: 2, ...X(w.wallsDed) })
  const wallsNet = L.calc('Walls to be painted', 'gross − taken out (not below zero)', 'larger of 0 and ({g:1} − {d:1})', { g: wallsGross, d: wallsDed }, (v) => Math.max(0, v.g - v.d),
    { unit: 'm²', dp: 1, ref: REF.p13m, result: true, ...X(w.wallsNet) })
  const b1: CalcBlock = { id: 'walls', title: 'Walls of the rooms and passages', lines: L.take() }

  /* bathrooms */
  L.input('Height of the bathroom wall tiling', `${fmt(dado, 1)} m`, REF.assume, inp.bathTile === 'full' ? 'To the door height (2.1 m)' : 'Half way up (1.2 m)')
  const bathWallTile = L.calc('Bathroom wall tiles', 'wall length × tiling height − door × width × lower of door height and tiling height',
    'larger of 0 and ({p:1} × {d} − {n} × {dw} × lower of {dh} and {d})', { p: agg.pBath, d: dado, n: open.bath, dw: DOOR.bath.w, dh: DOOR_H },
    (v) => Math.max(0, v.p * v.d - v.n * v.dw * Math.min(v.dh, v.d)), { unit: 'm²', dp: 1, ref: REF.p11, note: 'A dado is measured in square metres.', result: true, ...X(w.bathWallTile) })
  const bathAbove = L.calc('Bathroom wall above the tiles', 'wall length × (Hc − tiling height)', '{p:1} × ({Hc:2} − {d})', { p: agg.pBath, Hc, d: dado }, (v) => v.p * (v.Hc - v.d),
    { unit: 'm²', dp: 1, ref: REF.p13m, ...X(w.bathAbove) })
  const bathAboveDed = L.calc('Door taken out above the tiles', 'doors × width × (door height − tiling height, not below zero)', '{n} × {dw} × larger of 0 and ({dh} − {d})', { n: open.bath, dw: DOOR.bath.w, dh: DOOR_H, d: dado },
    (v) => v.n * v.dw * Math.max(0, v.dh - v.d), { unit: 'm²', dp: 1, ref: REF.p13, ...X(w.bathAboveDed) })
  const bathPaint = L.calc('Bathroom walls to be painted', 'above − door', 'larger of 0 and ({a:1} − {d:1})', { a: bathAbove, d: bathAboveDed }, (v) => Math.max(0, v.a - v.d),
    { unit: 'm²', dp: 1, ...X(w.bathPaint) })
  const b2: CalcBlock = { id: 'bath', title: 'Bathroom walls: the tiled part and the painted part', lines: L.take() }

  /* ceilings and the inside total */
  const wallPaint = L.calc('All inside walls to be painted', 'rooms + bathrooms', '{a:1} + {b:1}', { a: wallsNet, b: bathPaint }, (v) => v.a + v.b, { unit: 'm²', dp: 1, ...X(w.wallPaint) })
  const roomsArea = L.calc('Ceilings', 'sum of every room floor area', '{a:1} + {b:1} + {d:1} + {e:1} + {f:1} + {g:1}',
    { a: agg.aBed, b: agg.aLiv, d: agg.aKit, e: agg.aBath, f: agg.aPass, g: agg.aCore }, (v) => v.a + v.b + v.d + v.e + v.f + v.g,
    { unit: 'm²', dp: 1, ref: REF.p13m, note: 'Painted whether the ceiling is the slab or a false ceiling board. Nothing is taken out.', result: true, ...X(w.roomsArea) })
  const interiorPaint = L.calc('Inside area to be painted', 'walls + ceilings', '{a:1} + {b:1}', { a: wallPaint, b: roomsArea }, (v) => v.a + v.b,
    { unit: 'm²', dp: 1, result: true, ...X(w.interiorPaint) })
  const b3: CalcBlock = { id: 'ceil', title: 'Ceilings and the whole inside', lines: L.take() }

  /* outside */
  const sumPH = plans.reduce((s, p) => s + p.P * H, 0)
  const faceTable: CalcTable = {
    head: ['Floor', 'Outer wall (m)', 'Floor to floor (m)', 'Outer face (m²)'], num: [1, 2, 3],
    rows: plans.map((p) => [p.name, fmt(p.P, 2), fmt(H, 2), fmt(p.P * H, 2)]), foot: ['All floors', '', '', fmt(sumPH, 2)],
  }
  const topP = plans[N - 1].P
  let extPaint = 0
  const b4lines: CalcBlock[] = []
  let outFace = 0, parapetFaces = 0, balcFaces = 0, balcUnder = 0, extDed = 0, extGross = 0
  if (inp.exterior !== 'none') {
    outFace = L.calc('Outer face of the walls', 'Σ (outer wall × H) + plinth + stair room', '{s:2} + {p:2} × {pl} + {sr}', { s: sumPH, p: plans[0].P, pl: PLINTH_ABOVE, sr: hasMumty ? MUMTY.perimeter * (MUMTY.height + SLAB_T) : 0 },
      (v) => v.s + v.p * v.pl + v.sr, { unit: 'm²', dp: 1, ref: REF.p13m, note: `The plinth shows ${PLINTH_ABOVE} m above the ground. The stair room on the terrace has ${MUMTY.perimeter} m of wall, ${MUMTY.height} m high plus the slab (${SLAB_T} m).`, ...X(w.outFace) })
    parapetFaces = L.calc('Parapet, both faces and top', 'top outer wall × (2 × height + thickness)', '{p:2} × (2 × {h} + {t})', { p: topP, h: PARAPET_H, t: PARAPET_T }, (v) => v.p * (v.h * 2 + v.t),
      { unit: 'm²', dp: 1, ref: REF.assume, note: 'A parapet 1.0 m high and 115 mm thick.', ...X(w.parapetFaces) })
    balcFaces = L.calc('Balcony edges and railing walls', 'balconies × edge × (2 × height + thickness)', '{n} × {e} × (2 × {h} + {t})', { n: balcTotal, e: BALCONY.edge, h: PARAPET_H, t: PARAPET_T }, (v) => v.n * v.e * (v.h * 2 + v.t),
      { unit: 'm²', dp: 1, ref: REF.assume, note: 'Each balcony is taken as 6.0 m of edge with a 1.0 m wall.', ...X(w.balcFaces) })
    balcUnder = L.calc('Underside of the balconies', 'balconies × area', '{n} × {a}', { n: balcTotal, a: BALCONY.area }, (v) => v.n * v.a, { unit: 'm²', dp: 1, ref: REF.assume, note: 'Each balcony is taken as 4.5 m².', ...X(w.balcUnder) })
    extDed = L.calc('Windows and outer doors taken out (outside half)', '0.5 × Σ number × area, with the main door of a house',
      '0.5 × ({nb} × {ab:2} + {nl} × {al:2} + {nk} × {ak:2} + {ns} × {as:2} + {nc} × {ac:2} + {nm} × {am:2})',
      { nb: open.winB, ab: area(g.winB), nl: open.winL, al: area(g.winL), nk: open.winK, ak: area(g.winK), ns: open.winS, as: area(g.winS), nc: open.balc, ac: area(g.balc), nm: flats ? 0 : open.main, am: area(DOOR.main) },
      (v) => 0.5 * (v.nb * v.ab + v.nl * v.al + v.nk * v.ak + v.ns * v.as + v.nc * v.ac + v.nm * v.am),
      { unit: 'm²', dp: 2, ref: REF.p13, note: 'The other half was taken off the inside. A flat main door opens to the lobby and is not taken from the outside.', ...X(w.extDed) })
    extGross = L.calc('Outside, before openings', 'faces + parapet + balcony edges + balcony undersides', '{a:1} + {b:1} + {d:1} + {e:1}', { a: outFace, b: parapetFaces, d: balcFaces, e: balcUnder }, (v) => v.a + v.b + v.d + v.e,
      { unit: 'm²', dp: 1, ...X(w.extGross) })
    extPaint = L.calc('Outside to be painted', 'gross − taken out (not below zero)', 'larger of 0 and ({g:1} − {d:2})', { g: extGross, d: extDed }, (v) => Math.max(0, v.g - v.d),
      { unit: 'm²', dp: 1, ref: REF.p13m, result: true, ...X(w.extPaint) })
    b4lines.push({ id: 'outside-lines', title: 'Outside of the building', intro: 'Measured from the plinth to the top of the parapet.', table: faceTable, lines: L.take() })
  } else {
    L.say('Outside', 'You chose to leave the outside unpainted, so no outside area is measured.')
    b4lines.push({ id: 'outside-lines', title: 'Outside of the building', lines: L.take() })
  }

  /* doors */
  const nDoors = L.calc('Doors counted', 'main + room + bathroom + stair room', '{a} + {b} + {d} + {e}', { a: open.main, b: open.room, d: open.bath, e: open.mumty }, (v) => v.a + v.b + v.d + v.e, { dp: 0, ...X(w.nDoors) })
  const leafArea = L.calc('Door shutters, one face', 'Σ number × width × height', '{a} × {aa:2} + {b} × {ba:2} + {d} × {da:2} + {e} × {ea:2}',
    { a: open.main, aa: area(DOOR.main), b: open.room, ba: area(DOOR.room), d: open.bath, da: area(DOOR.bath), e: open.mumty, ea: area(DOOR.mumty) },
    (v) => v.a * v.aa + v.b * v.ba + v.d * v.da + v.e * v.ea, { unit: 'm²', dp: 2, ref: 'IS 1003 (Part 1):2003 Table 3 (designations)', note: 'The size of the opening is used for the shutter.', ...X(w.leafArea) })
  const doorSurf = L.calc('Doors to be painted, both faces', '2 × shutters', '2 × {a:2}', { a: leafArea }, (v) => 2 * v.a, { unit: 'm²', dp: 1, ref: REF.rule, note: 'Frames are painted with the shutters and are not measured separately.', result: true, ...X(w.doorSurf) })
  const b5: CalcBlock = { id: 'doors-area', title: 'Doors, both faces', lines: L.take() }

  /* floors to be tiled */
  const floorMain = L.calc('Floors of living rooms, bedrooms, kitchens and passages', 'sum of the floor areas', '{a:1} + {b:1} + {d:1} + {e:1} + {f:1}', { a: agg.aBed, b: agg.aLiv, d: agg.aKit, e: agg.aPass, f: agg.aCore }, (v) => v.a + v.b + v.d + v.e + v.f,
    { unit: 'm²', dp: 1, ref: REF.p11, note: 'Measured before the skirting and dado go on. Bathroom floors and balconies are tiled in a smaller tile and are counted below.', ...X(w.floorMain) })
  const balcFloor = L.calc('Balcony floors', 'balconies × area', '{n} × {a}', { n: balcTotal, a: BALCONY.area }, (v) => v.n * v.a, { unit: 'm²', dp: 1, ref: REF.assume, ...X(w.balcFloor) })
  const floorsTotal = L.calc('Floors to be tiled, in all', 'rooms + bathrooms + balconies', '{a:1} + {b:1} + {d:1}', { a: floorMain, b: agg.aBath, d: balcFloor }, (v) => v.a + v.b + v.d, { unit: 'm²', dp: 1, ref: REF.p11, result: true })
  const b6: CalcBlock = { id: 'floors-area', title: 'Floors to be tiled', lines: L.take() }

  /* the report's table of surfaces */
  const bathTiled = agg.pBath * dado
  const rows: { label: string; m: number; d: number; n: number }[] = [
    { label: 'Walls in rooms and passages', m: wallsGross, d: wallsDed, n: wallsNet },
    { label: 'Bathroom walls above the tiles', m: bathAbove, d: bathAboveDed, n: bathPaint },
    { label: 'Ceilings, inside', m: roomsArea, d: 0, n: roomsArea },
    ...(inp.exterior === 'none' ? [] : [{ label: 'Outside of the building', m: extGross, d: extDed, n: extPaint }]),
    { label: 'Doors, both faces', m: doorSurf, d: 0, n: doorSurf },
    { label: 'Bathroom wall tiles', m: bathTiled, d: bathTiled - bathWallTile, n: bathWallTile },
    { label: 'Kitchen wall above the counter, tiles', m: kitSplash, d: 0, n: kitSplash },
    { label: 'Floors to be tiled', m: floorsTotal, d: 0, n: floorsTotal },
  ]
  cmpTable(c, 'areas', rows.map((r) => [null, r.m, r.d, r.n, null]))
  rows.forEach((r, i) => T(c, `Surface, net: ${r.label}`, repNum(c, 'areas', i, 3), r.n, 'm²', 1))
  const summary: CalcTable = {
    head: ['Surface', 'Measured (m²)', 'Taken out (m²)', 'Net (m²)'], num: [1, 2, 3],
    rows: rows.map((r) => [r.label, fmt(r.m, 1), fmt(r.d, 1), fmt(r.n, 1)]),
  }
  const b7: CalcBlock = { id: 'areas-table', title: 'The surfaces, as listed in the report', intro: 'These are the results of the steps above, set out as in the report table "Surfaces, measured".', table: summary }

  const sections: CalcSection[] = [
    { id: 's4', title: '4. Surfaces measured', intro: 'Measured as IS 1200 measures: openings up to 0.5 m² are not taken out; from 0.5 m² to 3 m², one face is taken out (a door between two painted rooms once, a window or an outer door half from each face because the finish differs). Plaster is not here: it belongs to MasonryPro.', blocks: [b1, b2, b3, ...b4lines, b5, b6, b7] },
  ]
  return { sections, dado, run, kitSplash, bathWallTile, bathPaint, wallsNet, wallPaint, roomsArea, interiorPaint, extPaint, doorSurf, nDoors, leafArea, floorMain, balcFloor, floorsTotal }
}
export type SurfOut = ReturnType<typeof surfaces>
