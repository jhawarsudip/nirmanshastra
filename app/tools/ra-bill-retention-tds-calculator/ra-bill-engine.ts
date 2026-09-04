// ─────────────────────────────────────────────────────────────────────────────
// RA BILL — RETENTION, GST & TDS CALCULATOR — ENGINE
//
// Permanently-free, standalone calculator. It reproduces the net-payable
// computation of a Running Account (RA) bill exactly as laid out in the paid
// "Billing & Measurement" Excel product's RA Bill sheet.
//
// AUTHORITATIVE SOURCE — do not overwrite from any other source:
//
//   These values and the formula were EXTRACTED DIRECTLY from the Billing &
//   Measurement product's RA Bill spreadsheet (a standalone Excel file, not a
//   web-app module). The formula is PORTED, never invented:
//
//     Net Payable = Gross Bill Value − Retention − Advance Recovery + GST − TDS
//
//     • Retention  = retention% × Gross Bill Value            (default 5%)
//     • GST        = GST%       × Gross Bill Value            (default 18%)
//     • TDS        = TDS%       × Gross Bill Value            (default 1%, range 1–2%)
//                    — computed on the value EXCLUDING GST, i.e. the gross bill
//                      value, per Section 393(1) of the Income-tax Act 2025,
//                      Table Sl. No. 6(i) (the contractor / works-payment row).
//     • Advance Recovery = a rupee amount entered directly (default ₹0), not a %.
//
//   The default GST rate is 18%. The source product carries NO evidence of a
//   reduced residential-composite rate, so none is implied here — the user may
//   edit the rate, but the tool never suggests a lower "residential" GST exists.
//
// WORKED REFERENCE (from the real product's own RA Bill sheet):
//   Gross ₹178,824.5608 · retention 5% · TDS 1% · GST 18% · advance ₹26,823.68412
//     → retention ₹8,941.23 · GST ₹32,188.42 · TDS ₹1,788.25 · net ₹173,459.82
// ─────────────────────────────────────────────────────────────────────────────

export interface RABillInputs {
  /** Gross RA bill value (value of work done this bill, before deductions), ₹. */
  grossBillValue: number
  /** Retention percentage withheld against defect liability (default 5). */
  retentionPct: number
  /** TDS percentage on works contract, range 1–2 (default 1). */
  tdsPct: number
  /** GST percentage added on the gross bill value (default 18). */
  gstPct: number
  /** Mobilisation / material advance recovered in this bill, ₹ (default 0). */
  advanceRecovery: number
}

export interface RABillResult {
  grossBillValue: number
  /** retentionPct × grossBillValue */
  retention: number
  /** gstPct × grossBillValue (added) */
  gst: number
  /** tdsPct × grossBillValue — on the value EXCLUDING GST (deducted) */
  tds: number
  /** advance recovered this bill (deducted) */
  advanceRecovery: number
  /** gross − retention − advance + gst − tds */
  netPayable: number
}

// Defaults — exactly as pre-filled on the Excel RA Bill sheet.
export const RA_BILL_DEFAULTS = {
  retentionPct: 5,
  tdsPct: 1,
  gstPct: 18,
  advanceRecovery: 0,
} as const

// TDS on works contracts is bounded to 1–2% (Income-tax Act 2025 s.393(1),
// Table Sl. No. 6(i) — the contractor/works-payment row).
export const TDS_MIN_PCT = 1
export const TDS_MAX_PCT = 2

/**
 * Compute the net payable on a Running Account bill.
 *
 * All component amounts are derived from the RAW (unrounded) inputs; callers
 * round only for display. Retention, GST and TDS are each a straight percentage
 * of the gross bill value. TDS is deliberately computed on the value EXCLUDING
 * GST (i.e. the gross bill value), never on gross+GST.
 *
 *   Net Payable = Gross − Retention − Advance Recovery + GST − TDS
 */
export function calculate(inputs: RABillInputs): RABillResult {
  const gross = Number.isFinite(inputs.grossBillValue) ? Math.max(0, inputs.grossBillValue) : 0
  const retentionPct = Number.isFinite(inputs.retentionPct) ? Math.max(0, inputs.retentionPct) : 0
  const gstPct = Number.isFinite(inputs.gstPct) ? Math.max(0, inputs.gstPct) : 0
  const tdsPct = Number.isFinite(inputs.tdsPct) ? Math.max(0, inputs.tdsPct) : 0
  const advanceRecovery = Number.isFinite(inputs.advanceRecovery) ? Math.max(0, inputs.advanceRecovery) : 0

  const retention = (retentionPct / 100) * gross
  const gst = (gstPct / 100) * gross
  // TDS base = gross bill value (EXCLUDING GST), per s.393(1) Table Sl. No. 6(i).
  const tds = (tdsPct / 100) * gross

  const netPayable = gross - retention - advanceRecovery + gst - tds

  return {
    grossBillValue: gross,
    retention,
    gst,
    tds,
    advanceRecovery,
    netPayable,
  }
}
