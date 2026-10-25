// The brick and block tables of MasonryPro and the formulas that turn a wall into a count of units and a volume of joint
// mortar. Kept in a file of its own: the free Brick Calculator and the home page's brick lab are client code and import
// this, and they must not load the whole model (its coefficients, its run and its calculation sheet) with it.

export type MasonSystem = 'brick' | 'modular' | 'flyash' | 'aac' | 'block'

/** Joint thickness for bricks and blocks, in metres (IS 6041 cl 7.1; IS 2572 cl 11.1.4; IS 2212 cl 6.4.1 allows up to 12 mm: that clause number was not re-read against the published text). */
export const J = 0.01
/** Thin-bed adhesive joint for AAC blocks, in metres. */
export const J_THIN = 0.003

export interface Sys {
  key: MasonSystem
  label: string
  unit: string
  unitsLabel: string
  kind: 'brick' | 'block'
  /** length, width, height of a brick (m); for blocks length and height of the face and width unused */
  L: number
  W: number
  H: number
  /** wall thickness for a one-brick (or thick block) outer wall, and the thin alternative, and for a partition (m) */
  ext: number
  extThin?: number
  int: number
  size: string
  /** fraction added for breakage and cutting */
  loss: number
  source: string
  /** the actual block is 10 mm thinner than its nominal thickness (IS 2185 (Part 1):2005 cl 4.2: nominal includes the joint) */
  short?: boolean
}

export const SYSTEMS: Record<MasonSystem, Sys> = {
  brick: { key: 'brick', label: 'Red clay brick', unit: 'brick', unitsLabel: 'bricks', kind: 'brick', L: 0.23, W: 0.115, H: 0.075, ext: 0.23, int: 0.115, size: '230 × 115 × 75 mm', loss: 0.05, source: 'The common field size of red bricks. It is not a BIS size, and it varies from kiln to kiln.' },
  modular: { key: 'modular', label: 'Modular clay brick', unit: 'brick', unitsLabel: 'bricks', kind: 'brick', L: 0.19, W: 0.09, H: 0.09, ext: 0.19, int: 0.09, size: '190 × 90 × 90 mm', loss: 0.05, source: 'IS 1077:1992 cl 6.1.1' },
  flyash: { key: 'flyash', label: 'Fly-ash brick', unit: 'brick', unitsLabel: 'bricks', kind: 'brick', L: 0.23, W: 0.11, H: 0.07, ext: 0.23, int: 0.11, size: '230 × 110 × 70 mm', loss: 0.05, source: 'IS 12894:2002 cl 5.1.2' },
  aac: { key: 'aac', label: 'AAC block', unit: 'block', unitsLabel: 'blocks', kind: 'block', L: 0.6, W: 0, H: 0.2, ext: 0.2, extThin: 0.15, int: 0.1, size: '600 × 200 mm face', loss: 0.04, source: 'IS 2185 (Part 3) cl 3.2 and maker data: face 600 × 200 mm, thickness 100 to 300 mm' },
  block: { key: 'block', label: 'Concrete block', unit: 'block', unitsLabel: 'blocks', kind: 'block', L: 0.4, W: 0, H: 0.2, ext: 0.2, extThin: 0.15, int: 0.1, size: '400 × 200 mm face', loss: 0.04, short: true, source: 'IS 2185 (Part 1) cl 4.2.1: 400 × 200 mm face' },
}

/** Units in one m² of wall of thickness t (m). Bricks: one over the pitch in all three directions times the nominal thickness. */
export function unitsPerM2(s: Sys, t: number, thin: boolean): number {
  if (s.kind === 'brick') return (t + J) / ((s.L + J) * (s.W + J) * (s.H + J))
  return thin ? 1 / ((s.L + J_THIN) * (s.H + J_THIN)) : 1 / (s.L * s.H)
}

/** Joint mortar in one m² of wall, as the exact volume of the joints (m³). Zero for thin-bed adhesive, which is counted in kg. */
export function jointMortarPerM2(s: Sys, t: number, thin: boolean): number {
  if (thin) return 0
  const n = unitsPerM2(s, t, false)
  if (s.kind === 'brick') return Math.max(0, t - n * s.L * s.W * s.H)
  // blocks: nominal size includes the joint; the block itself is 10 mm short of nominal in length and height (IS 2185 (Part 1):2005 cl 4.2),
  // and a concrete block is 10 mm short in thickness too
  const ta = s.short ? t - J : t
  return Math.max(0, ta * (1 - n * (s.L - J) * (s.H - J)))
}

/** Extra mortar over the exact joint volume for uneven bricks, frogs, droppings and waste. Assumed: no standard gives it. */
export const MORTAR_ALLOW = 1.25
/** Thin-bed adhesive, kg per m³ of wall. Derived from the joint volume (28 to 32) and the makers' coverage (24 to 40). */
export const ADHESIVE_KG_PER_M3 = 33
export const ADHESIVE_BAG_KG = 40

/** Cement per m³ of mortar (kg) for 1:X, calibrated to the CPWD DAR 2014 plaster yield of 513 kg for 1:3; sand is 1.069 m³. */
export const DAR_FACTOR = 1.069
/** Loose bulk density of cement, kg per m³ (the 1,440 in 1,440 ÷ mix). Assumed: the usual figure in rate analyses. */
export const CEMENT_BULK_KG_M3 = 1440
/** The CPWD DAR 2014 cement for a m³ of 1:3 plaster mortar, kg: the figure DAR_FACTOR is calibrated to (513 ÷ 480 = 1.069). */
export const DAR_1_3_CEMENT_KG = 513
export const CEMENT_KG_PER_M3 = (mix: number) => (CEMENT_BULK_KG_M3 / mix) * DAR_FACTOR
export const SAND_M3_PER_M3 = DAR_FACTOR
export const CEMENT_BAG_KG = 50
