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
  /** The title in Hindi, for what the visitor reads on /hi. Display only: payments, e-mails and files use `title`. */
  titleHi: string
}

// The six individual toolkits. `id` values match the catalog cards in
// app/site-templates/page.tsx. `file` values are the exact object names
// verified present in the private bucket. `price` is the server-trusted amount
// in paise — each product has its own distinct price.
export const SITE_TEMPLATES: SiteTemplateProduct[] = [
  {
    id: 'cost-estimator',
    title: 'Residential Construction Cost Estimator',
    titleHi: 'रेज़िडेंशियल कंस्ट्रक्शन कॉस्ट एस्टिमेटर',
    price: 249900, // ₹2,499
    file: 'Residential Construction Cost Estimator - India Edition v2.1 - NirmanShastra.zip',
  },
  {
    id: 'documentation-pack',
    title: 'Construction Site Documentation Pack',
    titleHi: 'कंस्ट्रक्शन साइट डॉक्यूमेंटेशन पैक',
    price: 169900, // ₹1,699
    file: 'Construction Site Documentation Pack - India Edition v2.0 - NirmanShastra.zip',
  },
  {
    id: 'billing-measurement',
    title: 'Billing & Measurement',
    titleHi: 'बिलिंग और मेज़रमेंट',
    price: 229900, // ₹2,299
    file: 'Billing and Measurement - India Edition v1.0 - NirmanShastra.zip',
  },
  {
    id: 'bar-bending-schedule',
    title: 'Bar Bending Schedule',
    titleHi: 'बार बेंडिंग शेड्यूल',
    price: 209900, // ₹2,099
    file: 'Bar Bending Schedule - India Edition v2.0 - NirmanShastra.zip',
  },
  {
    id: 'labour-compliance',
    title: 'Labour & Statutory Compliance',
    titleHi: 'लेबर और स्टैच्यूटरी कम्प्लायंस',
    price: 199900, // ₹1,999
    file: 'Labour and Statutory Compliance - India Edition v2.0 - NirmanShastra.zip',
  },
  {
    id: 'planning-progress',
    title: 'Planning, Progress & Delay Control',
    titleHi: 'प्लानिंग, प्रोग्रेस और डिले कंट्रोल',
    price: 229900, // ₹2,299
    file: 'Planning Progress and Delay Control - India Edition v2.0 - NirmanShastra.zip',
  },
]

export const BUNDLE_ID = 'bundle'
export const BUNDLE_TITLE = 'Site Operations Suite — All 6 Toolkits'
export const BUNDLE_TITLE_HI = 'साइट ऑपरेशंस सूट — सभी 6 टूलकिट'

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

/** The title to show a visitor: Hindi on /hi, the English title everywhere else. Display only; never sent to payments or e-mails. */
export function displayTitleForProduct(productId: string, locale: string): string {
  if (locale !== 'hi') return titleForProduct(productId)
  if (productId === BUNDLE_ID) return BUNDLE_TITLE_HI
  return getProductById(productId)?.titleHi ?? titleForProduct(productId)
}

/** Human-readable label for a product id (for emails / receipts). */
export function titleForProduct(productId: string): string {
  if (productId === BUNDLE_ID) return BUNDLE_TITLE
  return getProductById(productId)?.title ?? productId
}
