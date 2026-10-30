/*
  Group 9 checks (SJ, 26 Oct 2026): the optional rupee step on every paid report and on the Grand Total.

  Run from the repo root:   npx tsx --tsconfig tsconfig.json scripts/check-rates.ts
  List every rate id with its unit (for filling in lib/rates/hints.ts):   ... scripts/check-rates.ts --ids
  No network, no database, nothing written except a few temporary PDFs in the OS temp folder.
*/

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import QtyReportPDF from '../lib/pdf/qty-report-pdf'
import StructoProQtyPDF from '../lib/pdf/structopro-qty-pdf'
import GrandTotalQtyPDF from '../lib/pdf/grand-total-qty-pdf'
import type { ContactInfo } from '../lib/pdf/qty-kit'
import { TRADE_META, type TradeSlug } from '../lib/qty/meta'
import { GRAND_META } from '../lib/qty/grand'
import { SITE } from '../lib/structopro-qty/sites'
import type { QtyLine } from '../lib/qty/types'
import { SAMPLE_HOUSE } from '../lib/samples/catalogue'
import { runGrand, runStructure, runTrade } from './build-samples'
import { CFT_PER_M3, SQFT_PER_M2, rateItems } from '../lib/rates/items'
import { MAX_RATE, RESULT_LABEL, cleanRates, computeRupees, inr, parseRate } from '../lib/rates/compute'
import { HINT_STALE_DAYS, RATE_HINTS, hintDate, hintFor, latestHintDate } from '../lib/rates/hints'
import { ratesRequest } from '../lib/rates/server'
import { structureLines } from '../lib/rates/structure'
import { fmtIN as f } from '../lib/structopro-qty/labels'

let failed = 0
function ok(cond: boolean, msg: string) {
  console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${msg}`)
  if (!cond) failed++
}
const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol

const TRADES: TradeSlug[] = ['masonpro', 'electropro', 'plumbpro', 'interiorpro']
const structure = runStructure()
const sets: Record<string, QtyLine[]> = { structopro: structureLines(structure.paid) }
const trade = Object.fromEntries(TRADES.map((t) => [t, runTrade(t)])) as Record<TradeSlug, ReturnType<typeof runTrade>>
for (const t of TRADES) sets[t] = trade[t].paid.lines
const grand = runGrand()
sets.grandtotal = grand.paid.lines

if (process.argv.includes('--ids')) {
  const seen = new Map<string, string>()
  for (const lines of Object.values(sets)) for (const it of rateItems(lines).items) if (!seen.has(it.id)) seen.set(it.id, `${it.per.padEnd(22)} ${it.label}`)
  console.log('id'.padEnd(52), 'rate is asked'.padEnd(22), 'label')
  for (const [id, rest] of [...seen.entries()].sort()) console.log(id.padEnd(52), rest)
  process.exit(0)
}

console.log('Every line is priced, or says why not')
for (const [name, lines] of Object.entries(sets)) {
  const { items, unpriced } = rateItems(lines)
  const covered = new Set([...items.flatMap((i) => i.keys), ...unpriced.map((u) => u.key)])
  const missed = lines.filter((l) => l.qty > 0 && !covered.has(l.key)).map((l) => l.key)
  ok(missed.length === 0, `${name}: ${lines.length} lines -> ${items.length} boxes + ${unpriced.length} not priced` + (missed.length ? `; MISSED ${missed.join(', ')}` : ''))
  ok(new Set(items.map((i) => i.id)).size === items.length, `${name}: no two boxes share an id`)
}

console.log('Conversions')
{
  const L = (key: string, qty: number, unit: string, item = key): QtyLine => ({ key, item, qty, unit, group: 'x', basis: 'x' })
  const one = (l: QtyLine) => rateItems([l]).items[0]
  ok(one(L('sand-m3', 10, 'm³')).qty === 353 && one(L('sand-m3', 10, 'm³')).unit === 'cft', '10 m³ of sand = 353.147 cft, shown as 353 cft')
  ok(one(L('aggregate-20mm-m3', 52.4, 'm³')).unit === 'cft', 'stone is priced per cft')
  ok(near(one(L('masonry-unit-brick', 30400, 'nos', 'Red clay brick')).qty, 30.4), '30,400 bricks = 30.4 thousand')
  ok(one(L('masonry-unit-brick', 30400, 'nos', 'Red clay brick')).need === '30,400 bricks', 'bricks are said as a count, priced per 1,000')
  ok(one(L('tile-600x600-nos', 100, 'nos', 'Tile 600 × 600 mm')).qty === 388 && one(L('tile-600x600-nos', 100, 'nos', 'Tile 600 × 600 mm')).need === '100 tiles = 388 sq ft', '100 tiles of 600 × 600 = 387.5 sq ft (3.875 each), shown as 388 sq ft')
  ok(one(L('granite-slab-sqm', 2, 'm²', 'Granite')).qty === 21.5, '2 m² of granite = 21.53 sq ft, shown as 21.5')
  ok(one(L('door-frame-timber-m3', 1, 'm³', 'Timber')).qty === 35.3, '1 m³ of timber = 35.31 cft, shown as 35.3')
  ok(CFT_PER_M3 === 35.3147 && SQFT_PER_M2 === 10.7639, 'the unit constants are the ones the reports use')
  const wire = rateItems([L('wire-cu-2.5-red', 450, 'm'), L('wire-cu-2.5-black', 450, 'm'), L('wire-cu-4-red', 90, 'm')]).items
  ok(wire.length === 2 && wire.find((w) => w.id === 'wire-2.5')?.qty === 900, 'copper wire: every colour of a size is one box, summed')
  const steel = rateItems([L('steel-fe500d-8mm-kg', 100, 'kg'), L('steel-fe500d-12mm-kg', 200, 'kg'), L('steel-lintel-kg', 50, 'kg')]).items
  ok(steel.length === 1 && steel[0].qty === 350, 'steel: every diameter and the lintel steel are one box')
  const skip = rateItems([L('shuttering-m2', 500, 'm²'), L('excavation-m3', 100, 'm³'), L('light-points', 59, 'nos'), L('sockets', 65, 'nos'), L('chamber', 3, 'nos'), L('tank-ugt', 1000, 'L')])
  ok(skip.items.length === 0 && skip.unpriced.length === 6 && skip.unpriced.every((u) => u.why.length > 20), 'shuttering, excavation, points, chambers and the built tank get no box, each with a reason')
  const unknown = rateItems([L('brand-new-line', 7, 'nos', 'A new fitting')])
  ok(unknown.items.length === 1 && unknown.items[0].id === 'brand-new-line' && unknown.items[0].unit === 'piece', 'a line this file has never seen still gets a box (in its own unit)')
}

console.log('Rupees')
{
  const lines = sets.structopro
  const none = computeRupees(lines, {})
  ok(none.total === 0 && none.rows.length === 0 && none.priced === 0 && none.blank.length === none.of, 'no rates typed -> no rupees, nothing assumed')
  const r = computeRupees(lines, { cement: 400, sand: 60, steel: 65.5 })
  ok(r.priced === 3 && r.of === 5 && r.blank.length === 2, '3 of 5 boxes priced; the other 2 are named as left out')
  ok(r.rows.every((x) => x.amount === Math.round(x.qty * x.rate)), 'every amount is the quantity as shown times the rate as typed')
  ok(r.total === r.rows.reduce((s, x) => s + x.amount, 0), 'the total is the sum of the amounts as printed')
  const cement = r.rows.find((x) => x.id === 'cement')!
  ok(cement.qty === Math.round(cement.qty) && cement.amount === cement.qty * 400, 'cement: whole bags times the rate')
  ok(inr(1234567) === '₹ 12,34,567', 'rupees use Indian digit grouping')
  ok(/Labour, transport and taxes are not included\.$/.test(RESULT_LABEL) && RESULT_LABEL.startsWith('Material cost at the rates you entered.'), 'the result label is the one SJ wrote')
}

console.log('StructurePro: the rupee table carries the Buy list quantities')
{
  const m = structure.paid.materials
  const { items } = rateItems(sets.structopro)
  const q = (id: string) => items.find((i) => i.id === id)!.qty
  ok(f(q('cement')) === f(m.cementBags), `cement ${f(q('cement'))} = Buy list ${f(m.cementBags)}`)
  ok(f(q('sand')) === f(m.sandCft), `sand ${f(q('sand'))} cft = Buy list ${f(m.sandCft)}`)
  ok(f(q('aggregate')) === f(m.aggregateCft), `stone ${f(q('aggregate'))} cft = Buy list ${f(m.aggregateCft)}`)
  ok(f(q('steel')) === f(m.steelBuyKg), `steel ${f(q('steel'))} kg = Buy list ${f(m.steelBuyKg)}`)
  ok(f(q('binding-wire'), 1) === f(m.bindingWireKg, 1), `binding wire ${f(q('binding-wire'), 1)} kg = Buy list ${f(m.bindingWireKg, 1)}`)
}

console.log('Typed rates are checked')
{
  ok(parseRate('380') === 380 && parseRate(' 1,250.5 ') === 1250.5 && parseRate('₹ 38.50') === 38.5 && parseRate(42) === 42, 'plain numbers, commas, ₹ and spaces are read')
  const bad = ['', '0', '-5', 'abc', '1e9', '12.345', '38..5', '1,2,3x', 'NaN', 'Infinity', String(MAX_RATE + 1)]
  ok(bad.every((b) => parseRate(b) === null) && parseRate(NaN) === null && parseRate(Infinity) === null && parseRate(null) === null && parseRate({}) === null, 'zero, negative, text, exponents, extra decimals and absurd values are refused')
  const items = rateItems(sets.structopro).items
  const clean = cleanRates({ cement: '400', steel: 65, 'nope': 10, sand: 'x', aggregate: -1, __proto__: 5 }, items)
  ok(Object.keys(clean).sort().join() === 'cement,steel' && clean.cement === 400, 'unknown ids and bad values are dropped on the server')
  ok(Object.keys(cleanRates([1, 2], items)).length === 0 && Object.keys(cleanRates('x', items)).length === 0 && Object.keys(cleanRates(null, items)).length === 0, 'a body that is not an object of rates yields none')
  const req = (raw: unknown) => ratesRequest(raw, sets.structopro).kind
  ok(req(undefined) === 'none' && req(null) === 'none' && req({}) === 'empty' && req({ cement: 'x' }) === 'empty' && req({ cement: 400 }) === 'ok', 'a request without rates is the normal report; with only bad rates it is refused')
  ok(ratesRequest({ cement: 400, evil: 1 }, sets.structopro).kind === 'ok', 'a stray id does not stop the valid ones')
}

console.log('The founder-controlled hints')
{
  const ids = new Set(Object.values(sets).flatMap((l) => rateItems(l).items.map((i) => i.id)))
  for (const [id, h] of Object.entries(RATE_HINTS)) {
    ok(ids.has(id), `hint "${id}" is a real rate id`)
    ok(h.low > 0 && h.high >= h.low, `hint "${id}": low ${h.low} <= high ${h.high}`)
    ok(!!hintDate(h.asOf), `hint "${id}" has a real date (${h.asOf})`)
    const age = (Date.now() - Date.parse(h.asOf)) / 86400000
    ok(age >= -1, `hint "${id}" is not dated in the future`)
    if (age > HINT_STALE_DAYS) console.log(`  warn hint "${id}" was checked ${Math.round(age)} days ago (over ${HINT_STALE_DAYS}); recheck it`)
  }
  ok(hintFor('cement', 'bag').text === 'Typical: ₹380–450 a bag (ask your dealer)', 'cement hint reads exactly as SJ wrote it')
  ok(hintFor('cement', 'bag').updated === 'updated 26 Oct 2026', 'the hint carries its date')
  ok(hintFor('steel', 'kg').text === "Ask your dealer for today's rate" && hintFor('steel', 'kg').updated === '', 'an item with no hint shows no number and no date')
  ok(latestHintDate(['cement', 'steel']) === '26 Oct 2026' && latestHintDate(['steel']) === '', 'the "last updated" line follows the hints in use')
  ok(hintFor('brick', '1,000').text === "Ask your dealer for today's rate", 'bricks per 1,000 has no invented hint')
}

console.log('The words on the site')
{
  const ROOT = process.cwd()
  const SKIP = new Set(['node_modules', '.next', '.git', 'v3'])
  const files: string[] = []
  const walk = (d: string) => {
    for (const n of readdirSync(d)) {
      if (SKIP.has(n)) continue
      const p = join(d, n)
      if (statSync(p).isDirectory()) walk(p)
      else if (/\.(ts|tsx|json|md|mdx)$/.test(n)) files.push(p)
    }
  }
  for (const d of ['app', 'components', 'lib', 'messages', 'content', 'public']) { try { walk(join(ROOT, d)) } catch { /* folder not present */ } }
  const live = files.filter((f) => !/\/lib\/rates\//.test(f))
  const hits = (re: RegExp) => live.filter((f) => re.test(readFileSync(f, 'utf8'))).map((f) => relative(ROOT, f))
  const copy = readFileSync(join(ROOT, 'lib/v2/copy.ts'), 'utf8')
  const EN = "Exact quantities. Add your own rates to see the rupees."
  const HI = 'सटीक मात्राएँ। रुपये देखने के लिए अपने रेट जोड़ें।'
  ok(copy.split(`en: '${EN}'`).length === 3 && copy.split(`hi: '${HI}'`).length >= 3, 'homepage line in English and Hindi, both places it appears, is the one SJ gave')
  for (const [why, re] of [
    ['"Quantities only, no rates"', /Quantities only, no rates/],
    ['the old Hindi chip "सिर्फ़ मात्राएँ, कोई रेट नहीं"', /सिर्फ़ मात्राएँ, कोई रेट नहीं/],
    ['"never prices"', /Quantities only, never prices/],
    ['the Hindi "कभी दाम नहीं"', /कभी दाम नहीं/],
    ['the Hindi "न दाम, न मज़दूरी"', /न दाम, न मज़दूरी/],
    ['"leaves prices out on purpose"', /leaves prices out on purpose/],
    ['"carries no labour, material or contractor rates"', /carries no labour, material or contractor rates/],
    ['"give quantities only" (homeowner reports)', /homeowners give quantities only/],
    ['"gives it no prices"', /it gives no prices|and gives no prices/],
  ] as [string, RegExp][]) {
    const h = hits(re)
    ok(h.length === 0, `no live file still says ${why}` + (h.length ? ': ' + h.join(', ') : ''))
  }
  const dc = readFileSync(join(ROOT, 'app/[locale]/disclaimer/page.tsx'), 'utf8')
  ok(dc.includes('Material cost at the rates you entered. Labour, transport and taxes are not included.') && dc.includes('Enter your local rates'), 'the disclaimer explains the panel and quotes the result label')
  ok(/not a quotation/.test(dc) && /do not supply, check or update/.test(dc), 'the disclaimer says the rates are the visitor’s and the figure is not a quotation')
  const faq = readFileSync(join(ROOT, 'lib/faq-data.ts'), 'utf8')
  ok(faq.includes('Can I see the material cost in rupees?') && faq.includes('Enter your local rates'), 'the FAQ answers "can I see the cost in rupees"')
  const bot = readFileSync(join(ROOT, 'lib/chatbox-knowledge.ts'), 'utf8')
  ok(bot.includes('Enter your local rates') && /Never suggest a rate/.test(bot), 'the chat guide knows the panel and is told never to suggest a rate')
  const claude = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8')
  ok(/RUPEES ONLY AT THE CUSTOMER'S OWN RATES/.test(claude) && !/No rupee figure appears in any tool result/.test(claude), 'CLAUDE.md describes the rupee step and no longer says no rupee appears in any result')
}

console.log('The PDF')
{
  const dir = mkdtempSync(join(tmpdir(), 'ns-rates-'))
  const contact: ContactInfo = { name: 'Check Run', email: '', mobile: '', address: '', city: SAMPLE_HOUSE.city, state: SAMPLE_HOUSE.state }
  const where = `${SAMPLE_HOUSE.city}, ${SAMPLE_HOUSE.state}`
  const date = new Date()
  const text = async (el: React.ReactElement, name: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buf = await renderToBuffer(el as any)
    const p = join(dir, `${name}.pdf`)
    writeFileSync(p, buf)
    return execFileSync('pdftotext', ['-layout', p, '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  }
  const RATES: Record<string, Record<string, number>> = {
    structopro: { cement: 400, sand: 60, aggregate: 55, steel: 65, 'binding-wire': 90 },
    masonpro: { brick: 8000, cement: 400, sand: 60 },
    electropro: { 'wire-2.5': 28, 'conduit-pvc-20': 30, rccb: 1400 },
    plumbpro: { 'pipe-cpvc-15': 120, wc: 6500 },
    interiorpro: { 'tile-600x600': 55, 'emulsion-interior-l': 320 },
    grandtotal: { cement: 400, steel: 65, brick: 8000, 'wire-2.5': 28 },
  }
  const build = (name: string, rupees: ReturnType<typeof computeRupees> | null): React.ReactElement => {
    if (name === 'structopro') {
      return React.createElement(StructoProQtyPDF, { report: structure.paid, contact, reportId: 'NS-CHECK', projectName: 'Check', date, where, siteLabel: SITE.flat?.label ?? 'Flat ground', wallLabel: 'Burnt clay brick walls', rupees })
    }
    if (name === 'grandtotal') return React.createElement(GrandTotalQtyPDF, { free: grand.free, paid: grand.paid, contact, reportId: 'NS-CHECK', projectName: 'Check', date, where, rupees })
    const t = trade[name as TradeSlug]
    return React.createElement(QtyReportPDF, { meta: TRADE_META[name as TradeSlug], free: t.free, paid: t.paid, contact, reportId: 'NS-CHECK', projectName: 'Check', date, where, rupees })
  }
  const run = async () => {
    for (const name of Object.keys(sets)) {
      const without = await text(build(name, null), `${name}-plain`)
      const rup = computeRupees(sets[name], RATES[name])
      const withR = await text(build(name, rup), `${name}-rupees`)
      ok(!/rates you entered|In rupees|₹/.test(without), `${name}: the ordinary PDF has no rupee table, no rate and no ₹`)
      ok(/In rupees, at your rates/.test(withR) && /Material cost at the rates you entered\. Labour, transport and taxes are not included\./.test(withR), `${name}: with rates, the table and the exact label are there`)
      const flat = withR.replace(/\s+/g, ' ')
      ok(flat.includes(inr(rup.total).replace(' ', ' ')) || flat.includes(inr(rup.total)), `${name}: the total ${inr(rup.total)} is printed`)
      ok(rup.rows.every((r) => flat.includes(inr(r.amount).replace(' ', ' ')) || flat.includes(inr(r.amount))), `${name}: all ${rup.rows.length} amounts are printed`)
      ok(rup.blank.length === 0 || /No rate given:/.test(withR), `${name}: items without a rate are named`)
    }
  }
  run().then(finish).catch((e) => { console.error(e); process.exit(1) })
}

function finish() {
  console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed')
  process.exit(failed ? 1 : 0)
}
