// Vertical Extension (VE) Calculation Engine
// IS 456:2000 Cl 26.2.5 — splice bars: lap = 50× bar diameter
// IS 1893:2016 Cl 7.3 — irregularity checks
// IS 13920:2016 — ductile detailing for extended columns
// SP 34 — Handbook on Concrete Reinforcement (splice length)

import { type ConcreteGrade, type SteelGrade, seismicZoneFromState } from './structopro-engine'

// IS 456:2000 thumb rule values — Section 8 LOCKED
const IS_THUMB = {
  CEMENT_BAGS_PER_SQFT:      0.4,
  STEEL_KG_PER_SQFT:         4,
  AGGREGATE_CFT_PER_SQFT:    1.35,
  SAND_CFT_PER_SQFT:         1.8,
  BINDING_WIRE_KG_PER_TONNE: 12,
}

// Concrete grade cost multiplier (relative to M20 = 1.0)
const GRADE_COST_FACTOR: Record<ConcreteGrade, number> = {
  M20: 1.00, M25: 1.12, M30: 1.22, M35: 1.32, M40: 1.45,
}

// Bar weight kg/m — IS 1786:2008 Section 8 LOCKED
const BAR_WEIGHT_KG_PER_M: Record<number, number> = {
  8:  0.395,
  10: 0.617,
  12: 0.888,
  16: 1.578,
  20: 2.467,
  25: 3.854,
  32: 6.313,
}

// Column safe height limits per Build Reference Section 13
const COLUMN_SIZE_MAX_UPPER_FLOORS: Record<string, number> = {
  '230×230': 0,  // G only
  '300×300': 1,  // G+1 max
  '350×350': 2,  // G+2 max
  '400×400': 3,  // G+3+ max
}

// Typical main bars per column by size
const BARS_PER_COLUMN: Record<string, number> = {
  '230×230': 4,
  '300×300': 4,
  '350×350': 6,
  '400×400': 8,
}

// ─── Input types ─────────────────────────────────────────────────────────────

export type BuildingAge        = '0-5' | '5-10' | '10-20' | '20+'
export type ExistingColumnSize = '230×230' | '300×300' | '350×350' | '400×400'
export type ExistingConcreteGrade = 'M15' | 'M20' | 'M25' | 'Unknown'
export type AuditStatus        = 'yes' | 'no' | 'planning'

export interface VERates {
  cement:      number   // ₹/50kg bag
  steel:       number   // ₹/kg
  sand:        number   // ₹/cft
  aggregate:   number   // ₹/cft
  formwork:    number   // ₹/sqft BUA
  bindingWire: number   // ₹/kg
  antiTermite: number   // ₹/sqft (included for 3b parity, not used in VE calc)
  pccM10:      number   // ₹/m³   (included for 3b parity, not used in VE calc)
}

export interface VEInput {
  // Location
  state:       string
  city:        string
  projectName?: string

  // Existing structure (Step 3a — part 1)
  existingUpperFloors:    number               // 0=G, 1=G+1, 2=G+2, 3=G+3
  buildingAge:            BuildingAge
  existingColumnSize:     ExistingColumnSize
  existingConcreteGrade:  ExistingConcreteGrade
  hasStructuralDrawings:  'yes' | 'no'
  hasStructuralAudit:     AuditStatus
  existingFloorAreaSqft:  number

  // New floors (Step 3a — part 2)
  floorsToAdd:            1 | 2 | 3
  newAreaSameAsExisting:  boolean
  newFloorAreaSqft:       number               // used when !newAreaSameAsExisting
  floorHeightFt:          number               // default 10
  newConcreteGrade:       ConcreteGrade
  newSteelGrade:          SteelGrade

  // Material rates (Step 3b)
  rates: VERates

  // Labour (Step 3c)
  includeLabour:    boolean

  // Optional contractor quote
  contractorQuote?: number
}

// ─── Result types ─────────────────────────────────────────────────────────────

export interface ColumnAdequacyCheck {
  existingColumnSize:   ExistingColumnSize
  existingUpperFloors:  number
  floorsToAdd:          number
  resultingUpperFloors: number
  maxSafeUpperFloors:   number
  status:               'pass' | 'warning' | 'critical'
  message:              string
  isRef:                string
}

export interface SpliceBarSchedule {
  barDiameterMm:          number   // mm
  spliceLength:           number   // mm = 50 × dia per IS 456:2000 Cl 26.2.5
  barsPerColumn:          number
  numColumnsEstimated:    number
  spliceWeightPerColKg:   number
  totalSpliceWeightKg:    number
  isRef:                  string
}

export interface VEMaterialQuantities {
  cementBags:      number
  steelKg:         number   // base (without splice)
  steelKgWithSplice: number // +8% for splices per IS 456:2000 Cl 26.2.5
  aggregateCft:    number
  sandCft:         number
  bindingWireKg:   number
  formworkSqft:    number
}

export interface VEMaterialCost {
  cement:           number
  steel:            number
  aggregate:        number
  sand:             number
  bindingWire:      number
  formwork:         number
  totalWithWastage: number   // 7% wastage. Foundation EXCLUDED per VE scope.
}

export interface VEResult {
  // Free
  newFloorBUASqft:  number
  seismicZone:      string
  zFactor:          number
  columnAdequacy:   ColumnAdequacyCheck
  grandTotalRange:  { basic: number; standard: number; premium: number }
  perSqftCost:      { basic: number; standard: number; premium: number }
  technicalReminders: string[]

  // Paid (blurred)
  quantities:       VEMaterialQuantities
  materialCost:     VEMaterialCost
  spliceBarSchedule: SpliceBarSchedule
}

// ─── Calculation ──────────────────────────────────────────────────────────────

export function runVECalculation(input: VEInput): VEResult {
  const {
    state, existingUpperFloors, existingColumnSize, existingFloorAreaSqft,
    floorsToAdd, newAreaSameAsExisting, newFloorAreaSqft, newConcreteGrade, rates,
  } = input

  const szInfo = seismicZoneFromState(state)

  const newBUAPerFloor = newAreaSameAsExisting ? existingFloorAreaSqft : newFloorAreaSqft
  const totalNewBUA    = newBUAPerFloor * floorsToAdd

  const gradeFactor = GRADE_COST_FACTOR[newConcreteGrade]

  // IS thumb rule quantities — new floors ONLY, no foundation
  const cementBags     = Math.round(totalNewBUA * IS_THUMB.CEMENT_BAGS_PER_SQFT * gradeFactor)
  const steelKgBase    = Math.round(totalNewBUA * IS_THUMB.STEEL_KG_PER_SQFT)
  // +8% steel for splice bars (IS 456:2000 Cl 26.2.5, lap = 50× bar diameter)
  const steelKgWithSplice = Math.round(steelKgBase * 1.08)
  const aggregateCft   = Math.round(totalNewBUA * IS_THUMB.AGGREGATE_CFT_PER_SQFT)
  const sandCft        = Math.round(totalNewBUA * IS_THUMB.SAND_CFT_PER_SQFT)
  const bindingWireKg  = Math.round(steelKgWithSplice * (IS_THUMB.BINDING_WIRE_KG_PER_TONNE / 1000))
  const formworkSqft   = Math.round(totalNewBUA * 0.5)

  // Material costs using form rates
  const cementCost     = cementBags      * rates.cement
  const steelCost      = steelKgWithSplice * rates.steel
  const aggregateCost  = aggregateCft    * rates.aggregate
  const sandCost       = sandCft         * rates.sand
  const bindingWireCost = bindingWireKg  * rates.bindingWire
  const formworkCost   = formworkSqft    * rates.formwork

  const subtotal         = cementCost + steelCost + aggregateCost + sandCost + bindingWireCost + formworkCost
  const totalWithWastage = Math.round(subtotal * 1.07)   // 7% field wastage

  // Grand total range (labour is unknown so give a ±range)
  const labourBasic    = Math.round(totalWithWastage * 0.15)
  const labourStandard = Math.round(totalWithWastage * 0.28)
  const labourPremium  = Math.round(totalWithWastage * 0.38)
  const ohBasic        = Math.round((totalWithWastage + labourBasic)    * 0.05)
  const ohStandard     = Math.round((totalWithWastage + labourStandard) * 0.05)
  const ohPremium      = Math.round((totalWithWastage + labourPremium)  * 0.15)

  const totalBasic    = totalWithWastage + labourBasic    + ohBasic
  const totalStandard = totalWithWastage + labourStandard + ohStandard
  const totalPremium  = totalWithWastage + labourPremium  + ohPremium

  // ── Column adequacy check ──
  const maxSafeUpperFloors  = COLUMN_SIZE_MAX_UPPER_FLOORS[existingColumnSize] ?? 2
  const resultingUpperFloors = existingUpperFloors + floorsToAdd
  const resultingLabel = resultingUpperFloors === 0 ? 'G' : `G+${resultingUpperFloors}`

  let colStatus: 'pass' | 'warning' | 'critical'
  let colMessage: string

  if (resultingUpperFloors <= maxSafeUpperFloors) {
    colStatus = 'pass'
    colMessage = `${existingColumnSize}mm columns are standard-rated up to G+${maxSafeUpperFloors}. Resulting height ${resultingLabel} is within thumb-rule limits. A structural engineer's verification is still required before commencing work.`
  } else if (resultingUpperFloors === maxSafeUpperFloors + 1) {
    colStatus = 'warning'
    colMessage = `⚠️ Existing ${existingColumnSize}mm columns may be undersized for ${resultingLabel} total height (standard thumb-rule limit: G+${maxSafeUpperFloors}). Structural engineer must verify column axial load capacity, reinforcement detailing, and column-beam joint adequacy before proceeding.`
  } else {
    colStatus = 'critical'
    colMessage = `⛔ Existing ${existingColumnSize}mm columns are NOT typically rated for ${resultingLabel} total height (standard limit: G+${maxSafeUpperFloors}). Column strengthening (jacketing) or replacement is likely required. Do NOT proceed without a licensed structural engineer's written certification.`
  }

  // ── Splice bar schedule (IS 456:2000 Cl 26.2.5) ──
  const barDiameterMm       = 16    // standard residential column bar
  const spliceLength        = 50 * barDiameterMm   // 800mm per IS 456
  const barsPerColumn       = BARS_PER_COLUMN[existingColumnSize] ?? 4
  const numColumnsEstimated = Math.max(4, Math.round(existingFloorAreaSqft / 150))
  const barWeightPerM       = BAR_WEIGHT_KG_PER_M[barDiameterMm]!
  const spliceWeightPerCol  = Math.round(barsPerColumn * (spliceLength / 1000) * barWeightPerM * 100) / 100
  const totalSpliceWeight   = Math.round(spliceWeightPerCol * numColumnsEstimated)

  return {
    newFloorBUASqft: totalNewBUA,
    seismicZone:     szInfo.zone,
    zFactor:         szInfo.zFactor,

    columnAdequacy: {
      existingColumnSize,
      existingUpperFloors,
      floorsToAdd,
      resultingUpperFloors,
      maxSafeUpperFloors,
      status:  colStatus,
      message: colMessage,
      isRef:   'IS 456:2000 Cl 26.5.3 · IS 1893:2016 Cl 7.3',
    },

    grandTotalRange: { basic: totalBasic, standard: totalStandard, premium: totalPremium },
    perSqftCost: {
      basic:    Math.round(totalBasic    / totalNewBUA),
      standard: Math.round(totalStandard / totalNewBUA),
      premium:  Math.round(totalPremium  / totalNewBUA),
    },

    technicalReminders: [
      'IS 456:2000 Cl 26.2.5 — Column extension splice length = 50× bar diameter. For 16mm bars: 800mm minimum lap. Verify this in the contractor\'s bar bending schedule before any pour.',
      'SP 34 (Handbook on Concrete Reinforcement) — Splice bars at column tops are the most frequently omitted item in vertical extension quotes. Always ask the contractor to show them in the steel schedule.',
      'IS 1893:2016 Cl 7.3 — Vertical extension may introduce geometric or mass irregularities requiring dynamic analysis in Zones III–V.',
      'IS 13920:2016 — Column ties (stirrups) must be continuous through the splice zone at d/4 or 100mm spacing, whichever is less.',
      'IS 456:2000 Cl 13.5 — Cure all new RCC members minimum 14 days with wet hessian (VE protocol: 2 weeks per new floor).',
      'IS 1904:2016 — Existing foundation adequacy for additional load must be checked by a structural engineer. Foundation cost is NOT included in this estimate.',
      'IS 456:2000 Cl 9.1 — Use bonding agent at all existing-to-new concrete interfaces. Do not simply pour onto old concrete — bond failure will cause delamination.',
      'CPWD DSR 2023 — Vertical extension work typically costs 10–20% more per sqft than equivalent new construction due to hoisting, access restrictions, and smaller concrete batches.',
    ],

    quantities: {
      cementBags,
      steelKg: steelKgBase,
      steelKgWithSplice,
      aggregateCft,
      sandCft,
      bindingWireKg,
      formworkSqft,
    },
    materialCost: {
      cement:           Math.round(cementCost),
      steel:            Math.round(steelCost),
      aggregate:        Math.round(aggregateCost),
      sand:             Math.round(sandCost),
      bindingWire:      Math.round(bindingWireCost),
      formwork:         Math.round(formworkCost),
      totalWithWastage,
    },
    spliceBarSchedule: {
      barDiameterMm,
      spliceLength,
      barsPerColumn,
      numColumnsEstimated,
      spliceWeightPerColKg: spliceWeightPerCol,
      totalSpliceWeightKg:  totalSpliceWeight,
      isRef: 'IS 456:2000 Cl 26.2.5 · SP 34 · lap length = 50× bar dia',
    },
  }
}
