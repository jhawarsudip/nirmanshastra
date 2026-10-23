// Numbers for the hero "Section Cut" widget. Every constant is either the locked Build Reference
// Section 8 value or the engine's own default rate. The mesh layout itself is an ILLUSTRATION
// (labelled as such on the page) — it is not a structural design.
import { DEFAULT_RATES } from '@/app/tools/structopro/structopro-engine'

/** Section 8 · Steel · bar weights (kg/m), IS 1786:2008 */
export const BAR_KG_PER_M: Record<number, number> = { 8: 0.395, 10: 0.617, 12: 0.888, 16: 1.578 }
export const BAR_DIAS = [8, 10, 12, 16] as const
/** Section 8 · Concrete · M20 (1:1.5:3) cement, bags per m³ */
export const M20_CEMENT_BAGS_PER_M3 = 8.07
/** Section 8 · Steel · density kg/m³ */
export const STEEL_DENSITY = 7850
/** Section 8 · Steel · slab thumb rule, kg per m³ of concrete (1.00 %) */
export const SLAB_THUMB_KG_PER_M3 = 78.5
/** engine: 7 % field wastage on superstructure materials */
export const WASTAGE = 1.07

export interface SlabStrip {
  volume: number      // m³
  cementBags: number
  barMetres: number   // total bar length, m
  steelKg: number
  steelPct: number    // % of concrete volume
  thumbKg: number
  deltaPct: number    // mesh vs thumb rule, %
  cost: number        // ₹, cement + steel incl. wastage
}

/** One mesh layer: main bars and distribution bars at the same Ø and spacing (illustration). */
export function slabStrip(thicknessMm: number, diaMm: number, spacingMm: number, areaM2 = 10): SlabStrip {
  const volume = (thicknessMm / 1000) * areaM2
  const cementBags = M20_CEMENT_BAGS_PER_M3 * volume
  const barMetres = 2 * (1000 / spacingMm) * areaM2
  const steelKg = barMetres * (BAR_KG_PER_M[diaMm] ?? 0)
  const steelPct = (steelKg / STEEL_DENSITY / volume) * 100
  const thumbKg = SLAB_THUMB_KG_PER_M3 * volume
  const deltaPct = ((steelKg - thumbKg) / thumbKg) * 100
  const cost = (cementBags * DEFAULT_RATES.cement + steelKg * DEFAULT_RATES.steel) * WASTAGE
  return { volume, cementBags, barMetres, steelKg, steelPct, thumbKg, deltaPct, cost }
}

export const RATES = { cement: DEFAULT_RATES.cement, steel: DEFAULT_RATES.steel }

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
export const fmtInr = (n: number) => '₹' + inr.format(Math.round(n))
export const fmt = (n: number, d = 1) => n.toFixed(d)
