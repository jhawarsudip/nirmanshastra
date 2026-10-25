// Bar-bending bookkeeping: every bar is added with its cut length, rounded up to 25 mm (IS 2502 cl 5.1.1).

import { barArea, barMass, roundUp25 } from './codes'

export class SteelBook {
  byGroup: Record<string, number> = {}
  detail: Record<string, Record<number, number>> = {}
  /** Add `count` bars of diameter phi (mm) and cut length lengthMm to member group `group`. Returns kg added. */
  add(group: string, phi: number, lengthMm: number, count = 1): number {
    if (count <= 0 || lengthMm <= 0) return 0
    const kg = barMass(phi) * (roundUp25(lengthMm) / 1000) * count
    this.byGroup[group] = (this.byGroup[group] ?? 0) + kg
    const d = (this.detail[group] ??= {})
    d[phi] = (d[phi] ?? 0) + kg
    return kg
  }
  /** Multiply everything recorded under `group` by `f` (used to correct a floor's modelled bays to the entered floor area). */
  scale(group: string, f: number): void {
    if (this.byGroup[group] === undefined) return
    this.byGroup[group] *= f
    for (const p of Object.keys(this.detail[group])) this.detail[group][Number(p)] *= f
  }
  byPhi(prefix = ''): Record<number, number> {
    const out: Record<number, number> = {}
    for (const [g, m] of Object.entries(this.detail)) {
      if (!g.startsWith(prefix)) continue
      for (const [p, kg] of Object.entries(m)) out[Number(p)] = (out[Number(p)] ?? 0) + kg
    }
    return out
  }
  total(): number {
    return Object.values(this.byGroup).reduce((s, v) => s + v, 0)
  }
  group(prefix: string): number {
    return Object.entries(this.byGroup).reduce((sum, [g, v]) => (g.startsWith(prefix) ? sum + v : sum), 0)
  }
}

/** Largest number of bars of diameter phi that fit in one layer of a beam of width b (mm): cover 25 + stirrup 8 each side, clear spacing >= max(phi, 25). */
export function barsPerLayer(b: number, phi: number): number {
  const s = Math.max(phi, 25)
  const usable = b - 2 * (25 + 8)
  return Math.max(2, Math.floor((usable + s) / (phi + s)))
}

/** Choose a bar diameter and count to give at least `req` mm2 in one layer. Smaller diameters are preferred unless there are too many bars. */
export function pickBars(req: number, b: number, minN = 2, minPhi = 12): { phi: number; n: number; area: number } {
  const options = [12, 16, 20, 25, 32].filter((p) => p >= minPhi)
  for (const phi of options) {
    const n = Math.max(minN, Math.ceil(req / barArea(phi)))
    // site practice: not more than 4 bars in a layer of a 230 mm beam, and 12 mm bars only for the lightly stressed positions
    if (n <= Math.min(barsPerLayer(b, phi), b <= 230 ? 4 : 5)) return { phi, n, area: n * barArea(phi) }
  }
  const phi = 32
  const n = Math.max(minN, Math.ceil(req / barArea(phi)))
  return { phi, n, area: n * barArea(phi) }
}

/** Number of stirrups in a clear span: first stirrup `first` mm from the face, closer spacing `sEnd` over `zone` mm at each end, `sMid` elsewhere. */
export function countStirrups(clear: number, zone: number, sEnd: number, sMid: number, first = 50): number {
  const z = Math.min(zone, clear / 2)
  const perEnd = Math.floor(Math.max(0, z - first) / sEnd) + 1
  const mid = clear - 2 * z
  const nMid = mid > 0 ? Math.max(0, Math.ceil(mid / sMid) - 1) : 0
  return 2 * perEnd + nMid
}

/** Splice laps for a bar line longer than the 12 m stock length (CPWD DAR 5.22.1 buys 12 m bars). Returns the number of splices. */
export function splices(totalLengthMm: number): number {
  return Math.max(0, Math.ceil(totalLengthMm / 12000) - 1)
}
