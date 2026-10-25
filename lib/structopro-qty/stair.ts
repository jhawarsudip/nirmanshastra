// Dog-legged RCC staircase: two equal flights and a mid-landing per storey, waist slab designed as simply supported (IS 456 cl 33).
// Dimensions are residential defaults (IS 875 Part 2: stairs 3.0 kN/m2): riser 150 mm, tread 250 mm, flight width 1.0 m.

import { COVER_SLAB, GAMMA_RC, astSingly, barArea } from './codes'
import { SteelBook } from './steel'

export interface StairResult {
  storeys: number
  concreteM3: number
  formworkM2: number
  steelKg: number
  wellLengthM: number
  wellWidthM: number
  wellAreaM2: number
  waistMm: number
}

export function designStair(storeys: number, storeyHeight: number, fck: number, book: SteelBook, group: string): StairResult {
  const R = 0.15
  const T = 0.25
  const risersPerFlight = Math.round(storeyHeight / R / 2)
  const treads = risersPerFlight - 1
  const run = treads * T
  const rise = risersPerFlight * R
  const sloped = Math.hypot(run, rise)
  const width = 1.0
  const gap = 0.1
  const landing = 1.05
  const span = run + 0.25 // effective horizontal span: tread run plus half a landing support
  const waist = Math.max(125, Math.ceil((((span * 1000) / (20 * 1.2)) + COVER_SLAB + 6) / 25) * 25)
  const cosFactor = sloped / run
  const dead = GAMMA_RC * (waist / 1000) * cosFactor + GAMMA_RC * 0.5 * R + 1.0
  const wu = 1.5 * (dead + 3.0)
  const M = (wu * span * span) / 8
  const d = waist - COVER_SLAB - 6
  const minAst = 0.0012 * 1000 * waist
  const ast = Math.max(minAst, astSingly(M * 1e6, 1000, d, fck) ?? (M * 1e6) / (0.87 * 500 * 0.85 * d))
  const pick = (a: number) => {
    for (const phi of [10, 12, 16]) {
      const s = Math.floor(((barArea(phi) * 1000) / a) / 25) * 25
      if (s >= 100) return { phi, s: Math.min(s, 150) } // site-practice ASSUMPTION: 150 mm cap
    }
    return { phi: 16, s: 100 }
  }
  const main = pick(ast)
  const widthMm = width * 1000
  const flights = 2 * storeys
  let kg = 0
  // main bars along the flight, anchored 300 mm into each landing
  kg += book.add(group, main.phi, sloped * 1000 + 600, flights * (Math.floor((widthMm - 100) / main.s) + 1))
  // distribution bars 8 mm @ 200 (>= 0.12 % of the waist section)
  kg += book.add(group, 8, widthMm - 50, flights * (Math.floor((sloped * 1000) / 200) + 1))
  // mid-landing: 10 mm @ 150 each way
  const lw = (width * 2 + gap) * 1000
  const ll = landing * 1000
  kg += book.add(group, 10, ll - 50, storeys * (Math.floor((lw - 100) / 150) + 1))
  kg += book.add(group, 10, lw - 50, storeys * (Math.floor((ll - 100) / 150) + 1))

  const stepsPerFlight = risersPerFlight
  const flightVol = sloped * width * (waist / 1000) + stepsPerFlight * 0.5 * R * T * width
  const landingVol = landing * (width * 2 + gap) * 0.15
  const concrete = storeys * (2 * flightVol + landingVol)
  const formPerStorey =
    2 * (sloped * width) + // soffit
    2 * stepsPerFlight * R * width + // risers
    4 * sloped * (waist / 1000 + 0.12) + // flight sides
    landing * (width * 2 + gap) + // landing soffit
    2 * (landing + width * 2 + gap) * 0.15 // landing edges
  return {
    storeys,
    concreteM3: concrete,
    formworkM2: storeys * formPerStorey,
    steelKg: kg,
    wellLengthM: run + landing,
    wellWidthM: width * 2 + gap,
    wellAreaM2: (run + landing) * (width * 2 + gap),
    waistMm: waist,
  }
}
