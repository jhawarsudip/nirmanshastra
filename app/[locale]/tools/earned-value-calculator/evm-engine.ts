// ─────────────────────────────────────────────────────────────────────────────
// EARNED VALUE (EVM) CALCULATOR — ENGINE
//
// Permanently-free, standalone calculator. It reproduces the earned-value
// analysis of the paid "Planning, Progress & Delay Control" product's Earned
// Value sheet exactly — the same eight metrics off the same four inputs.
//
// AUTHORITATIVE SOURCE — do not overwrite from any other source:
//
//   These are the standard Earned Value Management (EVM) formulas, confirmed
//   against the Planning / Progress product's own worked example. The formulas
//   are PORTED, never invented:
//
//     SV   = EV − PV                 (schedule variance, ₹)
//     CV   = EV − AC                 (cost variance, ₹)
//     SPI  = EV ÷ PV                 (schedule performance index)
//     CPI  = EV ÷ AC                 (cost performance index)
//     EAC  = BAC ÷ CPI              (estimate at completion, ₹)
//     ETC  = EAC − AC               (estimate to complete, ₹)
//     VAC  = BAC − EAC              (variance at completion, ₹)
//     TCPI = (BAC − EV) ÷ (BAC − AC) (to-complete performance index)
//
// WORKED REFERENCE (the product's real example — the tool must reproduce it):
//   BAC ₹3,330,373 · PV ₹1,307,160.87 · EV ₹1,143,012.03 · AC ₹1,169,100
//     → SV −₹164,148.84 · CV −₹26,087.97 · SPI 0.8744 · CPI 0.9777
//     → EAC ₹3,406,385.04 · ETC ₹2,237,285.04 · VAC −₹76,012.04 · TCPI 1.0121
//
// EAC is computed as BAC ÷ CPI using the FULL-PRECISION CPI (never a rounded
// value); callers round only for display. Indices that would divide by zero
// (PV, AC or BAC−AC = 0) return null so the UI can show them as not-computable
// rather than as Infinity or NaN.
// ─────────────────────────────────────────────────────────────────────────────

export interface EVMInputs {
  /** Budget at Completion — the total approved project budget, ₹. */
  bac: number
  /** Planned Value to date — budgeted cost of work scheduled by now, ₹. */
  pv: number
  /** Earned Value to date — budgeted cost of work actually completed, ₹. */
  ev: number
  /** Actual Cost to date — real spend on the work completed, ₹. */
  ac: number
}

export interface EVMResult {
  bac: number
  pv: number
  ev: number
  ac: number
  /** EV − PV. Negative = behind schedule (in money terms). */
  sv: number
  /** EV − AC. Negative = over cost. */
  cv: number
  /** EV ÷ PV. <1 = behind schedule. null if PV = 0. */
  spi: number | null
  /** EV ÷ AC. <1 = over cost. null if AC = 0. */
  cpi: number | null
  /** BAC ÷ CPI — forecast final cost at current cost efficiency. null if CPI unavailable or 0. */
  eac: number | null
  /** EAC − AC — forecast remaining spend. null if EAC unavailable. */
  etc: number | null
  /** BAC − EAC — forecast final over/under run. null if EAC unavailable. */
  vac: number | null
  /** (BAC − EV) ÷ (BAC − AC) — cost efficiency the rest of the work must hit to finish on budget. null if BAC = AC. */
  tcpi: number | null
}

/** The 2×2 SPI/CPI reading — schedule × cost, as the source product presents it. */
export type EVMQuadrantKey = 'best' | 'onTimeOverCost' | 'behindUnderCost' | 'worst' | 'incomplete'

export interface EVMQuadrant {
  key: EVMQuadrantKey
  /** Short label, e.g. "Behind schedule & over cost". */
  title: string
  /** Plain-language reading of what the two indices together mean. */
  reading: string
  /** 'good' | 'warn' | 'bad' — drives the stamp colour in the UI. */
  tone: 'good' | 'warn' | 'bad' | 'neutral'
}

const isFiniteNum = (n: number) => Number.isFinite(n)

/**
 * Compute the full earned-value analysis from the four inputs.
 *
 * Everything is derived from the RAW inputs; callers round only for display.
 * EAC uses the full-precision CPI (EV/AC), so EAC = BAC ÷ CPI = BAC × AC ÷ EV.
 */
export function calculate(inputs: EVMInputs): EVMResult {
  const bac = isFiniteNum(inputs.bac) ? Math.max(0, inputs.bac) : 0
  const pv = isFiniteNum(inputs.pv) ? Math.max(0, inputs.pv) : 0
  const ev = isFiniteNum(inputs.ev) ? Math.max(0, inputs.ev) : 0
  const ac = isFiniteNum(inputs.ac) ? Math.max(0, inputs.ac) : 0

  const sv = ev - pv
  const cv = ev - ac
  const spi = pv > 0 ? ev / pv : null
  const cpi = ac > 0 ? ev / ac : null

  // EAC = BAC ÷ CPI, using full-precision CPI (not a display-rounded one).
  const eac = cpi !== null && cpi > 0 ? bac / cpi : null
  const etc = eac !== null ? eac - ac : null
  const vac = eac !== null ? bac - eac : null

  // TCPI = (BAC − EV) ÷ (BAC − AC). Undefined when BAC = AC (no budget left).
  const tcpi = bac - ac !== 0 ? (bac - ev) / (bac - ac) : null

  return { bac, pv, ev, ac, sv, cv, spi, cpi, eac, etc, vac, tcpi }
}

/**
 * Map SPI and CPI onto the source product's 2×2 reading guide.
 * An index of exactly 1.0 counts as on-target (the "≥1" side).
 */
export function readQuadrant(spi: number | null, cpi: number | null): EVMQuadrant {
  if (spi === null || cpi === null) {
    return {
      key: 'incomplete',
      title: 'Not enough to read yet',
      reading:
        'Both a Planned Value and an Actual Cost are needed to place the project on the schedule × cost grid. Enter non-zero PV and AC to read the quadrant.',
      tone: 'neutral',
    }
  }

  const onSchedule = spi >= 1
  const onCost = cpi >= 1

  if (onSchedule && onCost) {
    return {
      key: 'best',
      title: 'Ahead / on schedule and on budget',
      reading:
        'SPI ≥ 1 and CPI ≥ 1 — the best quadrant. You have earned at least as much value as was planned by now, and spent no more than that value cost. The project is both on time and on cost.',
      tone: 'good',
    }
  }
  if (onSchedule && !onCost) {
    return {
      key: 'onTimeOverCost',
      title: 'On time but over cost',
      reading:
        'SPI ≥ 1 but CPI < 1 — progress is on or ahead of schedule, but each rupee of earned value is costing more than budgeted. The slip is in money, not time: watch the cost run, not the calendar.',
      tone: 'warn',
    }
  }
  if (!onSchedule && onCost) {
    return {
      key: 'behindUnderCost',
      title: 'Behind schedule but under cost',
      reading:
        'SPI < 1 but CPI ≥ 1 — spending is efficient, but less value has been earned than planned by now. The project is running slow, not expensive: the risk is the schedule, and any liquidated-damages exposure with it.',
      tone: 'warn',
    }
  }
  return {
    key: 'worst',
    title: 'Behind schedule and over cost',
    reading:
      'SPI < 1 and CPI < 1 — the worst quadrant. Less value earned than planned, and what has been earned cost more than budgeted. The project is both late and over budget; this is where recovery action is most urgent.',
    tone: 'bad',
  }
}
