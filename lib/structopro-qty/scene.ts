// One drawable model for the 3D view, built from either the free preview (nominal member sizes) or the designed geometry (paid).
// Pure data in, boxes out: no three.js here, so it also feeds the plan-view fallback and can run on the server.
// Coordinates are the model's own: x along the length, y along the width, z up, ground level z = 0.

import type { GeoMumty, GeoStair, Geometry } from './types'
import type { PreviewGeometry } from './payload'

export interface SceneBox {
  cx: number
  cy: number
  cz: number
  sx: number
  sy: number
  sz: number
}

export interface SceneModel {
  /** 'designed' = the sizes the report is based on; 'nominal' = typical sizes, drawn before payment */
  mode: 'designed' | 'nominal'
  lengthM: number
  widthM: number
  totalHeightM: number
  storeys: number
  storeyHeightM: number
  plinthM: number
  depthM: number
  footings: SceneBox[]
  raft: SceneBox | null
  /**
   * The ground floor, drawn as a thin plate at plinth level. In a framed house the ground floor is not a structural slab:
   * it is a bed of concrete and the flooring laid on earth that is filled and compacted inside the plinth beams.
   * It is drawn so the model does not look as if the bottom floor is missing, and it is NOT part of `slabs`,
   * `counts` or any quantity.
   */
  groundFloor: SceneBox
  columns: (SceneBox & { storey: number })[]
  beams: (SceneBox & { floor: number })[]
  slabs: (SceneBox & { floor: number; balcony?: boolean })[]
  stair: GeoStair
  mumty: GeoMumty | null
  counts: { footings: number; columns: number; beams: number; slabs: number; balconies: number }
}

/** Thickness of the drawn ground-floor plate, and how far its top sits below the plinth beam tops (so the two never share a face). */
const GROUND_PLATE_T = 0.1
const GROUND_PLATE_DROP = 0.03

const box = (x0: number, y0: number, x1: number, y1: number, zBottom: number, zTop: number): SceneBox => ({
  cx: (x0 + x1) / 2,
  cy: (y0 + y1) / 2,
  cz: (zBottom + zTop) / 2,
  sx: Math.abs(x1 - x0),
  sy: Math.abs(y1 - y0),
  sz: Math.abs(zTop - zBottom),
})

const beamBox = (x0: number, y0: number, x1: number, y1: number, b: number, zTop: number, depth: number): SceneBox => {
  const alongX = Math.abs(y1 - y0) < 1e-6
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  return { cx, cy, cz: zTop - depth / 2, sx: alongX ? Math.abs(x1 - x0) : b, sy: alongX ? b : Math.abs(y1 - y0), sz: depth }
}

export function sceneFromGeometry(g: Geometry, depthM: number): SceneModel {
  const top = g.slabs.reduce((m, s) => Math.max(m, s.zTop), 0)
  const footings = g.footings.map((f) => box(f.x - f.size / 2, f.y - f.size / 2, f.x + f.size / 2, f.y + f.size / 2, f.bottom, f.top))
  const raft = g.raft ? box(g.raft.x0, g.raft.y0, g.raft.x1, g.raft.y1, g.raft.z - g.raft.t, g.raft.z) : null
  const columns = g.columns.map((c) => ({ ...box(c.x - c.b / 2, c.y - c.d / 2, c.x + c.b / 2, c.y + c.d / 2, c.z0, c.z1), storey: c.storey }))
  const beams = g.beams.map((b) => ({ ...beamBox(b.x0, b.y0, b.x1, b.y1, b.b, b.zTop, b.depth), floor: b.floor }))
  const slabs = g.slabs.map((s) => ({ ...box(s.x0, s.y0, s.x1, s.y1, s.zTop - s.t, s.zTop), floor: s.floor, balcony: s.balcony === true }))
  return finish('designed', g.lengthM, g.widthM, top, g.slabs.length ? Math.max(...g.slabs.map((s) => s.floor)) + 1 : 1, g.storeyHeight, g.plinthZ, depthM, footings, raft, columns, beams, slabs, g.stair, g.mumty)
}

export function sceneFromPreview(p: PreviewGeometry): SceneModel {
  const n = p.nominal
  const fb = -p.foundingDepthM + 0.1
  const footings = p.raft ? [] : p.footingPoints.map((f) => box(f.x - n.footing / 2, f.y - n.footing / 2, f.x + n.footing / 2, f.y + n.footing / 2, fb, fb + n.footingT))
  const raft = p.raft ? box(p.raft.x0, p.raft.y0, p.raft.x1, p.raft.y1, p.raft.z - p.raft.t, p.raft.z) : null
  const columns = p.columns.map((c) => ({ ...box(c.x - n.col / 2, c.y - n.col / 2, c.x + n.col / 2, c.y + n.col / 2, c.z0, c.z1), storey: c.storey }))
  const beams = p.beams.map((b) => ({ ...beamBox(b.x0, b.y0, b.x1, b.y1, n.beamB, b.zTop, b.floor < 0 ? n.plinthD : n.beamD), floor: b.floor }))
  const slabs = p.slabs.map((s) => ({ ...box(s.x0, s.y0, s.x1, s.y1, s.zTop - s.t, s.zTop), floor: s.floor, balcony: s.balcony === true }))
  const top = p.slabs.reduce((m, s) => Math.max(m, s.zTop), 0)
  return finish('nominal', p.lengthM, p.widthM, top, p.floors, p.storeyHeightM, p.plinthM, p.foundingDepthM, footings, raft, columns, beams, slabs, p.stair, p.mumty)
}

function finish(
  mode: SceneModel['mode'],
  lengthM: number,
  widthM: number,
  top: number,
  storeys: number,
  storeyHeightM: number,
  plinthM: number,
  depthM: number,
  footings: SceneBox[],
  raft: SceneBox | null,
  columns: (SceneBox & { storey: number })[],
  beams: (SceneBox & { floor: number })[],
  slabs: (SceneBox & { floor: number; balcony?: boolean })[],
  stair: GeoStair,
  mumty: GeoMumty | null,
): SceneModel {
  return {
    mode,
    lengthM,
    widthM,
    totalHeightM: top + (mumty ? mumty.height + 0.1 : 0),
    storeys,
    storeyHeightM,
    plinthM,
    depthM,
    footings,
    raft,
    groundFloor: box(0, 0, lengthM, widthM, plinthM - GROUND_PLATE_DROP - GROUND_PLATE_T, plinthM - GROUND_PLATE_DROP),
    columns,
    beams,
    slabs,
    stair,
    mumty,
    counts: { footings: raft ? 1 : footings.length, columns: columns.length, beams: beams.length, slabs: slabs.length, balconies: slabs.filter((s) => s.balcony).length },
  }
}
