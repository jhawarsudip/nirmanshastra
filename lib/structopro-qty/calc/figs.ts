// The figures the sheet has rebuilt, by name, so that the reconciliation (ties.ts) can set each one beside the figure the report prints.
// A section puts a figure here only after working it out through the Ledger; the reconciliation never reads the engine's own figure for the sheet side.

import type { Ledger } from '@/lib/calcsheet'

const store = new WeakMap<Ledger, Map<string, number>>()

function map(L: Ledger): Map<string, number> {
  let m = store.get(L)
  if (!m) {
    m = new Map()
    store.set(L, m)
  }
  return m
}

/** Keep a figure the sheet rebuilt. Returns it so the call can wrap an expression. */
export function put(L: Ledger, key: string, v: number): number {
  map(L).set(key, v)
  return v
}

/** Read a figure back. A missing figure is a programming error: the section that should have put it did not run. */
export function fig(L: Ledger, key: string): number {
  const v = map(L).get(key)
  if (v === undefined) throw new Error(`calcsheet: the figure "${key}" was not rebuilt by any section`)
  return v
}

export const hasFig = (L: Ledger, key: string): boolean => map(L).has(key)

const texts = new WeakMap<Ledger, Map<string, string>>()

function tmap(L: Ledger): Map<string, string> {
  let m = texts.get(L)
  if (!m) {
    m = new Map()
    texts.set(L, m)
  }
  return m
}

/** Keep a piece of text the sheet built (a grade, a basis sentence) for the reconciliation. */
export function putText(L: Ledger, key: string, v: string): string {
  tmap(L).set(key, v)
  return v
}

export function figText(L: Ledger, key: string): string {
  const v = tmap(L).get(key)
  if (v === undefined) throw new Error(`calcsheet: the text "${key}" was not built by any section`)
  return v
}
