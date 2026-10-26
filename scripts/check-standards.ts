/*
  Group 8 checks (SJ, 26 Oct 2026): IS 732 is the 2019 edition everywhere, the clause numbers quoted for it are only ones the BIS
  draft of IS 4648 gives for it, and the Excel estimator card says who it is for.

  Run from the repo root:   npx tsx --tsconfig tsconfig.json scripts/check-standards.ts
  No network, no database, nothing written.
*/

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { electricalModel } from '../lib/qty/electrical/model'
import { CODES_BY_TOOL } from '../lib/is-codes-data'
import { IS_CODES, SITE_TEMPLATES } from '../lib/v2/content'
import { TOOLS } from '../lib/seo/site'

let failed = 0
function ok(cond: boolean, msg: string) {
  console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${msg}`)
  if (!cond) failed++
}

const ROOT = join(__dirname, '..')

/** every .ts/.tsx under these folders, minus the ones that are not live pages */
function files(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (name === 'node_modules' || name === '.next') continue
    const st = statSync(p)
    if (st.isDirectory()) files(p, out)
    else if (/\.(ts|tsx)$/.test(name)) out.push(p)
  }
  return out
}
const LIVE = [...files(join(ROOT, 'app')), ...files(join(ROOT, 'lib')), ...files(join(ROOT, 'components'))]
  .filter((p) => !/components\/v3\/|lib\/v3\//.test(relative(ROOT, p))) // the rejected v3 design is never built into a page
const rel = (p: string) => relative(ROOT, p)
const text = (p: string) => readFileSync(p, 'utf8')

// The old ElectricalPro engine (IS 732:2019 "Cl 6.2", "Table 6", "Cl 10.4" ...) is not imported by any page. Its clause numbers were
// never read, so the one thing that matters is that it stays unreachable.
const DEAD_ENGINE = 'app/tools/electropro/electropro-engine.ts'

console.log('IS 732 edition')
{
  const old1989 = LIVE.filter((p) => /732[: ]*1989|732 \(1989/.test(text(p)) && rel(p) !== 'lib/blog-content.ts')
  ok(old1989.length === 0, 'no IS 732:1989 label in any live file' + (old1989.length ? ': ' + old1989.map(rel).join(', ') : ''))
  const blog = text(join(ROOT, 'lib/blog-content.ts'))
  ok((blog.match(/732:1989/g) ?? []).length === 1 && /earlier IS 732:1989/.test(blog), 'the blog names 1989 once, as the earlier edition')

  // the files that carry a standards list or a report's sources never say "IS 732" without the edition
  const must = ['lib/is-codes-data.ts', 'lib/v2/content.ts', 'lib/seo/site.ts', 'lib/seo/paid-content.ts', 'lib/qty/electrical/model.ts', 'lib/qty/electrical/calc.ts',
    'lib/qty/electrical/calc-part2.ts', 'lib/qty/electrical/wire.ts', 'app/tools/wire-size-calculator/page.tsx', 'app/tools/wire-size-calculator/wire-size-engine.ts',
    'lib/chatbox-knowledge.ts', 'app/tools/electropro/layout.tsx']
  for (const f of must) {
    const bare = [...text(join(ROOT, f)).matchAll(/IS 732(?![:0-9])/g)]
    // the header comment of is-codes-data states the rule in words ("IS 732 is given as the 2019 edition")
    const allowed = f === 'lib/is-codes-data.ts' ? 1 : 0
    ok(bare.length === allowed, `${f}: IS 732 always carries its edition`)
  }

  ok(IS_CODES.includes('IS 732:2019' as never) && !(IS_CODES as readonly string[]).includes('IS 732:1989'), 'the homepage standards list has IS 732:2019')
  const electrical = TOOLS.find((t) => t.path === '/tools/electropro')
  ok(!!electrical && electrical.isCodes.includes('IS 732:2019') && !electrical.isCodes.some((c) => /1989/.test(c)), 'ElectricalPro structured data (isCodes) has IS 732:2019')

  const entries = CODES_BY_TOOL.flatMap((g) => g.codes).filter((c) => /^IS 732/.test(c.code))
  ok(entries.length === 1 && entries[0].code === 'IS 732:2019', '/is-codes-used lists IS 732:2019 once')
  ok(!!entries[0]?.caveat && /not read/i.test(entries[0].caveat ?? ''), '... and says its text was not read')
}

console.log('Clause numbers quoted for IS 732')
{
  // The BIS draft of IS 4648 (ETD 20, Sept 2024) cites these clauses of IS 732:2019: cl 4.2 (type of RCD, from its cl 6.2.9), cl 5.3.5 (SPD, from its
  // cl 6.2.10) and Annex T (cable current ratings, the note under its Table 4). Nothing else is quoted. The standard itself was not read.
  const ALLOWED = new Set(['4.2', '5.3.5'])
  const found: string[] = []
  for (const p of LIVE) {
    if (rel(p) === DEAD_ENGINE) continue
    const s = text(p)
    for (const m of s.matchAll(/IS 732(?::2019)?,? (?:cl|Cl|clause|Clause)\.? ?(\d[\d.]*\d)/g)) found.push(`${rel(p)}: cl ${m[1]}`)
    for (const m of s.matchAll(/(?:cl|Cl|clause|Clause) (\d[\d.]*\d) of IS 732/g)) found.push(`${rel(p)}: cl ${m[1]}`)
  }
  const bad = found.filter((f) => !ALLOWED.has(f.split('cl ')[1]))
  ok(bad.length === 0, 'only cl 4.2 and cl 5.3.5 are quoted' + (bad.length ? ': ' + bad.join('; ') : ''))
  ok(found.length >= 2, `both quoted clauses are still present (${found.length} mentions)`)
  ok(!LIVE.some((p) => rel(p) !== DEAD_ENGINE && /5\.1\.3\.1/.test(text(p))), 'the 1989 clause 5.1.3.1 is gone')

  const importers = LIVE.filter((p) => rel(p) !== DEAD_ENGINE && /electropro-engine/.test(text(p)))
  ok(importers.length === 0, 'the old ElectricalPro engine, whose clause numbers were never read, is imported by nothing')
}

console.log('ElectricalPro report and sheet')
{
  const M = electricalModel
  const p = M.parse({ floorAreasSqft: [1200, 1000], state: 'Karnataka', city: 'Bengaluru', dwelling: 'house', bedrooms: 3, bathrooms: 3, kitchens: 1, balconies: 1, acRooms: 2, geyser: true, wiring: 'standard' })
  ok(p.ok, 'sample input parses')
  if (p.ok) {
    const r = M.run(p.input)
    ok(r.ok, 'sample input runs')
    if (r.ok) {
      const body = JSON.stringify(r.result)
      ok(/IS 732:2019/.test(body) && !/1989/.test(body), 'the report names IS 732:2019 and never 1989')
      ok(!/names the 1989 edition|a 2019 edition exists/.test(body), 'the report no longer says it follows the 1989 edition')
      const sheet = M.calc ? M.calc(p.input, r.result) : null
      ok(!!sheet, 'the calculation sheet still builds (it refuses to if a figure disagrees with the report)')
      if (sheet) {
        const sb = JSON.stringify(sheet)
        ok(/IS 732:2019/.test(sb) && !/1989/.test(sb), 'the sheet names IS 732:2019 and never 1989')
        const ref = sheet.references.find((x) => x.code === 'IS 732:2019')
        ok(!!ref && /Annex C lists IS 732:2019/.test(ref.usedFor) && /was not read/.test(ref.usedFor), 'the sheet says where the edition comes from and that the text was not read')
      }
    }
  }
}

console.log('Excel estimator card')
{
  const CARD = 'For contractors: price a house from IS-code quantities using your own rates, make a client quotation, and compare up to 3 quotes.'
  const est = SITE_TEMPLATES.find((t) => t.href === '/site-templates/cost-estimator')
  ok(est?.desc === CARD, 'homepage card text is exact')
  ok(text(join(ROOT, 'app/site-templates/page.tsx')).includes(`'${CARD}'`), '/site-templates card text is exact')
  ok(text(join(ROOT, 'app/site-templates/cost-estimator/page.tsx')).includes(`'${CARD}'`), 'product page buy-box text is exact')
  ok(text(join(ROOT, 'lib/seo/site.ts')).includes('An Excel construction cost estimator for contractors.'), 'structured-data summary says it is for contractors')
  const all = LIVE.map((p) => text(p)).join('\n')
  ok(!/Prices a house from IS-code first principles/.test(all), 'the old "Prices a house" wording is gone')
  ok(/homeowners give quantities only|reports for homeowners give quantities only/.test(text(join(ROOT, 'app/disclaimer/page.tsx')) + text(join(ROOT, 'app/faq/page.tsx'))), 'the "quantities only" statements name the homeowner reports')
}

console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed')
process.exit(failed ? 1 : 0)
