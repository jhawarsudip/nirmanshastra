/*
  The room plan that MasonryPro and InteriorPro share, so both tools measure the same building.

  A plan is worked out for each floor from a few plain answers (floor area, bedrooms, bathrooms, kitchens, flats or house).
  Rooms are given a share of the floor in proportion to a weight: a bedroom 1.0, a living room 1.3 plus 0.3 for each bedroom
  (ground floor and flats; 0.9 plus 0.2 above), a kitchen 0.75, a bathroom 0.33, and the passages about half a share.
  Each room is taken as 1 to 1.3 in plan (passages 1 to 4). Every wall between two rooms is counted once, and the
  outer wall is 4.08 times the square root of the floor area, which is a plan of 1 to 1.5.
  Nothing here is code-fixed: it is the Assumed part of the model, and both reports say so.
*/

/** Perimeter of a room of area a (m²) whose long side is `aspect` times the short side. */
export const perim = (a: number, aspect: number) => ((2 * (1 + aspect)) / Math.sqrt(aspect)) * Math.sqrt(a)

export const floorName = (i: number) =>
  ['Ground floor', 'First floor', 'Second floor', 'Third floor', 'Fourth floor', 'Fifth floor', 'Sixth floor', 'Seventh floor', 'Eighth floor', 'Ninth floor'][i] ?? `Floor ${i}`

/** The area of one room of each kind in one home on a floor, in m². */
export interface RoomAreas {
  bed: number
  living: number
  kit: number
  bath: number
  /** passages, stair hall and the like, in all, for one home */
  pass: number
}

export interface FloorPlan {
  name: string
  /** outer wall length, m */
  P: number
  /** inner wall length, m */
  Lint: number
  /** walls between flats, m */
  Lparty: number
  /** floor area inside the walls, m² */
  net: number
  /** common stair and lift lobby, m² (flats only) */
  core: number
  homes: number
  areas: RoomAreas
}

export interface PlanArgs {
  /** built-up area of each floor, m² */
  footM2: number[]
  flats: boolean
  /** homes on each floor (flats) */
  h: number
  bed: number[]
  bath: number[]
  kit: number[]
  /** outer and inner wall thickness, m */
  tExt: number
  tInt: number
}

export const CORE_M2 = 15

export function planFloors(a: PlanArgs): FloorPlan[] {
  const { footM2, flats, h, bed, bath, kit, tExt, tInt } = a
  const plans: FloorPlan[] = []
  for (let i = 0; i < footM2.length; i++) {
    const A = footM2[i]
    const P = 4.082 * Math.sqrt(A) // outer wall, for a plan of 1 to 1.5
    const nHome = flats ? h : 1
    const bI = bed[i], baI = bath[i], kI = kit[i]
    const groundLiving = flats || i === 0
    const core = flats ? Math.min(CORE_M2, 0.1 * A) : 0
    const D = Math.sqrt(A / 1.5)
    const Lparty = flats ? (h - 1) * D : 0
    let net = 0.88 * A
    let Lint = 0
    const wBed = 1.0, wLiv = groundLiving ? 1.3 + 0.3 * bI : 0.9 + 0.2 * bI, wKit = 0.75, wBath = 0.33
    const wPass = 0.45 + 0.08 * (bI + baI + kI)
    const wSum = bI * wBed + wLiv + kI * wKit + baI * wBath + wPass
    for (let k = 0; k < 4; k++) {
      const homeNet = (net - core) / nHome
      const u = homeNet / wSum
      const sumP =
        nHome * (bI * perim(u * wBed, 1.3) + perim(u * wLiv, 1.3) + kI * perim(u * wKit, 1.3) + baI * perim(u * wBath, 1.3) + perim(u * wPass, 4)) +
        (core > 0 ? perim(core, 1.5) : 0)
      const Lall = Math.max(0, (sumP - P) / 2)
      Lint = Math.max(0.15 * P, Lall - Lparty)
      net = Math.max(0.6 * A, A - P * tExt - Lint * tInt - Lparty * tExt)
    }
    // the room sizes that go with the final floor area
    const u = (net - core) / nHome / wSum
    plans.push({
      name: floorName(i), P, Lint, Lparty, net, core, homes: nHome,
      areas: { bed: u * wBed, living: u * wLiv, kit: u * wKit, bath: u * wBath, pass: u * wPass },
    })
  }
  return plans
}
