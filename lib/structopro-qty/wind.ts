// Wind on the frame, IS 875 (Part 3). Used as a check beside the earthquake force: the design takes the LARGER of the two at each storey and never adds them
// (IS 1893 (Part 1):2002 cl 6.2(b): an earthquake is not taken to occur together with the design wind).
//
// Source status, in the words used across the model:
//   CLEAR          read in the BIS text of IS 875 (Part 3):1987 (law.resource.org copy). Design speed Vz = Vb k1 k2 k3, pressure pz = 0.6 Vz^2 (cl 5.3, 5.4),
//                  k1 = 1.00 for a 50-year house, k3 = 1.0 on level ground, k2 for Class A (largest dimension under 20 m) Category 2 and 3 (Table 2).
//   RECONSTRUCTED  the wall pressure coefficients of Table 4: the scan is garbled, the windward / leeward pairs were rebuilt from two independent copies.
//   SECONDARY      the city table of basic wind speeds (Vb): the map (Fig. 1 / Appendix A) was not readable; the values come from one aggregator and from
//                  engineering practice. Every Vb below is therefore a figure to confirm, and the state values are deliberately on the high side.
//   ASSUMPTION     terrain category 2 (open, the basis of Vb: the higher of the two usual choices), no hill factor, 1987 pressure (no 0.9 directionality factor).
// The check never lowers a design. It can only raise the lateral force where wind exceeds the earthquake force.

import type { Plan } from './plan'

export type TerrainCategory = 2 | 3

export interface WindSpeed {
  vb: number // m/s, 3-second gust at 10 m, terrain category 2, 50-year return
  basis: 'city' | 'state'
  place: string
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

/** SECONDARY: basic wind speed for cities (m/s). Where two sources disagree the higher figure is used. */
const VB_CITY: Record<string, number> = {
  // 33
  bangalore: 33,
  // 39
  pune: 39, ahmedabad: 39, bhopal: 39, 'dehra dun': 39, simla: 39, srinagar: 39, thiruvananthapuram: 39, kochi: 39, panjim: 39, ranchi: 39, raipur: 39, indore: 39,
  // 44
  mumbai: 44, thane: 44, hyderabad: 44, nagpur: 44, surat: 44,
  // 47 (Jaipur and Chandigarh are 39 in the aggregator; 47 is used, the cautious reading)
  delhi: 47, lucknow: 47, patna: 47, jaipur: 47, chandigarh: 47,
  // 50
  chennai: 50, kolkata: 50, guwahati: 50, bhubaneswar: 50, visakhapatnam: 50,
}

const CITY_ALIAS: Record<string, string> = {
  bengaluru: 'bangalore', bombay: 'mumbai', madras: 'chennai', calcutta: 'kolkata', trivandrum: 'thiruvananthapuram', shimla: 'simla',
  dehradun: 'dehra dun', 'dehra-dun': 'dehra dun', cochin: 'kochi', ernakulam: 'kochi', panaji: 'panjim', vizag: 'visakhapatnam',
  gurgaon: 'delhi', gurugram: 'delhi', noida: 'delhi', 'new delhi': 'delhi', ghaziabad: 'delhi', faridabad: 'delhi',
  thiruvanantapuram: 'thiruvananthapuram', bhubaneshwar: 'bhubaneswar', gauhati: 'guwahati', vishakhapatnam: 'visakhapatnam',
}

/** ASSUMPTION: a cautious basic wind speed for a state when the town is not in the city table (the highest zone speed the state commonly sits in). */
const VB_STATE: Record<string, number> = {
  'Andhra Pradesh': 50, 'Arunachal Pradesh': 47, Assam: 50, Bihar: 47, Chhattisgarh: 39, Goa: 39, Gujarat: 50, Haryana: 47,
  'Himachal Pradesh': 39, Jharkhand: 39, Karnataka: 39, Kerala: 39, 'Madhya Pradesh': 39, Maharashtra: 44, Manipur: 47, Meghalaya: 50,
  Mizoram: 50, Nagaland: 50, Odisha: 50, Punjab: 47, Rajasthan: 47, Sikkim: 50, 'Tamil Nadu': 50, Telangana: 44, Tripura: 50,
  'Uttar Pradesh': 47, Uttarakhand: 47, 'West Bengal': 50, 'Andaman and Nicobar Islands': 50, Chandigarh: 47,
  'Dadra and Nagar Haveli and Daman and Diu': 44, Delhi: 47, 'Jammu and Kashmir': 39, Ladakh: 39, Lakshadweep: 39, Puducherry: 50,
}

export function basicWindSpeed(state: string, city?: string): WindSpeed {
  const c = city ? norm(city) : ''
  const key = CITY_ALIAS[c] ?? c
  if (key && VB_CITY[key] !== undefined) return { vb: VB_CITY[key], basis: 'city', place: city!.trim() }
  return { vb: VB_STATE[state] ?? 50, basis: 'state', place: state }
}

/** IS 875 (Part 3):1987 Table 2, Class A, terrain categories 2 and 3 (CLEAR). Heights 10, 15, 20, 30 m. */
export const K2_HEIGHTS = [10, 15, 20, 30]
export const K2_CLASS_A: Record<TerrainCategory, number[]> = {
  2: [1.0, 1.05, 1.07, 1.12],
  3: [0.91, 0.97, 1.01, 1.06],
}

/** k2 at height z (m): constant up to 10 m, linear between table heights (Table 2 Note 2), held at the 30 m value above 30 m. */
export function k2At(z: number, cat: TerrainCategory = 2): number {
  const t = K2_CLASS_A[cat]
  if (z <= K2_HEIGHTS[0]) return t[0]
  for (let i = 0; i < K2_HEIGHTS.length - 1; i++) {
    if (z <= K2_HEIGHTS[i + 1]) return t[i] + ((t[i + 1] - t[i]) * (z - K2_HEIGHTS[i])) / (K2_HEIGHTS[i + 1] - K2_HEIGHTS[i])
  }
  return t[t.length - 1]
}

/** Design wind pressure, kN/m2: pz = 0.6 Vz^2 (cl 5.4), Vz = Vb k1 k2 k3 with k1 = k3 = 1 (CLEAR for the formula; k1 = 1.0 is the 50-year house value). */
export const windPressure = (vb: number, z: number, cat: TerrainCategory = 2): number => {
  const vz = vb * k2At(z, cat)
  return (0.6 * vz * vz) / 1000
}

/**
 * Net pressure coefficient on a rectangular building (windward + leeward wall), from IS 875 (Part 3):1987 Table 4. RECONSTRUCTED.
 * Rows are h/w <= 1/2, 1/2 to 3/2, 3/2 to 6 and columns l/w 1 to 3/2, 3/2 to 4 (h = height, w = shorter side, l = longer side).
 * Per row the windward value and the larger leeward suction of the two wind angles are added, which is on the cautious side.
 * Outside the table the nearest row is used (ASSUMPTION).
 */
export function netPressureCoeff(h: number, l: number, w: number): number {
  return netPressureDetail(h, l, w).ct
}

/** The Table 4 pair behind `netPressureCoeff`: the row and column used, the windward coefficient, the leeward suction and their sum. */
export function netPressureDetail(h: number, l: number, w: number): { hw: number; lw: number; row: number; col: number; windward: number; leeward: number; ct: number } {
  const hw = h / w
  const lw = l / w
  const row = hw <= 0.5 ? 0 : hw <= 1.5 ? 1 : 2
  const col = lw <= 1.5 ? 0 : 1
  const T = [
    [[0.7, 0.2], [0.7, 0.25]],
    [[0.7, 0.25], [0.7, 0.3]],
    [[0.8, 0.25], [0.7, 0.4]],
  ]
  const [windward, leeward] = T[row][col]
  return { hw, lw, row, col, windward, leeward, ct: windward + leeward }
}

export interface WindShears {
  /** storey shear V_k in storey k (between level k-1 and level k) for wind blowing along x and along y, kN */
  x: number[]
  y: number[]
  ct: number
  pzRoof: number
  roofHeightM: number
  terrain: TerrainCategory
  slender: boolean
  tall: boolean
}

/** Wind forces on every level and the storey shears they give. Tributary heights run from mid-storey to mid-storey; the roof level carries a 1 m parapet.
 *  With an open first storey (stilt) the lower half of that storey has no wall to catch the wind, so only the half above level 0 counts there. */
export function windShears(plan: Plan, vb: number, terrain: TerrainCategory = 2, parapetM = 1.0, openFirst = false): WindShears {
  const F = plan.F
  const h = plan.floors.map((f) => f.zTop)
  const H = h[F - 1]
  const w = Math.min(plan.L, plan.W)
  const l = Math.max(plan.L, plan.W)
  const ct = netPressureCoeff(H, l, w)
  const fx: number[] = [] // force on level k when the wind blows along x (acts on the face of width W)
  const fy: number[] = []
  for (let k = 0; k < F; k++) {
    const below = k === 0 ? 0 : h[k - 1]
    const above = k === F - 1 ? h[k] + 2 * parapetM : h[k + 1]
    const trib = (k === 0 && openFirst ? 0 : (h[k] - below) / 2) + (above - h[k]) / 2
    const p = windPressure(vb, h[k], terrain) * ct
    const f = plan.floors[k]
    fx.push(p * trib * f.ny * plan.sy)
    fy.push(p * trib * f.nx * plan.sx)
  }
  const cum = (a: number[]) => {
    const V = new Array(F).fill(0)
    for (let k = F - 1; k >= 0; k--) V[k] = a[k] + (k < F - 1 ? V[k + 1] : 0)
    return V
  }
  return { x: cum(fx), y: cum(fy), ct, pzRoof: windPressure(vb, H, terrain), roofHeightM: H, terrain, slender: H / w >= 5, tall: H > 30 }
}
