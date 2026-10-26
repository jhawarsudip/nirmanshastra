/*
  Rupees from quantities and the customer's own rates. Runs in the browser (the panel) and on the server (the PDF), so both print the same table.

  What the numbers mean:
    - every rate is typed by the customer; nothing here supplies one, fills one in or guesses one;
    - each row is the report's quantity (rounded as shown) times that rate; the total is the sum of the rows as printed;
    - boxes left empty are not priced, and the result says how many were left out. It never calls a part-priced list "the cost".
*/

import type { QtyLine } from '../qty/types'
import { rateItems, fmtQty, type RateItem, type Unpriced } from './items'

/** The only wording allowed to describe the total, on the page and in the PDF. */
export const RESULT_LABEL = 'Material cost at the rates you entered. Labour, transport and taxes are not included.'

/** The largest rate accepted for one unit (₹1 crore). It keeps a slipped key from printing an absurd total. */
export const MAX_RATE = 10_000_000
/** The most rate boxes one request may carry. A real report has under 100 items. */
const MAX_ENTRIES = 200

export interface RupeeRow {
  id: string
  label: string
  group: string
  need: string
  qty: number
  unit: string
  per: string
  rate: number
  amount: number
}

export interface RupeeResult {
  rows: RupeeRow[]
  /** sum of the amounts as printed */
  total: number
  /** how many items were given a rate, and how many items the report has */
  priced: number
  of: number
  /** the items left without a rate */
  blank: { id: string; label: string }[]
  /** lines that are not things you buy, with the reason */
  unpriced: Unpriced[]
}

/** A typed rate: "1,250", " 38.5 ", "₹ 380" -> a number; anything else -> null. Zero, negative or beyond MAX_RATE -> null. */
export function parseRate(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 && raw <= MAX_RATE ? Math.round(raw * 100) / 100 : null
  if (typeof raw !== 'string') return null
  const t = raw.replace(/[₹,\s]/g, '').replace(/^rs\.?/i, '')
  if (!/^\d+(\.\d{0,2})?$/.test(t) && !/^\.\d{1,2}$/.test(t)) return null
  const n = Number(t)
  return Number.isFinite(n) && n > 0 && n <= MAX_RATE ? Math.round(n * 100) / 100 : null
}

/** Rates the server will accept for these lines: only boxes the report really has, each a valid rate. Anything else is dropped. */
export function cleanRates(raw: unknown, items: RateItem[]): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const entries = Object.entries(raw as Record<string, unknown>).slice(0, MAX_ENTRIES)
  const have = new Set(items.map(i => i.id))
  const out: Record<string, number> = {}
  for (const [id, v] of entries) {
    if (!have.has(id)) continue
    const n = parseRate(v)
    if (n !== null) out[id] = n
  }
  return out
}

export function computeRupees(lines: QtyLine[], rates: Record<string, number>): RupeeResult {
  const { items, unpriced } = rateItems(lines)
  const rows: RupeeRow[] = []
  const blank: { id: string; label: string }[] = []
  for (const it of items) {
    const rate = rates[it.id]
    if (typeof rate === 'number' && rate > 0) {
      rows.push({ id: it.id, label: it.label, group: it.group, need: it.need, qty: it.qty, unit: it.unit, per: it.per, rate, amount: Math.round(it.qty * rate) })
    } else blank.push({ id: it.id, label: it.label })
  }
  return { rows, total: rows.reduce((s, r) => s + r.amount, 0), priced: rows.length, of: items.length, blank, unpriced }
}

/** ₹ 1,23,456 (Indian digit grouping, no paise). */
export const inr = (n: number) => `₹ ${Math.round(n).toLocaleString('en-IN')}`
/** A rate with its paise only when it has them: ₹ 380, ₹ 38.50 */
export const inrRate = (n: number) => `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`

export { fmtQty }
