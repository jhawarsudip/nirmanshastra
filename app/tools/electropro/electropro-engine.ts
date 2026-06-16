// ElectroPro calculation engine
// IS 732:2019 + IS 3043:2018 + IS 694:2010 + IS 8828:2007
// Build Reference Section 8 — LOCKED values. Do not alter.

// ─── IS CODE VALUES (SECTION 8 — LOCKED) ─────────────────────────────────────

// Circuit maximums — IS 732:2019
const MAX_LIGHTING_CIRCUIT_W = 800
const MAX_POWER_CIRCUIT_W   = 3000

// Wire sizes — IS 732:2019 (minimum cross-sections)
export const WIRE_SIZES = {
  lighting:    { sqmm: 1.5,  label: '1.5 sqmm',  use: 'Lighting & fans',     isCode: 'IS 732:2019 Cl 6.2' },
  power:       { sqmm: 2.5,  label: '2.5 sqmm',  use: 'Power sockets',       isCode: 'IS 732:2019 Cl 6.2' },
  acGeyser:    { sqmm: 4.0,  label: '4.0 sqmm',  use: 'AC / Geyser (2kW+)', isCode: 'IS 732:2019 Cl 6.2' },
  subPanel:    { sqmm: 6.0,  label: '6.0 sqmm',  use: 'Sub-panel feeds',     isCode: 'IS 732:2019 Cl 6.2' },
  mainIncomer: { sqmm: 10.0, label: '10.0 sqmm', use: 'Main incomer',        isCode: 'IS 732:2019 Cl 6.2' },
}

// Wastage factor — IS 732:2019
const WIRE_WASTAGE = 1.15

// Earthing — IS 3043:2018
const EARTHING_MAX_RESISTANCE_OHM = 1.0
const RCCB_RATING_BATHROOM_MA     = 30  // mandatory for bathrooms

// ─── MATERIAL RATES (Pune 2026 average) ───────────────────────────────────────

export const MATERIAL_RATES = {
  wire_1_5:     22,   // ₹/metre  (Finolex/Havells)
  wire_2_5:     35,   // ₹/metre
  wire_4_0:     55,   // ₹/metre
  wire_6_0:     85,   // ₹/metre
  wire_10_0:    140,  // ₹/metre
  conduit_16mm: 25,   // ₹/metre  16mm PVC conduit (kept for reference)
  conduit_25mm: 38,   // ₹/metre  25mm PVC conduit (lighting + power)
  conduit_32mm: 52,   // ₹/metre  32mm PVC conduit (heavy circuits)
  mcb_6A:       120,  // ₹/piece
  mcb_16A:      165,  // ₹/piece
  mcb_20A:      165,  // ₹/piece
  mcb_32A:      220,  // ₹/piece
  mcb_63A:      380,  // ₹/piece
  rccb_25A:     1200, // ₹/piece
  rccb_40A:     1500, // ₹/piece
  db_8way:      1200, // ₹/panel (includes busbars)
  db_12way:     1800, // ₹/panel
  db_16way:     2200, // ₹/panel
  db_20way:     2500, // ₹/panel
  db_24way:     2800, // ₹/panel
  db_36way:     3800, // ₹/panel
  earthingKit:  3500, // ₹/pit  (pipe earth, 2.5m × 40mm GI)
  switchSocket: 280,  // ₹/box  (standard modular plate)
  backBox:      85,   // ₹/box  (MS concealed box)
  fittings:     0.20, // 20% of conduit cost (bends, couplers, boxes)
}

// CPWD labour rates — Section 15 LOCKED
const LABOUR = {
  electrician:   { workers: 2, ratePerDay: 1200, pointsPerDay: 9  }, // 8–10 points/day
  wireman:       { workers: 2, ratePerDay: 750,  pointsPerDay: 9  }, // ratio
  conduitFixer:  { workers: 1, ratePerDay: 700,  rftPerDay: 50    },
  dbInstaller:   { workers: 1, ratePerDay: 1500, panelsPerDay: 1  },
  helper:        { workers: 2, ratePerDay: 560,  rftPerDay: null  },
  earthing:      { workers: 1, ratePerDay: 1100, active: false     }, // inactive
  testing:       { workers: 1, ratePerDay: 1400, perDay: 1        },
  nightWatchman: { workers: 1, ratePerDay: 500,  perDay: 1        },
}

// Seismic zone map (reused from masonpro-engine pattern)
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

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ComplianceCheck {
  id:          string
  clause:      string
  description: string
  status:      'pass' | 'advisory' | 'fail'
  detail:      string
}

export interface DBCircuit {
  label:      string
  ways:       number
  mcbRating:  string
  wireSize:   string
  isCode:     string
}

export interface DBPanelSchedule {
  mainMCBRating:   string
  rccbRequired:    boolean
  rccbRating:      string
  circuits:        DBCircuit[]
  totalWays:       number
  panelSize:       string
  panelRate:       number
}

export interface WireSchedule {
  size_1_5_m:    number
  size_2_5_m:    number
  size_4_0_m:    number
  size_6_0_m:    number
  size_10_0_m:   number
  coaxial_rg6_m: number
}

export interface PointSchedule {
  lightPoints:     number
  fanPoints:       number
  regulatorPoints: number
  powerPoints:     number
  acPoints:        number
  geyserPoints:    number
  exhaustPoints:   number
  tvPoints:        number
  callBellPoints:  number
  totalPoints:     number
}

export type ConduitType     = 'surface_pvc' | 'concealed'
export type SwitchboardType = 'modular' | 'standard'

export interface ElectroInput {
  state:            string
  city:             string
  buaPerFloorSqft:  number
  numFloors:        number
  numBathrooms:     number
  numAC:            number
  includeEarthing:  boolean
  numEarthingPits?: number
  contractorQuote?: number
  includeLabour?:   boolean
  numTVPoints?:     number
  numCallBellPoints?: number
  dbPanelPerFloor?: boolean
  conduitType?:     ConduitType
  switchboardType?: SwitchboardType
}

export interface ElectroCosts {
  wireMaterial:       number
  conduitMaterial:    number
  mcbRccbMaterial:    number
  dbPanelMaterial:    number
  fixturesMaterial:   number
  earthingMaterial:   number
  totalMaterial:      number
}

export interface ElectroResult {
  // Free — always visible
  dbPanelSchedule:  DBPanelSchedule
  compliance:       ComplianceCheck[]
  grandTotal:       { basic: number; standard: number; premium: number }
  perSqftCost:      { basic: number; standard: number; premium: number }
  totalBuaSqft:     number
  technicalReminders: string[]
  phaseContext: {
    percentOfTotal: string
    exampleAmount:  string
    overchargingRisks: string[]
  }

  // Paid — blurred until payment
  pointSchedule:  PointSchedule
  wireSchedule:   WireSchedule
  costs:          ElectroCosts
  labourCost:     number
  overheadCost:   number
  lightCircuits:  number
  powerCircuits:  number
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function seismicZoneFromState(state: string): { zone: string; zFactor: number } {
  return SEISMIC_ZONE_MAP[state] ?? { zone: 'III', zFactor: 0.16 }
}

export function formatLakhs(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`
  if (amount >= 100000)   return `₹${(amount / 100000).toFixed(1)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

// ─── MAIN CALCULATION ─────────────────────────────────────────────────────────

export function runCalculation(input: ElectroInput): ElectroResult {
  const {
    buaPerFloorSqft,
    numFloors,
    numBathrooms,
    numAC,
    includeEarthing,
    numEarthingPits = 2,
    numTVPoints,
    numCallBellPoints,
    dbPanelPerFloor = false,
    conduitType = 'concealed',
    switchboardType = 'modular',
  } = input

  const totalBuaSqft = buaPerFloorSqft * numFloors

  // ── Point schedule ────────────────────────────────────────────────────────
  // Thumb rules for residential (IS 732:2019 best practice)
  const lightPoints    = Math.ceil(totalBuaSqft / 25)   // 1 per 25 sqft
  const fanPoints      = Math.ceil(totalBuaSqft / 100)  // 1 per 100 sqft
  const regulatorPoints = fanPoints                      // 1 regulator per ceiling fan (auto)
  const powerPoints    = Math.ceil(totalBuaSqft / 20)   // 1 per 20 sqft (15A sockets)
  const acPoints       = numAC
  const geyserPoints   = numBathrooms
  // Exhaust: 1 per bathroom (auto) + kitchen (always 1) — each fan is 200mm / 6"
  const exhaustPoints  = numBathrooms + 1
  const tvPoints       = numTVPoints ?? Math.ceil(numFloors)   // default 1 per floor
  const callBellPoints = numCallBellPoints ?? 1                 // default 1 call bell
  const totalPoints    = lightPoints + fanPoints + powerPoints + acPoints + geyserPoints + exhaustPoints + tvPoints + callBellPoints

  const pointSchedule: PointSchedule = {
    lightPoints, fanPoints, regulatorPoints, powerPoints, acPoints,
    geyserPoints, exhaustPoints, tvPoints, callBellPoints, totalPoints,
  }

  // Conduit cost multiplier: concealed adds ~20% material (chasing walls vs surface clip)
  const conduitMultiplier = conduitType === 'concealed' ? 1.2 : 1.0
  // Switchboard type: modular boards cost more but cleaner installation
  const switchboardRate = switchboardType === 'modular' ? MATERIAL_RATES.switchSocket : MATERIAL_RATES.switchSocket * 0.7

  // ── Load calculation ──────────────────────────────────────────────────────
  const lightLoad   = (lightPoints + exhaustPoints) * 40   // 40W avg per light point per room specs
  const fanLoad     = fanPoints * 75                        // 75W per fan
  const powerLoad   = powerPoints * 250                     // 250W effective per socket
  const acLoad      = acPoints * 1500                       // 1500W per ton AC
  const geyserLoad  = geyserPoints * 2000                   // 2000W per geyser

  // ── Circuit count (IS 732:2019 circuit maximums — LOCKED) ─────────────────
  const lightCircuits  = Math.ceil((lightLoad + fanLoad) / MAX_LIGHTING_CIRCUIT_W)
  const powerCircuits  = Math.ceil(powerLoad / MAX_POWER_CIRCUIT_W)
  const acCircuits     = acPoints      // each AC gets dedicated circuit
  const geyserCircuits = geyserPoints  // each geyser dedicated
  const totalCircuits  = lightCircuits + powerCircuits + acCircuits + geyserCircuits

  // ── DB Panel schedule (FREE — visible without payment) ────────────────────
  // RCCB mandatory for bathrooms per IS 3043:2018
  const rccbRequired = numBathrooms > 0

  const circuits: DBCircuit[] = [
    {
      label:     `Lighting (${lightCircuits} circuits × max ${MAX_LIGHTING_CIRCUIT_W}W)`,
      ways:      lightCircuits,
      mcbRating: '6A',
      wireSize:  '1.5 sqmm',
      isCode:    'IS 732:2019 Cl 6.2',
    },
    {
      label:     `Power Sockets (${powerCircuits} circuits × max ${MAX_POWER_CIRCUIT_W}W)`,
      ways:      powerCircuits,
      mcbRating: '16A',
      wireSize:  '2.5 sqmm',
      isCode:    'IS 732:2019 Cl 6.2',
    },
    ...(acPoints > 0 ? [{
      label:     `AC Units (${acPoints} dedicated circuits)`,
      ways:      acPoints,
      mcbRating: '20A',
      wireSize:  '4.0 sqmm',
      isCode:    'IS 732:2019 Cl 6.2',
    }] : []),
    ...(geyserPoints > 0 ? [{
      label:     `Geysers (${geyserPoints} dedicated circuits)`,
      ways:      geyserPoints,
      mcbRating: '20A',
      wireSize:  '4.0 sqmm',
      isCode:    'IS 732:2019 Cl 6.2',
    }] : []),
  ]

  // 25% spare capacity — IS 8828:2007 best practice (per HTML source)
  const totalWaysWithSpares = Math.ceil(totalCircuits * 1.25)
  const panelSize =
    totalWaysWithSpares <= 8  ? '8-way'  :
    totalWaysWithSpares <= 12 ? '12-way' :
    totalWaysWithSpares <= 16 ? '16-way' :
    totalWaysWithSpares <= 20 ? '20-way' :
    totalWaysWithSpares <= 24 ? '24-way' : '36-way'
  const panelRate =
    panelSize === '8-way'  ? MATERIAL_RATES.db_8way  :
    panelSize === '12-way' ? MATERIAL_RATES.db_12way :
    panelSize === '16-way' ? MATERIAL_RATES.db_16way :
    panelSize === '20-way' ? MATERIAL_RATES.db_20way :
    panelSize === '24-way' ? MATERIAL_RATES.db_24way : MATERIAL_RATES.db_36way

  const mainLoadW = lightLoad + fanLoad + powerLoad + acLoad + geyserLoad
  // 65% demand factor per HTML source formula before MCB sizing
  const mainCurrentA = mainLoadW * 0.65 / 230
  const mainMCBRating =
    mainCurrentA <= 32 ? '32A' :
    mainCurrentA <= 63 ? '63A' : '100A'

  const dbPanelSchedule: DBPanelSchedule = {
    mainMCBRating,
    rccbRequired,
    rccbRating: rccbRequired ? `${RCCB_RATING_BATHROOM_MA}mA 40A` : '',
    circuits,
    totalWays: totalWaysWithSpares,
    panelSize,
    panelRate,
  }

  // ── Wire schedule (PAID — blurred) ────────────────────────────────────────
  // Circuit-based wire quantities with 3 conductors (L+N+E) per HTML source formula
  const wire_1_5_m  = Math.round((lightCircuits + exhaustPoints + regulatorPoints) * 15 * 3 * WIRE_WASTAGE)
  const wire_2_5_m  = Math.round(powerCircuits  * 15 * 3 * WIRE_WASTAGE)  // power circuits × 15m × 3
  const wire_4_0_m  = Math.round((acCircuits + geyserCircuits) * 12 * 3 * WIRE_WASTAGE)  // heavy circuits × 12m × 3
  const wire_6_0_m  = Math.round(numFloors * 12 * 3 * WIRE_WASTAGE)       // sub-panel risers × 12m × 3
  // Main incomer: max(6, ceil(demand÷3000)) × 5m × 3 conductors — no wastage factor
  const wire_10_0_m = Math.round(Math.max(6, Math.ceil(mainLoadW * 0.65 / 3000)) * 5 * 3)
  // Coaxial RG6 for TV/cable points — ~15m per point with 15% wastage
  const coaxial_rg6_m = Math.round(tvPoints * 15 * WIRE_WASTAGE)

  const wireSchedule: WireSchedule = {
    size_1_5_m: wire_1_5_m,
    size_2_5_m: wire_2_5_m,
    size_4_0_m: wire_4_0_m,
    size_6_0_m: wire_6_0_m,
    size_10_0_m: wire_10_0_m,
    coaxial_rg6_m,
  }

  // ── Material costs ────────────────────────────────────────────────────────
  const wireMaterial = Math.round(
    wire_1_5_m * MATERIAL_RATES.wire_1_5 +
    wire_2_5_m * MATERIAL_RATES.wire_2_5 +
    wire_4_0_m * MATERIAL_RATES.wire_4_0 +
    wire_6_0_m * MATERIAL_RATES.wire_6_0 +
    wire_10_0_m * MATERIAL_RATES.wire_10_0
  )

  // Conduit: 25mm for light/power wires, 32mm for heavy circuits — per HTML source formula
  const conduit25m = Math.round((wire_1_5_m + wire_2_5_m) / 3.2)
  const conduit32m = Math.round((wire_4_0_m + wire_6_0_m) / 2.2)
  const conduitMaterial = Math.round((conduit25m * MATERIAL_RATES.conduit_25mm + conduit32m * MATERIAL_RATES.conduit_32mm) * conduitMultiplier)

  // MCBs + RCCB — 10% spare count on all MCBs per HTML source
  const mcbLighting = Math.round(lightCircuits  * 1.1) * MATERIAL_RATES.mcb_6A
  const mcbPower    = Math.round(powerCircuits  * 1.1) * MATERIAL_RATES.mcb_16A
  const mcbAC       = Math.round(acCircuits     * 1.1) * MATERIAL_RATES.mcb_20A
  const mcbGeyser   = Math.round(geyserCircuits * 1.1) * MATERIAL_RATES.mcb_20A
  const mainMCBCost = (mainMCBRating === '32A' ? MATERIAL_RATES.mcb_32A : MATERIAL_RATES.mcb_63A)
  const rccbCost    = rccbRequired ? MATERIAL_RATES.rccb_40A : 0
  const mcbRccbMaterial = Math.round(mcbLighting + mcbPower + mcbAC + mcbGeyser + mainMCBCost + rccbCost)

  // DB panels: one main per building (default) or one per floor
  const dbCount = dbPanelPerFloor ? numFloors : 1
  const dbPanelMaterial = panelRate * dbCount

  // Switch/socket fixtures — switchboard rate varies by modular vs standard
  const fixturesMaterial = Math.round(
    (lightPoints + fanPoints + exhaustPoints + regulatorPoints + tvPoints + callBellPoints) * MATERIAL_RATES.backBox +
    powerPoints * (switchboardRate + MATERIAL_RATES.backBox) * 0.5
  )

  // Earthing
  const earthingMaterial = includeEarthing
    ? Math.round(numEarthingPits * MATERIAL_RATES.earthingKit)
    : 0

  const totalMaterial = wireMaterial + conduitMaterial + mcbRccbMaterial + dbPanelMaterial + fixturesMaterial + earthingMaterial

  const costs: ElectroCosts = {
    wireMaterial,
    conduitMaterial,
    mcbRccbMaterial,
    dbPanelMaterial,
    fixturesMaterial,
    earthingMaterial,
    totalMaterial,
  }

  // ── Labour costs (CPWD — Section 15) ─────────────────────────────────────
  const electricianDays  = totalPoints / LABOUR.electrician.pointsPerDay
  const electricianCost  = electricianDays * LABOUR.electrician.workers * LABOUR.electrician.ratePerDay
  const wiremanCost      = electricianDays * LABOUR.wireman.workers     * LABOUR.wireman.ratePerDay
  const conduitDays      = ((conduit25m + conduit32m) * 3.281) / LABOUR.conduitFixer.rftPerDay  // convert to rft
  const conduitCost      = conduitDays * LABOUR.conduitFixer.workers * LABOUR.conduitFixer.ratePerDay
  const dbDays           = numFloors  // 1 panel/day per DB per floor
  const dbCost           = dbDays * LABOUR.dbInstaller.ratePerDay
  const helperDays       = Math.max(electricianDays, conduitDays)
  const helperCost       = helperDays * LABOUR.helper.workers * LABOUR.helper.ratePerDay
  const testingDays      = Math.ceil(numFloors * 0.5)
  const testingCost      = testingDays * LABOUR.testing.ratePerDay
  const watchmanCost     = Math.ceil(electricianDays) * LABOUR.nightWatchman.ratePerDay

  const labourCost = Math.round(
    electricianCost + wiremanCost + conduitCost + dbCost + helperCost + testingCost + watchmanCost
  )

  // ── Grand total ranges ────────────────────────────────────────────────────
  const overheadBasic    = Math.round((totalMaterial + labourCost * 0.85) * 0.05)
  const overheadStandard = Math.round((totalMaterial + labourCost)        * 0.05)
  const overheadPremium  = Math.round((totalMaterial + labourCost * 1.15) * 0.15)

  const totalBasic    = totalMaterial + Math.round(labourCost * 0.85) + overheadBasic
  const totalStandard = totalMaterial + labourCost + overheadStandard
  const totalPremium  = totalMaterial + Math.round(labourCost * 1.15) + overheadPremium

  const grandTotal  = { basic: totalBasic, standard: totalStandard, premium: totalPremium }
  const perSqftCost = {
    basic:    totalBuaSqft > 0 ? Math.round(totalBasic    / totalBuaSqft) : 0,
    standard: totalBuaSqft > 0 ? Math.round(totalStandard / totalBuaSqft) : 0,
    premium:  totalBuaSqft > 0 ? Math.round(totalPremium  / totalBuaSqft) : 0,
  }

  // ── IS Compliance panel ───────────────────────────────────────────────────
  const compliance: ComplianceCheck[] = [
    {
      id: 'lighting_circuit',
      clause: 'IS 732:2019 Cl 6.3',
      description: 'Lighting circuit load limit',
      status: lightLoad / lightCircuits <= MAX_LIGHTING_CIRCUIT_W ? 'pass' : 'fail',
      detail: `Lighting load per circuit: ${Math.round(lightLoad / lightCircuits)}W. IS 732:2019 maximum: ${MAX_LIGHTING_CIRCUIT_W}W. ${lightCircuits} lighting circuit(s) required.`,
    },
    {
      id: 'power_circuit',
      clause: 'IS 732:2019 Cl 6.3',
      description: 'Power circuit load limit',
      status: powerLoad / powerCircuits <= MAX_POWER_CIRCUIT_W ? 'pass' : 'fail',
      detail: `Power load per circuit: ${Math.round(powerLoad / powerCircuits)}W. IS 732:2019 maximum: ${MAX_POWER_CIRCUIT_W}W. ${powerCircuits} power circuit(s) required.`,
    },
    {
      id: 'wire_sizing',
      clause: 'IS 732:2019 Cl 6.2',
      description: 'Minimum wire cross-sections',
      status: 'pass',
      detail: 'Lighting: 1.5 sqmm minimum. Power: 2.5 sqmm minimum. AC/Geyser: 4.0 sqmm minimum. Sub-panel: 6.0 sqmm. Main: 10.0 sqmm. All per IS 732:2019 Table 6.',
    },
    {
      id: 'rccb_bathroom',
      clause: 'IS 3043:2018 Cl 10.4',
      description: 'RCCB for bathroom circuits',
      status: rccbRequired ? 'advisory' : 'pass',
      detail: rccbRequired
        ? `${numBathrooms} bathroom(s) detected. RCCB 30mA is MANDATORY for all bathroom circuits per IS 3043:2018. Verify contractor has included RCCB in DB schedule.`
        : 'No bathrooms declared. Ensure any bathroom circuits added later include 30mA RCCB.',
    },
    {
      id: 'earthing',
      clause: 'IS 3043:2018 Cl 7',
      description: 'Earthing continuity and resistance',
      status: includeEarthing ? 'pass' : 'advisory',
      detail: includeEarthing
        ? `Earthing specified. IS 3043:2018: Earth resistance must not exceed ${EARTHING_MAX_RESISTANCE_OHM} ohm. Test with Earth Resistance Tester before occupation. GI pipe earth: 2.5m × 40mm minimum.`
        : 'Earthing not included in this estimate. Earthing is MANDATORY per IS 3043:2018. Add separately before occupation.',
    },
    {
      id: 'licensed_contractor',
      clause: 'IS 732:2019 Cl 5',
      description: 'Licensed electrician requirement',
      status: 'advisory',
      detail: 'IS 732:2019 Cl 5.1: All electrical work must be executed by a Class B licensed electrician. Verify supervisor\'s license before starting work. Unlicensed electrical work voids insurance and violates NBC 2016.',
    },
    {
      id: 'conduit_earthing',
      clause: 'IS 732:2019 Cl 8',
      description: 'Metallic conduit earthing',
      status: 'advisory',
      detail: 'IS 732:2019 Cl 8: All metallic conduit runs must be bonded to earth. PVC conduit preferred in concealed residential work. Ensure continuity at all junction boxes.',
    },
    {
      id: 'db_spare_ways',
      clause: 'IS 8828:2007 Cl 5',
      description: 'DB panel spare capacity',
      status: totalWaysWithSpares - totalCircuits >= 2 ? 'pass' : 'advisory',
      detail: `${panelSize} DB with ${totalWaysWithSpares} ways selected. ${totalCircuits} ways used, ${totalWaysWithSpares - totalCircuits} spare. IS 8828:2007 recommends minimum 25% spare capacity for future loads.`,
    },
  ]

  // ── Technical reminders ───────────────────────────────────────────────────
  const technicalReminders: string[] = [
    'IS 732:2019 Cl 6.3 — Lighting circuit max 800W, Power circuit max 3,000W. Never overload by daisy-chaining beyond limit.',
    'IS 732:2019 Cl 6.2 — Minimum wire sizes are absolute minimums, not recommended. Upsize to next gauge for long runs > 20m.',
    'IS 3043:2018 Cl 10.4 — RCCB 30mA is MANDATORY for all bathroom circuits. Contractor omitting this is a safety defect.',
    'IS 732:2019 Cl 5.1 — Verify Class B electrician license. Ask for license copy before awarding contract. Unlicensed work voids insurance.',
    'IS 694:2010 — Use only ISI-marked wires. Counterfeit wires with thin copper core are the most common electrical fraud in residential work.',
    'IS 3043:2018 Cl 7 — Earth resistance must not exceed 1 ohm. Test with proper earth resistance tester before occupation, not a multimeter.',
    'IS 732:2019 — Conduit must be laid before plastering. Chase depth should accommodate conduit plus mortar cover. Never cut corners in chase depth.',
    'IS 8828:2007 — DB panel rating must be ≥ total connected load. Undersized DB panels cause nuisance tripping and fire risk.',
    'IS 732:2019 Cl 8 — All joints inside junction boxes only. No inline wire joints in conduit runs. Joints cause resistance and fire risk.',
    'IS 3043:2018 — Separate earth electrode for each DB. Do not share earth between phases. Get completion certificate from licensed electrician.',
  ]

  // ── Phase context ─────────────────────────────────────────────────────────
  const phaseContext = {
    percentOfTotal: '8–12%',
    exampleAmount: '₹2–3 Lakhs on a ₹25 Lakh total project',
    overchargingRisks: [
      'Oversized wires for basic lighting circuits (4.0 sqmm where 1.5 sqmm is IS minimum)',
      'Premium MCBs (branded Legrand/Schneider) where standard ISI-marked suffice',
      'Unnecessarily large DB panel with too many ways',
      'Duplicate point counting (counting junction box as a separate point)',
      'Conduit quantity inflation — billing more metres than laid',
    ],
  }

  return {
    dbPanelSchedule,
    compliance,
    grandTotal,
    perSqftCost,
    totalBuaSqft,
    technicalReminders,
    phaseContext,
    pointSchedule,
    wireSchedule,
    costs,
    labourCost,
    overheadCost: overheadStandard,
    lightCircuits,
    powerCircuits,
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
