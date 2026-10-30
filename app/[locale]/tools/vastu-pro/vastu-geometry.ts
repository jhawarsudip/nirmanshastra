// VastuPro geometry. Pure TypeScript, no dependencies, no randomness: the same plan always gives the same answer.
//
// Plan space: x grows to the right, y grows DOWN (like a screen). Units are whatever the plan uses (feet, metres, pixels);
// only proportions matter, as long as x and y use the same scale.
//
// `northDeg` is where North lies on the drawing, measured clockwise from the top of the drawing (0 = the top of the
// drawing is North, 90 = North is to the right, 270 = North is to the left).
//
// The 16 zones are 22.5 degrees wide and centred on N, NNE, NE ... NNW (zone 0 = N, 1 = NNE ... 15 = NNW).
// The Brahmasthan (the centre) is the house outline shrunk to one third of its size about its centre of area, which is
// one ninth of the area: for a rectangle it is the middle square of a 3 x 3 grid, the "9 central padas of 81".

export interface Pt { x: number; y: number }
export type Poly = Pt[]

export const ZONE_COUNT = 16
export const ZONE_SPAN = 360 / ZONE_COUNT // 22.5
/** A room needs at least this share of its area in a zone before that zone is reported as one it also covers. */
export const SPAN_SHARE = 0.2
/** A bearing this close to a zone edge is reported as borderline (the verdict then depends on where the edge is drawn). */
export const BORDERLINE_DEG = 5

export const rectPoly = (x: number, y: number, w: number, h: number): Poly => [
  { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
]

/** Signed area (shoelace). Positive when the points run clockwise on screen (y down). */
export function signedArea(p: Poly): number {
  let a = 0
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length]
    a += p[i].x * q.y - q.x * p[i].y
  }
  return a / 2
}

export const polygonArea = (p: Poly): number => Math.abs(signedArea(p))

/** Centre of area (centroid) of a simple polygon, convex or not. Falls back to the mean of the corners for a degenerate one. */
export function polygonCentroid(p: Poly): Pt {
  const a = signedArea(p)
  if (Math.abs(a) < 1e-9) {
    const n = Math.max(p.length, 1)
    return { x: p.reduce((s, q) => s + q.x, 0) / n, y: p.reduce((s, q) => s + q.y, 0) / n }
  }
  let cx = 0
  let cy = 0
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length]
    const f = p[i].x * q.y - q.x * p[i].y
    cx += (p[i].x + q.x) * f
    cy += (p[i].y + q.y) * f
  }
  return { x: cx / (6 * a), y: cy / (6 * a) }
}

export function bounds(p: Poly) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const q of p) {
    if (q.x < minX) minX = q.x
    if (q.y < minY) minY = q.y
    if (q.x > maxX) maxX = q.x
    if (q.y > maxY) maxY = q.y
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY }
}

/** Ray casting: a point is inside when a ray to the right crosses the outline an odd number of times. */
export function pointInPolygon(pt: Pt, poly: Poly): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

/** The polygon scaled by k about a point. */
export const scalePolygon = (p: Poly, about: Pt, k: number): Poly =>
  p.map(q => ({ x: about.x + (q.x - about.x) * k, y: about.y + (q.y - about.y) * k }))

/** The Brahmasthan of a house outline: one third of the size about its centre of area, so one ninth of the area. */
export const brahmasthan = (house: Poly): Poly => scalePolygon(house, polygonCentroid(house), 1 / 3)

const norm360 = (d: number) => ((d % 360) + 360) % 360

/** Compass bearing of `to` as seen from `from`, 0 to 360 clockwise from North, once the drawing's North angle is taken out. */
export function compassBearing(from: Pt, to: Pt, northDeg: number): number {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const onScreen = (Math.atan2(dx, -dy) * 180) / Math.PI // clockwise from the top of the drawing
  return norm360(onScreen - northDeg)
}

/** Zone 0 to 15 for a compass bearing. Zone 0 (N) runs from 348.75 to 11.25 degrees. */
export const zoneOfBearing = (bearing: number): number =>
  Math.floor((norm360(bearing) + ZONE_SPAN / 2) / ZONE_SPAN) % ZONE_COUNT

/** How far a bearing is from the nearest zone edge, in degrees (0 to 11.25). */
export function edgeDistance(bearing: number): number {
  const into = (norm360(bearing) + ZONE_SPAN / 2) % ZONE_SPAN // 0 at an edge, 22.5 at the next edge
  return Math.min(into, ZONE_SPAN - into)
}

export interface Placement {
  /** Share (0 to 1) of the room's area that falls in each of the 16 zones, outside the Brahmasthan. */
  shares: number[]
  /** Share of the room's area inside the Brahmasthan. shares plus centreShare add up to 1. */
  centreShare: number
  /** The zone holding most of the room (outside the Brahmasthan). -1 if nearly all of the room is in the Brahmasthan. */
  primaryZone: number
  /** Zones other than the primary one that hold at least SPAN_SHARE of the room, biggest first. */
  alsoIn: number[]
  /** Bearing of the room's own centre from the Brahmasthan, 0 to 360. */
  bearing: number
  /** Distance of that bearing from the nearest zone edge, in degrees. */
  edgeDeg: number
  /** True when the room's centre is within BORDERLINE_DEG of a zone edge. */
  borderline: boolean
  /** The room's area in plan units. */
  area: number
}

/**
 * Where a room sits. Instead of one dot, the room's whole area is sampled on a fine grid and every sample is sorted
 * into a zone by its bearing from the centre of the house, so a room that straddles two zones says so.
 * @param room   the room outline (a rectangle in the tool, any simple polygon here)
 * @param house  the outline of the house or plot; its centre of area is the Brahmasthan
 */
export function placeRoom(room: Poly, house: Poly, northDeg: number, grid = 40): Placement {
  const centre = polygonCentroid(house)
  const core = brahmasthan(house)
  const b = bounds(room)
  const shares = new Array<number>(ZONE_COUNT).fill(0)
  let inCore = 0
  let total = 0

  const take = (pt: Pt) => {
    total++
    if (pointInPolygon(pt, core)) { inCore++; return }
    shares[zoneOfBearing(compassBearing(centre, pt, northDeg))]++
  }

  if (b.w > 1e-9 && b.h > 1e-9 && room.length >= 3) {
    // a sample at the middle of each of grid x grid cells of the bounding box, kept when it lies inside the room
    for (let i = 0; i < grid; i++) {
      for (let j = 0; j < grid; j++) {
        const pt = { x: b.minX + ((i + 0.5) / grid) * b.w, y: b.minY + ((j + 0.5) / grid) * b.h }
        if (pointInPolygon(pt, room)) take(pt)
      }
    }
  }
  if (total === 0) take(polygonCentroid(room)) // a room too small to sample is read at its centre

  for (let z = 0; z < ZONE_COUNT; z++) shares[z] /= total
  const centreShare = inCore / total

  let primaryZone = -1
  let best = 0
  for (let z = 0; z < ZONE_COUNT; z++) if (shares[z] > best) { best = shares[z]; primaryZone = z }
  if (centreShare >= 0.9) primaryZone = -1

  const alsoIn = shares
    .map((s, z) => ({ s, z }))
    .filter(o => o.z !== primaryZone && o.s >= SPAN_SHARE)
    .sort((p, q) => q.s - p.s)
    .map(o => o.z)

  const bearing = compassBearing(centre, polygonCentroid(room), northDeg)
  const edgeDeg = edgeDistance(bearing)

  return {
    shares,
    centreShare,
    primaryZone,
    alsoIn,
    bearing,
    edgeDeg,
    borderline: edgeDeg < BORDERLINE_DEG,
    area: polygonArea(room),
  }
}

// ------------------------------------------------------------------------------------------------ the completed rectangle

/**
 * Andrew's monotone chain. Returns the convex hull in clockwise order on screen (y down).
 */
export function convexHull(points: Poly): Poly {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  if (pts.length < 3) return pts
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const lower: Pt[] = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: Pt[] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  upper.pop()
  lower.pop()
  // With y down, this order is clockwise on screen.
  return lower.concat(upper)
}

/**
 * The smallest rectangle, turned to any angle, that holds the whole outline: the "completed rectangle" that
 * practitioners draw before they read a plan with a missing or extra corner. For a rectangle it is the rectangle
 * itself. The four corners run clockwise on screen, starting at the top-left of the rectangle's own frame.
 */
export function minAreaRect(poly: Poly): Poly {
  const hull = convexHull(poly)
  if (hull.length < 3) {
    const b = bounds(poly)
    return rectPoly(b.minX, b.minY, Math.max(b.w, 1e-6), Math.max(b.h, 1e-6))
  }
  let best: { area: number; rect: Poly } | null = null
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i]
    const c = hull[(i + 1) % hull.length]
    const len = Math.hypot(c.x - a.x, c.y - a.y)
    if (len < 1e-9) continue
    const ux = (c.x - a.x) / len
    const uy = (c.y - a.y) / len
    const vx = -uy
    const vy = ux
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity
    for (const p of hull) {
      const u = p.x * ux + p.y * uy
      const v = p.x * vx + p.y * vy
      if (u < minU) minU = u
      if (u > maxU) maxU = u
      if (v < minV) minV = v
      if (v > maxV) maxV = v
    }
    const area = (maxU - minU) * (maxV - minV)
    if (!best || area < best.area - 1e-9) {
      const at = (U: number, V: number): Pt => ({ x: U * ux + V * vx, y: U * uy + V * vy })
      best = { area, rect: [at(minU, minV), at(maxU, minV), at(maxU, maxV), at(minU, maxV)] }
    }
  }
  return best ? best.rect : rectPoly(0, 0, 1, 1)
}

/**
 * Where a ray from `from` through `through` leaves a convex polygon: which side (the side that runs from corner i to
 * corner i+1) and how far along that side, 0 at corner i and 1 at corner i+1.
 */
export function rayExit(from: Pt, through: Pt, poly: Poly): { side: number; t: number; pt: Pt } | null {
  const dx = through.x - from.x
  const dy = through.y - from.y
  if (Math.abs(dx) < 1e-12 && Math.abs(dy) < 1e-12) return null
  let best: { side: number; t: number; pt: Pt; s: number } | null = null
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const ex = b.x - a.x
    const ey = b.y - a.y
    const den = dx * ey - dy * ex
    if (Math.abs(den) < 1e-12) continue
    const s = ((a.x - from.x) * ey - (a.y - from.y) * ex) / den // along the ray
    const t = ((a.x - from.x) * dy - (a.y - from.y) * dx) / den // along the side
    if (s > 1e-9 && t >= -1e-9 && t <= 1 + 1e-9 && (!best || s > best.s)) {
      // the exit point is the farthest crossing of a convex polygon
      best = { side: i, t: Math.min(Math.max(t, 0), 1), pt: { x: from.x + dx * s, y: from.y + dy * s }, s }
    }
  }
  return best ? { side: best.side, t: best.t, pt: best.pt } : null
}

/**
 * How much of the corner third of a rectangle the outline actually covers, 0 to 1. The corner third is the
 * square-ish block made of the first third of each of the two sides that meet at corner `i`.
 */
export function cornerCover(outline: Poly, rect: Poly, i: number, grid = 14): number {
  const c = rect[i]
  const next = rect[(i + 1) % 4]
  const prev = rect[(i + 3) % 4]
  const ax = (next.x - c.x) / 3
  const ay = (next.y - c.y) / 3
  const bx = (prev.x - c.x) / 3
  const by = (prev.y - c.y) / 3
  let inside = 0
  for (let p = 0; p < grid; p++) {
    for (let q = 0; q < grid; q++) {
      const fu = (p + 0.5) / grid
      const fv = (q + 0.5) / grid
      if (pointInPolygon({ x: c.x + ax * fu + bx * fv, y: c.y + ay * fu + by * fv }, outline)) inside++
    }
  }
  return inside / (grid * grid)
}
