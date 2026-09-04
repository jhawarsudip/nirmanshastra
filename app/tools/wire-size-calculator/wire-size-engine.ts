// ─────────────────────────────────────────────────────────────────────────────
// WIRE SIZE CALCULATOR — ENGINE (IS 732:2019 Cl 6.2)
//
// Permanently-free, standalone calculator. It maps a household circuit type to
// the minimum copper conductor cross-section required by the wiring code.
//
// AUTHORITATIVE SOURCE — do not overwrite from any other source:
//
//   The wire sizes are IMPORTED verbatim from the paid ElectroPro engine
//   (app/tools/electropro/electropro-engine.ts), which carries the Section 8
//   LOCKED values, so the two tools can never disagree:
//
//     • Lighting & fans        — WIRE_SIZES.lighting.sqmm    = 1.5 sqmm
//     • Power sockets          — WIRE_SIZES.power.sqmm       = 2.5 sqmm
//     • AC / Geyser (2kW+)     — WIRE_SIZES.acGeyser.sqmm    = 4.0 sqmm
//     • Sub-panel feed         — WIRE_SIZES.subPanel.sqmm    = 6.0 sqmm
//     • Main incomer           — WIRE_SIZES.mainIncomer.sqmm = 10.0 sqmm
//
//   These are minimum cross-sections per IS 732:2019 Cl 6.2. This mirrors
//   ElectroPro's real categorical model: correct wire size is chosen by the
//   ROLE of the circuit, not by a generic watts-to-gauge calculation — because
//   the code minimum for each category already accounts for its typical load,
//   grouping, and protective-device rating.
//
// No IS clause is invented here; the categorical table IS the source of truth.
// ─────────────────────────────────────────────────────────────────────────────

// Single-source-of-truth import from the paid ElectroPro engine.
import { WIRE_SIZES } from '../electropro/electropro-engine'

export type CircuitType = 'lighting' | 'power' | 'acGeyser' | 'subPanel' | 'mainIncomer'

export interface CircuitSpec {
  key: CircuitType
  /** Plain-English circuit type shown in the picker (from the LOCKED WIRE_SIZES.use). */
  use: string
  /** Minimum conductor cross-section, mm² (from the LOCKED WIRE_SIZES.sqmm). */
  sqmm: number
  /** Formatted label, e.g. "2.5 sqmm" (from the LOCKED WIRE_SIZES.label). */
  label: string
  /** IS clause (from the LOCKED WIRE_SIZES.isCode). */
  isCode: string
  /** What typically sits on this circuit — context for the picker. */
  examples: string
  /** Typical protective device on this circuit — context only, not a calculation. */
  typicalMCB: string
  /** What goes wrong if this circuit is wired below its code-minimum size. */
  undersizedRisk: string
}

// Display order — light circuits first, feeders last (as on a DB schedule).
export const CIRCUIT_ORDER: CircuitType[] = [
  'lighting',
  'power',
  'acGeyser',
  'subPanel',
  'mainIncomer',
]

// Presentation specs. sqmm / label / use / isCode are pulled straight from the
// imported LOCKED WIRE_SIZES so the free tool can never drift from ElectroPro.
export const CIRCUIT_SPECS: Record<CircuitType, CircuitSpec> = {
  lighting: {
    key: 'lighting',
    use: WIRE_SIZES.lighting.use, // 'Lighting & fans'
    sqmm: WIRE_SIZES.lighting.sqmm, // 1.5
    label: WIRE_SIZES.lighting.label, // '1.5 sqmm'
    isCode: WIRE_SIZES.lighting.isCode,
    examples: 'Ceiling lights, tube lights, LED panels, ceiling fans, exhaust fans.',
    typicalMCB: '6A MCB',
    undersizedRisk:
      'Lighting circuits are already at the code minimum — going below 1.5 sqmm risks conductor heating even at light loads and is not permitted.',
  },
  power: {
    key: 'power',
    use: WIRE_SIZES.power.use, // 'Power sockets'
    sqmm: WIRE_SIZES.power.sqmm, // 2.5
    label: WIRE_SIZES.power.label, // '2.5 sqmm'
    isCode: WIRE_SIZES.power.isCode,
    examples: '5A / 15A wall sockets, TV, fridge, mixer, chargers, general 3-pin points.',
    typicalMCB: '16A MCB',
    undersizedRisk:
      'A general socket ring wired in 1.5 sqmm can overheat when a heater or iron is plugged in, and the insulation degrades over time — a hidden fire risk in the wall.',
  },
  acGeyser: {
    key: 'acGeyser',
    use: WIRE_SIZES.acGeyser.use, // 'AC / Geyser (2kW+)'
    sqmm: WIRE_SIZES.acGeyser.sqmm, // 4.0
    label: WIRE_SIZES.acGeyser.label, // '4.0 sqmm'
    isCode: WIRE_SIZES.acGeyser.isCode,
    examples: 'Split / window AC, storage water heater (geyser), and other 2 kW+ dedicated appliances.',
    typicalMCB: '20A MCB (dedicated circuit)',
    undersizedRisk:
      'A 2 kW+ appliance on 2.5 sqmm draws more current than the wire is rated for. The conductor runs hot continuously, the MCB nuisance-trips or — worse — does not trip, and the point can char and burn.',
  },
  subPanel: {
    key: 'subPanel',
    use: WIRE_SIZES.subPanel.use, // 'Sub-panel feeds'
    sqmm: WIRE_SIZES.subPanel.sqmm, // 6.0
    label: WIRE_SIZES.subPanel.label, // '6.0 sqmm'
    isCode: WIRE_SIZES.subPanel.isCode,
    examples: 'The feeder cable running from the main DB to a floor DB or an outbuilding sub-panel.',
    typicalMCB: '32A MCB / isolator at the sub-panel',
    undersizedRisk:
      'A feeder carries the summed load of every circuit downstream of it. Undersize it and the whole floor or wing is throttled — voltage drops, the feeder overheats, and it becomes the weakest link for the entire sub-panel.',
  },
  mainIncomer: {
    key: 'mainIncomer',
    use: WIRE_SIZES.mainIncomer.use, // 'Main incomer'
    sqmm: WIRE_SIZES.mainIncomer.sqmm, // 10.0
    label: WIRE_SIZES.mainIncomer.label, // '10.0 sqmm'
    isCode: WIRE_SIZES.mainIncomer.isCode,
    examples: 'The service cable from the meter / main switch into the main distribution board.',
    typicalMCB: 'Main MCB / MCCB (32A–63A per demand)',
    undersizedRisk:
      'The incomer carries the entire connected load of the house. An undersized main is the single most dangerous shortcut in a wiring job — it heats under the combined demand of every circuit at once and can fail at the one point protecting the whole installation.',
  },
}

export interface WireSizeResult {
  circuit: CircuitType
  use: string
  sqmm: number
  label: string
  isCode: string
  typicalMCB: string
  examples: string
  undersizedRisk: string
}

/**
 * Return the code-minimum wire size for a household circuit type.
 *
 * This is a categorical lookup, exactly like ElectroPro's WIRE_SIZES table —
 * NOT a watts-based derivation. The five categories return exactly:
 *   lighting → 1.5 · power → 2.5 · acGeyser → 4.0 · subPanel → 6.0 · mainIncomer → 10.0
 * (IS 732:2019 Cl 6.2, minimum cross-sections).
 */
export function calculate(circuit: CircuitType): WireSizeResult {
  const spec = CIRCUIT_SPECS[circuit]
  return {
    circuit: spec.key,
    use: spec.use,
    sqmm: spec.sqmm,
    label: spec.label,
    isCode: spec.isCode,
    typicalMCB: spec.typicalMCB,
    examples: spec.examples,
    undersizedRisk: spec.undersizedRisk,
  }
}
