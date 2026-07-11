export interface FloorDatum {
  areaSqft: number
  heightM: number
  name: string
}

export interface FloorGeometry {
  w: number
  d: number
  h: number
  y: number
  i: number
}

export const SQFT_TO_M2 = 0.0929
export const ASPECT_RATIO = 1.3
export const DEFAULT_FLOOR_HEIGHT_M = 3.048
// IS 456:2000 minimum slab thickness — used by 3D preview for slab plate rendering
export const SLAB_THICKNESS_M = 0.125
