// MasonryPro calculation engine
// IS 1077:1992 + IS 2212:1991 + IS 12894:2002 + IS 2185:2005 + IS 4326:1993 + IS 1661:1972 + IS 2645:2003
// Build Reference Section 8 — LOCKED values. Do not alter.

// ─── IS CODE VALUES (SECTION 8 — LOCKED) ─────────────────────────────────────

// Dry volume factor for mortar = 1.1 (NOT 1.54 — that's concrete) — IS 2212:1991
const MORTAR_DRY_FACTOR = 1.1

// Plaster per sqm — IS 1661:1972
const PLASTER = {
  internal: { thicknessMm: 12, ratio: '1:4', cementBagsPerSqm: 0.078, sandCftPerSqm: 0.50 },
  external: { thicknessMm: 15, ratio: '1:4', cementBagsPerSqm: 0.098, sandCftPerSqm: 0.63 },
  ceiling:  { thicknessMm:  6, ratio: '1:3', cementBagsPerSqm: 0.042, sandCftPerSqm: 0.20 },
  WASTAGE: 1.05, // 5% wastage mandatory
}
export { MORTAR_DRY_FACTOR, PLASTER }

// Waterproofing rates ₹/sqft — IS 2645:2003
const WP_RATES = {
  terrace: {
    bbc:      { min: 155, max: 225 }, // Brick Bat Coba
    membrane: { min: 120, max: 175 }, // APP Bitumen Membrane
    liquid:   { min:  85, max: 130 }, // Liquid Applied
    ips:      { min: 110, max: 155 }, // IPS Screed
  },
  bathroom: {
    cementitious: { min:  88, max: 145 },
    crystalline:  { min: 145, max: 220 }, // Xypex
    pu:           { min: 180, max: 250 }, // DrFixit 2K
  },
}

// Seismic zone mapping — IS 1893:2016 (Section 8 — LOCKED)
const SEISMIC_ZONE_MAP: Record<string, { zone: string; zFactor: number }> = {
  'Uttarakhand':              { zone: 'V',   zFactor: 0.36 },
  'Himachal Pradesh':         { zone: 'V',   zFactor: 0.36 },
  'Sikkim':                   { zone: 'V',   zFactor: 0.36 },
  'Arunachal Pradesh':        { zone: 'V',   zFactor: 0.36 },
  'Assam':                    { zone: 'V',   zFactor: 0.36 },
  'Manipur':                  { zone: 'V',   zFactor: 0.36 },
  'Meghalaya':                { zone: 'V',   zFactor: 0.36 },
  'Mizoram':                  { zone: 'V',   zFactor: 0.36 },
  'Nagaland':                 { zone: 'V',   zFactor: 0.36 },
  'Tripura':                  { zone: 'V',   zFactor: 0.36 },
  'Jammu and Kashmir':        { zone: 'V',   zFactor: 0.36 },
  'Ladakh':                   { zone: 'V',   zFactor: 0.36 },
  'Andaman and Nicobar Islands': { zone: 'V', zFactor: 0.36 },
  'Delhi':                    { zone: 'IV',  zFactor: 0.24 },
  'Punjab':                   { zone: 'IV',  zFactor: 0.24 },
  'Haryana':                  { zone: 'IV',  zFactor: 0.24 },
  'Chandigarh':               { zone: 'IV',  zFactor: 0.24 },
  'Bihar':                    { zone: 'IV',  zFactor: 0.24 },
  'Uttar Pradesh':            { zone: 'IV',  zFactor: 0.24 },
  'Maharashtra':              { zone: 'III', zFactor: 0.16 },
  'Gujarat':                  { zone: 'III', zFactor: 0.16 },
  'Rajasthan':                { zone: 'III', zFactor: 0.16 },
  'West Bengal':              { zone: 'III', zFactor: 0.16 },
  'Goa':                      { zone: 'III', zFactor: 0.16 },
  'Kerala':                   { zone: 'III', zFactor: 0.16 },
  'Karnataka':                { zone: 'II',  zFactor: 0.10 },
  'Tamil Nadu':               { zone: 'II',  zFactor: 0.10 },
  'Telangana':                { zone: 'II',  zFactor: 0.10 },
  'Andhra Pradesh':           { zone: 'II',  zFactor: 0.10 },
  'Madhya Pradesh':           { zone: 'II',  zFactor: 0.10 },
  'Chhattisgarh':             { zone: 'II',  zFactor: 0.10 },
  'Jharkhand':                { zone: 'II',  zFactor: 0.10 },
  'Odisha':                   { zone: 'II',  zFactor: 0.10 },
  'Lakshadweep':              { zone: 'III', zFactor: 0.16 },
  'Puducherry':               { zone: 'II',  zFactor: 0.10 },
  'Dadra and Nagar Haveli and Daman and Diu': { zone: 'III', zFactor: 0.16 },
}

// ─── WALL TYPE DEFINITIONS (IS code values per sqm — SECTION 8 LOCKED) ────────

export type ExternalWallType =
  | 'clay_modular_9'
  | 'clay_nonmodular_9'
  | 'flyash_modular_9'
  | 'flyash_nonmodular_9'
  | 'hollow_concrete_200'
  | 'solid_concrete_200'
  | 'aac_200'
  | 'clc_200'

export type InternalWallType =
  | 'clay_4_5'
  | 'flyash_4_5'
  | 'hollow_block_100'
  | 'aac_100'
  | 'clc_100'
  | 'gypsum_drywall'

export type WaterproofingMethod = 'bbc' | 'membrane' | 'liquid' | 'ips' | 'none'
export type BathroomWpMethod = 'cementitious' | 'crystalline' | 'pu' | 'none'
export type RoofType = 'flat' | 'sloped' | 'mixed'
export type SlopedRoofCovering = 'mangalore_tiles' | 'gi_sheet' | 'polycarbonate' | 'ms_truss'

export interface WallTypeSpec {
  label: string
  shortLabel: string
  isCode: string
  unitsPerSqm: number       // bricks or blocks
  unitLabel: string
  cementBagsPerSqm: number
  sandCftPerSqm: number
  mortarRatio: string
  isBlock: boolean
  aacWarning?: boolean      // true for AAC — Zone IV/V load-bearing restriction
}

// External wall IS data — Section 8 LOCKED values
export const EXTERNAL_WALL_SPECS: Record<ExternalWallType, WallTypeSpec> = {
  clay_modular_9: {
    label: 'Red Clay Brick — Modular (9")',
    shortLabel: 'Clay Modular 9"',
    isCode: 'IS 1077:1992 + IS 2212:1991',
    unitsPerSqm: 100,
    unitLabel: 'bricks',
    cementBagsPerSqm: 0.20,
    sandCftPerSqm: 2.13,
    mortarRatio: '1:6',
    isBlock: false,
  },
  clay_nonmodular_9: {
    label: 'Red Clay Brick — Non-Modular (9")',
    shortLabel: 'Clay Non-Mod 9"',
    isCode: 'IS 2212:1991',
    unitsPerSqm: 90,
    unitLabel: 'bricks',
    cementBagsPerSqm: 0.18,
    sandCftPerSqm: 1.65,
    mortarRatio: '1:6',
    isBlock: false,
  },
  flyash_modular_9: {
    label: 'Fly Ash Brick — Modular (9")',
    shortLabel: 'Fly Ash Mod 9"',
    isCode: 'IS 12894:2002 + IS 2212:1991',
    unitsPerSqm: 100,
    unitLabel: 'bricks',
    cementBagsPerSqm: 0.20,
    sandCftPerSqm: 2.13,
    mortarRatio: '1:6',
    isBlock: false,
  },
  flyash_nonmodular_9: {
    label: 'Fly Ash Brick — Non-Modular (9")',
    shortLabel: 'Fly Ash Non-Mod 9"',
    isCode: 'IS 12894:2002 + IS 2212:1991',
    unitsPerSqm: 90,
    unitLabel: 'bricks',
    cementBagsPerSqm: 0.18,
    sandCftPerSqm: 1.65,
    mortarRatio: '1:6',
    isBlock: false,
  },
  hollow_concrete_200: {
    label: 'Hollow Concrete Block (200mm)',
    shortLabel: 'Hollow Conc 200mm',
    isCode: 'IS 2185:2005',
    unitsPerSqm: 12.5,
    unitLabel: 'blocks',
    cementBagsPerSqm: 0.35,
    sandCftPerSqm: 1.50,
    mortarRatio: '1:4',
    isBlock: true,
  },
  solid_concrete_200: {
    label: 'Solid Concrete Block (200mm)',
    shortLabel: 'Solid Conc 200mm',
    isCode: 'IS 2185:2005',
    unitsPerSqm: 12.5,
    unitLabel: 'blocks',
    cementBagsPerSqm: 0.40,
    sandCftPerSqm: 1.70,
    mortarRatio: '1:4',
    isBlock: true,
  },
  aac_200: {
    label: 'AAC Block (200mm) — Autoclaved Aerated Concrete',
    shortLabel: 'AAC 200mm',
    isCode: 'IS 4326:1993',
    unitsPerSqm: 8.33,
    unitLabel: 'blocks',
    cementBagsPerSqm: 0.38, // thin-bed AAC adhesive mortar
    sandCftPerSqm: 0,        // AAC uses no sand — thin-bed adhesive only
    mortarRatio: 'Thin-bed adhesive',
    isBlock: true,
    aacWarning: true,
  },
  clc_200: {
    label: 'CLC Foam Block (200mm) — Cellular Lightweight Concrete',
    shortLabel: 'CLC 200mm',
    isCode: 'IS 2185:2005 (Cl)',
    unitsPerSqm: 12.5,
    unitLabel: 'blocks',
    cementBagsPerSqm: 0.32,
    sandCftPerSqm: 1.40,
    mortarRatio: '1:5',
    isBlock: true,
  },
}

// Internal partition IS data per sqm — Section 8 LOCKED
export const INTERNAL_WALL_SPECS: Record<InternalWallType, WallTypeSpec & { isPartition: true }> = {
  clay_4_5: {
    label: 'Clay Brick (4.5" — 115mm)',
    shortLabel: 'Clay 4.5"',
    isCode: 'IS 1077:1992 + IS 2212:1991',
    unitsPerSqm: 50,
    unitLabel: 'bricks',
    cementBagsPerSqm: 0.10,
    sandCftPerSqm: 0.72,
    mortarRatio: '1:4',
    isBlock: false,
    isPartition: true,
  },
  flyash_4_5: {
    label: 'Fly Ash Brick (4.5" — 115mm)',
    shortLabel: 'Fly Ash 4.5"',
    isCode: 'IS 12894:2002 + IS 2212:1991',
    unitsPerSqm: 48,
    unitLabel: 'bricks',
    cementBagsPerSqm: 0.09,
    sandCftPerSqm: 0.60,
    mortarRatio: '1:4',
    isBlock: false,
    isPartition: true,
  },
  hollow_block_100: {
    label: 'Hollow Concrete Block (100mm)',
    shortLabel: 'Hollow Block 100mm',
    isCode: 'IS 2185:2005',
    unitsPerSqm: 12.5, // 400×200mm face = 12.5 blocks/sqm (same face dimensions as 200mm, regardless of thickness)
    unitLabel: 'blocks',
    cementBagsPerSqm: 0.20,
    sandCftPerSqm: 0.75,
    mortarRatio: '1:4',
    isBlock: true,
    isPartition: true,
  },
  aac_100: {
    label: 'AAC Block (100mm)',
    shortLabel: 'AAC 100mm',
    isCode: 'IS 4326:1993',
    unitsPerSqm: 16.66,
    unitLabel: 'blocks',
    cementBagsPerSqm: 0.20,
    sandCftPerSqm: 0,
    mortarRatio: 'Thin-bed adhesive',
    isBlock: true,
    aacWarning: true,
    isPartition: true,
  },
  clc_100: {
    label: 'CLC Foam Block (100mm)',
    shortLabel: 'CLC 100mm',
    isCode: 'IS 2185:2005 (Cl)',
    unitsPerSqm: 25.0,
    unitLabel: 'blocks',
    cementBagsPerSqm: 0.18,
    sandCftPerSqm: 0.70,
    mortarRatio: '1:5',
    isBlock: true,
    isPartition: true,
  },
  gypsum_drywall: {
    label: 'Gypsum Board / Drywall Partition',
    shortLabel: 'Gypsum Drywall',
    isCode: 'IS 2547:1976',
    unitsPerSqm: 0,  // no bricks/blocks
    unitLabel: 'panels',
    cementBagsPerSqm: 0,
    sandCftPerSqm: 0,
    mortarRatio: 'Dry fix',
    isBlock: true,
    isPartition: true,
  },
}

// Default Pune 2026 material unit rates
const DEFAULT_RATES = {
  clayBrick:       11,  // ₹/brick (₹11,000/1000 per Section 5)
  flyashBrick:     8,   // ₹/brick — eco block, ~25% cheaper
  hollowBlock:     45,  // ₹/block 200mm
  solidBlock:      55,  // ₹/block 200mm
  aacBlock:        60,  // ₹/block 200mm
  clcBlock:        50,  // ₹/block 200mm
  hollowBlock100:  28,  // ₹/block 100mm
  aacBlock100:     38,  // ₹/block 100mm
  clcBlock100:     32,  // ₹/block 100mm
  cement:          495, // ₹/50kg bag (Pune Central — Section 5)
  sand:            24,  // ₹/cft (Pune Central — Section 5)
  aacAdhesive:     600, // ₹/bag (thin-bed adhesive, more expensive than OPC)
  gypsumPerSqm:    220, // ₹/sqm drywall material
}

// CPWD labour rates (Section 14)
const LABOUR_RATES = {
  rajMistri:     { workers: 3, ratePerDay: 850,  sqmPerDay: 11.15 }, // 120 sqft/day
  masonHelper:   { workers: 3, ratePerDay: 560,  sqmPerDay: 11.15 }, // ratio
  plasterMason:  { workers: 2, ratePerDay: 800,  sqmPerDay: 9.29  }, // 100 sqft/day
  plasterHelper: { workers: 2, ratePerDay: 540,  sqmPerDay: 9.29  }, // ratio
  wpSpecialist:  { workers: 1, ratePerDay: 1100, sqmPerDay: 7.43  }, // 80 sqft/day
  scaffolding:   { workers: 1, ratePerDay: 750,  sqmPerDay: null  },
  mixer:         { workers: 1, ratePerDay: 650,  sqmPerDay: null  },
  curingMan:     { workers: 1, ratePerDay: 500,  sqmPerDay: null  },
  foreman:       { workers: 1, ratePerDay: 1200, sqmPerDay: null  },
  nightWatchman: { workers: 1, ratePerDay: 500,  sqmPerDay: null  },
}

// ─── NEW SCHEDULE TYPES ───────────────────────────────────────────────────────

export interface RoomEntry {
  id: string
  name: string
  lengthFt: number
  widthFt: number
  wallHeightM: number
  wallType: 'external' | 'internal' | 'both'
}

export interface DoorEntry {
  id: string
  label: string
  widthMm: number
  heightMm: number
  count: number
  isCustom?: boolean
}

export interface WindowEntry {
  id: string
  label: string
  widthMm: number
  heightMm: number
  count: number
  isCustom?: boolean
}

export interface BalconyEntry {
  id: string
  name: string
  lengthM: number
  heightMm: number
  thicknessMm: 115 | 230
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ComplianceCheck {
  id: string
  clause: string
  description: string
  status: 'pass' | 'advisory' | 'fail'
  detail: string
}

export interface MasonInput {
  projectName?: string
  state: string
  city: string
  externalWallType: ExternalWallType
  externalWallAreaSqm: number          // NET external wall area (after door/window deductions)
  includeInternal: boolean
  internalWallType?: InternalWallType
  internalWallAreaSqm?: number         // NET internal wall area
  includePlaster: boolean
  includeWaterproofing: boolean
  terraceAreaSqft?: number
  bathroomCount?: number
  terraceWpMethod?: WaterproofingMethod
  bathroomWpMethod?: BathroomWpMethod
  contractorQuote?: number

  // Building overview
  numFloors?: number
  floorHeightM?: number

  // Direct wall-length model (replaces room-based model)
  selectedFloors?: number[]            // floor indices selected, e.g. [0, 1, 2] or [0, 2, 4]
  floorHeightFt?: number               // global floor height in feet
  exteriorWallLengthsFt?: number[]     // per selected floor, matching selectedFloors order
  interiorWallLengthsFt?: number[]     // per selected floor, for interior partitions
  perFloorExteriorAreaSqm?: number[]   // pre-computed net exterior area per selected floor

  // Per-floor wall type (used when sameWallAllFloors === false)
  sameWallAllFloors?: boolean
  perFloorWallTypes?: ExternalWallType[]

  // Staircase wall (runs full building height — separate from per-floor room schedule)
  includeStaircaseWall?: boolean
  staircaseWallLengthFt?: number
  staircaseWallHeightM?: number

  // Room schedule (legacy — kept for backward compat with old saved estimates)
  rooms?: RoomEntry[]
  grossExternalWallAreaSqm?: number
  grossInternalWallAreaSqm?: number
  totalDoorDeductionSqm?: number
  totalWindowDeductionSqm?: number
  doors?: DoorEntry[]
  windows?: WindowEntry[]

  // Parapet wall
  includeParapet?: boolean
  parapetAreaSqm?: number
  parapetPerimeterM?: number
  parapetHeightMm?: number
  parapetThicknessMm?: number

  // Balcony parapet
  includeBalcony?: boolean
  balconies?: BalconyEntry[]
  totalBalconyParapetAreaSqm?: number

  // Compound wall
  includeCompoundWall?: boolean
  compoundWallAreaSqm?: number
  compoundPerimeterM?: number
  compoundHeightM?: number
  compoundThicknessMm?: number
  compoundGateWidthM?: number
  compoundPillarCount?: number

  // Sunshades
  includeSunshades?: boolean
  sunshadesCount?: number
  sunshadeProjectionM?: number
  sunshadeWidthM?: number
  sunshadeThicknessMm?: number
  includeSoldierCourse?: boolean

  // Labour inclusion
  includeLabour?: boolean

  // Duct walls
  includeDucts?: boolean
  ductCount?: number
  ductPerimeterM?: number
  ductWallAreaSqm?: number

  // Roof type
  roofType?: RoofType
  slopedRoofCovering?: SlopedRoofCovering
  gableWallAreaSqm?: number
  ridgeLengthM?: number
  terraceParapetCoping?: boolean

  // Extended plaster flags
  plasterInternal?: boolean
  plasterExternal?: boolean
  plasterCeiling?: boolean
  plasterCompoundWall?: boolean
  plasterParapet?: boolean
  chickenMesh?: boolean
  ceilingPlasterAreaSqm?: number
}

export interface PerFloorBrickwork {
  floorLabel: string
  wallType: ExternalWallType
  areaSqm: number
  bricksOrBlocks: number
  cementBags: number
  sandCft: number
  materialCost: number
}

export interface StaircaseWallResult {
  lengthFt: number
  heightM: number
  areaSqm: number
  wallType: ExternalWallType
  bricksOrBlocks: number
  cementBags: number
  sandCft: number
  materialCost: number
}

export interface BrickworkQuantities {
  externalBricksOrBlocks: number
  externalCementBags: number
  externalSandCft: number
  internalBricksOrBlocks: number
  internalCementBags: number
  internalSandCft: number
  // New line items
  parapetBricksOrBlocks: number
  parapetCementBags: number
  parapetSandCft: number
  balconyParapetBricksOrBlocks: number
  compoundWallBricksOrBlocks: number
  compoundPillarCount: number
  ductWallBricksOrBlocks: number
}

export interface PlasterQuantities {
  externalPlasterCementBags: number
  externalPlasterSandCft: number
  internalPlasterCementBags: number
  internalPlasterSandCft: number
}

export interface WaterproofingCosts {
  terraceCost: number
  bathroomCost: number
  total: number
}

export interface MasonCosts {
  externalBrickworkMaterial: number
  internalPartitionMaterial: number
  parapetMaterial: number
  balconyParapetMaterial: number
  compoundWallMaterial: number
  ductWallMaterial: number
  plasterMaterial: number
  waterproofing: number
  staircaseWallMaterial: number
  totalMaterial: number
}

export interface WallTypeComparison {
  type: ExternalWallType
  label: string
  costPerSqm: number
  isCode: string
  unitsPerSqm: number
  unitLabel: string
}

export interface MasonResult {
  // Free — always visible
  seismicZone: string
  zFactor: number
  aacWarning: boolean
  compliance: ComplianceCheck[]
  grandTotal: { basic: number; standard: number; premium: number }
  perSqmCost: { basic: number; standard: number; premium: number }
  totalExternalWallAreaSqm: number
  technicalReminders: string[]
  wallTypeComparison: WallTypeComparison[]
  phaseContext: {
    percentOfTotal: string
    exampleAmount: string
    overchargingRisks: string[]
  }

  // Paid — blurred until payment
  brickworkQuantities: BrickworkQuantities
  plasterQuantities: PlasterQuantities | null
  waterproofingCosts: WaterproofingCosts | null
  costs: MasonCosts
  labourCost: number
  overheadCost: number

  // Multi-floor features (optional — present when floor count > 1)
  perFloorBrickwork?: PerFloorBrickwork[]
  staircaseWall?: StaircaseWallResult | null
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function seismicZoneFromState(state: string): { zone: string; zFactor: number } {
  return SEISMIC_ZONE_MAP[state] ?? { zone: 'III', zFactor: 0.16 }
}

function unitRateForType(type: ExternalWallType): number {
  switch (type) {
    case 'clay_modular_9':
    case 'clay_nonmodular_9':     return DEFAULT_RATES.clayBrick
    case 'flyash_modular_9':
    case 'flyash_nonmodular_9':   return DEFAULT_RATES.flyashBrick
    case 'hollow_concrete_200':   return DEFAULT_RATES.hollowBlock
    case 'solid_concrete_200':    return DEFAULT_RATES.solidBlock
    case 'aac_200':               return DEFAULT_RATES.aacBlock
    case 'clc_200':               return DEFAULT_RATES.clcBlock
  }
}

function unitRateForInternalType(type: InternalWallType): number {
  switch (type) {
    case 'clay_4_5':              return DEFAULT_RATES.clayBrick
    case 'flyash_4_5':            return DEFAULT_RATES.flyashBrick
    case 'hollow_block_100':      return DEFAULT_RATES.hollowBlock100
    case 'aac_100':               return DEFAULT_RATES.aacBlock100
    case 'clc_100':               return DEFAULT_RATES.clcBlock100
    case 'gypsum_drywall':        return DEFAULT_RATES.gypsumPerSqm
  }
}

function cementRate(type: ExternalWallType): number {
  return type === 'aac_200' ? DEFAULT_RATES.aacAdhesive : DEFAULT_RATES.cement
}

function materialCostPerSqm(type: ExternalWallType): number {
  const spec = EXTERNAL_WALL_SPECS[type]
  const unitRate = unitRateForType(type)
  const brickCost = spec.unitsPerSqm * unitRate
  const cemRate = cementRate(type)
  const cemCost = spec.cementBagsPerSqm * cemRate
  const sandCost = spec.sandCftPerSqm * DEFAULT_RATES.sand
  return brickCost + cemCost + sandCost
}

export function wallTypeComparison(): WallTypeComparison[] {
  return (Object.keys(EXTERNAL_WALL_SPECS) as ExternalWallType[]).map(type => ({
    type,
    label: EXTERNAL_WALL_SPECS[type].shortLabel,
    costPerSqm: Math.round(materialCostPerSqm(type)),
    isCode: EXTERNAL_WALL_SPECS[type].isCode,
    unitsPerSqm: EXTERNAL_WALL_SPECS[type].unitsPerSqm,
    unitLabel: EXTERNAL_WALL_SPECS[type].unitLabel,
  }))
}

// ─── MAIN CALCULATION ─────────────────────────────────────────────────────────

export function runCalculation(input: MasonInput): MasonResult {
  const {
    state,
    externalWallType,
    externalWallAreaSqm,
    includeInternal,
    internalWallType,
    internalWallAreaSqm = 0,
    includePlaster,
    includeWaterproofing,
    terraceAreaSqft = 0,
    bathroomCount = 0,
    terraceWpMethod = 'bbc',
    bathroomWpMethod = 'cementitious',
  } = input

  const { zone: seismicZone, zFactor } = seismicZoneFromState(state)
  const isHighSeismic = seismicZone === 'IV' || seismicZone === 'V'
  const aacWarning = (externalWallType === 'aac_200' || internalWallType === 'aac_100') && isHighSeismic

  const extSpec = EXTERNAL_WALL_SPECS[externalWallType]

  // ── Per-floor brickwork — legacy room-proportional model ──────────────────
  const usePerFloor = input.sameWallAllFloors === false
    && Array.isArray(input.perFloorWallTypes) && input.perFloorWallTypes.length > 0
    && Array.isArray(input.rooms) && input.rooms.length > 0

  // ── Per-floor brickwork — new direct-area model ───────────────────────────
  const useDirectFloor = !usePerFloor
    && Array.isArray(input.selectedFloors) && (input.selectedFloors?.length ?? 0) > 0
    && Array.isArray(input.perFloorExteriorAreaSqm) && (input.perFloorExteriorAreaSqm?.length ?? 0) > 0

  const useAnyPerFloor = usePerFloor || useDirectFloor

  let perFloorBrickwork: PerFloorBrickwork[] | undefined
  let perFloorTotalBricks = 0
  let perFloorTotalCement = 0
  let perFloorTotalSand = 0
  let perFloorTotalMat = 0

  if (usePerFloor) {
    const rooms = input.rooms!
    const pfTypes = input.perFloorWallTypes!
    const roomGross = rooms.map(r => 2 * (r.lengthFt + r.widthFt) * 0.3048 * r.wallHeightM)
    const totalGross = roomGross.reduce((a, b) => a + b, 0) || 1

    perFloorBrickwork = rooms.map((room, i) => {
      const fType = pfTypes[Math.min(i, pfTypes.length - 1)]
      const fSpec = EXTERNAL_WALL_SPECS[fType]
      const proportion = roomGross[i] / totalGross
      const floorNet = proportion * externalWallAreaSqm
      const bricks = Math.round(fSpec.unitsPerSqm * floorNet)
      const cement = Math.round(fSpec.cementBagsPerSqm * floorNet * 10) / 10
      const sand = Math.round(fSpec.sandCftPerSqm * floorNet * 10) / 10
      const bCost = bricks * unitRateForType(fType)
      const cCost = cement * (fType === 'aac_200' ? DEFAULT_RATES.aacAdhesive : DEFAULT_RATES.cement)
      const sCost = sand * DEFAULT_RATES.sand
      const mat = Math.round(bCost + cCost + sCost)
      perFloorTotalBricks += bricks
      perFloorTotalCement += cement
      perFloorTotalSand += sand
      perFloorTotalMat += mat
      const floorLabel = i === 0 ? 'G (Ground Floor)' : `G+${i}`
      return { floorLabel, wallType: fType, areaSqm: Math.round(floorNet * 100) / 100, bricksOrBlocks: bricks, cementBags: Math.round(cement * 10) / 10, sandCft: Math.round(sand * 10) / 10, materialCost: mat }
    })
  }

  if (useDirectFloor) {
    const floors = input.selectedFloors!
    const pfAreas = input.perFloorExteriorAreaSqm!
    const pfTypes = input.perFloorWallTypes
    const useSameType = input.sameWallAllFloors !== false || !pfTypes

    perFloorBrickwork = floors.map((floorIdx, i) => {
      const fType = useSameType
        ? externalWallType
        : (pfTypes?.[Math.min(i, pfTypes.length - 1)] ?? externalWallType)
      const fSpec = EXTERNAL_WALL_SPECS[fType]
      const floorNet = pfAreas[i] ?? 0
      const bricks = Math.round(fSpec.unitsPerSqm * floorNet)
      const cement = Math.round(fSpec.cementBagsPerSqm * floorNet * 10) / 10
      const sand = Math.round(fSpec.sandCftPerSqm * floorNet * 10) / 10
      const bCost = bricks * unitRateForType(fType)
      const cCost = cement * (fType === 'aac_200' ? DEFAULT_RATES.aacAdhesive : DEFAULT_RATES.cement)
      const sCost = sand * DEFAULT_RATES.sand
      const mat = Math.round(bCost + cCost + sCost)
      perFloorTotalBricks += bricks
      perFloorTotalCement += cement
      perFloorTotalSand += sand
      perFloorTotalMat += mat
      const floorLabel = `Floor ${floorIdx}`
      return { floorLabel, wallType: fType, areaSqm: Math.round(floorNet * 100) / 100, bricksOrBlocks: bricks, cementBags: Math.round(cement * 10) / 10, sandCft: Math.round(sand * 10) / 10, materialCost: mat }
    })
  }

  // ── External brickwork quantities ──────────────────────────────────────────
  const extBricksOrBlocks   = useAnyPerFloor ? perFloorTotalBricks : Math.round(extSpec.unitsPerSqm * externalWallAreaSqm)
  const extCementBags       = useAnyPerFloor ? Math.round(perFloorTotalCement * 10) / 10 : Math.round(extSpec.cementBagsPerSqm * externalWallAreaSqm * 10) / 10
  const extSandCft          = useAnyPerFloor ? Math.round(perFloorTotalSand * 10) / 10 : Math.round(extSpec.sandCftPerSqm * externalWallAreaSqm * 10) / 10

  // ── Internal brickwork quantities ─────────────────────────────────────────
  let intBricksOrBlocks = 0, intCementBags = 0, intSandCft = 0
  const effectiveIntArea = includeInternal ? internalWallAreaSqm : 0

  if (includeInternal && internalWallType && effectiveIntArea > 0) {
    const intSpec = INTERNAL_WALL_SPECS[internalWallType]
    if (internalWallType === 'gypsum_drywall') {
      intBricksOrBlocks = 0
      intCementBags = 0
      intSandCft = 0
    } else {
      intBricksOrBlocks = Math.round(intSpec.unitsPerSqm * effectiveIntArea)
      intCementBags = Math.round(intSpec.cementBagsPerSqm * effectiveIntArea * 10) / 10
      intSandCft = Math.round(intSpec.sandCftPerSqm * effectiveIntArea * 10) / 10
    }
  }

  // ── Parapet wall brickwork ────────────────────────────────────────────────
  const parapetAreaSqm = input.parapetAreaSqm ?? 0
  const parapetThickness = input.parapetThicknessMm ?? 115
  const parapetSpec = parapetThickness >= 200
    ? extSpec
    : (INTERNAL_WALL_SPECS[externalWallType.startsWith('flyash') ? 'flyash_4_5' : externalWallType.startsWith('aac') ? 'aac_100' : 'clay_4_5'])
  const parapetBricksOrBlocks   = parapetAreaSqm > 0 ? Math.round(parapetSpec.unitsPerSqm * parapetAreaSqm) : 0
  const parapetCementBags       = parapetAreaSqm > 0 ? Math.round(parapetSpec.cementBagsPerSqm * parapetAreaSqm * 10) / 10 : 0
  const parapetSandCft          = parapetAreaSqm > 0 ? Math.round(parapetSpec.sandCftPerSqm   * parapetAreaSqm * 10) / 10 : 0

  // ── Balcony parapet brickwork ─────────────────────────────────────────────
  const balconyParapetAreaSqm       = input.totalBalconyParapetAreaSqm ?? 0
  const balconyParapetBricksOrBlocks = balconyParapetAreaSqm > 0
    ? Math.round(parapetSpec.unitsPerSqm * balconyParapetAreaSqm) : 0

  // ── Compound wall brickwork ───────────────────────────────────────────────
  const compoundAreaSqm = input.compoundWallAreaSqm ?? 0
  const compoundThickness = input.compoundThicknessMm ?? 230
  // 230mm (9" full brick) = 1.0×, 115mm (4.5" one brick) = 0.5× per IS 2212:1991
  const compoundSpecMultiplier = compoundThickness <= 115 ? 0.5 : 1.0
  const compoundBricksOrBlocks = compoundAreaSqm > 0
    ? Math.round(extSpec.unitsPerSqm * compoundSpecMultiplier * compoundAreaSqm) : 0
  const compoundCementBags = compoundAreaSqm > 0
    ? Math.round(extSpec.cementBagsPerSqm * compoundSpecMultiplier * compoundAreaSqm * 10) / 10 : 0
  const compoundSandCft = compoundAreaSqm > 0
    ? Math.round(extSpec.sandCftPerSqm * compoundSpecMultiplier * compoundAreaSqm * 10) / 10 : 0
  const compoundPillarCountVal = input.compoundPillarCount ?? 0

  // ── Duct wall brickwork ───────────────────────────────────────────────────
  const ductAreaSqm = input.ductWallAreaSqm ?? 0
  const ductSpec = INTERNAL_WALL_SPECS.clay_4_5
  const ductBricksOrBlocks = ductAreaSqm > 0 ? Math.round(ductSpec.unitsPerSqm * ductAreaSqm) : 0

  const brickworkQuantities: BrickworkQuantities = {
    externalBricksOrBlocks: extBricksOrBlocks,
    externalCementBags: extCementBags,
    externalSandCft: extSandCft,
    internalBricksOrBlocks: intBricksOrBlocks,
    internalCementBags: intCementBags,
    internalSandCft: intSandCft,
    parapetBricksOrBlocks,
    parapetCementBags,
    parapetSandCft,
    balconyParapetBricksOrBlocks,
    compoundWallBricksOrBlocks: compoundBricksOrBlocks,
    compoundPillarCount: compoundPillarCountVal,
    ductWallBricksOrBlocks: ductBricksOrBlocks,
  }

  // ── Plaster quantities (IS 1661:1972 + 5% wastage) ───────────────────────
  let plasterQuantities: PlasterQuantities | null = null
  let plasterCementBagsTotal = 0
  let plasterSandCftTotal = 0

  if (includePlaster) {
    const W = PLASTER.WASTAGE
    const doExt  = input.plasterExternal  !== false
    const doInt  = input.plasterInternal  !== false
    const doCeil = input.plasterCeiling   === true
    const doComp = input.plasterCompoundWall === true
    const doPar  = input.plasterParapet   === true

    const extPlasterArea  = doExt  ? externalWallAreaSqm * 2 : 0
    const intPlasterArea  = doInt  ? effectiveIntArea * 2 : 0
    const ceilArea        = doCeil ? (input.ceilingPlasterAreaSqm ?? 0) : 0
    const compPlasterArea = doComp ? (input.compoundWallAreaSqm ?? 0) * 2 : 0
    const parPlasterArea  = doPar  ? parapetAreaSqm * 2 : 0
    const totalExtPlaster = extPlasterArea + compPlasterArea + parPlasterArea

    const extPlasterCement = Math.round(PLASTER.external.cementBagsPerSqm * totalExtPlaster  * W * 10) / 10
    const extPlasterSand   = Math.round(PLASTER.external.sandCftPerSqm   * totalExtPlaster  * W * 10) / 10
    const intPlasterCement = Math.round(PLASTER.internal.cementBagsPerSqm * intPlasterArea  * W * 10) / 10
    const intPlasterSand   = Math.round(PLASTER.internal.sandCftPerSqm   * intPlasterArea  * W * 10) / 10
    const ceilCement       = Math.round(PLASTER.ceiling.cementBagsPerSqm  * ceilArea        * W * 10) / 10
    const ceilSand         = Math.round(PLASTER.ceiling.sandCftPerSqm    * ceilArea        * W * 10) / 10

    plasterQuantities = {
      externalPlasterCementBags: extPlasterCement,
      externalPlasterSandCft: extPlasterSand,
      internalPlasterCementBags: intPlasterCement,
      internalPlasterSandCft: intPlasterSand,
    }
    plasterCementBagsTotal = extPlasterCement + intPlasterCement + ceilCement
    plasterSandCftTotal    = extPlasterSand   + intPlasterSand   + ceilSand
  }

  // ── Waterproofing costs (IS 2645:2003) ────────────────────────────────────
  let waterproofingCosts: WaterproofingCosts | null = null
  let wpTotal = 0

  if (includeWaterproofing) {
    let terraceCost = 0
    let bathroomCost = 0

    if (terraceAreaSqft > 0 && terraceWpMethod !== 'none') {
      const wpRateRange = WP_RATES.terrace[terraceWpMethod as keyof typeof WP_RATES.terrace]
      const avgRate = wpRateRange ? (wpRateRange.min + wpRateRange.max) / 2 : 190
      terraceCost = Math.round(terraceAreaSqft * avgRate)
    }

    if (bathroomCount > 0 && bathroomWpMethod !== 'none') {
      const sqftPerBathroom = 35 // typical bathroom footprint for sunken WP
      const bathroomArea = bathroomCount * sqftPerBathroom
      const bWpRange = WP_RATES.bathroom[bathroomWpMethod as keyof typeof WP_RATES.bathroom]
      const bAvgRate = bWpRange ? (bWpRange.min + bWpRange.max) / 2 : 116
      bathroomCost = Math.round(bathroomArea * bAvgRate)
    }

    wpTotal = terraceCost + bathroomCost
    waterproofingCosts = { terraceCost, bathroomCost, total: wpTotal }
  }

  // ── Staircase wall (runs full building height, independent of floor schedule) ──
  let staircaseWallResult: StaircaseWallResult | null = null
  let staircaseMat = 0

  if (input.includeStaircaseWall && (input.staircaseWallLengthFt ?? 0) > 0 && (input.staircaseWallHeightM ?? 0) > 0) {
    const stairLengthM  = input.staircaseWallLengthFt! * 0.3048
    const stairHeightM  = input.staircaseWallHeightM!
    const stairAreaSqm  = stairLengthM * stairHeightM
    const stairWallType = externalWallType
    const stairSpec     = EXTERNAL_WALL_SPECS[stairWallType]
    const stairBricks   = Math.round(stairSpec.unitsPerSqm * stairAreaSqm)
    const stairCement   = Math.round(stairSpec.cementBagsPerSqm * stairAreaSqm * 10) / 10
    const stairSand     = Math.round(stairSpec.sandCftPerSqm * stairAreaSqm * 10) / 10
    const stairBrickCost = stairBricks * unitRateForType(stairWallType)
    const stairCemRate   = stairWallType === 'aac_200' ? DEFAULT_RATES.aacAdhesive : DEFAULT_RATES.cement
    const stairCemCost   = stairCement * stairCemRate
    const stairSandCost  = stairSand * DEFAULT_RATES.sand
    staircaseMat = Math.round(stairBrickCost + stairCemCost + stairSandCost)
    staircaseWallResult = {
      lengthFt: input.staircaseWallLengthFt!,
      heightM:  stairHeightM,
      areaSqm:  Math.round(stairAreaSqm * 100) / 100,
      wallType: stairWallType,
      bricksOrBlocks: stairBricks,
      cementBags: stairCement,
      sandCft: stairSand,
      materialCost: staircaseMat,
    }
  }

  // ── Material costs ────────────────────────────────────────────────────────
  const extBrickMat   = useAnyPerFloor ? perFloorTotalMat : extBricksOrBlocks * unitRateForType(externalWallType)
  const extCemRate    = externalWallType === 'aac_200' ? DEFAULT_RATES.aacAdhesive : DEFAULT_RATES.cement
  const extCementMat  = useAnyPerFloor ? 0 : extCementBags * extCemRate
  const extSandMat    = useAnyPerFloor ? 0 : extSandCft * DEFAULT_RATES.sand
  const extBrickworkMat = useAnyPerFloor ? perFloorTotalMat : Math.round(extBrickMat + extCementMat + extSandMat)

  let intPartitionMat = 0
  if (includeInternal && internalWallType && effectiveIntArea > 0) {
    if (internalWallType === 'gypsum_drywall') {
      intPartitionMat = Math.round(effectiveIntArea * DEFAULT_RATES.gypsumPerSqm)
    } else {
      const intBrickMat = intBricksOrBlocks * unitRateForInternalType(internalWallType)
      const intCemRate = internalWallType === 'aac_100' ? DEFAULT_RATES.aacAdhesive : DEFAULT_RATES.cement
      const intCementMat = intCementBags * intCemRate
      const intSandMat   = intSandCft * DEFAULT_RATES.sand
      intPartitionMat = Math.round(intBrickMat + intCementMat + intSandMat)
    }
  }

  // ── New material costs ────────────────────────────────────────────────────
  const parapetBrickMat  = parapetBricksOrBlocks * unitRateForType(externalWallType)
  const parapetCemCost   = parapetCementBags * (externalWallType.startsWith('aac') ? DEFAULT_RATES.aacAdhesive : DEFAULT_RATES.cement)
  const parapetSandCost  = parapetSandCft * DEFAULT_RATES.sand
  const parapetMat       = Math.round(parapetBrickMat + parapetCemCost + parapetSandCost)

  const balconyMat       = balconyParapetBricksOrBlocks * unitRateForType(externalWallType)

  const compBrickMat     = compoundBricksOrBlocks * unitRateForType(externalWallType)
  const compCemCost      = compoundCementBags * DEFAULT_RATES.cement
  const compSandCost     = compoundSandCft * DEFAULT_RATES.sand
  const compoundMat      = Math.round(compBrickMat + compCemCost + compSandCost)

  const ductMat          = Math.round(
    ductBricksOrBlocks * DEFAULT_RATES.clayBrick +
    (ductSpec.cementBagsPerSqm * ductAreaSqm * DEFAULT_RATES.cement) +
    (ductSpec.sandCftPerSqm    * ductAreaSqm * DEFAULT_RATES.sand)
  )

  const plasterMat = Math.round(
    (plasterCementBagsTotal * DEFAULT_RATES.cement) + (plasterSandCftTotal * DEFAULT_RATES.sand)
  )

  const totalMaterialCost = extBrickworkMat + intPartitionMat + parapetMat + Math.round(balconyMat) + compoundMat + ductMat + plasterMat + wpTotal + staircaseMat

  const costs: MasonCosts = {
    externalBrickworkMaterial: extBrickworkMat,
    internalPartitionMaterial: intPartitionMat,
    parapetMaterial:           parapetMat,
    balconyParapetMaterial:    Math.round(balconyMat),
    compoundWallMaterial:      compoundMat,
    ductWallMaterial:          ductMat,
    plasterMaterial:           plasterMat,
    waterproofing:             wpTotal,
    staircaseWallMaterial:     staircaseMat,
    totalMaterial:             totalMaterialCost,
  }

  // ── Labour costs (CPWD rates — Section 14) ────────────────────────────────
  // Brickwork labour
  const brickworkDays = externalWallAreaSqm / LABOUR_RATES.rajMistri.sqmPerDay
  const rajMistriCost = brickworkDays * LABOUR_RATES.rajMistri.workers * LABOUR_RATES.rajMistri.ratePerDay
  const helperCost    = brickworkDays * LABOUR_RATES.masonHelper.workers * LABOUR_RATES.masonHelper.ratePerDay
  const mixerCost     = brickworkDays * LABOUR_RATES.mixer.workers * LABOUR_RATES.mixer.ratePerDay
  const curingCost    = brickworkDays * LABOUR_RATES.curingMan.workers * LABOUR_RATES.curingMan.ratePerDay
  const scaffoldCost  = brickworkDays * LABOUR_RATES.scaffolding.workers * LABOUR_RATES.scaffolding.ratePerDay
  const brickworkLabour = rajMistriCost + helperCost + mixerCost + curingCost + scaffoldCost

  // Plaster labour
  let plasterLabour = 0
  if (includePlaster) {
    const totalPlasterArea = externalWallAreaSqm * 2 + effectiveIntArea * 2
    const plasterDays = totalPlasterArea / LABOUR_RATES.plasterMason.sqmPerDay
    plasterLabour = plasterDays * (
      LABOUR_RATES.plasterMason.workers * LABOUR_RATES.plasterMason.ratePerDay +
      LABOUR_RATES.plasterHelper.workers * LABOUR_RATES.plasterHelper.ratePerDay
    )
  }

  // WP labour (specialist at 80 sqft/day)
  let wpLabour = 0
  if (includeWaterproofing) {
    const wpAreaSqm = terraceAreaSqft / 10.764 + bathroomCount * 3.25
    const wpDays = wpAreaSqm / LABOUR_RATES.wpSpecialist.sqmPerDay
    wpLabour = wpDays * LABOUR_RATES.wpSpecialist.workers * LABOUR_RATES.wpSpecialist.ratePerDay
  }

  // Site overhead (foreman + night watchman proportional)
  const totalDays = Math.max(brickworkDays, 30)
  const overheadLabour = totalDays * (LABOUR_RATES.foreman.ratePerDay + LABOUR_RATES.nightWatchman.ratePerDay)

  const labourCostRaw = Math.round(brickworkLabour + plasterLabour + wpLabour + overheadLabour)
  const labourCost = input.includeLabour !== false ? labourCostRaw : 0

  // ── Grand total range ─────────────────────────────────────────────────────
  const overheadBasic    = Math.round((totalMaterialCost + labourCost * 0.85) * 0.05)
  const overheadStandard = Math.round((totalMaterialCost + labourCost)        * 0.10)
  const overheadPremium  = Math.round((totalMaterialCost + labourCost * 1.15) * 0.15)

  const totalBasic    = totalMaterialCost + Math.round(labourCost * 0.85) + overheadBasic
  const totalStandard = totalMaterialCost + labourCost + overheadStandard
  const totalPremium  = totalMaterialCost + Math.round(labourCost * 1.15) + overheadPremium

  const grandTotal = { basic: totalBasic, standard: totalStandard, premium: totalPremium }

  const perSqmCost = {
    basic:    Math.round(totalBasic    / externalWallAreaSqm),
    standard: Math.round(totalStandard / externalWallAreaSqm),
    premium:  Math.round(totalPremium  / externalWallAreaSqm),
  }

  // ── IS Compliance Panel ───────────────────────────────────────────────────
  const compliance: ComplianceCheck[] = [
    {
      id: 'aac_seismic',
      clause: 'IS 4326:1993 Cl 8',
      description: 'AAC block use in seismic zones',
      status: aacWarning ? 'fail' : 'pass',
      detail: aacWarning
        ? `Zone ${seismicZone}: AAC blocks NOT permitted as load-bearing masonry. Use clay brick or hollow concrete block for load-bearing walls. AAC approved for infill/partition only.`
        : externalWallType === 'aac_200'
          ? `Zone ${seismicZone}: AAC blocks permitted. Ensure structural engineer has confirmed load-bearing classification.`
          : 'AAC restriction not applicable for selected wall type.',
    },
    {
      id: 'mortar_grade',
      clause: 'IS 2250:1981',
      description: 'Mortar grade for load-bearing walls',
      status: (externalWallType === 'clay_modular_9' || externalWallType === 'clay_nonmodular_9' ||
               externalWallType === 'flyash_modular_9' || externalWallType === 'flyash_nonmodular_9')
        ? 'advisory'
        : 'pass',
      detail: `Selected wall uses ${extSpec.mortarRatio} mortar (${extSpec.isCode}). For load-bearing walls, minimum M2 (1:4) per IS 2250:1981. Verify with structural engineer if walls carry loads.`,
    },
    {
      id: 'seismic_band',
      clause: 'IS 4326:1993 Cl 8.4',
      description: 'Seismic band reinforcement in masonry',
      status: (seismicZone === 'III' || seismicZone === 'IV' || seismicZone === 'V') ? 'advisory' : 'pass',
      detail: (seismicZone === 'III' || seismicZone === 'IV' || seismicZone === 'V')
        ? `Zone ${seismicZone}: Mandatory seismic bands at Plinth, Sill, Lintel, and Roof levels. 75mm wide, full wall width, 2×8mm bars + 6mm stirrups @150mm. Max wall length 6m without cross-wall.`
        : `Zone ${seismicZone}: Seismic bands recommended as good practice. Not mandatory but improve lateral resistance.`,
    },
    {
      id: 'brick_soaking',
      clause: 'IS 2212:1991 Cl 7.1',
      description: 'Brick soaking before laying',
      status: 'advisory',
      detail: 'Clay bricks must be soaked in clean water for minimum 2 hours before laying. Ensures proper bond between mortar and brick. Skipped by many contractors — verify on site.',
    },
    {
      id: 'curing',
      clause: 'IS 2212:1991 Cl 9',
      description: 'Masonry curing period',
      status: 'advisory',
      detail: 'Cure masonry minimum 7 days with wet gunny (hessian) bags. Curing is the most frequently skipped activity on residential sites. Budget a dedicated curing person.',
    },
    {
      id: 'frog_up',
      clause: 'IS 2212:1991 Cl 7.2',
      description: 'Brick laying orientation',
      status: 'advisory',
      detail: 'Frog (indentation) must face UP during laying — mortar fills the frog and creates mechanical key. Frog-down laying reduces bond strength significantly.',
    },
  ]

  // ── Wall comparison (free feature — all 8 types at city rates) ────────────
  const wTypeComparison = wallTypeComparison()

  // ── Technical reminders ───────────────────────────────────────────────────
  const technicalReminders: string[] = [
    'IS 2212:1991 Cl 7.1 — Soak bricks minimum 2 hours before laying. Dry brick absorbs mortar water and weakens bond.',
    'IS 2212:1991 Cl 7.2 — Lay bricks frog-side up. Mortar fills frog creating mechanical key — frog-down is a site defect.',
    'IS 2212:1991 Cl 8 — Use English bond for 9" walls (load-bearing). Stretcher bond only for 4.5" non-load-bearing partitions.',
    'IS 2212:1991 Cl 9 — Cure freshly laid masonry minimum 7 days with wet gunny bags. Budget a dedicated curing person.',
    'IS 2250:1981 — Never use more than 1:6 mortar for load-bearing masonry. Weak mortar is the most common mason fraud.',
    'IS 1661:1972 Cl 8 — Apply chicken mesh (19mm hexagonal) at all RCC–brick junctions. Prevents cracking at interface.',
    'IS 4326:1993 Cl 8.4 — In seismic zones, seismic bands (lintel band is minimum) are mandatory. Verify in structural drawings.',
    'IS 2212:1991 — No wall panel longer than 6m without a cross-wall or pilaster. Slender long walls fail under lateral load.',
    'IS 1661:1972 Cl 6 — Wet the surface before plastering. Dry substrate pulls water from plaster — cracking and delamination.',
    'IS 2645:2003 — Waterproofing pond test: fill 50mm water on terrace for 24-48 hours. Do not backfill bathrooms before test passes.',
  ]

  // ── Phase context (visible free) ─────────────────────────────────────────
  const phaseContext = {
    percentOfTotal: '20–25%',
    exampleAmount: '₹5–6.25 Lakhs on a ₹25 Lakh total project',
    overchargingRisks: [
      'Inflated brick counts (add 10% and bill for it — IS count is exact)',
      'Wrong mortar ratio (1:4 quoted but 1:8 used on site)',
      'Skipping curing days (billed but not done)',
      'Brick substitution (fly ash billed as clay, or underspec bricks)',
      'Plaster thickness inflation (billing 18mm, applying 12mm)',
    ],
  }

  return {
    seismicZone,
    zFactor,
    aacWarning,
    compliance,
    grandTotal,
    perSqmCost,
    totalExternalWallAreaSqm: externalWallAreaSqm,
    technicalReminders,
    wallTypeComparison: wTypeComparison,
    phaseContext,
    brickworkQuantities,
    plasterQuantities,
    waterproofingCosts,
    costs,
    labourCost,
    overheadCost: overheadStandard,
    perFloorBrickwork,
    staircaseWall: staircaseWallResult,
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

export function formatLakhs(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}
