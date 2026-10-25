// ─────────────────────────────────────────────────────────────────────────────
// CONCRETE MIX — CALCULATOR ENGINE
//
// Free, standalone calculator. It turns a volume of finished concrete, a grade and a site exposure into the cement,
// sand and aggregate to buy.
//
// ONE SOURCE OF TRUTH: every per-m³ figure comes from lib/structopro-qty/materials.ts, the same function the
// StructurePro model uses (mixFor / designMix), so this page and the paid report cannot disagree.
//
//   M10, M15, M20  Nominal mixes from the CPWD Delhi Analysis of Rates 2014, Vol 1, items 4.1.2, 4.1.3 and 4.1.5
//                  (M20 = 1 : 1.5 : 3 = 400 kg of cement, 8.0 bags a m³). IS 456 cl 9.3.2 allows a nominal mix for M20
//                  and lower.
//   M25 and above  A design mix worked out by the IS 10262:2009 absolute-volume method for 20 mm aggregate, Zone II
//                  sand and a 100 mm slump, with the water-cement ratio and cement floor of IS 456 Table 5 and the
//                  450 kg/m³ ceiling of IS 456 cl 8.2.4.2. The specific gravities and bulk densities are assumptions.
//                  A real design mix comes from trial batches by a laboratory or the engineer; this is a quantity to plan
//                  the purchase with.
//
// The old version of this page used 1 : 1 : 2 (11 bags a m³) as an "M25 nominal mix". IS 456 does not allow a nominal
// mix at M25, and 550 kg of cement a m³ is above the code ceiling, so that mix was retired.
// ─────────────────────────────────────────────────────────────────────────────

import { mixFor, T5_RCC, WC_FOR_GRADE, gradeNumber, cft, type Grade, type Exposure, type MixPerM3 } from '@/lib/structopro-qty/materials'

export type { Grade, Exposure }

export const BAG_WEIGHT = 50 // kg per bag
/** IS 456 cl 8.2.4.2: cement content, not counting fly ash or slag, is not more than 450 kg/m³. */
export const CEMENT_CEILING = 450

export const GRADE_ORDER: Grade[] = ['M10', 'M15', 'M20', 'M25', 'M30', 'M35', 'M40']
export const EXPOSURE_ORDER: Exposure[] = ['mild', 'moderate', 'severe', 'very_severe', 'extreme']

export const EXPOSURE_LABEL: Record<Exposure, string> = {
  mild: 'Mild: inland, dry, normal weather',
  moderate: 'Moderate: wet, sheltered from rain, or buried in non-aggressive soil',
  severe: 'Severe: rain-exposed, often wet, or in coastal air',
  very_severe: 'Very severe: salt spray, tidal, or sulphate soil',
  extreme: 'Extreme: tidal zone, or in contact with aggressive chemicals',
}

/** Nominal mixes: the ratio of cement : sand : aggregate by volume, as CPWD prints it. */
export const NOMINAL_RATIO: Partial<Record<Grade, string>> = { M20: '1 : 1.5 : 3', M15: '1 : 2 : 4', M10: '1 : 3 : 6' }

export const GRADE_NOTE: Record<Grade, string> = {
  'M7.5': 'Plain concrete for levelling.',
  M10: 'Plain concrete: the levelling course under footings and floors. Not for reinforced work.',
  M15: 'Plain concrete: the bed under footings and floors. Below the minimum for reinforced work.',
  M20: 'The lowest grade IS 456 allows for reinforced concrete, in a mild site.',
  M25: 'Reinforced concrete in a moderate site, and a common choice for frames of several floors.',
  M30: 'Reinforced concrete in a severe site.',
  M35: 'Reinforced concrete in a very severe site.',
  M40: 'Reinforced concrete in an extreme site.',
}

export interface ConcreteMixInput {
  volumeM3: number // finished concrete to pour (m³)
  grade: Grade
  exposure: Exposure
}

export interface Amounts {
  cementKg: number
  cementBags: number
  sandM3: number
  sandCft: number
  aggregateM3: number
  aggregateCft: number
  waterL: number | null
}

export interface ConcreteMixResult {
  grade: Grade
  exposure: Exposure
  volumeM3: number
  nominal: boolean
  ratio: string | null
  basis: string
  perM3: Amounts
  total: Amounts
  /** the lowest grade IS 456 Table 5 allows for reinforced concrete at this exposure */
  minGrade: Grade
  belowMinimum: boolean
  /** the highest water-cement ratio and the lowest cement content IS 456 Table 5 allows at this exposure */
  maxWc: number
  minCementKg: number
  /** a design mix whose cement reached the 450 kg/m³ ceiling */
  atCeiling: boolean
  /** design mixes only: the water-cement ratio aimed at, and the cement it would take to hold it with the water assumed */
  targetWc: number | null
  cementForTargetKg: number | null
}

function amounts(m: MixPerM3, k: number): Amounts {
  return {
    cementKg: m.cementKg * k,
    cementBags: m.cementBags * k,
    sandM3: m.sandM3 * k,
    sandCft: cft(m.sandM3) * k,
    aggregateM3: m.aggregateM3 * k,
    aggregateCft: cft(m.aggregateM3) * k,
    waterL: m.waterL === undefined ? null : m.waterL * k,
  }
}

/**
 * Quantities of cement, sand and aggregate for a volume of finished concrete.
 *
 * Checked by hand: 1 m³ of M20 → 400 kg of cement (8.0 bags), 0.425 m³ of sand (15.0 cft), 0.85 m³ of aggregate
 * (30.0 cft), the CPWD figures. 1 m³ of M25 at a mild site → 411 kg (8.2 bags): water 197 L ÷ w/c 0.48.
 */
export function calculate(input: ConcreteMixInput): ConcreteMixResult {
  const volumeM3 = Math.max(0, input.volumeM3 || 0)
  const mix = mixFor(input.grade, input.exposure)
  const t5 = T5_RCC[input.exposure]
  const nominal = NOMINAL_RATIO[input.grade] !== undefined
  const targetWc = nominal ? null : Math.min(t5.maxWc, WC_FOR_GRADE[input.grade] ?? t5.maxWc)
  const cementForTargetKg = targetWc !== null && mix.waterL !== undefined ? mix.waterL / targetWc : null
  return {
    grade: input.grade,
    exposure: input.exposure,
    volumeM3,
    nominal,
    ratio: NOMINAL_RATIO[input.grade] ?? null,
    basis: mix.basis,
    perM3: amounts(mix, 1),
    total: amounts(mix, volumeM3),
    minGrade: t5.minGrade,
    belowMinimum: gradeNumber(input.grade) < gradeNumber(t5.minGrade),
    maxWc: t5.maxWc,
    minCementKg: t5.minCement,
    atCeiling: !nominal && mix.cementKg >= CEMENT_CEILING,
    targetWc,
    cementForTargetKg,
  }
}
