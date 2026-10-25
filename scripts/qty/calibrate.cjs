// Calibration table: the quantity model against the public real-building evidence found on 25 Oct 2026.
// Build model first:  npx tsc --outDir /tmp/qty-build --module commonjs --target es2020 --moduleResolution node --skipLibCheck --strict lib/structopro-qty/*.ts
// Evidence (all per m2 of total built-up area, all floors):
//   GKSPL 2026 benchmark, 26 real BoQs, low-rise (up to 4 storeys): steel 31-62 kg/m2, concrete 0.36-0.44 m3/m2.
//   GKSPL 2024 Project C (Bengaluru, G+3, 3 dwellings, ~584 m2 derived): 254.4 m3, 24,500 kg -> 0.436 m3/m2, 41.9 kg/m2.
//   Designed frames, Zone III, 2-4 storey (frame only, no stairs/plinth/lintels): 28-33 kg/m2, 0.25-0.27 m3/m2.
//   Steel per m3 concrete: designed 102-139, built BoQs 96-151.
const { runQuantityModel } = require(process.env.QTY_BUILD || '/tmp/qty-build/index.js')
const M2 = 0.09290304
const cases = [
  ['A1-like Bengaluru 4 x 1571 sqft', [1571, 1571, 1571, 1571], 'Karnataka', 'Bengaluru', 'flat'],
  ['Pune G+1 2 x 1000', [1000, 1000], 'Maharashtra', 'Pune', 'flat'],
  ['Pune G+1 2 x 1500', [1500, 1500], 'Maharashtra', 'Pune', 'flat'],
  ['Pune G+2 3 x 1000', [1000, 1000, 1000], 'Maharashtra', 'Pune', 'flat'],
  ['Delhi G+3 4 x 1000', [1000, 1000, 1000, 1000], 'Delhi', 'Delhi', 'flat'],
  ['Bengaluru G+0 1 x 1000', [1000], 'Karnataka', 'Bengaluru', 'flat'],
]
console.log('case'.padEnd(34), 'zone', 'conc m3/m2', 'steel kg/m2', 'kg/m3', 'cement bag/m2')
for (const [name, floors, state, city, site] of cases) {
  const n = runQuantityModel({ floorAreasSqft: floors, state, city, site })
  const A = floors.reduce((s, v) => s + v, 0) * M2
  const conc = n.materials.concreteM3 ?? (n.totals && n.totals.concreteM3)
  const steel = n.materials.steelBuyKg
  console.log(name.padEnd(34), String(n.inputEcho.zone).padEnd(4), (conc / A).toFixed(3).padStart(10), (steel / A).toFixed(1).padStart(11), (steel / conc).toFixed(0).padStart(6), (n.materials.cementBags / A).toFixed(2).padStart(13))
}
