/*
  Small helpers shared by the trade models. Plain functions, no state, no imports from the app.
*/

export const SQFT_TO_M2 = 0.09290304
export const M2_TO_SQFT = 1 / SQFT_TO_M2

/** Round to a number of decimals. */
export function round(v: number, d = 0): number {
  const k = 10 ** d
  return Math.round(v * k) / k
}

/** Round up to a multiple. ceilTo(7.2, 0.5) = 7.5 */
export function ceilTo(v: number, step: number): number {
  return Math.ceil(v / step - 1e-9) * step
}

/** Whole pieces needed to cover a length. */
export function pieces(lengthM: number, pieceM: number): number {
  return Math.max(0, Math.ceil(lengthM / pieceM - 1e-9))
}

/** Linear interpolation across sorted [x, y] points, held flat outside the range, or extended along the last slope when `extend` is set. */
export function interp(points: ReadonlyArray<readonly [number, number]>, x: number, extend = false): number {
  const n = points.length
  if (x <= points[0][0]) return points[0][1]
  if (x >= points[n - 1][0]) {
    if (!extend) return points[n - 1][1]
    const [x0, y0] = points[n - 2]
    const [x1, y1] = points[n - 1]
    return y1 + ((x - x1) * (y1 - y0)) / (x1 - x0)
  }
  for (let i = 1; i < n; i++) {
    if (x <= points[i][0]) {
      const [x0, y0] = points[i - 1]
      const [x1, y1] = points[i]
      return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0)
    }
  }
  return points[n - 1][1]
}

/** Indian number format, no decimals unless asked. */
export const fmt = (v: number, d = 0): string =>
  v.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })

/** "12 to 18" from a figure and a band, to the same number of decimals. */
export const rangeText = (v: number, low: number, high: number, d = 0): string =>
  `${fmt(v * low, d)} to ${fmt(v * high, d)}`

/** Adds to a bucket in a map. */
export function bump<K>(m: Map<K, number>, key: K, by: number): void {
  m.set(key, (m.get(key) ?? 0) + by)
}

/* ---- reading the browser's answers -------------------------------------------------------------- */

/**
 * Reads a loose JSON object into checked values. The first problem is remembered in `error`;
 * after that every call just returns its default, so a model's parse function reads straight down
 * and checks `error` once at the end.
 */
export class Reader {
  error: string | null = null
  private o: Record<string, unknown>

  constructor(raw: unknown) {
    this.o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  }

  private fail(msg: string) {
    if (!this.error) this.error = msg
  }

  int(name: string, label: string, min: number, max: number, def: number): number {
    const v = this.o[name]
    if (v === undefined || v === null || v === '') return def
    const n = Number(v)
    if (!Number.isFinite(n) || Math.round(n) !== n || n < min || n > max) {
      this.fail(`${label} must be a whole number from ${min} to ${max}.`)
      return def
    }
    return n
  }

  num(name: string, label: string, min: number, max: number, def: number): number {
    const v = this.o[name]
    if (v === undefined || v === null || v === '') return def
    const n = Number(v)
    if (!Number.isFinite(n) || n < min || n > max) {
      this.fail(`${label} must be between ${min} and ${max}.`)
      return def
    }
    return n
  }

  optNum(name: string, label: string, min: number, max: number): number | undefined {
    const v = this.o[name]
    if (v === undefined || v === null || v === '') return undefined
    const n = Number(v)
    if (!Number.isFinite(n) || n < min || n > max) {
      this.fail(`${label} must be between ${min} and ${max}.`)
      return undefined
    }
    return n
  }

  pick<T extends string>(name: string, label: string, options: readonly T[], def: T): T {
    const v = this.o[name]
    if (v === undefined || v === null || v === '') return def
    if (typeof v === 'string' && (options as readonly string[]).includes(v)) return v as T
    this.fail(`${label} is not one of the choices we offer.`)
    return def
  }

  bool(name: string, def: boolean): boolean {
    const v = this.o[name]
    if (v === undefined || v === null || v === '') return def
    if (typeof v === 'boolean') return v
    if (v === 'true') return true
    if (v === 'false') return false
    this.fail('A yes/no answer was not understood.')
    return def
  }

  text(name: string, max = 80): string {
    const v = this.o[name]
    return typeof v === 'string' ? v.trim().slice(0, max) : ''
  }

  /** The built-up area of each floor above ground. 1 to 10 floors, each 100 to 30,000 sq ft. */
  floors(): number[] {
    const v = this.o.floorAreasSqft
    if (!Array.isArray(v) || v.length < 1 || v.length > 10) {
      this.fail('Give the built-up area of each floor (1 to 10 floors).')
      return [1000]
    }
    const a = v.map(Number)
    if (a.some((x) => !Number.isFinite(x) || x < 100 || x > 30000)) {
      this.fail('Each floor area must be between 100 and 30,000 sq ft.')
      return [1000]
    }
    return a
  }

  /** The state is required; the city is optional. */
  place(): { state: string; city?: string } {
    const state = this.text('state', 60)
    if (!state) this.fail('State is required.')
    const city = this.text('city', 60)
    return { state, city: city || undefined }
  }
}
