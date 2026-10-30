// VastuPro: the shapes the visitor draws. Plain data, nothing here rates anything.

import type { Poly } from './vastu-geometry'

/** The plan sheet is a square of this many units. Every position on it is in these units. */
export const SHEET_UNITS = 600

/** A room, tank, staircase and so on, drawn as a rectangle on the sheet. */
export interface PlacedItem {
  id: string
  /** key in the catalogue */
  kind: string
  x: number
  y: number
  w: number
  h: number
}

/** A door on the outline of the house. */
export interface DoorMark {
  id: string
  kind: string
  pt: { x: number; y: number }
}

/** The picture of the visitor's own plan, drawn faintly under the sheet. Stays in the browser. */
export interface PlanImage {
  src: string
  /** natural size of the picture */
  w: number
  h: number
  /** top-left on the sheet, scale and rotation (degrees) */
  x: number
  y: number
  scale: number
  rot: number
}

/** The biggest the house outline can be drawn on the sheet (leaves a margin for the zone names). */
export const OUTLINE_BOX = 400

/** A rectangle outline with the given proportions, centred on the sheet and as big as the box allows. */
export function rectangleOutline(width: number, depth: number): Poly {
  const w = Math.max(width, 1)
  const d = Math.max(depth, 1)
  const k = OUTLINE_BOX / Math.max(w, d)
  const pw = w * k
  const ph = d * k
  const x0 = (SHEET_UNITS - pw) / 2
  const y0 = (SHEET_UNITS - ph) / 2
  return [
    { x: x0, y: y0 },
    { x: x0 + pw, y: y0 },
    { x: x0 + pw, y: y0 + ph },
    { x: x0, y: y0 + ph },
  ]
}

export type Corner = 'NE' | 'NW' | 'SE' | 'SW'

/**
 * An L-shaped outline: a rectangle with one corner cut away. The corner is named by where it is on the DRAWING
 * (top-right, top-left, bottom-right, bottom-left), and `cut` is the fraction (0 to 0.6) of each side that is cut.
 */
export function lShapeOutline(width: number, depth: number, corner: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left', cut = 0.35): Poly {
  const [a, b, c, d] = rectangleOutline(width, depth)
  const f = Math.min(Math.max(cut, 0.1), 0.6)
  const w = b.x - a.x
  const h = d.y - a.y
  const cx = w * f
  const cy = h * f
  switch (corner) {
    case 'top-right':
      return [a, { x: b.x - cx, y: a.y }, { x: b.x - cx, y: a.y + cy }, { x: b.x, y: a.y + cy }, c, d]
    case 'top-left':
      return [{ x: a.x + cx, y: a.y }, b, c, d, { x: a.x, y: a.y + cy }, { x: a.x + cx, y: a.y + cy }]
    case 'bottom-right':
      return [a, b, { x: b.x, y: c.y - cy }, { x: c.x - cx, y: c.y - cy }, { x: c.x - cx, y: c.y }, d]
    case 'bottom-left':
      return [a, b, c, { x: d.x + cx, y: d.y }, { x: d.x + cx, y: d.y - cy }, { x: d.x, y: d.y - cy }]
  }
}

let seq = 0
/** A fresh id for a room: its kind plus a running number, so two bedrooms never clash. */
export function newItemId(kind: string, existing: { id: string }[]): string {
  let id = ''
  do {
    seq += 1
    id = `${kind}-${seq}`
  } while (existing.some(e => e.id === id))
  return id
}
