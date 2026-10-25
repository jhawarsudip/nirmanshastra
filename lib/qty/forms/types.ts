/*
  A form is described as data: groups of questions. One component (components/v2/qty/QtyForm) draws any of them,
  so a new tool adds a file here and no new screen code. Plain data, safe for the browser.

  Every question is one a layman can answer. The first group (where the plot is, how many floors, how big) is the same
  for every tool and is drawn by the component itself, so it is not described here.
*/

import type { TradeSlug } from '../meta'

export interface TipText { title: string; body: string; is?: string }

/** Show a question only when another answer has this value. */
export type Cond = { id: string; is: string | boolean } | { id: string; in: string[] }

export interface ChoiceOpt { value: string; label: string; note?: string }

interface Base {
  id: string
  label: string
  hint?: string
  tip?: TipText
  showIf?: Cond
}

export type FieldSpec =
  /** pick one, drawn as cards (3 or fewer options sit side by side) */
  | (Base & { kind: 'choice'; options: ChoiceOpt[]; def: string })
  /** a small whole number with minus and plus buttons */
  | (Base & { kind: 'count'; min: number; max: number; def: number })
  /** a typed number, optionally left empty */
  | (Base & { kind: 'number'; min: number; max: number; def?: number; placeholder?: string; optional?: boolean; unit?: string })
  /** yes or no */
  | (Base & { kind: 'yesno'; def: boolean })

export interface GroupSpec {
  title: string
  intro?: string
  fields: FieldSpec[]
}

export type Values = Record<string, string | number | boolean>

export interface FormSpec {
  slug: TradeSlug
  /** the card heading above the form */
  heading: string
  sub: string
  groups: GroupSpec[]
  /** the rows in "your project so far" */
  summary(v: Values, ctx: { floors: number; areaSqft: number }): [string, string][]
  /** the line under the submit button, saying what is free and what the paid report adds */
  freeLine: string
}
