// ─────────────────────────────────────────────────────────────────────────────
// TOOL PRICING — server-trusted source of truth (single source of truth)
//
// Used by:
//   - app/api/payments/create-order/route.ts  (price lookup by estimate.app_type)
//   - every page, menu, card, FAQ answer, email, JSON-LD block and llms.txt line that shows a price.
//     None of them type a rupee figure: they all read the figures below (see `rupees` and the
//     label constants at the foot of this file). scripts/check-pricing.ts fails if an old figure
//     is typed anywhere else.
//
// The charge amount for every paid product is defined HERE and looked up SERVER-SIDE
// from the estimate's `app_type`. The browser never supplies or influences the
// amount — it only identifies which estimate is being unlocked. This closes the
// client-amount-tampering vector: a user cannot pay less than the real price by
// editing the request, even if the tampered value happens to match today.
//
// Values are in paise (229900 = ₹2,299). Old orders keep the amount they were charged:
// the amount is written to `payments.amount` when the order is created and is never recomputed,
// so changing a price here cannot change access for anyone who has already paid.
//
// Prices changed on 26 Oct 2026 (SJ):
//   StructurePro 999 → 2,299 · MasonryPro 699 → 1,299 · ElectricalPro 499 → 999
//   PlumbingPro 499 → 999 · InteriorPro 899 → 1,499 · Grand Total unchanged at 999
//   Complete House Pack (new) 4,999
// ─────────────────────────────────────────────────────────────────────────────

// The paid `app_type` values stored on the `estimates` table for a single report.
export type PaidAppType =
  | 'structopro'
  | 'masonpro'
  | 'electropro'
  | 'plumbpro'
  | 'interiorpro'
  | 'grandtotal'

// The `app_type` of a Complete House Pack purchase (one estimate row that holds the pack and its claims).
export const PACK_APP_TYPE = 'completepack' as const

// Charge amount per tool, in paise. This is the ONLY authority for what a
// report costs — never trust an amount sent from the client.
export const TOOL_PRICE_PAISE: Record<PaidAppType, number> = {
  structopro:  229900, // StructurePro   — ₹2,299
  masonpro:    129900, // MasonryPro      — ₹1,299
  electropro:   99900, // ElectricalPro   — ₹999
  plumbpro:     99900, // PlumbingPro     — ₹999
  interiorpro: 149900, // InteriorPro     — ₹1,499
  grandtotal:   99900, // Grand Total Report — ₹999
}

/** The Complete House Pack: all five reports and the Grand Total, for one house. */
export const PACK_PRICE_PAISE = 499900 // ₹4,999

/** The six reports the pack unlocks, one each. */
export const PACK_CONTAINS: readonly PaidAppType[] = ['structopro', 'masonpro', 'electropro', 'plumbpro', 'interiorpro', 'grandtotal']

/**
 * How many estimates of one kind a pack will unlock. 2 means the report itself and one correction if the
 * customer typed a wrong figure the first time. Set to 1 for strictly one report of each kind.
 */
export const PACK_CLAIMS_PER_REPORT: number = 2

/** All six bought separately. */
export const PACK_SEPARATE_TOTAL_PAISE = PACK_CONTAINS.reduce((s, k) => s + TOOL_PRICE_PAISE[k], 0) // ₹8,094
/** What the pack saves against buying the six one by one. */
export const PACK_SAVINGS_PAISE = PACK_SEPARATE_TOTAL_PAISE - PACK_PRICE_PAISE // ₹3,095
/** The same saving as a whole percentage of the separate total. */
export const PACK_SAVINGS_PERCENT = Math.round((PACK_SAVINGS_PAISE / PACK_SEPARATE_TOTAL_PAISE) * 100) // 38

/**
 * Server-trusted charge amount (in paise) for a given estimate app_type.
 * Returns null for unknown / free (e.g. vastupro) app types so the caller can
 * reject the order rather than charge an unverified amount.
 */
export function priceForAppType(appType: string | null | undefined): number | null {
  if (!appType) return null
  if (appType === PACK_APP_TYPE) return PACK_PRICE_PAISE
  return Object.prototype.hasOwnProperty.call(TOOL_PRICE_PAISE, appType)
    ? TOOL_PRICE_PAISE[appType as PaidAppType]
    : null
}

// ── Display helpers: every price a visitor reads is made here, from the figures above ──

/** "₹2,299" from paise. Safe on the server and in the browser. */
export const rupees = (paise: number): string => `₹${(paise / 100).toLocaleString('en-IN')}`

/** The cheapest single report (not counting the Grand Total add-on): the "from" price. */
export const LOWEST_REPORT_PAISE = Math.min(
  TOOL_PRICE_PAISE.structopro, TOOL_PRICE_PAISE.masonpro, TOOL_PRICE_PAISE.electropro,
  TOOL_PRICE_PAISE.plumbpro, TOOL_PRICE_PAISE.interiorpro,
)

/** Ready-made labels, so a page never builds a price by hand. */
export const PRICE = {
  structopro: rupees(TOOL_PRICE_PAISE.structopro),
  masonpro: rupees(TOOL_PRICE_PAISE.masonpro),
  electropro: rupees(TOOL_PRICE_PAISE.electropro),
  plumbpro: rupees(TOOL_PRICE_PAISE.plumbpro),
  interiorpro: rupees(TOOL_PRICE_PAISE.interiorpro),
  grandtotal: rupees(TOOL_PRICE_PAISE.grandtotal),
  pack: rupees(PACK_PRICE_PAISE),
  packSeparate: rupees(PACK_SEPARATE_TOTAL_PAISE),
  packSavings: rupees(PACK_SAVINGS_PAISE),
  packSavingsPercent: `${PACK_SAVINGS_PERCENT}%`,
  /** "₹999": the lowest single-report price, used after the word "from" */
  from: rupees(LOWEST_REPORT_PAISE),
} as const
