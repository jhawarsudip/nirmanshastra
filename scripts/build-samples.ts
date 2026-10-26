/*
  Builds the free sample reports in /public/samples from the REAL engines and the REAL PDF layouts, for one invented house.
  Run from the repo root:   npx tsx --tsconfig tsconfig.json scripts/build-samples.ts
  It also writes public/samples/manifest.json (the headline figures at the time), which scripts/check-samples.ts compares with
  the engines so a stale sample is caught. Nothing here touches the database or the network.
*/

import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import QtyReportPDF from '../lib/pdf/qty-report-pdf'
import StructoProQtyPDF from '../lib/pdf/structopro-qty-pdf'
import GrandTotalQtyPDF from '../lib/pdf/grand-total-qty-pdf'
import type { ContactInfo } from '../lib/pdf/qty-kit'
import { modelFor } from '../lib/qty/registry'
import { TRADE_META, type TradeSlug } from '../lib/qty/meta'
import { GRAND_META, buildGrand, type PhaseSource } from '../lib/qty/grand'
import { loadPhase, type EstimateRow } from '../lib/qty/grand-server'
import { buildGrandCalcFromRows } from '../lib/qty/grand-calc'
import { runQuantityModel, toPaid, savedInput, type PaidPayload, type QtyInput } from '../lib/structopro-qty'
import { buildStructoCalc } from '../lib/structopro-qty/calc'
import { SITE } from '../lib/structopro-qty/sites'
import type { TradeFree, TradePaid } from '../lib/qty/types'
import type { CalcSheet } from '../lib/calcsheet'
import { SAMPLE_HOUSE, SAMPLES, type SampleKey } from '../lib/samples/catalogue'

const OUT = path.join(process.cwd(), 'public', 'samples')
const TRADES: TradeSlug[] = ['masonpro', 'electropro', 'plumbpro', 'interiorpro']
const WHERE = `${SAMPLE_HOUSE.city}, ${SAMPLE_HOUSE.state}`

const contact: ContactInfo = { name: 'Example house (sample)', email: '', mobile: '', address: '', city: SAMPLE_HOUSE.city, state: SAMPLE_HOUSE.state }
const sample = { house: SAMPLE_HOUSE.describe }

export interface Built { key: SampleKey; buffer: Buffer; figures: Record<string, string>; reportId: string }

type TradeBuilt = { free: TradeFree; paid: TradePaid; calc: CalcSheet | null; input: Record<string, unknown> }

export function structureInput(): QtyInput & { engine: 'qty-v2' } {
  const read = savedInput({ engine: 'qty-v2', floorAreasSqft: SAMPLE_HOUSE.floorAreasSqft, state: SAMPLE_HOUSE.state, city: SAMPLE_HOUSE.city, site: 'flat', wall: 'brick', terraceAccess: true })
  return { engine: 'qty-v2', ...read } as QtyInput & { engine: 'qty-v2' }
}

export function runStructure(): { input: QtyInput & { engine: 'qty-v2' }; paid: PaidPayload } {
  const input = structureInput()
  const run = runQuantityModel(savedInput(input as unknown as Record<string, unknown>))
  if (!run.ok) throw new Error(`StructurePro sample: ${run.error}`)
  return { input, paid: toPaid(run) }
}

export function runTrade(slug: TradeSlug): TradeBuilt {
  const model = modelFor(slug)
  if (!model) throw new Error(`${slug}: no model`)
  const input = { engine: 'trade-v1', tool: slug, floorAreasSqft: SAMPLE_HOUSE.floorAreasSqft, state: SAMPLE_HOUSE.state, city: SAMPLE_HOUSE.city }
  const parsed = model.parse(input)
  if (!parsed.ok) throw new Error(`${slug} sample: ${parsed.error}`)
  const ran = model.run(parsed.input)
  if (!ran.ok) throw new Error(`${slug} sample: ${ran.error}`)
  const { free, paid } = ran.result
  const calc: CalcSheet | null = model.calc ? model.calc(parsed.input, { free, paid }) : null
  return { free, paid, calc, input }
}

const row = (id: string, appType: string, input: unknown, paid: unknown): EstimateRow => ({
  id, app_type: appType, project_name: SAMPLE_HOUSE.projectName, state: SAMPLE_HOUSE.state, city: SAMPLE_HOUSE.city,
  input_data: input, result_data: { paid },
})

export function runGrand() {
  const s = runStructure()
  const rows: EstimateRow[] = [row('sample-structopro', 'structopro', s.input, s.paid)]
  for (const t of TRADES) {
    const b = runTrade(t)
    rows.push(row(`sample-${t}`, TRADE_META[t].appType, b.input, b.paid))
  }
  const srcs: PhaseSource[] = []
  for (const r of rows) {
    const loaded = loadPhase(r)
    if (!loaded.ok) throw new Error(`Grand Total sample: ${loaded.error}`)
    srcs.push(loaded.src)
  }
  const { free, paid } = buildGrand(srcs)
  const calc = buildGrandCalcFromRows(rows, free, paid)
  return { free, paid, calc }
}

/** The headline figures of a sample, as the page prints them. check-samples.ts compares these with the manifest. */
export function figuresOf(key: SampleKey): Record<string, string> {
  if (key === 'structopro') {
    const { paid } = runStructure()
    const f = (n: number, d = 0) => n.toFixed(d)
    return { concreteM3: f(paid.totals.concreteM3, 2), steelBuyKg: f(paid.totals.steelBuyKg), cementBags: f(paid.materials.cementBags), formworkSqft: f(paid.materials.formworkSqft) }
  }
  if (key === 'grandtotal') {
    const { paid } = runGrand()
    return Object.fromEntries(paid.tiles.map(t => [t.k, `${t.v} ${t.unit}`]))
  }
  const { paid } = runTrade(key as TradeSlug)
  return Object.fromEntries(paid.tiles.map(t => [t.k, `${t.v} ${t.unit}`]))
}

async function render(el: React.ReactElement): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(el as any)
}

export async function buildSample(key: SampleKey): Promise<Built> {
  const date = new Date()
  if (key === 'structopro') {
    const { input, paid } = runStructure()
    const reportId = 'NS-SP-SAMPLE'
    const calc = buildStructoCalc(input, paid)
    if (!calc) throw new Error('StructurePro sample: the calculation sheet did not reconcile')
    const buffer = await render(React.createElement(StructoProQtyPDF, {
      calc, report: paid, contact, reportId, projectName: SAMPLE_HOUSE.projectName, date, where: WHERE,
      siteLabel: SITE[input.site ?? 'flat']?.label ?? 'Flat ground',
      wallLabel: input.wall === 'block' ? 'Concrete or AAC block walls' : 'Burnt clay brick walls',
      sample,
    }))
    return { key, buffer, figures: figuresOf(key), reportId }
  }
  if (key === 'grandtotal') {
    const { free, paid, calc } = runGrand()
    if (!calc) throw new Error('Grand Total sample: the calculation sheet did not reconcile')
    const reportId = `NS-${GRAND_META.code}-SAMPLE`
    const buffer = await render(React.createElement(GrandTotalQtyPDF, { free, paid, contact, reportId, projectName: SAMPLE_HOUSE.projectName, date, where: WHERE, calc, sample }))
    return { key, buffer, figures: figuresOf(key), reportId }
  }
  const slug = key as TradeSlug
  const meta = TRADE_META[slug]
  const { free, paid, calc } = runTrade(slug)
  if (!calc) throw new Error(`${meta.label} sample: the calculation sheet did not reconcile`)
  const reportId = `NS-${meta.code}-SAMPLE`
  const buffer = await render(React.createElement(QtyReportPDF, { meta, free, paid, contact, reportId, projectName: SAMPLE_HOUSE.projectName, date, where: WHERE, calc, sample }))
  return { key, buffer, figures: figuresOf(key), reportId }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const manifest: Record<string, unknown> = { house: SAMPLE_HOUSE.describe, generated: new Date().toISOString().slice(0, 10), files: {} }
  const only = process.argv.slice(2).filter(a => a in SAMPLES) as SampleKey[]
  const keys = (only.length ? only : (Object.keys(SAMPLES) as SampleKey[]))
  const files = manifest.files as Record<string, unknown>
  const prev = fs.existsSync(path.join(OUT, 'manifest.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8')) : null
  if (only.length && prev?.files) Object.assign(files, prev.files)
  for (const key of keys) {
    const t0 = Date.now()
    const b = await buildSample(key)
    fs.writeFileSync(path.join(OUT, SAMPLES[key].file), b.buffer)
    files[key] = { file: SAMPLES[key].file, bytes: b.buffer.length, reportId: b.reportId, figures: b.figures }
    console.log(`${key.padEnd(12)} ${(b.buffer.length / 1024).toFixed(0).padStart(6)} KB  ${((Date.now() - t0) / 1000).toFixed(1)} s`)
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
}

if (process.argv[1]?.endsWith('build-samples.ts')) main().catch(e => { console.error(e); process.exit(1) })
