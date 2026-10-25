// Checks for lib/structopro-qty/quoteCheck.ts. Compile first:
//   rm -rf /tmp/qc-build && npx tsc --outDir /tmp/qc-build --module commonjs --target es2020 --moduleResolution node --skipLibCheck --strict lib/structopro-qty/*.ts
//   node scripts/qty/quote-check.cjs
const assert = require('assert')
const { checkQuote, readQuote, M3_TO_CFT, SQM_TO_SQFT } = require('/tmp/qc-build/quoteCheck.js')
const { runQuantityModel } = require('/tmp/qc-build/model.js')
const { practiceRange } = require('/tmp/qc-build/payload.js')

let pass = 0
const t = (name, fn) => { try { fn(); pass++ } catch (e) { console.error('FAIL', name, '\n  ', e.message); process.exitCode = 1 } }

// a fixed reference so the zone edges are exact
const ref = {
  totals: { concreteM3: 100, steelNetKg: 10000, steelBuyKg: 10500 },
  materials: { cementBags: 500, formworkSqft: 8000 },
  band: { concrete: [0.92, 1.4], steel: [0.9, 1.6], cement: [0.92, 1.4], formwork: [0.85, 1.25] },
  practice: { steelKg: [9000, 20000], concreteM3: [95, 120] },
}
const one = (q) => checkQuote(ref, q)[0]

t('exact report figure is near (all four)', () => {
  const r = checkQuote(ref, { concrete: { value: 100, unit: 'm3' }, steel: { value: 10500, unit: 'kg', basis: 'order' }, cement: { value: 500 }, shuttering: { value: 8000, unit: 'sqft' } })
  assert.deepStrictEqual(r.map(x => x.key), ['concrete', 'steel', 'cement', 'shuttering'])
  assert(r.every(x => x.verdict === 'near'), JSON.stringify(r.map(x => x.verdict)))
  assert(r.every(x => Math.abs(x.pctVsReport) < 1e-9))
})

t('zone edges, concrete (band 92..140, practice top 120)', () => {
  assert.strictEqual(one({ concrete: { value: 91.9, unit: 'm3' } }).verdict, 'below')
  assert.strictEqual(one({ concrete: { value: 92, unit: 'm3' } }).verdict, 'near')
  assert.strictEqual(one({ concrete: { value: 110, unit: 'm3' } }).verdict, 'near')
  assert.strictEqual(one({ concrete: { value: 110.5, unit: 'm3' } }).verdict, 'inside')
  assert.strictEqual(one({ concrete: { value: 140, unit: 'm3' } }).verdict, 'inside') // band top 140 beats practice top 120
  assert.strictEqual(one({ concrete: { value: 141, unit: 'm3' } }).verdict, 'above')
})

t('steel on order basis uses practice range with the waste taken back out', () => {
  // band top = 10500*1.6 = 16800 ; practice top on order basis = 20000*1.05 = 21000 -> top edge 21000
  const a = one({ steel: { value: 21000, unit: 'kg', basis: 'order' } })
  assert.strictEqual(a.verdict, 'inside')
  assert(Math.abs(a.practiceHigh - 21000) < 1e-6)
  assert.strictEqual(one({ steel: { value: 21001, unit: 'kg', basis: 'order' } }).verdict, 'above')
})

t('steel on drawing basis compares bar weight with the net figure', () => {
  const n = one({ steel: { value: 10000, unit: 'kg', basis: 'drawing' } })
  assert.strictEqual(n.verdict, 'near'); assert.strictEqual(n.report, 10000)
  const o = one({ steel: { value: 10000, unit: 'kg', basis: 'order' } })
  assert.strictEqual(o.report, 10500); assert(o.pctVsReport < 0)
  assert.strictEqual(one({ steel: { value: 20000, unit: 'kg', basis: 'drawing' } }).verdict, 'inside')
  assert.strictEqual(one({ steel: { value: 20001, unit: 'kg', basis: 'drawing' } }).verdict, 'above')
  assert(/bar weight/i.test(n.label))
})

t('steel units: 100 quintal = 10 tonne = 10000 kg', () => {
  const a = one({ steel: { value: 100, unit: 'quintal', basis: 'drawing' } })
  const b = one({ steel: { value: 10, unit: 'tonne', basis: 'drawing' } })
  const c = one({ steel: { value: 10000, unit: 'kg', basis: 'drawing' } })
  assert.strictEqual(a.yours, 10000); assert.strictEqual(b.yours, 10000); assert.strictEqual(c.yours, 10000)
})

t('concrete cft and shuttering sqm convert', () => {
  const c = one({ concrete: { value: 100 * M3_TO_CFT, unit: 'cft' } })
  assert(Math.abs(c.yours - 100) < 1e-9); assert.strictEqual(c.verdict, 'near')
  const s = one({ shuttering: { value: 8000 / SQM_TO_SQFT, unit: 'sqm' } })
  assert(Math.abs(s.yours - 8000) < 1e-6); assert.strictEqual(s.verdict, 'near')
})

t('unit slips are caught either way', () => {
  assert.strictEqual(one({ concrete: { value: 100, unit: 'cft' } }).verdict, 'units')      // 100 cft read as 2.8 m3
  assert.strictEqual(one({ concrete: { value: 3531, unit: 'm3' } }).verdict, 'units')      // cft typed as m3
  assert.strictEqual(one({ steel: { value: 10, unit: 'kg', basis: 'order' } }).verdict, 'units')
  assert.strictEqual(one({ cement: { value: 25 } }).verdict, 'units')                       // tonnes typed as bags
  assert.strictEqual(one({ steel: { value: 4, unit: 'kg', basis: 'order' } }).verdict, 'units')
  // exactly 4x is still a normal comparison, past it is a slip
  assert.strictEqual(one({ cement: { value: 2000 } }).verdict, 'above')
  assert.strictEqual(one({ cement: { value: 2001 } }).verdict, 'units')
})

t('cement and shuttering use the band only (no practice range)', () => {
  assert.strictEqual(one({ cement: { value: 700 } }).verdict, 'inside')
  assert.strictEqual(one({ cement: { value: 701 } }).verdict, 'above')
  assert.strictEqual(one({ cement: { value: 459 } }).verdict, 'below')
  assert.strictEqual(one({ shuttering: { value: 10000, unit: 'sqft' } }).verdict, 'inside')
  assert.strictEqual(one({ shuttering: { value: 10001, unit: 'sqft' } }).verdict, 'above')
  assert.strictEqual(one({ shuttering: { value: 6799, unit: 'sqft' } }).verdict, 'below')
  assert.strictEqual(one({ cement: { value: 500 } }).practiceHigh, null)
})

t('works without a practice range', () => {
  const r2 = { ...ref, practice: undefined }
  const r = checkQuote(r2, { concrete: { value: 141, unit: 'm3' } })[0]
  assert.strictEqual(r.verdict, 'above'); assert.strictEqual(r.practiceHigh, null)
})

t('every sentence is quantity-only and careful', () => {
  const all = checkQuote(ref, { concrete: { value: 400, unit: 'm3' }, steel: { value: 5000, unit: 'kg', basis: 'order' }, cement: { value: 520 }, shuttering: { value: 9000, unit: 'sqft' } })
  const more = ['below', 'units', 'above', 'inside', 'near'].flatMap(v => [v])
  const text = all.flatMap(x => [x.label, x.headline, x.advice]).join(' ')
  assert(!/₹|\bRs\b|rupee|lakh|crore|\bper\s+(sq|cft|kg)\b.*₹|overcharg|cheat|fraud|scam|ripped/i.test(text), text)
  assert(more.length === 5)
})

t('readQuote: blanks skipped, commas read, units defaulted', () => {
  const r = readQuote({ concrete: '1,250', concreteUnit: 'cft', steel: '', cement: ' 480 ', shuttering: '900', shutteringUnit: 'sqm' })
  assert(r.ok)
  assert.deepStrictEqual(r.input, { concrete: { value: 1250, unit: 'cft' }, cement: { value: 480 }, shuttering: { value: 900, unit: 'sqm' } })
  const s = readQuote({ steel: '9.5', steelUnit: 'tonne', steelBasis: 'drawing' })
  assert(s.ok); assert.deepStrictEqual(s.input.steel, { value: 9.5, unit: 'tonne', basis: 'drawing' })
  const d = readQuote({ steel: '9500' })
  assert(d.ok); assert.deepStrictEqual(d.input.steel, { value: 9500, unit: 'kg', basis: 'order' })
  const u = readQuote({ concrete: '50', concreteUnit: 'bogus', steelUnit: 'x', steel: '1' })
  assert(u.ok); assert.strictEqual(u.input.concrete.unit, 'm3'); assert.strictEqual(u.input.steel.unit, 'kg')
})

t('readQuote rejects nothing-entered, zero, negative, words, infinity, huge', () => {
  for (const bad of [{}, { concrete: '' }, { concrete: '0' }, { steel: '-5' }, { cement: 'lots' }, { shuttering: 'Infinity' }, { concrete: '1e12' }, { cement: 'NaN' }]) {
    const r = readQuote(bad)
    assert(!r.ok, JSON.stringify(bad))
    assert(typeof r.error === 'string' && r.error.length > 5)
  }
})

// against the real model
const real = runQuantityModel({ floorAreasSqft: [1200, 1200], state: 'Karnataka', city: 'Bengaluru', site: 'flat', wall: 'brick', plotLengthFt: 40, plotWidthFt: 30, terraceAccess: true })
assert(real.ok !== false, 'model ran')
{
  const pr = practiceRange(real)
  const ref2 = { totals: real.totals, materials: real.materials, band: real.band, practice: pr }
  t('real model: its own figures read as near', () => {
    const own = checkQuote(ref2, { concrete: { value: real.totals.concreteM3, unit: 'm3' }, steel: { value: real.totals.steelBuyKg, unit: 'kg', basis: 'order' }, cement: { value: real.materials.cementBags }, shuttering: { value: real.materials.formworkSqft, unit: 'sqft' } })
    assert(own.every(x => x.verdict === 'near'), JSON.stringify(own.map(x => x.verdict)))
  })
  t('real model: double its steel is inside or above, half is below, never a unit slip', () => {
    const dbl = checkQuote(ref2, { steel: { value: real.totals.steelBuyKg * 2, unit: 'kg', basis: 'order' } })[0]
    assert(['inside', 'above'].includes(dbl.verdict), dbl.verdict)
    const half = checkQuote(ref2, { steel: { value: real.totals.steelBuyKg * 0.5, unit: 'kg', basis: 'order' } })[0]
    assert.strictEqual(half.verdict, 'below')
  })
  t('real model: the top of the real-building range is on the same basis as the figure compared', () => {
    const ord = checkQuote(ref2, { steel: { value: 1000, unit: 'kg', basis: 'order' } })[0]
    const drw = checkQuote(ref2, { steel: { value: 1000, unit: 'kg', basis: 'drawing' } })[0]
    assert(Math.abs(drw.practiceHigh - pr.steelKg[1]) < 1e-6)
    assert(Math.abs(ord.practiceHigh / drw.practiceHigh - real.totals.steelBuyKg / real.totals.steelNetKg) < 1e-9)
  })
}

console.log(`quote-check: ${pass} passed${process.exitCode ? ' (with failures)' : ''}`)
