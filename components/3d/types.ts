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
