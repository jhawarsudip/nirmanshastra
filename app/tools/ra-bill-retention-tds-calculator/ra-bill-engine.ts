// ─────────────────────────────────────────────────────────────────────────────
// RA BILL — RETENTION, GST & TDS CALCULATOR — ENGINE
//
// The net payable on a Running Account (RA) bill:
//
//   Net Payable = Gross Bill Value − Retention − Advance Recovery + GST − TDS
//
//   • Retention = retention% × gross bill value          (starts at 5%; the contract fixes it)
//   • GST       = GST% × gross bill value                (starts at 18%)
//   • TDS       = TDS% × gross bill value, on the value WITHOUT GST
//   • Advance recovery = a rupee amount entered, not a percentage (starts at ₹0)
//
// WHERE THE RATES COME FROM, AND HOW SURE EACH ONE IS
//   Read from guides, not from the Act or the notifications, which were not
//   reachable from this workspace. Confirm them before relying on them.
//   • TDS: section 393(1) of the Income-tax Act 2025, applying from 1 April 2026
//     and replacing section 194C of the 1961 Act for contractor payments.
//     1% for an individual or HUF contractor, 2% for any other, 20% with no PAN.
//     No TDS on a single payment of ₹30,000 or less unless payments to the
//     contractor in the year pass ₹1,00,000 (this calculator does not test that).
//     When GST is shown separately on the bill, TDS is on the amount without it.
//     The table row of section 393(1) for these payments is not cited, because it
//     was found in one source only.
//   • GST: 18% is the general rate for works contract services. The 12% entries
//     that remained were moved to 18% on 22 September 2025. The default never
//     implies a reduced "residential" rate; the user may edit it.
//   • Retention and the advance: contract terms, not law. The calculator takes
//     retention on the gross bill value before GST.
//
// WORKED REFERENCE (from the Billing & Measurement RA Bill sheet this was first built from):
//   Gross ₹178,824.5608 · retention 5% · TDS 1% · GST 18% · advance ₹26,823.68412
//     → retention ₹8,941.23 · GST ₹32,188.42 · TDS ₹1,788.25 · net ₹173,459.82
// ─────────────────────────────────────────────────────────────────────────────

export interface RABillInputs {
  /** Gross RA bill value (value of work done this bill, before deductions), ₹. */
  grossBillValue: number
  /** Retention percentage withheld against defects (starts at 5). */
  retentionPct: number
  /** TDS percentage on the contractor payment (1 or 2 usually; starts at 1). */
  tdsPct: number
  /** GST percentage added on the gross bill value (starts at 18). */
  gstPct: number
  /** Advance recovered in this bill, ₹ (starts at 0). */
  advanceRecovery: number
}

export interface RABillResult {
  grossBillValue: number
  /** retentionPct × grossBillValue */
  retention: number
  /** gstPct × grossBillValue (added) */
  gst: number
  /** tdsPct × grossBillValue, on the value without GST (deducted) */
  tds: number
  /** advance recovered this bill (deducted) */
  advanceRecovery: number
  /** gross − retention − advance + gst − tds */
  netPayable: number
}

export const RA_BILL_DEFAULTS = {
  retentionPct: 5,
  tdsPct: 1,
  gstPct: 18,
  advanceRecovery: 0,
} as const

/** TDS on a contractor payment: 1% for an individual or HUF, 2% for any other. */
export const TDS_INDIVIDUAL_PCT = 1
export const TDS_OTHER_PCT = 2

/** Net payable on a Running Account bill. Callers round only for display. */
export function calculate(inputs: RABillInputs): RABillResult {
  const clean = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0)
  const gross = clean(inputs.grossBillValue)
  const retentionPct = clean(inputs.retentionPct)
  const gstPct = clean(inputs.gstPct)
  const tdsPct = clean(inputs.tdsPct)
  const advanceRecovery = clean(inputs.advanceRecovery)

  const retention = (retentionPct / 100) * gross
  const gst = (gstPct / 100) * gross
  const tds = (tdsPct / 100) * gross

  const netPayable = gross - retention - advanceRecovery + gst - tds

  return { grossBillValue: gross, retention, gst, tds, advanceRecovery, netPayable }
}
