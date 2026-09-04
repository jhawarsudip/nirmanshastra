// ─────────────────────────────────────────────────────────────────────────────
// CONCRETE MIX RATIO — CALCULATOR ENGINE (IS 456:2000 nominal mixes)
//
// Permanently-free, standalone calculator. It converts a required concrete
// volume into purchase quantities for the nominal-mix grades.
//
// AUTHORITATIVE SOURCE — do not overwrite from any other source:
//
//   The per-m³ quantities below are the LOCKED values from
//   docs/NirmanShastra_Build_Reference.md Section 8 ("VERIFIED IS CODE VALUES"),
//   the project's own final single-source-of-truth. Section 8's own stated rule:
//   "THESE VALUES ARE FINAL. DO NOT OVERWRITE FROM ANY OTHER SOURCE."
//
//     | Grade | Ratio   | Cement (bags/m³) | Sand (cft/m³) | Aggregate (cft/m³) |
//     | M20   | 1:1.5:3 | 8.07             | 11.22         | 22.44              |
//     | M25   | 1:1:2   | 11.00            | 7.48          | 14.96              |
//
//   These are the finished per-cubic-metre quantities. This tool simply scales
//   them LINEARLY by the entered volume — it does NOT re-derive them from the
//   dry-volume/ratio method (an earlier version did, and disagreed with Section 8
//   on sand/aggregate; the locked figures win).
//
//   The 1.54 dry-volume factor and 1440 kg/m³ cement density (also in Section 8)
//   are how these per-m³ figures were originally established; they are kept below
//   only for the explanatory content and the derived cement weight, never to
//   recompute the locked quantities.
//
// M30 AND ABOVE — NOT A NOMINAL MIX:
//   Section 8 gives NO nominal row for M30. It lists "M25+ | Design mix | Per
//   structural engineer" with no numbers, matching IS 456:2000, which makes a
//   DESIGN mix (not a nominal ratio) mandatory above M25. M30 is therefore
//   offered only to return a design-mix notice — never a fabricated quantity.
// ─────────────────────────────────────────────────────────────────────────────

// Dry-volume factor & cement density — IS 456:2000 (LOCKED, Section 8). Kept for
// the explanatory content and the derived cement weight only; NOT used to
// recompute the locked per-m³ quantities.
export const DRY_VOLUME_FACTOR = 1.54
export const CEMENT_DENSITY = 1440 // kg/m³
export const BAG_WEIGHT = 50 // kg per bag

// Cubic feet per cubic metre (site conversion, for showing sand/aggregate in m³).
export const CFT_PER_M3 = 35.3147

export type Grade = 'M20' | 'M25' | 'M30'

export interface GradeSpec {
  grade: Grade
  ratio: string // human-readable "1:1.5:3" (or "Design mix" for M30+)
  isDesignMix: boolean // true → no nominal ratio; requires laboratory design mix
  // LOCKED per-m³ quantities from Section 8. Present only for nominal grades.
  perM3?: {
    cementBags: number
    sandCft: number
    aggregateCft: number
  }
  note: string // plain-English use of the grade
}

// Nominal-mix grades carry Section 8's locked per-m³ figures. M30 carries none.
export const GRADES: Record<Grade, GradeSpec> = {
  M20: {
    grade: 'M20',
    ratio: '1 : 1.5 : 3',
    isDesignMix: false,
    perM3: { cementBags: 8.07, sandCft: 11.22, aggregateCft: 22.44 },
    note: 'General residential RCC — slabs, beams, columns of ordinary homes.',
  },
  M25: {
    grade: 'M25',
    ratio: '1 : 1 : 2',
    isDesignMix: false,
    perM3: { cementBags: 11.0, sandCft: 7.48, aggregateCft: 14.96 },
    note: 'Stronger RCC — heavier loads, and the top of nominal mixing per IS 456.',
  },
  M30: {
    grade: 'M30',
    ratio: 'Design mix',
    isDesignMix: true,
    note: 'M30 and above require a laboratory design mix per IS 456:2000 — a nominal ratio does not apply.',
  },
}

export const GRADE_ORDER: Grade[] = ['M20', 'M25', 'M30']

// Shown wherever a user asks for M30+ instead of any fabricated quantity.
export const DESIGN_MIX_MESSAGE =
  'M30 and above require a design mix per IS 456:2000 — nominal ratios don’t apply. ' +
  'Consult a structural engineer or use StructurePro’s full IS 456-compliant grade selection.'

export interface ConcreteMixInput {
  wetVolumeM3: number // finished concrete volume required (m³)
  grade: Grade
}

export interface ConcreteMixResult {
  grade: Grade
  ratio: string
  wetVolumeM3: number
  isDesignMix: boolean // true → quantities are null; read designMixMessage

  // Null for design-mix grades (M30+). Never fabricated.
  cementBags: number | null
  cementWeightKg: number | null // derived: cementBags × 50
  sandCft: number | null
  sandVolumeM3: number | null // derived: sandCft ÷ 35.3147 (display convenience)
  aggregateCft: number | null
  aggregateVolumeM3: number | null // derived: aggregateCft ÷ 35.3147

  designMixMessage: string | null
}

/**
 * Convert a concrete volume into purchase quantities for one grade.
 *
 * Nominal grades (M20, M25): the LOCKED Section 8 per-m³ figures scaled linearly
 * by the entered volume. NOTHING is re-derived.
 *
 * Design-mix grades (M30+): quantities are null and designMixMessage is set —
 * no number is ever fabricated.
 *
 * Verified against Section 8 (per 1 m³):
 *   M20 → 8.07 bags · 11.22 cft sand · 22.44 cft aggregate
 *   M25 → 11.00 bags · 7.48 cft sand · 14.96 cft aggregate
 * And linear scaling, e.g. 2 m³ M20 → 16.14 bags · 22.44 cft sand · 44.88 cft.
 */
export function calculate(input: ConcreteMixInput): ConcreteMixResult {
  const spec = GRADES[input.grade]
  const wetVolumeM3 = Math.max(0, input.wetVolumeM3 || 0)

  if (spec.isDesignMix || !spec.perM3) {
    return {
      grade: spec.grade,
      ratio: spec.ratio,
      wetVolumeM3,
      isDesignMix: true,
      cementBags: null,
      cementWeightKg: null,
      sandCft: null,
      sandVolumeM3: null,
      aggregateCft: null,
      aggregateVolumeM3: null,
      designMixMessage: DESIGN_MIX_MESSAGE,
    }
  }

  // ── Linear scaling of the LOCKED Section 8 per-m³ quantities ─────────────────
  const cementBags = spec.perM3.cementBags * wetVolumeM3
  const cementWeightKg = cementBags * BAG_WEIGHT
  const sandCft = spec.perM3.sandCft * wetVolumeM3
  const sandVolumeM3 = sandCft / CFT_PER_M3
  const aggregateCft = spec.perM3.aggregateCft * wetVolumeM3
  const aggregateVolumeM3 = aggregateCft / CFT_PER_M3

  return {
    grade: spec.grade,
    ratio: spec.ratio,
    wetVolumeM3,
    isDesignMix: false,
    cementBags,
    cementWeightKg,
    sandCft,
    sandVolumeM3,
    aggregateCft,
    aggregateVolumeM3,
    designMixMessage: null,
  }
}
