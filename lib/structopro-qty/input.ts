import type { QtyInput, SiteCondition, WallType } from './types'

// One place that turns a browser request body OR a saved estimate row into a QtyInput.
// Every server route (calculate, report, PDF, Grand Total) reads the input through here, so a new question
// can never be dropped by one route while another keeps it (which would make the free summary and the paid
// report disagree).

export const SITE_OPTIONS: SiteCondition[] = ['flat', 'sloped_mild', 'sloped_steep', 'rocky', 'bcs', 'soft_marshy', 'waterlogged', 'coastal']
export const WALL_OPTIONS: WallType[] = ['brick', 'block']
export const BALCONY_DEPTHS = [1.0, 1.2, 1.5] as const

type Raw = Record<string, unknown> | null | undefined

const num = (v: unknown): number | undefined => (v === undefined || v === null || v === '' ? undefined : Number(v))

/** Strict reader for a request from the browser. Returns an error message in plain words, or the input. */
export function readInput(raw: Raw): { ok: true; input: QtyInput } | { ok: false; error: string } {
  const r = raw ?? {}

  const areas: unknown = r.floorAreasSqft
  if (!Array.isArray(areas) || areas.length < 1 || areas.length > 10) return { ok: false, error: 'Give the built-up area of each floor (1 to 10 floors).' }
  const floorAreasSqft = areas.map(Number)
  if (floorAreasSqft.some((a) => !Number.isFinite(a) || a < 100 || a > 30000)) return { ok: false, error: 'Each floor area must be between 100 and 30,000 sq ft.' }

  const state = typeof r.state === 'string' ? r.state.trim() : ''
  const city = typeof r.city === 'string' ? r.city.trim() : ''
  if (!state) return { ok: false, error: 'State is required.' }

  const site = (r.site ?? 'flat') as SiteCondition
  if (!SITE_OPTIONS.includes(site)) return { ok: false, error: 'Unknown site condition.' }
  const wall = (r.wall ?? 'brick') as WallType
  if (!WALL_OPTIONS.includes(wall)) return { ok: false, error: 'Unknown wall type.' }

  const plotLengthFt = num(r.plotLengthFt)
  const plotWidthFt = num(r.plotWidthFt)
  if ((plotLengthFt !== undefined && !(plotLengthFt >= 10 && plotLengthFt <= 1000)) || (plotWidthFt !== undefined && !(plotWidthFt >= 10 && plotWidthFt <= 1000))) {
    return { ok: false, error: 'Plot sides must be between 10 and 1000 ft.' }
  }

  const stilt = r.stilt === true
  const balconiesRaw = num(r.balconies)
  if (balconiesRaw !== undefined && !(Number.isInteger(balconiesRaw) && balconiesRaw >= 0 && balconiesRaw <= 4)) {
    return { ok: false, error: 'Balconies per floor must be between 0 and 4.' }
  }
  const balconies = balconiesRaw && balconiesRaw > 0 ? balconiesRaw : undefined
  const depthRaw = num(r.balconyDepthM)
  if (depthRaw !== undefined && !(BALCONY_DEPTHS as readonly number[]).includes(depthRaw)) {
    return { ok: false, error: 'A balcony may project 1.0, 1.2 or 1.5 m.' }
  }

  return {
    ok: true,
    input: {
      floorAreasSqft,
      state,
      city: city || undefined,
      site,
      wall,
      plotLengthFt,
      plotWidthFt,
      terraceAccess: r.terraceAccess === false ? false : true,
      ...(stilt ? { stilt: true } : {}),
      ...(balconies ? { balconies, balconyDepthM: depthRaw ?? 1.2 } : {}),
    },
  }
}

/**
 * Lenient reader for a SAVED estimate (input_data was validated when it was stored). Falls back to the
 * estimate row's own state and city for older rows. The model itself still validates what it receives.
 */
export function savedInput(raw: Raw, fallback?: { state?: string | null; city?: string | null }): QtyInput {
  const r = raw ?? {}
  const state = (typeof r.state === 'string' && r.state.trim() ? r.state : fallback?.state ?? '').toString().trim()
  const city = (typeof r.city === 'string' && r.city.trim() ? r.city : fallback?.city ?? '').toString().trim()
  const balconies = num(r.balconies)
  const depth = num(r.balconyDepthM)
  return {
    floorAreasSqft: (Array.isArray(r.floorAreasSqft) ? r.floorAreasSqft : []).map(Number),
    state,
    city: city || undefined,
    site: (r.site as SiteCondition | undefined) ?? 'flat',
    wall: (r.wall as WallType | undefined) ?? 'brick',
    plotLengthFt: num(r.plotLengthFt),
    plotWidthFt: num(r.plotWidthFt),
    terraceAccess: r.terraceAccess === false ? false : true,
    ...(r.stilt === true ? { stilt: true } : {}),
    ...(balconies && balconies > 0 ? { balconies, balconyDepthM: depth ?? 1.2 } : {}),
  }
}
