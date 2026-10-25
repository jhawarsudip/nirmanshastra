/*
  Wire sizes for a home. The ElectricalPro model (model.ts) and the free Wire Size calculator both read this file, so the
  two can never give different sizes for the same circuit.

  Where each figure comes from (the research is in the project file "research-electrical-2026-10-25"):
    Code     CPWD General Specifications for Electrical Works Part I (Internal) 2013, cl 3.12 and 3.10;
             BIS draft IS 4648 (first revision), ETD 20 (26516) P, September 2024: Table 4 (wire sizes), cl 6.2.8
             (MCB ratings) and cl 8 (earth conductor). The draft is NOT yet a published standard, so these numbers may
             change when it is issued.
    Derived  worked out from a Code figure
    Assumed  no document read fixes it; a stated, editable engineering value

  Where the two sources differ, the choice made here is stated beside the figure:
    CPWD GS 3.12(ii) asks for 4 mm² for power wiring in its own works. The draft IS 4648 Table 4 allows 2.5 mm² on a
    circuit of up to two sockets or one appliance of up to 3 kW. This file follows the draft (2.5 mm²) and says so.

  Not read in any source, so not claimed: cable current ratings and derating factors, the voltage-drop limit. IS 732
  sizes a cable by its current rating, its grouping and its voltage drop; none of those is worked here. A long run needs
  a larger size than the minimum below, which is why the calculator says so.
*/

export type WireStatus = 'code' | 'assumed'

/** Copper sizes sold, in mm². */
export const STD_MM2 = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95] as const

export type CircuitKey = 'lights' | 'sockets6' | 'sockets16' | 'heater' | 'ac'

export interface CircuitRule {
  key: CircuitKey
  /** What the layman says he is wiring. */
  label: string
  /** What sits on the circuit. */
  examples: string
  /** Least copper size, mm². */
  mm2: number
  /** The breaker that goes with it. */
  mcb: string
  status: WireStatus
  /** Where the size comes from, one sentence. */
  source: string
  /** What the code allows on one circuit. */
  limit: string
  /** What goes wrong below this size. */
  risk: string
}

export const CIRCUIT_ORDER: CircuitKey[] = ['lights', 'sockets6', 'sockets16', 'heater', 'ac']

export const CIRCUIT_RULES: Record<CircuitKey, CircuitRule> = {
  lights: {
    key: 'lights',
    label: 'Lights, fans and the bell',
    examples: 'Ceiling lights, tube lights, LED panels, ceiling fans, exhaust fans, the door bell.',
    mm2: 1.5,
    mcb: '6 A',
    status: 'code',
    source: 'CPWD GS 3.12(ii) and draft IS 4648 Table 4 give 1.5 mm² for light, fan and bell points; draft cl 6.2.8 puts a breaker of up to 6 A on a lighting circuit.',
    limit: 'Up to 10 points and 800 W on a circuit in IS 4648:1968 cl 7.2; the draft says 8 points or 1,000 W.',
    risk: 'Thinner than 1.5 mm² is not allowed, even for a single light.',
  },
  sockets6: {
    key: 'sockets6',
    label: '6 A sockets: chargers, TV, small appliances',
    examples: 'Ordinary 3-pin wall sockets for chargers, the TV, a mixer, a lamp.',
    mm2: 2.5,
    mcb: '10 A',
    status: 'code',
    source: 'Draft IS 4648 Table 4 gives 2.5 mm² from the board to the sockets; draft cl 6.2.8 allows up to 10 A where a circuit has more than two 6 A sockets.',
    limit: 'The sources disagree: CPWD GS 3.10 allows up to three 6 A outlets on a power circuit, and the model here counts up to eight sockets on one.',
    risk: 'On 1.5 mm² the wire can overheat when a heater or iron is plugged into a 6 A socket, and the insulation weakens inside the wall.',
  },
  sockets16: {
    key: 'sockets16',
    label: '16 A power sockets: fridge, microwave, iron',
    examples: 'Heavier 3-pin sockets for the fridge, microwave, iron, mixer-grinder, kitchen appliances.',
    mm2: 2.5,
    mcb: '16 A',
    status: 'code',
    source: 'Draft IS 4648 Table 4 gives 2.5 mm² from the board to two 6/16 A outlets; draft cl 6.2.8 gives a 16 A breaker for up to two 16 A outlets.',
    limit: 'Up to two 16 A outlets on one circuit, or 3 kW (CPWD GS 3.10(iii); draft IS 4648 cl 6.2.2).',
    risk: 'CPWD GS 3.12(ii) asks for 4 mm² on power wiring in its own works. The draft allows 2.5 mm²; choose 4 mm² if the run is long or you want spare capacity.',
  },
  heater: {
    key: 'heater',
    label: 'Water heater, washing machine or dishwasher',
    examples: 'A storage geyser, an instant geyser, a washing machine, a dishwasher, a microwave or induction cooker on its own circuit.',
    mm2: 2.5,
    mcb: '16 A',
    status: 'code',
    source: 'Draft IS 4648 Table 4 gives 2.5 mm² from the board to one dedicated point of up to 3 kW (geyser, microwave, induction).',
    limit: 'Every appliance of 2 kW or more has a circuit of its own (draft IS 4648 cl 6.2.2).',
    risk: 'An appliance of 2 kW or more on a shared circuit overloads it. Above 3 kW, the size is worked out for the load and is not this one.',
  },
  ac: {
    key: 'ac',
    label: 'Air conditioner (2 to 3 TR)',
    examples: 'A split or window air conditioner of 2 to 3 TR, on a circuit of its own.',
    mm2: 4,
    mcb: '20 A',
    status: 'code',
    source: 'Draft IS 4648 Table 4 gives 4 mm² from the board to one 16 or 25 A point of up to 5 kW (an air conditioner of 2 to 3 TR); draft cl 6.2.8 gives 20 or 25 A, with a C-curve breaker for the motor.',
    limit: 'One circuit for each air conditioner (draft IS 4648 cl 6.2.2).',
    risk: 'On 2.5 mm² the wire runs hot all the time an air conditioner works, and the breaker may nuisance-trip or fail to protect the wire.',
  },
}

/* ───────────────────────── mains and sub-mains ───────────────────────── */

/** Highest load the draft IS 4648 Table 4 gives a mains size for. */
export const DRAFT_MAINS_LIMIT_KW = 10

/** A look-up written as steps: the value of the first step whose upper limit the figure does not pass, else the value above the last. */
export interface Steps { readonly upTo: readonly (readonly [number, number])[]; readonly above: number }
const stepped = (st: Steps, x: number): number => {
  for (const [hi, v] of st.upTo) if (x <= hi) return v
  return st.above
}

/** Mains copper size (mm²) by design load (kW): the steps behind mainsMm2, shared with the calculation sheet. */
export const MAINS_STEPS: { single: Steps; three: Steps } = {
  single: { upTo: [[5, 4], [7, 6], [10, 10], [14, 16]], above: 25 },
  three: { upTo: [[7, 4], [12, 6], [20, 10]], above: 16 },
}

/** Main breaker (A) by design load (kW): the steps behind incomerA. */
export const INCOMER_STEPS: { single: Steps; three: Steps } = {
  single: { upTo: [[7, 32], [9.2, 40]], above: 63 },
  three: { upTo: [[15, 32], [25, 63]], above: 100 },
}

/** Conduit (mm) by copper size (mm²): the steps behind conduitFor. */
export const CONDUIT_STEPS: { single: Steps; three: Steps } = {
  single: { upTo: [[4, 20], [10, 25], [25, 32]], above: 40 },
  three: { upTo: [[4, 25], [10, 32], [16, 40]], above: 50 },
}

/**
  Mains and sub-main copper size in mm² for a design load in kW.
  Single phase, up to 5 kW 4 mm², to 7 kW 6, to 10 kW 10: draft IS 4648 Table 4, which leaves exactly 7 kW out of its two
  bands (">5 and <7", ">7 and <10"); 7 kW is put with the 6 mm² band here. Above 10 kW the draft asks for diversity and a size
  worked from IS 732 current ratings, so the 16 and 25 mm² steps are Assumed.
  Three phase: the draft only hints (4 or 6 mm² with the load balanced to within 10%), so every three-phase size is Assumed.
*/
export function mainsMm2(kw: number, three: boolean): number {
  return stepped(three ? MAINS_STEPS.three : MAINS_STEPS.single, kw)
}

export function mainsStatus(kw: number, three: boolean): WireStatus {
  return three || kw > DRAFT_MAINS_LIMIT_KW ? 'assumed' : 'code'
}

/** Conduit that goes with a cable set (CPWD DAR 2016 items 1.7.1 to 1.7.11, extended for the larger sizes). */
export function conduitFor(mm2: number, three: boolean): number {
  return stepped(three ? CONDUIT_STEPS.three : CONDUIT_STEPS.single, mm2)
}

/**
  Rating of the main breaker, in amperes. Tender distribution-board items show 32 A double-pole incomers for homes and 63 A
  four-pole for three phase (a secondary source); the other steps are Assumed. The rating follows the cable: a breaker must
  not be larger than the wire it guards, so a 6 mm² supply (up to 7 kW, 30 A) gets 32 A and not 40 A.
*/
export function incomerA(kw: number, three: boolean): number {
  return stepped(three ? INCOMER_STEPS.three : INCOMER_STEPS.single, kw)
}

/** Earth conductor: equal to the line conductor up to 16 mm², half of it above (draft IS 4648 cl 8), taken to the next size sold. */
export function earthMm2(line: number): number {
  if (line <= 16) return line
  const half = line / 2
  return STD_MM2.find((s) => s >= half) ?? line
}
