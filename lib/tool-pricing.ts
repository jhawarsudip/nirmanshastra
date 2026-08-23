// ─────────────────────────────────────────────────────────────────────────────
// TOOL PRICING — server-trusted source of truth (single source of truth)
//
// Used by:
//   - app/api/payments/create-order/route.ts  (price lookup by estimate.app_type)
//
// The charge amount for every paid tool is defined HERE and looked up SERVER-SIDE
// from the estimate's `app_type`. The browser never supplies or influences the
// amount — it only identifies which estimate is being unlocked. This closes the
// client-amount-tampering vector: a user cannot pay less than the real price by
// editing the request, even if the tampered value happens to match today.
//
// Values are in paise (49900 = ₹499). Keep these in sync with the ₹ prices
// displayed in the UI (navbar, homepage, tool pages).
// ─────────────────────────────────────────────────────────────────────────────

// The paid `app_type` values stored on the `estimates` table.
export type PaidAppType =
  | 'structopro'
  | 'masonpro'
  | 'electropro'
  | 'plumbpro'
  | 'interiorpro'
  | 'grandtotal'

// Charge amount per tool, in paise. This is the ONLY authority for what a
// report costs — never trust an amount sent from the client.
export const TOOL_PRICE_PAISE: Record<PaidAppType, number> = {
  structopro:  99900, // StructurePro   — ₹999
  masonpro:    69900, // MasonryPro      — ₹699
  electropro:  49900, // ElectricalPro   — ₹499
  plumbpro:    49900, // PlumbingPro     — ₹499
  interiorpro: 89900, // InteriorPro     — ₹899
  grandtotal:  99900, // Grand Total Report — ₹999
}

/**
 * Server-trusted charge amount (in paise) for a given estimate app_type.
 * Returns null for unknown / free (e.g. vastupro) app types so the caller can
 * reject the order rather than charge an unverified amount.
 */
export function priceForAppType(appType: string | null | undefined): number | null {
  if (!appType) return null
  return Object.prototype.hasOwnProperty.call(TOOL_PRICE_PAISE, appType)
    ? TOOL_PRICE_PAISE[appType as PaidAppType]
    : null
}
