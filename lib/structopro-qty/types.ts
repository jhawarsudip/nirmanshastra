// Public types of the StructurePro quantity model.
import type { Zone } from './codes'
import type { Grade, Exposure } from './materials'

export type SiteCondition =
  | 'flat'
  | 'sloped_mild'
  | 'sloped_steep'
  | 'rocky'
  | 'bcs'
  | 'soft_marshy'
  | 'waterlogged'
  | 'coastal'

export type WallType = 'brick' | 'block'

/** Everything a layman can answer. All other values are derived on the back end. */
export interface QtyInput {
  /** Built-up area of each floor in sq ft, lowest floor first. Length = number of floors (G+2 means 3 entries). With `stilt` these are the floors ABOVE the open parking level. */
  floorAreasSqft: number[]
  state: string
  city?: string
  site?: SiteCondition // default 'flat'
  wall?: WallType // default 'brick'
  /** Optional plot size in feet. Only the shape (aspect ratio) is used. */
  plotLengthFt?: number
  plotWidthFt?: number
  /** Is the roof used as a terrace (live load 1.5 instead of 0.75 kN/m2)? default true */
  terraceAccess?: boolean
  /** Is the ground level left open for parking (columns only, no walls)? default false. The floors listed in `floorAreasSqft` then stand on top of it. */
  stilt?: boolean
  /** Balconies on each upper floor (not the roof), 0 to 4. default 0 */
  balconies?: number
  /** How far a balcony sticks out, m: 1.0, 1.2 or 1.5. default 1.2 */
  balconyDepthM?: number
  /** Engineer-specified grade, if any (rare). Never asked of a layman. */
  gradeOverride?: Grade
  zoneOverride?: Zone
}

export interface BarLine {
  member: string
  phi: number
  lengthM: number // total cut length in metres
  note?: string
}

export interface SecondaryItem {
  key: 'lintels' | 'sunshades' | 'parapet' | 'mumty'
  label: string
  count: number
  concreteM3: number
  steelKg: number
  formworkM2: number
  basis: string
}

export interface MemberTotals {
  concreteM3: number
  steelKg: number
  formworkM2: number
  count: number
}

export interface GeoFooting {
  x: number
  y: number
  size: number // plan size B (square), m
  depth: number // overall depth, m
  colB: number
  colD: number
  top: number // level of top of footing, m (ground level = 0)
  bottom: number
}
export interface GeoColumn {
  x: number
  y: number
  storey: number
  z0: number
  z1: number
  b: number // size along x, m
  d: number // size along y, m
}
export interface GeoBeam {
  x0: number
  y0: number
  x1: number
  y1: number
  floor: number // -1 = plinth beam
  zTop: number // level of top of beam (= slab top for floor beams), m
  b: number
  depth: number
}
export interface GeoSlab {
  x0: number
  y0: number
  x1: number
  y1: number
  floor: number
  zTop: number
  t: number
  /** a cantilever balcony slab outside the main grid */
  balcony?: boolean
}
export interface GeoStair {
  x0: number
  y0: number
  widthM: number
  lengthM: number
  floors: number
  floorHeight: number
  baseZ: number
}
export interface GeoMumty {
  x0: number
  y0: number
  x1: number
  y1: number
  zBase: number // level of the terrace slab top, m
  height: number // clear height of the head-room, m
}
export interface Geometry {
  lengthM: number
  widthM: number
  xs: number[]
  ys: number[]
  groundLevelZ: number
  plinthZ: number
  storeyHeight: number
  footings: GeoFooting[]
  raft: { x0: number; y0: number; x1: number; y1: number; t: number; z: number } | null
  columns: GeoColumn[]
  beams: GeoBeam[]
  slabs: GeoSlab[]
  stair: GeoStair
  mumty: GeoMumty | null
}

export interface ColumnSchedule {
  storey: number
  type: 'corner' | 'edge' | 'interior'
  count: number
  bMm: number
  dMm: number
  bars: string // e.g. "8-16"
  asPercent: number
  ties: string
}
export interface BeamSchedule {
  floor: number
  type: string
  count: number
  bMm: number
  dMm: number
  note: string
}

export interface WindResult {
  /** basic wind speed Vb, m/s, and where it came from */
  vbMs: number
  basis: 'city' | 'state'
  place: string
  terrain: 2 | 3
  /** design pressure at roof level, kN/m2 */
  pzRoofKnM2: number
  /** net pressure coefficient on the walls (windward + leeward) */
  ct: number
  roofHeightM: number
  /** base shear along x and y, kN: wind, earthquake (before the open-ground-storey factor) and the larger of the two that was used */
  windBaseKN: { x: number; y: number }
  quakeBaseKN: { x: number; y: number }
  usedBaseKN: { x: number; y: number }
  governs: { x: 'earthquake' | 'wind'; y: 'earthquake' | 'wind' }
  /** wind base shear / earthquake base shear in the worse direction */
  ratio: number
  note: string
}

export interface StiltResult {
  /** the factor on the earthquake shear and moment of the open storey (IS 1893:2002 cl 7.10.3) */
  amplification: number
  minColumnMm: number
  note: string
}

export interface BalconyResult {
  count: number
  floorsWith: number
  perFloor: number
  projectionM: number
  lengthEachM: number
  thicknessMm: number
  mainBars: string
  distributionBars: string
  backSpanM: number
  concreteM3: number
  steelKg: number
  formworkM2: number
  note: string
}

export interface QtyResult {
  ok: true
  inputEcho: {
    /** floors the user listed (above the open parking level when `stilt`) */
    floors: number
    /** physical storeys of the frame: floors + 1 when there is an open parking level */
    storeys: number
    stilt: boolean
    footprintM2: number
    totalBuiltUpM2: number
    /** every roofed floor of the frame, including an open parking level: the area the per-m2 figures are divided by */
    roofedAreaM2: number
    zone: Zone
    zoneBasis: string
    zoneNote: string
    exposure: Exposure
    gradeAbove: Grade
    gradeBelow: Grade
    foundation: 'isolated' | 'raft'
  }
  layout: {
    lengthM: number
    widthM: number
    baysX: number
    baysY: number
    spanX: number
    spanY: number
    bayCountByFloor: { floor: number; bx: number; by: number }[]
    storeyHeightM: number
    plinthM: number
    foundingDepthM: number
  }
  members: {
    footings: MemberTotals
    pcc: MemberTotals
    plinthBeams: MemberTotals
    columns: MemberTotals
    beams: MemberTotals
    slabs: MemberTotals
    stairs: MemberTotals
    secondary: MemberTotals
    balconies?: MemberTotals
  }
  totals: {
    concreteM3: number
    steelNetKg: number
    steelBuyKg: number
    bindingWireKg: number
    formworkM2: number
    excavationM3: number
    pccM3: number
  }
  materials: {
    cementBags: number
    sandM3: number
    aggregateM3: number
    sandCft: number
    aggregateCft: number
    steelBuyKg: number
    bindingWireKg: number
    formworkSqft: number
    excavationCft: number
  }
  steelByDiameter: { phi: number; kg: number }[]
  mixes: { where: string; grade: string; basis: string; cementKgPerM3: number; sandM3PerM3: number; aggM3PerM3: number }[]
  perM2: { steelKgPerM2: number; concreteM3PerM2: number; cementBagsPerM2: number }
  /** Honest uncertainty of the quantity (multiply the point value by low/high). */
  band: { concrete: [number, number]; steel: [number, number]; cement: [number, number]; formwork: [number, number] }
  wind: WindResult
  stilt?: StiltResult
  balcony?: BalconyResult
  geometry: Geometry
  schedules: { columns: ColumnSchedule[]; beams: BeamSchedule[] }
  secondary: SecondaryItem[]
  /** Numbers for the validation scripts and the engineer's notes: not shown to a layman. */
  diagnostics: { baseServiceLoadKN: number; footingBearingKN: number; stiffnessNote: string }
  assumptions: string[]
  notIncluded: string[]
  warnings: string[]
}

export interface QtyError {
  ok: false
  error: string
}
