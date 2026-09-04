// ─────────────────────────────────────────────────────────────────────────────
// DAILY-WAGE PF & ESI CALCULATOR — ENGINE
//
// Permanently-free, standalone calculator. It reproduces the per-worker net-wage
// computation of a construction-site MUSTER ROLL exactly as laid out in the paid
// "Labour & Statutory Compliance" Wage Register (a standalone Excel product).
//
// This is DELIBERATELY a daily-wage / muster-roll model, not a monthly-CTC one.
// A site labourer is paid on the days actually worked (which vary bill to bill and
// can be fractional — e.g. 23.5 days), on a daily rate, with statutory PF and ESI
// deducted from what was earned. That is a different calculation from the fixed
// monthly-salary PF/ESI tools built for office payroll.
//
// AUTHORITATIVE SOURCE — do not overwrite from any other source:
//
//   These formulas were EXTRACTED DIRECTLY from the Labour & Statutory Compliance
//   product's Wage Register sheet. They are PORTED, never invented:
//
//     • Basic earned = daily wage × payable days
//     • PF (employee) = 12% of basic earned, CAPPED at ₹1,800
//                       (i.e. capped as if basic earned were ₹15,000 — the EPF
//                       statutory wage ceiling; 12% × ₹15,000 = ₹1,800)
//     • ESI (employee) = 0.75% of gross wages, but ONLY if gross wages ≤ ₹21,000;
//                        above the ESI coverage ceiling it is ₹0
//     • Net payable = Gross wages − PF − ESI − Advance   (advance default ₹0)
//
//   Overtime, when entered, is paid at TWICE the ordinary hourly rate — the
//   long-standing statutory overtime rate (Minimum Wages Act 1948 s.14 /
//   Factories Act 1948 s.59 / Code on Wages 2019 s.14) — where the ordinary hourly
//   rate is the daily wage spread over a standard 8-hour working day
//   (Factories Act normal working day). Overtime adds to GROSS wages (and hence to
//   the ESI base) but NOT to the PF base, which stays on basic earned only.
//
// VERIFIED TEST CASES (must hold exactly):
//   1. ₹900/day × 23 days   → basic ₹20,700 · PF ₹1,800 (capped) · ESI ₹155.25 · net ₹18,744.75
//   2. ₹650/day × 20.5 days → basic ₹13,325 · PF ₹1,599 · ESI ₹99.94 · net ₹11,626.06
// ─────────────────────────────────────────────────────────────────────────────

// ── Statutory constants ──────────────────────────────────────────────────────
/** Employee PF contribution rate — EPF Scheme 1952. */
export const PF_EMPLOYEE_RATE = 0.12
/** EPF statutory wage ceiling (₹). PF is capped as if wages were this figure. */
export const PF_WAGE_CEILING = 15000
/** Employee PF is capped at 12% × ₹15,000 = ₹1,800. */
export const PF_EMPLOYEE_CAP = PF_WAGE_CEILING * PF_EMPLOYEE_RATE // 1800

/** Employee ESI contribution rate — ESI (Central) Rules. */
export const ESI_EMPLOYEE_RATE = 0.0075
/** ESI coverage ceiling (₹). At or below this gross, ESI applies; above it, ₹0. */
export const ESI_WAGE_CEILING = 21000

/** Standard working day for spreading the daily wage into an hourly rate. */
export const STANDARD_HOURS_PER_DAY = 8
/** Statutory overtime multiplier — twice the ordinary rate of wages. */
export const OVERTIME_MULTIPLIER = 2

export interface WageInputs {
  /** Daily wage rate agreed on the muster roll, ₹. */
  dailyWage: number
  /** Days payable this period — may be fractional, e.g. 23.5. */
  payableDays: number
  /** Overtime hours worked this period (optional; default 0). */
  overtimeHours: number
  /** Advance already taken by the worker, recovered this period, ₹ (default 0). */
  advance: number
}

export interface WageResult {
  /** dailyWage × payableDays */
  basicEarned: number
  /** overtimeHours × (dailyWage / 8) × 2 */
  overtimePay: number
  /** basicEarned + overtimePay */
  grossWages: number
  /** min(12% × basicEarned, ₹1,800) */
  pf: number
  /** 0.75% × grossWages, or ₹0 when grossWages > ₹21,000 */
  esi: number
  /** true when grossWages ≤ ₹21,000 (ESI applies) */
  esiApplies: boolean
  /** advance recovered this period */
  advance: number
  /** grossWages − pf − esi − advance */
  netPayable: number
}

/** Sanitise a possibly-NaN / negative input to a finite, non-negative number. */
function clean(n: number): number {
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

/**
 * Compute one worker's net wage for a muster-roll period.
 *
 * All amounts derive from the RAW (unrounded) inputs; callers round only for
 * display. PF is on basic earned and hard-capped at ₹1,800. ESI is on the full
 * gross (basic + overtime) and switches off entirely above the ₹21,000 ceiling.
 *
 *   Net Payable = Gross wages − PF − ESI − Advance
 */
export function calculate(inputs: WageInputs): WageResult {
  const dailyWage = clean(inputs.dailyWage)
  const payableDays = clean(inputs.payableDays)
  const overtimeHours = clean(inputs.overtimeHours)
  const advance = clean(inputs.advance)

  const basicEarned = dailyWage * payableDays

  const hourlyRate = dailyWage / STANDARD_HOURS_PER_DAY
  const overtimePay = overtimeHours * hourlyRate * OVERTIME_MULTIPLIER

  const grossWages = basicEarned + overtimePay

  // PF: 12% of basic earned, capped at ₹1,800 (as if basic were ₹15,000).
  const pf = Math.min(PF_EMPLOYEE_RATE * basicEarned, PF_EMPLOYEE_CAP)

  // ESI: 0.75% of gross wages, only while gross ≤ the ₹21,000 coverage ceiling.
  const esiApplies = grossWages <= ESI_WAGE_CEILING
  const esi = esiApplies ? ESI_EMPLOYEE_RATE * grossWages : 0

  const netPayable = grossWages - pf - esi - advance

  return {
    basicEarned,
    overtimePay,
    grossWages,
    pf,
    esi,
    esiApplies,
    advance,
    netPayable,
  }
}
