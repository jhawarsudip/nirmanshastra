// ─────────────────────────────────────────────────────────────────────────────
// DAILY-WAGE PF & ESI CALCULATOR — ENGINE
//
// A muster-roll model: a daily rate across the days worked (which can be a part
// day, 23.5), with the worker's own PF and ESI taken out of what was earned.
// It is not a monthly-CTC payroll tool. It shows the WORKER'S deductions only;
// the employer's own PF and ESI share is a separate cost and is not computed.
//
// WHAT THE RULES ARE, AND HOW SURE EACH ONE IS
//   Read from secondary sources (payroll-guide pages), not from the statutes or
//   the EPFO and ESIC sites, which were not reachable from this workspace. Check
//   the ceilings against the current notifications before relying on them.
//
//   • Basic earned = daily wage × payable days.
//   • PF (employee) = 12% of basic earned, capped at ₹1,800, which is 12% of the
//     ₹15,000 EPF wage ceiling. Contributions on wages above the ceiling are by
//     agreement, not mandatory. The EPF Scheme 2026 (notified 29 June 2026 under
//     the Code on Social Security 2020, replacing the EPF Scheme 1952) leaves the
//     ceiling at ₹15,000.
//   • ESI (employee) = 0.75% of wages, in force at the time of writing.
//       - Coverage is tested on wages EXCLUDING overtime, against ₹21,000 a month.
//       - Once covered, the contribution is taken on all wages, overtime included.
//       - An employee whose average daily wage is ₹176 or less pays no employee
//         share (the employer still pays its own).
//       - Coverage is fixed for each six-month contribution period (April to
//         September, October to March): a worker covered at the start of a period
//         stays covered to its end even if wages cross ₹21,000. This calculator
//         tests the wages you enter, one period at a time, and says so.
//   • Overtime = twice the ordinary hourly rate (Code on Wages 2019 s.14, in
//     force from 21 November 2025). The ordinary hourly rate is the daily wage
//     over an 8-hour day (ASSUMPTION: the Code leaves normal hours to the
//     employer's terms; 8 is the usual working day).
//   • Overtime adds to GROSS wages and to the ESI base, but not to the PF base,
//     which stays on basic earned (the Code's definition of wages leaves out
//     overtime allowance).
//   • Net payable = gross wages − PF − ESI − advance.
//
// CHANGED FROM THE FIRST VERSION: the ESI coverage test used gross wages with
// overtime. The sources read for this rewrite say overtime is left out of that
// test, and that the ₹176 daily-wage exemption exists; both are now modelled.
//
// CHECK CASES (scripts/qty/calc-check.cjs):
//   1. ₹900/day × 23 days   → basic 20,700 · PF 1,800 (capped) · ESI 155.25 · net 18,744.75
//   2. ₹650/day × 20.5 days → basic 13,325 · PF 1,599 · ESI 99.9375 · net 11,626.0625
//   3. ₹800/day × 26 days + 8 h overtime → basic 20,800 (covered), gross 22,400,
//      PF 1,800, ESI 168 (on gross), net 20,432
//   4. ₹900/day × 24 days   → basic 21,600 > 21,000 → ESI 0
//   5. ₹170/day × 26 days   → average daily wage ≤ 176 → ESI 0
// ─────────────────────────────────────────────────────────────────────────────

// ── Constants ────────────────────────────────────────────────────────────────
/** Employee PF contribution rate. */
export const PF_EMPLOYEE_RATE = 0.12
/** EPF statutory wage ceiling (₹ a month). Mandatory PF is on wages up to this. */
export const PF_WAGE_CEILING = 15000
/** Employee PF is capped at 12% × ₹15,000 = ₹1,800. */
export const PF_EMPLOYEE_CAP = PF_WAGE_CEILING * PF_EMPLOYEE_RATE // 1800

/** Employee ESI contribution rate. */
export const ESI_EMPLOYEE_RATE = 0.0075
/** ESI coverage ceiling (₹ a month), tested on wages without overtime. */
export const ESI_WAGE_CEILING = 21000
/** Average daily wage (₹) up to which the employee's ESI share is not taken. */
export const ESI_DAILY_EXEMPT = 176

/** Standard working day for turning the daily wage into an hourly rate. */
export const STANDARD_HOURS_PER_DAY = 8
/** Overtime multiplier: twice the ordinary rate. */
export const OVERTIME_MULTIPLIER = 2

export interface WageInputs {
  /** Daily wage rate agreed on the muster roll, ₹. */
  dailyWage: number
  /** Days payable this period, may be a part day such as 23.5. */
  payableDays: number
  /** Overtime hours worked this period (default 0). */
  overtimeHours: number
  /** Advance already taken, recovered this period, ₹ (default 0). */
  advance: number
}

/** Why ESI is or is not taken. */
export type EsiStatus = 'applies' | 'above-ceiling' | 'daily-exempt'

export interface WageResult {
  /** dailyWage × payableDays */
  basicEarned: number
  /** overtimeHours × (dailyWage / 8) × 2 */
  overtimePay: number
  /** basicEarned + overtimePay */
  grossWages: number
  /** min(12% × basicEarned, ₹1,800) */
  pf: number
  /** true when 12% of basic would have exceeded the cap */
  pfCapped: boolean
  /** 0.75% of gross wages when covered; otherwise 0 */
  esi: number
  /** applies, or why not */
  esiStatus: EsiStatus
  /** gross ÷ payable days; 0 when no days */
  averageDailyWage: number
  /** advance recovered this period */
  advance: number
  /** grossWages − pf − esi − advance (can be negative if the advance is large) */
  netPayable: number
}

/** A possibly-NaN or negative input as a finite, non-negative number. */
function clean(n: number): number {
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

/**
 * One worker's net wage for a muster-roll period. Everything derives from the raw
 * inputs; callers round only for display.
 */
export function calculate(inputs: WageInputs): WageResult {
  const dailyWage = clean(inputs.dailyWage)
  const payableDays = clean(inputs.payableDays)
  const overtimeHours = clean(inputs.overtimeHours)
  const advance = clean(inputs.advance)

  const basicEarned = dailyWage * payableDays
  const overtimePay = overtimeHours * (dailyWage / STANDARD_HOURS_PER_DAY) * OVERTIME_MULTIPLIER
  const grossWages = basicEarned + overtimePay

  const pfFlat = PF_EMPLOYEE_RATE * basicEarned
  const pf = Math.min(pfFlat, PF_EMPLOYEE_CAP)
  const pfCapped = pfFlat > PF_EMPLOYEE_CAP

  const averageDailyWage = payableDays > 0 ? grossWages / payableDays : 0
  let esiStatus: EsiStatus = 'applies'
  if (basicEarned > ESI_WAGE_CEILING) esiStatus = 'above-ceiling'
  else if (grossWages > 0 && averageDailyWage <= ESI_DAILY_EXEMPT) esiStatus = 'daily-exempt'
  const esi = esiStatus === 'applies' ? ESI_EMPLOYEE_RATE * grossWages : 0

  const netPayable = grossWages - pf - esi - advance

  return { basicEarned, overtimePay, grossWages, pf, pfCapped, esi, esiStatus, averageDailyWage, advance, netPayable }
}
