/*
  Shared shapes for the trade tools (PlumbingPro, ElectricalPro, MasonryPro, InteriorPro) and the Grand Total.

  Every tool works the same way:
    1. the browser sends a few plain answers,
    2. the server turns them into quantities with the tool's model,
    3. the free part (counts, code checks, a short summary) goes straight back,
    4. the paid part (every quantity) is kept on the server until payment is verified.

  The site is quantity-only. Nothing in here carries a rupee figure, a labour figure or a dealer rate.
*/

import type { PaidAppType } from '../tool-pricing'

export type TradeKey = 'plumbing' | 'electrical' | 'masonry' | 'interior'

export type CheckStatus = 'pass' | 'advisory' | 'fail'

/** A code check shown on the free results page, in the same format StructurePro uses. */
export interface Check {
  id: string
  clause: string
  description: string
  detail: string
  status: CheckStatus
}

/** One fact in the "at a glance" grid. */
export interface Fact {
  k: string
  v: string
  note?: string
}

/** One big total in "What to order". */
export interface Tile {
  k: string
  v: string
  unit: string
  /** the range the real figure is likely to fall in, already formatted */
  range?: string
}

/** A table in the paid report. Cells are already formatted strings or whole numbers. */
export interface Table {
  id: string
  title: string
  sub?: string
  head: string[]
  rows: (string | number)[][]
  foot?: (string | number)[]
  /** zero-based column indexes that hold numbers (right-aligned) */
  num?: number[]
  note?: string
  tight?: boolean
}

/**
 * One purchasable line. The Grand Total adds these up across trades,
 * so `key` is stable (for example "cement-bag-50kg") and `group` is the heading it sits under.
 */
export interface QtyLine {
  key: string
  item: string
  qty: number
  unit: string
  group: string
  basis: string
}

/** How far a class of figures is likely to be off. Multipliers on the figure shown. */
export interface BandRow {
  label: string
  low: number
  high: number
}

export interface TradeFree {
  engine: 'trade-v1'
  tool: TradeKey
  /** the short line under the heading, for example "6 homes · 30 people" */
  chips: string[]
  factsTitle: string
  facts: Fact[]
  /** one sentence under the facts grid, saying what the full report adds */
  factsFoot: string
  checks: Check[]
  warnings: string[]
}

/**
 * Quantities in a report that the StructurePro frame also counts (the lintels over doors and windows are in both).
 * On its own, each report is complete. The Grand Total takes these out of the combined list when both are present,
 * so the same concrete and steel are never ordered twice.
 */
export interface Overlap {
  with: 'structure'
  label: string
  lines: { key: string; unit: string; qty: number }[]
}

export interface TradePaid {
  engine: 'trade-v1'
  tool: TradeKey
  tiles: Tile[]
  tables: Table[]
  lines: QtyLine[]
  bands: BandRow[]
  assumptions: string[]
  notIncluded: string[]
  /** the standards and public documents the figures rest on, shown at the foot of the report */
  sources: string[]
  overlap?: Overlap
}

export interface TradeResult {
  free: TradeFree
  paid: TradePaid
}

export type Parsed<I> = { ok: true; input: I } | { ok: false; error: string }
export type Ran = { ok: true; result: TradeResult } | { ok: false; error: string }

/** What every trade model provides. The routes and the registry only ever talk to this. */
export interface TradeModel<I> {
  key: TradeKey
  appType: PaidAppType
  /** the name on the report and in the emails */
  label: string
  /** short code used in report ids, for example "PL" */
  code: string
  parse(raw: unknown): Parsed<I>
  run(input: I): Ran
}

/** The answers every trade tool starts from. They come from the project the visitor already described. */
export interface BaseInput {
  /** built-up area of each floor above ground, in sq ft */
  floorAreasSqft: number[]
  state: string
  city?: string
}
