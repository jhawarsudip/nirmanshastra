// Runs the quantity model over a matrix of cases and prints per-m2 intensities against the literature band.
// Build first:  npx tsc --outDir /tmp/qty-build --module commonjs --target es2020 --moduleResolution node --skipLibCheck --strict lib/structopro-qty/*.ts
// Run:          node scripts/qty/matrix.cjs
const { runQuantityModel } = require(process.env.QTY_BUILD || '/tmp/qty-build/index.js')

const cases = [
  ['G+0 1000 Pune flat', [1000], 'Maharashtra', 'Pune', 'flat'],
  ['G+0 600 Pune flat', [600], 'Maharashtra', 'Pune', 'flat'],
  ['G+1 2x1000 Pune flat', [1000, 1000], 'Maharashtra', 'Pune', 'flat'],
  ['G+1 2x1500 Pune flat', [1500, 1500], 'Maharashtra', 'Pune', 'flat'],
  ['G+2 3x800 Pune flat', [800, 800, 800], 'Maharashtra', 'Pune', 'flat'],
  ['G+2 3x1200 Delhi (IV)', [1200, 1200, 1200], 'Delhi', 'Delhi', 'flat'],
  ['G+3 4x1000 Delhi (IV)', [1000, 1000, 1000, 1000], 'Delhi', 'Delhi', 'flat'],
  ['G+3 4x1000 Guwahati (V)', [1000, 1000, 1000, 1000], 'Assam', 'Guwahati', 'flat'],
  ['G+3 4x1000 Bengaluru (II)', [1000, 1000, 1000, 1000], 'Karnataka', 'Bengaluru', 'flat'],
  ['G+4 5x1000 Pune flat', [1000, 1000, 1000, 1000, 1000], 'Maharashtra', 'Pune', 'flat'],
  ['G+5 6x1000 Pune flat', [1000, 1000, 1000, 1000, 1000, 1000], 'Maharashtra', 'Pune', 'flat'],
  ['G+1 2x1000 black cotton (raft)', [1000, 1000], 'Maharashtra', 'Nagpur', 'bcs'],
  ['G+1 2x1000 soft marshy (raft)', [1000, 1000], 'West Bengal', 'Kolkata', 'soft_marshy'],
  ['G+1 2x1000 rocky', [1000, 1000], 'Karnataka', 'Bengaluru', 'rocky'],
  ['G+1 2x1000 coastal', [1000, 1000], 'Tamil Nadu', 'Chennai', 'coastal'],
  ['G+2 stepped 1200/1000/600', [1200, 1000, 600], 'Maharashtra', 'Pune', 'flat'],
  ['G+1 plot 30x50 (1500 sqft)', [1500, 1500], 'Maharashtra', 'Pune', 'flat', { plotLengthFt: 50, plotWidthFt: 30 }],
  ['G+1 block walls', [1000, 1000], 'Maharashtra', 'Pune', 'flat', { wall: 'block' }],
]

const bandS = [28, 45]
const bandC = [0.3, 0.42]
const pad = (v, n) => String(v).padEnd(n)
console.log(pad('case', 34) + pad('area', 7) + pad('steel kg/m2', 12) + pad('conc m3/m2', 11) + pad('bags/m2', 8) + pad('form m2/m2', 11) + pad('fnd', 8) + 'notes')
let bad = 0
for (const [name, floors, state, city, site, extra] of cases) {
  const r = runQuantityModel({ floorAreasSqft: floors, state, city, site, ...(extra || {}) })
  if (!r.ok) {
    console.log(pad(name, 34) + 'ERROR ' + r.error)
    bad++
    continue
  }
  const A = r.inputEcho.totalBuiltUpM2
  const s = r.perM2.steelKgPerM2
  const c = r.perM2.concreteM3PerM2
  const flag = (s < bandS[0] || s > bandS[1] ? 'S' : '') + (c < bandC[0] || c > bandC[1] ? 'C' : '')
  if (flag) bad++
  console.log(
    pad(name, 34) + pad(Math.round(A), 7) + pad(s.toFixed(1), 12) + pad(c.toFixed(3), 11) + pad(r.perM2.cementBagsPerM2.toFixed(2), 8) +
      pad((r.totals.formworkM2 / A).toFixed(2), 11) + pad(r.inputEcho.foundation, 8) + (flag ? 'OUT-OF-BAND ' + flag + ' ' : '') + (r.warnings.length ? r.warnings.join(' | ').slice(0, 80) : '')
  )
}
console.log(`\n${bad} case(s) flagged out of ${cases.length}`)
