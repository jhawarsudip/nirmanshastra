// ─────────────────────────────────────────────────────────────────────────────
// FINISH-TIER COST DIFFERENCE CALCULATOR — ENGINE
//
// Permanently-free, standalone calculator. It reproduces the per-element,
// per-tier cost build-up of the Residential Construction Cost Estimator's
// "Quality Tiers" sheet exactly.
//
// AUTHORITATIVE SOURCE — do not overwrite from any other source:
//
//   These rates were taken DIRECTLY from the Residential Construction Cost
//   Estimator's Quality Tiers sheet (a standalone Excel product, not a code
//   module). They are PORTED, never invented.
//
//   The source explicitly labels these as INDICATIVE Tier-2 CITY RATES. The
//   value of the tool is showing the SHAPE of the difference between finish
//   tiers — not exact absolute pricing for any one city or year.
//
//   Seven elements are priced PER SQFT of built-up area. Kitchen is priced
//   separately PER RUNNING FOOT of counter/base run, exactly as the source
//   sheet keeps it (it does not scale with floor area).
//
// VERIFIED WORKED REFERENCE (from the source sheet, per-sqft elements only):
//   2400 sqft · Standard vs Premium
//     → Standard total ₹3,576,000 · Premium total ₹4,759,200
//     → difference ₹1,183,200
//   (Per-sqft rate sums: Standard 1490/sqft, Premium 1983/sqft;
//    1490×2400 = 3,576,000, 1983×2400 = 4,759,200, delta 493×2400 = 1,183,200.)
// ─────────────────────────────────────────────────────────────────────────────

export type Tier = 'Basic' | 'Standard' | 'Premium' | 'Luxury'

export const TIERS: Tier[] = ['Basic', 'Standard', 'Premium', 'Luxury']

/** A rate table keyed by tier. */
type TierRates = Record<Tier, number>

/** One priced element of the build. */
export interface ElementDef {
  key: string
  /** Human label as it reads on the source sheet. */
  label: string
  /** 'sqft' → scales with built-up area · 'rft' → scales with running feet. */
  unit: 'sqft' | 'rft'
  rates: TierRates
}

// Seven per-sqft elements — rates in ₹ per sqft of built-up area.
export const SQFT_ELEMENTS: ElementDef[] = [
  { key: 'structure', label: 'Structure & masonry',      unit: 'sqft', rates: { Basic: 900, Standard: 950, Premium: 1020, Luxury: 1120 } },
  { key: 'flooring',  label: 'Flooring',                  unit: 'sqft', rates: { Basic: 90,  Standard: 160, Premium: 280,  Luxury: 520  } },
  { key: 'doors',     label: 'Doors & windows',           unit: 'sqft', rates: { Basic: 70,  Standard: 120, Premium: 210,  Luxury: 400  } },
  { key: 'electrical', label: 'Electrical',               unit: 'sqft', rates: { Basic: 55,  Standard: 85,  Premium: 140,  Luxury: 240  } },
  { key: 'plumbing',  label: 'Plumbing',                  unit: 'sqft', rates: { Basic: 60,  Standard: 95,  Premium: 165,  Luxury: 320  } },
  { key: 'painting',  label: 'Painting',                  unit: 'sqft', rates: { Basic: 22,  Standard: 35,  Premium: 58,   Luxury: 95   } },
  { key: 'falseCeiling', label: 'False ceiling & joinery', unit: 'sqft', rates: { Basic: 0,  Standard: 45,  Premium: 110,  Luxury: 240  } },
]

// Kitchen — priced per running foot, kept separate from the per-sqft build-up.
export const KITCHEN_ELEMENT: ElementDef = {
  key: 'kitchen',
  label: 'Kitchen (per running ft)',
  unit: 'rft',
  rates: { Basic: 1200, Standard: 2200, Premium: 3800, Luxury: 7500 },
}

export interface FinishTierInputs {
  /** Built-up area in sqft (drives the seven per-sqft elements). */
  areaSqft: number
  /** Kitchen counter/base run in running feet (drives kitchen only). 0 = exclude. */
  kitchenRft: number
  tierA: Tier
  tierB: Tier
}

export interface ElementDelta {
  key: string
  label: string
  unit: 'sqft' | 'rft'
  rateA: number
  rateB: number
  costA: number
  costB: number
  /** costB − costA (can be negative if B is a lower tier than A). */
  delta: number
}

export interface FinishTierResult {
  /** Per-element rows for the seven per-sqft elements. */
  sqftRows: ElementDelta[]
  /** The kitchen row (present even when kitchenRft is 0). */
  kitchenRow: ElementDelta
  /** Totals across the seven per-sqft elements. */
  sqftTotalA: number
  sqftTotalB: number
  sqftDelta: number
  /** Grand totals = per-sqft total + kitchen. With kitchenRft 0, equals per-sqft. */
  totalA: number
  totalB: number
  totalDelta: number
}

function rowFor(el: ElementDef, quantity: number, tierA: Tier, tierB: Tier): ElementDelta {
  const rateA = el.rates[tierA]
  const rateB = el.rates[tierB]
  const costA = rateA * quantity
  const costB = rateB * quantity
  return {
    key: el.key,
    label: el.label,
    unit: el.unit,
    rateA,
    rateB,
    costA,
    costB,
    delta: costB - costA,
  }
}

/**
 * Compute the per-element and total cost difference between two finish tiers.
 * Pure function — no rounding games: rates are whole rupees and quantities are
 * user-entered, so the products are exact.
 */
export function calculate(inputs: FinishTierInputs): FinishTierResult {
  const area = Number.isFinite(inputs.areaSqft) && inputs.areaSqft > 0 ? inputs.areaSqft : 0
  const rft = Number.isFinite(inputs.kitchenRft) && inputs.kitchenRft > 0 ? inputs.kitchenRft : 0

  const sqftRows = SQFT_ELEMENTS.map((el) => rowFor(el, area, inputs.tierA, inputs.tierB))
  const kitchenRow = rowFor(KITCHEN_ELEMENT, rft, inputs.tierA, inputs.tierB)

  const sqftTotalA = sqftRows.reduce((s, r) => s + r.costA, 0)
  const sqftTotalB = sqftRows.reduce((s, r) => s + r.costB, 0)
  const sqftDelta = sqftTotalB - sqftTotalA

  const totalA = sqftTotalA + kitchenRow.costA
  const totalB = sqftTotalB + kitchenRow.costB
  const totalDelta = totalB - totalA

  return {
    sqftRows,
    kitchenRow,
    sqftTotalA,
    sqftTotalB,
    sqftDelta,
    totalA,
    totalB,
    totalDelta,
  }
}

// Defaults — Standard vs Premium at 2400 sqft so the on-screen default
// reproduces the verified worked example exactly (₹3,576,000 vs ₹4,759,200).
export const FINISH_TIER_DEFAULTS: FinishTierInputs = {
  areaSqft: 2400,
  kitchenRft: 0,
  tierA: 'Standard',
  tierB: 'Premium',
}
