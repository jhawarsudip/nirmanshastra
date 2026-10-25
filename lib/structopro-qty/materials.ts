// Cement, sand and aggregate per cubic metre of finished concrete.
// Nominal mixes (up to M20): CPWD Delhi Analysis of Rates 2014 Vol 1, sub-head 4 (read from the CPWD text). CLEAR.
// Design mixes (M25 and above): IS 10262:2009 absolute-volume method, steps read from the BIS text. CLEAR for the procedure;
// specific gravities and bulk densities below are ASSUMPTIONS (the open BIS files carry no bulk densities).

export type Grade = 'M7.5' | 'M10' | 'M15' | 'M20' | 'M25' | 'M30' | 'M35' | 'M40'
export type Exposure = 'mild' | 'moderate' | 'severe' | 'very_severe' | 'extreme'

export interface MixPerM3 {
  grade: Grade
  basis: string
  cementKg: number
  cementBags: number // 50 kg bags
  sandM3: number // loose volume as bought
  aggregateM3: number // loose volume as bought (20 mm graded)
  waterL?: number
}

export const CFT_PER_M3 = 35.3147

/** CPWD DAR 2014 Vol 1: items 4.1.2 (1:1.5:3), 4.1.3 (1:2:4), 4.1.5 (1:3:6), 4.1.8 (1:4:8, 40 mm). Aggregate = sum of single sizes. */
export const CPWD_NOMINAL: Partial<Record<Grade, MixPerM3>> = {
  M20: { grade: 'M20', basis: 'CPWD DAR 2014 item 4.1.2, nominal mix 1:1.5:3', cementKg: 400, cementBags: 8.0, sandM3: 0.425, aggregateM3: 0.85 },
  M15: { grade: 'M15', basis: 'CPWD DAR 2014 item 4.1.3, nominal mix 1:2:4', cementKg: 320, cementBags: 6.4, sandM3: 0.445, aggregateM3: 0.89 },
  M10: { grade: 'M10', basis: 'CPWD DAR 2014 item 4.1.5, nominal mix 1:3:6', cementKg: 220, cementBags: 4.4, sandM3: 0.47, aggregateM3: 0.94 },
  'M7.5': { grade: 'M7.5', basis: 'CPWD DAR 2014 item 4.1.8, nominal mix 1:4:8', cementKg: 170, cementBags: 3.4, sandM3: 0.47, aggregateM3: 0.89 },
}

/** IS 456 Table 5 (RECONSTRUCTED from the garbled scan, cross-checked): RCC minimum cement (kg/m3), maximum free w/c, minimum grade. */
export const T5_RCC: Record<Exposure, { minCement: number; maxWc: number; minGrade: Grade }> = {
  mild: { minCement: 300, maxWc: 0.55, minGrade: 'M20' },
  moderate: { minCement: 300, maxWc: 0.5, minGrade: 'M25' },
  severe: { minCement: 320, maxWc: 0.45, minGrade: 'M30' },
  very_severe: { minCement: 340, maxWc: 0.45, minGrade: 'M35' },
  extreme: { minCement: 360, maxWc: 0.4, minGrade: 'M40' },
}

/** w/c a typical OPC-43 mix needs for the grade (ASSUMPTION: from usual strength curves; the lower of this and Table 5 is used). */
export const WC_FOR_GRADE: Record<string, number> = { M20: 0.55, M25: 0.48, M30: 0.43, M35: 0.4, M40: 0.38 }

const SG_CEMENT = 3.15 // IS 10262 worked example, CLEAR
const SG_FINE = 2.65 // ASSUMPTION
const SG_COARSE = 2.7 // ASSUMPTION
const BULK_SAND = 1600 // kg/m3 loose dry, ASSUMPTION
const BULK_COARSE = 1500 // kg/m3 loose, ASSUMPTION

/** The constants of the design mix, kept in one place so the calculation sheet reads the same values the mix uses. */
export const MIX_RULES = {
  specificGravityCement: SG_CEMENT,
  specificGravityFine: SG_FINE,
  specificGravityCoarse: SG_COARSE,
  bulkDensitySand: BULK_SAND,
  bulkDensityCoarse: BULK_COARSE,
  /** water for 20 mm aggregate at 50 mm slump (kg per m3); rises by 3 % for each further 25 mm of slump */
  waterBase: 186,
  baseSlumpMm: 50,
  slumpMm: 100,
  slumpRisePerStep: 0.03,
  slumpStepMm: 25,
  maxCementKg: 450,
  /** coarse-aggregate fraction at w/c 0.5 for 20 mm aggregate and Zone II sand, raised by 0.01 for every 0.05 the w/c is below 0.5 */
  coarseBase: 0.62,
  coarseBaseWc: 0.5,
  coarseWcStep: 0.05,
  coarseStepRise: 0.01,
} as const

/** The steps of the design mix, unrounded: what a calculation sheet shows. Nothing here feeds back into the mix. */
export interface MixTrace {
  grade: Grade
  exposure: Exposure
  maxWc: number
  gradeWc: number | undefined
  wc: number
  water: number
  cementByWc: number
  minCement: number
  cement: number
  aggVol: number
  coarseFrac: number
  coarseKg: number
  fineKg: number
}

export function designMixTrace(grade: Grade, exposure: Exposure): MixTrace {
  const t5 = T5_RCC[exposure]
  const gradeWc = WC_FOR_GRADE[grade]
  const wc = Math.min(t5.maxWc, gradeWc ?? t5.maxWc)
  const water = MIX_RULES.waterBase * (1 + MIX_RULES.slumpRisePerStep * ((MIX_RULES.slumpMm - MIX_RULES.baseSlumpMm) / MIX_RULES.slumpStepMm)) // Table 2 (186 kg for 20 mm) + 3% per 25 mm slump: 197 kg
  const cementByWc = water / wc
  const cement = Math.min(MIX_RULES.maxCementKg, Math.max(cementByWc, t5.minCement)) // cl 4.3 and IS 456 cl 8.2.4.2
  const aggVol = 1 - (cement / (SG_CEMENT * 1000) + water / 1000) // absolute volume of all aggregate, cl 4.6
  const coarseFrac = MIX_RULES.coarseBase + MIX_RULES.coarseStepRise * ((MIX_RULES.coarseBaseWc - wc) / MIX_RULES.coarseWcStep) // Table 3 (20 mm, Zone II = 0.62 at w/c 0.5) and cl 4.4
  const coarseKg = aggVol * coarseFrac * SG_COARSE * 1000
  const fineKg = aggVol * (1 - coarseFrac) * SG_FINE * 1000
  return { grade, exposure, maxWc: t5.maxWc, gradeWc, wc, water, cementByWc, minCement: t5.minCement, cement, aggVol, coarseFrac, coarseKg, fineKg }
}

/** IS 10262:2009 steps 4.2 to 4.6 for 20 mm angular aggregate, Zone II sand, 100 mm slump. */
export function designMix(grade: Grade, exposure: Exposure): MixPerM3 {
  const { wc, water, cement, coarseKg, fineKg } = designMixTrace(grade, exposure)
  return {
    grade,
    basis: `IS 10262:2009 design mix, w/c ${wc.toFixed(2)}, water ${water.toFixed(0)} L, 20 mm aggregate`,
    cementKg: Math.round(cement),
    cementBags: Math.round((cement / 50) * 100) / 100,
    sandM3: Math.round((fineKg / BULK_SAND) * 1000) / 1000,
    aggregateM3: Math.round((coarseKg / BULK_COARSE) * 1000) / 1000,
    waterL: Math.round(water),
  }
}

/** Mix for a grade: CPWD nominal mix where IS 456 allows it (M20 and below), IS 10262 design mix above. */
export function mixFor(grade: Grade, exposure: Exposure = 'mild'): MixPerM3 {
  const nominal = CPWD_NOMINAL[grade]
  if (nominal) return nominal
  return designMix(grade, exposure)
}

export const cft = (m3: number) => m3 * CFT_PER_M3
export const gradeNumber = (g: Grade): number => parseFloat(g.replace('M', ''))
