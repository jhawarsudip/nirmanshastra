// Input reader checks: the browser body and a saved estimate must give the model the SAME input,
// so the free summary and the paid report can never disagree. Run after compiling lib/structopro-qty to /tmp/qty-build.
const path = require('path')
const dir = process.env.QTY_BUILD || '/tmp/qty-build'
const { readInput, savedInput } = require(path.join(dir, 'input.js'))
const { runQuantityModel } = require(path.join(dir, 'model.js'))

let pass = 0, fail = 0
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m) } }
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`)

const body = { floorAreasSqft: [900, 900, 900], state: 'Karnataka', city: 'Bengaluru', site: 'flat', wall: 'brick', plotLengthFt: 40, plotWidthFt: 30, terraceAccess: true, stilt: true, balconies: 2, balconyDepthM: 1.5 }
const r = readInput(body)
ok(r.ok, 'valid body reads')
eq(r.input.stilt, true, 'stilt kept')
eq(r.input.balconies, 2, 'balconies kept')
eq(r.input.balconyDepthM, 1.5, 'depth kept')

// saved row = {engine, ...input} as the calculate route stores it
const saved = savedInput({ engine: 'qty-v2', ...r.input })
eq(saved, r.input, 'saved row reads back to the same input')

// the model gives the same numbers from either path
const a = runQuantityModel(r.input), b = runQuantityModel(saved)
ok(a.ok && b.ok, 'both run')
eq(a.totals.concreteM3, b.totals.concreteM3, 'same concrete')
eq(a.totals.steelBuyKg, b.totals.steelBuyKg, 'same steel')

// a house without the new answers stays exactly as before
const plain = readInput({ floorAreasSqft: [800, 800], state: 'Maharashtra', city: 'Pune' })
ok(plain.ok, 'plain reads')
ok(!('stilt' in plain.input) && !('balconies' in plain.input), 'no stilt or balcony keys on a plain house')
eq(savedInput({ engine: 'qty-v2', ...plain.input }), plain.input, 'plain round trip')

// dropping the new fields would change the result (guards against a route that copies fields by hand)
const dropped = runQuantityModel({ ...r.input, stilt: undefined, balconies: undefined, balconyDepthM: undefined })
ok(dropped.ok && dropped.totals.steelBuyKg !== a.totals.steelBuyKg, 'stilt+balcony change the steel, so dropping them would be visible')

// old saved rows (no new keys, no state on the row) fall back to the row's own state and city
const old = savedInput({ engine: 'qty-v2', floorAreasSqft: [700], site: 'flat', wall: 'brick' }, { state: 'Gujarat', city: 'Surat' })
eq([old.state, old.city], ['Gujarat', 'Surat'], 'fallback state and city')

// rejects
const bads = [
  [{ ...body, floorAreasSqft: [] }, 'no floors'],
  [{ ...body, floorAreasSqft: [50] }, 'tiny floor'],
  [{ ...body, state: '' }, 'no state'],
  [{ ...body, site: 'moon' }, 'bad site'],
  [{ ...body, wall: 'glass' }, 'bad wall'],
  [{ ...body, balconies: 5 }, 'five balconies'],
  [{ ...body, balconies: 1.5 }, 'fractional balconies'],
  [{ ...body, balconyDepthM: 2 }, 'bad depth'],
  [{ ...body, plotLengthFt: 5 }, 'tiny plot'],
]
for (const [b2, name] of bads) ok(!readInput(b2).ok, `rejects ${name}`)

// balconies = 0 means none, and the depth is ignored
const zero = readInput({ ...body, balconies: 0, stilt: false })
ok(zero.ok && !('balconies' in zero.input) && !('stilt' in zero.input), 'zero balconies and no stilt are dropped')

console.log(`${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
