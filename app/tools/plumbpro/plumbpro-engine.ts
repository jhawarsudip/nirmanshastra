// PlumbPro calculation engine
// IS 1172:1993 + IS 1742:1983 + IS 15328:2003
// Build Reference Section 8 — LOCKED values. Do not alter.

// ─── IS CODE VALUES (SECTION 8 — LOCKED) ─────────────────────────────────────

// Water demand — IS 1172:1993 (LOCKED)
export const WATER_DEMAND_LPCD = {
  municipal: 135,
  borewell:  150,
} as const

// Tank sizing — IS 1172:1993 (LOCKED)
const TANK_RATIO = 0.67

// Pipe sizes — IS 1742:1983 (LOCKED)
export const PIPE_SIZES = {
  soilStack: { diameter: 110, material: 'SWR', use: 'WC soil stack' },
  waste:     { diameter: 75,  material: 'SWR', use: 'Bath/kitchen waste' },
  supplyMin: { diameter: 25,  material: 'CPVC', use: 'Cold supply minimum' },
  supplyMain:{ diameter: 32,  material: 'CPVC', use: 'Main supply riser' },
}

// Slopes — IS 1742:1983 (LOCKED)
export const DRAINAGE_SLOPES = {
  waste75:    { ratio: '1:48', percent: 2.0,   size: '75mm SWR' },
  soilStack110: { ratio: '1:80', percent: 1.25, size: '110mm SWR' },
}

// ─── MATERIAL RATES (Pune 2026 average) ───────────────────────────────────────

export const MATERIAL_RATES = {
  cpvc_25:    120,   // ₹/metre  Astral/Supreme
  cpvc_32:    180,   // ₹/metre
  cpvc_40:    250,   // ₹/metre  main riser larger buildings
  swr_75:      95,   // ₹/metre  SWR waste pipe
  swr_110:    145,   // ₹/metre  SWR soil stack
  upvc_110:   160,   // ₹/metre  uPVC underground drain
  fittings_pct: 0.35, // 35% of pipe cost (elbows, tees, couplers)
  pTrap100:   280,   // ₹/piece  P-trap 100mm
  floorTrap:  180,   // ₹/piece  floor trap 100mm
  ballValve25: 185,  // ₹/piece  25mm ball valve
  gateValve40: 450,  // ₹/piece  40mm gate valve main
  waterMeter:  1200, // ₹/piece  water meter
  prv:         1800, // ₹/piece  pressure reducing valve
  sumpTankPerL: 0.8, // ₹/litre  HDPE food-grade IS 12701
  ohtPerL:    0.85,  // ₹/litre  HDPE overhead tank IS 12701
  pumpHalfHP: 6500,  // ₹/piece  0.5 HP pump
  pump075HP:  8000,  // ₹/piece  0.75 HP pump
  pump1HP:    9500,  // ₹/piece  1 HP submersible/centrifugal
  pump1_5HP:  13500, // ₹/piece  1.5 HP
  pump2HP:    17500, // ₹/piece  2 HP
}

// CPWD labour rates — Section 16 (LOCKED)
const LABOUR = {
  plumber:       { workers: 2, ratePerDay: 1100, jointsPerDay: 7 },   // 6–8 CPVC joints/day
  helper:        { workers: 2, ratePerDay: 600                     },   // ratio
  sanitaryFitter:{ workers: 1, ratePerDay: 1000, fixturesPerDay: 3.5 }, // 3–4 fixtures/day
  excavation:    { workers: 1, ratePerDay: 750,  metresPerDay: 5   },
  tankInstall:   { workers: 1, ratePerDay: 2000, active: false      }, // inactive
  pumpInstall:   { workers: 1, ratePerDay: 1500, active: false      }, // inactive
  testing:       { workers: 1, ratePerDay: 1000                     }, // flush test per day
  nightWatchman: { workers: 1, ratePerDay: 500                      },
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

export interface ComplianceCheck {
  id:          string
  clause:      string
  description: string
  status:      'pass' | 'advisory' | 'fail'
  detail:      string
}

export interface WaterDemand {
  occupants:        number
  lpcd:             number
  dailyDemandL:     number
  totalTankL:       number
  ohtL:             number
  sumpL:            number
  ohtM3:            number
  sumpM3:           number
  pumpHP:           number
  pumpHPStandard:   string
  pumpFlowLPH:      number
  staticHeadM:      number
}

export interface PipeSchedule {
  cpvc25m:    number
  cpvc32m:    number
  swr75m:     number
  swr110m:    number
  upvc110m:   number
}

export interface FixtureSchedule {
  ewcPan:     number
  washBasin:  number
  kitchenSink:number
  showerSet:  number
  bibTap:     number
  pillarTap:  number
  floorTrap:  number
  pTrap:      number
  totalFixtures: number
}

export interface PlumbCosts {
  cpvcPipeMaterial:   number
  swrPipeMaterial:    number
  upvcPipeMaterial:   number
  fittingsMaterial:   number
  valvesMaterial:     number
  tanksMaterial:      number
  pumpMaterial:       number
  totalMaterial:      number
}

export interface PlumbInput {
  state:          string
  city:           string
  numBedrooms:    number
  numBathrooms:   number
  numFloors:      number
  buaPerFloorSqft:number
  waterSource:    'municipal' | 'borewell'
  includeSump:    boolean
  contractorQuote?: number
  includeLabour?:   boolean
}

export interface PlumbResult {
  // Free — always visible
  waterDemand:    WaterDemand
  compliance:     ComplianceCheck[]
  grandTotal:     { basic: number; standard: number; premium: number }
  perSqftCost:    { basic: number; standard: number; premium: number }
  totalBuaSqft:   number
  technicalReminders: string[]
  phaseContext: {
    percentOfTotal:    string
    exampleAmount:     string
    overchargingRisks: string[]
  }

  // Paid — blurred until payment
  pipeSchedule:   PipeSchedule
  fixtureSchedule:FixtureSchedule
  costs:          PlumbCosts
  labourCost:     number
  overheadCost:   number
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

export function calcWaterDemand(input: PlumbInput): WaterDemand {
  const occupants      = Math.max(2, input.numBathrooms * 2 + 2)
  const lpcd           = WATER_DEMAND_LPCD[input.waterSource]
  const dailyDemandL   = occupants * lpcd
  const totalTankL     = Math.round(dailyDemandL * TANK_RATIO)
  const ohtL           = totalTankL  // full 2/3 daily demand = OHT size per IS 1172:1993
  const sumpL          = input.includeSump ? totalTankL : 0

  // Pump HP — IS 1172:1993 sizing (fill OHT in 30 minutes)
  const pumpFlowLPH  = ohtL * 2                             // L/h needed to fill in 30 min
  const staticHeadM  = input.numFloors * 3.5 + 6            // floor height 3.5m + 6m friction
  // HP = Q(L/s) × H(m) × 9.81 / (efficiency 0.70 × 746 W per electrical HP)
  const rawHP = (pumpFlowLPH / 3600) * staticHeadM * 9.81 / (0.7 * 746)

  let pumpHP: number
  let pumpHPStandard: string
  if (rawHP <= 0.5)       { pumpHP = 0.5;  pumpHPStandard = '0.5 HP'  }
  else if (rawHP <= 0.75) { pumpHP = 0.75; pumpHPStandard = '0.75 HP' }
  else if (rawHP <= 1.0)  { pumpHP = 1.0;  pumpHPStandard = '1 HP'    }
  else if (rawHP <= 1.5)  { pumpHP = 1.5;  pumpHPStandard = '1.5 HP'  }
  else                    { pumpHP = 2.0;  pumpHPStandard = '2 HP'    }

  return {
    occupants, lpcd, dailyDemandL, totalTankL, ohtL, sumpL,
    ohtM3:   parseFloat((ohtL / 1000).toFixed(2)),
    sumpM3:  parseFloat((sumpL / 1000).toFixed(2)),
    pumpHP, pumpHPStandard, pumpFlowLPH, staticHeadM,
  }
}

// ─── MAIN CALCULATION ─────────────────────────────────────────────────────────

export function runCalculation(input: PlumbInput): PlumbResult {
  const { numBathrooms, numFloors, buaPerFloorSqft } = input
  const totalBuaSqft = buaPerFloorSqft * numFloors
  const waterDemand  = calcWaterDemand(input)

  // ── Pipe schedule (PAID — blurred) ────────────────────────────────────────
  // IS 1742:1983: 110mm SWR soil stack, 75mm SWR waste
  // CPVC 25mm branches, 32mm riser
  const cpvc25m  = Math.round(numBathrooms * 8 + 6 + 4)        // bathrooms + kitchen + common
  const cpvc32m  = Math.round(numFloors * 4 + 3)               // riser + roof connection
  const swr75m   = Math.round(numBathrooms * 4 + numFloors * 3) // 4m/bath waste + kitchen per IS 1742
  const swr110m  = Math.round(numBathrooms * 4 + numFloors * 3.5 + 2) // WC branches + riser per IS 1742
  const upvc110m = 12                                           // underground drain connection

  const pipeSchedule: PipeSchedule = { cpvc25m, cpvc32m, swr75m, swr110m, upvc110m }

  // ── Fixture schedule (PAID) ────────────────────────────────────────────────
  const ewcPan      = numBathrooms
  const washBasin   = numBathrooms
  const kitchenSink = 1
  const showerSet   = numBathrooms
  const bibTap      = numBathrooms * 2
  const pillarTap   = 2   // kitchen + utility
  const floorTrap   = numBathrooms
  const pTrap       = numBathrooms
  const totalFixtures = ewcPan + washBasin + kitchenSink + showerSet + bibTap + pillarTap + floorTrap

  const fixtureSchedule: FixtureSchedule = {
    ewcPan, washBasin, kitchenSink, showerSet, bibTap, pillarTap, floorTrap, pTrap, totalFixtures,
  }

  // ── Material costs ────────────────────────────────────────────────────────
  const cpvcPipeRaw    = cpvc25m * MATERIAL_RATES.cpvc_25 + cpvc32m * MATERIAL_RATES.cpvc_32
  const swrPipeRaw     = swr75m * MATERIAL_RATES.swr_75 + swr110m * MATERIAL_RATES.swr_110
  const upvcPipeRaw    = upvc110m * MATERIAL_RATES.upvc_110
  const pipeTotalRaw   = cpvcPipeRaw + swrPipeRaw + upvcPipeRaw
  const fittingsMaterial = Math.round(pipeTotalRaw * MATERIAL_RATES.fittings_pct)

  const cpvcPipeMaterial = Math.round(cpvcPipeRaw)
  const swrPipeMaterial  = Math.round(swrPipeRaw)
  const upvcPipeMaterial = Math.round(upvcPipeRaw)

  // Valves
  const valvesMaterial = Math.round(
    numBathrooms * MATERIAL_RATES.ballValve25 * 2 +   // 2 per bathroom (inlet + branch)
    3 * MATERIAL_RATES.gateValve40 +                   // mains + sump + OHT
    MATERIAL_RATES.waterMeter +
    (numFloors > 2 ? MATERIAL_RATES.prv : 0) +         // PRV if high-rise
    pTrap * MATERIAL_RATES.pTrap100 +
    floorTrap * MATERIAL_RATES.floorTrap
  )

  // Tanks
  const ohtCost   = Math.round(waterDemand.ohtL * MATERIAL_RATES.ohtPerL)
  const sumpCost  = input.includeSump ? Math.round(waterDemand.sumpL * MATERIAL_RATES.sumpTankPerL) : 0
  const tanksMaterial = ohtCost + sumpCost

  // Pump
  const pumpRate = waterDemand.pumpHP <= 0.5  ? MATERIAL_RATES.pumpHalfHP :
                   waterDemand.pumpHP <= 0.75 ? MATERIAL_RATES.pump075HP  :
                   waterDemand.pumpHP <= 1.0  ? MATERIAL_RATES.pump1HP    :
                   waterDemand.pumpHP <= 1.5  ? MATERIAL_RATES.pump1_5HP  :
                   MATERIAL_RATES.pump2HP
  const pumpMaterial = pumpRate

  const totalMaterial = cpvcPipeMaterial + swrPipeMaterial + upvcPipeMaterial +
                        fittingsMaterial + valvesMaterial + tanksMaterial + pumpMaterial

  const costs: PlumbCosts = {
    cpvcPipeMaterial, swrPipeMaterial, upvcPipeMaterial,
    fittingsMaterial, valvesMaterial, tanksMaterial, pumpMaterial,
    totalMaterial,
  }

  // ── Labour (CPWD — Section 16) ─────────────────────────────────────────────
  const totalJoints     = numBathrooms * 15 + 8   // CPVC joints estimate
  const plumberDays     = totalJoints / LABOUR.plumber.jointsPerDay
  const plumberCost     = plumberDays * LABOUR.plumber.workers * LABOUR.plumber.ratePerDay
  const helperCost      = plumberDays * LABOUR.helper.workers * LABOUR.helper.ratePerDay
  const fitterDays      = Math.ceil(totalFixtures / LABOUR.sanitaryFitter.fixturesPerDay)
  const fitterCost      = fitterDays * LABOUR.sanitaryFitter.ratePerDay
  const excavDays       = Math.ceil(upvc110m / LABOUR.excavation.metresPerDay)
  const excavCost       = excavDays * LABOUR.excavation.ratePerDay
  const testingCost     = LABOUR.testing.ratePerDay   // 1 day flush test
  const watchmanCost    = Math.ceil(plumberDays) * LABOUR.nightWatchman.ratePerDay

  const labourCost = Math.round(
    plumberCost + helperCost + fitterCost + excavCost + testingCost + watchmanCost
  )

  // ── Grand total ranges ────────────────────────────────────────────────────
  const overheadBasic    = Math.round((totalMaterial + labourCost * 0.85) * 0.05)
  const overheadStandard = Math.round((totalMaterial + labourCost)        * 0.10)
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
      id: 'water_demand',
      clause: 'IS 1172:1993 Cl 5',
      description: 'Water demand per capita',
      status: 'pass',
      detail: `${input.waterSource === 'municipal' ? 'Municipal' : 'Borewell'} supply: ${waterDemand.lpcd} LPCD × ${waterDemand.occupants} occupants = ${waterDemand.dailyDemandL.toLocaleString('en-IN')} L/day. IS 1172:1993 residential minimum: 135 LPCD.`,
    },
    {
      id: 'tank_size',
      clause: 'IS 1172:1993 Cl 6',
      description: 'Overhead tank capacity',
      status: waterDemand.ohtM3 >= 0.5 ? 'pass' : 'advisory',
      detail: `Required OHT: ${waterDemand.ohtL.toLocaleString('en-IN')} litres (${waterDemand.ohtM3} m³). IS 1172:1993: Total storage = daily demand × 0.67. OHT must be food-grade HDPE, covered, and insect-proof per IS 12701.`,
    },
    {
      id: 'soil_stack',
      clause: 'IS 1742:1983 Cl 6.1',
      description: '110mm SWR soil stack for WC',
      status: 'pass',
      detail: `Soil stack: ${swr110m}m of 110mm SWR at slope 1:80 (1.25%). IS 1742:1983: WC discharge must use 110mm minimum diameter. Slope 1:80 mandatory to prevent siphoning and trap failure.`,
    },
    {
      id: 'waste_slope',
      clause: 'IS 1742:1983 Cl 7.3',
      description: '75mm waste pipe slope minimum 1:48',
      status: 'pass',
      detail: `Waste pipes: ${swr75m}m of 75mm SWR at slope 1:48 (2%). IS 1742:1983 Cl 7.3: 75mm waste pipes must maintain minimum 1:48 slope. Flatter slopes cause blockage from sediment accumulation.`,
    },
    {
      id: 'anti_siphon',
      clause: 'IS 1742:1983 Cl 8',
      description: 'Anti-siphon traps on all fixtures',
      status: 'advisory',
      detail: `${totalFixtures} fixtures require P-traps/bottle traps. IS 1742:1983: Anti-siphon traps mandatory on all sanitary fixtures. Trap seal must be minimum 50mm. Floor traps must include a grating.`,
    },
    {
      id: 'cleanout',
      clause: 'IS 1742:1983 Cl 10',
      description: 'Cleanout access every 3m on soil stack',
      status: 'advisory',
      detail: `For ${numFloors}-floor building, ${Math.ceil(numFloors * 3.5 / 3)} cleanout access points required on soil stack. IS 1742:1983 Cl 10: Cleanout access must be provided at every 3m interval and at every change of direction.`,
    },
    {
      id: 'tank_material',
      clause: 'IS 12701',
      description: 'Food-grade HDPE tank mandatory',
      status: 'advisory',
      detail: `All water storage tanks must be manufactured per IS 12701 — food-grade HDPE, UV-stabilised, covered, and insect-proof. GI tanks corrode within 5–7 years in urban water. Never use open-top tanks.`,
    },
    {
      id: 'licensed_plumber',
      clause: 'NBC 2016 Part 9 Cl 3',
      description: 'Licensed plumber mandatory',
      status: 'advisory',
      detail: 'NBC 2016 Part 9: All plumbing work must be executed by a licensed plumber. Verify plumber holds a valid license issued by local municipal authority. Unlicensed plumbing work is a safety defect.',
    },
  ]

  // ── Technical reminders ───────────────────────────────────────────────────
  const technicalReminders: string[] = [
    'IS 1172:1993 Cl 6 — Never undersize the OHT. Tank undersizing causes dry taps, pump burnout, and pressure problems. Verify contractor\'s proposed tank matches IS calculation.',
    'IS 1742:1983 Cl 7.3 — 75mm waste pipe must slope at minimum 1:48 (2%). Flatter slopes accumulate grease and cause blockages within 2 years. Demand slope verification before backfill.',
    'IS 1742:1983 Cl 6.1 — 110mm SWR soil stack slope 1:80 (1.25%). Steeper slopes cause self-siphoning of traps. This is the most common error in residential plumbing.',
    'IS 12701 — All tanks must be food-grade HDPE, covered, and insect-proof. Open-top tanks breed mosquitoes and contaminate water. This is a municipal bylaw requirement in most states.',
    'IS 1742:1983 Cl 10 — Cleanout access every 3m on soil stack is mandatory. Contractors often omit cleanouts to save cost — this makes future blockage clearance impossible without breaking walls.',
    'CPVC pipe only — Never use GI (galvanised iron) for new construction. GI corrodes within 10 years in most Indian water conditions, causing red-water contamination and pipe bursting.',
    'Anti-siphon traps mandatory on all fixtures (IS 1742:1983 Cl 8). P-trap seal minimum 50mm. Dry traps allow sewer gases (H₂S) into living areas — a serious health hazard.',
    'Hydraulic pressure test at 1.5× working pressure for 1 hour before closing walls or backfilling. A 10-minute test is insufficient — leaks only manifest under sustained pressure.',
    'All metallic pipe flanges, brackets, and clamps must be earthed per IS 3043:2018 to prevent galvanic corrosion and electrical hazard from pipe-borne current.',
    'Use solvent cement on both surfaces for all CPVC joints. Hold minimum 30 seconds. Never dry-fit and hope it holds — solvent cement joint strength peaks at 48 hours and requires both surfaces coated.',
  ]

  // ── Phase context ─────────────────────────────────────────────────────────
  const phaseContext = {
    percentOfTotal: '6–10%',
    exampleAmount: '₹1.5–2.5 Lakhs on a ₹25 Lakh total project',
    overchargingRisks: [
      'Upsized pipe diameters — billing 32mm CPVC where 25mm is IS minimum for branch lines',
      'Unnecessary motor HP — 1.5 HP where 1 HP suffices for the calculated demand',
      'CPVC vs uPVC substitution — quoting CPVC but installing cheaper uPVC for hot water lines',
      'Billing for fixtures owner supplies separately (WC pans, wash basins, kitchen sink)',
      'Inflated pipe lengths — billing 30% more metres than actually laid',
    ],
  }

  return {
    waterDemand,
    compliance,
    grandTotal,
    perSqftCost,
    totalBuaSqft,
    technicalReminders,
    phaseContext,
    pipeSchedule,
    fixtureSchedule,
    costs,
    labourCost,
    overheadCost: overheadStandard,
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
