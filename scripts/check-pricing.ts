/*
  Price guard. Run from the repo root:   npx tsx scripts/check-pricing.ts
  Exit code 1 if anything is wrong.

  1. The prices in lib/tool-pricing.ts are the ones SJ approved on 26 Oct 2026, and the pack arithmetic is right.
  2. The server charges what the page shows: priceForAppType() agrees with the price file for every product.
  3. No page, menu, email, FAQ, JSON-LD or llms.txt line types a report price by hand. Every price is read from
     lib/tool-pricing.ts, so what is shown can never drift from what is charged. This scans the source tree for
     a typed old price (₹499, ₹699, ₹899, or 49900, 69900, 89900 paise) and for a typed current price.
*/

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import {
  TOOL_PRICE_PAISE, PACK_PRICE_PAISE, PACK_APP_TYPE, PACK_CONTAINS, PACK_SEPARATE_TOTAL_PAISE, PACK_SAVINGS_PAISE,
  PACK_SAVINGS_PERCENT, LOWEST_REPORT_PAISE, PRICE, priceForAppType, rupees,
} from '../lib/tool-pricing'

let failed = 0
const fail = (msg: string) => { failed++; console.error('FAIL  ' + msg) }
const ok = (msg: string) => console.log('ok    ' + msg)
const eq = (name: string, got: unknown, want: unknown) => (got === want ? ok(`${name} = ${String(got)}`) : fail(`${name}: got ${String(got)}, want ${String(want)}`))

// ── 1. The approved prices, in paise ─────────────────────────────────────────
eq('StructurePro', TOOL_PRICE_PAISE.structopro, 229900)
eq('MasonryPro', TOOL_PRICE_PAISE.masonpro, 129900)
eq('ElectricalPro', TOOL_PRICE_PAISE.electropro, 99900)
eq('PlumbingPro', TOOL_PRICE_PAISE.plumbpro, 99900)
eq('InteriorPro', TOOL_PRICE_PAISE.interiorpro, 149900)
eq('Grand Total', TOOL_PRICE_PAISE.grandtotal, 99900)
eq('Complete House Pack', PACK_PRICE_PAISE, 499900)
eq('pack holds six products', PACK_CONTAINS.length, 6)
eq('all six separately (paise)', PACK_SEPARATE_TOTAL_PAISE, 809400)
eq('pack saves (paise)', PACK_SAVINGS_PAISE, 309500)
eq('pack saves (percent)', PACK_SAVINGS_PERCENT, 38)
eq('lowest single report', LOWEST_REPORT_PAISE, 99900)
eq('label: from', PRICE.from, '₹999')
eq('label: separate', PRICE.packSeparate, '₹8,094')
eq('label: saving', PRICE.packSavings, '₹3,095')
eq('label: pack', PRICE.pack, '₹4,999')
eq('label: structure', PRICE.structopro, '₹2,299')
eq('rupees() formats lakhs the Indian way', rupees(12345600), '₹1,23,456')

// ── 2. What the server charges is what the file says ─────────────────────────
for (const k of PACK_CONTAINS) eq(`priceForAppType(${k})`, priceForAppType(k), TOOL_PRICE_PAISE[k])
eq(`priceForAppType(${PACK_APP_TYPE})`, priceForAppType(PACK_APP_TYPE), PACK_PRICE_PAISE)
eq('priceForAppType(vastupro) is not a paid product', priceForAppType('vastupro'), null)
eq('priceForAppType(unknown) is not a paid product', priceForAppType('nothing'), null)
eq('priceForAppType(empty) is not a paid product', priceForAppType(''), null)
eq('priceForAppType(toString) is not a paid product', priceForAppType('toString'), null)

// ── 3. No price typed by hand anywhere else ──────────────────────────────────
const ROOT = join(__dirname, '..')
const SCAN = ['app', 'components', 'lib', 'messages', 'content', 'public', 'scripts', 'styles']
const EXT = /\.(ts|tsx|mjs|cjs|js|json|md|mdx|txt|css|html)$/
const SKIP_DIR = new Set(['node_modules', '.next', '.git'])
// These files may contain a price on purpose: the price file itself and this guard.
const ALLOW = new Set(['lib/tool-pricing.ts', 'scripts/check-pricing.ts'])
// The Excel site templates are separate products with their own prices (lib/site-templates.ts). One of them happens to
// cost the same as StructurePro, so a line that belongs to a template (its folder, its link, or a "sheets:" card) is skipped.
const isTemplateFile = (rel: string) => rel.startsWith('app/site-templates/') || rel === 'lib/site-templates.ts' || rel.startsWith('app/api/site-templates/')
const isTemplateLine = (line: string) => /site-templates|\bsheets:\s*\d/.test(line)

const OLD = [/₹\s?(499|699|899)\b/, /\bRs\.?\s?(499|699|899)\b/, /\b(49900|69900|89900)\b/]
const CURRENT = [
  /₹\s?(999|1,299|1,499|2,299|4,999|8,094|3,095)\b/, /\bRs\.?\s?(999|1,299|1,499|2,299|4,999|8,094|3,095)\b/,
  /\b(99900|129900|149900|229900|499900|809400|309500)\b/,
]

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIR.has(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (EXT.test(name)) out.push(p)
  }
}

const files: string[] = []
for (const d of SCAN) { try { walk(join(ROOT, d), files) } catch { /* folder not present */ } }
let scanned = 0
for (const f of files) {
  const rel = relative(ROOT, f)
  if (ALLOW.has(rel)) continue
  scanned++
  const lines = readFileSync(f, 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const re of OLD) if (re.test(line)) fail(`${rel}:${i + 1} types an old price: ${line.trim().slice(0, 110)}`)
    if (isTemplateFile(rel) || isTemplateLine(line)) return
    for (const re of CURRENT) if (re.test(line)) fail(`${rel}:${i + 1} types a price by hand (read it from lib/tool-pricing.ts): ${line.trim().slice(0, 110)}`)
  })
}
ok(`scanned ${scanned} files for typed prices`)

if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1) }
console.log('\nAll price checks passed')
