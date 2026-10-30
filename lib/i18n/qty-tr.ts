/*
  The lookup behind useQtyTr. It is the same idea as lib/i18n/tr.ts (exact string first, then the most specific {0}, {1} pattern),
  with one difference: placeholders may have more than one digit ({10}, {11}...). Some trade-tool notes quote a dozen numbers
  and clause references in one sentence, which tr.ts (single digit) cannot match. English and the other pages never come here.
*/
import type { Dict } from './tr'

type Pattern = { re: RegExp; hi: string }

const compiled = new WeakMap<Dict, { exact: Map<string, string>; patterns: Pattern[] }>()

function compile(dict: Dict) {
  let c = compiled.get(dict)
  if (c) return c
  const exact = new Map<string, string>()
  const patterns: Pattern[] = []
  for (const [en, hi] of Object.entries(dict)) {
    if (!/\{\d+\}/.test(en)) { exact.set(en, hi); continue }
    const src = en
      .split(/(\{\d+\})/)
      .map(part => (/^\{\d+\}$/.test(part) ? '(.+?)' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      .join('')
    patterns.push({ re: new RegExp(`^${src}$`), hi })
  }
  patterns.sort((a, b) => b.re.source.length - a.re.source.length)
  c = { exact, patterns }
  compiled.set(dict, c)
  return c
}

/** Hindi for `s`, or `s` itself when the dictionary has no entry. */
export function trQty(s: string, dict: Dict): string {
  const { exact, patterns } = compile(dict)
  const hit = exact.get(s)
  if (hit !== undefined) return hit
  for (const p of patterns) {
    const m = p.re.exec(s)
    if (m) return p.hi.replace(/\{(\d+)\}/g, (_, i) => m[Number(i) + 1] ?? '')
  }
  return s
}
