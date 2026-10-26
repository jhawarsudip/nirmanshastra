/*
  Server side of the rupee step: turn the rates in a request into the table the PDF prints.

  The browser sends only { itemId: rate }. The quantities come from the report frozen on the server, never from the request, so a
  tampered request can change a rate (which is the customer's own number) and nothing else. Rates are not stored: the PDF is built,
  sent back to the same browser and forgotten.
*/

import type { QtyLine } from '../qty/types'
import { cleanRates, computeRupees, type RupeeResult } from './compute'
import { rateItems } from './items'

/**
 * `raw` is the `rates` field of a request body.
 *   undefined / null          -> { kind: 'none' }   no rupee step asked for: the normal report
 *   asked for, none valid     -> { kind: 'empty' }  the caller answers 400 ("enter at least one rate")
 *   asked for, some valid     -> { kind: 'ok', result }
 */
export type RatesRequest = { kind: 'none' } | { kind: 'empty' } | { kind: 'ok'; result: RupeeResult }

export function ratesRequest(raw: unknown, lines: QtyLine[]): RatesRequest {
  if (raw === undefined || raw === null) return { kind: 'none' }
  const { items } = rateItems(lines)
  const clean = cleanRates(raw, items)
  if (Object.keys(clean).length === 0) return { kind: 'empty' }
  return { kind: 'ok', result: computeRupees(lines, clean) }
}

export const RUPEE_PDF_HEADERS = (fileName: string): Record<string, string> => ({
  'Content-Type': 'application/pdf',
  'Content-Disposition': `attachment; filename="${fileName.replace(/[^A-Za-z0-9._-]/g, '-')}"`,
  // the rates are the customer's own and are not kept: nothing may cache this response
  'Cache-Control': 'no-store, private',
})
