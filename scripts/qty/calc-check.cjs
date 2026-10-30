#!/usr/bin/env node
// Regression check for the ten free calculators. No network, no writes outside the build folder.
//
//   node scripts/qty/calc-check.cjs
//
// It compiles the calculator engines to /tmp/calc-check-build, then runs each engine on worked
// examples whose answers were done by hand (the hand working is in each engine's header and in
// lib/seo/calc-content.ts, field `source`). Exit code 1 if any figure moves.

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')

const ROOT = path.resolve(__dirname, '..', '..')
const OUT = '/tmp/calc-check-build'

const FILES = [
  'app/[locale]/tools/brick-calculator/brick-engine.ts',
  'app/[locale]/tools/concrete-mix-ratio-calculator/concrete-mix-engine.ts',
  'app/[locale]/tools/water-tank-size-calculator/water-tank-engine.ts',
  'app/[locale]/tools/bar-bending-schedule-calculator/bbs-engine.ts',
  'app/[locale]/tools/concrete-cube-test-calculator/cube-test-engine.ts',
  'app/[locale]/tools/wire-size-calculator/wire-size-engine.ts',
  'app/[locale]/tools/paint-tile-calculator/paint-tile-engine.ts',
  'app/[locale]/tools/daily-wage-pf-esi-calculator/wage-engine.ts',
  'app/[locale]/tools/ra-bill-retention-tds-calculator/ra-bill-engine.ts',
  'app/[locale]/tools/earned-value-calculator/evm-engine.ts',
]

fs.rmSync(OUT, { recursive: true, force: true })
const tsconfig = path.join('/tmp', 'calc-check-tsconfig.json')
fs.writeFileSync(
  tsconfig,
  JSON.stringify({
    compilerOptions: {
      outDir: OUT, rootDir: ROOT, baseUrl: ROOT, paths: { '@/*': ['./*'] },
      module: 'commonjs', target: 'es2020', moduleResolution: 'node', skipLibCheck: true, strict: true,
    },
    files: FILES.map((f) => path.join(ROOT, f)),
  }),
)
try {
  execSync(`npx tsc -p ${tsconfig}`, { cwd: ROOT, stdio: 'pipe' })
} catch (e) {
  console.error('compile failed\n' + String(e.stdout || e.message))
  process.exit(1)
}

// the engines import with the "@/" alias; point it at the compiled copy
const origResolve = Module._resolveFilename
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith('@/')) request = path.join(OUT, request.slice(2))
  return origResolve.call(this, request, ...rest)
}
const load = (f) => require(path.join(OUT, f.replace(/\.ts$/, '.js')))

let pass = 0
const fails = []
function eq(name, actual, expected, tol = 0) {
  const ok = typeof expected === 'number' ? Math.abs(actual - expected) <= tol : actual === expected
  if (ok) pass++
  else fails.push(`${name}: got ${actual}, expected ${expected}${tol ? ` ± ${tol}` : ''}`)
}

// ── Brick ─────────────────────────────────────────────────────────────────────
{
  const { calculate } = load(FILES[0])
  const red = calculate({ lengthM: 10, heightM: 3, kind: 'brick', wall: 'one', openingsAreaM2: 0 })
  eq('brick red one: per m²', red.perM2, 94.12, 0.01)
  eq('brick red one: bricks', red.bricks, 2824)
  eq('brick red one: 5% order', red.orderLow, 2965, 1)
  eq('brick red one: 10% order', red.orderHigh, 3106, 1)
  const mod = calculate({ lengthM: 10, heightM: 3, kind: 'modular', wall: 'one', openingsAreaM2: 0 })
  eq('brick modular one: per m²', mod.perM2, 100, 0.01)
  eq('brick modular one: bricks', mod.bricks, 3000)
  const half = calculate({ lengthM: 10, heightM: 3, kind: 'brick', wall: 'half', openingsAreaM2: 0 })
  eq('brick red half: per m²', half.perM2, 49.02, 0.01)
  eq('brick red half: bricks', half.bricks, 1471)
  const door = calculate({ lengthM: 10, heightM: 3, kind: 'brick', wall: 'one', openingsAreaM2: 1.9 })
  eq('brick door: net area', door.netAreaM2, 28.1, 1e-9)
  eq('brick door: bricks', door.bricks, 2645)
  const all = calculate({ lengthM: 2, heightM: 3, kind: 'brick', wall: 'one', openingsAreaM2: 99 })
  eq('brick openings never exceed the wall', all.netAreaM2, 0)
  eq('brick openings: no bricks', all.bricks, 0)
}

// ── Concrete mix ──────────────────────────────────────────────────────────────
{
  const { calculate } = load(FILES[1])
  const m20 = calculate({ volumeM3: 1, grade: 'M20', exposure: 'mild' })
  eq('mix M20: cement kg', m20.perM3.cementKg, 400, 0.01)
  eq('mix M20: bags', m20.perM3.cementBags, 8, 0.001)
  eq('mix M20: sand m³', m20.perM3.sandM3, 0.425, 0.0005)
  eq('mix M20: aggregate m³', m20.perM3.aggregateM3, 0.85, 0.0005)
  const big = calculate({ volumeM3: 2.5, grade: 'M20', exposure: 'mild' })
  eq('mix 2.5 m³ M20: bags', big.total.cementBags, 20, 0.001)
  eq('mix 2.5 m³ M20: sand m³', big.total.sandM3, 1.0625, 0.0005)
  eq('mix 2.5 m³ M20: aggregate m³', big.total.aggregateM3, 2.125, 0.0005)
  const m25 = calculate({ volumeM3: 1, grade: 'M25', exposure: 'mild' })
  eq('mix M25 mild: cement kg', m25.perM3.cementKg, 411, 1)
  eq('mix M25 mild is a design mix', m25.nominal, false)
  const m25s = calculate({ volumeM3: 1, grade: 'M25', exposure: 'severe' })
  eq('mix M25 severe: cement kg', m25s.perM3.cementKg, 438, 1)
  const m30 = calculate({ volumeM3: 1, grade: 'M30', exposure: 'mild' })
  eq('mix M30 hits the 450 kg ceiling', m30.perM3.cementKg, 450, 0.01)
  eq('mix never above the ceiling', calculate({ volumeM3: 1, grade: 'M40', exposure: 'extreme' }).perM3.cementKg <= 450.0001, true)
}

// ── Water tank ────────────────────────────────────────────────────────────────
{
  const { calculate } = load(FILES[2])
  const t5 = calculate({ people: 5, water: 'municipal' })
  eq('tank 5 municipal: demand', t5.dailyDemandL, 675)
  eq('tank 5 municipal: UGT needed', t5.ugt.neededL, 450)
  eq('tank 5 municipal: UGT each', t5.ugt.each, 500)
  eq('tank 5 municipal: OHT needed', t5.oht.neededL, 225)
  eq('tank 5 municipal: OHT each', t5.oht.each, 500)
  const b5 = calculate({ people: 5, water: 'borewell' })
  eq('tank 5 borewell: demand', b5.dailyDemandL, 750)
  eq('tank 5 borewell: no UGT', b5.ugt, null)
  eq('tank 5 borewell: OHT needed', b5.oht.neededL, 375)
  eq('tank 5 borewell: OHT each', b5.oht.each, 500)
  const k5 = calculate({ people: 5, water: 'tanker' })
  eq('tank 5 tanker: UGT needed', k5.ugt.neededL, 1012.5, 0.5)
  eq('tank 5 tanker: UGT total', k5.ugt.totalL, 1500)
  eq('tank 5 tanker: OHT each', k5.oht.each, 500)
  const m6 = calculate({ people: 6, water: 'municipal' })
  eq('tank 6 municipal: UGT total', m6.ugt.totalL, 1000)
  eq('tank 6 municipal: OHT total', m6.oht.totalL, 500)
  const b8 = calculate({ people: 8, water: 'borewell' })
  eq('tank 8 borewell: demand', b8.dailyDemandL, 1200)
  eq('tank 8 borewell: OHT total', b8.oht.totalL, 1000)
}

// ── Bar bending ───────────────────────────────────────────────────────────────
{
  const { calculate } = load(FILES[3])
  const s = calculate('stirrup', 8, { A: 300, B: 200, C: 0 }, 1)
  eq('bbs stirrup 300×200 8 mm: exact', s.exactMm, 1096, 0.5)
  eq('bbs stirrup 300×200 8 mm: cut', s.cutMm, 1100)
  eq('bbs stirrup 300×200 8 mm: kg', s.weightPerBar, 0.434, 0.001)
  const s2 = calculate('stirrup', 8, { A: 180, B: 300, C: 0 }, 60)
  eq('bbs stirrup 180×300 8 mm: cut', s2.cutMm, 1075)
  eq('bbs 60 stirrups: kg', s2.totalKg, 25.45, 0.05)
  eq('bbs 60 stirrups: buy kg (+5%)', s2.buyKg, 26.72, 0.05)
  const l = calculate('L', 12, { A: 1000, B: 500, C: 0 }, 1)
  eq('bbs L-bar 12 mm: exact', l.exactMm, 1464, 0.5)
  eq('bbs L-bar 12 mm: cut', l.cutMm, 1475)
  const c = calculate('crank', 16, { A: 3000, B: 150, C: 0 }, 1)
  eq('bbs crank 16 mm: exact', c.exactMm, 3042.7, 0.1)
  eq('bbs crank 16 mm: cut', c.cutMm, 3050)
  eq('bbs straight: cut rounds up to 25 mm', calculate('straight', 12, { A: 3010, B: 0, C: 0 }, 1).cutMm, 3025)
}

// ── Cube test ─────────────────────────────────────────────────────────────────
{
  const { samplesForVolume, calculate } = load(FILES[4])
  const table = [[3, 1], [5, 1], [6, 2], [10, 2], [15, 2], [16, 3], [30, 3], [31, 4], [45, 4], [50, 4], [51, 5], [100, 5], [101, 6], [120, 6]]
  for (const [v, n] of table) eq(`cube samples for ${v} m³`, samplesForVolume(v), n)
  const r = calculate(10)
  eq('cube 10 m³: samples', r.samples, 2)
  eq('cube 10 m³: cubes at 28 days', r.cubes28, 6)
  eq('cube 10 m³: with 7-day check', r.cubesWithEarly, 12)
  eq('cube 120 m³: cubes', calculate(120).cubes28, 18)
}

// ── Wire size ─────────────────────────────────────────────────────────────────
{
  const { calculate } = load(FILES[5])
  eq('wire lights', calculate({ choice: 'lights', kw: 0, phase: 'single' }).mm2, 1.5)
  eq('wire sockets 6 A', calculate({ choice: 'sockets6', kw: 0, phase: 'single' }).mm2, 2.5)
  eq('wire sockets 16 A', calculate({ choice: 'sockets16', kw: 0, phase: 'single' }).mm2, 2.5)
  eq('wire heater', calculate({ choice: 'heater', kw: 0, phase: 'single' }).mm2, 2.5)
  eq('wire air conditioner', calculate({ choice: 'ac', kw: 0, phase: 'single' }).mm2, 4)
  eq('wire supply 5 kW', calculate({ choice: 'mains', kw: 5, phase: 'single' }).mm2, 4)
  eq('wire supply 7 kW', calculate({ choice: 'mains', kw: 7, phase: 'single' }).mm2, 6)
  eq('wire supply 10 kW', calculate({ choice: 'mains', kw: 10, phase: 'single' }).mm2, 10)
}

// ── Paint and tile ────────────────────────────────────────────────────────────
{
  const { calculatePaint, calculateTiles } = load(FILES[6])
  const p = calculatePaint({ area: 1, unit: 'm2', tier: 'standard' })
  eq('paint standard putty kg a m²', p.puttyKg, 0.63, 0.0005)
  eq('paint standard primer L a m²', p.primerL, 0.07875, 0.00005)
  eq('paint standard finish L a m²', p.finishL, 0.0945, 0.00005)
  const e = calculatePaint({ area: 1, unit: 'm2', tier: 'economy' })
  eq('paint economy has no putty', e.puttyKg, 0)
  const sq = calculatePaint({ area: 100, unit: 'sqft', tier: 'standard' })
  eq('paint 100 sq ft is 9.2903 m²', sq.m2, 9.2903, 0.0001)
  const t = calculateTiles({ area: 10, unit: 'm2', size: '600x600', lay: 'straight', small: false, where: 'floor', fixing: 'mortar' })
  eq('tile 600×600 2 mm joint: per m²', t.perM2, 2.7596, 0.0005)
  eq('tile straight waste 5%', t.waste, 0.05, 1e-9)
  eq('tile 10 m² pieces', t.pcs, 29)
  const d = calculateTiles({ area: 10, unit: 'm2', size: '600x600', lay: 'diagonal', small: false, where: 'floor', fixing: 'mortar' })
  eq('tile diagonal waste 10%', d.waste, 0.1, 1e-9)
  const sm = calculateTiles({ area: 10, unit: 'm2', size: '600x600', lay: 'straight', small: true, where: 'floor', fixing: 'mortar' })
  eq('tile small room waste 10%', sm.waste, 0.1, 1e-9)
}

// ── Daily wage, PF and ESI ────────────────────────────────────────────────────
{
  const { calculate } = load(FILES[7])
  const w = (dailyWage, payableDays, overtimeHours = 0, advance = 0) => calculate({ dailyWage, payableDays, overtimeHours, advance })
  let r = w(900, 23)
  eq('wage 900×23: basic', r.basicEarned, 20700)
  eq('wage 900×23: PF capped', r.pf, 1800)
  eq('wage 900×23: ESI', r.esi, 155.25, 1e-9)
  eq('wage 900×23: net', r.netPayable, 18744.75, 1e-9)
  r = w(650, 20.5)
  eq('wage 650×20.5: basic', r.basicEarned, 13325)
  eq('wage 650×20.5: PF', r.pf, 1599, 1e-9)
  eq('wage 650×20.5: ESI', r.esi, 99.9375, 1e-9)
  eq('wage 650×20.5: net', r.netPayable, 11626.0625, 1e-9)
  r = w(800, 26, 8)
  eq('wage 800×26 + 8 h overtime: basic', r.basicEarned, 20800)
  eq('wage 800×26 + 8 h overtime: gross', r.grossWages, 22400)
  eq('wage 800×26 + 8 h overtime: PF', r.pf, 1800)
  eq('wage 800×26 + 8 h overtime: ESI on all wages', r.esi, 168, 1e-9)
  eq('wage 800×26 + 8 h overtime: net', r.netPayable, 20432, 1e-9)
  r = w(900, 24)
  eq('wage 900×24: basic above ₹21,000, no ESI', r.esi, 0)
  eq('wage 900×24: status', r.esiStatus, 'above-ceiling')
  r = w(170, 26)
  eq('wage 170×26: average day ₹176 or less, no ESI', r.esi, 0)
  eq('wage 170×26: status', r.esiStatus, 'daily-exempt')
  eq('wage with no days', w(900, 0).netPayable, 0)
  eq('wage ignores a negative input', w(-5, 10).basicEarned, 0)
}

// ── RA bill ───────────────────────────────────────────────────────────────────
{
  const { calculate } = load(FILES[8])
  let r = calculate({ grossBillValue: 1000000, retentionPct: 5, tdsPct: 1, gstPct: 18, advanceRecovery: 0 })
  eq('RA bill ₹10,00,000: retention', r.retention, 50000)
  eq('RA bill ₹10,00,000: GST', r.gst, 180000)
  eq('RA bill ₹10,00,000: TDS on the value without GST', r.tds, 10000)
  eq('RA bill ₹10,00,000: net', r.netPayable, 1120000)
  // the worked reference in the engine header, taken from the Billing & Measurement RA Bill sheet
  r = calculate({ grossBillValue: 178824.5608, retentionPct: 5, tdsPct: 1, gstPct: 18, advanceRecovery: 26823.68412 })
  eq('RA bill header example: retention', r.retention, 8941.23, 0.005)
  eq('RA bill header example: GST', r.gst, 32188.42, 0.005)
  eq('RA bill header example: TDS', r.tds, 1788.25, 0.005)
  eq('RA bill header example: net', r.netPayable, 173459.82, 0.005)
}

// ── Earned value ──────────────────────────────────────────────────────────────
{
  const { calculate } = load(FILES[9])
  let r = calculate({ bac: 1000000, pv: 400000, ev: 350000, ac: 420000 })
  eq('EVM SV', r.sv, -50000)
  eq('EVM CV', r.cv, -70000)
  eq('EVM SPI', r.spi, 0.875, 1e-9)
  eq('EVM CPI', r.cpi, 0.8333, 0.0001)
  eq('EVM EAC', r.eac, 1200000, 1)
  eq('EVM ETC', r.etc, 780000, 1)
  eq('EVM VAC', r.vac, -200000, 1)
  eq('EVM TCPI', r.tcpi, 1.1207, 0.0001)
  r = calculate({ bac: 1000, pv: 0, ev: 0, ac: 0 })
  eq('EVM with no plan: SPI is null', r.spi, null)
  eq('EVM with no spend: CPI is null', r.cpi, null)
  eq('EVM with no CPI: EAC is null', r.eac, null)
}

console.log(`${pass} passed, ${fails.length} failed`)
if (fails.length) {
  for (const f of fails) console.log('  FAIL ' + f)
  process.exit(1)
}
