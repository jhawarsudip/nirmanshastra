/*
  ElectricalPro: the tables and rules of the model, as plain numbers, shared by the model (model.ts) and by the
  calculation sheet (calc.ts), so the sheet always works with the very figures the model used.

  Nothing here is new: the tables are moved from model.ts unchanged, and the rules that model.ts used to write inline
  ("8 points on a circuit", "0.6 times the side of the home plus 3 m") are given names. Where each figure comes from
  (Code, Derived or Assumed) is stated in the model's report; the notes below say it again beside the figure.

  The site is quantity-only: nothing here knows a price, a labour rate or a dealer.
*/

/* ───────────────────────── tables of figures ───────────────────────── */

export type Kind = 'hall' | 'dining' | 'kitchen' | 'bedroom' | 'bath' | 'passage' | 'entrance' | 'balcony' | 'utility' | 'pooja'

/** Counts of everything a room, or a whole building, gets. */
export interface Cnt { L: number; F: number; X: number; B: number; S6: number; S16: number; TV: number; D: number }
export const zero = (): Cnt => ({ L: 0, F: 0, X: 0, B: 0, S6: 0, S16: 0, TV: 0, D: 0 })
export const addTo = (a: Cnt, b: Partial<Cnt>, k = 1) => { for (const x of Object.keys(a) as (keyof Cnt)[]) a[x] += (b[x] ?? 0) * k }

/**
  Points in each room. u: lights (L), ceiling fans (F), 6 A sockets (S6) and 6/16 A sockets (S16), per 12 m² of room;
  f: exhaust fans (X), call bells (B), TV (TV) and data (D) points, per room.

  Standard = the room-wise tables of the BIS draft revision of IS 4648 (ETD 20, September 2024), Tables 2 and 3.
  Basic    = the socket schedule of the published IS 4648:1968 (cl 9.8), with lights and fans so that an 85 m² home
             has about 12 lights and 5 fans (the yardstick in the NIMI electrician text, Table 1).
  The column positions of the draft's Table 2 were read from text, so the Standard rows are treated as a guide.
*/
export const STD: Record<Kind, { u: Partial<Cnt>; f: Partial<Cnt> }> = {
  hall: { u: { L: 4, F: 1, S6: 8, S16: 1 }, f: { TV: 1, D: 1 } },
  dining: { u: { L: 2, F: 1, S6: 2 }, f: {} },
  kitchen: { u: { L: 2, F: 1, S6: 4, S16: 4 }, f: { X: 1, B: 1 } },
  bedroom: { u: { L: 5, F: 1, S6: 7, S16: 1 }, f: { TV: 1, D: 1 } },
  bath: { u: { L: 2, S6: 1 }, f: { X: 1 } },
  passage: { u: { L: 1, S6: 2 }, f: {} },
  entrance: { u: { L: 1, S6: 1 }, f: { B: 1 } },
  balcony: { u: { L: 1, S6: 1 }, f: {} },
  utility: { u: { L: 1 }, f: {} },
  pooja: { u: { L: 1, S6: 1 }, f: {} },
}
export const BAS: Record<Kind, { u: Partial<Cnt>; f: Partial<Cnt> }> = {
  hall: { u: { L: 3, F: 2, S6: 3, S16: 2 }, f: { TV: 1 } },
  dining: { u: { L: 1, F: 1, S6: 2, S16: 1 }, f: {} },
  kitchen: { u: { L: 1, S6: 1, S16: 2 }, f: { X: 1 } },
  bedroom: { u: { L: 2, F: 1, S6: 3, S16: 1 }, f: {} },
  bath: { u: { L: 1 }, f: { X: 1 } },
  passage: { u: { L: 1 }, f: {} },
  entrance: { u: { L: 1 }, f: { B: 1 } },
  balcony: { u: { L: 1, S6: 1 }, f: {} },
  utility: { u: { L: 1 }, f: {} },
  pooja: { u: { L: 1, S6: 1 }, f: {} },
}

/** Room sizes are not asked; they are shared out of the floor area by these weights (Assumed), then held between these limits (m²). */
export const AREA_KINDS = ['hall', 'dining', 'kitchen', 'bedroom', 'bath', 'passage', 'utility', 'pooja'] as const
export type AreaKind = (typeof AREA_KINDS)[number]
export const W: Record<AreaKind, number> = { hall: 1.6, dining: 0.9, kitchen: 0.8, bedroom: 1.0, bath: 0.35, passage: 0.5, utility: 0.3, pooja: 0.25 }
export const A_MIN: Record<AreaKind, number> = { hall: 9.5, dining: 6, kitchen: 5, bedroom: 9.5, bath: 2.8, passage: 3, utility: 2.5, pooja: 1.5 }
export const A_MAX: Record<AreaKind, number> = { hall: 30, dining: 14, kitchen: 14, bedroom: 20, bath: 6, passage: 10, utility: 6, pooja: 3 }
export const FIXED_M2: Record<'entrance' | 'balcony', number> = { entrance: 4, balcony: 4.5 }
export const CARPET_SHARE = 0.75

export const NAME: Record<Kind, string> = {
  hall: 'Hall or living room', dining: 'Dining room', kitchen: 'Kitchen', bedroom: 'Bedroom', bath: 'Bathroom', passage: 'Passage',
  entrance: 'Entrance', balcony: 'Balcony', utility: 'Wash area or dry balcony', pooja: 'Pooja room',
}

/** Wire. DAR 2016 item 1.1: 3 m each of live and neutral and 1.5 m of earth per point in Group A, 4 + 4 + 2 in Group B; 1.01 m of conductor per metre of route; 5% waste. */
export const COIL_M = 90
export const WASTE = 1.05
export const RUN = 1.01
export const DAR = { A: { wire: 3.0, earth: 1.5, conduit: 2.5, couplers: 0, saddles: 4 }, B: { wire: 4.0, earth: 2.0, conduit: 3.5, couplers: 2, saddles: 9 } }
/** Per metre of circuit route (DAR items 1.5, 1.7: per 50 m, 4 bends, 15 couplers, 85 saddles, 6 junction boxes on power runs). */
export const PER_M = { bends: 4 / 50, couplers: 15 / 50, saddles: 85 / 50, jbox: 6 / 50 }

/** Connected load per point in watts: draft IS 4648 Table 5 (light 50, fan 75, 6 A outlet 100), CPWD GS 3.9 (16 A socket 1,000), draft Table 6 (appliances). */
export const WATTS = { L: 50, F: 75, X: 75, S6: 100, S16: 1000, ac: 1500, geyser: 2000, washer: 2000, dish: 1500, pump: 1100, ev: 7400 }

export const floorName = (i: number) => ['Ground floor', 'First floor', 'Second floor', 'Third floor', 'Fourth floor', 'Fifth floor', 'Sixth floor', 'Seventh floor', 'Eighth floor', 'Ninth floor'][i] ?? `Floor ${i}`

export function spread(total: number, n: number): number[] {
  const base = Math.floor(total / n)
  const rem = total % n
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0))
}

/* Mains size, conduit, main breaker and earth conductor come from ./wire, shared with the free Wire Size calculator. */
/** Distribution board sizes seen in tender schedules (outgoing ways). */
export const SPN_WAYS = [4, 6, 8, 12, 16, 18, 24, 32] as const
export const TPN_WAYS = [4, 6, 8, 12, 16, 24] as const
export const waysFor = (n: number, three: boolean) => {
  const list = three ? TPN_WAYS : SPN_WAYS
  return list.find((w) => n <= w) ?? Math.ceil(n / 8) * 8
}
export const rccbA = (inc: number) => (inc <= 40 ? 40 : inc <= 63 ? 63 : 100)

/* ───────────────────────── the model's planning rules, as numbers ───────────────────────── */

/** Counts and lengths that model.ts used to write inline. Code, Derived or Assumed as the report says; the notes name the kind. */
export const RULE = {
  /** Assumed: floor to floor height when none is given, m */
  storeyDefaultM: 3.0,
  /** Assumed: one room is one 'unit' of lights, fans and sockets for each this many m² of its area */
  unitM2: 12,
  /** Assumed: air-conditioned rooms in a home are held to the bedrooms plus this many (the hall) */
  acBeyondBedrooms: 1,
  /** Assumed: transfer pumps, one for a single home and two (one standing by) from this many homes */
  pumpsOne: 1,
  pumpsTwo: 2,
  pumpsTwoFromHomes: 2,
  /** Assumed: EV charger circuits for each parking space (0.2 = one in five), and at least one */
  evPerSpace: 0.2,
  /** Assumed: lights and sockets in the common areas */
  stairLightsPerFloor: 2,
  liftLobbyLightsPerFloor: 2,
  houseStairLights: 2,
  terraceLightsMulti: 2,
  terraceLightsSingle: 1,
  terraceS6: 1,
  gateLights: 2,
  parkingLightsMin: 2,
  parkingLightsPerSpace: 0.5,
  parkingS6: 2,
  /** Assumed: DAR Group A at this built-up area (sq ft) and Group B at the other, in a straight line between */
  groupAFromSqft: 1000,
  groupBFromSqft: 2500,
  /** Code (CPWD DAR 2016 item 1.1): copper size of the wire in a point, mm², and its conduit, mm */
  pointMm2: 1.5,
  pointConduitMm: 20,
  /** Assumed: run from the nearest point to a socket, m: base plus rise times the Group factor; and the copper used */
  tapBaseM: 2.5,
  tapRiseM: 1.5,
  tapMm2: { std: 2.5, basic: 1.5, s16: 2.5 },
  /** Assumed: TV and data conduit from the board's media box, m: this times the side of the home plus the base */
  mediaPerSqrtM: 0.5,
  mediaBaseM: 3,
  /** Code (draft IS 4648 cl 6.2.1) and Assumed: points on one circuit */
  ptsPerBathCkt: 8,
  ptsPerLightCkt: 8,
  /** Code (IS 4648:1968 cl 7.2): points, with the 5 A sockets, on one lighting circuit in the Basic level */
  ptsPerLightCktBasic: 10,
  minLightCkts: 2,
  /** Assumed: 6 A sockets on one circuit; Code (CPWD GS 3.10 iii, draft cl 6.2.2): 6/16 A outlets on one circuit */
  s6PerCkt: 8,
  s16PerCkt: 2,
  /** Assumed: metres from a board to the first point of a circuit: this times the side of the home plus the base */
  routeLight: 0.6,
  routeSock: 0.7,
  routeDed: 0.8,
  routeGround: 0.8,
  routeBaseM: 3,
  /** Assumed: transfer pump, inverter and EV charger circuits */
  pumpMm2: 2.5,
  pumpRouteM: 15,
  inverterMm2: 4,
  inverterRouteM: 6,
  evMm2: 6,
  /** Breaker ratings counted, in amperes (the cable column of the report reads the same sizes from ./wire) */
  mcb: { light: 6, sockets6: 10, sockets6Basic: 6, power: 16, ac: 20, ev: 32 },
  /** Assumed: spare ways left on a board */
  spareWays: 1,
  /** Assumed: a house's upper-floor board takes at least this share of the design load (kW); its sub-main is at least this size (mm²) and this much longer than the height (m) */
  subBoardMinKw: 1.5,
  subMainMinMm2: 4,
  subMainExtraM: 4,
  /** Assumed: design load above which the supply is taken as three-phase, kW */
  threePhaseAboveKw: 10,
  /** Assumed: lengths of the mains, m: meter room to a flat's board (plus the height), to the common board, and to a house's main board */
  mainsFlatM: 12,
  mainsCommonM: 10,
  mainsHouseM: 10,
  /** Assumed: modules in one switch box */
  modulesPerBox: 4,
  /** Assumed: earthing: electrodes for flats (base plus one for each this many homes), for a three-phase house, for a single-phase house; metres of strip from each */
  electrodesFlatsBase: 2,
  electrodesPerHomes: 10,
  electrodesThreePhase: 2,
  electrodesSingle: 1,
  stripPerElectrodeM: 10,
  /** Wire up to this size (mm²) is sold in coils, larger by the metre in steps of this many metres; conduit in lengths of this many metres */
  coilMaxMm2: 6,
  byMetreStepM: 5,
  conduitPieceM: 3,
} as const

/** Design load of a consumer, kW: the larger of the area minimum and a share of the big appliances plus a base. */
export const DESIGN = { wPerM2Carpet: 0.075, applianceShare: 0.6, baseKw: 1.5 } as const
export const designKw = (carpet: number, ded: number) => Math.max(DESIGN.wPerM2Carpet * carpet, DESIGN.applianceShare * ded + DESIGN.baseKw)

/** What a board serves that has a circuit of its own, in kW at the connected-load watts above. */
export interface Dedicated { ac: number; geysers: number; washers: number; dish: number; pumps: number; evs: number }
export const dedicatedKw = (s: Dedicated) => (s.ac * WATTS.ac + s.geysers * WATTS.geyser + s.washers * WATTS.washer + s.dish * WATTS.dish + s.pumps * WATTS.pump + s.evs * WATTS.ev) / 1000

/** Names of the two board kinds, as they are printed and keyed. */
export const PHASE_KIND = { three: 'Three-phase (TPN)', single: 'Single-phase (SPN)' } as const

/** Wire colours: the order they are listed in, the sets used on circuits and on mains. The earth is green-yellow (draft IS 4648 cl 8: "Colour of insulated protective conductor shall be green-yellow"); the colours of the line and neutral wires are the usual ones, an Assumed choice. */
export const COLOUR = { live: 'Red', neutral: 'Black', earth: 'Green-yellow', phase2: 'Yellow', phase3: 'Blue' } as const
export const CIRCUIT_COLOURS: readonly string[] = [COLOUR.live, COLOUR.neutral, COLOUR.earth]
export const MAINS_COLOURS: { single: readonly string[]; three: readonly string[] } = {
  single: [COLOUR.live, COLOUR.neutral],
  three: [COLOUR.live, COLOUR.phase2, COLOUR.phase3, COLOUR.neutral],
}
export const COLOUR_ORDER: readonly string[] = [COLOUR.live, COLOUR.phase2, COLOUR.phase3, COLOUR.neutral, COLOUR.earth]

/** How far off each class of figure is likely to be: multipliers on the figure shown. Assumed. The tiles and the bands of the report both read these. */
export const ELEC_BANDS = {
  points: { label: 'Points and sockets', low: 0.7, high: 1.4 },
  wire: { label: 'Copper wire', low: 0.75, high: 1.35 },
  conduit: { label: 'Conduit', low: 0.8, high: 1.3 },
  circuits: { label: 'Circuits and boards', low: 0.8, high: 1.25 },
  fittings: { label: 'Switches, boxes and fittings', low: 0.75, high: 1.35 },
} as const

/** Stable keys of the purchase lines whose names come from the data. */
export const dbLineKey = (d: { ways: number; kind: string; name: string }) =>
  `db-${d.ways}way-${d.kind.startsWith('Three') ? 'tpn' : 'spn'}-${d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
export const accLineKey = (k: string) => `elec-${k.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`
