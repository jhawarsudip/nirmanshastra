/**
 * Hindi for English labels that the SERVER sends and that we do not own at the source.
 *
 * The paid-report models (lib/structopro-qty, lib/qty/*) return finished English strings: item names, table titles,
 * notes, checks. They are frozen into each paid report and the PDFs stay English, so the models are not touched.
 * The page shows Hindi by looking each string up here at display time. Nothing is stored in Hindi and nothing
 * the customer paid for changes.
 *
 * A dictionary maps the English string to the Hindi one. Where a string carries a number or a name that varies,
 * write {0}, {1}... in both and the lookup fills them in:
 *     'Plinth beam {0} mm': 'प्लिंथ बीम {0} mm'
 * A string with no entry is shown as it is (English). That is deliberate: a missing entry never breaks a page,
 * and `scripts/check-hindi-leftovers.py` lists what is still English.
 */
export type Dict = Readonly<Record<string, string>>

type Pattern = { re: RegExp; hi: string }

const compiled = new WeakMap<Dict, { exact: Map<string, string>; patterns: Pattern[] }>()

function compile(dict: Dict) {
  let c = compiled.get(dict)
  if (c) return c
  const exact = new Map<string, string>()
  const patterns: Pattern[] = []
  for (const [en, hi] of Object.entries(dict)) {
    if (!/\{\d\}/.test(en)) { exact.set(en, hi); continue }
    const src = en
      .split(/(\{\d\})/)
      .map(part => (/^\{\d\}$/.test(part) ? '(.+?)' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      .join('')
    patterns.push({ re: new RegExp(`^${src}$`), hi })
  }
  // the most specific pattern (most literal text) is tried first
  patterns.sort((a, b) => b.re.source.length - a.re.source.length)
  c = { exact, patterns }
  compiled.set(dict, c)
  return c
}

/** Hindi for `s` if any dictionary has it, otherwise `s` unchanged. English pages never reach the dictionaries. */
export function tr(locale: string, s: string, ...dicts: Dict[]): string {
  if (locale !== 'hi' || !s) return s
  for (const dict of dicts) {
    const { exact, patterns } = compile(dict)
    const hit = exact.get(s)
    if (hit !== undefined) return hit
    for (const p of patterns) {
      const m = p.re.exec(s)
      if (m) return p.hi.replace(/\{(\d)\}/g, (_, i) => m[Number(i) + 1] ?? '')
    }
  }
  return s
}
