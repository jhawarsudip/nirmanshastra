// Dog-legged RCC staircase: two equal flights and a mid-landing per storey, waist slab designed as simply supported (IS 456 cl 33).
// Dimensions are residential defaults (IS 875 Part 2: stairs 3.0 kN/m2): riser 150 mm, tread 250 mm, flight width 1.0 m.

import { COVER_SLAB, GAMMA_RC, astSingly, barArea } from './codes'
import { SteelBook } from './steel'

/** The rules of the stair design, kept in one place so the calculation sheet reads the same values the design uses. */
export const STAIR_RULES = {
  riser: 0.15,
  tread: 0.25,
  width: 1.0,
  gap: 0.1,
  landing: 1.05,
  /** effective span = tread run plus this much (half a landing support) */
  supportAllowM: 0.25,
  basicSpanDepth: 20,
  modificationFactor: 1.2,
  waistMinMm: 125,
  roundStepMm: 25,
  /** bar half-diameter allowance added to cover when the waist is found */
  halfBarMm: 6,
  finishKN: 1.0,
  imposedKN: 3.0,
  minSteelRatio: 0.0012,
  barPhis: [10, 12, 16],
  spacingStep: 25,
  spacingMin: 100,
  spacingCap: 150,
  anchorMm: 600,
  distPhi: 8,
  distSpacingMm: 200,
  endAllowMm: 50,
  edgeAllowMm: 100,
  landingPhi: 10,
  landingSpacingMm: 150,
  landingThicknessM: 0.15,
  /** flight sides: waist plus this much (m) for the step profile */
  sideExtraM: 0.12,
} as const

export interface StairResult {
  storeys: number
  concreteM3: number
  formworkM2: number
  steelKg: number
  wellLengthM: number
  wellWidthM: number
  wellAreaM2: number
  waistMm: number
  detail: StairDetail
}

/** One bar group of the stair, as it was added to the steel record. */
export interface StairBarLine {
  note: string
  phi: number
  lengthMm: number
  count: number
  kg: number
}

/** Intermediate values of the stair design, kept so that a calculation sheet can show the working. Nothing here feeds back into the design. */
export interface StairDetail {
  storeyHeight: number
  fck: number
  risersRaw: number
  risersPerFlight: number
  treads: number
  run: number
  rise: number
  sloped: number
  span: number
  waistRaw: number
  waist: number
  cosFactor: number
  deadWaist: number
  deadSteps: number
  dead: number
  wu: number
  M: number
  d: number
  minAst: number
  astFlex: number | null
  ast: number
  main: { phi: number; s: number }
  tried: { phi: number; s: number }[]
  flights: number
  widthMm: number
  landingWidthMm: number
  landingLengthMm: number
  lines: StairBarLine[]
  stepsPerFlight: number
  flightVolWaist: number
  flightVolSteps: number
  flightVol: number
  landingVol: number
  formParts: { soffit: number; risers: number; sides: number; landingSoffit: number; landingEdges: number }
  formPerStorey: number
}

export function designStair(storeys: number, storeyHeight: number, fck: number, book: SteelBook, group: string): StairResult {
  const R = STAIR_RULES.riser
  const T = STAIR_RULES.tread
  const risersRaw = storeyHeight / R / 2
  const risersPerFlight = Math.round(risersRaw)
  const treads = risersPerFlight - 1
  const run = treads * T
  const rise = risersPerFlight * R
  const sloped = Math.hypot(run, rise)
  const width = STAIR_RULES.width
  const gap = STAIR_RULES.gap
  const landing = STAIR_RULES.landing
  const span = run + STAIR_RULES.supportAllowM // effective horizontal span: tread run plus half a landing support
  const waistRaw = (span * 1000) / (STAIR_RULES.basicSpanDepth * STAIR_RULES.modificationFactor)
  const waist = Math.max(STAIR_RULES.waistMinMm, Math.ceil((waistRaw + COVER_SLAB + STAIR_RULES.halfBarMm) / STAIR_RULES.roundStepMm) * STAIR_RULES.roundStepMm)
  const cosFactor = sloped / run
  const deadWaist = GAMMA_RC * (waist / 1000) * cosFactor
  const deadSteps = GAMMA_RC * 0.5 * R
  const dead = deadWaist + deadSteps + STAIR_RULES.finishKN
  const wu = 1.5 * (dead + STAIR_RULES.imposedKN)
  const M = (wu * span * span) / 8
  const d = waist - COVER_SLAB - STAIR_RULES.halfBarMm
  const minAst = STAIR_RULES.minSteelRatio * 1000 * waist
  const astFlex = astSingly(M * 1e6, 1000, d, fck)
  const ast = Math.max(minAst, astFlex ?? (M * 1e6) / (0.87 * 500 * 0.85 * d))
  const tried: { phi: number; s: number }[] = []
  const pick = (a: number) => {
    for (const phi of STAIR_RULES.barPhis) {
      const s = Math.floor(((barArea(phi) * 1000) / a) / STAIR_RULES.spacingStep) * STAIR_RULES.spacingStep
      tried.push({ phi, s })
      if (s >= STAIR_RULES.spacingMin) return { phi, s: Math.min(s, STAIR_RULES.spacingCap) } // site-practice ASSUMPTION: 150 mm cap
    }
    return { phi: 16, s: 100 }
  }
  const main = pick(ast)
  const widthMm = width * 1000
  const flights = 2 * storeys
  let kg = 0
  const lines: StairBarLine[] = []
  const add = (note: string, phi: number, lengthMm: number, count: number): number => {
    const k = book.add(group, phi, lengthMm, count, note)
    lines.push({ note, phi, lengthMm, count, kg: k })
    return k
  }
  // main bars along the flight, anchored 300 mm into each landing
  kg += add('main bars along the flights', main.phi, sloped * 1000 + STAIR_RULES.anchorMm, flights * (Math.floor((widthMm - STAIR_RULES.edgeAllowMm) / main.s) + 1))
  // distribution bars 8 mm @ 200 (>= 0.12 % of the waist section)
  kg += add('distribution bars across the flights', STAIR_RULES.distPhi, widthMm - STAIR_RULES.endAllowMm, flights * (Math.floor((sloped * 1000) / STAIR_RULES.distSpacingMm) + 1))
  // mid-landing: 10 mm @ 150 each way
  const lw = (width * 2 + gap) * 1000
  const ll = landing * 1000
  kg += add('landing bars along the landing length', STAIR_RULES.landingPhi, ll - STAIR_RULES.endAllowMm, storeys * (Math.floor((lw - STAIR_RULES.edgeAllowMm) / STAIR_RULES.landingSpacingMm) + 1))
  kg += add('landing bars along the landing width', STAIR_RULES.landingPhi, lw - STAIR_RULES.endAllowMm, storeys * (Math.floor((ll - STAIR_RULES.edgeAllowMm) / STAIR_RULES.landingSpacingMm) + 1))

  const stepsPerFlight = risersPerFlight
  const flightVolWaist = sloped * width * (waist / 1000)
  const flightVolSteps = stepsPerFlight * 0.5 * R * T * width
  const flightVol = flightVolWaist + flightVolSteps
  const landingVol = landing * (width * 2 + gap) * STAIR_RULES.landingThicknessM
  const concrete = storeys * (2 * flightVol + landingVol)
  const formParts = {
    soffit: 2 * (sloped * width), // soffit
    risers: 2 * stepsPerFlight * R * width, // risers
    sides: 4 * sloped * (waist / 1000 + STAIR_RULES.sideExtraM), // flight sides
    landingSoffit: landing * (width * 2 + gap), // landing soffit
    landingEdges: 2 * (landing + width * 2 + gap) * STAIR_RULES.landingThicknessM, // landing edges
  }
  const formPerStorey = formParts.soffit + formParts.risers + formParts.sides + formParts.landingSoffit + formParts.landingEdges
  return {
    storeys,
    concreteM3: concrete,
    formworkM2: storeys * formPerStorey,
    steelKg: kg,
    wellLengthM: run + landing,
    wellWidthM: width * 2 + gap,
    wellAreaM2: (run + landing) * (width * 2 + gap),
    waistMm: waist,
    detail: {
      storeyHeight, fck, risersRaw, risersPerFlight, treads, run, rise, sloped, span, waistRaw, waist, cosFactor, deadWaist, deadSteps, dead, wu, M, d, minAst, astFlex, ast,
      main, tried, flights, widthMm, landingWidthMm: lw, landingLengthMm: ll, lines, stepsPerFlight, flightVolWaist, flightVolSteps, flightVol, landingVol, formParts, formPerStorey,
    },
  }
}
