// StructurePro quantity model: code constants and small pure helpers.
// Every number carries its source. Status words: CLEAR (read in text), RECONSTRUCTED (garbled scan,
// rebuilt and cross-checked), DERIVED (our arithmetic), ASSUMPTION (engineering default, shown to the user).
// Full source table: Project doc "structopro-quantity-research.md".

export type Zone = 'II' | 'III' | 'IV' | 'V'

/** IS 1893 (Part 1):2002 Table 2. RECONSTRUCTED. */
export const Z_FACTOR: Record<Zone, number> = { II: 0.10, III: 0.16, IV: 0.24, V: 0.36 }

/** IS 456:2000 cl 19.2.1: unit weight of reinforced concrete, kN/m3. CLEAR. */
export const GAMMA_RC = 25

/** IS 875 (Part 1):1987 Table 1 item 36: common burnt clay brick masonry 1920 kg/m3 = 18.85 kN/m3. RECONSTRUCTED. */
export const GAMMA_BRICK = 18.85
/** IS 875 (Part 1):1987 Table 1 items 24-26/42: cement mortar / plaster 20.4 kN/m3. RECONSTRUCTED. */
export const GAMMA_PLASTER = 20.4

/** IS 456:2000 cl 38.1 / Annex G: Es = 2e5 N/mm2; material factor 1.15 gives 0.87 fy. CLEAR. */
export const ES = 200000

/** Steel grade used by the model. Fe500D is what the market supplies; IS 13920 asks for ductile steel in Zone III+. ASSUMPTION. */
export const FY = 500
/** IS 456 cl 40.4: for shear reinforcement fy is not taken above 415 N/mm2. CLEAR. */
export const FY_SHEAR = 415

/** IS 1786:2008: mass = 0.00785 kg per mm2 per metre. mass/m = d^2/162.2. DERIVED, reproduces IS 1786 Table 1. */
export const barMass = (d: number) => (d * d) / 162.2 // kg/m
export const barArea = (d: number) => (Math.PI * d * d) / 4 // mm2

/** IS 456 Table 16 nominal cover by exposure (mm). RECONSTRUCTED (high). Columns 40 (26.4.2.1), footings 50 (26.4.2.2). */
export const COVER_EXPOSURE = { mild: 20, moderate: 30, severe: 45, very_severe: 50, extreme: 75 } as const
export const COVER_COLUMN = 40
export const COVER_FOOTING = 50
/** SP 34 cl 4.1(c): beam cover not less than 25 mm. CLEAR. Slab 20 (Table 16 mild) ASSUMPTION for practice (15 mm allowed). */
export const COVER_BEAM = 25
export const COVER_SLAB = 20

/** IS 456 cl 26.2.1.1 design bond stress for plain bars in tension, N/mm2, by grade. RECONSTRUCTED (high).
 *  Deformed bars x1.6, compression x1.25 (CLEAR). */
export const TAU_BD_PLAIN: Record<number, number> = { 20: 1.2, 25: 1.4, 30: 1.5, 35: 1.7, 40: 1.9 }

/** IS 456 cl 26.2.1: Ld = phi * sigma_s / (4 * tau_bd), sigma_s = 0.87 fy. */
export function devLength(phi: number, fck: number, opts: { compression?: boolean } = {}): number {
  const tau = (TAU_BD_PLAIN[fck] ?? 1.2) * 1.6 * (opts.compression ? 1.25 : 1)
  return (phi * 0.87 * FY) / (4 * tau)
}

/** IS 456 cl 26.2.5.1(c): flexural-tension lap = max(Ld, 30 phi). Compression lap = max(Ld_c, 24 phi). */
export function lapLength(phi: number, fck: number, kind: 'tension' | 'compression'): number {
  if (kind === 'tension') return Math.max(devLength(phi, fck), 30 * phi)
  return Math.max(devLength(phi, fck, { compression: true }), 24 * phi)
}

/** Closed stirrup / tie cut length = 2(A+E) + 12d (+ the extra tail of a small bar), with 135 degree hooks and A, E out to out.
 *  DERIVED from the bar's own geometry, not read from a table: take the centre-line rectangle (2(A+E) - 4d), take off the
 *  three 90 degree corners and the two 135 degree bends at a pin radius of 2d (about 3.5d together), and add two hook tails
 *  of 10d each (IS 13920 cl 6.3.1: 10d, never under 75 mm). That is 2(A+E) - 7.5d + 20d = 2(A+E) + 12.5d, set to 12d so it
 *  agrees with the Bar Bending Schedule workbook at its 12d seismic-hook setting (within 0.5d, about 4 mm on an 8 mm bar).
 *  With a 4d pin radius the same geometry gives +9.7d, so 12d is not low. The old +24d rule was longer than the bar can be.
 *  A small bar whose 10d tail is under 75 mm gets the extra to reach 75 mm on each tail. */
export function stirrupCutLength(A: number, E: number, d: number): number {
  const extraTail = Math.max(0, 75 - 10 * d)
  return 2 * (A + E) + 12 * d + 2 * extraTail
}

/** IS 2502 cl 5.1.1: cut lengths are rounded up to the next whole 25 mm. CLEAR. */
export const roundUp25 = (mm: number) => Math.ceil(mm / 25) * 25
export const roundUpTo = (v: number, step: number) => Math.ceil(v / step - 1e-9) * step

/** Right-angle bend deduction for a bar bent with internal radius R: A + E - R/2 - d (IS 2502 Table V). RECONSTRUCTED.
 *  The model uses R = 4d for main bars, so the deduction is 3d per 90 degree bend. */
export const bendDeduction90 = (d: number) => 3 * d

/** IS 456 Table 26: two-way slab moment coefficients. Rows are ly/lx = 1.0,1.1,1.2,1.3,1.4,1.5,1.75,2.0.
 *  Cases 1-4 and 9 RECONSTRUCTED high / medium-high; case 5 medium-high; case 6 medium.
 *  Panels with three edges discontinuous use case 9 (larger coefficients: conservative). */
export const T26_RATIOS = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2.0]
export interface T26Case {
  axNeg: number[] | null
  axPos: number[]
  ayNeg: number
  ayPos: number
}
export const TABLE26: Record<number, T26Case> = {
  // 1 interior panel
  1: { axNeg: [0.032, 0.037, 0.043, 0.047, 0.051, 0.053, 0.060, 0.065], axPos: [0.024, 0.028, 0.032, 0.036, 0.039, 0.041, 0.045, 0.049], ayNeg: 0.032, ayPos: 0.024 },
  // 2 one short edge discontinuous
  2: { axNeg: [0.037, 0.043, 0.048, 0.051, 0.055, 0.057, 0.064, 0.068], axPos: [0.028, 0.032, 0.036, 0.039, 0.041, 0.044, 0.048, 0.052], ayNeg: 0.037, ayPos: 0.028 },
  // 3 one long edge discontinuous
  3: { axNeg: [0.037, 0.044, 0.052, 0.057, 0.063, 0.067, 0.077, 0.085], axPos: [0.028, 0.033, 0.039, 0.044, 0.047, 0.051, 0.059, 0.065], ayNeg: 0.037, ayPos: 0.028 },
  // 4 two adjacent edges discontinuous
  4: { axNeg: [0.047, 0.053, 0.060, 0.065, 0.071, 0.075, 0.084, 0.091], axPos: [0.035, 0.040, 0.045, 0.049, 0.053, 0.056, 0.063, 0.069], ayNeg: 0.047, ayPos: 0.035 },
  // 5 two short edges discontinuous (no negative moment in the long direction)
  5: { axNeg: [0.045, 0.049, 0.052, 0.056, 0.059, 0.060, 0.065, 0.069], axPos: [0.035, 0.037, 0.040, 0.043, 0.044, 0.045, 0.049, 0.052], ayNeg: 0, ayPos: 0.035 },
  // 6 two long edges discontinuous (no negative moment in the short direction)
  6: { axNeg: null, axPos: [0.035, 0.043, 0.051, 0.057, 0.063, 0.068, 0.080, 0.088], ayNeg: 0.045, ayPos: 0.035 },
  // 9 four edges discontinuous
  9: { axNeg: null, axPos: [0.056, 0.064, 0.072, 0.079, 0.085, 0.089, 0.100, 0.107], ayNeg: 0, ayPos: 0.056 },
}

export function t26Interp(arr: number[], ratio: number): number {
  const r = Math.min(Math.max(ratio, 1), 2)
  for (let i = 0; i < T26_RATIOS.length - 1; i++) {
    const a = T26_RATIOS[i]
    const b = T26_RATIOS[i + 1]
    if (r >= a && r <= b) return arr[i] + ((arr[i + 1] - arr[i]) * (r - a)) / (b - a)
  }
  return arr[arr.length - 1]
}

/** IS 456 Table 12 bending-moment coefficients for continuous beams (RECONSTRUCTED medium-high), dead + fixed imposed load. */
export const T12 = {
  midEnd: 1 / 12,
  midInterior: 1 / 16,
  supportNextToEnd: 1 / 10,
  supportOther: 1 / 12,
  /** Exterior support moment in a monolithic frame: ASSUMPTION wL^2/16 (IS 456 cl 22.5.2 gives wL^2/24 only for masonry-built-in ends). */
  supportEnd: 1 / 16,
}

/** IS 456 Annex G: xu,max/d. Fe500 = 0.46 (Fe415 0.48). CLEAR. */
export const XU_MAX_OVER_D = 0.46

/** Singly reinforced rectangular section, limit state (IS 456 Annex G-1.1). Units N, mm. Returns Ast in mm2 or null if Mu > Mu,lim. */
export function astSingly(Mu: number, b: number, d: number, fck: number): number | null {
  const MuLim = 0.36 * fck * b * XU_MAX_OVER_D * d * d * (1 - 0.42 * XU_MAX_OVER_D)
  if (Mu > MuLim) return null
  const k = (4.6 * Mu) / (fck * b * d * d)
  return ((0.5 * fck) / FY) * (1 - Math.sqrt(Math.max(0, 1 - k))) * b * d
}

/** Moment of resistance of a singly reinforced section for a given Ast (N.mm). */
export function momentCapacity(Ast: number, b: number, d: number, fck: number): number {
  const xuMax = XU_MAX_OVER_D * d
  let xu = (0.87 * FY * Ast) / (0.36 * fck * b)
  if (xu > xuMax) xu = xuMax
  return 0.87 * FY * Ast * (d - 0.42 * xu)
}

/** IS 456 Table 19 design shear strength, evaluated with the formula of the IS 456 commentary (SP 24):
 *  beta = 0.8 fck / (6.89 pt) >= 1;  tau_c = 0.85 sqrt(0.8 fck) (sqrt(1+5 beta) - 1) / (6 beta). DERIVED, checked against Table 19 in the validation script. */
export function tauC(fck: number, ptPercent: number): number {
  const pt = Math.min(Math.max(ptPercent, 0.15), 3)
  const beta = Math.max(1, (0.8 * fck) / (6.89 * pt))
  return (0.85 * Math.sqrt(0.8 * fck) * (Math.sqrt(1 + 5 * beta) - 1)) / (6 * beta)
}
/** IS 456 Table 20 maximum shear stress. RECONSTRUCTED. */
export const TAU_C_MAX: Record<number, number> = { 20: 2.8, 25: 3.1, 30: 3.5, 35: 3.7, 40: 4.0 }
