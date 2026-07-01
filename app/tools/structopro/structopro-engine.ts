// IS 456:2000 verified values — LOCKED. Build Reference Section 8. Do not alter.
const IS_THUMB = {
  CEMENT_BAGS_PER_SQFT: 0.4,
  STEEL_KG_PER_SQFT: 4,
  AGGREGATE_CFT_PER_SQFT: 1.35,
  SAND_CFT_PER_SQFT: 1.8,
  BINDING_WIRE_KG_PER_TONNE: 12,
}

// Seismic zone mapping (IS 1893:2016) — Build Reference Section 8
const SEISMIC_ZONE_MAP: Record<string, { zone: string; zFactor: number }> = {
  'Uttarakhand':                          { zone: 'V',   zFactor: 0.36 },
  'Himachal Pradesh':                     { zone: 'V',   zFactor: 0.36 },
  'Sikkim':                               { zone: 'V',   zFactor: 0.36 },
  'Arunachal Pradesh':                    { zone: 'V',   zFactor: 0.36 },
  'Assam':                                { zone: 'V',   zFactor: 0.36 },
  'Manipur':                              { zone: 'V',   zFactor: 0.36 },
  'Meghalaya':                            { zone: 'V',   zFactor: 0.36 },
  'Mizoram':                              { zone: 'V',   zFactor: 0.36 },
  'Nagaland':                             { zone: 'V',   zFactor: 0.36 },
  'Tripura':                              { zone: 'V',   zFactor: 0.36 },
  'Jammu and Kashmir':                    { zone: 'V',   zFactor: 0.36 },
  'Ladakh':                               { zone: 'V',   zFactor: 0.36 },
  'Andaman and Nicobar Islands':          { zone: 'V',   zFactor: 0.36 },
  'Delhi':                                { zone: 'IV',  zFactor: 0.24 },
  'Punjab':                               { zone: 'IV',  zFactor: 0.24 },
  'Haryana':                              { zone: 'IV',  zFactor: 0.24 },
  'Chandigarh':                           { zone: 'IV',  zFactor: 0.24 },
  'Bihar':                                { zone: 'IV',  zFactor: 0.24 },
  'Uttar Pradesh':                        { zone: 'IV',  zFactor: 0.24 },
  'Maharashtra':                          { zone: 'III', zFactor: 0.16 },
  'Gujarat':                              { zone: 'III', zFactor: 0.16 },
  'Rajasthan':                            { zone: 'III', zFactor: 0.16 },
  'West Bengal':                          { zone: 'III', zFactor: 0.16 },
  'Goa':                                  { zone: 'III', zFactor: 0.16 },
  'Kerala':                               { zone: 'III', zFactor: 0.16 },
  'Karnataka':                            { zone: 'II',  zFactor: 0.10 },
  'Tamil Nadu':                           { zone: 'II',  zFactor: 0.10 },
  'Telangana':                            { zone: 'II',  zFactor: 0.10 },
  'Andhra Pradesh':                       { zone: 'II',  zFactor: 0.10 },
  'Madhya Pradesh':                       { zone: 'II',  zFactor: 0.10 },
  'Chhattisgarh':                         { zone: 'II',  zFactor: 0.10 },
  'Jharkhand':                            { zone: 'II',  zFactor: 0.10 },
  'Odisha':                               { zone: 'II',  zFactor: 0.10 },
  'Lakshadweep':                          { zone: 'III', zFactor: 0.16 },
  'Puducherry':                           { zone: 'II',  zFactor: 0.10 },
  'Dadra and Nagar Haveli and Daman and Diu': { zone: 'III', zFactor: 0.16 },
}

export type SiteCondition =
  | 'flat' | 'sloped_mild' | 'sloped_steep' | 'rocky'
  | 'bcs' | 'soft_marshy' | 'waterlogged' | 'coastal'

export type ConcreteGrade = 'M20' | 'M25' | 'M30' | 'M35' | 'M40'
export type SteelGrade = 'Fe415' | 'Fe500' | 'Fe500D' | 'Fe550D'
export type ExposureClass = 'mild' | 'moderate' | 'severe' | 'very_severe' | 'extreme'

export interface FoundationRecommendation {
  type: string
  label: string
  isCode: string
  warning?: string
  minCostPerSqft: number
  maxCostPerSqft: number
}

export interface ComplianceCheck {
  id: string
  clause: string
  description: string
  status: 'pass' | 'advisory' | 'fail'
  detail: string
}

export interface StructoInput {
  state: string
  city: string
  numFloors: number           // 0=G, 1=G+1, …, 5=G+5
  groundFloorAreaSqft: number
  perFloorAreas?: number[]    // per-floor areas in sqft (when sameArea=false); length = numFloors+1
  siteCondition: SiteCondition
  concreteGrade: ConcreteGrade
  steelGrade: SteelGrade
  seismicZoneOverride?: string
  // Extended form fields (not used in calculation — saved to estimate record)
  projectName?: string
  contractorQuote?: number
  contractorName?: string
  contractorConcreteRate?: number
  contractorSteelRate?: number
  contractorFormworkRate?: number
  includeLabour?: boolean
  columnSize?: string
  slabThickness?: number
  foundationDepth?: number
}

export interface MaterialQuantities {
  cementBags: number
  steelKg: number
  aggregateCft: number
  sandCft: number
  bindingWireKg: number
  admixtureLitres: number
  formworkSqft: number
}

export interface MaterialCosts {
  cement: number
  steel: number
  aggregate: number
  sand: number
  bindingWire: number
  admixture: number
  formwork: number
  foundation: number
  total: number
}

export interface StructoResult {
  // Free — always visible
  seismicZone: string
  zFactor: number
  exposureClass: ExposureClass
  foundationRecommendation: FoundationRecommendation
  compliance: ComplianceCheck[]
  grandTotal: { basic: number; standard: number; premium: number }
  perSqftCost: { basic: number; standard: number; premium: number }
  totalBUA: number
  technicalReminders: string[]
  gradeSummary: { grade: ConcreteGrade; costPerSqft: number; label: string }[]

  // Paid — blurred until payment
  quantities: MaterialQuantities
  costs: MaterialCosts
  labourCost: number
  overheadCost: number
}

// ---------- helpers ----------

export function seismicZoneFromState(state: string): { zone: string; zFactor: number } {
  return SEISMIC_ZONE_MAP[state] ?? { zone: 'III', zFactor: 0.16 }
}

export function exposureFromSiteCondition(cond: SiteCondition): ExposureClass {
  const map: Record<SiteCondition, ExposureClass> = {
    flat:         'mild',
    sloped_mild:  'mild',
    sloped_steep: 'moderate',
    rocky:        'mild',
    bcs:          'moderate',
    soft_marshy:  'severe',
    waterlogged:  'severe',
    coastal:      'very_severe',
  }
  return map[cond]
}

export function foundationFromSiteCondition(
  cond: SiteCondition,
  numFloors: number
): FoundationRecommendation {
  const tooHeavyForIsolated = numFloors >= 4
  switch (cond) {
    case 'flat':
      return {
        type:  tooHeavyForIsolated ? 'raft' : 'isolated',
        label: tooHeavyForIsolated ? 'Raft Foundation (G+4/G+5 load)' : 'Isolated Footing',
        isCode: 'IS 1904:2016',
        minCostPerSqft: tooHeavyForIsolated ? 350 : 220,
        maxCostPerSqft: tooHeavyForIsolated ? 550 : 350,
      }
    case 'sloped_mild':
      return {
        type:  'strip',
        label: 'Strip Footing (stepped for slope)',
        isCode: 'IS 1904:2016',
        minCostPerSqft: 200, maxCostPerSqft: 320,
      }
    case 'sloped_steep':
      return {
        type:  'raft',
        label: 'Raft Foundation (stepped — steep slope)',
        isCode: 'IS 1904:2016',
        warning: 'Geotechnical investigation mandatory before work.',
        minCostPerSqft: 350, maxCostPerSqft: 550,
      }
    case 'rocky':
      return {
        type:  'rock_cut',
        label: 'Rock-Cut Footing',
        isCode: 'IS 1904:2016',
        minCostPerSqft: 180, maxCostPerSqft: 280,
      }
    case 'bcs':
      return {
        type:  'under_reamed',
        label: 'Under-Reamed Pile Foundation',
        isCode: 'IS 2911:2010',
        warning: 'Black Cotton Soil expands/contracts. Regular isolated footing NOT suitable.',
        minCostPerSqft: 400, maxCostPerSqft: 600,
      }
    case 'soft_marshy':
      return {
        type:  'pile',
        label: 'Pile Foundation',
        isCode: 'IS 2911:2010',
        warning: 'Bearing capacity very low. Structural engineer mandatory before proceeding.',
        minCostPerSqft: 450, maxCostPerSqft: 650,
      }
    case 'waterlogged':
      return {
        type:  'raft',
        label: 'Raft/Mat Foundation (waterproofed)',
        isCode: 'IS 1904:2016 + IS 2645:2003',
        warning: 'Waterproofing membrane mandatory below slab. Water table investigation required.',
        minCostPerSqft: 450, maxCostPerSqft: 600,
      }
    case 'coastal':
      return {
        type:  'raft',
        label: 'Raft Foundation (coastal — severe exposure)',
        isCode: 'IS 1904:2016',
        warning: 'Coastal exposure requires M30+ concrete and epoxy-coated bars per IS 456:2000 Table 16.',
        minCostPerSqft: 400, maxCostPerSqft: 580,
      }
  }
}

function gradeToNum(g: ConcreteGrade): number {
  return parseInt(g.replace('M', ''))
}

function isGradeAdequate(selected: ConcreteGrade, required: ConcreteGrade): boolean {
  return gradeToNum(selected) >= gradeToNum(required)
}

function exposureMinGrade(exp: ExposureClass): ConcreteGrade {
  const map: Record<ExposureClass, ConcreteGrade> = {
    mild: 'M20', moderate: 'M25', severe: 'M30', very_severe: 'M35', extreme: 'M40',
  }
  return map[exp]
}

// Cement grade cost per sqft BUA multiplier (relative to M20 = 1.0)
const GRADE_COST_FACTOR: Record<ConcreteGrade, number> = {
  M20: 1.00, M25: 1.12, M30: 1.22, M35: 1.32, M40: 1.45,
}

// Default Pune 2026 material rates (Section 5)
const DEFAULT_RATES = {
  cement: 495,         // ₹/50kg bag
  steel: 68,           // ₹/kg (Fe500D, TMT)
  aggregate: 20,       // ₹/cft (coarse aggregate)
  sand: 24,            // ₹/cft
  bindingWire: 85,     // ₹/kg
  admixture: 450,      // ₹/litre (plasticizer/superplasticizer)
  formworkPerSqftBUA: 30, // ₹/sqft material only
}

// Floor count factor: thumb rule is for G+1 to G+3
function floorFactor(numFloors: number): number {
  if (numFloors === 0) return 0.85
  if (numFloors <= 3) return 1.00
  if (numFloors === 4) return 1.08
  return 1.12  // G+5
}

export function runCalculation(input: StructoInput): StructoResult {
  const { state, numFloors, groundFloorAreaSqft, siteCondition, concreteGrade, steelGrade } = input

  // Seismic zone
  const szInfo = seismicZoneFromState(state)
  const seismicZone = szInfo.zone
  const zFactor = szInfo.zFactor

  // Exposure class + foundation
  const exposureClass = exposureFromSiteCondition(siteCondition)
  const foundationRecommendation = foundationFromSiteCondition(siteCondition, numFloors)

  // Total BUA
  const totalFloors = numFloors + 1   // G = 1 floor, G+1 = 2 floors, …
  const totalBUA = (input.perFloorAreas && input.perFloorAreas.length > 0)
    ? input.perFloorAreas.reduce((sum, a) => sum + (a || 0), 0)
    : groundFloorAreaSqft * totalFloors
  const ff = floorFactor(numFloors)
  const gradeFactor = GRADE_COST_FACTOR[concreteGrade]

  // Material quantities (superstructure)
  const cementBags      = Math.round(totalBUA * IS_THUMB.CEMENT_BAGS_PER_SQFT * ff * gradeFactor)
  const steelKg         = Math.round(totalBUA * IS_THUMB.STEEL_KG_PER_SQFT * ff)
  const aggregateCft    = Math.round(totalBUA * IS_THUMB.AGGREGATE_CFT_PER_SQFT * ff)
  const sandCft         = Math.round(totalBUA * IS_THUMB.SAND_CFT_PER_SQFT * ff)
  const bindingWireKg   = Math.round(steelKg * (IS_THUMB.BINDING_WIRE_KG_PER_TONNE / 1000))
  // Admixture: 1.5× binding wire quantity in litres (plasticizer per HTML source formula)
  const admixtureLitres = Math.round(steelKg * 0.018 * 10) / 10
  const formworkSqft    = Math.round(totalBUA * 0.5)  // ~0.5 sqft contact area per sqft BUA

  const quantities: MaterialQuantities = {
    cementBags, steelKg, aggregateCft, sandCft, bindingWireKg, admixtureLitres, formworkSqft,
  }

  // Material costs
  const r = DEFAULT_RATES
  const cementCost      = cementBags     * r.cement
  const steelCost       = steelKg        * r.steel
  const aggregateCost   = aggregateCft   * r.aggregate
  const sandCost        = sandCft        * r.sand
  const bindingWireCost = bindingWireKg  * r.bindingWire
  const admixtureCost   = admixtureLitres * r.admixture
  const formworkCost    = formworkSqft   * r.formworkPerSqftBUA

  const fndAvgPerSqft  = (foundationRecommendation.minCostPerSqft + foundationRecommendation.maxCostPerSqft) / 2
  const foundationCost = Math.round(groundFloorAreaSqft * fndAvgPerSqft)

  // 7% field wastage on superstructure materials before adding foundation
  const materialSubtotal  = cementCost + steelCost + aggregateCost + sandCost + bindingWireCost + admixtureCost + formworkCost
  const materialWithWaste = Math.round(materialSubtotal * 1.07)
  const totalMaterialCost = materialWithWaste + foundationCost

  const costs: MaterialCosts = {
    cement:      Math.round(cementCost),
    steel:       Math.round(steelCost),
    aggregate:   Math.round(aggregateCost),
    sand:        Math.round(sandCost),
    bindingWire: Math.round(bindingWireCost),
    admixture:   Math.round(admixtureCost),
    formwork:    Math.round(formworkCost),
    foundation:  foundationCost,
    total:       Math.round(totalMaterialCost),
  }

  // Grand total range (Basic / Standard / Premium)
  const withLabour = input.includeLabour !== false
  const labourCostBasic    = withLabour ? Math.round(totalMaterialCost * 0.15) : 0
  const labourCostStandard = withLabour ? Math.round(totalMaterialCost * 0.28) : 0
  const labourCostPremium  = withLabour ? Math.round(totalMaterialCost * 0.38) : 0
  const overheadBasic      = Math.round((totalMaterialCost + labourCostBasic)    * 0.05)
  const overheadStandard   = Math.round((totalMaterialCost + labourCostStandard) * (withLabour ? 0.05 : 0.10))
  const overheadPremium    = Math.round((totalMaterialCost + labourCostPremium)  * 0.15)

  const totalBasic    = totalMaterialCost + labourCostBasic    + overheadBasic
  const totalStandard = totalMaterialCost + labourCostStandard + overheadStandard
  const totalPremium  = totalMaterialCost + labourCostPremium  + overheadPremium

  const grandTotal = { basic: totalBasic, standard: totalStandard, premium: totalPremium }
  const perSqftCost = {
    basic:    Math.round(totalBasic    / totalBUA),
    standard: Math.round(totalStandard / totalBUA),
    premium:  Math.round(totalPremium  / totalBUA),
  }

  // IS Compliance checks
  const minRequiredGrade = exposureMinGrade(exposureClass)
  const compliance: ComplianceCheck[] = [
    {
      id: 'concrete_grade',
      clause: 'IS 456:2000 Cl 6.1 + Table 5',
      description: 'Concrete grade vs exposure class',
      status: isGradeAdequate(concreteGrade, minRequiredGrade) ? 'pass' : 'fail',
      detail: isGradeAdequate(concreteGrade, minRequiredGrade)
        ? `${concreteGrade} meets minimum ${minRequiredGrade} for ${exposureClass} exposure.`
        : `${exposureClass.replace('_', ' ')} exposure requires minimum ${minRequiredGrade}. Selected ${concreteGrade} is insufficient.`,
    },
    {
      id: 'steel_grade',
      clause: 'IS 13920:2016 Cl 5.3',
      description: 'Steel grade for seismic zone',
      status: (seismicZone === 'III' || seismicZone === 'IV' || seismicZone === 'V')
        ? (steelGrade === 'Fe500D' || steelGrade === 'Fe550D' ? 'pass' : 'fail')
        : 'pass',
      detail: (seismicZone === 'III' || seismicZone === 'IV' || seismicZone === 'V')
        ? (steelGrade === 'Fe500D' || steelGrade === 'Fe550D'
          ? `${steelGrade} meets ductility requirement for Zone ${seismicZone}.`
          : `Zone ${seismicZone} mandates Fe500D or Fe550D for higher ductility. ${steelGrade} is not permitted.`)
        : `Zone ${seismicZone} — ${steelGrade} acceptable. Fe500D recommended for additional safety.`,
    },
    {
      id: 'foundation_depth',
      clause: 'IS 1904:2016 Cl 4.1',
      description: 'Minimum foundation depth',
      status: 'advisory',
      detail: 'Minimum foundation depth 500mm from natural ground level mandatory. Verify with actual soil investigation.',
    },
    {
      id: 'foundation_type',
      clause: 'IS 1904:2016',
      description: 'Foundation suitability for soil',
      status: siteCondition === 'flat' || siteCondition === 'rocky' ? 'pass' : 'advisory',
      detail: foundationRecommendation.warning
        ?? `${foundationRecommendation.label} recommended for ${siteCondition.replace(/_/g, ' ')} site conditions.`,
    },
    {
      id: 'seismic_band',
      clause: 'IS 4326:1993 Cl 8.4',
      description: 'Seismic band reinforcement',
      status: (seismicZone === 'III' || seismicZone === 'IV' || seismicZone === 'V') ? 'advisory' : 'pass',
      detail: (seismicZone === 'III' || seismicZone === 'IV' || seismicZone === 'V')
        ? `Zone ${seismicZone}: Plinth + Sill + Lintel + Roof bands mandatory. 75mm × full wall width, 2×8mm bars + 6mm stirrups @150mm.`
        : `Zone ${seismicZone}: Seismic bands recommended as good practice but not mandatory.`,
    },
    {
      id: 'cover',
      clause: 'IS 456:2000 Cl 26.4',
      description: 'Nominal concrete cover',
      status: 'advisory',
      detail: `Footing: 50mm · Column: 40mm · Beam: 25–40mm · Slab: 20–30mm. Verify contractor cover blocks are placed correctly.`,
    },
  ]

  // Grade comparison (cost per sqft for 4 concrete grades)
  const gradeSummary: { grade: ConcreteGrade; costPerSqft: number; label: string }[] = [
    { grade: 'M20', costPerSqft: Math.round(perSqftCost.standard * 1.00), label: 'Min for mild exposure' },
    { grade: 'M25', costPerSqft: Math.round(perSqftCost.standard * 1.12), label: 'Min for moderate exposure' },
    { grade: 'M30', costPerSqft: Math.round(perSqftCost.standard * 1.22), label: 'Min for severe exposure' },
    { grade: 'M35', costPerSqft: Math.round(perSqftCost.standard * 1.32), label: 'Coastal / very severe' },
  ]

  const technicalReminders: string[] = [
    'IS 456:2000 Cl 13.5 — Cure all RCC members minimum 7 days with wet hessian or water ponding.',
    'IS 269:2015 — Use only ISI-marked OPC 43 or 53 cement. Verify BIS logo on every bag.',
    'IS 456:2000 Cl 9.1 — Do not add excess water to concrete. W/C ratio directly determines strength.',
    'IS 1786:2008 — All steel bars must be free of loose rust, mud, paint, or oil before tying.',
    'IS 456:2000 Cl 14 — Shuttering must be rigid, leak-proof, and well-oiled. Remove only after specified curing period.',
    'IS 456:2000 Cl 13.2 — Vibrate concrete within 5 minutes of placing. Over-vibration causes segregation.',
    'IS 456:2000 Cl 26.2.5 — Column bars lap length: minimum 50× bar diameter. Verify in contractor bar bending schedule.',
    'IS 13920:2016 Cl 6.3 — Column tie spacing at hinge zones: d/4 or 100mm whichever is less.',
    'IS 516:1959 — Cast 3 cube specimens (150mm) per pour. Test at 7 and 28 days. Reject batch if 28-day result <0.85× specified strength.',
    'IS 1904:2016 Cl 4.1 — Get geotechnical investigation done before excavation. Bearing capacity varies plot to plot.',
  ]

  return {
    seismicZone,
    zFactor,
    exposureClass,
    foundationRecommendation,
    compliance,
    grandTotal,
    perSqftCost,
    totalBUA,
    technicalReminders,
    gradeSummary,
    quantities,
    costs,
    labourCost:   withLabour ? Math.round(labourCostStandard) : 0,
    overheadCost: Math.round(overheadStandard),
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
