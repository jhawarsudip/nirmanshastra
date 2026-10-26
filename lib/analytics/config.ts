/*
  Analytics settings in one place.

  Nothing here loads anything. components/analytics/Analytics.tsx loads GA4, Clarity and the Meta Pixel only after
  the visitor presses Accept on the consent banner.

  To change a value:
    - Meta Pixel ID:  set NEXT_PUBLIC_META_PIXEL_ID in Vercel (Production). It overrides the ID below.
                      Set it to an empty value to switch the Pixel off without a code change.
    - GA4 / Clarity:  edit the two constants below (or set NEXT_PUBLIC_GA_MEASUREMENT_ID / NEXT_PUBLIC_CLARITY_PROJECT_ID).
  NEXT_PUBLIC_ values are copied into the build, so a changed value needs a new deployment.
*/

/** Google Analytics 4 data stream */
export const GA_MEASUREMENT_ID: string =
  (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-67WK10W3P7').trim()

/** Microsoft Clarity project */
export const CLARITY_PROJECT_ID: string =
  (process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? 'z3qrtyg6lj').trim()

/**
 * Meta Pixel. An unset NEXT_PUBLIC_META_PIXEL_ID uses the ID SJ gave on 26 Oct 2026; an empty one turns the Pixel off.
 * Anything that is not a plain number is treated as "off", so a typo can never inject a stray script.
 */
const PIXEL_RAW = (process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '1344616013322611').trim()
export const META_PIXEL_ID: string = /^\d{8,20}$/.test(PIXEL_RAW) ? PIXEL_RAW : ''

/** Where the consent choice and the campaign tags are remembered in the browser */
export const CONSENT_STORAGE_KEY = 'ns_consent_v1'
export const ATTRIBUTION_STORAGE_KEY = 'ns_attr_v1'
export const ONCE_STORAGE_KEY = 'ns_evt_once_v1'

/**
 * Campaign tags (utm_source, utm_medium, utm_campaign) are a record about the visitor's visit, so by default they are
 * kept only after the visitor accepts. Set to false to keep them for everyone, including people who declined.
 */
export const UTM_REQUIRES_CONSENT = true

/** A campaign tag older than this is replaced by a newer one (first visit wins inside the window) */
export const ATTRIBUTION_WINDOW_DAYS = 90

/** Preview deployments (*.vercel.app) never load analytics, so test traffic stays out of the real numbers */
export function analyticsAllowedOnHost(hostname: string): boolean {
  return !/\.vercel\.app$/i.test(hostname)
}
