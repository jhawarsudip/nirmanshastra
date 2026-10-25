// ─────────────────────────────────────────────────────────────────────────────
// WIRE SIZE — CALCULATOR ENGINE
//
// Free, standalone calculator: which circuit is being wired, or how big the home's load is, gives the least copper wire
// size, the breaker that goes with it, the cable set and the conduit.
//
// ONE SOURCE: every size comes from lib/qty/electrical/wire.ts, the same code the ElectricalPro model runs, so this page
// and the paid report give the same wire for the same circuit.
//
//   Circuits   CPWD General Specifications for Electrical Works Part I (Internal) 2013 cl 3.12 and 3.10, and the BIS draft
//              IS 4648 (first revision, September 2024) Table 4 and cl 6.2.8.
//   Supply     draft IS 4648 Table 4: up to 5 kW 4 mm², to 7 kW 6, to 10 kW 10. Above 10 kW, and every three-phase size,
//              is ASSUMED: the draft stops at 10 kW and only hints at three phase.
//   Earth      equal to the line conductor up to 16 mm², half above (draft cl 8).
//   Conduit    CPWD Delhi Analysis of Rates 2016, items 1.7.1 to 1.7.11.
//
// The old version of this page said all five sizes came from "IS 732:2019 Cl 6.2". That clause was never read. The
// 4 mm² air conditioner and the 6 and 10 mm² "sub-panel" and "main incomer" sizes were rules of thumb with no load behind
// them: the real mains size depends on the load, from 4 mm² at 5 kW to 10 mm² at 10 kW. Both were retired.
//
// NOT worked here, because no document read gives the figures: cable current ratings, derating, voltage drop. IS 732 sizes
// a cable by those, so a long run needs more than the minimum below, and the page says so.
// ─────────────────────────────────────────────────────────────────────────────

import {
  CIRCUIT_ORDER,
  CIRCUIT_RULES,
  DRAFT_MAINS_LIMIT_KW,
  conduitFor,
  earthMm2,
  incomerA,
  mainsMm2,
  mainsStatus,
  type CircuitKey,
  type WireStatus,
} from '@/lib/qty/electrical/wire'

export { CIRCUIT_RULES, DRAFT_MAINS_LIMIT_KW }
export type { CircuitKey, WireStatus }

export type WireChoice = CircuitKey | 'mains'
export type Phase = 'single' | 'three'

export const CHOICE_ORDER: WireChoice[] = [...CIRCUIT_ORDER, 'mains']

export const MAINS_LABEL = 'The supply into the house or a flat, from the meter'

export const choiceLabel = (c: WireChoice) => (c === 'mains' ? MAINS_LABEL : CIRCUIT_RULES[c].label)

export interface WireInput {
  choice: WireChoice
  /** Design load in kW, for the supply. */
  kw: number
  phase: Phase
}

export interface WireResult {
  choice: WireChoice
  label: string
  /** Least copper size, mm². */
  mm2: number
  /** Earth conductor, mm². */
  earthMm2: number
  /** "2 × 2.5 mm² + 2.5 mm² earth" */
  cable: string
  conduitMm: number
  /** Breaker: a circuit's own, or the main breaker for the supply. */
  mcb: string
  status: WireStatus
  source: string
  limit: string
  risk: string
  /** Live, neutral and earth colours (CPWD GS 3.5(v)). */
  colours: string
  /** The supply is above the load the draft gives a size for. */
  beyondDraft: boolean
}

export function calculate({ choice, kw, phase }: WireInput): WireResult {
  if (choice === 'mains') {
    const three = phase === 'three'
    const load = Math.max(0, kw)
    const mm2 = mainsMm2(load, three)
    const earth = earthMm2(mm2)
    const status = mainsStatus(load, three)
    return {
      choice,
      label: MAINS_LABEL,
      mm2,
      earthMm2: earth,
      cable: `${three ? 4 : 2} × ${mm2} mm² + ${earth} mm² earth`,
      conduitMm: conduitFor(mm2, three),
      mcb: `${incomerA(load, three)} A, ${three ? 4 : 2}-pole`,
      status,
      source: three
        ? 'The draft IS 4648 Table 4 only hints at three phase (4 or 6 mm² with the load balanced to within 10%), so these sizes are an assumption. Your electricity board fixes the supply and the cable.'
        : load <= DRAFT_MAINS_LIMIT_KW
          ? 'Draft IS 4648 Table 4: up to 5 kW 4 mm², over 5 up to 7 kW 6 mm², over 7 up to 10 kW 10 mm². The table leaves exactly 7 kW out of its two bands; it is put with 6 mm² here.'
          : 'The draft IS 4648 Table 4 stops at 10 kW. Above that it asks for diversity, a size worked from the IS 732 current ratings, a derating factor and one size up, so this size is an assumption.',
      limit: 'The main breaker is never larger than the cable can carry. 32 A is the usual home incomer in tender board items, a secondary source; 40 and 63 A are assumptions.',
      risk: 'The supply cable carries the load of every circuit in the home at once, so an undersized one is the weakest point of the whole installation.',
      colours: three ? 'Red, yellow and blue lines, black neutral, green earth' : 'Red live, black neutral, green earth',
      beyondDraft: !three && load > DRAFT_MAINS_LIMIT_KW,
    }
  }
  const r = CIRCUIT_RULES[choice]
  return {
    choice,
    label: r.label,
    mm2: r.mm2,
    earthMm2: earthMm2(r.mm2),
    cable: `2 × ${r.mm2} mm² + ${earthMm2(r.mm2)} mm² earth`,
    conduitMm: conduitFor(r.mm2, false),
    mcb: r.mcb,
    status: r.status,
    source: r.source,
    limit: r.limit,
    risk: r.risk,
    colours: 'Red live, black neutral, green earth',
    beyondDraft: false,
  }
}

export interface Band {
  /** "Up to 5 kW", "Over 5 up to 7 kW" */
  range: string
  mm2: number
  status: WireStatus
}

/** The supply size at each load band, worked from the same function the calculator uses. */
export function bands(phase: Phase): Band[] {
  const three = phase === 'three'
  const edges = three ? [7, 12, 20] : [5, 7, 10, 14]
  const out: Band[] = []
  edges.forEach((hi, i) => {
    const lo = i === 0 ? 0 : edges[i - 1]
    out.push({ range: i === 0 ? `Up to ${hi} kW` : `Over ${lo} up to ${hi} kW`, mm2: mainsMm2(hi, three), status: mainsStatus(hi, three) })
  })
  const last = edges[edges.length - 1]
  out.push({ range: `Over ${last} kW`, mm2: mainsMm2(last + 1, three), status: 'assumed' })
  return out
}
