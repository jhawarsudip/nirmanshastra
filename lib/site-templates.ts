// ─────────────────────────────────────────────────────────────────────────────
// SITE TEMPLATES — server-trusted catalog (single source of truth)
//
// Used by:
//   - app/api/site-templates/create-order/route.ts  (price lookup)
//   - app/api/site-templates/verify/route.ts         (signed-URL file lookup)
//
// Prices and storage filenames are defined HERE and never trusted from the client.
// The zip files live in the PRIVATE Supabase Storage bucket `site-templates`.
// Delivery is ALWAYS via short-lived signed URLs — the bucket stays private.
// ─────────────────────────────────────────────────────────────────────────────

export const SITE_TEMPLATES_BUCKET = 'site-templates'

// Signed URL lifetime — 48 hours (task spec: 24–48h).
export const SIGNED_URL_TTL_SECONDS = 60 * 60 * 48

// Bundle price, in paise. Individual product prices are defined per-entry on the
// SITE_TEMPLATES array below (each of the 6 products is genuinely distinct, not a
// shared rate). Overriding a product's `price` field + BUNDLE_PRICE_PAISE covers
// all 7 charge paths.
export const BUNDLE_PRICE_PAISE = 799900 // ₹7,999 for the all-6 bundle

export type SiteTemplateProduct = {
  id: string
  title: string
  /** Server-trusted price in paise. Distinct per product — never a shared rate. */
  price: number
  /** Exact object name inside the private `site-templates` bucket. */
  file: string
}

// The six individual toolkits. `id` values match the catalog cards in
// app/site-templates/page.tsx. `file` values are the exact object names
// verified present in the private bucket. `price` is the server-trusted amount
// in paise — each product has its own distinct price.
export const SITE_TEMPLATES: SiteTemplateProduct[] = [
  {
    id: 'cost-estimator',
    title: 'Residential Construction Cost Estimator',
    price: 249900, // ₹2,499
    file: 'Residential Construction Cost Estimator - India Edition v2.1.zip',
  },
  {
    id: 'documentation-pack',
    title: 'Construction Site Documentation Pack',
    price: 169900, // ₹1,699
    file: 'Construction Site Documentation Pack - India Edition v2.0.zip',
  },
  {
    id: 'billing-measurement',
    title: 'Billing & Measurement',
    price: 229900, // ₹2,299
    file: 'Billing and Measurement - India Edition v1.0.zip',
  },
  {
    id: 'bar-bending-schedule',
    title: 'Bar Bending Schedule',
    price: 209900, // ₹2,099
    file: 'Bar Bending Schedule - India Edition v2.0.zip',
  },
  {
    id: 'labour-compliance',
    title: 'Labour & Statutory Compliance',
    price: 199900, // ₹1,999
    file: 'Labour and Statutory Compliance - India Edition v2.0.zip',
  },
  {
    id: 'planning-progress',
    title: 'Planning, Progress & Delay Control',
    price: 229900, // ₹2,299
    file: 'Planning Progress and Delay Control - India Edition v2.0.zip',
  },
]

export const BUNDLE_ID = 'bundle'
export const BUNDLE_TITLE = 'Site Operations Suite — All 6 Toolkits'

export function getProductById(id: string): SiteTemplateProduct | undefined {
  return SITE_TEMPLATES.find((p) => p.id === id)
}

/** Server-trusted price for a product id. Returns null for unknown ids. */
export function priceForProduct(productId: string): number | null {
  if (productId === BUNDLE_ID) return BUNDLE_PRICE_PAISE
  return getProductById(productId)?.price ?? null
}

/** The file(s) a given purchase unlocks: one product → one file, bundle → all six. */
export function filesForProduct(productId: string): SiteTemplateProduct[] {
  if (productId === BUNDLE_ID) return SITE_TEMPLATES
  const p = getProductById(productId)
  return p ? [p] : []
}

/** Human-readable label for a product id (for emails / receipts). */
export function titleForProduct(productId: string): string {
  if (productId === BUNDLE_ID) return BUNDLE_TITLE
  return getProductById(productId)?.title ?? productId
}
