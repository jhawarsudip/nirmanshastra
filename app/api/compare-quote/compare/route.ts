import { NextRequest, NextResponse } from 'next/server'
import type { ExtractionResult, ExtractedLineItem } from '../extract/route'
import { runCalculation as runStructo, seismicZoneFromState } from '@/app/tools/structopro/structopro-engine'
import type { StructoInput, ConcreteGrade, SteelGrade } from '@/app/tools/structopro/structopro-engine'
import { runCalculation as runMason } from '@/app/tools/masonpro/masonpro-engine'
import type { MasonInput, ExternalWallType } from '@/app/tools/masonpro/masonpro-engine'
import { runCalculation as runElectro } from '@/app/tools/electropro/electropro-engine'
import type { ElectroInput } from '@/app/tools/electropro/electropro-engine'
import { runCalculation as runPlumb } from '@/app/tools/plumbpro/plumbpro-engine'
import type { PlumbInput } from '@/app/tools/plumbpro/plumbpro-engine'
import { runCalculation as runInterior } from '@/app/tools/interiorpro/interiorpro-engine'
import type { InteriorInput } from '@/app/tools/interiorpro/interiorpro-engine'

// ─── Public types (re-exported to client) ─────────────────────────────────────

export type ComparisonScope = {
  structopro: boolean
  masonpro: boolean
  electropro: boolean
  plumbpro: boolean
  interiorpro: boolean
}

export type MatchStatus =
  | 'within_range'
  | 'contractor_higher'
  | 'contractor_lower'
  | 'unverifiable'
  | 'expected_missing'

export interface ComparisonContractorEntry {
  description: string
  totalPrice: number
  quantity:   string | null
  unit:       string | null
  unitRate:   string | null
}

export interface QuantityComparison {
  contractorQty:  number
  contractorUnit: string
  isCodeQty:      number
  isCodeUnit:     string
  diffPercent:    number
}

export interface ComparisonRow {
  id:               string
  engine:           keyof ComparisonScope
  category:         string
  categoryLabel:    string
  status:           MatchStatus
  contractorItems:  ComparisonContractorEntry[]
  contractorTotal:  number | null
  isCodeLabel:      string
  isCodeAmount:     number | null
  isCodeBasis:      string
  isCodeClause:     string
  differencePercent: number | null
  flagMessage:      string | null
  qtyComparison:    QuantityComparison | null
  inlineCaveat:     string | null
}

export interface EngineTotal {
  label:      string
  calculated: { low: number; high: number }
  isCodeBasis: string
}

export interface ComparisonResult {
  rows:          ComparisonRow[]
  assumptions:   string[]
  engineTotals:  Partial<Record<keyof ComparisonScope, EngineTotal>>
}

// ─── Category type ─────────────────────────────────────────────────────────────

type ItemCategory =
  | 'steel'
  | 'concrete'
  | 'formwork'
  | 'foundation'
  | 'brickwork'
  | 'plaster'
  | 'waterproofing'
  | 'electrical_wiring'
  | 'electrical_db'
  | 'plumbing_pipes'
  | 'water_tanks'
  | 'flooring'
  | 'painting'
  | 'kitchen_woodwork'
  | 'false_ceiling'
  | null

const CATEGORY_ENGINE: Record<Exclude<ItemCategory, null>, keyof ComparisonScope> = {
  steel:             'structopro',
  concrete:          'structopro',
  formwork:          'structopro',
  foundation:        'structopro',
  brickwork:         'masonpro',
  plaster:           'masonpro',
  waterproofing:     'masonpro',
  electrical_wiring: 'electropro',
  electrical_db:     'electropro',
  plumbing_pipes:    'plumbpro',
  water_tanks:       'plumbpro',
  flooring:          'interiorpro',
  painting:          'interiorpro',
  kitchen_woodwork:  'interiorpro',
  false_ceiling:     'interiorpro',
}

const CATEGORY_LABEL: Record<Exclude<ItemCategory, null>, string> = {
  steel:             'TMT Steel Reinforcement',
  concrete:          'Concrete (RCC Mix Materials)',
  formwork:          'Formwork / Shuttering',
  foundation:        'Foundation & Excavation',
  brickwork:         'Brickwork / Masonry',
  plaster:           'Plastering',
  waterproofing:     'Waterproofing',
  electrical_wiring: 'Electrical Wiring & Conduit',
  electrical_db:     'DB Panel, MCB & RCCB',
  plumbing_pipes:    'Plumbing Pipes & Fittings',
  water_tanks:       'Water Tanks & Pump',
  flooring:          'Flooring (Tiles / Material)',
  painting:          'Painting & Wall Finish',
  kitchen_woodwork:  'Kitchen & Interior Woodwork',
  false_ceiling:     'False Ceiling',
}

// ─── Extraction hint detectors ─────────────────────────────────────────────────

function allText(extraction: ExtractionResult): string {
  return [
    extraction.scopeOfWork ?? '',
    ...extraction.lineItems.map(i => i.description),
    extraction.notes ?? '',
  ].join(' ').toLowerCase()
}

function detectConcreteGrade(txt: string): ConcreteGrade {
  if (/m40|m-40/.test(txt)) return 'M40'
  if (/m35|m-35/.test(txt)) return 'M35'
  if (/m30|m-30/.test(txt)) return 'M30'
  if (/m25|m-25/.test(txt)) return 'M25'
  return 'M20'
}

function detectSteelGrade(txt: string, seismicZone: string): SteelGrade {
  if (/fe550d|550d/.test(txt))              return 'Fe550D'
  if (/fe500d|500d/.test(txt))              return 'Fe500D'
  if (/fe415|415\s*grade/.test(txt))        return 'Fe415'
  if (/fe500\b/.test(txt))                  return 'Fe500'
  return (seismicZone === 'II') ? 'Fe500' : 'Fe500D'
}

function detectWallType(txt: string): ExternalWallType {
  if (/\baac\b|autoclaved|aerated block/.test(txt))          return 'aac_200'
  if (/hollow.{0,10}block|concrete.{0,10}block/.test(txt))   return 'hollow_concrete_200'
  if (/fly.?ash|flyash/.test(txt))                           return 'flyash_modular_9'
  if (/clc|foam.{0,6}block|cellular.{0,10}light/.test(txt)) return 'clc_200'
  return 'clay_modular_9'
}

// ─── Line-item category matcher ────────────────────────────────────────────────

function detectCategory(description: string): ItemCategory {
  const d = description.toLowerCase()

  // Structural steel
  if (/\b(tmt|sariya|rebar|reinforcement|ms bar|iron bar|deformed bar|binding wire)\b/.test(d))
    return 'steel'

  // Foundation / excavation
  if (/\b(excavat|earthwork|earth work|earth cut|soil cut|pit digging|filling|pcc|lean concrete|rubble fill|blinding|anti.?termite|footing)\b/.test(d))
    return 'foundation'

  // Concrete / RCC
  if (/\b(rcc|concrete|m20|m25|m30|m15|m10|cement concrete|cc work|slab|column concrete|beam concrete|roof concrete)\b/.test(d))
    return 'concrete'

  // Formwork
  if (/\b(formwork|shuttering|centering|form.?work|props|camber|deshuttering)\b/.test(d))
    return 'formwork'

  // Brickwork / masonry
  if (/\b(brick|masonry|brickwork|block work|block masonry|walling|partition wall)\b/.test(d))
    return 'brickwork'

  // Plastering
  if (/\b(plaster|plastering|rendering|rough coat|finish coat|smooth coat|skim coat|pointing)\b/.test(d))
    return 'plaster'

  // Waterproofing
  if (/\b(waterproof|water.?proof|wp treatment|terrace wp|bbc|bitumen|damp proof|tanking|crystalline|liquid applied|ips screed)\b/.test(d))
    return 'waterproofing'

  // Electrical wiring
  if (/\b(wiring|electrical work|wire|conductor|point work|light point|power point|fan point|ac point|geyser point|switchboard|switch.?board|conduit|concealed)\b/.test(d))
    return 'electrical_wiring'

  // DB / MCB
  if (/\b(mcb|db panel|distribution board|consumer unit|panel board|elcb|rccb|mccb|main switch|earth.?pit|earthing|earth electrode)\b/.test(d))
    return 'electrical_db'

  // Plumbing pipes
  if (/\b(cpvc|upvc|pvc pipe|swr|soil pipe|drain|drainage|water supply pipe|plumbing work|pipe work|piping)\b/.test(d))
    return 'plumbing_pipes'

  // Water tanks / pump
  if (/\b(water tank|overhead tank|ohwt|oht|sump|cistern|pump|water pump|motor pump)\b/.test(d))
    return 'water_tanks'

  // Flooring
  if (/\b(flooring|floor tile|vitrified|ceramic tile|marble floor|granite floor|tile work|tiling|floor work)\b/.test(d))
    return 'flooring'

  // Painting
  if (/\b(paint|painting|primer|putty|whitewash|distemper|exterior coat|texture paint|enamel|emulsion)\b/.test(d))
    return 'painting'

  // Kitchen / woodwork
  if (/\b(kitchen|modular kitchen|cabinet|wardrobe|carpenter|carpentry|wood work|ply|plywood|laminate|furniture)\b/.test(d))
    return 'kitchen_woodwork'

  // False ceiling
  if (/\b(false.{0,5}ceil|pop.{0,5}ceil|gypsum.{0,5}ceil|ceiling board|ceiling work|pvc ceiling)\b/.test(d))
    return 'false_ceiling'

  return null
}

// ─── Status computation ─────────────────────────────────────────────────────────

const THRESHOLD = 0.20  // ±20% tolerance

function computeStatus(contractorTotal: number, isCodeAmount: number): MatchStatus {
  const diff = (contractorTotal - isCodeAmount) / isCodeAmount
  if (diff > THRESHOLD)  return 'contractor_higher'
  if (diff < -THRESHOLD) return 'contractor_lower'
  return 'within_range'
}

function flagMessage(status: MatchStatus, category: string, contractorTotal: number, isCodeAmount: number): string | null {
  const fmt = (n: number) => n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : `₹${n.toLocaleString('en-IN')}`

  if (status === 'contractor_higher') {
    const over = Math.round(((contractorTotal - isCodeAmount) / isCodeAmount) * 100)
    return `Contractor quoted ${fmt(contractorTotal)} for ${category}; IS-code calculation based on your inputs suggests ${fmt(isCodeAmount)}. Difference: ${over}% higher.`
  }
  if (status === 'contractor_lower') {
    const under = Math.round(((isCodeAmount - contractorTotal) / isCodeAmount) * 100)
    return `Contractor quoted ${fmt(contractorTotal)} for ${category}; IS-code calculation suggests ${fmt(isCodeAmount)}. Difference: ${under}% lower — confirm full scope is included before signing.`
  }
  return null
}

// ─── Quantity comparison helper (steel only for now) ──────────────────────────

function tryQtyComparison(
  items: ExtractedLineItem[],
  isCodeQty: number,
  isCodeUnit: string,
): QuantityComparison | null {
  for (const item of items) {
    if (!item.quantity || !item.unit) continue
    const qty = parseFloat(item.quantity)
    if (isNaN(qty)) continue
    const unit = item.unit.toLowerCase().trim()
    // Normalise: "kg", "kgs", "kilogram" → "kg"
    if (isCodeUnit === 'kg' && /^kg/.test(unit)) {
      const diff = ((qty - isCodeQty) / isCodeQty) * 100
      return { contractorQty: qty, contractorUnit: 'kg', isCodeQty, isCodeUnit: 'kg', diffPercent: Math.round(diff) }
    }
    // bags for cement
    if (isCodeUnit === 'bags' && /bag/.test(unit)) {
      const diff = ((qty - isCodeQty) / isCodeQty) * 100
      return { contractorQty: qty, contractorUnit: 'bags', isCodeQty, isCodeUnit: 'bags', diffPercent: Math.round(diff) }
    }
    // m³ / cum for concrete volume
    if (isCodeUnit === 'm³' && /cum|m3|cu\.?m|cubic/.test(unit)) {
      const diff = ((qty - isCodeQty) / isCodeQty) * 100
      return { contractorQty: qty, contractorUnit: 'm³', isCodeQty, isCodeUnit: 'm³', diffPercent: Math.round(diff) }
    }
  }
  return null
}

// ─── IS-code map builder ───────────────────────────────────────────────────────

interface ISCodeEntry {
  label:    string
  amount:   number
  basis:    string
  clause:   string
  isCodeQty?:   number
  isCodeUnit?:  string
  inlineCaveat?: string
}

type ISCodeMap = Partial<Record<Exclude<ItemCategory, null>, ISCodeEntry>>

function buildISCodeMap(
  scope: ComparisonScope,
  state: string,
  city: string,
  floorArea: number,        // per-floor sqft
  numFloorsTotal: number,   // total floors including ground
  extraction: ExtractionResult,
  assumptions: string[],
  wallLengthFt: number | null,
): ISCodeMap {
  const txt = allText(extraction)
  const concreteGrade = detectConcreteGrade(txt)
  const { zone: seismicZone } = seismicZoneFromState(state)
  const steelGrade   = detectSteelGrade(txt, seismicZone)
  const wallType     = detectWallType(txt)

  const map: ISCodeMap = {}

  // ── StructoPro ───────────────────────────────────────────────────────────────
  if (scope.structopro) {
    const structoInput: StructoInput = {
      state,
      city,
      numFloors:           numFloorsTotal - 1,   // StructoPro: 0=G, 1=G+1 ...
      groundFloorAreaSqft: floorArea,
      siteCondition:       'flat',
      concreteGrade,
      steelGrade,
      includeLabour:       false,
    }
    const r = runStructo(structoInput)

    // Concrete volume estimate: BUA × (IS_THUMB.CEMENT_BAGS_PER_SQFT / 8.07 bags per m³) to approximate m³
    // IS_THUMB: 0.4 bags/sqft → roughly 0.4/8.07 m³/sqft (for M20)
    const concVolume = Math.round(r.totalBUA * 0.4 / 8.07 * 10) / 10

    map.steel = {
      label:      `TMT Steel ${steelGrade} (IS 1786:2008)`,
      amount:     r.costs.steel,
      basis:      `${r.quantities.steelKg.toLocaleString('en-IN')} kg × ₹${Math.round(r.costs.steel / r.quantities.steelKg)}/kg (IS 1786:2008 thumb rule: 4 kg/sqft for G+1–G+3)`,
      clause:     'IS 1786:2008',
      isCodeQty:  r.quantities.steelKg,
      isCodeUnit: 'kg',
    }
    map.concrete = {
      label:      `Concrete Mix Materials ${concreteGrade} (IS 456:2000)`,
      amount:     r.costs.cement + r.costs.aggregate + r.costs.sand,
      basis:      `Cement ${r.quantities.cementBags} bags + aggregate ${r.quantities.aggregateCft} cft + sand ${r.quantities.sandCft} cft; IS 456:2000 M${concreteGrade} dry volume factor 1.54 — approx ${concVolume} m³ concrete`,
      clause:     'IS 456:2000',
      isCodeQty:  concVolume,
      isCodeUnit: 'm³',
    }
    map.formwork = {
      label:  'Formwork / Shuttering (IS 456:2000)',
      amount: r.costs.formwork,
      basis:  `${r.quantities.formworkSqft.toLocaleString('en-IN')} sqft contact area at material rate; does not include labour`,
      clause: 'IS 456:2000',
    }
    map.foundation = {
      label:  `Foundation — ${r.foundationRecommendation.label} (IS 1904:2016)`,
      amount: r.costs.foundation,
      basis:  `Avg ₹${r.foundationRecommendation.minCostPerSqft}–₹${r.foundationRecommendation.maxCostPerSqft}/sqft on ${floorArea} sqft ground floor area; includes excavation, PCC, reinforced footing`,
      clause: 'IS 1904:2016',
    }

    assumptions.push(
      `Structure: ${concreteGrade} concrete, ${steelGrade} steel, flat site, material-only (labour excluded). Thumb rule per IS 456:2000 Sect 8.`,
    )
    if (steelGrade === 'Fe500D' && !txt.includes('fe500d') && !txt.includes('500d')) {
      assumptions.push(`Steel grade defaulted to Fe500D for Seismic Zone ${seismicZone} (IS 13920:2016 — mandatory for Zone III–V).`)
    }
    if (concreteGrade === 'M20' && !txt.includes('m20') && !txt.includes('m25')) {
      assumptions.push('Concrete grade defaulted to M20 — not specified in contractor quote.')
    }
  }

  // ── MasonPro ─────────────────────────────────────────────────────────────────
  if (scope.masonpro) {
    const floorAreaSqm = floorArea / 10.764
    let extWallSqm: number
    let brickworkCaveat: string | null = null

    if (wallLengthFt && wallLengthFt > 0) {
      // Direct perimeter provided — convert ft → m, apply height + opening deduction
      const perimeterM  = wallLengthFt / 3.281
      const netPerFloor = perimeterM * 3.0 * 0.75   // 3m floor height, 25% openings
      extWallSqm = Math.round(netPerFloor * numFloorsTotal)
      assumptions.push(
        `Masonry: external wall area derived from entered perimeter (${wallLengthFt} ft → ${Math.round(wallLengthFt / 3.281)} m), 3m floor height, 25% opening deduction → ${extWallSqm} sqm.`,
      )
    } else {
      // Fallback: square-building assumption from floor area
      const side        = Math.sqrt(floorAreaSqm)
      const netPerFloor = 4 * side * 3.0 * 0.75   // square perimeter × height × net factor
      extWallSqm = Math.round(netPerFloor * numFloorsTotal)
      // Caveat goes inline on the brickwork comparison row, NOT in the general assumptions panel
      brickworkCaveat = `Wall area estimated from floor area (square-building assumption: perimeter ≈ ${Math.round(4 * Math.sqrt(floorAreaSqm))} m). Could be 15–20% off for L-shaped or irregular buildings. Enter a measured exterior wall perimeter above for a more accurate comparison.`
    }

    const intWallSqm  = Math.round(extWallSqm * 0.55)
    const terraceSqft = floorArea
    const bathroomCount = Math.max(1, Math.ceil(numFloorsTotal * 1.5))

    const masonInput: MasonInput = {
      state,
      city,
      externalWallType:     wallType,
      externalWallAreaSqm:  extWallSqm,
      includeInternal:      true,
      internalWallType:     'clay_4_5',
      internalWallAreaSqm:  intWallSqm,
      includePlaster:       true,
      includeWaterproofing: true,
      terraceAreaSqft:      terraceSqft,
      bathroomCount,
      terraceWpMethod:      'bbc',
      bathroomWpMethod:     'cementitious',
      numFloors:            numFloorsTotal,
    }

    try {
      const r = runMason(masonInput)
      map.brickwork = {
        label:        `Brickwork — ${r.wallTypeComparison[0]?.label ?? wallType} (IS 1077:1992)`,
        amount:       r.costs.externalBrickworkMaterial + r.costs.internalPartitionMaterial,
        basis:        `External ${extWallSqm} sqm + internal ${intWallSqm} sqm. IS 1077:1992 + IS 2212:1991.`,
        clause:       'IS 1077:1992 + IS 2212:1991',
        inlineCaveat: brickworkCaveat ?? undefined,
      }
      map.plaster = {
        label:  'Plastering — internal + external (IS 1661:1972)',
        amount: r.costs.plasterMaterial,
        basis:  '12mm internal 1:4 mortar, 15mm external 1:4 mortar. IS 1661:1972 — 5% wastage included.',
        clause: 'IS 1661:1972',
      }
      if (r.waterproofingCosts) {
        map.waterproofing = {
          label:  'Waterproofing — terrace BBC + bathroom cementitious (IS 2645:2003)',
          amount: r.waterproofingCosts.total,
          basis:  `Terrace ${terraceSqft} sqft BBC @ ₹155–₹225/sqft + ${bathroomCount} bathrooms cementitious @ ₹88–₹145/sqft. IS 2645:2003.`,
          clause: 'IS 2645:2003',
        }
      }
    } catch {
      // Engine failed — skip masonry comparison
    }
  }

  // ── ElectroPro ───────────────────────────────────────────────────────────────
  if (scope.electropro) {
    const numBathrooms = Math.max(1, Math.ceil(numFloorsTotal * 1.5))
    const numAC        = numFloorsTotal

    const electroInput: ElectroInput = {
      state,
      city,
      buaPerFloorSqft:  floorArea,
      numFloors:        numFloorsTotal,
      numBathrooms,
      numAC,
      includeEarthing:  true,
      includeLabour:    false,
    }
    const r = runElectro(electroInput)

    map.electrical_wiring = {
      label:  'Wiring & Conduit — IS 732:2019 minimum sizes',
      amount: r.costs.wireMaterial + r.costs.conduitMaterial,
      basis:  `${r.pointSchedule.totalPoints} electrical points across ${numFloorsTotal} floor(s). IS 732:2019 min wire sizes: 1.5 sqmm lighting, 2.5 sqmm power, 4.0 sqmm AC/geyser.`,
      clause: 'IS 732:2019',
    }
    map.electrical_db = {
      label:  'DB Panel, MCB & RCCB — IS 8828:2007',
      amount: r.costs.dbPanelMaterial + r.costs.mcbRccbMaterial + r.costs.earthingMaterial,
      basis:  `${r.dbPanelSchedule.totalWays}-way ${r.dbPanelSchedule.panelSize} panel + RCCB 30mA (bathroom mandatory, IS 3043:2018). Earthing: 2 pits @ ₹3,500 each.`,
      clause: 'IS 8828:2007 + IS 3043:2018',
    }

    assumptions.push(
      `Electrical: assumed ${numBathrooms} bathrooms, ${numAC} AC points, 2 earthing pits. Thumb rule: 1 light point/25 sqft, 1 power socket/20 sqft (IS 732:2019).`,
    )
  }

  // ── PlumbPro ─────────────────────────────────────────────────────────────────
  if (scope.plumbpro) {
    const numBathrooms = Math.max(1, Math.ceil(numFloorsTotal * 1.5))
    const numBedrooms  = Math.max(2, numFloorsTotal * 2)

    const plumbInput: PlumbInput = {
      state,
      city,
      numBedrooms,
      numBathrooms,
      numFloors:        numFloorsTotal,
      buaPerFloorSqft:  floorArea,
      waterSource:      'municipal',
      includeSump:      true,
      includeLabour:    false,
    }
    const r = runPlumb(plumbInput)

    map.plumbing_pipes = {
      label:  'Plumbing Pipes & Fittings — IS 1742:1983',
      amount: r.costs.cpvcPipeMaterial + r.costs.swrPipeMaterial + r.costs.upvcPipeMaterial + r.costs.fittingsMaterial + r.costs.valvesMaterial,
      basis:  `CPVC supply + SWR waste/soil stack + fittings (35% of pipe cost). IS 1172:1993 pipe sizing; IS 1742:1983 slope standards.`,
      clause: 'IS 1172:1993 + IS 1742:1983',
    }
    map.water_tanks = {
      label:  'Water Tanks & Pump — IS 1172:1993',
      amount: r.costs.tanksMaterial + r.costs.pumpMaterial,
      basis:  `${r.waterDemand.totalTankL.toLocaleString('en-IN')} L total (OHT + sump) at IS 1172:1993 demand: 135 LPCD × ${r.waterDemand.occupants} occupants. Pump: ${r.waterDemand.pumpHPStandard}.`,
      clause: 'IS 1172:1993',
    }

    assumptions.push(
      `Plumbing: assumed ${numBathrooms} bathrooms, municipal water supply. Sanitary fixtures (WC, basins, taps) are NOT included in IS-code material cost — they vary by brand and specification.`,
    )
  }

  // ── InteriorPro ───────────────────────────────────────────────────────────────
  if (scope.interiorpro) {
    const numBathrooms = Math.max(1, Math.ceil(numFloorsTotal * 1.5))
    const numBedrooms  = Math.max(2, numFloorsTotal * 2)

    const interiorInput: InteriorInput = {
      state,
      city,
      method:             'quick',
      grade:              'standard',
      numFloors:           numFloorsTotal,
      buaPerFloorSqft:     floorArea,
      numBedrooms,
      numBathrooms,
      kitchenRft:          10,
      includeFalseCeiling: false,
      falseCeilingSqft:    0,
      numDoors:            Math.max(5, numFloorsTotal * 3),
      includeLabour:       false,
    }
    const r = runInterior(interiorInput)

    map.flooring = {
      label:  'Flooring — vitrified tiles, standard grade (₹120/sqft)',
      amount: r.costs.flooringMaterial,
      basis:  `${r.totalBuaSqft.toLocaleString('en-IN')} sqft × ₹120/sqft (standard grade) + 10% tile wastage (IS 15477:2004).`,
      clause: 'IS 15477:2004',
    }
    map.painting = {
      label:  'Painting — interior emulsion + primer, standard grade',
      amount: r.costs.paintMaterial,
      basis:  `IS 2395:1994: 0.18L/sqft BUA; approx ${Math.ceil(r.totalBuaSqft * 0.18)} litres emulsion + primer (2 coats). Standard rate ₹35/sqft wall area.`,
      clause: 'IS 2395:1994',
    }
    map.kitchen_woodwork = {
      label:  'Kitchen Modular — standard grade (₹2,200/rft)',
      amount: r.costs.kitchenMaterial,
      basis:  '10 rft standard modular kitchen @ ₹2,200/rft. IS 4020:1998 hardware standards. Wardrobes/other woodwork calculated separately.',
      clause: 'IS 4020:1998',
    }
    map.false_ceiling = {
      label:  'False Ceiling — gypsum board, standard grade (₹165/sqft)',
      amount: r.costs.falseCeilingMaterial || Math.round(r.totalBuaSqft * 0.3 * 165),
      basis:  'Estimated at 30% of BUA area if applicable. IS 277:2003 MS frame mandatory, min 0.5mm thickness.',
      clause: 'IS 277:2003',
    }

    assumptions.push(
      `Interior: standard grade rates used (₹120/sqft flooring, ₹35/sqft paint, ₹2,200/rft kitchen). Actual grade specified by contractor may differ.`,
    )
  }

  return map
}

// ─── Row assembler ─────────────────────────────────────────────────────────────

function buildRows(
  extraction: ExtractionResult,
  isCodeMap: ISCodeMap,
  scope: ComparisonScope,
): ComparisonRow[] {
  const rows: ComparisonRow[] = []
  let rowId = 0

  // Group contractor items by category
  type NonNullCategory = Exclude<ItemCategory, null>
  const grouped = new Map<NonNullCategory, ExtractedLineItem[]>()
  const unverifiable: ExtractedLineItem[] = []

  for (const item of extraction.lineItems) {
    const cat = detectCategory(item.description)
    if (cat === null) {
      unverifiable.push(item)
      continue
    }
    const engine = CATEGORY_ENGINE[cat]
    if (!scope[engine]) {
      unverifiable.push(item)
      continue
    }
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(item)
  }

  // Matched categories
  for (const [cat, items] of grouped.entries()) {
    const isEntry = isCodeMap[cat]
    const contractorTotal = items.reduce((sum, i) => {
      const n = parseFloat((i.totalPrice ?? '').replace(/,/g, ''))
      return isNaN(n) ? sum : sum + n
    }, 0)

    const contractorEntries: ComparisonContractorEntry[] = items.map(i => ({
      description: i.description,
      totalPrice:  parseFloat((i.totalPrice ?? '').replace(/,/g, '')) || 0,
      quantity:    i.quantity,
      unit:        i.unit,
      unitRate:    i.unitRate,
    }))

    if (!isEntry) {
      // Engine is enabled but no IS-code equivalent found for this category
      rows.push({
        id: `row-${rowId++}`,
        engine: CATEGORY_ENGINE[cat],
        category: cat,
        categoryLabel: CATEGORY_LABEL[cat],
        status: 'unverifiable',
        contractorItems: contractorEntries,
        contractorTotal: contractorTotal || null,
        isCodeLabel: '',
        isCodeAmount: null,
        isCodeBasis: '',
        isCodeClause: '',
        differencePercent: null,
        flagMessage: `This item was detected in the contractor quote but NirmanShastra has no direct IS-code equivalent to compare against.`,
        qtyComparison: null,
        inlineCaveat: null,
      })
      continue
    }

    const status = contractorTotal > 0
      ? computeStatus(contractorTotal, isEntry.amount)
      : 'unverifiable'

    const diff = contractorTotal > 0 && isEntry.amount > 0
      ? Math.round(((contractorTotal - isEntry.amount) / isEntry.amount) * 100)
      : null

    // Quantity comparison where possible (steel: kg, concrete: m³, cement: bags)
    let qtyCmp: QuantityComparison | null = null
    if (cat === 'steel' && isEntry.isCodeQty != null) {
      qtyCmp = tryQtyComparison(items, isEntry.isCodeQty, isEntry.isCodeUnit ?? 'kg')
    }
    if (cat === 'concrete' && isEntry.isCodeQty != null) {
      qtyCmp = tryQtyComparison(items, isEntry.isCodeQty, isEntry.isCodeUnit ?? 'm³')
    }

    rows.push({
      id: `row-${rowId++}`,
      engine: CATEGORY_ENGINE[cat],
      category: cat,
      categoryLabel: CATEGORY_LABEL[cat],
      status,
      contractorItems: contractorEntries,
      contractorTotal: contractorTotal || null,
      isCodeLabel: isEntry.label,
      isCodeAmount: isEntry.amount,
      isCodeBasis: isEntry.basis,
      isCodeClause: isEntry.clause,
      differencePercent: diff,
      flagMessage: (status !== 'within_range' && contractorTotal > 0 && isEntry.amount > 0)
        ? flagMessage(status, CATEGORY_LABEL[cat], contractorTotal, isEntry.amount)
        : null,
      qtyComparison: qtyCmp,
      inlineCaveat: isEntry.inlineCaveat ?? null,
    })
  }

  // Expected-missing categories (engine enabled but no contractor line item)
  const expectedCategories: Exclude<ItemCategory, null>[] = [
    ...(scope.structopro  ? ['steel', 'concrete', 'formwork', 'foundation'] as const : []),
    ...(scope.masonpro    ? ['brickwork', 'plaster'] as const : []),
    ...(scope.electropro  ? ['electrical_wiring', 'electrical_db'] as const : []),
    ...(scope.plumbpro    ? ['plumbing_pipes', 'water_tanks'] as const : []),
    ...(scope.interiorpro ? ['flooring', 'painting'] as const : []),
  ]

  for (const cat of expectedCategories) {
    if (!grouped.has(cat) && isCodeMap[cat]) {
      const isEntry = isCodeMap[cat]!
      rows.push({
        id: `row-${rowId++}`,
        engine: CATEGORY_ENGINE[cat],
        category: cat,
        categoryLabel: CATEGORY_LABEL[cat],
        status: 'expected_missing',
        contractorItems: [],
        contractorTotal: null,
        isCodeLabel: isEntry.label,
        isCodeAmount: isEntry.amount,
        isCodeBasis: isEntry.basis,
        isCodeClause: isEntry.clause,
        differencePercent: null,
        flagMessage: `This item is expected in the scope but was not found in the contractor's quote. IS-code calculation suggests ${isEntry.amount >= 100000 ? `₹${(isEntry.amount / 100000).toFixed(1)}L` : `₹${isEntry.amount.toLocaleString('en-IN')}`} — confirm whether it is excluded or absorbed into another line item.`,
        qtyComparison: null,
        inlineCaveat: isEntry.inlineCaveat ?? null,
      })
    }
  }

  // Unverifiable items (no category match)
  for (const item of unverifiable) {
    const price = parseFloat((item.totalPrice ?? '').replace(/,/g, ''))
    rows.push({
      id: `row-${rowId++}`,
      engine: 'structopro',  // placeholder — not actually from any specific engine
      category: 'unverifiable',
      categoryLabel: 'Unable to Verify',
      status: 'unverifiable',
      contractorItems: [{
        description: item.description,
        totalPrice:  isNaN(price) ? 0 : price,
        quantity:    item.quantity,
        unit:        item.unit,
        unitRate:    item.unitRate,
      }],
      contractorTotal: isNaN(price) ? null : price,
      isCodeLabel: '',
      isCodeAmount: null,
      isCodeBasis: '',
      isCodeClause: '',
      differencePercent: null,
      flagMessage: 'No IS-code equivalent found for this item. Could not compare against calculated figures.',
      qtyComparison: null,
      inlineCaveat: null,
    })
  }

  // Sort: expected_missing last, unverifiable second-last
  const order: Record<MatchStatus, number> = {
    contractor_higher: 0,
    contractor_lower:  1,
    within_range:      2,
    expected_missing:  3,
    unverifiable:      4,
  }
  rows.sort((a, b) => order[a.status] - order[b.status])

  return rows
}

// ─── Engine totals builder ─────────────────────────────────────────────────────

function buildEngineTotals(
  scope: ComparisonScope,
  state: string,
  city: string,
  floorArea: number,
  numFloorsTotal: number,
  extraction: ExtractionResult,
  wallLengthFt: number | null,
): Partial<Record<keyof ComparisonScope, EngineTotal>> {
  const txt = allText(extraction)
  const concreteGrade = detectConcreteGrade(txt)
  const { zone: seismicZone } = seismicZoneFromState(state)
  const steelGrade = detectSteelGrade(txt, seismicZone)
  const result: Partial<Record<keyof ComparisonScope, EngineTotal>> = {}

  if (scope.structopro) {
    const r = runStructo({
      state, city,
      numFloors: numFloorsTotal - 1,
      groundFloorAreaSqft: floorArea,
      siteCondition: 'flat',
      concreteGrade, steelGrade,
      includeLabour: false,
    })
    result.structopro = {
      label: `RCC Structure (${concreteGrade}, ${steelGrade}, ${numFloorsTotal === 1 ? 'G' : `G+${numFloorsTotal - 1}`}, material only)`,
      calculated: { low: r.grandTotal.basic, high: r.grandTotal.premium },
      isCodeBasis: `IS 456:2000 thumb rule: ${r.totalBUA.toLocaleString('en-IN')} sqft BUA`,
    }
  }

  if (scope.masonpro) {
    const floorAreaSqm = floorArea / 10.764
    let extWallSqm: number
    let wallAreaLabel: string

    if (wallLengthFt && wallLengthFt > 0) {
      const perimeterM  = wallLengthFt / 3.281
      const netPerFloor = perimeterM * 3.0 * 0.75
      extWallSqm    = Math.round(netPerFloor * numFloorsTotal)
      wallAreaLabel = `${extWallSqm} sqm wall area (measured perimeter)`
    } else {
      const side    = Math.sqrt(floorAreaSqm)
      extWallSqm    = Math.round(4 * side * 3.0 * 0.75 * numFloorsTotal)
      wallAreaLabel = `~${extWallSqm} sqm wall area, estimated`
    }

    const wallType = detectWallType(txt)
    try {
      const r = runMason({
        state, city,
        externalWallType: wallType,
        externalWallAreaSqm: extWallSqm,
        includeInternal: true,
        internalWallType: 'clay_4_5',
        internalWallAreaSqm: Math.round(extWallSqm * 0.55),
        includePlaster: true,
        includeWaterproofing: true,
        terraceAreaSqft: floorArea,
        bathroomCount: Math.max(1, Math.ceil(numFloorsTotal * 1.5)),
        terraceWpMethod: 'bbc',
        bathroomWpMethod: 'cementitious',
      })
      result.masonpro = {
        label: `Masonry, plastering & waterproofing (${wallAreaLabel})`,
        calculated: { low: r.grandTotal.basic, high: r.grandTotal.premium },
        isCodeBasis: 'IS 1077:1992 + IS 2212:1991 + IS 1661:1972 + IS 2645:2003',
      }
    } catch { /* skip */ }
  }

  if (scope.electropro) {
    const numBathrooms = Math.max(1, Math.ceil(numFloorsTotal * 1.5))
    const r = runElectro({
      state, city,
      buaPerFloorSqft: floorArea,
      numFloors: numFloorsTotal,
      numBathrooms,
      numAC: numFloorsTotal,
      includeEarthing: true,
      includeLabour: false,
    })
    result.electropro = {
      label: `Electrical (${r.pointSchedule.totalPoints} points, ${r.dbPanelSchedule.totalWays}-way DB, material only)`,
      calculated: { low: r.grandTotal.basic, high: r.grandTotal.premium },
      isCodeBasis: 'IS 732:2019 + IS 3043:2018',
    }
  }

  if (scope.plumbpro) {
    const numBathrooms = Math.max(1, Math.ceil(numFloorsTotal * 1.5))
    const r = runPlumb({
      state, city,
      numBedrooms: Math.max(2, numFloorsTotal * 2),
      numBathrooms,
      numFloors: numFloorsTotal,
      buaPerFloorSqft: floorArea,
      waterSource: 'municipal',
      includeSump: true,
      includeLabour: false,
    })
    result.plumbpro = {
      label: `Plumbing (${numBathrooms} bathrooms, OHT + sump, pipes + valves + tanks, material only)`,
      calculated: { low: r.grandTotal.basic, high: r.grandTotal.premium },
      isCodeBasis: 'IS 1172:1993 + IS 1742:1983',
    }
  }

  if (scope.interiorpro) {
    const r = runInterior({
      state, city,
      method: 'quick',
      grade: 'standard',
      numFloors: numFloorsTotal,
      buaPerFloorSqft: floorArea,
      numBedrooms: Math.max(2, numFloorsTotal * 2),
      numBathrooms: Math.max(1, Math.ceil(numFloorsTotal * 1.5)),
      kitchenRft: 10,
      includeFalseCeiling: false,
      falseCeilingSqft: 0,
      numDoors: Math.max(5, numFloorsTotal * 3),
      includeLabour: false,
    })
    result.interiorpro = {
      label: `Interior — standard grade (flooring, paint, kitchen, doors, material only)`,
      calculated: { low: r.grandTotal.basic, high: r.grandTotal.premium },
      isCodeBasis: 'IS 15477:2004 + IS 2395:1994 + IS 4020:1998',
    }
  }

  return result
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      extraction:  ExtractionResult
      projectInfo: { city: string; state: string; floorArea: number; numFloors: number; wallLengthFt?: number | null }
      scope:       ComparisonScope
    }

    const { extraction, projectInfo, scope } = body

    if (!extraction || !projectInfo || !scope) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { city, state, floorArea, numFloors, wallLengthFt = null } = projectInfo

    if (!state || !city || !floorArea || !numFloors) {
      return NextResponse.json({ error: 'Project info incomplete' }, { status: 400 })
    }

    if (!Object.values(scope).some(Boolean)) {
      return NextResponse.json({ error: 'No engines selected' }, { status: 400 })
    }

    const assumptions: string[] = [
      'All IS-code calculations are for MATERIALS ONLY. Labour, overhead, and contractor profit are excluded. Ask your contractor for a material-only split to compare like-for-like.',
    ]

    const isCodeMap    = buildISCodeMap(scope, state, city, floorArea, numFloors, extraction, assumptions, wallLengthFt)
    const rows         = buildRows(extraction, isCodeMap, scope)
    const engineTotals = buildEngineTotals(scope, state, city, floorArea, numFloors, extraction, wallLengthFt)

    const result: ComparisonResult = { rows, assumptions, engineTotals }

    return NextResponse.json({ success: true, comparison: result })
  } catch (err) {
    console.error('compare-quote/compare error:', err)
    return NextResponse.json({ error: 'Comparison failed' }, { status: 500 })
  }
}
