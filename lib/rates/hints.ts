/*
  THE FOUNDER'S FILE: the "Typical" rate hints shown beside the rate boxes of every paid report and of the Grand Total.

  These are guides for the customer to compare their dealer's quote against. They are NOT used in any calculation: the rupee table
  is always the customer's own rate times the report's quantity. A hint can be wrong, stale or missing and no total changes.

  How to change one:
    1. find the item id (run  npx tsx --tsconfig tsconfig.json scripts/check-rates.ts --ids  to list every id with its unit);
    2. put a line in RATE_HINTS:   cement: { low: 380, high: 450, asOf: '2026-10-26' },
         low and high are rupees for ONE rate unit (a bag, a cft, a kg, 1,000 bricks, a metre ...), as the box asks for it;
         asOf is the day YOU checked that range (YYYY-MM-DD). It is shown beside the hint as "updated 26 Oct 2026";
    3. commit and deploy. Nothing else needs to change.

  An item with no line here shows "Ask your dealer for today's rate" and no number. Nothing is filled in on anyone's behalf:
  only put a range here that you have checked, and refresh its date when you check it again. A range older than 90 days is still
  shown, with its date, so the customer can judge it; scripts/check-rates.ts warns you when one is past that age.

  Cement is the only line filled in, with the example range you gave when you asked for this feature (26 Oct 2026).
*/

export interface RateHint {
  /** rupees for one rate unit, lowest typical */
  low: number
  /** rupees for one rate unit, highest typical */
  high: number
  /** the day this range was checked, YYYY-MM-DD */
  asOf: string
}

export const RATE_HINTS: Record<string, RateHint> = {
  cement: { low: 380, high: 450, asOf: '2026-10-26' },
}

/** A hint older than this many days is flagged by scripts/check-rates.ts (it is still shown, with its date). */
export const HINT_STALE_DAYS = 90

/** "26 Oct 2026" from "2026-10-26"; '' when the date is not valid. */
export function hintDate(asOf: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(asOf)
  if (!m) return ''
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  if (Number.isNaN(d.getTime()) || d.getUTCMonth() !== Number(m[2]) - 1) return ''
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export interface HintText {
  /** "Typical: ₹380–450 a bag (ask your dealer)" or "Ask your dealer for today's rate" */
  text: string
  /** "updated 26 Oct 2026", or '' when there is no hint */
  updated: string
}

/** The words shown beside a rate box. `unit` is the item's rate unit: "bag", "cft", "1,000". */
export function hintFor(id: string, unit: string): HintText {
  const h = RATE_HINTS[id]
  if (!h || !(h.low > 0) || !(h.high >= h.low) || !hintDate(h.asOf)) return { text: "Ask your dealer for today's rate", updated: '' }
  const n = (x: number) => x.toLocaleString('en-IN', { maximumFractionDigits: 2 })
  const range = h.low === h.high ? `₹${n(h.low)}` : `₹${n(h.low)}–${n(h.high)}`
  const each = /^(bag|cft|kg|metre|piece|litre|pair|block|sq ft)$/.test(unit) ? `a ${unit}` : `per ${unit}`
  return { text: `Typical: ${range} ${each} (ask your dealer)`, updated: `updated ${hintDate(h.asOf)}` }
}

/** The most recent date among the hints in use, for the line above the boxes; '' when none is filled in. */
export function latestHintDate(ids: string[]): string {
  let best = ''
  for (const id of ids) {
    const h = RATE_HINTS[id]
    if (h && hintDate(h.asOf) && h.asOf > best) best = h.asOf
  }
  return best ? hintDate(best) : ''
}
