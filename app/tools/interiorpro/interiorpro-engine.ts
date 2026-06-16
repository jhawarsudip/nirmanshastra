// InteriorPro calculation engine
// IS 15477:2004 (tile adhesive) + IS 2395:1994 (paint) + IS 277:2003 (false ceiling steel)
// IS 2645:2003 (waterproofing wet areas) + NBC 2016 room minimums
// Build Reference Section 8 + Section 17 — LOCKED values. Do not alter.

// ─── IS CODE VALUES (SECTION 8 — LOCKED) ─────────────────────────────────────

// Tile wastage — Section 8 (LOCKED)
export const TILE_WASTAGE_FACTOR = 1.10  // minimum 10% wastage — IS 15477:2004 / field practice

// Paint consumption — Section 8 (LOCKED)
export const PAINT_LITRES_PER_SQFT_BUA = 0.18  // 0.18L per sqft BUA
// Coverage 40–50 sqft per litre per 2 coats. Use 45 (midpoint).
export const PAINT_COVERAGE_SQFT_PER_LITRE = 45

// Grade flooring rates — Section 8 (LOCKED)
export const FLOORING_RATES: Record<InteriorGrade, number> = {
  basic:    65,
  standard: 120,
  premium:  265,
  luxury:   650,
}

// Kitchen running-foot rates — Section 8 (LOCKED)
export const KITCHEN_RATES: Record<InteriorGrade, number> = {
  basic:    1200,
  standard: 2200,
  premium:  3800,
  luxury:   7500,
}

// False ceiling — Section 8 (LOCKED). Basic = pop/cornice ceiling at 20% BUA area.
export const FALSE_CEILING_RATES: Record<InteriorGrade, number> = {
  basic:    85,   // Pop/cornice ceiling — 20% of BUA area
  standard: 165,
  premium:  255,
  luxury:   455,
}
// IS 277:2003: MS frame mandatory, minimum 0.5mm thickness

// Paint rates per sqft of wall area — used for cost calculation (per HTML source)
const PAINT_SQFT_RATES: Record<InteriorGrade, number> = {
  basic:    22,   // ₹/sqft wall area
  standard: 35,
  premium:  58,
  luxury:   98,
}

// Door rates per unit (Pune 2026)
const DOOR_RATES: Record<InteriorGrade, number> = {
  basic:    8500,
  standard: 16000,
  premium:  38000,
  luxury:   54000,  // 1.8× premium rate per HTML source formula
}

// CPWD labour rates — Section 17 (LOCKED)
export const LABOUR = {
  tileMasonFloor:      { workers: 2, ratePerDay: 900,  sqftPerDay: 90  },  // 80-100 sqft/day
  tileMasonWall:       { workers: 1, ratePerDay: 950,  sqftPerDay: 60  },  // 60 sqft/day
  tileHelper:          { workers: 2, ratePerDay: 560,  sqftPerDay: 0   },  // ratio
  carpenter:           { workers: 2, ratePerDay: 1200, sqftPerDay: 0   },  // per day
  painter:             { workers: 2, ratePerDay: 700,  sqftPerDay: 400 },  // 400 sqft/day 2 coats
  falseCeilingInstall: { workers: 1, ratePerDay: 1000, sqftPerDay: 150 },  // 150 sqft/day
  polishing:           { workers: 1, ratePerDay: 1100, sqftPerDay: 200, active: false },
  electricianFixtures: { workers: 1, ratePerDay: 1100, sqftPerDay: 0   },  // fixture fitting
  interiorHelper:      { workers: 2, ratePerDay: 540,  sqftPerDay: 0   },  // ratio
  supervisor:          { workers: 1, ratePerDay: 1200, sqftPerDay: 0   },  // per day
}

// Grade multipliers for overall phase cost — Section 17 (LOCKED)
export const GRADE_MULTIPLIERS: Record<InteriorGrade, number> = {
  basic:    1.0,
  standard: 1.6,
  premium:  2.4,
  luxury:   3.5,
}

// Seismic zone map (same locked values as other tools)
const SEISMIC_ZONE_MAP: Record<string, { zone: string; zFactor: number }> = {
  'Uttarakhand':       { zone: 'V',   zFactor: 0.36 },
  'Himachal Pradesh':  { zone: 'V',   zFactor: 0.36 },
  'Sikkim':            { zone: 'V',   zFactor: 0.36 },
  'Arunachal Pradesh': { zone: 'V',   zFactor: 0.36 },
  'Assam':             { zone: 'V',   zFactor: 0.36 },
  'Manipur':           { zone: 'V',   zFactor: 0.36 },
  'Meghalaya':         { zone: 'V',   zFactor: 0.36 },
  'Mizoram':           { zone: 'V',   zFactor: 0.36 },
  'Nagaland':          { zone: 'V',   zFactor: 0.36 },
  'Tripura':           { zone: 'V',   zFactor: 0.36 },
  'Jammu and Kashmir': { zone: 'V',   zFactor: 0.36 },
  'Ladakh':            { zone: 'V',   zFactor: 0.36 },
  'Andaman and Nicobar Islands': { zone: 'V', zFactor: 0.36 },
  'Delhi':             { zone: 'IV',  zFactor: 0.24 },
  'Punjab':            { zone: 'IV',  zFactor: 0.24 },
  'Haryana':           { zone: 'IV',  zFactor: 0.24 },
  'Chandigarh':        { zone: 'IV',  zFactor: 0.24 },
  'Bihar':             { zone: 'IV',  zFactor: 0.24 },
  'Uttar Pradesh':     { zone: 'IV',  zFactor: 0.24 },
  'Maharashtra':       { zone: 'III', zFactor: 0.16 },
  'Gujarat':           { zone: 'III', zFactor: 0.16 },
  'Rajasthan':         { zone: 'III', zFactor: 0.16 },
  'West Bengal':       { zone: 'III', zFactor: 0.16 },
  'Goa':               { zone: 'III', zFactor: 0.16 },
  'Kerala':            { zone: 'III', zFactor: 0.16 },
  'Karnataka':         { zone: 'II',  zFactor: 0.10 },
  'Tamil Nadu':        { zone: 'II',  zFactor: 0.10 },
  'Telangana':         { zone: 'II',  zFactor: 0.10 },
  'Andhra Pradesh':    { zone: 'II',  zFactor: 0.10 },
  'Madhya Pradesh':    { zone: 'II',  zFactor: 0.10 },
  'Chhattisgarh':      { zone: 'II',  zFactor: 0.10 },
  'Jharkhand':         { zone: 'II',  zFactor: 0.10 },
  'Odisha':            { zone: 'II',  zFactor: 0.10 },
  'Lakshadweep':       { zone: 'III', zFactor: 0.16 },
  'Puducherry':        { zone: 'II',  zFactor: 0.10 },
  'Dadra and Nagar Haveli and Daman and Diu': { zone: 'III', zFactor: 0.16 },
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type InteriorGrade  = 'basic' | 'standard' | 'premium' | 'luxury'
export type InteriorMethod = 'quick' | 'exact'

export interface ComplianceCheck {
  id:          string
  clause:      string
  description: string
  status:      'pass' | 'advisory' | 'fail'
  detail:      string
}

export interface GradeComparison {
  grade:             InteriorGrade
  label:             string
  flooringCost:      number
  kitchenCost:       number
  falseCeilingCost:  number
  paintCost:         number
  doorsCost:         number
  totalMaterial:     number
  totalWithLabour:   number
  perSqft:           number
  multiplier:        number
}

export interface FlooringSchedule {
  totalBuaSqft:     number
  withWastageSqft:  number   // ×1.10 — IS 15477:2004
  tileSize:         string   // 2×2 ft vitrified standard
  tileQty:          number   // tiles at 4 sqft/tile
  adhesiveBags:     number   // IS 15477:2004 — never cement on RCC slab
  groutKg:          number   // polymer grout — never plain cement
}

export interface PaintSchedule {
  paintLitres:      number   // 0.18L per sqft BUA
  primerLitres:     number   // 1 coat primer = 25% of emulsion qty
  puttyBags:        number   // 3 kg putty per 50 sqft wall area (approx)
  numCoats:         number   // 2 standard, 3 for premium
}

export interface InteriorCosts {
  flooringMaterial:          number
  kitchenMaterial:           number
  falseCeilingMaterial:      number
  paintMaterial:             number
  doorsMaterial:             number
  bathroomWallTileMaterial:  number
  kitchenDadoMaterial:       number
  staircaseMaterial:         number
  balconyFlooringMaterial:   number
  externalPaintMaterial:     number
  windowFramesMaterial:      number
  grillworkMaterial:         number
  totalMaterial:             number
}

export interface RoomBreakdown {
  room:         string
  areaSqft:     number
  flooringCost: number
}

export type StaircaseRiserMaterial = 'granite' | 'marble' | 'ceramic' | 'ms_chequered' | 'hardwood'
export type StaircaseTreadMaterial = 'granite' | 'marble' | 'ceramic' | 'ms_chequered' | 'hardwood'
export type StaircaseRailingType   = 'ms_painted' | 'ss' | 'glass' | 'wooden'
export type WindowFrameMaterial    = 'aluminium' | 'upvc' | 'wood' | 'ms'
export type GrillMaterial          = 'ms_painted' | 'ss'
export type BalconyTileType        = 'antiskid_ceramic' | 'vitrified' | 'natural_stone'

export interface InteriorInput {
  state:              string
  city:               string
  method:             InteriorMethod
  grade:              InteriorGrade
  numFloors:          number
  buaPerFloorSqft:    number
  numBedrooms:        number
  numBathrooms:       number
  kitchenRft:         number    // running feet — upper + lower cabinets
  includeFalseCeiling:boolean
  falseCeilingSqft:   number
  numDoors:           number
  contractorQuote?:   number
  includeLabour?:     boolean

  // Bathroom wall tiling
  bathroomTilingHeightFt?: number
  bathroomWallTileRatePerSqft?: number
  bathroomFloorAntiSkid?: boolean

  // Kitchen wall dado
  kitchenDadoHeightM?: number
  kitchenLengthFt?: number
  kitchenDadoRatePerSqft?: number

  // Staircase
  includeStaircase?: boolean
  staircaseFlights?: number
  stepsPerFlight?: number
  riserMaterial?: StaircaseRiserMaterial
  treadMaterial?: StaircaseTreadMaterial
  railingType?: StaircaseRailingType

  // Balcony flooring
  balconyAreaSqft?: number
  balconyTileType?: BalconyTileType
  balconyTileRatePerSqft?: number

  // External paint
  externalWallAreaSqft?: number
  externalPaintType?: string
  externalPaintCoats?: number
  externalPaintRatePerSqft?: number

  // Window frames
  numWindows?: number
  windowFrameMaterial?: WindowFrameMaterial
  windowMosquitoMesh?: boolean
  windowRatePerUnit?: number

  // Grillwork
  numGrillWindows?: number
  grillMaterial?: GrillMaterial
  grillRatePerSqft?: number
  grillAreaPerWindowSqft?: number
}

export interface InteriorResult {
  // Free — always visible
  grandTotal:         { basic: number; standard: number; premium: number; luxury: number }
  perSqftCost:        { basic: number; standard: number; premium: number; luxury: number }
  gradeComparison:    GradeComparison[]
  totalBuaSqft:       number
  compliance:         ComplianceCheck[]
  technicalReminders: string[]
  phaseContext: {
    percentOfTotal:    string
    gradeImpact:       string
    overchargingRisks: string[]
  }

  // Paid — blurred until payment
  flooringSchedule:    FlooringSchedule
  paintSchedule:       PaintSchedule
  roomBreakdown:       RoomBreakdown[]
  costs:               InteriorCosts
  labourCost:          number
  overheadCost:        number
  bathroomWallTileSqft:number
  kitchenDadoSqft:     number
  staircaseTotalRisers:number
  staircaseTotalTreads:number
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function seismicZoneFromState(state: string): { zone: string; zFactor: number } {
  return SEISMIC_ZONE_MAP[state] ?? { zone: 'III', zFactor: 0.16 }
}

export function formatLakhs(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`
  if (amount >= 100000)   return `₹${(amount / 100000).toFixed(1)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

export function gradeLabel(grade: InteriorGrade): string {
  return { basic: 'Basic', standard: 'Standard', premium: 'Premium', luxury: 'Luxury' }[grade]
}

// ─── GRADE COMPARISON (fully visible free) ───────────────────────────────────

export function calcGradeComparison(input: InteriorInput): GradeComparison[] {
  const { numFloors, buaPerFloorSqft, kitchenRft, includeFalseCeiling, numDoors } = input
  const totalBua = buaPerFloorSqft * numFloors

  const grades: InteriorGrade[] = ['basic', 'standard', 'premium', 'luxury']
  return grades.map(grade => {
    const flooringWithWastage = totalBua * TILE_WASTAGE_FACTOR
    const flooringCost  = Math.round(flooringWithWastage * FLOORING_RATES[grade])
    const kitchenCost   = Math.round(kitchenRft * KITCHEN_RATES[grade])
    // Basic grade = pop/cornice ceiling at 20% BUA; standard/premium/luxury = 70% BUA
    const fcArea        = grade === 'basic' ? Math.round(totalBua * 0.20) : Math.round(totalBua * 0.70)
    const falseCeilingCost = includeFalseCeiling ? Math.round(fcArea * FALSE_CEILING_RATES[grade]) : 0
    // Paint cost = wall area (3.4× BUA) × rate per sqft wall — per HTML source formula
    const wallArea      = Math.round(totalBua * 3.4)
    const paintCost     = Math.round(wallArea * PAINT_SQFT_RATES[grade])
    const doorsCost     = Math.round(numDoors * DOOR_RATES[grade])

    const totalMaterial = flooringCost + kitchenCost + falseCeilingCost + paintCost + doorsCost

    // 5% contingency on materials — no auto-labour in comparison (per HTML source)
    const totalWithLabour = totalMaterial + Math.round(totalMaterial * 0.05)
    const perSqft = totalBua > 0 ? Math.round(totalWithLabour / totalBua) : 0

    return {
      grade,
      label:             gradeLabel(grade),
      flooringCost,
      kitchenCost,
      falseCeilingCost,
      paintCost,
      doorsCost,
      totalMaterial,
      totalWithLabour,
      perSqft,
      multiplier:        GRADE_MULTIPLIERS[grade],
    }
  })
}

// ─── MAIN CALCULATION ────────────────────────────────────────────────────────

export function runCalculation(input: InteriorInput): InteriorResult {
  const { grade, numFloors, buaPerFloorSqft, numBedrooms, numBathrooms,
          kitchenRft, includeFalseCeiling, falseCeilingSqft, numDoors } = input

  const totalBuaSqft = buaPerFloorSqft * numFloors

  // ── Grade comparison — FREE (all 4 grades visible) ──────────────────────
  const gradeComparison = calcGradeComparison(input)
  const selectedGrade   = gradeComparison.find(g => g.grade === grade)!

  // ── Flooring schedule (PAID — blurred) ───────────────────────────────────
  // IS 15477:2004 — never use cement on RCC slab, use tile adhesive
  const withWastageSqft  = Math.round(totalBuaSqft * TILE_WASTAGE_FACTOR)
  const tileQty          = Math.ceil(withWastageSqft / 4)   // 2×2 ft vitrified (4 sqft/tile)
  // Tile adhesive — IS 15477:2004: 4-5 kg/sqm = ~0.37-0.46 kg/sqft; use 0.42 kg/sqft ≈ 4.5 kg/sqm
  const adhesiveBags     = Math.ceil((withWastageSqft * 0.42) / 20)  // 20 kg bags
  // Polymer grout — IS 15477:2004: never plain cement
  const groutKg          = Math.ceil(withWastageSqft * 0.18)  // 0.18 kg/sqft approx (2-3mm joints)

  const flooringSchedule: FlooringSchedule = {
    totalBuaSqft,
    withWastageSqft,
    tileSize:  '2×2 ft (600×600mm)',
    tileQty,
    adhesiveBags,
    groutKg,
  }

  // ── Paint schedule — Section 8 (PAID) ─────────────────────────────────────
  // IS 2395:1994 — primer coat mandatory before emulsion
  const paintLitres  = Math.ceil(totalBuaSqft * PAINT_LITRES_PER_SQFT_BUA)
  const primerLitres = Math.ceil(paintLitres * 0.25)  // 1 primer coat = ~25% of emulsion
  const wallAreaApprox = Math.round(totalBuaSqft * 3.4)  // rough wall area factor
  const puttyBags    = Math.ceil(wallAreaApprox / 50 * 3)  // 3 kg per 50 sqft

  const paintSchedule: PaintSchedule = {
    paintLitres,
    primerLitres,
    puttyBags,
    numCoats: grade === 'premium' || grade === 'luxury' ? 3 : 2,
  }

  // ── Room breakdown (PAID) ─────────────────────────────────────────────────
  // Approximate room area allocation from total BUA
  const livingArea    = Math.round(totalBuaSqft * 0.25)
  const bedroomArea   = Math.round((totalBuaSqft * 0.40) / numBedrooms)
  const kitchenArea   = Math.round(totalBuaSqft * 0.12)
  const bathroomArea  = Math.round((totalBuaSqft * 0.14) / Math.max(numBathrooms, 1))
  const passageArea   = Math.round(totalBuaSqft * 0.09)

  const flRate = FLOORING_RATES[grade]
  const roomBreakdown: RoomBreakdown[] = [
    { room: 'Living / Drawing Room',    areaSqft: livingArea,   flooringCost: Math.round(livingArea * flRate * TILE_WASTAGE_FACTOR) },
    ...Array.from({ length: numBedrooms }, (_, i) => ({
      room: i === 0 ? 'Master Bedroom' : `Bedroom ${i + 1}`,
      areaSqft: bedroomArea,
      flooringCost: Math.round(bedroomArea * flRate * TILE_WASTAGE_FACTOR),
    })),
    { room: 'Kitchen',                  areaSqft: kitchenArea,  flooringCost: Math.round(kitchenArea * flRate * TILE_WASTAGE_FACTOR) },
    ...Array.from({ length: numBathrooms }, (_, i) => ({
      room: `Bathroom / Toilet ${i + 1}`,
      areaSqft: bathroomArea,
      flooringCost: Math.round(bathroomArea * flRate * TILE_WASTAGE_FACTOR),
    })),
    { room: 'Passage / Staircase',      areaSqft: passageArea,  flooringCost: Math.round(passageArea * flRate * TILE_WASTAGE_FACTOR) },
  ]

  // ── Material costs (PAID) ─────────────────────────────────────────────────
  const flooringMaterial     = selectedGrade.flooringCost
  const kitchenMaterial      = selectedGrade.kitchenCost
  const falseCeilingMaterial = selectedGrade.falseCeilingCost
  const paintMaterial        = selectedGrade.paintCost
  const doorsMaterial        = selectedGrade.doorsCost

  // Bathroom wall tiling (IS 2645:2003 — waterproofing mandatory in wet areas)
  const bathTilingHtFt  = input.bathroomTilingHeightFt ?? 7
  const bathPerimeterFt = Math.sqrt(bathroomArea) * 4  // approx perimeter from area
  const bathroomWallTileSqft = Math.round(bathroomArea > 0
    ? numBathrooms * (bathPerimeterFt * bathTilingHtFt - 20)   // minus ~20 sqft for door/ventilator
    : 0)
  const bathWallTileRate     = input.bathroomWallTileRatePerSqft ?? FLOORING_RATES[grade]
  const bathroomWallTileMaterial = Math.round(bathroomWallTileSqft * bathWallTileRate * TILE_WASTAGE_FACTOR)

  // Kitchen wall dado (IS 2645:2003 — waterproofing behind kitchen tiles mandatory)
  const kitchenDadoHtM  = input.kitchenDadoHeightM ?? 0.6
  const kitchenLenFt    = input.kitchenLengthFt ?? 0
  const kitchenDadoSqft = Math.round(kitchenLenFt > 0
    ? kitchenLenFt * (kitchenDadoHtM * 10.764)   // length × dado height in sqft
    : 0)
  const kitchenDadoRate  = input.kitchenDadoRatePerSqft ?? FLOORING_RATES[grade]
  const kitchenDadoMaterial = Math.round(kitchenDadoSqft * kitchenDadoRate * TILE_WASTAGE_FACTOR)

  // Staircase
  const staircaseFlights   = input.staircaseFlights ?? 1
  const stepsPerFlight     = input.stepsPerFlight ?? 13
  const staircaseTotalRisers = input.includeStaircase ? staircaseFlights * stepsPerFlight : 0
  const staircaseTotalTreads = staircaseTotalRisers
  // Riser area: avg 200mm × 900mm = 0.18 sqm per riser = 1.94 sqft
  // Tread area: avg 300mm × 900mm = 0.27 sqm per tread = 2.91 sqft
  const riserAreaSqft = staircaseTotalRisers * 1.94
  const treadAreaSqft = staircaseTotalTreads * 2.91
  const staircaseRateRiser: Record<StaircaseRiserMaterial, number> = {
    granite: 280, marble: 420, ceramic: 95, ms_chequered: 180, hardwood: 350,
  }
  const staircaseRateTread: Record<StaircaseTreadMaterial, number> = {
    granite: 320, marble: 480, ceramic: 110, ms_chequered: 200, hardwood: 400,
  }
  const railingRatePerRiser: Record<StaircaseRailingType, number> = {
    ms_painted: 2500, ss: 4500, glass: 6500, wooden: 3500,
  }
  const riserMat  = input.riserMaterial  ?? 'granite'
  const treadMat  = input.treadMaterial  ?? 'granite'
  const railingType = input.railingType  ?? 'ms_painted'
  const staircaseMaterial = input.includeStaircase
    ? Math.round(
        riserAreaSqft * staircaseRateRiser[riserMat] +
        treadAreaSqft * staircaseRateTread[treadMat] +
        staircaseTotalRisers * railingRatePerRiser[railingType]
      )
    : 0

  // Balcony flooring
  const balconyAreaSqft  = input.balconyAreaSqft ?? 0
  const balconyTileRate: Record<BalconyTileType, number> = {
    antiskid_ceramic: 65, vitrified: 120, natural_stone: 220,
  }
  const balconyTileType = input.balconyTileType ?? 'antiskid_ceramic'
  const balconyRatePerSqft = input.balconyTileRatePerSqft ?? balconyTileRate[balconyTileType]
  const balconyFlooringMaterial = balconyAreaSqft > 0
    ? Math.round(balconyAreaSqft * balconyRatePerSqft * TILE_WASTAGE_FACTOR)
    : 0

  // External paint
  const extWallSqft   = input.externalWallAreaSqft ?? 0
  const extPaintRate  = input.externalPaintRatePerSqft ?? 28  // ₹28/sqft for exterior emulsion
  const extPaintCoats = input.externalPaintCoats ?? 2
  const externalPaintMaterial = extWallSqft > 0
    ? Math.round(extWallSqft * extPaintRate * (extPaintCoats / 2))
    : 0

  // Window frames
  const numWindows    = input.numWindows ?? 0
  const windowRate    = input.windowRatePerUnit ?? 8500  // avg aluminium window
  const meshAdder     = input.windowMosquitoMesh ? 1200 : 0  // per window
  const windowFramesMaterial = numWindows > 0
    ? Math.round(numWindows * (windowRate + meshAdder))
    : 0

  // Grillwork
  const numGrillWindows    = input.numGrillWindows ?? 0
  const grillAreaPerWindow = input.grillAreaPerWindowSqft ?? 9  // ~3×3 ft per window
  const grillRatePerSqft   = input.grillRatePerSqft ?? 180      // MS painted
  const grillworkMaterial  = numGrillWindows > 0
    ? Math.round(numGrillWindows * grillAreaPerWindow * grillRatePerSqft)
    : 0

  const totalMaterial = flooringMaterial + kitchenMaterial + falseCeilingMaterial + paintMaterial +
    doorsMaterial + bathroomWallTileMaterial + kitchenDadoMaterial + staircaseMaterial +
    balconyFlooringMaterial + externalPaintMaterial + windowFramesMaterial + grillworkMaterial

  const costs: InteriorCosts = {
    flooringMaterial,
    kitchenMaterial,
    falseCeilingMaterial,
    paintMaterial,
    doorsMaterial,
    bathroomWallTileMaterial,
    kitchenDadoMaterial,
    staircaseMaterial,
    balconyFlooringMaterial,
    externalPaintMaterial,
    windowFramesMaterial,
    grillworkMaterial,
    totalMaterial,
  }

  // ── Labour — CPWD (PAID) ─────────────────────────────────────────────────
  // Floor tiling
  const floorTileDays  = Math.ceil(withWastageSqft / LABOUR.tileMasonFloor.sqftPerDay)
  const floorTileCost  = floorTileDays * (LABOUR.tileMasonFloor.workers * LABOUR.tileMasonFloor.ratePerDay)
  // Wall tiling (bathrooms + kitchen backsplash)
  const wallTileArea   = Math.round((numBathrooms * bathroomArea * 3) + (kitchenArea * 1.5))
  const wallTileDays   = Math.ceil(wallTileArea / LABOUR.tileMasonWall.sqftPerDay)
  const wallTileCost   = wallTileDays * LABOUR.tileMasonWall.workers * LABOUR.tileMasonWall.ratePerDay
  // Tile helper
  const tileHelperDays = floorTileDays + wallTileDays
  const tileHelperCost = tileHelperDays * LABOUR.tileHelper.workers * LABOUR.tileHelper.ratePerDay
  // Carpenter (kitchen + doors + wardrobes)
  const carpenterDays  = Math.ceil((kitchenRft / 4) + numDoors + numBedrooms * 0.5)
  const carpenterCost  = carpenterDays * LABOUR.carpenter.workers * LABOUR.carpenter.ratePerDay
  // Painter
  const painterDays    = Math.ceil((totalBuaSqft * 3.4) / LABOUR.painter.sqftPerDay)
  const painterCost    = painterDays * LABOUR.painter.workers * LABOUR.painter.ratePerDay
  // False ceiling
  const falseCeilDays  = includeFalseCeiling ? Math.ceil(falseCeilingSqft / LABOUR.falseCeilingInstall.sqftPerDay) : 0
  const falseCeilCost  = falseCeilDays * LABOUR.falseCeilingInstall.workers * LABOUR.falseCeilingInstall.ratePerDay
  // Electrician (fixture fitting after painting)
  const elecDays       = Math.ceil(totalBuaSqft / 500)  // ~500 sqft per day for fixture fitting
  const elecCost       = elecDays * LABOUR.electricianFixtures.ratePerDay
  // Interior helper
  const helperDays     = floorTileDays + carpenterDays + painterDays
  const helperCost     = helperDays * LABOUR.interiorHelper.workers * LABOUR.interiorHelper.ratePerDay
  // Supervisor
  const totalDays      = Math.max(floorTileDays, carpenterDays) + painterDays + falseCeilDays
  const supervisorCost = totalDays * LABOUR.supervisor.ratePerDay

  const labourCost = Math.round(
    floorTileCost + wallTileCost + tileHelperCost + carpenterCost +
    painterCost + falseCeilCost + elecCost + helperCost + supervisorCost
  )

  // ── Grand total ranges ────────────────────────────────────────────────────
  const extraMaterial = bathroomWallTileMaterial + kitchenDadoMaterial + staircaseMaterial +
    balconyFlooringMaterial + externalPaintMaterial + windowFramesMaterial + grillworkMaterial

  const overheadBasic    = Math.round((gradeComparison[0].totalMaterial + extraMaterial + labourCost * 0.85) * 0.05)
  const overheadStandard = Math.round((gradeComparison[1].totalMaterial + extraMaterial + labourCost)        * 0.05)
  const overheadPremium  = Math.round((gradeComparison[2].totalMaterial + extraMaterial + labourCost * 1.10) * 0.05)
  const overheadLuxury   = Math.round((gradeComparison[3].totalMaterial + extraMaterial + labourCost * 1.20) * 0.05)

  const totalBasic    = gradeComparison[0].totalMaterial + extraMaterial + Math.round(labourCost * 0.85) + overheadBasic
  const totalStandard = gradeComparison[1].totalMaterial + extraMaterial + labourCost + overheadStandard
  const totalPremium  = gradeComparison[2].totalMaterial + extraMaterial + Math.round(labourCost * 1.10) + overheadPremium
  const totalLuxury   = gradeComparison[3].totalMaterial + extraMaterial + Math.round(labourCost * 1.20) + overheadLuxury

  const grandTotal  = { basic: totalBasic, standard: totalStandard, premium: totalPremium, luxury: totalLuxury }
  const perSqftCost = {
    basic:    totalBuaSqft > 0 ? Math.round(totalBasic    / totalBuaSqft) : 0,
    standard: totalBuaSqft > 0 ? Math.round(totalStandard / totalBuaSqft) : 0,
    premium:  totalBuaSqft > 0 ? Math.round(totalPremium  / totalBuaSqft) : 0,
    luxury:   totalBuaSqft > 0 ? Math.round(totalLuxury   / totalBuaSqft) : 0,
  }

  // ── IS Compliance panel (FREE) ────────────────────────────────────────────
  const compliance: ComplianceCheck[] = [
    {
      id: 'tile_adhesive',
      clause: 'IS 15477:2004',
      description: 'Tile adhesive mandatory on RCC slabs — no direct cement',
      status: 'pass',
      detail: `IS 15477:2004: Never use cement mortar directly on RCC slab for tiling. Tile adhesive mandatory. Cement mortar on slab causes differential settlement, cracking, and hollow sound within 3–5 years. ${flooringSchedule.adhesiveBags} bags tile adhesive estimated for ${withWastageSqft} sqft.`,
    },
    {
      id: 'tile_wastage',
      clause: 'IS 15477:2004 · Field Practice',
      description: `10% tile wastage minimum — order ${flooringSchedule.tileQty} tiles`,
      status: 'pass',
      detail: `IS 15477:2004 field practice: 10% minimum wastage for tiles — cutting losses, breakage, and future repairs. Total with wastage: ${withWastageSqft.toLocaleString('en-IN')} sqft (${tileQty} tiles at 2×2 ft). Always order extra — re-ordering a discontinued tile pattern is impossible.`,
    },
    {
      id: 'primer_coat',
      clause: 'IS 2395:1994 (Part 1)',
      description: 'Primer coat mandatory before emulsion paint',
      status: 'pass',
      detail: `IS 2395:1994 (Part 1): Primer application is mandatory before any emulsion paint. Primer seals the surface, improves adhesion, and prevents blistering. Without primer, emulsion peels within 1–2 monsoon seasons. Estimated primer: ${primerLitres} litres.`,
    },
    {
      id: 'paint_coats',
      clause: 'IS 2395:1994 (Part 2)',
      description: `${grade === 'premium' || grade === 'luxury' ? '3' : '2'} coats emulsion after primer`,
      status: 'pass',
      detail: `IS 2395:1994: Minimum 2 coats emulsion after primer for standard finish, 3 coats for premium/luxury. Estimated paint: ${paintLitres} litres (${grade} grade). Coverage 40–50 sqft/litre per coat. Single coat after primer is sub-standard and will show patch work within 1 year.`,
    },
    {
      id: 'false_ceiling',
      clause: 'IS 277:2003',
      description: includeFalseCeiling ? 'MS frame 0.5mm minimum — IS 277:2003' : 'False ceiling not included — advisory if later added',
      status: includeFalseCeiling ? 'pass' : 'advisory',
      detail: `IS 277:2003: False ceiling must use MS (mild steel) frame with minimum 0.5mm galvanised sheet thickness. Aluminium channels are acceptable but MS is mandatory in heavy-use areas. GI wire mesh is not a substitute for MS frame. ${includeFalseCeiling ? `Area: ${falseCeilingSqft} sqft.` : 'If false ceiling is added later, verify MS frame specification.'}`,
    },
    {
      id: 'wet_area_waterproofing',
      clause: 'IS 2645:2003',
      description: `Waterproofing in wet areas — minimum 2 coats before tiling`,
      status: 'advisory',
      detail: `IS 2645:2003: Waterproofing mandatory in all wet areas (bathrooms, kitchen, balcony) before tiling — minimum 2 coats. Common defect: contractors tile directly without waterproofing to save cost. Water seeps into RCC slab, causes staining on lower floors, and eventually structural damage.`,
    },
    {
      id: 'polymer_grout',
      clause: 'IS 15477:2004',
      description: 'Polymer grout mandatory — never plain cement for tile joints',
      status: 'advisory',
      detail: `IS 15477:2004 Annex: Tile joints must be filled with polymer-modified grout. Plain cement grout cracks, stains, and harbours mould within 2–3 years. Polymer grout is flexible, stain-resistant, and anti-microbial. Estimated: ${groutKg} kg polymer grout.`,
    },
    {
      id: 'door_frame_sequence',
      clause: 'NBC 2016 Part 3 Cl 4.3',
      description: 'Door frames fixed before plastering — not after',
      status: 'advisory',
      detail: `NBC 2016 Part 3: Door frames must be fixed before plastering so the plaster bondsagainst the frame. Frames fixed after plastering leave gaps for water ingress, termite entry, and wall shrinkage cracks. This is the most common carpentry error in residential construction.`,
    },
  ]

  // ── Technical reminders (FREE) ────────────────────────────────────────────
  const technicalReminders: string[] = [
    'IS 15477:2004 — Never lay tiles directly on RCC slab with cement mortar. Use IS-compliant tile adhesive only. Cement-on-RCC causes differential thermal expansion, hollow spots, and cracking within 3–5 years.',
    'IS 15477:2004 Field Practice — Minimum 10% tile wastage. Always order extra before starting. The batch number of your tile affects shade — mixing batches is visible on the finished floor.',
    'IS 2395:1994 — Primer coat is mandatory before ANY emulsion paint. Apply putty after primer for smooth surface. Total sequence: plaster → putty → primer → emulsion (2–3 coats). Skip any step and the finish will fail.',
    'IS 2645:2003 — Waterproofing in all wet areas (bathrooms, kitchen, balcony) before tiling is mandatory. Minimum 2 coats. Test by flooding with 25mm water for 24 hours before tiling — verify no seepage to floor below.',
    'IS 277:2003 — False ceiling MS frames must be galvanised, minimum 0.5mm thickness. Demand IS 277 compliance certificate from contractor. Sub-standard frames sag, corrode, and collapse within 5–7 years.',
    'Kitchen platform granite must be minimum 18mm thickness with no joints at sink location. Thinner granite cracks under thermal shock. Joint at sink is a water ingress point that rots the platform within 2 years.',
    'IS 2645:2003 — Apply tile grout to ALL tile joints. Bare joints are water pathways. Use polymer-modified grout for wet areas. Plain cement grout is not acceptable for bathrooms and kitchens.',
    'Door frames must be fixed before plastering — never after. Frames installed after plastering will have gaps that allow water, termites, and cold air infiltration. Specify "frame first, plaster after" in your contractor agreement.',
    'Electrical fixtures — switch boards, light points, fan hooks — must be fixed ONLY after painting is complete. Painting around fixed fixtures leads to paint overspray, smearing, and fixture damage.',
    'Wardrobes must be fixed to wall with rawl plugs and screws — never adhesive or friction alone. A 6-foot wardrobe fully loaded weighs 150–200 kg. Adhesive fails in humid conditions within 3–5 years.',
  ]

  // ── Phase context (FREE) ─────────────────────────────────────────────────
  const phaseContext = {
    percentOfTotal: '12–18%',
    gradeImpact:    'Interior grade affects final cost more than any other phase. Basic 1.0× → Luxury 3.5× total cost.',
    overchargingRisks: [
      'Inflated flooring rates — billing premium tile rates for standard vitrified installation',
      'Fake tile wastage — billing 20% wastage where IS standard is 10%',
      'Cement mortar on RCC slab — cheaper than tile adhesive but causes defects',
      'Plain cement grout instead of polymer grout — 30% cheaper but fails in 2 years',
      'False ceiling with aluminium channel billed at MS frame rates',
      'Kitchen cabinet billing: RCC-made vs modular charged at same rate; carpenters vs modular rates confusion',
      'Paint coats — billing 3 coats but applying 1.5 by thinning with water',
    ],
  }

  return {
    grandTotal,
    perSqftCost,
    gradeComparison,
    totalBuaSqft,
    compliance,
    technicalReminders,
    phaseContext,
    flooringSchedule,
    paintSchedule,
    roomBreakdown,
    costs,
    labourCost,
    overheadCost: overheadStandard,
    bathroomWallTileSqft,
    kitchenDadoSqft,
    staircaseTotalRisers,
    staircaseTotalTreads,
  }
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]
