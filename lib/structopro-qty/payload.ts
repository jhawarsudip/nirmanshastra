// What leaves the server. The model result is split in two:
//   FreePayload  - safe to show anyone: zone, grades, IS-code checks, "your frame at a glance" (grid, member counts, plan size) and a SIMPLIFIED 3D preview.
//   PaidPayload  - everything else (quantities, member sizes, bar schedules, designed 3D). Only returned after payment is verified on the server.
// The site is QUANTITY-ONLY: no rupee figure and no rate appears anywhere in this payload. The quantities are the product.

import type { Geometry, QtyResult } from './types'

export interface Compliance {
  id: string
  clause: string
  description: string
  status: 'pass' | 'advisory' | 'fail'
  detail: string
}

export interface PreviewGeometry {
  lengthM: number
  widthM: number
  storeyHeightM: number
  plinthM: number
  foundingDepthM: number
  floors: number
  /** column positions per storey with their levels; the cross-section is nominal */
  columns: { x: number; y: number; storey: number; z0: number; z1: number }[]
  /** one footing per column line at the lowest storey */
  footingPoints: { x: number; y: number }[]
  /** beam lines (floor -1 = plinth beams) at their levels; the cross-section is nominal */
  beams: { x0: number; y0: number; x1: number; y1: number; floor: number; zTop: number }[]
  raft: { x0: number; y0: number; x1: number; y1: number; t: number; z: number } | null
  slabs: Geometry['slabs']
  stair: Geometry['stair']
  mumty: Geometry['mumty']
  /** nominal section sizes, m, used only for drawing */
  nominal: { col: number; beamB: number; beamD: number; plinthD: number; slabT: number; footing: number; footingT: number; raftT: number }
}

export interface FreePayload {
  engine: 'qty-v2'
  /** floors the user listed (above the open parking level when `stilt`) */
  floors: number
  /** physical storeys of the frame, including an open parking level */
  storeys: number
  stilt: boolean
  /** balconies in the whole building */
  balconies: number
  builtUpSqft: number
  zone: string
  zoneNote: string
  exposure: string
  gradeAbove: string
  gradeBelow: string
  foundation: 'isolated' | 'raft'
  glance: Glance
  compliance: Compliance[]
  warnings: string[]
  preview: PreviewGeometry
}

/** The shape of the frame, counted from the grid the model laid out. Nothing here is a quantity of material. */
export interface Glance {
  lengthM: number
  widthM: number
  footprintM2: number
  baysX: number
  baysY: number
  spanXM: number
  spanYM: number
  columnsPerStorey: number
  footings: number
  beamsPerFloor: number
  slabPanelsPerFloor: number
  storeyHeightM: number
  plinthM: number
  foundingDepthM: number
  hasMumty: boolean
}

/**
 * What real buildings have used, from published records, set beside the code figure.
 * Source: GKSPL, "Building the Baseline: Embodied Carbon in India's Urban Housing" (v1, March 2026), 26 multi-family residential
 * buildings completed since 2020, quantities taken from real Bills of Quantities, as reported by Conserve Consultants (29 Apr 2026).
 * Per m2 of built-up area: up to 4 storeys steel 31-62 kg and concrete 0.36-0.44 m3; 5 to 12 storeys steel 33-64 kg and concrete 0.39-0.47 m3.
 * The study's sample size per class is not published and it does not say whether its concrete includes lean concrete or basements,
 * so this is shown as a range for orientation, never as a prediction for one house.
 */
export interface PracticeRange {
  classLabel: string
  builtUpM2: number
  steelKgPerM2: [number, number]
  concreteM3PerM2: [number, number]
  steelKg: [number, number]
  concreteM3: [number, number]
  /** where this report sits against that range, per m2 of built-up area */
  thisReport: { steelKgPerM2: number; concreteM3PerM2: number }
  source: string
}

export type PaidPayload = Omit<QtyResult, 'diagnostics'> & { engine: 'qty-v2'; compliance: Compliance[]; practice: PracticeRange }

export function practiceRange(r: QtyResult): PracticeRange {
  const low = r.inputEcho.storeys <= 4
  const steelPerM2: [number, number] = low ? [31, 62] : [33, 64]
  const concPerM2: [number, number] = low ? [0.36, 0.44] : [0.39, 0.47]
  // the benchmark divides by built-up area of every roofed floor: an open parking level counts here
  const A = r.inputEcho.roofedAreaM2
  return {
    classLabel: low ? 'buildings of up to four storeys' : 'buildings of five to twelve storeys',
    builtUpM2: A,
    steelKgPerM2: steelPerM2,
    concreteM3PerM2: concPerM2,
    steelKg: [steelPerM2[0] * A, steelPerM2[1] * A],
    concreteM3: [concPerM2[0] * A, concPerM2[1] * A],
    // bar weight before the cutting waste: a Bill of Quantities counts the steel in the drawing, the waste is added when buying
    thisReport: { steelKgPerM2: r.totals.steelNetKg / A, concreteM3PerM2: r.totals.concreteM3 / A },
    source: 'GKSPL, Building the Baseline: Embodied Carbon in India’s Urban Housing, v1, March 2026 (26 residential buildings, from Bills of Quantities), as reported by Conserve Consultants, 29 April 2026.',
  }
}

/** Count the frame from the laid-out grid. No quantities, no rates. */
export function glanceOf(r: QtyResult): Glance {
  const g = r.geometry
  const L = r.layout
  const footings = g.raft ? 0 : g.footings.length
  const cols0 = g.columns.filter((c) => c.storey === 0).length
  const beamsF0 = g.beams.filter((b) => b.floor === 0).length
  // one panel per bay: the stair opening splits one panel into two drawn rectangles, which is still one panel
  const bay0 = L.bayCountByFloor.find((b) => b.floor === 0)
  const panelsF0 = bay0 ? bay0.bx * bay0.by : L.baysX * L.baysY
  return {
    lengthM: g.lengthM,
    widthM: g.widthM,
    footprintM2: r.inputEcho.footprintM2,
    baysX: L.baysX,
    baysY: L.baysY,
    spanXM: L.spanX,
    spanYM: L.spanY,
    columnsPerStorey: cols0,
    footings,
    beamsPerFloor: beamsF0,
    slabPanelsPerFloor: panelsF0,
    storeyHeightM: g.storeyHeight,
    plinthM: g.plinthZ,
    foundingDepthM: L.foundingDepthM,
    hasMumty: g.mumty !== null,
  }
}

export function complianceChecks(r: QtyResult): Compliance[] {
  const zone = r.inputEcho.zone
  const seismic = zone === 'III' || zone === 'IV' || zone === 'V'
  const out: Compliance[] = [
    {
      id: 'concrete_grade',
      clause: 'IS 456:2000 cl 6.1, Table 5',
      description: 'Concrete grade against exposure',
      status: 'pass',
      detail: `${r.inputEcho.gradeAbove} above ground and ${r.inputEcho.gradeBelow} below ground meet the minimum grade, cement content and water-cement ratio for ${r.inputEcho.exposure.replace('_', ' ')} exposure.`,
    },
    {
      id: 'steel_grade',
      clause: 'IS 13920:2016 cl 5.3; IS 1786:2008',
      description: 'Reinforcement grade',
      status: 'pass',
      detail: seismic ? `Zone ${zone} calls for ductile steel: this report uses Fe500D throughout.` : `Zone ${zone}: Fe500D is used throughout; Fe500 is also acceptable.`,
    },
    {
      id: 'ductile',
      clause: 'IS 13920:2016 cl 6 and 7',
      description: 'Ductile detailing',
      status: seismic ? 'advisory' : 'pass',
      detail: seismic
        ? `Zone ${zone}: closer stirrups at beam and column ends, 135-degree hooks, strong-column weak-beam check. These are in the bar counts. Your contractor must follow them on site.`
        : `Zone ${zone}: ordinary detailing to IS 456 is enough. Closer stirrups at joints are still good practice.`,
    },
    {
      id: 'foundation',
      clause: 'IS 1904:1986; IS 456 cl 34',
      description: 'Foundation',
      status: r.inputEcho.foundation === 'raft' ? 'advisory' : 'pass',
      detail:
        r.inputEcho.foundation === 'raft'
          ? 'The soil or the loads call for a raft. The raft figures here are indicative. A soil test and a structural engineer must confirm the foundation before work starts.'
          : 'Isolated footings on the bearing capacity assumed for your site type. Replace the assumed value with a soil test result.',
    },
    {
      id: 'cover',
      clause: 'IS 456:2000 cl 26.4, Table 16',
      description: 'Nominal cover',
      status: 'advisory',
      detail: 'Footing 50 mm, column 40 mm, beam 30 mm, slab 20 mm for mild exposure (more for severe sites). Cover blocks must be placed on site.',
    },
  ]
  const w = r.wind
  const winds = w.governs.x === 'wind' || w.governs.y === 'wind'
  out.push({
    id: 'wind',
    clause: 'IS 875 (Part 3):1987 cl 5; IS 1893 (Part 1) cl 6.2',
    description: 'Wind load check',
    status: winds || r.warnings.some((x) => /tall and narrow|Over 30 m/.test(x)) ? 'advisory' : 'pass',
    detail:
      `Basic wind speed ${w.vbMs} m/s for ${w.place}${w.basis === 'state' ? ' (the highest speed this state commonly sees: your town is not in the speed table)' : ''}. The wind force is compared with the earthquake force storey by storey and the larger of the two is designed for; they are never added. ` +
      (winds ? 'In at least one direction the wind force is the larger one, so the frame is stronger than the earthquake alone would need.' : 'In both directions the earthquake force is the larger one.'),
  })
  if (r.stilt) {
    out.push({
      id: 'stilt',
      clause: 'IS 1893 (Part 1):2002 cl 7.10.3; IS 13920',
      description: 'Open parking level (stilt)',
      status: 'advisory',
      detail: r.stilt.note,
    })
  }
  if (r.balcony) {
    out.push({
      id: 'balcony',
      clause: 'IS 456:2000 cl 23.2.1, 26.2.1; IS 875 (Part 2) Table 1',
      description: 'Balconies',
      status: 'advisory',
      detail: `${r.balcony.count} balcon${r.balcony.count === 1 ? 'y' : 'ies'} projecting ${r.balcony.projectionM.toFixed(1)} m. The slab thickness is set from the IS 456 cantilever span-to-depth limit, the top bars are anchored back into the floor slab and the imposed load is 3.0 kN/m2. A balcony that does not continue into the floor slab needs its supporting beam checked for torsion by an engineer.`,
    })
  }
  if (r.warnings.length) {
    out.push({ id: 'review', clause: 'Model limits', description: 'Engineer review', status: 'advisory', detail: r.warnings.join(' ') })
  }
  return out
}

/** Free 3D: the real grid, floors, stair and slab outlines, but nominal member sizes. Designed sizes stay on the server. */
export function previewGeometry(r: QtyResult): PreviewGeometry {
  const g = r.geometry
  const F = r.inputEcho.storeys
  const col = F <= 1 ? 0.23 : F === 2 ? 0.3 : F === 3 ? 0.35 : 0.4
  const seen = new Set<string>()
  const footingPoints: { x: number; y: number }[] = []
  for (const c of g.columns) {
    if (c.storey !== 0) continue
    const k = `${c.x.toFixed(2)}:${c.y.toFixed(2)}`
    if (!seen.has(k)) {
      seen.add(k)
      footingPoints.push({ x: c.x, y: c.y })
    }
  }
  const raftT = 0.45
  return {
    lengthM: g.lengthM,
    widthM: g.widthM,
    storeyHeightM: g.storeyHeight,
    plinthM: g.plinthZ,
    foundingDepthM: r.layout.foundingDepthM,
    floors: F,
    columns: g.columns.map((c) => ({ x: c.x, y: c.y, storey: c.storey, z0: c.z0, z1: c.z1 })),
    footingPoints,
    beams: g.beams.map((b) => ({ x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, floor: b.floor, zTop: b.zTop })),
    raft: g.raft ? { x0: g.raft.x0, y0: g.raft.y0, x1: g.raft.x1, y1: g.raft.y1, t: raftT, z: -r.layout.foundingDepthM + 0.1 + raftT } : null,
    slabs: g.slabs.map((s) => ({ ...s, t: 0.15 })),
    stair: g.stair,
    mumty: g.mumty,
    nominal: { col, beamB: 0.23, beamD: 0.4, plinthD: 0.3, slabT: 0.15, footing: 1.2, footingT: 0.4, raftT },
  }
}

export function toFree(r: QtyResult): FreePayload {
  return {
    engine: 'qty-v2',
    floors: r.inputEcho.floors,
    storeys: r.inputEcho.storeys,
    stilt: r.inputEcho.stilt,
    balconies: r.balcony?.count ?? 0,
    builtUpSqft: r.inputEcho.totalBuiltUpM2 / 0.09290304,
    zone: r.inputEcho.zone,
    zoneNote: r.inputEcho.zoneNote,
    exposure: r.inputEcho.exposure,
    gradeAbove: r.inputEcho.gradeAbove,
    gradeBelow: r.inputEcho.gradeBelow,
    foundation: r.inputEcho.foundation,
    glance: glanceOf(r),
    compliance: complianceChecks(r),
    warnings: r.warnings,
    preview: previewGeometry(r),
  }
}

export function toPaid(r: QtyResult): PaidPayload {
  const { diagnostics, ...rest } = r
  void diagnostics
  return { ...rest, engine: 'qty-v2', compliance: complianceChecks(r), practice: practiceRange(r) }
}

/** Shape the saved-estimate consumers read (reports page, admin stats, the combined quantity list): quantities{} only. No rupee total is stored. */
export function legacyShape(r: QtyResult) {
  return {
    quantities: {
      cementBags: Math.round(r.materials.cementBags),
      steelKg: Math.round(r.materials.steelBuyKg),
      aggregateCft: Math.round(r.materials.aggregateCft),
      sandCft: Math.round(r.materials.sandCft),
      bindingWireKg: Math.round(r.materials.bindingWireKg),
      admixtureLitres: 0,
      formworkSqft: Math.round(r.materials.formworkSqft),
    },
    seismicZone: r.inputEcho.zone,
    totalBUA: Math.round(r.inputEcho.totalBuiltUpM2 / 0.09290304),
  }
}
